import Phaser from 'phaser';
import {
  TILE, GAME_W, GAME_H, MAP_COLS, MAP_ROWS, COLORS, MENU_ITEMS,
  DAY_DURATION_MS, EMPLOYEE_NAMES,
  DECORATION_ITEMS, CAFE_TIERS, DecorationDef, PlacedDecoration,
  TABLE_SLOT_DEFS, TableSlotDef, EMPLOYEE_TYPES, EmployeeRole,
  INTERACTION_REACH, PET_COOLDOWN_MS, BOOKING_COST, MAX_BOOKINGS,
  DECORATION_REFUND_RATIO, MACHINE_DEFS,
} from '../constants';
import { MenuItemDef, CustomerType, InteractionContext, TableSlot, ShopState, OrderInfo, GameCommand } from '../types';
import { Player } from '../entities/Player';
import { Cat } from '../entities/Cat';
import { Employee } from '../entities/Employee';
import { loadGame, defaultSaveState, saveGame } from '../systems/SaveSystem';
import { Pathfinder } from '../systems/Pathfinder';
import { KitchenSystem, Station } from '../systems/KitchenSystem';
import { CustomerSystem } from '../systems/CustomerSystem';

// ─────────────────────────────────────────────────────────────────────────────
// MAP DEFINITION  —  Central Kitchen Island layout
// Tile codes: 0=space/moon, 1=floor, 2=wall, 3=window, 4=counter, 5=door, 6=kitchen
//
// Island (cols 10-19, rows 5-10):
//   Row 5      : counter top (full width)
//   Rows 6-9   : counter walls (cols 10,19) + kitchen interior (cols 11-18)
//   Row 10     : counter walls (cols 10,19) + open pass-through (cols 11-18)
// Dining left  : cols 1-9   rows 4-14
// Dining right : cols 20-28 rows 4-14
// Dining bottom: cols 1-28  rows 11-14
// ─────────────────────────────────────────────────────────────────────────────
const MAP: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 0  space
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 1  space
  [2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2], // 2  windows
  [2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2], // 3  windows
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2], // 4  dining
  [2,1,1,1,1,1,1,1,1,1,4,4,4,4,4,4,4,4,4,4,1,1,1,1,1,1,1,1,1,2], // 5  dining + island counter top
  [2,1,1,1,1,1,1,1,1,1,4,6,6,6,6,6,6,6,6,4,1,1,1,1,1,1,1,1,1,2], // 6  island walls + kitchen
  [2,1,1,1,1,1,1,1,1,1,1,6,6,6,6,6,6,6,6,1,1,1,1,1,1,1,1,1,1,2], // 7  open sides (col10,19=floor)
  [2,1,1,1,1,1,1,1,1,1,1,6,6,6,6,6,6,6,6,1,1,1,1,1,1,1,1,1,1,2], // 8  open sides (col10,19=floor)
  [2,1,1,1,1,1,1,1,1,1,4,6,6,6,6,6,6,6,6,4,1,1,1,1,1,1,1,1,1,2], // 9  island + kitchen
  [2,1,1,1,1,1,1,1,1,1,4,1,1,1,1,1,1,1,1,4,1,1,1,1,1,1,1,1,1,2], // 10 island pass-through bottom
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2], // 11 dining
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2], // 12 dining
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2], // 13 dining
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2], // 14 dining
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,5,5,5,5,2,2,2,2,2,2,2,2,2,2,2,2], // 15 front wall + door
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 16 moon exterior
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 17 moon exterior
];

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
  private dayEnded = false;
  private dayEndShown = false;
  private isTransitioningDay = false;

  private uiRefreshTimer = 0;
  private pathfinder!: Pathfinder;
  private customerPathfinder!: Pathfinder;
  private audioCtx: AudioContext | null = null;
  private deliveryArrow?: Phaser.GameObjects.Text;
  private catPetCooldowns = new Map<number, number>();
  private employeeDeliveryIds = new Set<number>();

  // Store / decoration system
  private isStorePanelOpen = false;
  private pendingDecorationDef: DecorationDef | null = null;
  private ghostSprite: Phaser.GameObjects.Image | null = null;
  private decorateOverlayText: Phaser.GameObjects.Text | null = null;
  private decorationSprites = new Map<string, Phaser.GameObjects.Image>();
  private occupiedDecoTiles = new Set<string>();
  private hardBlockedTiles = new Set<string>();
  private currentTierLevel = 1;
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
    this.interactionPrompt = undefined;
    this.currentInteraction = { type: 'none', label: '' };
    this.isStorePanelOpen = false;
    this.pendingDecorationDef = null;
    this.ghostSprite = null;
    this.decorateOverlayText = null;
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

    const saved = loadGame() ?? defaultSaveState();
    this.money = saved.money;
    this.reputation = saved.reputation;
    this.day = saved.day;
    this.totalServed = saved.totalServed;
    this.popularityHistory = saved.popularityHistory ?? [];
    this.shopState = saved.shop ?? {
      catToys: 0, catTrees: 0, employees: 0,
      placedDecorations: [], ownedTableSlotIds: [0, 1, 2],
      cooks: 0, guards: 0, caterers: 0,
      ownedRecipeIds: ['moon_mocha', 'zerog_latte'],
      dailyMenuIds: ['moon_mocha', 'zerog_latte'],
      ownedMachines: ['espresso_machine'],
    };
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

    this.player = new Player(this, 14 * TILE + TILE / 2, 8 * TILE + TILE / 2);
    this.player.onInteract = () => this.handleInteraction();

    this.physics.add.collider(this.player, this.wallGroup);
    this.physics.add.collider(this.player, this.furnitureGroup);

    this.spawnCats(saved.cats);
    this.spawnEmployees();
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
    this.cameras.main.fadeIn(800, 5, 5, 16);

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
      else if (this.pendingDecorationDef) {
        this.pendingDecorationDef = null;
        this.ghostSprite?.destroy(); this.ghostSprite = null;
        this.decorateOverlayText?.destroy(); this.decorateOverlayText = null;
      } else { this.goToMenu(); }
    });

    // F key — toggle store panel (S and D are reserved for WASD movement)
    const toggleStore = () => {
      if (this.isStorePanelOpen) { this.closeStorePanel(); }
      else { this.openStorePanel(); }
    };
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F).on('down', toggleStore);

    this.game.events.on('game_event', (cmd: GameCommand) => {
      if (cmd.type === 'start_placement') {
        const def = DECORATION_ITEMS.find(d => d.id === cmd.defId);
        if (def) { this.pendingDecorationDef = def; this.refreshGhostSprite(); }
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
      }
    }, this);

    this.game.events.on('go_menu', this.goToMenu, this);

    this.input.on('pointerdown', this.handleTap, this);

    this.events.once('shutdown', () => {
      this.game.events.off('go_menu', this.goToMenu, this);
      this.game.events.off('game_event', undefined, this);
      this.input.off('pointerdown', this.handleTap, this);
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // MAP BUILDING
  // ─────────────────────────────────────────────────────────────────────

  private buildMap(): void {
    this.wallGroup = this.physics.add.staticGroup();

    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const tileType = MAP[row][col];
        const wx = col * TILE;
        const wy = row * TILE;
        let texKey = 'tile_floor';

        switch (tileType) {
          case 0: texKey = row <= 1 ? 'tile_space' : 'tile_moon'; break;
          case 1: texKey = (col + row) % 2 === 0 ? 'tile_floor' : 'tile_floor_dark'; break;
          case 2: texKey = 'tile_wall'; break;
          case 3: texKey = 'tile_window'; break;
          case 4: texKey = 'tile_counter'; break;
          case 5: texKey = 'tile_floor'; break;
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
    TABLE_SLOT_DEFS.filter(s => owned.has(s.id)).forEach(slot => this.buildTableSlot(slot));
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

      this.add.text(wx, wy - 20, `T${slot.id + 1}`, {
        fontSize: '10px', color: '#FFE8B0', fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#3A1A00', strokeThickness: 3,
      }).setOrigin(0.5, 0.5).setDepth(4.5);

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

      this.add.text(wx, wy - 20, `T${slot.id + 1}`, {
        fontSize: '10px', color: '#FFE8B0', fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#3A1A00', strokeThickness: 3,
      }).setOrigin(0.5, 0.5).setDepth(4.5);

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
      this.pathfinder.blockRect(body.x, body.y, body.width, body.height);
      this.customerPathfinder.blockRect(body.x, body.y, body.width, body.height);
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
      { col: 1,  row: 13 }, { col: 27, row: 13 },
      { col: 1,  row: 5  }, { col: 27, row: 5  },
    ];
    bedPositions.forEach(pos => {
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE/2, 'obj_cat_bed').setDepth(1).setOrigin(0.5, 0.7);
    });
  }

  private buildDecorations(): void {
    const tier = this.getCurrentTier().level;

    // ── Sky objects (tier 2+) ─────────────────────────────────────
    if (tier >= 2) {
      const moonX = 6 * TILE;
      const moonY = 2.5 * TILE;
      const moonG = this.add.graphics().setDepth(1.5);
      moonG.fillStyle(COLORS.MOON_LIGHT, 0.6); moonG.fillCircle(moonX, moonY, 20);
      moonG.fillStyle(COLORS.MOON_DARK, 0.8); moonG.fillCircle(moonX, moonY, 18);
      moonG.fillStyle(COLORS.MOON_GRAY, 1); moonG.fillCircle(moonX - 4, moonY - 3, 14);
    }

    if (tier >= 3) {
      const earthX = 22 * TILE;
      const earthY = 2.5 * TILE;
      const earth = this.add.graphics().setDepth(1.5);
      earth.fillStyle(COLORS.EARTH_OCEAN, 0.08); earth.fillCircle(earthX, earthY, 56);
      earth.fillStyle(COLORS.EARTH_OCEAN, 1);    earth.fillCircle(earthX, earthY, 42);
      earth.fillStyle(COLORS.EARTH_LAND, 1);
      earth.fillEllipse(earthX - 10, earthY - 14, 26, 20);
      earth.fillEllipse(earthX + 12, earthY + 10, 22, 16);
      earth.fillEllipse(earthX - 14, earthY + 12, 16, 14);
      earth.fillStyle(COLORS.EARTH_CLOUD, 0.88);
      earth.fillEllipse(earthX - 2, earthY - 24, 30, 12);
      earth.fillEllipse(earthX + 14, earthY, 22, 10);
      earth.fillEllipse(earthX - 18, earthY + 2, 18, 8);

      const nebula = this.add.graphics().setDepth(1.4).setBlendMode(Phaser.BlendModes.ADD);
      nebula.fillStyle(0xFF6600, 0.04); nebula.fillCircle(15 * TILE, 2 * TILE, 200);
      nebula.fillStyle(0x4400AA, 0.06); nebula.fillCircle(20 * TILE, 3 * TILE, 160);
    }

    // ── Food bowls (always — for the cats) ───────────────────────
    [{ col: 2, row: 14 }, { col: 26, row: 14 }].forEach(pos => {
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE/2, 'obj_food_bowl').setDepth(2).setOrigin(0.5, 0.7);
    });

    // ── Cat toys / trees (owned items, always) ───────────────────
    const toyPositions = [
      { col: 3, row: 13 }, { col: 25, row: 13 },
      { col: 3, row: 6  }, { col: 25, row: 6  },
    ];
    for (let i = 0; i < Math.min(this.shopState.catToys, toyPositions.length); i++) {
      const pos = toyPositions[i];
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE/2, 'obj_cat_toy').setDepth(3).setOrigin(0.5, 1);
    }
    const treePositions = [{ col: 8, row: 4 }, { col: 20, row: 4 }];
    for (let i = 0; i < Math.min(this.shopState.catTrees, treePositions.length); i++) {
      const pos = treePositions[i];
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE, 'obj_cat_tree').setDepth(3).setOrigin(0.5, 1);
    }

    // ── Plants (tier 3+) ─────────────────────────────────────────
    if (tier >= 3) {
      const plantPositions = [
        { col: 1, row: 4 }, { col: 28, row: 4 },
        { col: 1, row: 14 }, { col: 28, row: 14 },
        { col: 1, row: 9 }, { col: 28, row: 9 },
      ];
      plantPositions.forEach(pos => {
        this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE, 'obj_plant').setDepth(3).setOrigin(0.5, 1);
      });
    }

    // ── Ambient light pools (tier 2+, strengthen at tier 3+) ─────
    if (tier >= 2) {
      const lightAlpha = tier >= 3 ? 0.055 : 0.022;
      const lightGraphics = this.add.graphics().setDepth(0.5).setBlendMode(Phaser.BlendModes.ADD);
      const lightPositions: number[][] = tier >= 3
        ? [
            [4 * TILE, 8 * TILE],   [8 * TILE, 8 * TILE],
            [4 * TILE, 12 * TILE],  [8 * TILE, 12 * TILE],
            [22 * TILE, 8 * TILE],  [26 * TILE, 8 * TILE],
            [22 * TILE, 12 * TILE], [26 * TILE, 12 * TILE],
            [8 * TILE, 13 * TILE],  [15 * TILE, 13 * TILE], [22 * TILE, 13 * TILE],
            [15 * TILE, 7.5 * TILE],
          ]
        : [
            [4 * TILE, 10 * TILE],  [26 * TILE, 10 * TILE],
            [15 * TILE, 7.5 * TILE],
          ];
      lightPositions.forEach(([lx, ly]) => {
        lightGraphics.fillStyle(0xFF8800, lightAlpha);
        lightGraphics.fillCircle(lx, ly, 72);
      });
    }

    // ── Kitchen label (always) ────────────────────────────────────
    this.add.text(15 * TILE, 5.5 * TILE, 'KITCHEN', {
      fontSize: '11px', color: '#C8920A', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5, 0.5).setDepth(2).setAlpha(0.6);
  }

  private buildExteriorDecor(): void {
    const tier = this.getCurrentTier().level;

    // Tier 1 — bare moon surface, nothing at all
    if (tier < 2) return;

    // ── Tier 2+: basic rocks and craters ─────────────────────────
    const craterG = this.add.graphics().setDepth(0.5);
    [
      [4 * TILE, 16 * TILE + 14],
      [27 * TILE, 17 * TILE + 10],
    ].forEach(([cx, cy]) => {
      craterG.fillStyle(COLORS.MOON_DARK, 1); craterG.fillCircle(cx, cy, 10);
      craterG.fillStyle(COLORS.MOON_LIGHT, 0.6); craterG.fillCircle(cx - 3, cy - 3, 4);
    });

    const tier2Rocks: Array<{ col: number; row: number; big: boolean }> = [
      { col: 1,  row: 16, big: true  },
      { col: 25, row: 16, big: true  },
    ];
    tier2Rocks.forEach(r => {
      this.add.sprite(r.col * TILE + TILE/2, r.row * TILE + TILE/2, r.big ? 'obj_moon_rock_lg' : 'obj_moon_rock_sm')
        .setDepth(2).setOrigin(0.5, 0.8);
    });

    if (tier < 3) return;

    // ── Tier 3+: flag, more rocks, footprints ────────────────────
    const tier3Rocks: Array<{ col: number; row: number; big: boolean }> = [
      { col: 5,  row: 17, big: false },
      { col: 20, row: 17, big: false },
      { col: 28, row: 17, big: false },
      { col: 10, row: 16, big: false },
      { col: 18, row: 16, big: false },
    ];
    tier3Rocks.forEach(r => {
      this.add.sprite(r.col * TILE + TILE/2, r.row * TILE + TILE/2, 'obj_moon_rock_sm')
        .setDepth(2).setOrigin(0.5, 0.8);
    });

    // Third crater
    craterG.fillStyle(COLORS.MOON_DARK, 1); craterG.fillCircle(13 * TILE, 17 * TILE + 6, 10);
    craterG.fillStyle(COLORS.MOON_LIGHT, 0.6); craterG.fillCircle(13 * TILE - 3, 17 * TILE + 3, 4);

    this.add.sprite(9 * TILE + TILE/2, 16 * TILE, 'obj_moon_flag').setDepth(3).setOrigin(0.5, 1);

    const footG = this.add.graphics().setDepth(1.5).setAlpha(0.5);
    footG.fillStyle(COLORS.MOON_DARK, 1);
    for (let i = 0; i < 8; i++) {
      const fx = 15 * TILE + (i % 2 === 0 ? -6 : 6);
      const fy = 15 * TILE + 20 + i * 12;
      footG.fillEllipse(fx, fy, 8, 5);
    }

    if (tier < 4) return;

    // ── Tier 4+: rover, space-side rocks, queue velvet rope ──────
    this.add.sprite(23 * TILE, 16 * TILE + 4, 'obj_lunar_rover').setDepth(3).setOrigin(0.5, 1);

    [{ col: 0, row: 4 }, { col: 0, row: 10 }, { col: 29, row: 6 }, { col: 29, row: 12 }].forEach(r => {
      this.add.sprite(r.col * TILE + TILE/2, r.row * TILE + TILE/2, 'obj_moon_rock_sm').setDepth(2).setOrigin(0.5, 0.8);
    });

    // Queue velvet rope poles flanking the entrance
    this.add.sprite(12.5 * TILE, 15.8 * TILE, 'obj_queue_pole').setDepth(3).setOrigin(0.5, 1);
    this.add.sprite(17.5 * TILE, 15.8 * TILE, 'obj_queue_pole').setDepth(3).setOrigin(0.5, 1);
    // Rope connecting them
    const ropeG = this.add.graphics().setDepth(2.5);
    ropeG.lineStyle(2, 0xAA2233, 0.85);
    ropeG.strokeRect(12.5 * TILE, 15.2 * TILE, 5 * TILE, 0);
    // bezier-style rope droop
    ropeG.beginPath();
    ropeG.moveTo(12.5 * TILE, 15.2 * TILE);
    ropeG.lineTo(15 * TILE, 15.5 * TILE);
    ropeG.lineTo(17.5 * TILE, 15.2 * TILE);
    ropeG.strokePath();

    if (tier < 5) return;

    // ── Tier 5+: glowing entrance and dome glow ──────────────────
    const domeGlow = this.add.graphics().setDepth(0.6).setBlendMode(Phaser.BlendModes.ADD);
    domeGlow.fillStyle(0x4488FF, 0.08);
    domeGlow.fillCircle(15 * TILE, 15 * TILE, 120);
    domeGlow.fillStyle(0x88CCFF, 0.04);
    domeGlow.fillCircle(15 * TILE, 15 * TILE, 200);
  }

  // ─────────────────────────────────────────────────────────────────────
  // DECORATION / PLACEMENT SYSTEM
  // ─────────────────────────────────────────────────────────────────────

  private buildHardBlockedTiles(): void {
    // Mark tiles under owned furniture as decoration-blocked
    const owned = new Set(this.shopState.ownedTableSlotIds ?? [0, 1, 2]);
    TABLE_SLOT_DEFS.filter(s => owned.has(s.id)).forEach(slot => {
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
    [[1,13],[27,13],[1,5],[27,5]].forEach(([c,r]) => this.hardBlockedTiles.add(`${c},${r}`));
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
        this.pathfinder.blockRect(body.x, body.y, body.width, body.height);
        this.customerPathfinder.blockRect(body.x, body.y, body.width, body.height);
      }

      const tableId = 100 + this.tables.filter(t => t.id >= 100).length;
      this.tables.push({ id: tableId, worldX: wx, worldY: wy,
        seats: [{ seatX: wx, seatY: wy, occupied: false, customerId: null }] });

      const label = this.add.text(wx, wy - 16, `T${tableId + 1}`, {
        fontSize: '9px', color: '#FFDD88', fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#3A1A00', strokeThickness: 3,
      }).setOrigin(0.5, 0.5).setDepth(4.5);
      this.tableLabels.set(`${tileX},${tileY}`, label);
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
      this.pathfinder.blockRect(body.x, body.y, body.width, body.height);
      this.customerPathfinder.blockRect(body.x, body.y, body.width, body.height);
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

    // Table label
    const label = this.add.text(wx, wy - 20, `T${tableId + 1}`, {
      fontSize: '10px', color: '#FFE8B0', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#3A1A00', strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setDepth(4.5);
    this.tableLabels.set(`${tileX},${tileY}`, label);

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
    return (MENU_ITEMS as unknown as MenuItemDef[])
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

    this.decorateOverlayText = this.add.text(GAME_W / 2, 62, 'STORE  —  F or ESC to close', {
      fontSize: '13px', color: '#FFD700', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(105).setAlpha(0);
    this.tweens.add({ targets: this.decorateOverlayText, alpha: 1, duration: 300 });
  }

  private closeStorePanel(): void {
    if (!this.isStorePanelOpen) return;
    this.isStorePanelOpen = false;
    this.pendingDecorationDef = null;
    this.ghostSprite?.destroy(); this.ghostSprite = null;
    this.decorateOverlayText?.destroy(); this.decorateOverlayText = null;
    this.physics.world.resume();
    this.time.paused = false;
  }

  private refreshGhostSprite(): void {
    this.ghostSprite?.destroy(); this.ghostSprite = null;
    this.decorateOverlayText?.destroy(); this.decorateOverlayText = null;
    if (!this.pendingDecorationDef) return;
    this.ghostSprite = this.add.image(-999, -999, this.pendingDecorationDef.spriteKey)
      .setAlpha(0.55).setDepth(150);
    this.decorateOverlayText = this.add.text(GAME_W / 2, 62, 'Click floor to place  ·  ESC to cancel', {
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
      const pd: PlacedDecoration = { defId: def.id, tileX, tileY };
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
    } else {
      const key = `${tileX},${tileY}`;
      if (this.occupiedDecoTiles.has(key)) {
        const idx = (this.shopState.placedDecorations ?? []).findIndex(p => p.tileX === tileX && p.tileY === tileY);
        if (idx === -1) return;
        const pd = this.shopState.placedDecorations[idx];
        const def = DECORATION_ITEMS.find(d => d.id === pd.defId);

        if (def?.seats) {
          // Check nobody is seated
          const tx = pd.tileX * TILE + TILE / 2;
          const ty = pd.tileY * TILE + TILE / 2;
          const tableSlot = this.tables.find(t => t.worldX === tx && t.worldY === ty && t.id >= 100);
          if (tableSlot?.seats.some(s => s.customerId !== null)) {
            this.showFloatingText(tileX * TILE + TILE/2, tileY * TILE, 'Someone is seated!', '#FF6666');
            return;
          }
          // Remove table slot and physics
          if (tableSlot) this.tables.splice(this.tables.indexOf(tableSlot), 1);
          const tBody = this.tableFurnitureBodies.get(key);
          if (tBody) {
            const body = tBody.body as Phaser.Physics.Arcade.StaticBody;
            if (body) {
              this.pathfinder.unblockRect(body.x, body.y, body.width, body.height);
              this.customerPathfinder.unblockRect(body.x, body.y, body.width, body.height);
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
      }
    }
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
    const item = (MENU_ITEMS as unknown as MenuItemDef[]).find(m => m.id === itemId);
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

  // ─────────────────────────────────────────────────────────────────────
  // CATS
  // ─────────────────────────────────────────────────────────────────────

  private spawnCats(catData: ReturnType<typeof defaultSaveState>['cats']): void {
    const catPositions = [
      { col: 2,  row: 12 }, { col: 26, row: 12 },
      { col: 2,  row: 6  }, { col: 26, row: 6  },
    ];
    const bounds = new Phaser.Geom.Rectangle(TILE, 4 * TILE, 27 * TILE, 10 * TILE);

    catData.forEach((data, i) => {
      const pos = catPositions[i % catPositions.length];
      const cat = new Cat(
        this, pos.col * TILE + TILE/2, pos.row * TILE + TILE/2, data, bounds,
      );
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

  private spawnOneEmployee(index: number): void {
    const empPositions = [
      { col: 3, row: 12 }, { col: 25, row: 12 }, { col: 6, row: 11 },
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

    for (const stn of this.kitchen.stations) {
      const dist = Phaser.Math.Distance.Between(px, py, stn.worldX, stn.worldY);
      const vertDist = Math.abs(py - (stn.worldY + TILE));
      if (dist < REACH && vertDist < 40) {
        if (stn.isCooking && stn.cookProgress >= 1) {
          return { type: 'station', label: `Pick up ${this.kitchen.getReadyItemName(stn.id) ?? 'order'}`, stationId: stn.id };
        }
        if (!stn.isCooking && !this.player.isCarryingFood()) {
          const pending = this.kitchen.getPendingOrder(stn.machineId, this.customerSys.customers, carriedId);
          if (pending) {
            return { type: 'station', label: `Cook ${pending.item.name}`, stationId: stn.id };
          }
        }
      }
    }

    for (const c of this.customerSys.customers) {
      if (!c.active) continue;
      const dist = Phaser.Math.Distance.Between(px, py, c.x, c.y);
      if (dist < REACH) {
        if (c.aiState === 'waiting_order') {
          if (!c.order) continue;
          return { type: 'customer_order', label: `Take order: ${c.order.name}`, targetId: c.customerId };
        }
        if (c.aiState === 'waiting_food' && this.player.isCarryingFood()) {
          const carried = this.player.getCarriedFoodId();
          if (carried && c.order?.id === carried) {
            return { type: 'customer_deliver', label: `Deliver ${c.order.name}`, targetId: c.customerId };
          }
        }
      }
    }

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
          if (itemId) { this.player.pickUpFood(itemId); this.playCook(); }
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
        break;
      }

      case 'customer_deliver': {
        const c = this.customerSys.customers.find(cu => cu.customerId === ctx.targetId);
        if (!c || c.aiState !== 'waiting_food') return;
        const carried = this.player.dropFood();
        if (carried && c.order?.id === carried) {
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
        }
        break;
      }

      case 'cat': {
        const cat = this.cats.find(k => k.catId === ctx.targetId);
        if (cat) {
          const lastPet = this.catPetCooldowns.get(cat.catId) ?? -Infinity;
          if (this.time.now - lastPet < PET_COOLDOWN_MS) {
            this.showFloatingText(cat.x, cat.y - 30, 'Purring...', '#AACCDD');
          } else {
            cat.pet();
            this.playPop();
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
    this.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => {
        const col = Phaser.Math.Between(1, 28);
        const row = Phaser.Math.Between(0, 3);
        if (MAP[row]?.[col] !== 3 && MAP[row]?.[col] !== 0) return;
        const wx = col * TILE + Math.random() * TILE;
        const wy = row * TILE + Math.random() * TILE;
        const star = this.add.sprite(wx, wy, 'particle_star')
          .setScale(0.3 + Math.random() * 0.5)
          .setAlpha(0).setDepth(1);
        this.tweens.add({
          targets: star, alpha: { from: 0, to: 0.8 },
          duration: 200, yoyo: true,
          onComplete: () => star.destroy(),
        });
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // DELIVERY ARROW
  // ─────────────────────────────────────────────────────────────────────

  private updateDeliveryArrow(): void {
    const carriedId = this.player?.getCarriedFoodId();
    if (!carriedId) {
      this.deliveryArrow?.setVisible(false);
      return;
    }
    const target = this.customerSys.customers.find(c => c.active && c.aiState === 'waiting_food' && c.order?.id === carriedId);
    if (!target) {
      this.deliveryArrow?.setVisible(false);
      return;
    }

    if (!this.deliveryArrow) {
      this.deliveryArrow = this.add.text(0, 0, '▼', {
        fontSize: '14px', color: '#FFD700', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(55);
    }

    const bounce = Math.sin(this.time.now * 0.006) * 3;
    this.deliveryArrow.setPosition(target.x, target.y - 56 + bounce).setVisible(true);
  }

  // ─────────────────────────────────────────────────────────────────────
  // INTERACTION PROMPT
  // ─────────────────────────────────────────────────────────────────────

  private showInteractionPrompt(ctx: InteractionContext): void {
    if (!this.interactionPrompt) {
      const container = this.add.container(0, 0).setDepth(100);
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.UI_PANEL, 0.92);
      bg.fillRoundedRect(0, 0, 240, 32, 6);
      bg.lineStyle(1, COLORS.UI_GOLD, 0.8);
      bg.strokeRoundedRect(0, 0, 240, 32, 6);
      const prompt = this.add.sprite(10, 16, 'ui_e_prompt').setOrigin(0, 0.5).setScale(0.9);
      const txt = this.add.text(38, 16, '', {
        fontSize: '12px', color: '#FFEEDD', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0, 0.5);
      container.add([bg, prompt, txt]);
      container.setData('txt', txt);
      container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 240, 32), Phaser.Geom.Rectangle.Contains);
      container.on('pointerdown', () => this.handleInteraction());
      this.interactionPrompt = container;
    }
    const txt = this.interactionPrompt.getData('txt') as Phaser.GameObjects.Text;
    txt.setText(ctx.label);
    const promptX = Phaser.Math.Clamp(this.player.x - 120, 4, GAME_W - 244);
    const promptY = Phaser.Math.Clamp(this.player.y - 56, 60, GAME_H - 36);
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
    });
  }

  private startNextDay(): void {
    if (this.isTransitioningDay) return;
    this.isTransitioningDay = true;
    this.day++;
    this.dayProgress = 0;
    this.dayEnded = false;
    this.dayEndShown = false;

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

  // ─────────────────────────────────────────────────────────────────────
  // FLOATING TEXT + TUTORIAL
  // ─────────────────────────────────────────────────────────────────────

  private showTutorialHint(): void {
    const hints = [
      { y: GAME_H / 2 - 30, text: 'Walk to a customer and press E to take their order!' },
      { y: GAME_H / 2 + 10, text: 'Then cook at the matching station and deliver the food.' },
    ];
    hints.forEach((h, i) => {
      const t = this.add.text(GAME_W / 2, h.y, h.text, {
        fontSize: '13px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 3, backgroundColor: '#00000066',
        padding: { x: 8, y: 4 },
      }).setOrigin(0.5).setDepth(190).setAlpha(0);
      this.tweens.add({
        targets: t, alpha: 1, duration: 400, delay: i * 200,
        onComplete: () => {
          this.time.delayedCall(4000, () => {
            this.tweens.add({ targets: t, alpha: 0, duration: 600, onComplete: () => t.destroy() });
          });
        },
      });
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
    this.pendingDecorationDef = null;
    this.ghostSprite?.destroy(); this.ghostSprite = null;
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

    if (this.isStorePanelOpen) {
      // Allow clicks in the game area (left of store panel) for decoration placement
      if (this.pendingDecorationDef && pointer.y > 58 && pointer.x < GAME_W - 300) {
        this.handleDecorateClick(pointer.worldX, pointer.worldY);
      }
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
        this.pathfinder.blockRect(body.x, body.y, body.width, body.height);
        this.customerPathfinder.blockRect(body.x, body.y, body.width, body.height);
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
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // UPDATE LOOP
  // ─────────────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (this.dayEnded && this.dayEndShown) return;

    // Ghost cursor for decor placement
    if (this.ghostSprite && this.pendingDecorationDef) {
      const ptr = this.input.activePointer;
      const tileX = Math.floor(ptr.worldX / TILE);
      const tileY = Math.floor(ptr.worldY / TILE);
      this.ghostSprite.setPosition(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2);
      this.ghostSprite.setTint(this.isValidDecoTile(tileX, tileY) ? 0x88FF88 : 0xFF4444);
    }

    // Game is fully frozen while store panel is open
    if (this.isStorePanelOpen) return;

    this.player.update();

    const customerPositions = this.customerSys.customers
      .filter(c => c.active && (c.aiState === 'seated' || c.aiState === 'eating'))
      .map(c => ({ x: c.x, y: c.y, id: c.customerId }));

    this.cats.forEach(cat => {
      cat.update(delta, customerPositions);
      this.customerSys.customers.forEach(c => {
        if (c.active && (c.aiState === 'seated' || c.aiState === 'eating')) {
          if (cat.isNearPosition(c.x, c.y, 36) && cat.happiness > 40) {
            c.boostHappiness(delta * 0.008);
          }
        }
      });
    });

    const waitingForOrders = this.customerSys.getWaitingForOrders();
    const readyStations = this.kitchen.getReadyStations(this.customerSys.customers);

    this.employees.forEach(emp => emp.update(
      delta, waitingForOrders, this.employeeAssignedIds, readyStations, this.employeeDeliveryIds,
    ));

    this.customerSys.update(delta, this.dayEnded, this.dayPhase, this.reputation, this.day);



    this.kitchen.update(delta, this.customerSys.customers, this.player.getCarriedFoodId());

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
