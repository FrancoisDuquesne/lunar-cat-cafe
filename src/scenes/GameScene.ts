import Phaser from 'phaser';
import {
  TILE, GAME_W, GAME_H, MAP_COLS, MAP_ROWS, COLORS, MENU_ITEMS,
  DAY_DURATION_MS, EMPLOYEE_NAMES,
  DECORATION_ITEMS, CAFE_TIERS, DecorationDef, PlacedDecoration,
  TABLE_SLOT_DEFS, TableSlotDef, EMPLOYEE_TYPES, EmployeeRole,
  INTERACTION_REACH, PET_COOLDOWN_MS, BOOKING_COST, MAX_BOOKINGS,
  DECORATION_REFUND_RATIO, MACHINE_DEFS, EXPANSION_ZONES, getDailyRent,
} from '../constants';
import { MenuItemDef, CustomerType, InteractionContext, TableSlot, ShopState, OrderInfo, GameCommand } from '../types';
import { Player } from '../entities/Player';
import { Cat } from '../entities/Cat';
import { Employee } from '../entities/Employee';
import { loadGame, defaultSaveState, saveGame } from '../systems/SaveSystem';
import { Pathfinder } from '../systems/Pathfinder';
import { KitchenSystem, Station } from '../systems/KitchenSystem';
import { CustomerSystem } from '../systems/CustomerSystem';
import { BuildModeSystem } from '../systems/BuildModeSystem';
import { isSoundEnabled } from '../audio';

// ─────────────────────────────────────────────────────────────────────────────
// MAP DEFINITION  —  Compact back-wall kitchen shack
// Tile codes: 0=space/moon, 1=floor, 2=wall, 3=window, 4=counter, 5=door, 6=kitchen
//
// Shack occupies cols 9-20, rows 3-13. Everything else is moon/space exterior.
//   Row 3      : back wall (col 9, 20) + windows (cols 10-19)
//   Row 4      : walls (9,20) + kitchen counter (cols 10-19)
//   Rows 5-6   : walls (9,20) + kitchen interior (cols 10-19)
//   Rows 7-12  : walls (9,20) + dining floor (cols 10-19)
//   Row 13     : front wall with door at cols 14-15
//
// MAP is mutable — expansion zones patch it in create() based on ownedExpansionIds.
// ─────────────────────────────────────────────────────────────────────────────
const BASE_MAP: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 0  space
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 1  space
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 2  space
  [0,0,0,0,0,0,0,0,0,2,3,3,3,3,3,3,3,3,3,3,2,0,0,0,0,0,0,0,0,0], // 3  back wall + windows
  [0,0,0,0,0,0,0,0,0,2,4,4,4,4,4,4,4,4,4,4,2,0,0,0,0,0,0,0,0,0], // 4  kitchen counter
  [0,0,0,0,0,0,0,0,0,2,6,6,6,6,6,6,6,6,6,6,2,0,0,0,0,0,0,0,0,0], // 5  kitchen interior
  [0,0,0,0,0,0,0,0,0,2,6,6,6,6,6,6,6,6,6,6,2,0,0,0,0,0,0,0,0,0], // 6  kitchen interior row 2
  [0,0,0,0,0,0,0,0,0,2,1,1,1,1,1,1,1,1,1,1,2,0,0,0,0,0,0,0,0,0], // 7  dining
  [0,0,0,0,0,0,0,0,0,2,1,1,1,1,1,1,1,1,1,1,2,0,0,0,0,0,0,0,0,0], // 8  dining
  [0,0,0,0,0,0,0,0,0,2,1,1,1,1,1,1,1,1,1,1,2,0,0,0,0,0,0,0,0,0], // 9  dining
  [0,0,0,0,0,0,0,0,0,2,1,1,1,1,1,1,1,1,1,1,2,0,0,0,0,0,0,0,0,0], // 10 dining
  [0,0,0,0,0,0,0,0,0,2,1,1,1,1,1,1,1,1,1,1,2,0,0,0,0,0,0,0,0,0], // 11 dining
  [0,0,0,0,0,0,0,0,0,2,1,1,1,1,1,1,1,1,1,1,2,0,0,0,0,0,0,0,0,0], // 12 dining
  [0,0,0,0,0,0,0,0,0,2,2,2,2,2,5,5,2,2,2,2,2,0,0,0,0,0,0,0,0,0], // 13 front wall + door
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 14 moon exterior
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 15 moon exterior
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 16 moon exterior
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 17 moon exterior
];

// Mutable working map — rebuilt each create() by applying owned expansion patches
let MAP: number[][] = BASE_MAP.map(r => [...r]);

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private cats: Cat[] = [];
  private tables: TableSlot[] = [];
  private employees: Employee[] = [];
  private employeeAssignedIds = new Set<number>();

  private kitchen!: KitchenSystem;
  private customerSys!: CustomerSystem;

  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;
  private furnitureGroup!: Phaser.Physics.Arcade.StaticGroup;

  private money = 150;
  private reputation = 10;
  private day = 1;
  private dayProgress = 0;
  private totalServed = 0;
  private shopState: ShopState = {
    catToys: 0, catTrees: 0, employees: 0,
    placedDecorations: [],
    ownedTableSlotIds: [0, 1, 2],
    cooks: 0, guards: 0, caterers: 0,
    ownedMachines: ['espresso_machine'],
  };

  private interactionPrompt?: Phaser.GameObjects.Container;
  private currentInteraction: InteractionContext = { type: 'none', label: '' };

  private autoSaveTimer = 0;
  private dayPhase: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
  private tutorialHint1?: Phaser.GameObjects.Text;
  private tutorialHint2?: Phaser.GameObjects.Text;
  private tutorialOrderDone = false;
  private tutorialDeliverDone = false;
  private warmGlowGraphic?: Phaser.GameObjects.Graphics;
  private coldTintGraphic?: Phaser.GameObjects.Graphics;
  private moonlightShaftGraphic?: Phaser.GameObjects.Graphics;
  private dayEnded = false;
  private dayEndShown = false;
  private isTransitioningDay = false;

  private uiRefreshTimer = 0;
  private uiDebounceHandle: ReturnType<typeof setTimeout> | null = null;
  private mischievousCooldown = 0;
  private secretIngredientStations = new Set<number>();
  private pendingSecretIngredient = false;
  private crisisTriggered = false;
  private crisisTriggerProgress = 0;
  private crisisBanner?: Phaser.GameObjects.Container;
  private pathfinder!: Pathfinder;
  private customerPathfinder!: Pathfinder;
  private audioCtx: AudioContext | null = null;
  private deliveryArrow?: Phaser.GameObjects.Text;
  private deliveryGlow?: Phaser.GameObjects.Graphics;
  private deliveryGlowTarget = -1;
  private catPetCooldowns = new Map<number, number>();
  private employeeDeliveryIds = new Set<number>();

  // Store / decoration / build mode
  private isStorePanelOpen = false;
  private pendingDecorationDef: DecorationDef | null = null;
  private decorateOverlayText: Phaser.GameObjects.Text | null = null;
  private buildMode!: BuildModeSystem;
  private movingOriginSprite: Phaser.GameObjects.Image | null = null;
  private decorationSprites = new Map<string, Phaser.GameObjects.Image>();
  private occupiedDecoTiles = new Set<string>();
  private hardBlockedTiles = new Set<string>();
  private currentTierLevel = 1;
  private startOfDayExpansionIds: Set<string> = new Set();
  // Placed-table tracking (for removal support)
  private tableFurnitureBodies = new Map<string, Phaser.Physics.Arcade.Image>();
  private tableChairSprites   = new Map<string, Phaser.GameObjects.Image[]>();
  private tableLabels         = new Map<string, Phaser.GameObjects.Text>();

  // Per-day metrics
  private servedToday = 0;
  private revenueToday = 0;
  private popularityHistory: Array<{ day: number; served: number; revenue: number }> = [];

  constructor() { super('GameScene'); }

  create(): void {
    // Reset mutable state
    this.tables = [];
    this.cats = [];
    this.employees = [];
    this.employeeAssignedIds = new Set();
    this.uiRefreshTimer = 0;
    this.dayProgress = 0;
    this.dayEnded = false;
    this.dayEndShown = false;
    this.dayPhase = 'morning';
    this.autoSaveTimer = 0;
    this.warmGlowGraphic = undefined;
    this.coldTintGraphic = undefined;
    this.moonlightShaftGraphic = undefined;
    this.interactionPrompt = undefined;
    this.currentInteraction = { type: 'none', label: '' };
    this.isStorePanelOpen = false;
    this.pendingDecorationDef = null;
    this.decorateOverlayText = null;
    this.movingOriginSprite = null;
    this.decorationSprites = new Map();
    this.occupiedDecoTiles = new Set();
    this.hardBlockedTiles = new Set();
    this.tableFurnitureBodies = new Map();
    this.tableChairSprites = new Map();
    this.tableLabels = new Map();
    this.deliveryArrow = undefined;
    this.catPetCooldowns = new Map();
    this.employeeDeliveryIds = new Set();
    this.servedToday = 0;
    this.revenueToday = 0;
    this.tutorialOrderDone = false;
    this.tutorialDeliverDone = false;
    this.tutorialHint1 = undefined;
    this.tutorialHint2 = undefined;
    this.mischievousCooldown = 0;
    this.secretIngredientStations = new Set();
    this.pendingSecretIngredient = false;
    this.crisisTriggered = false;
    this.crisisTriggerProgress = 0.35 + Math.random() * 0.30;
    this.crisisBanner = undefined;

    const saved = loadGame() ?? defaultSaveState();
    this.money = saved.money;
    this.reputation = saved.reputation;
    this.day = saved.day;
    this.totalServed = saved.totalServed;
    this.popularityHistory = saved.popularityHistory ?? [];
    this.shopState = saved.shop ?? {
      catToys: 0, catTrees: 0, employees: 0,
      placedDecorations: [], ownedTableSlotIds: [0, 1],
      cooks: 0, guards: 0, caterers: 0,
      ownedRecipeIds: ['moon_mocha', 'zerog_latte'],
      dailyMenuIds: ['moon_mocha', 'zerog_latte'],
      ownedMachines: ['espresso_machine'],
      ownedExpansionIds: [],
    };

    // Rebuild MAP from BASE_MAP, then apply owned expansion patches
    MAP = BASE_MAP.map(r => [...r]);
    this.startOfDayExpansionIds = new Set(this.shopState.ownedExpansionIds ?? []);
    for (const zone of EXPANSION_ZONES) {
      if (this.startOfDayExpansionIds.has(zone.id)) {
        for (const patch of zone.patches) {
          MAP[patch.row][patch.col] = patch.tile;
        }
      }
    }

    this.buildMap();
    this.buildFurniture();
    this.buildPathfinder();

    this.kitchen = new KitchenSystem(this, this.shopState, this.wallGroup, this.pathfinder, {
      onUIUpdate: () => this.emitUIUpdate(),
      onChime: () => this.playChime(),
      onCook: () => this.playCook(),
    });
    this.kitchen.build();

    this.buildCatBeds();
    this.buildDecorations();
    this.buildExteriorDecor();
    this.buildHardBlockedTiles();
    this.renderPlacedDecorations();
    this.currentTierLevel = this.getCurrentTier().level;

    this.buildMode = new BuildModeSystem(this);
    this.buildMode.isValidTile = (tx, ty) => this.isValidDecoTile(tx, ty);
    this.buildMode.isBuildableTile = (tx, ty) => { const t = MAP[ty]?.[tx]; return t === 1 || t === 5; };

    this.player = new Player(this, 14 * TILE + TILE / 2, 8 * TILE + TILE / 2);
    this.player.onInteract = () => this.handleInteraction();

    this.physics.add.collider(this.player, this.wallGroup);
    this.physics.add.collider(this.player, this.furnitureGroup);

    this.spawnCats(saved.cats);
    this.spawnEmployees();
    this.spawnPassiveStaff();
    this.kitchen.spawnCooks(this.employees.length);
    this.kitchen.setupSteam();
    this.setupSpaceAmbience();

    this.customerSys = new CustomerSystem(this, this.tables, this.wallGroup, this.customerPathfinder, this.shopState, {
      getEffectiveMenu: () => this.getEffectiveMenu(),
      getCurrentTierLevel: () => this.getCurrentTier().level,
      onBeginLeave: (id) => this.handleCustomerLeaving(id),
      onCustomerGone: (id, happiness) => {
        this.employeeAssignedIds.delete(id);
        this.employeeDeliveryIds.delete(id);
        this.kitchen.unlinkCustomer(id);
        if (happiness < 40) this.reputation = Math.max(0, this.reputation - 1);
        this.emitUIUpdate();
      },
      onBookedGuestArrived: () => {
        this.showFloatingText(GAME_W / 2, GAME_H / 2 - 40, '★ Reserved guest arrived!', '#88CCFF');
        this.playChime();
      },
      onTutorial: () => this.showTutorialHint(),
      onUIUpdate: () => this.emitUIUpdate(),
    });

    this.emitUIUpdate();
    this.cameras.main.setBounds(0, 0, GAME_W, GAME_H);
    this.cameras.main.setZoom(1.8);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.fadeIn(800, 5, 5, 16);
    // Start ambient sounds after a short delay (allows AudioContext to initialise)
    this.time.delayedCall(1200, () => this.startAmbientAudio());

    this.time.addEvent({
      delay: DAY_DURATION_MS,
      callback: this.endDay,
      callbackScope: this,
    });

    this.customerSys.scheduleNextCustomer(this.reputation, this.dayPhase);
    this.customerSys.spawnBookedGuests();

    // When scene wakes from sleep (returning from main menu), refresh the HUD
    this.events.on('wake', () => { this.emitUIUpdate(); }, this);

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      if (this.isStorePanelOpen) { this.closeStorePanel(); }
      else if (this.buildMode.isMoving) { this.cancelMoveDecoration(); }
      else if (this.pendingDecorationDef) { this.cancelPlacement(); }
      else if (this.buildMode.isBuildActive) { this.exitBuildMode(); }
      else { this.goToMenu(); }
    });

    // F key — toggle store panel (S and D are reserved for WASD movement)
    const toggleStore = () => {
      if (this.isStorePanelOpen) { this.closeStorePanel(); }
      else { this.openStorePanel(); }
    };
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F).on('down', toggleStore);

    // B key — toggle build mode
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', () => {
      this.toggleBuildMode();
    });

    // Delete/Backspace — remove hovered decoration while in build mode idle
    const onDelete = () => {
      if (!this.buildMode.isBuildActive || this.buildMode.hasActiveAction) return;
      const ptr = this.input.activePointer;
      const { tileX, tileY } = this.buildMode.getHoveredTile(ptr);
      this.removeDecoInBuildMode(tileX, tileY);
    };
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DELETE).on('down', onDelete);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE).on('down', onDelete);

    this.game.events.on('game_event', (cmd: GameCommand) => {
      if (cmd.type === 'start_placement') {
        const def = DECORATION_ITEMS.find(d => d.id === cmd.defId);
        if (def) {
          if (!this.buildMode.isBuildActive) {
            this.physics.world.pause();
            this.time.paused = true;
            this.buildMode.enter();
            this.game.events.emit('game_event', { type: 'set_build_mode_active', active: true });
          }
          this.pendingDecorationDef = def;
          this.refreshGhostSprite();
        }
      } else if (cmd.type === 'close_store_panel') {
        this.closeStorePanel();
      } else if (cmd.type === 'open_store_panel') {
        this.openStorePanel();
      } else if (cmd.type === 'buy_table') {
        this.handleBuyTable(cmd.slotId);
      } else if (cmd.type === 'hire_staff') {
        this.handleHireStaff(cmd.role);
      } else if (cmd.type === 'buy_machine') {
        this.handleBuyMachine(cmd.machineId);
      } else if (cmd.type === 'buy_recipe') {
        this.handleBuyRecipe(cmd.itemId);
      } else if (cmd.type === 'toggle_daily_recipe') {
        this.handleToggleDailyRecipe(cmd.itemId);
      } else if (cmd.type === 'next_day') {
        this.startNextDay();
      } else if (cmd.type === 'set_bookings') {
        this.handleSetBookings(cmd.delta);
      } else if (cmd.type === 'toggle_build_mode') {
        this.toggleBuildMode();
      } else if (cmd.type === 'buy_expansion') {
        this.handleBuyExpansion(cmd.zoneId);
      } else if (cmd.type === 'fire_staff') {
        this.handleFireStaff(cmd.role);
      }
    }, this);

    this.game.events.on('go_menu', this.goToMenu, this);

    this.input.on('pointerdown', this.handleTap, this);

    this.events.once('shutdown', () => {
      this.game.events.off('go_menu', this.goToMenu, this);
      this.game.events.off('game_event', undefined, this);
      this.input.off('pointerdown', this.handleTap, this);
      this.buildMode.destroy();
      if (this.uiDebounceHandle !== null) {
        clearTimeout(this.uiDebounceHandle);
        this.uiDebounceHandle = null;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // MAP BUILDING
  // ─────────────────────────────────────────────────────────────────────

  private buildMap(): void {
    this.wallGroup = this.physics.add.staticGroup();
    const tier = this.getCurrentTier().level;
    const warmFloor = tier >= 3 ? 'tile_floor' : tier >= 2 ? 'tile_floor_dark' : 'tile_floor_dark';

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tileType = MAP[row][col];
        const wx = col * TILE;
        const wy = row * TILE;
        let texKey = warmFloor;

        switch (tileType) {
          case 0:
            texKey = row <= 2 ? 'tile_space' : 'tile_moon';
            break;
          case 1: texKey = warmFloor; break;
          case 2: texKey = 'tile_wall'; break;
          case 3: texKey = 'tile_window'; break;
          case 4: texKey = 'tile_counter'; break;
          case 5: texKey = warmFloor; break;
          case 6: texKey = 'tile_kitchen'; break;
        }

        const tile = this.add.image(wx + TILE / 2, wy + TILE / 2, texKey);
        tile.setDepth(0);

        if (tileType === 2 || tileType === 4) {
          const body = this.wallGroup.create(wx + TILE / 2, wy + TILE / 2, texKey) as Phaser.Physics.Arcade.Image;
          body.setVisible(false);
          body.refreshBody();
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // FURNITURE — dynamic, driven by ownedTableSlotIds
  // ─────────────────────────────────────────────────────────────────────

  private buildFurniture(): void {
    this.furnitureGroup = this.physics.add.staticGroup();
    const owned = new Set(this.shopState.ownedTableSlotIds ?? [0, 1, 2]);
    const ownedExpansions = new Set(this.shopState.ownedExpansionIds ?? []);
    TABLE_SLOT_DEFS
      .filter(s => owned.has(s.id) && (!s.requiresExpansionId || ownedExpansions.has(s.requiresExpansionId)))
      .forEach(slot => this.buildTableSlot(slot));
  }

  private buildTableSlot(slot: TableSlotDef): void {
    if (slot.type === 'single') {
      const wx = slot.col * TILE + TILE;
      const wy = slot.row * TILE + TILE / 2;

      this.add.sprite(wx, wy, 'obj_table').setOrigin(0.5, 0.8).setDepth(3);
      const tBody = this.furnitureGroup.create(wx, wy, 'obj_table') as Phaser.Physics.Arcade.Image;
      tBody.setVisible(false).setSize(44, 28).setOffset(4, 2);
      tBody.refreshBody();

      this.add.sprite(wx, wy - 26, 'obj_chair').setDepth(2).setFlipY(true);
      this.add.sprite(wx, wy + 26, 'obj_chair').setDepth(4);

      this.tables.push({
        id: slot.id, worldX: wx, worldY: wy,
        seats: [{ seatX: wx, seatY: wy + 22, occupied: false, customerId: null }],
      });
    } else {
      const wx = slot.col * TILE + TILE + 10;
      const wy = slot.row * TILE + TILE / 2;

      this.add.sprite(wx, wy, 'obj_table_group').setOrigin(0.5, 0.8).setDepth(3);
      const tBody = this.furnitureGroup.create(wx, wy, 'obj_table_group') as Phaser.Physics.Arcade.Image;
      tBody.setVisible(false).setSize(68, 28).setOffset(4, 2);
      tBody.refreshBody();

      this.add.sprite(wx - 18, wy - 26, 'obj_chair').setDepth(2).setFlipY(true);
      this.add.sprite(wx + 18, wy - 26, 'obj_chair').setDepth(2).setFlipY(true);
      this.add.sprite(wx - 18, wy + 26, 'obj_chair').setDepth(4);
      this.add.sprite(wx + 18, wy + 26, 'obj_chair').setDepth(4);

      this.tables.push({
        id: slot.id, worldX: wx, worldY: wy,
        seats: [
          { seatX: wx - 18, seatY: wy + 22, occupied: false, customerId: null },
          { seatX: wx + 18, seatY: wy + 22, occupied: false, customerId: null },
        ],
      });
    }
  }

  // Add a table to the live world (called when purchasing from the in-game store)
  private addTableToWorld(slot: TableSlotDef): void {
    this.buildTableSlot(slot);

    // Update pathfinders with new furniture body
    const children = this.furnitureGroup.getChildren();
    const latest = children[children.length - 1] as Phaser.Physics.Arcade.Image;
    const body = latest.body as Phaser.Physics.Arcade.StaticBody;
    if (body) {
      this.blockPath(body.x, body.y, body.width, body.height);
    }

    // Update hard-blocked decoration tiles
    const c = slot.col;
    const r = slot.row;
    if (slot.type === 'single') {
      this.hardBlockedTiles.add(`${c+1},${r}`);
      this.hardBlockedTiles.add(`${c+1},${r-1}`);
      this.hardBlockedTiles.add(`${c+1},${r+1}`);
    } else {
      this.hardBlockedTiles.add(`${c+1},${r}`);
      this.hardBlockedTiles.add(`${c},${r-1}`);   this.hardBlockedTiles.add(`${c+2},${r-1}`);
      this.hardBlockedTiles.add(`${c},${r+1}`);   this.hardBlockedTiles.add(`${c+2},${r+1}`);
    }
  }


  // ─────────────────────────────────────────────────────────────────────
  // CAT BEDS + DECORATIONS
  // ─────────────────────────────────────────────────────────────────────

  private buildCatBeds(): void {
    const bedPositions = [
      { col: 10, row: 11 }, { col: 19, row: 11 },
      { col: 10, row: 8  }, { col: 19, row: 8  },
    ];
    bedPositions.forEach(pos => {
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE/2, 'obj_cat_bed').setDepth(1).setOrigin(0.5, 0.7);
    });
  }

  private buildDecorations(): void {
    const tier = this.getCurrentTier().level;

    // ── Food bowls (always — near the cat beds) ───────────────────
    [{ col: 11, row: 12 }, { col: 18, row: 12 }].forEach(pos => {
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE/2, 'obj_food_bowl').setDepth(2).setOrigin(0.5, 0.7);
    });

    // ── Cat toys / trees (owned items) ───────────────────────────
    const toyPositions = [
      { col: 10, row: 10 }, { col: 19, row: 10 },
      { col: 10, row: 9  }, { col: 19, row: 9  },
    ];
    for (let i = 0; i < Math.min(this.shopState.catToys, toyPositions.length); i++) {
      const pos = toyPositions[i];
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE/2, 'obj_cat_toy').setDepth(3).setOrigin(0.5, 1);
    }
    const treePositions = [{ col: 10, row: 7 }, { col: 19, row: 7 }];
    for (let i = 0; i < Math.min(this.shopState.catTrees, treePositions.length); i++) {
      const pos = treePositions[i];
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE, 'obj_cat_tree').setDepth(3).setOrigin(0.5, 1);
    }

    // ── Plants (tier 3+) ─────────────────────────────────────────
    if (tier >= 3) {
      const plantPositions = [
        { col: 10, row: 12 }, { col: 19, row: 12 },
        { col: 13, row: 7  }, { col: 16, row: 7  },
      ];
      plantPositions.forEach(pos => {
        this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE, 'obj_plant').setDepth(3).setOrigin(0.5, 1);
      });
    }

    // ── Ambient light pools (tier 2+, strengthen at tier 3+) ─────
    if (tier >= 2) {
      const lightAlpha = tier >= 3 ? 0.055 : 0.025;
      const lightGraphics = this.add.graphics().setDepth(0.5).setBlendMode(Phaser.BlendModes.ADD);
      const lightPositions: number[][] = tier >= 3
        ? [
            [11 * TILE, 9 * TILE],  [15 * TILE, 9 * TILE],  [19 * TILE, 9 * TILE],
            [11 * TILE, 12 * TILE], [15 * TILE, 12 * TILE], [19 * TILE, 12 * TILE],
            [15 * TILE, 5.5 * TILE],
          ]
        : [
            [12 * TILE, 10 * TILE], [18 * TILE, 10 * TILE],
            [15 * TILE, 5.5 * TILE],
          ];
      lightPositions.forEach(([lx, ly]) => {
        lightGraphics.fillStyle(0xFF8800, lightAlpha);
        lightGraphics.fillCircle(lx, ly, 56);
      });
    }

  }

  private buildExteriorDecor(): void {
    const tier = this.getCurrentTier().level;

    // ── Earth visible in the sky — positioned at object origin so Phaser culls correctly ──
    {
      const ex = 14 * TILE + TILE / 2, ey = 2 * TILE;
      const earthG = this.add.graphics({ x: ex, y: ey }).setDepth(0.8);
      // Atmosphere glow rings (drawn at 0,0 relative to graphics origin)
      earthG.fillStyle(0x1144BB, 0.28); earthG.fillCircle(0, 0, 58);
      earthG.fillStyle(0x2266CC, 0.38); earthG.fillCircle(0, 0, 44);
      // Ocean base
      earthG.fillStyle(0x1A5A9A, 1);    earthG.fillCircle(0, 0, 34);
      // Land masses
      earthG.fillStyle(0x2E7040, 1);
      earthG.fillEllipse(-12, -8, 24, 18);
      earthG.fillEllipse(10, 6, 18, 14);
      earthG.fillEllipse(-4,  14, 14, 12);
      // Polar ice
      earthG.fillStyle(0xDDEEFF, 0.90); earthG.fillEllipse(0, -26, 20, 12);
      // Clouds
      earthG.fillStyle(0xCCDDEE, 0.70);
      earthG.fillEllipse(-10, -4, 22, 8);
      earthG.fillEllipse(8,  -16, 16, 7);
      earthG.fillEllipse(-2,  18, 14, 6);
      // Rim atmosphere edge
      earthG.fillStyle(0x66AADD, 0.28); earthG.fillCircle(0, 0, 36);
    }

    // ── Distant moon mountain silhouettes at horizon ───────────────
    // Graphics positioned at scene origin to avoid Phaser culling the object when
    // cameraLeft > 0 (Graphics with (x=0,y=0) and zero size gets culled on scroll)
    {
      const horizY = 3 * TILE;
      const mtnG = this.add.graphics({ x: 0, y: horizY }).setDepth(0.7);
      mtnG.fillStyle(0x4A5060, 0.65);
      const lPts = [
        [0, 0], [0, -28], [1*TILE, -18], [2*TILE, -44],
        [3*TILE, -30], [4*TILE, -52], [5*TILE, -36],
        [6*TILE, -22], [7*TILE, -38], [8*TILE, -16],
        [9*TILE, 0], [0, 0],
      ];
      mtnG.fillPoints(lPts.map(([x, y]) => ({ x, y })), true);
      const rPts = [
        [21*TILE, 0], [21*TILE, -14], [22*TILE, -36],
        [23*TILE, -20], [24*TILE, -48], [25*TILE, -32],
        [26*TILE, -44], [27*TILE, -24], [28*TILE, -18],
        [29*TILE, -38], [30*TILE, -20], [30*TILE, 0], [21*TILE, 0],
      ];
      mtnG.fillPoints(rPts.map(([x, y]) => ({ x, y })), true);
      mtnG.lineStyle(1, 0x7080A0, 0.45);
      mtnG.beginPath();
      mtnG.moveTo(0, -28); mtnG.lineTo(1*TILE, -18);
      mtnG.lineTo(2*TILE, -44); mtnG.lineTo(3*TILE, -30);
      mtnG.lineTo(4*TILE, -52); mtnG.lineTo(5*TILE, -36);
      mtnG.lineTo(6*TILE, -22); mtnG.lineTo(7*TILE, -38);
      mtnG.lineTo(8*TILE, -16); mtnG.strokePath();
    }

    // ── Shack structural beam at base of front wall ───────────────
    const domeG = this.add.graphics().setDepth(1.5);
    domeG.fillStyle(0x5A6878, 1);
    domeG.fillRect(9 * TILE, 13 * TILE + TILE - 3, 11 * TILE, 3);
    domeG.fillStyle(COLORS.DOME_GLASS, 0.10);
    domeG.fillRect(9 * TILE, 13 * TILE + TILE, 11 * TILE, 5);
    domeG.fillStyle(0x8898A8, 0.5);
    domeG.fillRect(9 * TILE, 13 * TILE + TILE - 3, 11 * TILE, 1);

    // ── Airlock entrance framing ──────────────────────────────────
    {
      const dX = 14 * TILE;
      const dW = 2 * TILE;
      const dY = 13 * TILE + TILE - 3;
      const airG = this.add.graphics().setDepth(2.2);
      for (let s = 0; s < dW; s += 8) {
        airG.fillStyle(s % 16 < 8 ? 0xEEBB00 : 0x181818, 0.88);
        airG.fillRect(dX + s, dY, 8, 4);
      }
      airG.lineStyle(3, 0x4A5868, 1);
      airG.strokeRect(dX - 2, dY - 2, dW + 4, 6);
      airG.fillStyle(0xFF2200, 1); airG.fillCircle(dX - 5, dY + 7, 3);
      airG.fillStyle(0xFF2200, 1); airG.fillCircle(dX + dW + 5, dY + 7, 3);
      const airGlow = this.add.graphics().setDepth(2.1).setBlendMode(Phaser.BlendModes.ADD);
      airGlow.fillStyle(0xFF1100, 0.22); airGlow.fillCircle(dX - 5, dY + 7, 7);
      airGlow.fillStyle(0xFF1100, 0.22); airGlow.fillCircle(dX + dW + 5, dY + 7, 7);
      this.add.text(dX + dW / 2, dY - 4, '▶ AIRLOCK ◀', {
        fontSize: '7px', fontFamily: 'monospace', fontStyle: 'bold',
        color: '#EEBB00', stroke: '#101010', strokeThickness: 2,
      } as Phaser.Types.GameObjects.Text.TextStyle).setDepth(3).setOrigin(0.5, 1);
    }

    // ── Craters on the moon exterior ─────────────────────────────
    const craterG = this.add.graphics().setDepth(0.5);
    const craters = [
      // Below shack (rows 14-17)
      [11 * TILE + 8,  15 * TILE + 8,  8],
      [20 * TILE - 8,  16 * TILE + 4,  11],
      [14 * TILE,      17 * TILE + 8,  7],
      [18 * TILE + 4,  17 * TILE + 4,  9],
      // Left side exterior
      [5  * TILE + 8,  6  * TILE + 8,  12],
      [7  * TILE,      10 * TILE + 12, 8],
      [3  * TILE + 12, 12 * TILE + 6,  10],
      // Right side exterior
      [24 * TILE + 4,  5  * TILE + 12, 9],
      [26 * TILE,      9  * TILE + 8,  13],
      [22 * TILE + 8,  12 * TILE + 4,  7],
      // Far exterior
      [4  * TILE,      15 * TILE + 12, 15],
      [26 * TILE + 8,  15 * TILE + 8,  10],
    ];
    craters.forEach(([cx, cy, r]) => {
      craterG.fillStyle(COLORS.MOON_DARK, 0.9);   craterG.fillCircle(cx, cy, r);
      craterG.fillStyle(COLORS.MOON_LIGHT, 0.55); craterG.fillCircle(cx - r * 0.35, cy - r * 0.35, r * 0.45);
    });

    // ── Rover track path from far left to door ────────────────────
    const trackG = this.add.graphics().setDepth(0.6).setAlpha(0.35);
    trackG.lineStyle(5, COLORS.MOON_DARK, 1);
    trackG.beginPath();
    trackG.moveTo(0, 16 * TILE);
    trackG.lineTo(9 * TILE, 15 * TILE);
    trackG.lineTo(14 * TILE + TILE / 2, 14 * TILE + TILE / 2);
    trackG.strokePath();
    // Tyre tread marks (dashed parallel lines)
    trackG.lineStyle(2, COLORS.MOON_DARK, 0.8);
    for (let t = 0; t < 10; t++) {
      const tx = t * TILE * 0.9;
      const ty = 16 * TILE - t * TILE * 0.12;
      trackG.beginPath();
      trackG.moveTo(tx, ty - 3);
      trackG.lineTo(tx + 10, ty - 3);
      trackG.moveTo(tx, ty + 3);
      trackG.lineTo(tx + 10, ty + 3);
      trackG.strokePath();
    }

    // ── Footprints near door ──────────────────────────────────────
    const footG = this.add.graphics().setDepth(1).setAlpha(0.50);
    footG.fillStyle(COLORS.MOON_DARK, 1);
    for (let i = 0; i < 8; i++) {
      const fx = 15 * TILE + (i % 2 === 0 ? -7 : 7);
      const fy = 14 * TILE + 10 + i * 11;
      footG.fillEllipse(fx, fy, 8, 5);
    }

    // ── Scattered rocks (always) ──────────────────────────────────
    [
      { col: 2,  row: 14, big: true  },
      { col: 27, row: 15, big: true  },
      { col: 6,  row: 15, big: false },
      { col: 23, row: 14, big: false },
      { col: 1,  row: 8,  big: false },
      { col: 28, row: 7,  big: false },
      { col: 4,  row: 11, big: false },
      { col: 25, row: 10, big: false },
    ].forEach(r => {
      this.add.sprite(r.col * TILE + TILE/2, r.row * TILE + TILE/2, r.big ? 'obj_moon_rock_lg' : 'obj_moon_rock_sm')
        .setDepth(2).setOrigin(0.5, 0.8);
    });

    // ── Tier 2+: flag + antenna ───────────────────────────────────
    if (tier >= 2) {
      this.add.sprite(7 * TILE + TILE/2, 14 * TILE, 'obj_moon_flag').setDepth(3).setOrigin(0.5, 1);
      this.add.sprite(23 * TILE + TILE/2, 14 * TILE, 'obj_antenna').setDepth(3).setOrigin(0.5, 1);
    }

    // ── Tier 3+: cargo crates, rover ─────────────────────────────
    if (tier >= 3) {
      this.add.sprite(3 * TILE,       16 * TILE + 4, 'obj_cargo_crate').setDepth(2).setOrigin(0.5, 0.8);
      this.add.sprite(3 * TILE + 4,   15 * TILE + 8, 'obj_cargo_crate').setDepth(2).setOrigin(0.5, 0.8);
      this.add.sprite(25 * TILE + 8,  16 * TILE,     'obj_cargo_crate').setDepth(2).setOrigin(0.5, 0.8);
      this.add.sprite(22 * TILE, 15 * TILE + 4, 'obj_lunar_rover').setDepth(3).setOrigin(0.5, 1);
    }

    // ── Tier 4+: solar panels, queue rope ────────────────────────
    if (tier >= 4) {
      this.add.sprite(7  * TILE, 16 * TILE + 8, 'obj_solar_panel').setDepth(2).setOrigin(0.5, 0.8);
      this.add.sprite(23 * TILE, 16 * TILE + 8, 'obj_solar_panel').setDepth(2).setOrigin(0.5, 0.8);

      this.add.sprite(12.5 * TILE, 14.3 * TILE, 'obj_queue_pole').setDepth(3).setOrigin(0.5, 1);
      this.add.sprite(17.5 * TILE, 14.3 * TILE, 'obj_queue_pole').setDepth(3).setOrigin(0.5, 1);
      const ropeG = this.add.graphics().setDepth(2.5);
      ropeG.lineStyle(2, 0xAA2233, 0.85);
      ropeG.beginPath();
      ropeG.moveTo(12.5 * TILE, 13.8 * TILE);
      ropeG.lineTo(15 * TILE, 14.1 * TILE);
      ropeG.lineTo(17.5 * TILE, 13.8 * TILE);
      ropeG.strokePath();
    }

    // ── Tier 5+: dome entrance glow ───────────────────────────────
    if (tier >= 5) {
      const domeGlow = this.add.graphics().setDepth(0.6).setBlendMode(Phaser.BlendModes.ADD);
      domeGlow.fillStyle(0x4488FF, 0.08);
      domeGlow.fillCircle(15 * TILE, 13 * TILE, 80);
      domeGlow.fillStyle(0x88CCFF, 0.04);
      domeGlow.fillCircle(15 * TILE, 13 * TILE, 140);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // DECORATION / PLACEMENT SYSTEM
  // ─────────────────────────────────────────────────────────────────────

  private buildHardBlockedTiles(): void {
    // Mark tiles under owned furniture as decoration-blocked
    const owned = new Set(this.shopState.ownedTableSlotIds ?? [0, 1, 2]);
    const ownedExpansions = new Set(this.shopState.ownedExpansionIds ?? []);
    TABLE_SLOT_DEFS
      .filter(s => owned.has(s.id) && (!s.requiresExpansionId || ownedExpansions.has(s.requiresExpansionId)))
      .forEach(slot => {
      const c = slot.col;
      const r = slot.row;
      if (slot.type === 'single') {
        this.hardBlockedTiles.add(`${c+1},${r}`);
        this.hardBlockedTiles.add(`${c+1},${r-1}`);
        this.hardBlockedTiles.add(`${c+1},${r+1}`);
      } else {
        this.hardBlockedTiles.add(`${c+1},${r}`);
        this.hardBlockedTiles.add(`${c},${r-1}`);   this.hardBlockedTiles.add(`${c+2},${r-1}`);
        this.hardBlockedTiles.add(`${c},${r+1}`);   this.hardBlockedTiles.add(`${c+2},${r+1}`);
      }
    });
    [[10,11],[19,11],[10,8],[19,8]].forEach(([c,r]) => this.hardBlockedTiles.add(`${c},${r}`));
  }

  private renderPlacedDecorations(): void {
    this.occupiedDecoTiles.clear();
    this.decorationSprites.clear();
    const decors = this.shopState.placedDecorations ?? [];
    for (const pd of decors) {
      const def = DECORATION_ITEMS.find(d => d.id === pd.defId);
      if (!def) continue;
      const wx = pd.tileX * TILE + TILE / 2;
      const wy = pd.tileY * TILE + TILE / 2;
      if (def.seats) {
        this.placeTableVisuals(def, pd.tileX, pd.tileY, wx, wy, false);
      } else {
        const spr = this.add.image(wx, wy, def.spriteKey).setDepth(3.5 + wy / 10000);
        this.decorationSprites.set(`${pd.tileX},${pd.tileY}`, spr);
      }
      this.occupiedDecoTiles.add(`${pd.tileX},${pd.tileY}`);
    }
  }

  private placeTableVisuals(
    def: DecorationDef, tileX: number, tileY: number,
    wx: number, wy: number, animate: boolean,
  ): void {
    // ── Bar stool ─────────────────────────────────────────────────
    if (def.id === 'bar_stool') {
      const spr = this.add.image(wx, wy, 'obj_bar_stool').setOrigin(0.5, 0.85).setDepth(3 + wy / 10000);
      if (animate) { spr.setAlpha(0); this.tweens.add({ targets: spr, alpha: 1, duration: 250 }); }
      this.decorationSprites.set(`${tileX},${tileY}`, spr);

      const tBody = this.furnitureGroup.create(wx, wy, 'obj_bar_stool') as Phaser.Physics.Arcade.Image;
      tBody.setVisible(false).setSize(16, 16).setOffset(2, 8).refreshBody();
      this.tableFurnitureBodies.set(`${tileX},${tileY}`, tBody);

      const body = tBody.body as Phaser.Physics.Arcade.StaticBody;
      if (body) {
        this.blockPath(body.x, body.y, body.width, body.height);
      }

      const tableId = 100 + this.tables.filter(t => t.id >= 100).length;
      this.tables.push({ id: tableId, worldX: wx, worldY: wy,
        seats: [{ seatX: wx, seatY: wy, occupied: false, customerId: null }] });

      this.hardBlockedTiles.add(`${tileX},${tileY}`);
      return;
    }

    const isGroup = def.id === 'table_group';
    const bW = isGroup ? 68 : 44;

    // Main table image
    const spr = this.add.image(wx, wy, def.spriteKey)
      .setOrigin(0.5, 0.8)
      .setDepth(3 + wy / 10000);
    if (animate) { spr.setAlpha(0); this.tweens.add({ targets: spr, alpha: 1, duration: 250 }); }
    this.decorationSprites.set(`${tileX},${tileY}`, spr);

    // Physics body for collision
    const tBody = this.furnitureGroup.create(wx, wy, def.spriteKey) as Phaser.Physics.Arcade.Image;
    tBody.setVisible(false).setSize(bW, 28).setOffset(4, 2).refreshBody();
    this.tableFurnitureBodies.set(`${tileX},${tileY}`, tBody);

    // Update pathfinders
    const body = tBody.body as Phaser.Physics.Arcade.StaticBody;
    if (body) {
      this.blockPath(body.x, body.y, body.width, body.height);
    }

    // Chairs
    const chairs: Phaser.GameObjects.Image[] = [];
    if (isGroup) {
      chairs.push(this.add.image(wx - 18, wy - 26, 'obj_chair').setDepth(2).setFlipY(true));
      chairs.push(this.add.image(wx + 18, wy - 26, 'obj_chair').setDepth(2).setFlipY(true));
      chairs.push(this.add.image(wx - 18, wy + 26, 'obj_chair').setDepth(4));
      chairs.push(this.add.image(wx + 18, wy + 26, 'obj_chair').setDepth(4));
    } else {
      chairs.push(this.add.image(wx, wy - 26, 'obj_chair').setDepth(2).setFlipY(true));
      chairs.push(this.add.image(wx, wy + 26, 'obj_chair').setDepth(4));
    }
    if (animate) chairs.forEach(c => { c.setAlpha(0); this.tweens.add({ targets: c, alpha: 1, duration: 350 }); });
    this.tableChairSprites.set(`${tileX},${tileY}`, chairs);

    // Register TableSlot — IDs 100+ to avoid conflict with TABLE_SLOT_DEFS (0–11)
    const tableId = 100 + this.tables.filter(t => t.id >= 100).length;
    const seats = isGroup
      ? [
          { seatX: wx - 18, seatY: wy + 22, occupied: false, customerId: null },
          { seatX: wx + 18, seatY: wy + 22, occupied: false, customerId: null },
        ]
      : [{ seatX: wx, seatY: wy + 22, occupied: false, customerId: null }];
    this.tables.push({ id: tableId, worldX: wx, worldY: wy, seats });

    this.hardBlockedTiles.add(`${tileX},${tileY}`);
  }

  computeAmbiance(): number {
    return (this.shopState.placedDecorations ?? []).reduce((sum, pd) => {
      const def = DECORATION_ITEMS.find(d => d.id === pd.defId);
      return sum + (def?.ambianceValue ?? 0);
    }, 0);
  }

  getCurrentTier() {
    const ambiance = this.computeAmbiance();
    let tier = CAFE_TIERS[0];
    for (const t of CAFE_TIERS) {
      if (ambiance >= t.ambianceRequired) tier = t;
    }
    return tier;
  }

  getEffectiveMenu(): MenuItemDef[] {
    const tier = this.getCurrentTier();
    const daily = new Set(this.shopState.dailyMenuIds ?? this.shopState.ownedRecipeIds ?? ['moon_mocha', 'zerog_latte']);
    const ownedMachines = new Set(this.shopState.ownedMachines ?? ['espresso_machine']);
    return (MENU_ITEMS as readonly MenuItemDef[])
      .filter(item =>
        daily.has(item.id as string)
        && tier.unlockedMenuIds.includes(item.id as any)
        && item.machines.every(m => ownedMachines.has(m)),
      )
      .map(item => ({ ...item, price: Math.round(item.price * tier.priceMultiplier) }));
  }

  private handleCustomerLeaving(customerId: number): void {
    this.kitchen.unlinkCustomer(customerId);
    this.employeeAssignedIds.delete(customerId);
    this.employeeDeliveryIds.delete(customerId);
  }

  private isValidDecoTile(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileY < 0 || tileX >= MAP_COLS || tileY >= MAP_ROWS) return false;
    const key = `${tileX},${tileY}`;
    return MAP[tileY]?.[tileX] === 1
      && !this.hardBlockedTiles.has(key)
      && !this.occupiedDecoTiles.has(key);
  }

  private openStorePanel(): void {
    if (this.isStorePanelOpen) return;
    this.isStorePanelOpen = true;
    // Freeze all physics bodies and the day timer
    this.customerSys.customers.forEach(c => (c.body as Phaser.Physics.Arcade.Body)?.setVelocity(0, 0));
    this.employees.forEach(e => (e.body as Phaser.Physics.Arcade.Body)?.setVelocity(0, 0));
    this.cats.forEach(cat => (cat.body as Phaser.Physics.Arcade.Body)?.setVelocity(0, 0));
    (this.player.body as Phaser.Physics.Arcade.Body)?.setVelocity(0, 0);
    this.physics.world.pause();
    this.time.paused = true;

    this.decorateOverlayText = this.add.text(GAME_W / 2, 78, 'STORE  —  F or ESC to close', {
      fontSize: '13px', color: '#FFD700', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(105).setAlpha(0);
    this.tweens.add({ targets: this.decorateOverlayText, alpha: 1, duration: 300 });
  }

  private closeStorePanel(): void {
    if (!this.isStorePanelOpen) return;
    this.isStorePanelOpen = false;
    this.pendingDecorationDef = null;
    this.buildMode.destroyGhost();
    this.decorateOverlayText?.destroy(); this.decorateOverlayText = null;
    if (!this.buildMode.isBuildActive) {
      this.physics.world.resume();
      this.time.paused = false;
    }
  }

  private refreshGhostSprite(): void {
    this.buildMode.destroyGhost();
    this.decorateOverlayText?.destroy(); this.decorateOverlayText = null;
    if (!this.pendingDecorationDef) return;
    this.buildMode.showGhostForPlacing(this.pendingDecorationDef.spriteKey);
    this.decorateOverlayText = this.add.text(GAME_W / 2, 78, 'Click floor to place  ·  ESC or right-click to cancel', {
      fontSize: '13px', color: '#FFD700', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(105).setAlpha(0);
    this.tweens.add({ targets: this.decorateOverlayText, alpha: 1, duration: 300 });
  }

  private handleDecorateClick(worldX: number, worldY: number): void {
    const tileX = Math.floor(worldX / TILE);
    const tileY = Math.floor(worldY / TILE);

    if (this.pendingDecorationDef) {
      if (!this.isValidDecoTile(tileX, tileY)) {
        this.showFloatingText(worldX, worldY - 16, "Can't place here", '#FF6666');
        return;
      }
      const def = this.pendingDecorationDef;
      if (this.money < def.cost) {
        this.showFloatingText(worldX, worldY - 16, 'Not enough ✦', '#FF6666');
        return;
      }
      this.money -= def.cost;
      const pd: PlacedDecoration = { instanceId: this.genDecoInstanceId(), defId: def.id, tileX, tileY };
      if (!this.shopState.placedDecorations) this.shopState.placedDecorations = [];
      this.shopState.placedDecorations.push(pd);
      this.occupiedDecoTiles.add(`${tileX},${tileY}`);
      const wx = tileX * TILE + TILE / 2;
      const wy = tileY * TILE + TILE / 2;

      if (def.seats) {
        this.placeTableVisuals(def, tileX, tileY, wx, wy, true);
        this.showFloatingText(wx, wy - 20, `+${def.seats} seat${def.seats > 1 ? 's' : ''} added!`, '#AAFFAA');
      } else {
        const spr = this.add.image(wx, wy, def.spriteKey).setDepth(3.5 + wy / 10000).setAlpha(0);
        this.tweens.add({ targets: spr, alpha: 1, duration: 250 });
        this.decorationSprites.set(`${tileX},${tileY}`, spr);
        this.showFloatingText(wx, wy - 20, `+${def.ambianceValue} ✦ ambiance`, '#FFDD44');
      }
      this.showFloatingText(wx, wy + 4, `-${def.cost} ✦`, '#FF8888');
      this.playChime();
      this.checkTierUp();
      this.saveCurrentState();
      this.emitUIUpdate();
      if (this.buildMode.isBuildActive) this.buildMode.refreshValidityMap();
    } else {
      this.removeDecoAtTile(tileX, tileY);
    }
  }

  private removeDecoAtTile(tileX: number, tileY: number): void {
    const key = `${tileX},${tileY}`;
    if (!this.occupiedDecoTiles.has(key)) return;

    const idx = (this.shopState.placedDecorations ?? []).findIndex(p => p.tileX === tileX && p.tileY === tileY);
    if (idx === -1) return;
    const pd = this.shopState.placedDecorations[idx];
    const def = DECORATION_ITEMS.find(d => d.id === pd.defId);

    if (def?.seats) {
      const tx = pd.tileX * TILE + TILE / 2;
      const ty = pd.tileY * TILE + TILE / 2;
      const tableSlot = this.tables.find(t => t.worldX === tx && t.worldY === ty && t.id >= 100);
      if (tableSlot?.seats.some(s => s.customerId !== null)) {
        this.showFloatingText(tileX * TILE + TILE/2, tileY * TILE, 'Someone is seated!', '#FF6666');
        return;
      }
      if (tableSlot) this.tables.splice(this.tables.indexOf(tableSlot), 1);
      const tBody = this.tableFurnitureBodies.get(key);
      if (tBody) {
        const body = tBody.body as Phaser.Physics.Arcade.StaticBody;
        if (body) {
          this.unblockPath(body.x, body.y, body.width, body.height);
        }
        this.furnitureGroup.remove(tBody, true, true);
        this.tableFurnitureBodies.delete(key);
      }
      this.tableChairSprites.get(key)?.forEach(c => c.destroy());
      this.tableChairSprites.delete(key);
      this.tableLabels.get(key)?.destroy();
      this.tableLabels.delete(key);
    }

    const refund = def ? Math.floor(def.cost * DECORATION_REFUND_RATIO) : 0;
    this.shopState.placedDecorations.splice(idx, 1);
    this.occupiedDecoTiles.delete(key);
    this.hardBlockedTiles.delete(key);
    this.decorationSprites.get(key)?.destroy();
    this.decorationSprites.delete(key);
    this.money += refund;
    this.showFloatingText(tileX * TILE + TILE/2, tileY * TILE, `Sold! +${refund} ✦`, '#AAFFAA');
    this.playPop();
    this.emitUIUpdate();
    if (this.buildMode.isBuildActive) this.buildMode.refreshValidityMap();
  }

  // ─────────────────────────────────────────────────────────────────────
  // BUILD MODE
  // ─────────────────────────────────────────────────────────────────────

  private genDecoInstanceId(): string {
    return `deco_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  }

  private toggleBuildMode(): void {
    if (this.buildMode.isBuildActive) this.exitBuildMode();
    else this.enterBuildMode();
  }

  private enterBuildMode(): void {
    if (this.buildMode.isBuildActive) return;
    // Close store if open — build mode and store panel are mutually exclusive
    if (this.isStorePanelOpen) {
      this.closeStorePanel();
    } else {
      this.physics.world.pause();
      this.time.paused = true;
    }
    this.buildMode.enter();
    this.decorateOverlayText?.destroy();
    this.decorateOverlayText = this.add.text(
      GAME_W / 2, 78,
      'BUILD MODE  ·  Click object to move  ·  Del to remove  ·  B or ESC to exit',
      { fontSize: '12px', color: '#88FFAA', fontFamily: 'monospace', stroke: '#000000', strokeThickness: 3 },
    ).setOrigin(0.5, 0).setDepth(105).setAlpha(0);
    this.tweens.add({ targets: this.decorateOverlayText, alpha: 1, duration: 300 });
    this.game.events.emit('game_event', { type: 'set_build_mode_active', active: true });
  }

  private exitBuildMode(): void {
    if (!this.buildMode.isBuildActive) return;
    if (this.buildMode.isMoving) this.cancelMoveDecoration();
    if (this.pendingDecorationDef) this.cancelPlacement();
    this.buildMode.exit();
    this.decorateOverlayText?.destroy(); this.decorateOverlayText = null;
    if (!this.isStorePanelOpen) {
      this.physics.world.resume();
      this.time.paused = false;
    }
    this.game.events.emit('game_event', { type: 'set_build_mode_active', active: false });
  }

  private cancelPlacement(): void {
    this.pendingDecorationDef = null;
    this.buildMode.destroyGhost();
    this.decorateOverlayText?.destroy(); this.decorateOverlayText = null;
    if (this.buildMode.isBuildActive) {
      this.decorateOverlayText = this.add.text(
        GAME_W / 2, 78,
        'BUILD MODE  ·  Click object to move  ·  Del to remove  ·  B or ESC to exit',
        { fontSize: '12px', color: '#88FFAA', fontFamily: 'monospace', stroke: '#000000', strokeThickness: 3 },
      ).setOrigin(0.5, 0).setDepth(105).setAlpha(0);
      this.tweens.add({ targets: this.decorateOverlayText, alpha: 1, duration: 300 });
    }
  }

  private handleBuildModeClick(worldX: number, worldY: number): void {
    const tileX = Math.floor(worldX / TILE);
    const tileY = Math.floor(worldY / TILE);

    if (this.buildMode.isPlacing) {
      // Placing a new decoration from store while in build mode
      this.handleDecorateClick(worldX, worldY);
      return;
    }

    if (this.buildMode.isMoving) {
      // Confirm the move to this tile
      if (!this.isValidDecoTile(tileX, tileY)) {
        this.showFloatingText(worldX, worldY - 16, "Can't place here", '#FF6666');
        return;
      }
      this.confirmMoveDecoration(tileX, tileY);
      return;
    }

    // Idle — try to select a placed decoration to move
    const key = `${tileX},${tileY}`;
    if (!this.occupiedDecoTiles.has(key)) return;
    const pd = (this.shopState.placedDecorations ?? []).find(p => p.tileX === tileX && p.tileY === tileY);
    if (!pd) return;
    const def = DECORATION_ITEMS.find(d => d.id === pd.defId);
    if (!def) return;

    // Seating check — don't allow moving if someone is seated
    if (def.seats) {
      const wx = tileX * TILE + TILE / 2;
      const wy = tileY * TILE + TILE / 2;
      const tableSlot = this.tables.find(t => t.worldX === wx && t.worldY === wy && t.id >= 100);
      if (tableSlot?.seats.some(s => s.customerId !== null)) {
        this.showFloatingText(wx, wy - 16, 'Someone is seated!', '#FF6666');
        return;
      }
    }

    this.startMovingDecoration(pd, def);
  }

  private startMovingDecoration(pd: PlacedDecoration, def: DecorationDef): void {
    const key = `${pd.tileX},${pd.tileY}`;

    // Temporarily vacate the tile so valid-placement check passes for that spot
    this.occupiedDecoTiles.delete(key);

    if (def.seats) {
      // For tables: also free up hard-blocked tile + pathfinder so the ghost can return there
      this.hardBlockedTiles.delete(key);
      const tBody = this.tableFurnitureBodies.get(key);
      if (tBody) {
        const body = tBody.body as Phaser.Physics.Arcade.StaticBody;
        if (body) {
          this.unblockPath(body.x, body.y, body.width, body.height);
        }
      }
      // Dim the original table + chairs so the player sees their original position
      this.decorationSprites.get(key)?.setAlpha(0.3).setTint(0xAAAAAA);
      this.tableChairSprites.get(key)?.forEach(c => c.setAlpha(0.25).setTint(0xAAAAAA));
      this.tableLabels.get(key)?.setAlpha(0.3);
    } else {
      // Dim the original sprite
      const origSpr = this.decorationSprites.get(key);
      if (origSpr) origSpr.setAlpha(0.3).setTint(0xAAAAAA);
    }

    this.buildMode.showGhostForMoving(pd.instanceId, def.spriteKey, pd.tileX, pd.tileY);
    this.buildMode.refreshValidityMap();
    this.decorateOverlayText?.destroy();
    this.decorateOverlayText = this.add.text(
      GAME_W / 2, 78,
      'Click to place  ·  Right-click or ESC to cancel',
      { fontSize: '12px', color: '#FFCC44', fontFamily: 'monospace', stroke: '#000000', strokeThickness: 3 },
    ).setOrigin(0.5, 0).setDepth(105).setAlpha(0);
    this.tweens.add({ targets: this.decorateOverlayText, alpha: 1, duration: 200 });
  }

  private confirmMoveDecoration(newTileX: number, newTileY: number): void {
    const instanceId = this.buildMode.movingInstanceId;
    const origTile = this.buildMode.movingOriginalTile;
    if (!instanceId || !origTile) return;

    const origKey = `${origTile.tileX},${origTile.tileY}`;
    const newKey = `${newTileX},${newTileY}`;
    const pdIdx = (this.shopState.placedDecorations ?? []).findIndex(p => p.instanceId === instanceId);
    if (pdIdx === -1) return;
    const pd = this.shopState.placedDecorations[pdIdx];
    const def = DECORATION_ITEMS.find(d => d.id === pd.defId);
    if (!def) return;

    const newWx = newTileX * TILE + TILE / 2;
    const newWy = newTileY * TILE + TILE / 2;

    if (def.seats) {
      // Tear down original table visuals
      const tBody = this.tableFurnitureBodies.get(origKey);
      if (tBody) {
        this.furnitureGroup.remove(tBody, true, true);
        this.tableFurnitureBodies.delete(origKey);
      }
      const tableIdx = this.tables.findIndex(t => {
        const origWx = origTile.tileX * TILE + TILE / 2;
        const origWy = origTile.tileY * TILE + TILE / 2;
        return t.worldX === origWx && t.worldY === origWy && t.id >= 100;
      });
      if (tableIdx !== -1) this.tables.splice(tableIdx, 1);
      this.decorationSprites.get(origKey)?.destroy();
      this.decorationSprites.delete(origKey);
      this.tableChairSprites.get(origKey)?.forEach(c => c.destroy());
      this.tableChairSprites.delete(origKey);
      this.tableLabels.get(origKey)?.destroy();
      this.tableLabels.delete(origKey);

      // Build table at new position
      this.placeTableVisuals(def, newTileX, newTileY, newWx, newWy, true);
    } else {
      // Move sprite to new position
      const spr = this.decorationSprites.get(origKey);
      if (spr) {
        spr.setPosition(newWx, newWy).setDepth(3.5 + newWy / 10000).clearTint().setAlpha(1);
        this.decorationSprites.delete(origKey);
        this.decorationSprites.set(newKey, spr);
      }
    }

    // Update data
    this.shopState.placedDecorations[pdIdx] = { ...pd, tileX: newTileX, tileY: newTileY };
    this.occupiedDecoTiles.add(newKey);

    this.buildMode.endMove();
    this.buildMode.refreshValidityMap();
    this.playChime();
    this.saveCurrentState();
    this.emitUIUpdate();

    // Restore build mode hint
    this.decorateOverlayText?.destroy();
    this.decorateOverlayText = this.add.text(
      GAME_W / 2, 78,
      'BUILD MODE  ·  Click object to move  ·  Del to remove  ·  B or ESC to exit',
      { fontSize: '12px', color: '#88FFAA', fontFamily: 'monospace', stroke: '#000000', strokeThickness: 3 },
    ).setOrigin(0.5, 0).setDepth(105).setAlpha(0);
    this.tweens.add({ targets: this.decorateOverlayText, alpha: 1, duration: 200 });
  }

  private cancelMoveDecoration(): void {
    const origTile = this.buildMode.movingOriginalTile;
    const instanceId = this.buildMode.movingInstanceId;
    if (!origTile || !instanceId) return;

    const origKey = `${origTile.tileX},${origTile.tileY}`;
    const pd = (this.shopState.placedDecorations ?? []).find(p => p.instanceId === instanceId);
    const def = pd ? DECORATION_ITEMS.find(d => d.id === pd.defId) : null;

    // Restore original tile occupation
    this.occupiedDecoTiles.add(origKey);

    if (def?.seats) {
      // Restore hard-blocked tile + pathfinder
      this.hardBlockedTiles.add(origKey);
      const tBody = this.tableFurnitureBodies.get(origKey);
      if (tBody) {
        const body = tBody.body as Phaser.Physics.Arcade.StaticBody;
        if (body) {
          this.blockPath(body.x, body.y, body.width, body.height);
        }
      }
      // Restore opacity
      this.decorationSprites.get(origKey)?.setAlpha(1).clearTint();
      this.tableChairSprites.get(origKey)?.forEach(c => c.setAlpha(1).clearTint());
      this.tableLabels.get(origKey)?.setAlpha(1);
    } else {
      this.decorationSprites.get(origKey)?.setAlpha(1).clearTint();
    }

    this.buildMode.endMove();
    this.buildMode.refreshValidityMap();

    // Restore build mode hint
    this.decorateOverlayText?.destroy();
    this.decorateOverlayText = this.add.text(
      GAME_W / 2, 78,
      'BUILD MODE  ·  Click object to move  ·  Del to remove  ·  B or ESC to exit',
      { fontSize: '12px', color: '#88FFAA', fontFamily: 'monospace', stroke: '#000000', strokeThickness: 3 },
    ).setOrigin(0.5, 0).setDepth(105).setAlpha(0);
    this.tweens.add({ targets: this.decorateOverlayText, alpha: 1, duration: 200 });
  }

  private removeDecoInBuildMode(tileX: number, tileY: number): void {
    this.removeDecoAtTile(tileX, tileY);
  }

  private checkTierUp(): void {
    const newTier = this.getCurrentTier();
    if (newTier.level > this.currentTierLevel) {
      this.currentTierLevel = newTier.level;
      this.showTierUpBanner(newTier.name);
      this.game.events.emit('game_event', { type: 'tier_changed', tierName: newTier.name, tierLevel: newTier.level });
    }
  }

  private showTierUpBanner(tierName: string): void {
    const banner = this.add.text(GAME_W / 2, GAME_H / 2 - 40, `★ ${tierName} ★\nNew menu items unlocked!`, {
      fontSize: '22px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5).setDepth(200).setAlpha(0);
    this.tweens.add({
      targets: banner, alpha: 1, y: GAME_H / 2 - 60, duration: 500,
      onComplete: () => {
        this.time.delayedCall(2000, () => {
          this.tweens.add({ targets: banner, alpha: 0, duration: 600, onComplete: () => banner.destroy() });
        });
      },
    });
    this.playChime();
  }

  // ─────────────────────────────────────────────────────────────────────
  // STORE PURCHASES (from in-game store panel)
  // ─────────────────────────────────────────────────────────────────────

  private handleBuyTable(slotId: number): void {
    const slot = TABLE_SLOT_DEFS.find(s => s.id === slotId);
    if (!slot || slot.cost === 0) return;
    if ((this.shopState.ownedTableSlotIds ?? []).includes(slotId)) return;
    if (slot.requiresExpansionId && !(this.shopState.ownedExpansionIds ?? []).includes(slot.requiresExpansionId)) {
      this.showFloatingText(GAME_W / 2, GAME_H / 2, 'Expansion required', '#FF6666');
      return;
    }
    if (this.money < slot.cost) {
      this.showFloatingText(GAME_W / 2, GAME_H / 2, 'Not enough ✦', '#FF6666');
      return;
    }
    this.money -= slot.cost;
    if (!this.shopState.ownedTableSlotIds) this.shopState.ownedTableSlotIds = [];
    this.shopState.ownedTableSlotIds.push(slotId);
    this.addTableToWorld(slot);
    this.showFloatingText(GAME_W / 2 - 150, GAME_H / 2, `${slot.name} added!`, '#AAFFAA');
    this.playChime();
    this.emitUIUpdate();
  }

  private handleHireStaff(role: EmployeeRole): void {
    const def = EMPLOYEE_TYPES.find(e => e.role === role);
    if (!def) return;
    const current = this.getStaffCount(role);
    if (current >= def.max) return;
    if (this.money < def.cost) {
      this.showFloatingText(GAME_W / 2, GAME_H / 2, 'Not enough ✦', '#FF6666');
      return;
    }
    this.money -= def.cost;
    this.incrementStaff(role);

    if (role === 'waiter') {
      this.spawnOneEmployee(this.shopState.employees - 1);
    } else if (role === 'cook') {
      this.kitchen.spawnOneCook(this.shopState.cooks - 1, this.employees.length);
    } else if (role === 'guard') {
      this.spawnPassiveNpc(10 * TILE + TILE / 2, 12 * TILE + TILE / 2, 'Guard', '#6688DD');
    } else if (role === 'caterer') {
      this.spawnPassiveNpc(19 * TILE + TILE / 2, 12 * TILE + TILE / 2, 'Caterer', '#DD88CC');
    }

    this.showFloatingText(GAME_W / 2 - 150, GAME_H / 2 + 20, `${def.name} hired!`, '#60FF88');
    this.playChime();
    this.saveCurrentState();
    this.emitUIUpdate();
  }

  private handleBuyMachine(machineId: string): void {
    const def = MACHINE_DEFS.find(d => d.id === machineId);
    if (!def || def.starter) return;
    const owned = this.shopState.ownedMachines ?? ['espresso_machine'];
    if (owned.includes(machineId)) return;
    if (this.money < def.cost) {
      this.showFloatingText(GAME_W / 2, GAME_H / 2, 'Not enough ✦', '#FF6666');
      return;
    }
    this.money -= def.cost;
    this.shopState.ownedMachines = [...owned, machineId];
    this.kitchen.addMachine(machineId);
    this.showFloatingText(GAME_W / 2 - 150, GAME_H / 2, `${def.name} installed!`, '#AAFFAA');
    this.playChime();
    this.saveCurrentState();
    this.emitUIUpdate();
  }

  private handleBuyRecipe(itemId: string): void {
    const item = (MENU_ITEMS as readonly MenuItemDef[]).find(m => m.id === itemId);
    if (!item) return;
    const owned = this.shopState.ownedRecipeIds ?? [];
    if (owned.includes(itemId)) return;
    const tier = this.getCurrentTier();
    if (!tier.unlockedMenuIds.includes(itemId as any)) return;
    const cost = item.recipeCost ?? 0;
    if (this.money < cost) {
      this.showFloatingText(GAME_W / 2, GAME_H / 2, 'Not enough ✦', '#FF6666');
      return;
    }
    this.money -= cost;
    this.shopState.ownedRecipeIds = [...owned, itemId];
    this.shopState.dailyMenuIds = [...(this.shopState.dailyMenuIds ?? []), itemId];
    this.showFloatingText(GAME_W / 2 - 150, GAME_H / 2, `${item.name} learned!`, '#AAFFAA');
    this.playChime();
    this.saveCurrentState();
    this.emitUIUpdate();
  }

  private handleBuyExpansion(zoneId: string): void {
    const zone = EXPANSION_ZONES.find(z => z.id === zoneId);
    if (!zone) return;
    const owned = this.shopState.ownedExpansionIds ?? [];
    if (owned.includes(zoneId)) return;
    if (this.reputation < zone.minReputation) {
      this.showFloatingText(GAME_W / 2, GAME_H / 2, `Need ${zone.minReputation} rep`, '#FF6666');
      return;
    }
    if (this.money < zone.cost) {
      this.showFloatingText(GAME_W / 2, GAME_H / 2, 'Not enough ✦', '#FF6666');
      return;
    }
    this.money -= zone.cost;
    this.shopState.ownedExpansionIds = [...owned, zoneId];
    this.showFloatingText(GAME_W / 2 - 150, GAME_H / 2, `${zone.name} unlocked! (next day)`, '#AAFFAA');
    this.playChime();
    this.saveCurrentState();
    this.emitUIUpdate();
  }

  private handleToggleDailyRecipe(itemId: string): void {
    const daily = this.shopState.dailyMenuIds ?? [];
    if (daily.includes(itemId)) {
      if (daily.length <= 1) return;
      this.shopState.dailyMenuIds = daily.filter(id => id !== itemId);
    } else {
      this.shopState.dailyMenuIds = [...daily, itemId];
    }
    this.saveCurrentState();
    this.emitUIUpdate();
  }

  private getStaffCount(role: EmployeeRole): number {
    switch (role) {
      case 'waiter':  return this.shopState.employees ?? 0;
      case 'cook':    return this.shopState.cooks ?? 0;
      case 'guard':   return this.shopState.guards ?? 0;
      case 'caterer': return this.shopState.caterers ?? 0;
    }
  }

  private incrementStaff(role: EmployeeRole): void {
    switch (role) {
      case 'waiter':  this.shopState.employees = (this.shopState.employees ?? 0) + 1; break;
      case 'cook':    this.shopState.cooks = (this.shopState.cooks ?? 0) + 1; break;
      case 'guard':   this.shopState.guards = (this.shopState.guards ?? 0) + 1; break;
      case 'caterer': this.shopState.caterers = (this.shopState.caterers ?? 0) + 1; break;
    }
  }

  private handleFireStaff(role: EmployeeRole): void {
    const def = EMPLOYEE_TYPES.find(e => e.role === role);
    if (!def) return;
    const current = this.getStaffCount(role);
    if (current <= 0) return;
    const refund = Math.floor(def.cost * 0.5);
    switch (role) {
      case 'waiter':  this.shopState.employees = current - 1; break;
      case 'cook':    this.shopState.cooks     = current - 1; break;
      case 'guard':   this.shopState.guards    = current - 1; break;
      case 'caterer': this.shopState.caterers  = current - 1; break;
    }
    this.money += refund;
    this.showFloatingText(GAME_W / 2 - 150, GAME_H / 2 + 20, `${def.name} let go (+${refund} ✦)`, '#FFAA66');
    this.saveCurrentState();
    this.emitUIUpdate();
  }

  // ─────────────────────────────────────────────────────────────────────
  // CATS
  // ─────────────────────────────────────────────────────────────────────

  private spawnCats(catData: ReturnType<typeof defaultSaveState>['cats']): void {
    const catPositions = [
      { col: 11, row: 11 }, { col: 18, row: 11 },
      { col: 11, row: 8  }, { col: 18, row: 8  },
    ];
    const bounds = new Phaser.Geom.Rectangle(10 * TILE + 8, 7 * TILE + 8, 10 * TILE - 16, 6 * TILE - 16);

    catData.forEach((data, i) => {
      const pos = catPositions[i % catPositions.length];
      const cat = new Cat(
        this, pos.col * TILE + TILE/2, pos.row * TILE + TILE/2, data, bounds,
      );
      cat.setScale(1.5);
      this.cats.push(cat);
      this.physics.add.collider(cat, this.wallGroup);
      this.physics.add.collider(cat, this.furnitureGroup);
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // EMPLOYEES
  // ─────────────────────────────────────────────────────────────────────

  private spawnEmployees(): void {
    for (let i = 0; i < (this.shopState.employees ?? 0); i++) {
      this.spawnOneEmployee(i);
    }
  }

  // Passive visual-only NPCs for guard and caterer (no AI, no physics)
  private spawnPassiveNpc(x: number, y: number, label: string, color: string): void {
    this.add.sprite(x, y, 'player_employee')
      .setOrigin(0.5, 0.9)
      .setDepth(10 + y / 1000);
    this.add.text(x, y - 24, label, {
      fontSize: '8px', color, fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(11);
  }

  private spawnPassiveStaff(): void {
    if ((this.shopState.guards ?? 0) > 0) {
      this.spawnPassiveNpc(10 * TILE + TILE / 2, 12 * TILE + TILE / 2, 'Guard', '#6688DD');
    }
    if ((this.shopState.caterers ?? 0) > 0) {
      this.spawnPassiveNpc(19 * TILE + TILE / 2, 12 * TILE + TILE / 2, 'Caterer', '#DD88CC');
    }
  }

  private spawnOneEmployee(index: number): void {
    const empPositions = [
      { col: 11, row: 9 }, { col: 18, row: 9 }, { col: 14, row: 11 },
    ];
    const pos = empPositions[index % empPositions.length];
    const emp = new Employee(
      this, pos.col * TILE + TILE/2, pos.row * TILE + TILE/2,
      this.employees.length, EMPLOYEE_NAMES[this.employees.length % EMPLOYEE_NAMES.length],
    );
    emp.pathFinder = (fx, fy, tx, ty) => this.customerPathfinder.findPath(fx, fy, tx, ty);
    emp.onTakeOrder = (customerId) => {
      const c = this.customerSys.customers.find(cu => cu.customerId === customerId);
      if (c && c.aiState === 'waiting_order') {
        c.takeOrder();
        this.showFloatingText(emp.x, emp.y - 30, 'Order taken!', '#AAFFAA');
        this.playPop();
      }
    };

    emp.onPickupFood = (stationId) => {
      const itemId = this.kitchen.pickupFromStation(stationId);
      if (itemId) this.playCook();
      return itemId;
    };

    emp.onDeliverFood = (customerId, itemId) => {
      const c = this.customerSys.customers.find(cu => cu.customerId === customerId);
      if (!c || c.aiState !== 'waiting_food' || c.order?.id !== itemId) return;
      c.receiveFood();
      const catererBonus = 1 + (this.shopState.caterers ?? 0) * 0.25;
      const earned = Math.round(c.getTip() * catererBonus);
      this.money += earned;
      this.reputation = Math.min(100, this.reputation + 1);
      this.totalServed++;
      this.servedToday++;
      this.revenueToday += earned;
      this.showFloatingText(c.x, c.y - 30, `+${earned} ✦`, '#FFD700');
      this.playChime();
      this.emitUIUpdate();
    };

    this.physics.add.collider(emp, this.wallGroup);
    this.employees.push(emp);
  }

  // ─────────────────────────────────────────────────────────────────────
  // INTERACTION SYSTEM
  // ─────────────────────────────────────────────────────────────────────

  private scanInteractables(): InteractionContext {
    const px = this.player.x;
    const py = this.player.y;
    const REACH = INTERACTION_REACH;
    const carriedId = this.player.getCarriedFoodId();

    if (this.player.isCarryingFood()) {
      const trashDist = Phaser.Math.Distance.Between(px, py, this.kitchen.trashCanX, this.kitchen.trashCanY);
      if (trashDist < REACH) {
        const foodId = this.player.getCarriedFoodId();
        const item = MENU_ITEMS.find(m => m.id === foodId);
        return { type: 'trash', label: `Discard ${item?.name ?? 'item'}` };
      }
    }

    let primaryStation: InteractionContext | null = null;
    for (const stn of this.kitchen.stations) {
      const dist = Phaser.Math.Distance.Between(px, py, stn.worldX, stn.worldY);
      const vertDist = Math.abs(py - (stn.worldY + TILE));
      if (dist < REACH && vertDist < 40) {
        if (stn.isCooking && stn.cookProgress >= 1) {
          primaryStation = { type: 'station', label: `Pick up ${this.kitchen.getReadyItemName(stn.id) ?? 'order'}`, stationId: stn.id };
          break;
        }
        if (!stn.isCooking && !this.player.isCarryingFood()) {
          const pending = this.kitchen.getPendingOrder(stn.machineId, this.customerSys.customers, carriedId);
          if (pending) {
            primaryStation = { type: 'station', label: `Cook ${pending.item.name}`, stationId: stn.id };
            break;
          }
        }
      }
    }

    let primaryCustomer: InteractionContext | null = null;
    for (const c of this.customerSys.customers) {
      if (!c.active) continue;
      const dist = Phaser.Math.Distance.Between(px, py, c.x, c.y);
      if (dist < REACH) {
        if (c.aiState === 'waiting_order' && c.order) {
          primaryCustomer = { type: 'customer_order', label: `Take order: ${c.order.name}`, targetId: c.customerId };
          break;
        }
        if (c.aiState === 'waiting_food' && this.player.isCarryingFood()) {
          const carried = this.player.getCarriedFoodId();
          if (carried && c.order?.id === carried) {
            primaryCustomer = { type: 'customer_deliver', label: `Deliver ${c.order.name}`, targetId: c.customerId };
            break;
          }
        }
      }
    }

    if (primaryStation && primaryCustomer) {
      return { ...primaryStation, secondaryLabel: primaryCustomer.label };
    }
    if (primaryStation) return primaryStation;
    if (primaryCustomer) return primaryCustomer;

    for (const cat of this.cats) {
      const dist = Phaser.Math.Distance.Between(px, py, cat.x, cat.y);
      if (dist < REACH) {
        return { type: 'cat', label: `Pet ${cat.catName}`, targetId: cat.catId };
      }
    }

    return { type: 'none', label: '' };
  }

  private handleInteraction(): void {
    const ctx = this.currentInteraction;
    if (ctx.type === 'none') return;

    switch (ctx.type) {
      case 'trash': {
        this.player.dropFood();
        this.showFloatingText(this.player.x, this.player.y - 30, 'Discarded', '#FF8888');
        this.playPop();
        break;
      }

      case 'station': {
        const stn = this.kitchen.stations.find(s => s.id === ctx.stationId);
        if (!stn) return;
        if (stn.isCooking && stn.cookProgress >= 1) {
          const itemId = this.kitchen.pickupFromStation(stn.id);
          if (itemId) {
            this.player.pickUpFood(itemId);
            this.playCook();
            if (this.secretIngredientStations.has(stn.id)) {
              this.secretIngredientStations.delete(stn.id);
              this.pendingSecretIngredient = true;
            }
          }
        } else if (!stn.isCooking) {
          const started = this.kitchen.startCooking(stn.id, this.customerSys.customers, this.player.getCarriedFoodId());
          if (started) this.playCook();
        }
        break;
      }

      case 'customer_order': {
        const c = this.customerSys.customers.find(cu => cu.customerId === ctx.targetId);
        if (!c || c.aiState !== 'waiting_order') return;
        c.takeOrder();
        this.showFloatingText(this.player.x, this.player.y - 30, `${c.order?.name ?? 'Order'}`, '#FFEEDD');
        this.playPop();
        this.dismissTutorialOrder();
        break;
      }

      case 'customer_deliver': {
        const c = this.customerSys.customers.find(cu => cu.customerId === ctx.targetId);
        if (!c || c.aiState !== 'waiting_food') return;
        const carried = this.player.dropFood();
        if (carried && c.order?.id === carried) {
          if (this.pendingSecretIngredient) {
            this.pendingSecretIngredient = false;
            c.boostHappiness(40);
            this.showFloatingText(c.x, c.y - 40, 'Secret ingredient!', '#88FF44');
          }
          c.receiveFood();
          const catererBonus = 1 + (this.shopState.caterers ?? 0) * 0.25;
          const earned = Math.round(c.getTip() * catererBonus);
          this.money += earned;
          this.reputation = Math.min(100, this.reputation + 1);
          this.totalServed++;
          this.servedToday++;
          this.revenueToday += earned;
          this.showFloatingText(this.player.x, this.player.y - 30, `+${earned} ✦`, '#FFD700');
          this.playChime();
          this.emitUIUpdate();
          this.dismissTutorialDeliver();
        }
        break;
      }

      case 'cat': {
        const cat = this.cats.find(k => k.catId === ctx.targetId);
        if (cat) {
          const lastPet = this.catPetCooldowns.get(cat.catId) ?? -Infinity;
          if (this.time.now - lastPet < PET_COOLDOWN_MS) {
            this.showFloatingText(cat.x, cat.y - 30, 'Purring...', '#AACCDD');
            this.playCatPurr();
          } else {
            cat.pet();
            this.playPop();
            this.playCatPurr();
            const bonus = 3 + Math.floor(cat.happiness / 25);
            this.money += bonus;
            this.catPetCooldowns.set(cat.catId, this.time.now);
            this.showFloatingText(cat.x, cat.y - 30, `+${bonus} ✦`, '#FFD700');
            this.emitUIUpdate();
          }
        }
        break;
      }
    }
  }

  private setupSpaceAmbience(): void {
    const tier = this.getCurrentTier().level;

    // ── Warm interior fill — makes café feel lit from within ─────────────
    const cafeL = 9 * TILE, cafeT = 3 * TILE, cafeW = 12 * TILE, cafeH = 11 * TILE;
    const interiorWarm = this.add.graphics().setDepth(0.41).setBlendMode(Phaser.BlendModes.ADD);
    interiorWarm.fillStyle(0x2A1200, 0.45);
    interiorWarm.fillRect(cafeL, cafeT, cafeW, cafeH);

    // ── Warm interior glow — scales up with tier ──────────────────
    const warmScale = [0, 0.006, 0.012, 0.022, 0.032, 0.042][tier] ?? 0.042;
    if (warmScale > 0) {
      this.warmGlowGraphic = this.add.graphics().setDepth(0.5).setBlendMode(Phaser.BlendModes.ADD);
      this.warmGlowGraphic.fillStyle(0xFF7700, warmScale * 1.5); this.warmGlowGraphic.fillCircle(15 * TILE, 9 * TILE, 80);
      this.warmGlowGraphic.fillStyle(0xFF9000, warmScale);       this.warmGlowGraphic.fillCircle(12 * TILE, 10 * TILE, 60);
      this.warmGlowGraphic.fillCircle(18 * TILE, 10 * TILE, 60);
      this.warmGlowGraphic.fillStyle(0xFF6600, warmScale * 0.7); this.warmGlowGraphic.fillCircle(15 * TILE, 12 * TILE, 70);
    }

    // ── Cold industrial tint over shack interior ──────────────────
    if (tier <= 2) {
      const coldAlpha = tier === 1 ? 0.045 : 0.022;
      this.coldTintGraphic = this.add.graphics().setDepth(0.5).setBlendMode(Phaser.BlendModes.ADD);
      this.coldTintGraphic.fillStyle(tier === 1 ? 0x0033CC : 0x1122AA, coldAlpha);
      this.coldTintGraphic.fillRect(9 * TILE, 3 * TILE, 11 * TILE, 11 * TILE);
    }

    // ── Cool lunar window light from back wall windows ────────────
    const windowAlpha = tier <= 2 ? 0.060 : 0.028;
    const windowLight = this.add.graphics().setDepth(0.5).setBlendMode(Phaser.BlendModes.ADD);
    windowLight.fillStyle(0x3366BB, windowAlpha);
    windowLight.fillRect(9 * TILE, 3 * TILE, 11 * TILE, 3 * TILE);

    // ── Moonlight shafts through back windows ─────────────────────
    const shaftAlpha = tier <= 2 ? 0.060 : 0.032;
    this.moonlightShaftGraphic = this.add.graphics().setDepth(0.6).setBlendMode(Phaser.BlendModes.ADD);
    const shaftG = this.moonlightShaftGraphic;
    [11, 13, 15, 17, 19].forEach(col => {
      const sx = col * TILE + TILE / 2;
      const topY = 3 * TILE;
      const btmY = 7 * TILE;
      const spread = TILE * 1.0;
      shaftG.fillStyle(0x99BBEE, shaftAlpha);
      shaftG.fillTriangle(sx - 4, topY, sx + 4, topY, sx + spread, btmY);
      shaftG.fillTriangle(sx - 4, topY, sx - spread, btmY, sx + spread, btmY);
    });

    // ── Twinkling stars in top space rows ─────────────────────────
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        const col = Phaser.Math.Between(0, 29);
        const row = Phaser.Math.Between(0, 2);
        const wx = col * TILE + Math.random() * TILE;
        const wy = row * TILE + Math.random() * TILE;
        const star = this.add.sprite(wx, wy, 'particle_star')
          .setScale(0.3 + Math.random() * 0.5).setAlpha(0).setDepth(1);
        this.tweens.add({
          targets: star, alpha: { from: 0, to: 0.8 }, duration: 200, yoyo: true,
          onComplete: () => star.destroy(),
        });
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // DAY LIGHTING
  // ─────────────────────────────────────────────────────────────────────

  private updateDayLighting(): void {
    const p = this.dayProgress;
    // Warm glow: dim in morning, full at afternoon, extra warm in evening
    if (this.warmGlowGraphic) {
      const warmAlpha = p < 0.33
        ? 0.65 + (p / 0.33) * 0.35        // 0.65 → 1.00 through morning
        : p < 0.66
          ? 1.00                            // full intensity in afternoon
          : 1.00 + ((p - 0.66) / 0.34) * 0.35; // 1.00 → 1.35 golden evening
      this.warmGlowGraphic.setAlpha(Math.min(warmAlpha, 1.4));
    }
    // Cold tint and moonlight fade slightly as interior warms through the day
    if (this.coldTintGraphic) {
      this.coldTintGraphic.setAlpha(1.0 - p * 0.45);
    }
    if (this.moonlightShaftGraphic) {
      // Shafts strongest in morning, gradually fade as interior warms
      this.moonlightShaftGraphic.setAlpha(1.0 - p * 0.55);
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // DELIVERY ARROW
  // ─────────────────────────────────────────────────────────────────────

  private updateDeliveryArrow(): void {
    const carriedId = this.player?.getCarriedFoodId();
    if (!carriedId) {
      this.deliveryArrow?.setVisible(false);
      this.deliveryGlow?.setVisible(false);
      this.deliveryGlowTarget = -1;
      return;
    }
    const target = this.customerSys.customers.find(c => c.active && c.aiState === 'waiting_food' && c.order?.id === carriedId);
    if (!target) {
      this.deliveryArrow?.setVisible(false);
      this.deliveryGlow?.setVisible(false);
      this.deliveryGlowTarget = -1;
      return;
    }

    if (!this.deliveryArrow) {
      this.deliveryArrow = this.add.text(0, 0, '▼', {
        fontSize: '20px', color: '#FFD700', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 3,
      }).setOrigin(0.5, 1).setDepth(55);
    }

    if (!this.deliveryGlow) {
      this.deliveryGlow = this.add.graphics().setDepth(7);
    }

    const bounce = Math.sin(this.time.now * 0.006) * 4;
    this.deliveryArrow.setPosition(target.x, target.y - 62 + bounce).setVisible(true);

    // Pulsing glow ring under the target customer
    if (this.deliveryGlowTarget !== target.customerId) {
      this.deliveryGlowTarget = target.customerId;
    }
    const pulse = 0.35 + Math.sin(this.time.now * 0.005) * 0.25;
    this.deliveryGlow.clear();
    this.deliveryGlow.lineStyle(3, 0xFFD700, pulse);
    this.deliveryGlow.strokeCircle(target.x, target.y, 18);
    this.deliveryGlow.setPosition(0, 0).setVisible(true);
  }

  // ─────────────────────────────────────────────────────────────────────
  // INTERACTION PROMPT
  // ─────────────────────────────────────────────────────────────────────

  private showInteractionPrompt(ctx: InteractionContext): void {
    const hasSecondary = !!ctx.secondaryLabel;
    const h = hasSecondary ? 48 : 32;
    if (!this.interactionPrompt) {
      const container = this.add.container(0, 0).setDepth(100);
      const bg = this.add.graphics();
      const prompt = this.add.sprite(10, 16, 'ui_e_prompt').setOrigin(0, 0.5).setScale(0.9);
      const txt = this.add.text(38, 16, '', {
        fontSize: '12px', color: '#FFEEDD', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0.5);
      const secondary = this.add.text(38, 34, '', {
        fontSize: '10px', color: '#AAAAAA', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 1,
      }).setOrigin(0, 0.5);
      container.add([bg, prompt, txt, secondary]);
      container.setData('bg', bg);
      container.setData('txt', txt);
      container.setData('secondary', secondary);
      container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 240, 48), Phaser.Geom.Rectangle.Contains);
      container.on('pointerdown', () => this.handleInteraction());
      this.interactionPrompt = container;
    }
    const bg = this.interactionPrompt.getData('bg') as Phaser.GameObjects.Graphics;
    const txt = this.interactionPrompt.getData('txt') as Phaser.GameObjects.Text;
    const secondary = this.interactionPrompt.getData('secondary') as Phaser.GameObjects.Text;
    bg.clear();
    bg.fillStyle(COLORS.UI_PANEL, 0.92);
    bg.fillRoundedRect(0, 0, 240, h, 6);
    bg.lineStyle(1, COLORS.UI_GOLD, 0.8);
    bg.strokeRoundedRect(0, 0, 240, h, 6);
    txt.setText(ctx.label);
    secondary.setText(ctx.secondaryLabel ? `also nearby: ${ctx.secondaryLabel}` : '');
    secondary.setVisible(hasSecondary);
    const promptX = Phaser.Math.Clamp(this.player.x - 120, 4, GAME_W - 244);
    const promptY = Phaser.Math.Clamp(this.player.y - (hasSecondary ? 68 : 56), 60, GAME_H - h - 4);
    this.interactionPrompt.setPosition(promptX, promptY);
    this.interactionPrompt.setVisible(true);
  }

  private hideInteractionPrompt(): void {
    this.interactionPrompt?.setVisible(false);
  }

  // ─────────────────────────────────────────────────────────────────────
  // DAY SYSTEM
  // ─────────────────────────────────────────────────────────────────────

  private endDay(): void {
    if (this.dayEnded) return;
    this.dayEnded = true;
    this.dayPhase = 'night';
    this.player.clearMoveTargets();

    this.customerSys.endDay();

    // Record today's stats
    this.popularityHistory.push({ day: this.day, served: this.servedToday, revenue: this.revenueToday });

    this.time.delayedCall(4000, () => this.showDayEndScreen());
  }

  private showDayEndScreen(): void {
    if (this.dayEndShown) return;
    this.dayEndShown = true;

    const avgCatHappiness = this.cats.reduce((s, c) => s + c.happiness, 0) / Math.max(1, this.cats.length);
    const tier = this.getCurrentTier();
    this.game.events.emit('show_day_report', {
      day: this.day,
      servedToday: this.servedToday,
      revenueToday: this.revenueToday,
      reputation: this.reputation,
      avgCatHappiness,
      money: this.money,
      popularityHistory: [...this.popularityHistory],
      tierLevel: tier.level,
      bookings: this.shopState.bookings ?? 0,
      rentDue: getDailyRent(this.day),
      ambiance: this.computeAmbiance(),
    });
  }

  private startNextDay(): void {
    if (this.isTransitioningDay) return;
    this.isTransitioningDay = true;
    this.day++;
    this.dayProgress = 0;
    this.dayEnded = false;
    this.dayEndShown = false;

    // Deduct daily rent — struggling penalty if balance goes negative
    const rent = getDailyRent(this.day - 1); // day was already incremented above
    this.money -= rent;
    if (this.money < 0) {
      this.reputation = Math.max(0, this.reputation - 5);
    }

    // Guard bonus at day start
    const guardBonus = (this.shopState.guards ?? 0) * 5;
    if (guardBonus > 0) this.reputation = Math.min(100, this.reputation + guardBonus);

    this.saveCurrentState();

    this.cameras.main.fadeOut(600, 5, 5, 16);
    this.time.delayedCall(700, () => {
      this.scene.restart();
    });
  }

  private handleSetBookings(delta: number): void {
    const current = this.shopState.bookings ?? 0;
    if (delta < 0) {
      if (current <= 0) return;
      this.shopState.bookings = current - 1;
      this.money += BOOKING_COST;
    } else {
      if (current >= MAX_BOOKINGS || this.money < BOOKING_COST) return;
      this.shopState.bookings = current + 1;
      this.money -= BOOKING_COST;
    }
    this.game.events.emit('refresh_day_report', { money: this.money, bookings: this.shopState.bookings });
    this.emitUIUpdate();
  }

  private saveCurrentState(): void {
    saveGame({
      money: this.money,
      reputation: this.reputation,
      day: this.day,
      totalServed: this.totalServed,
      shop: { ...this.shopState },
      cats: this.cats.map(c => ({
        id: c.catId, name: c.catName, personality: c.personality,
        colorKey: c.colorKey as 'orange' | 'gray' | 'black' | 'cream',
        hunger: c.hunger, happiness: c.happiness, energy: c.energy,
      })),
      popularityHistory: [...this.popularityHistory],
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // AUDIO
  // ─────────────────────────────────────────────────────────────────────

  private getAudioCtx(): AudioContext | null {
    try { return this.audioCtx ??= new AudioContext(); }
    catch { return null; }
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.08): void {
    if (!isSoundEnabled()) return;
    const ctx = this.getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.start(); osc.stop(ctx.currentTime + duration / 1000);
  }

  private playPop(): void { this.playTone(660, 80, 'sine', 0.06); }
  private playCook(): void {
    this.playTone(440, 120, 'triangle', 0.05);
    this.playTone(550, 100, 'triangle', 0.04);
  }
  private playChime(): void {
    [880, 1100, 1320].forEach((f, i) => {
      this.time.delayedCall(i * 80, () => this.playTone(f, 200, 'sine', 0.06));
    });
  }

  // ── Ambient café atmosphere ────────────────────────────────────────────

  startAmbientAudio(): void {
    if (!isSoundEnabled()) return;
    // Gentle background chord — warm café piano voicing, very subtle
    const chord = [220, 277, 330, 415]; // Am chord: A3 C#4 E4 G#4
    const delay = [0, 120, 240, 360];
    chord.forEach((freq, i) => {
      this.time.delayedCall(delay[i], () => {
        this.playTone(freq, 1800, 'sine', 0.018);
        this.playTone(freq * 2, 1400, 'sine', 0.009);
      });
    });
    // Loop every 6 seconds
    this.time.addEvent({
      delay: 6000, loop: true, callback: () => {
        if (!isSoundEnabled()) return;
        const progressions = [
          [220, 277, 330, 415], // Am
          [196, 247, 294, 370], // Gm-ish
          [233, 293, 349, 440], // Bb-ish
          [207, 261, 311, 392], // Cm-ish
        ];
        const prog = progressions[Math.floor(this.dayProgress * 4) % 4];
        prog.forEach((freq, i) => {
          this.time.delayedCall(i * 100, () => this.playTone(freq, 2200, 'sine', 0.016));
        });
      },
    });

    // Occasional soft cup-clink / cutlery sound
    this.time.addEvent({
      delay: 8000 + Math.random() * 4000, loop: false,
      callback: () => this.scheduleClink(),
    });
  }

  private scheduleClink(): void {
    this.playTone(1760 + Math.random() * 440, 60, 'sine', 0.025);
    const next = 5000 + Math.random() * 8000;
    this.time.addEvent({ delay: next, callback: () => this.scheduleClink() });
  }

  playCatPurr(): void {
    const ctx = this.getAudioCtx();
    if (!ctx || !isSoundEnabled()) return;
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();
    osc.frequency.value = 90; osc.type = 'sawtooth';
    lfo.frequency.value = 22; lfo.type = 'sine';
    lfoGain.gain.value = 55;
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
    osc.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.028, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.028, ctx.currentTime + 0.9);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.2);
    lfo.start(); osc.start();
    lfo.stop(ctx.currentTime + 1.2); osc.stop(ctx.currentTime + 1.2);
  }

  // ─────────────────────────────────────────────────────────────────────
  // FLOATING TEXT + TUTORIAL
  // ─────────────────────────────────────────────────────────────────────

  private showTutorialHint(): void {
    const makeHint = (text: string, yPos: number, delay: number): Phaser.GameObjects.Text => {
      const t = this.add.text(GAME_W / 2, yPos, text, {
        fontSize: '13px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3, backgroundColor: '#00000088',
        padding: { x: 10, y: 5 },
      }).setOrigin(0.5).setDepth(190).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 400, delay });
      return t;
    };

    this.tutorialHint1 = makeHint('Walk to a customer and press E to take their order!', GAME_H - 110, 0);
    this.tutorialHint2 = makeHint('Then cook at the matching station and deliver the food.', GAME_H - 80, 300);
  }

  private dismissTutorialOrder(): void {
    if (this.tutorialOrderDone) return;
    this.tutorialOrderDone = true;
    if (this.tutorialHint1) {
      this.tweens.add({
        targets: this.tutorialHint1, alpha: 0, duration: 500,
        onComplete: () => { this.tutorialHint1?.destroy(); this.tutorialHint1 = undefined; },
      });
    }
  }

  private dismissTutorialDeliver(): void {
    if (this.tutorialDeliverDone) return;
    this.tutorialDeliverDone = true;
    if (this.tutorialHint2) {
      this.tweens.add({
        targets: this.tutorialHint2, alpha: 0, duration: 500,
        onComplete: () => { this.tutorialHint2?.destroy(); this.tutorialHint2 = undefined; },
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // PATHFINDER HELPERS — keep both instances in sync
  // ─────────────────────────────────────────────────────────────────────

  private blockPath(x: number, y: number, w: number, h: number): void {
    this.pathfinder.blockRect(x, y, w, h);
    this.customerPathfinder.blockRect(x, y, w, h);
  }

  private unblockPath(x: number, y: number, w: number, h: number): void {
    this.pathfinder.unblockRect(x, y, w, h);
    this.customerPathfinder.unblockRect(x, y, w, h);
  }

  // ─────────────────────────────────────────────────────────────────────
  // CRISIS EVENTS
  // ─────────────────────────────────────────────────────────────────────

  private triggerCrisis(): void {
    const types = ['equipment_glitch', 'vip_visit', 'supply_rush'] as const;
    const crisisType = types[Math.floor(Math.random() * types.length)];

    switch (crisisType) {
      case 'equipment_glitch': {
        if (this.kitchen.stations.length === 0) return;
        const stn = this.kitchen.stations[Math.floor(Math.random() * this.kitchen.stations.length)];
        this.kitchen.glitchStation(stn.id, 30000);
        this.showCrisisBanner('!! EQUIPMENT GLITCH !!', 'A station is offline for 30 seconds!', '#FF4444');
        break;
      }
      case 'vip_visit': {
        this.customerSys.forceSpawnVip();
        this.showCrisisBanner('>> VIP ARRIVED <<', 'A special guest demands fast service — huge tip!', '#FFD700');
        break;
      }
      case 'supply_rush': {
        this.kitchen.startSupplyRush(60000);
        this.showCrisisBanner('>> SUPPLY RUSH <<', 'Cooking speed +40% for 60 seconds!', '#44FF88');
        break;
      }
    }
  }

  private showCrisisBanner(title: string, subtitle: string, color: string): void {
    this.crisisBanner?.destroy();
    const cx = GAME_W / 2;
    const cy = 60;
    const bg = this.add.rectangle(0, -8, 400, 48, 0x000000, 0.85).setOrigin(0.5);
    const border = this.add.rectangle(0, -8, 404, 52, Phaser.Display.Color.HexStringToColor(color).color, 0.9).setOrigin(0.5);
    const titleText = this.add.text(0, -16, title, {
      fontSize: '13px', color, fontFamily: "'Space Mono', monospace", fontStyle: 'bold',
    }).setOrigin(0.5);
    const subText = this.add.text(0, 2, subtitle, {
      fontSize: '10px', color: '#FFFFFF', fontFamily: "'Space Mono', monospace",
    }).setOrigin(0.5);
    const container = this.add.container(cx, cy, [border, bg, titleText, subText]);
    container.setDepth(150).setAlpha(0);
    this.crisisBanner = container;
    this.tweens.add({
      targets: container, alpha: 1, duration: 300,
      onComplete: () => {
        this.time.delayedCall(3500, () => {
          this.tweens.add({
            targets: container, alpha: 0, duration: 600,
            onComplete: () => { container.destroy(); if (this.crisisBanner === container) this.crisisBanner = undefined; },
          });
        });
      },
    });
  }

  private showFloatingText(x: number, y: number, text: string, color: string): void {
    const t = this.add.text(x, y, text, {
      fontSize: '14px', color, fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({
      targets: t, y: y - 36, alpha: 0,
      duration: 1400, ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // NAVIGATION + TAP-TO-INTERACT
  // ─────────────────────────────────────────────────────────────────────

  private goToMenu(): void {
    // Clean up any open overlays so they don't linger on resume
    if (this.isStorePanelOpen) { this.closeStorePanel(); }
    if (this.buildMode.isBuildActive) { this.buildMode.exit(); }
    this.pendingDecorationDef = null;
    this.buildMode.destroyGhost();
    this.movingOriginSprite?.destroy(); this.movingOriginSprite = null;
    this.decorateOverlayText?.destroy(); this.decorateOverlayText = null;

    // Stop UIScene (fires shutdown → uiOverlay.hideHUD())
    this.scene.stop('UIScene');
    // Sleep this scene so all in-flight state (customers, timer, orders) is preserved
    this.scene.sleep('GameScene');
    // Launch the menu on top
    this.scene.launch('MainMenuScene');
  }

  private handleTap(pointer: Phaser.Input.Pointer): void {
    if (this.dayEnded) return;

    // Right-click cancels current build/placement action
    if (pointer.rightButtonDown()) {
      if (this.buildMode.isMoving) { this.cancelMoveDecoration(); return; }
      if (this.pendingDecorationDef) { this.cancelPlacement(); return; }
      if (this.buildMode.isBuildActive) { this.exitBuildMode(); return; }
      return;
    }

    if (this.isStorePanelOpen) {
      // Allow clicks in the game area (left of store panel) for decoration placement
      if (this.pendingDecorationDef && pointer.y > 58 && pointer.x < GAME_W - 300) {
        this.handleDecorateClick(pointer.worldX, pointer.worldY);
      }
      return;
    }

    // Build mode active — route all left-clicks to build mode handler
    if (this.buildMode.isBuildActive) {
      if (pointer.y > 58) this.handleBuildModeClick(pointer.worldX, pointer.worldY);
      return;
    }

    // Placement mode — store is closed but player is placing a decoration/table
    if (this.pendingDecorationDef) {
      if (pointer.y > 58) this.handleDecorateClick(pointer.worldX, pointer.worldY);
      return;
    }

    if (pointer.y < 58) return;
    if (pointer.x > GAME_W - 160 && pointer.y < 260) return;

    const wx = pointer.worldX;
    const wy = pointer.worldY;
    const TAP_R = TILE * 1.8;

    this.showTapIndicator(wx, wy);

    if (this.player.isCarryingFood()) {
      if (Phaser.Math.Distance.Between(wx, wy, this.kitchen.trashCanX, this.kitchen.trashCanY) < TAP_R * 1.2) {
        const pts = this.buildWaypointsTo(this.kitchen.trashCanX, this.kitchen.trashCanY + TILE * 0.5);
        this.player.setMoveTargets(pts, () => {
          this.currentInteraction = this.scanInteractables();
          this.handleInteraction();
        });
        return;
      }
    }

    for (const c of this.customerSys.customers) {
      if (!c.active) continue;
      if (Phaser.Math.Distance.Between(wx, wy, c.x, c.y) < TAP_R) {
        const wantOrder  = c.aiState === 'waiting_order';
        const wantDeliver = c.aiState === 'waiting_food'
          && this.player.isCarryingFood()
          && c.order?.id === this.player.getCarriedFoodId();
        if (wantOrder || wantDeliver) {
          const pts = this.buildWaypointsTo(c.x, c.y + 18);
          this.player.setMoveTargets(pts, () => {
            this.currentInteraction = this.scanInteractables();
            this.handleInteraction();
          });
          return;
        }
      }
    }

    for (const stn of this.kitchen.stations) {
      if (Phaser.Math.Distance.Between(wx, wy, stn.worldX, stn.worldY) < TAP_R * 1.5) {
        const destY = stn.worldY + 16;
        const pts = this.buildWaypointsTo(stn.worldX, destY);
        this.player.setMoveTargets(pts, () => {
          this.currentInteraction = this.scanInteractables();
          this.handleInteraction();
        });
        return;
      }
    }

    for (const cat of this.cats) {
      if (Phaser.Math.Distance.Between(wx, wy, cat.x, cat.y) < TAP_R) {
        const pts = this.buildWaypointsTo(cat.x, cat.y);
        this.player.setMoveTargets(pts, () => {
          this.currentInteraction = this.scanInteractables();
          this.handleInteraction();
        });
        return;
      }
    }

    this.player.setMoveTargets(this.buildWaypointsTo(wx, wy));
  }

  private buildPathfinder(): void {
    this.pathfinder = new Pathfinder(MAP, TILE, new Set([1, 5, 6]));
    this.customerPathfinder = new Pathfinder(MAP, TILE, new Set([1, 5]));

    this.furnitureGroup.getChildren().forEach(child => {
      const body = (child as Phaser.Physics.Arcade.Image).body as Phaser.Physics.Arcade.StaticBody;
      if (body) {
        this.blockPath(body.x, body.y, body.width, body.height);
      }
    });
  }

  private buildWaypointsTo(tx: number, ty: number): Array<{ x: number; y: number }> {
    return this.pathfinder.findPath(this.player.x, this.player.y, tx, ty);
  }

  private showTapIndicator(x: number, y: number): void {
    const ring = this.add.graphics().setDepth(99);
    ring.lineStyle(2, COLORS.UI_GOLD, 0.9);
    ring.strokeCircle(x, y, 6);
    this.tweens.add({
      targets: ring, alpha: 0, scaleX: 2.5, scaleY: 2.5,
      duration: 380, ease: 'Quad.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // UI EVENTS
  // ─────────────────────────────────────────────────────────────────────

  private emitUIUpdate(): void {
    if (this.uiDebounceHandle !== null) return;
    this.uiDebounceHandle = setTimeout(() => {
      this.uiDebounceHandle = null;
      this.flushUIUpdate();
    }, 50);
  }

  private flushUIUpdate(): void {
    const avgCatHappiness = this.cats.reduce((s, c) => s + c.happiness, 0) / Math.max(1, this.cats.length);

    const carriedFoodId = this.player?.getCarriedFoodId() ?? null;
    const orders: OrderInfo[] = this.customerSys.customers
      .filter(c => c.active && (c.aiState === 'order_taken' || c.aiState === 'waiting_food'))
      .map(c => {
        const cookingStn = this.kitchen.stations.find(s => s.isCooking && s.currentOrderId === c.customerId);
        let status: OrderInfo['status'];
        let progress = 0;
        if (carriedFoodId !== null && c.order?.id === carriedFoodId && c.aiState === 'waiting_food') {
          status = 'carrying';
        } else if (cookingStn) {
          status = cookingStn.cookProgress >= 1 ? 'ready' : 'cooking';
          progress = cookingStn.cookProgress;
        } else {
          status = 'queued';
        }
        return {
          customerId: c.customerId, tableId: c.tableId,
          itemName: c.order?.name ?? '?', stationType: MACHINE_DEFS.find(d => d.id === c.order?.machines?.[0])?.label ?? c.order?.machines?.[0] ?? '',
          status, progress,
        };
      });

    const tier = this.getCurrentTier();
    this.game.events.emit('ui_update', {
      money: this.money,
      reputation: this.reputation,
      day: this.day,
      dayProgress: this.dayProgress,
      catHappiness: Math.round(avgCatHappiness),
      totalServed: this.totalServed,
      phase: this.dayPhase,
      orders,
      ambiance: this.computeAmbiance(),
      tierName: tier.name,
      tierLevel: tier.level,
      // Store panel data
      ownedTableSlotIds: [...(this.shopState.ownedTableSlotIds ?? [])],
      employees: this.shopState.employees ?? 0,
      cooks: this.shopState.cooks ?? 0,
      guards: this.shopState.guards ?? 0,
      caterers: this.shopState.caterers ?? 0,
      ownedMachines: [...(this.shopState.ownedMachines ?? ['espresso_machine'])],
      ownedRecipeIds: [...(this.shopState.ownedRecipeIds ?? ['moon_mocha', 'zerog_latte'])],
      dailyMenuIds: [...(this.shopState.dailyMenuIds ?? this.shopState.ownedRecipeIds ?? ['moon_mocha', 'zerog_latte'])],
      ownedExpansionIds: [...(this.shopState.ownedExpansionIds ?? [])],
      pendingExpansionIds: (this.shopState.ownedExpansionIds ?? []).filter(id => !this.startOfDayExpansionIds.has(id)),
      kitchenAtCapacity: this.kitchen.stations.every(s => s.isCooking) &&
        orders.some(o => o.status === 'queued'),
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // UPDATE LOOP
  // ─────────────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (this.dayEnded && this.dayEndShown) return;

    // Ghost cursor for decor placement and build mode moving
    this.buildMode.update(this.input.activePointer);

    // Game is fully frozen while store panel is open or build mode is active
    if (this.isStorePanelOpen || this.buildMode.isBuildActive) return;

    this.player.update();

    const customerPositions = this.customerSys.customers
      .filter(c => c.active && (c.aiState === 'seated' || c.aiState === 'eating'))
      .map(c => ({ x: c.x, y: c.y, id: c.customerId }));

    this.cats.forEach(cat => {
      cat.update(delta, customerPositions);
      this.customerSys.customers.forEach(c => {
        if (!c.active) return;
        // All cats: happiness boost near seated/eating customers
        if (c.aiState === 'seated' || c.aiState === 'eating') {
          // Lazy cats have wider cozy aura and stronger boost
          const radius = cat.personality === 'lazy' ? 52 : 36;
          const rate   = cat.personality === 'lazy' ? 0.018 : 0.008;
          if (cat.isNearPosition(c.x, c.y, radius) && cat.happiness > 40) {
            c.boostHappiness(delta * rate);
          }
        }
        // Friendly: partial patience restoration while near waiting_order customers
        if (cat.personality === 'friendly' && c.aiState === 'waiting_order'
            && cat.isNearPosition(c.x, c.y, 52)) {
          c.patience = Math.min(100, c.patience + delta * 0.0006);
        }
      });
    });

    // Mischievous: steal ready food from a nearby station (once per cooldown)
    this.mischievousCooldown = Math.max(0, this.mischievousCooldown - delta);
    if (this.mischievousCooldown <= 0) {
      for (const cat of this.cats) {
        if (cat.personality !== 'mischievous') continue;
        for (const stn of this.kitchen.stations) {
          if (!stn.isCooking || stn.cookProgress < 1) continue;
          if (cat.isNearPosition(stn.worldX, stn.worldY, 64) && Math.random() < 0.00045 * delta) {
            const stolenName = this.kitchen.stealFood(stn.id);
            if (stolenName) {
              this.showFloatingText(cat.x, cat.y - 24, `${stolenName} stolen!`, '#FF9933');
              this.mischievousCooldown = 35000;
            }
          }
        }
      }
    }

    // Explorer: sprinkle secret ingredient on nearby cooking stations
    for (const cat of this.cats) {
      if (cat.personality !== 'explorer') continue;
      for (const stn of this.kitchen.stations) {
        if (!stn.isCooking || stn.cookProgress >= 1) continue;
        if (!this.secretIngredientStations.has(stn.id)
            && cat.isNearPosition(stn.worldX, stn.worldY, 80)
            && Math.random() < 0.00008 * delta) {
          this.secretIngredientStations.add(stn.id);
          this.showFloatingText(stn.worldX, stn.worldY - 32, 'Secret ingredient!', '#88FF44');
        }
      }
    }

    const waitingForOrders = this.customerSys.getWaitingForOrders();
    const readyStations = this.kitchen.getReadyStations(this.customerSys.customers);

    this.employees.forEach(emp => emp.update(
      delta, waitingForOrders, this.employeeAssignedIds, readyStations, this.employeeDeliveryIds,
    ));

    this.customerSys.update(delta, this.dayEnded, this.dayPhase, this.reputation, this.day);



    const playerCarried = this.player.getCarriedFoodId();
    let urgentMachineIds: Set<string> | undefined;
    if (!playerCarried) {
      // Stations the player specifically needs to visit: pending orders not yet cooking
      const ids = this.customerSys.customers
        .filter(c => c.active
          && (c.aiState === 'order_taken' || c.aiState === 'waiting_food')
          && !this.kitchen.stations.some(s => s.isCooking && s.currentOrderId === c.customerId))
        .map(c => c.order?.machines?.[0])
        .filter((m): m is string => !!m);
      if (ids.length > 0) urgentMachineIds = new Set(ids);
    }
    this.kitchen.update(delta, this.customerSys.customers, playerCarried, urgentMachineIds);

    const ctx = this.scanInteractables();
    this.currentInteraction = ctx;
    if (ctx.type !== 'none') {
      this.showInteractionPrompt(ctx);
    } else {
      this.hideInteractionPrompt();
    }

    // Delivery arrow: pulsing ▼ above the target customer when carrying food
    this.updateDeliveryArrow();

    this.dayProgress = Math.min(1, this.dayProgress + delta / DAY_DURATION_MS);
    const phase = this.dayProgress < 0.33 ? 'morning' : this.dayProgress < 0.66 ? 'afternoon' : 'evening';
    if (phase !== this.dayPhase) this.dayPhase = phase;
    this.updateDayLighting();

    if (!this.crisisTriggered && this.dayProgress >= this.crisisTriggerProgress && !this.dayEnded) {
      this.crisisTriggered = true;
      this.triggerCrisis();
    }

    this.uiRefreshTimer -= delta;
    if (this.uiRefreshTimer <= 0) {
      this.uiRefreshTimer = 500;
      this.emitUIUpdate();
    }

    this.autoSaveTimer -= delta;
    if (this.autoSaveTimer <= 0) {
      this.autoSaveTimer = 10000;
      this.saveCurrentState();
    }
  }
}
