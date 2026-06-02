import Phaser from 'phaser';
import {
  TILE, GAME_W, GAME_H, MAP_COLS, MAP_ROWS, COLORS, MENU_ITEMS,
  DAY_DURATION_MS, CUSTOMER_SPAWN_MS, EMPLOYEE_NAMES,
  DECORATION_ITEMS, CAFE_TIERS, DecorationDef, PlacedDecoration,
  SHOP_ITEMS, TABLE_SLOT_DEFS, TableSlotDef, EMPLOYEE_TYPES, EmployeeRole,
} from '../constants';
import { MenuItemDef, CustomerType, InteractionContext, TableSlot, TableSeat, ShopState, OrderInfo } from '../types';
import { Player } from '../entities/Player';
import { Cat } from '../entities/Cat';
import { Customer } from '../entities/Customer';
import { Employee } from '../entities/Employee';
import { loadGame, defaultSaveState, saveGame } from '../systems/SaveSystem';
import { Pathfinder } from '../systems/Pathfinder';

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

interface Station {
  id: number;
  type: 'coffee' | 'stove' | 'prep';
  worldX: number;
  worldY: number;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  isCooking: boolean;
  cookProgress: number;
  cookTargetMs: number;
  progressBg?: Phaser.GameObjects.Sprite;
  progressFill?: Phaser.GameObjects.Graphics;
  readyFoodSprite?: Phaser.GameObjects.Sprite;
  currentOrderId: number | null;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private cats: Cat[] = [];
  private customers: Customer[] = [];
  private stations: Station[] = [];
  private tables: TableSlot[] = [];
  private employees: Employee[] = [];
  private employeeAssignedIds = new Set<number>();

  private wallGroup!: Phaser.Physics.Arcade.StaticGroup;
  private furnitureGroup!: Phaser.Physics.Arcade.StaticGroup;

  private money = 150;
  private reputation = 10;
  private day = 1;
  private dayProgress = 0;
  private totalServed = 0;
  private nextCustomerId = 1;
  private shopState: ShopState = {
    catToys: 0, catTrees: 0, employees: 0, extraMachines: 0,
    placedDecorations: [],
    ownedTableSlotIds: [0, 1, 2],
    cooks: 0, guards: 0, caterers: 0,
  };

  private interactionPrompt?: Phaser.GameObjects.Container;
  private currentInteraction: InteractionContext = { type: 'none', label: '' };

  private customerSpawnTimer = 0;
  private autoSaveTimer = 0;
  private autoCookTimer = 0;
  private dayPhase: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
  private dayEnded = false;
  private dayEndShown = false;

  private steamEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  private trashCanX = 0;
  private trashCanY = 0;

  private shopRefreshFns: Array<(hover?: boolean) => void> = [];
  private uiRefreshTimer = 0;
  private pathfinder!: Pathfinder;
  private customerPathfinder!: Pathfinder;

  // Store / decoration system
  private isStorePanelOpen = false;
  private pendingDecorationDef: DecorationDef | null = null;
  private ghostSprite: Phaser.GameObjects.Image | null = null;
  private decorateOverlayText: Phaser.GameObjects.Text | null = null;
  private decorationSprites = new Map<string, Phaser.GameObjects.Image>();
  private occupiedDecoTiles = new Set<string>();
  private hardBlockedTiles = new Set<string>();
  private currentTierLevel = 1;

  constructor() { super('GameScene'); }

  create(): void {
    // Reset mutable state
    this.customers = [];
    this.stations = [];
    this.tables = [];
    this.cats = [];
    this.employees = [];
    this.employeeAssignedIds = new Set();
    this.shopRefreshFns = [];
    this.uiRefreshTimer = 0;
    this.autoCookTimer = 0;
    this.dayProgress = 0;
    this.dayEnded = false;
    this.dayEndShown = false;
    this.dayPhase = 'morning';
    this.nextCustomerId = 1;
    this.customerSpawnTimer = 0;
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

    const saved = loadGame() ?? defaultSaveState();
    this.money = saved.money;
    this.reputation = saved.reputation;
    this.day = saved.day;
    this.totalServed = saved.totalServed;
    this.shopState = saved.shop ?? {
      catToys: 0, catTrees: 0, employees: 0, extraMachines: 0,
      placedDecorations: [], ownedTableSlotIds: [0, 1, 2],
      cooks: 0, guards: 0, caterers: 0,
    };

    this.buildMap();
    this.buildFurniture();
    this.buildPathfinder();
    this.buildKitchenStations();
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
    this.setupSteam();
    this.setupSpaceAmbience();

    this.emitUIUpdate();
    this.cameras.main.fadeIn(800, 5, 5, 16);

    this.time.addEvent({
      delay: DAY_DURATION_MS,
      callback: this.endDay,
      callbackScope: this,
    });

    this.scheduleNextCustomer();

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC).on('down', () => {
      if (this.isStorePanelOpen) { this.closeStorePanel(); }
      else { this.goToMenu(); }
    });

    // S key (or D for backward compat) — toggle store panel
    const toggleStore = () => {
      if (this.isStorePanelOpen) {
        this.closeStorePanel();
        this.game.events.emit('game_event', { type: 'close_store_panel' });
      } else {
        this.openStorePanel();
        this.game.events.emit('game_event', { type: 'open_store_panel' });
      }
    };
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D).on('down', toggleStore);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S).on('down', toggleStore);

    this.game.events.on('game_event', (evt: {
      type: string; defId?: string; slotId?: number;
      role?: EmployeeRole; upgradeId?: string;
    }) => {
      if (evt.type === 'start_placement') {
        const def = DECORATION_ITEMS.find(d => d.id === evt.defId);
        if (def) { this.pendingDecorationDef = def; this.refreshGhostSprite(); }
      } else if (evt.type === 'close_store_panel') {
        this.closeStorePanel();
      } else if (evt.type === 'open_store_panel') {
        this.openStorePanel();
      } else if (evt.type === 'buy_table' && evt.slotId !== undefined) {
        this.handleBuyTable(evt.slotId);
      } else if (evt.type === 'hire_staff' && evt.role) {
        this.handleHireStaff(evt.role);
      } else if (evt.type === 'buy_kitchen' && evt.upgradeId) {
        this.handleBuyKitchen(evt.upgradeId);
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
  // KITCHEN
  // ─────────────────────────────────────────────────────────────────────

  private buildKitchenStations(): void {
    type StationDef = { col: number; row: number; type: 'coffee' | 'stove' | 'prep'; tex: string; label: string };

    const baseDefs: StationDef[] = [
      { col: 12, row: 7, type: 'coffee', tex: 'obj_coffee_machine', label: 'Coffee' },
      { col: 15, row: 7, type: 'stove',  tex: 'obj_stove',          label: 'Stove'  },
      { col: 17, row: 7, type: 'prep',   tex: 'obj_prep_counter',   label: 'Prep'   },
    ];
    const extraDefs: StationDef[] = [
      { col: 12, row: 8, type: 'coffee', tex: 'obj_coffee_machine', label: 'Coffee 2' },
      { col: 15, row: 8, type: 'stove',  tex: 'obj_stove',          label: 'Stove 2'  },
      { col: 17, row: 8, type: 'prep',   tex: 'obj_prep_counter',   label: 'Prep 2'   },
    ];

    const defs = this.shopState.extraMachines >= 1 ? [...baseDefs, ...extraDefs] : baseDefs;

    defs.forEach((def, i) => {
      const wx = def.col * TILE + TILE / 2;
      const wy = def.row * TILE + TILE / 2;

      const sprite = this.add.sprite(wx, wy - 4, def.tex).setDepth(4).setOrigin(0.5, 0.7);
      const label = this.add.text(wx, wy - 20, def.label, {
        fontSize: '10px', color: '#FFEEDD', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(5);

      this.stations.push({
        id: i, type: def.type, worldX: wx, worldY: wy,
        sprite, label, isCooking: false, cookProgress: 0,
        cookTargetMs: 0, currentOrderId: null,
      });
    });

    this.trashCanX = 18 * TILE + TILE / 2;
    this.trashCanY = 8 * TILE + TILE / 2;
    this.add.sprite(this.trashCanX, this.trashCanY, 'obj_trash_can').setDepth(4).setOrigin(0.5, 0.7);
    this.add.text(this.trashCanX, this.trashCanY - 16, 'Discard', {
      fontSize: '10px', color: '#998877', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(5);
  }

  private addExtraKitchenStations(): void {
    type StationDef = { col: number; row: number; type: 'coffee' | 'stove' | 'prep'; tex: string; label: string };
    const extraDefs: StationDef[] = [
      { col: 12, row: 8, type: 'coffee', tex: 'obj_coffee_machine', label: 'Coffee 2' },
      { col: 15, row: 8, type: 'stove',  tex: 'obj_stove',          label: 'Stove 2'  },
      { col: 17, row: 8, type: 'prep',   tex: 'obj_prep_counter',   label: 'Prep 2'   },
    ];
    const startId = this.stations.length;
    extraDefs.forEach((def, i) => {
      const wx = def.col * TILE + TILE / 2;
      const wy = def.row * TILE + TILE / 2;
      const sprite = this.add.sprite(wx, wy - 4, def.tex).setDepth(4).setOrigin(0.5, 0.7);
      const label = this.add.text(wx, wy - 20, def.label, {
        fontSize: '10px', color: '#FFEEDD', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 1).setDepth(5);
      this.stations.push({
        id: startId + i, type: def.type, worldX: wx, worldY: wy,
        sprite, label, isCooking: false, cookProgress: 0,
        cookTargetMs: 0, currentOrderId: null,
      });
    });
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
    const earthX = 22 * TILE;
    const earthY = 2.5 * TILE;
    const earth = this.add.graphics().setDepth(1.5);
    earth.fillStyle(COLORS.EARTH_OCEAN, 0.08); earth.fillCircle(earthX, earthY, 56);
    earth.fillStyle(COLORS.EARTH_OCEAN, 1); earth.fillCircle(earthX, earthY, 42);
    earth.fillStyle(COLORS.EARTH_LAND, 1);
    earth.fillEllipse(earthX - 10, earthY - 14, 26, 20);
    earth.fillEllipse(earthX + 12, earthY + 10, 22, 16);
    earth.fillEllipse(earthX - 14, earthY + 12, 16, 14);
    earth.fillStyle(COLORS.EARTH_CLOUD, 0.88);
    earth.fillEllipse(earthX - 2, earthY - 24, 30, 12);
    earth.fillEllipse(earthX + 14, earthY, 22, 10);
    earth.fillEllipse(earthX - 18, earthY + 2, 18, 8);

    const moonX = 6 * TILE;
    const moonY = 2.5 * TILE;
    const moonG = this.add.graphics().setDepth(1.5);
    moonG.fillStyle(COLORS.MOON_LIGHT, 0.6); moonG.fillCircle(moonX, moonY, 20);
    moonG.fillStyle(COLORS.MOON_DARK, 0.8); moonG.fillCircle(moonX, moonY, 18);
    moonG.fillStyle(COLORS.MOON_GRAY, 1); moonG.fillCircle(moonX - 4, moonY - 3, 14);

    const nebula = this.add.graphics().setDepth(1.4).setBlendMode(Phaser.BlendModes.ADD);
    nebula.fillStyle(0xFF6600, 0.04); nebula.fillCircle(15 * TILE, 2 * TILE, 200);
    nebula.fillStyle(0x4400AA, 0.06); nebula.fillCircle(20 * TILE, 3 * TILE, 160);

    const plantPositions = [
      { col: 1, row: 4 }, { col: 28, row: 4 },
      { col: 1, row: 14 }, { col: 28, row: 14 },
      { col: 1, row: 9 }, { col: 28, row: 9 },
    ];
    plantPositions.forEach(pos => {
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE, 'obj_plant').setDepth(3).setOrigin(0.5, 1);
    });

    [{ col: 2, row: 14 }, { col: 26, row: 14 }].forEach(pos => {
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE/2, 'obj_food_bowl').setDepth(2).setOrigin(0.5, 0.7);
    });

    const toyPositions = [
      { col: 3, row: 13 }, { col: 25, row: 13 },
      { col: 3, row: 6 },  { col: 25, row: 6 },
    ];
    for (let i = 0; i < Math.min(this.shopState.catToys, toyPositions.length); i++) {
      const pos = toyPositions[i];
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE/2, 'obj_cat_toy').setDepth(3).setOrigin(0.5, 1);
    }

    const treePositions = [
      { col: 8, row: 4 }, { col: 20, row: 4 },
    ];
    for (let i = 0; i < Math.min(this.shopState.catTrees, treePositions.length); i++) {
      const pos = treePositions[i];
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE, 'obj_cat_tree').setDepth(3).setOrigin(0.5, 1);
    }

    const lightGraphics = this.add.graphics().setDepth(0.5).setBlendMode(Phaser.BlendModes.ADD);
    const lightPositions = [
      [4 * TILE, 8 * TILE],   [8 * TILE, 8 * TILE],
      [4 * TILE, 12 * TILE],  [8 * TILE, 12 * TILE],
      [22 * TILE, 8 * TILE],  [26 * TILE, 8 * TILE],
      [22 * TILE, 12 * TILE], [26 * TILE, 12 * TILE],
      [8 * TILE,  13 * TILE], [15 * TILE, 13 * TILE], [22 * TILE, 13 * TILE],
      [15 * TILE, 7.5 * TILE],
    ];
    lightPositions.forEach(([lx, ly]) => {
      lightGraphics.fillStyle(0xFF8800, 0.055);
      lightGraphics.fillCircle(lx, ly, 72);
    });

    this.add.text(15 * TILE, 5.5 * TILE, 'KITCHEN', {
      fontSize: '11px', color: '#C8920A', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5, 0.5).setDepth(2).setAlpha(0.6);
  }

  private buildExteriorDecor(): void {
    const rocks: Array<{ col: number; row: number; big: boolean }> = [
      { col: 1,  row: 16, big: true  },
      { col: 5,  row: 17, big: false },
      { col: 20, row: 17, big: false },
      { col: 25, row: 16, big: true  },
      { col: 28, row: 17, big: false },
      { col: 10, row: 16, big: false },
      { col: 18, row: 16, big: false },
    ];
    rocks.forEach(r => {
      const tex = r.big ? 'obj_moon_rock_lg' : 'obj_moon_rock_sm';
      this.add.sprite(r.col * TILE + TILE/2, r.row * TILE + TILE/2, tex).setDepth(2).setOrigin(0.5, 0.8);
    });

    [ { col: 0, row: 4 }, { col: 0, row: 10 }, { col: 29, row: 6 }, { col: 29, row: 12 } ].forEach(r => {
      this.add.sprite(r.col * TILE + TILE/2, r.row * TILE + TILE/2, 'obj_moon_rock_sm').setDepth(2).setOrigin(0.5, 0.8);
    });

    this.add.sprite(9 * TILE + TILE/2, 16 * TILE, 'obj_moon_flag').setDepth(3).setOrigin(0.5, 1);
    this.add.sprite(23 * TILE, 16 * TILE + 4, 'obj_lunar_rover').setDepth(3).setOrigin(0.5, 1);

    const footG = this.add.graphics().setDepth(1.5).setAlpha(0.5);
    footG.fillStyle(COLORS.MOON_DARK, 1);
    for (let i = 0; i < 8; i++) {
      const fx = 15 * TILE + (i % 2 === 0 ? -6 : 6);
      const fy = 15 * TILE + 20 + i * 12;
      footG.fillEllipse(fx, fy, 8, 5);
    }

    const craterG = this.add.graphics().setDepth(0.5);
    [[4 * TILE, 16 * TILE + 14], [13 * TILE, 17 * TILE + 6], [27 * TILE, 17 * TILE + 10]].forEach(([cx, cy]) => {
      craterG.fillStyle(COLORS.MOON_DARK, 1); craterG.fillCircle(cx, cy, 10);
      craterG.fillStyle(COLORS.MOON_LIGHT, 0.6); craterG.fillCircle(cx - 3, cy - 3, 4);
    });
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
      const spr = this.add.image(wx, wy, def.spriteKey).setDepth(3.5 + wy / 10000);
      this.decorationSprites.set(`${pd.tileX},${pd.tileY}`, spr);
      this.occupiedDecoTiles.add(`${pd.tileX},${pd.tileY}`);
    }
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
    return (MENU_ITEMS as unknown as MenuItemDef[])
      .filter(item => tier.unlockedMenuIds.includes(item.id as any))
      .map(item => ({ ...item, price: Math.round(item.price * tier.priceMultiplier) }));
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
    // Freeze all physics bodies
    this.customers.forEach(c => (c.body as Phaser.Physics.Arcade.Body)?.setVelocity(0, 0));
    this.employees.forEach(e => (e.body as Phaser.Physics.Arcade.Body)?.setVelocity(0, 0));
    this.cats.forEach(cat => (cat.body as Phaser.Physics.Arcade.Body)?.setVelocity(0, 0));
    (this.player.body as Phaser.Physics.Arcade.Body)?.setVelocity(0, 0);
    this.physics.world.pause();

    this.decorateOverlayText = this.add.text(GAME_W / 2 - 150, 62, '✦ STORE — S/D or ESC to close', {
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
  }

  private refreshGhostSprite(): void {
    this.ghostSprite?.destroy(); this.ghostSprite = null;
    if (!this.pendingDecorationDef) return;
    this.ghostSprite = this.add.image(-999, -999, this.pendingDecorationDef.spriteKey)
      .setAlpha(0.55).setDepth(150);
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
      const spr = this.add.image(wx, wy, def.spriteKey).setDepth(3.5 + wy / 10000).setAlpha(0);
      this.tweens.add({ targets: spr, alpha: 1, duration: 250 });
      this.decorationSprites.set(`${tileX},${tileY}`, spr);

      this.showFloatingText(wx, wy - 20, `+${def.ambianceValue} ✦ ambiance`, '#FFDD44');
      this.showFloatingText(wx, wy + 4, `-${def.cost} ✦`, '#FF8888');
      this.playChime();
      this.checkTierUp();
      this.emitUIUpdate();
    } else {
      const key = `${tileX},${tileY}`;
      if (this.occupiedDecoTiles.has(key)) {
        const idx = (this.shopState.placedDecorations ?? []).findIndex(p => p.tileX === tileX && p.tileY === tileY);
        if (idx === -1) return;
        const pd = this.shopState.placedDecorations[idx];
        const def = DECORATION_ITEMS.find(d => d.id === pd.defId);
        const refund = def ? Math.floor(def.cost * 0.5) : 0;
        this.shopState.placedDecorations.splice(idx, 1);
        this.occupiedDecoTiles.delete(key);
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
    }

    this.showFloatingText(GAME_W / 2 - 150, GAME_H / 2 + 20, `${def.name} hired!`, '#60FF88');
    this.playChime();
    this.emitUIUpdate();
  }

  private handleBuyKitchen(upgradeId: string): void {
    if (upgradeId === 'extra_machines') {
      if (this.shopState.extraMachines >= 1) return;
      if (this.money < 180) {
        this.showFloatingText(GAME_W / 2, GAME_H / 2, 'Not enough ✦', '#FF6666');
        return;
      }
      this.money -= 180;
      this.shopState.extraMachines = 1;
      this.addExtraKitchenStations();
      this.showFloatingText(GAME_W / 2 - 150, GAME_H / 2, 'Extra machines added!', '#AAFFAA');
      this.playChime();
      this.emitUIUpdate();
    }
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
    const bounds = new Phaser.Geom.Rectangle(TILE, 11 * TILE, 27 * TILE, 3 * TILE);

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
    emp.onTakeOrder = (customerId) => {
      const c = this.customers.find(cu => cu.customerId === customerId);
      if (c && c.aiState === 'waiting_order') {
        c.takeOrder();
        this.showFloatingText(emp.x, emp.y - 30, 'Order taken!', '#AAFFAA');
        this.playPop();
      }
    };
    this.physics.add.collider(emp, this.wallGroup);
    this.employees.push(emp);
  }

  // ─────────────────────────────────────────────────────────────────────
  // AUTO-COOK (Cook employees)
  // ─────────────────────────────────────────────────────────────────────

  private tryAutoCook(): void {
    for (const stn of this.stations) {
      if (stn.isCooking) continue;
      const pending = this.getPendingOrderForStation(stn.type);
      if (pending) {
        stn.isCooking = true;
        stn.cookProgress = 0;
        stn.cookTargetMs = pending.item.prepTime;
        stn.currentOrderId = pending.customerId;
        this.startCookingVisual(stn);
        this.playCook();
        return;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // CUSTOMER MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────

  private scheduleNextCustomer(): void {
    const repFactor = Math.max(0.4, 1 - this.reputation * 0.01);
    const delay = CUSTOMER_SPAWN_MS * repFactor + Phaser.Math.Between(-3000, 3000);
    this.customerSpawnTimer = Math.max(5000, delay);
  }

  private spawnCustomer(): void {
    if (this.dayEnded) return;

    const tryGroup = Math.random() < 0.28;
    if (tryGroup) {
      const groupTable = this.tables.find(t => t.seats.filter(s => !s.occupied).length >= 2);
      if (groupTable) {
        this.spawnGroup(groupTable);
        return;
      }
    }

    const freeTable = this.tables.find(t => t.seats.some(s => !s.occupied));
    if (!freeTable) return;
    const freeSeat = freeTable.seats.find(s => !s.occupied)!;

    const customer = this.createCustomer(freeSeat.seatX, freeSeat.seatY);
    customer.tableId = freeTable.id;
    this.customers.push(customer);
    freeSeat.occupied = true;
    freeSeat.customerId = customer.customerId;
    this.physics.add.collider(customer, this.wallGroup);
  }

  private spawnGroup(table: TableSlot): void {
    const freeSeats = table.seats.filter(s => !s.occupied).slice(0, 2);
    for (const seat of freeSeats) {
      const customer = this.createCustomer(seat.seatX, seat.seatY);
      customer.tableId = table.id;
      this.customers.push(customer);
      seat.occupied = true;
      seat.customerId = customer.customerId;
      this.physics.add.collider(customer, this.wallGroup);
    }
  }

  private createCustomer(seatX: number, seatY: number): Customer {
    const types: CustomerType[] = ['astronaut', 'scientist', 'tourist', 'worker'];
    const type = types[Math.floor(Math.random() * types.length)];
    const spawnX = (14 + Math.floor(Math.random() * 4)) * TILE + TILE / 2;
    const spawnY = 16 * TILE + TILE / 2;
    const customer = new Customer(
      this, spawnX, spawnY,
      this.nextCustomerId++, type,
      seatX, seatY,
      GAME_W / 2, GAME_H + 20,
    );
    customer.pathFinder = (fx, fy, tx, ty) => this.customerPathfinder.findPath(fx, fy, tx, ty);
    customer.getAvailableMenuItems = () => this.getEffectiveMenu();
    return customer;
  }

  // ─────────────────────────────────────────────────────────────────────
  // INTERACTION SYSTEM
  // ─────────────────────────────────────────────────────────────────────

  private scanInteractables(): InteractionContext {
    const px = this.player.x;
    const py = this.player.y;
    const REACH = 52;

    if (this.player.isCarryingFood()) {
      const trashDist = Phaser.Math.Distance.Between(px, py, this.trashCanX, this.trashCanY);
      if (trashDist < REACH) {
        const foodId = this.player.getCarriedFoodId();
        const item = MENU_ITEMS.find(m => m.id === foodId);
        return { type: 'trash', label: `Discard ${item?.name ?? 'item'}` };
      }
    }

    for (const stn of this.stations) {
      const dist = Phaser.Math.Distance.Between(px, py, stn.worldX, py);
      const vertDist = Math.abs(py - (stn.worldY + TILE));
      if (dist < REACH && vertDist < 40) {
        if (stn.isCooking && stn.cookProgress >= 1) {
          return { type: 'station', label: `Pick up ${this.getCookingItem(stn)?.name ?? 'order'}`, stationId: stn.id };
        }
        if (!stn.isCooking && !this.player.isCarryingFood()) {
          const pending = this.getPendingOrderForStation(stn.type);
          if (pending) {
            return { type: 'station', label: `Cook ${pending.item.name}`, stationId: stn.id };
          }
        }
      }
    }

    for (const c of this.customers) {
      if (!c.active) continue;
      const dist = Phaser.Math.Distance.Between(px, py, c.x, c.y);
      if (dist < REACH) {
        if (c.aiState === 'waiting_order') {
          return { type: 'customer_order', label: `Take order: ${c.order?.name ?? '?'}`, targetId: c.customerId };
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
        const stn = this.stations.find(s => s.id === ctx.stationId);
        if (!stn) return;
        if (stn.isCooking && stn.cookProgress >= 1) {
          const item = this.getCookingItem(stn);
          if (item) {
            this.player.pickUpFood(item.id);
            stn.isCooking = false;
            stn.cookProgress = 0;
            stn.currentOrderId = null;
            stn.progressBg?.destroy(); stn.progressBg = undefined;
            stn.progressFill?.destroy(); stn.progressFill = undefined;
            stn.readyFoodSprite?.destroy(); stn.readyFoodSprite = undefined;
            stn.sprite.clearTint();
            this.playCook();
          }
        } else if (!stn.isCooking) {
          const pending = this.getPendingOrderForStation(stn.type);
          if (pending) {
            stn.isCooking = true;
            stn.cookProgress = 0;
            stn.cookTargetMs = pending.item.prepTime;
            stn.currentOrderId = pending.customerId;
            this.startCookingVisual(stn);
            this.playCook();
          }
        }
        break;
      }

      case 'customer_order': {
        const c = this.customers.find(cu => cu.customerId === ctx.targetId);
        if (!c || c.aiState !== 'waiting_order') return;
        c.takeOrder();
        this.showFloatingText(this.player.x, this.player.y - 30, `${c.order?.name ?? 'Order'}`, '#FFEEDD');
        this.playPop();
        break;
      }

      case 'customer_deliver': {
        const c = this.customers.find(cu => cu.customerId === ctx.targetId);
        if (!c || c.aiState !== 'waiting_food') return;
        const carried = this.player.dropFood();
        if (carried && c.order?.id === carried) {
          c.receiveFood();
          const catererBonus = 1 + (this.shopState.caterers ?? 0) * 0.25;
          const earned = Math.round(c.getTip() * catererBonus);
          this.money += earned;
          this.reputation = Math.min(100, this.reputation + 1);
          this.totalServed++;
          this.showFloatingText(this.player.x, this.player.y - 30, `+${earned} ✦`, '#FFD700');
          this.playChime();
          this.emitUIUpdate();
        }
        break;
      }

      case 'cat': {
        const cat = this.cats.find(k => k.catId === ctx.targetId);
        if (cat) { cat.pet(); this.playPop(); }
        break;
      }
    }
  }

  private getPendingOrderForStation(type: 'coffee' | 'stove' | 'prep'): { customerId: number; item: MenuItemDef } | null {
    for (const c of this.customers) {
      if (!c.active) continue;
      if ((c.aiState === 'order_taken' || c.aiState === 'waiting_food') && c.order?.station === type) {
        const alreadyCooking = this.stations.some(s => s.isCooking && s.currentOrderId === c.customerId);
        if (!alreadyCooking) return { customerId: c.customerId, item: c.order };
      }
    }
    return null;
  }

  private getCookingItem(stn: Station): MenuItemDef | null {
    if (!stn.currentOrderId) return null;
    const c = this.customers.find(cu => cu.customerId === stn.currentOrderId);
    return c?.order ?? null;
  }

  private startCookingVisual(stn: Station): void {
    const barY = stn.worldY - 50;
    stn.progressBg = this.add.sprite(stn.worldX, barY, 'ui_progress_bg').setDepth(20);
    stn.progressFill = this.add.graphics().setDepth(21);
  }

  // ─────────────────────────────────────────────────────────────────────
  // AMBIENT FX
  // ─────────────────────────────────────────────────────────────────────

  private setupSteam(): void {
    const coffeeStation = this.stations[0];
    if (!coffeeStation) return;
    this.steamEmitter = this.add.particles(coffeeStation.worldX, coffeeStation.worldY - 20, 'particle_steam', {
      speed: { min: 8, max: 20 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: { min: 600, max: 1200 },
      frequency: 400,
      gravityY: -18,
      angle: { min: -20, max: 20 },
    });
    this.steamEmitter.setDepth(6);
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
    this.interactionPrompt.setPosition(this.player.x - 120, this.player.y - 56);
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

    this.customers.forEach(c => {
      if (c.active && c.aiState !== 'walking_out' && c.aiState !== 'gone') {
        c.beginLeave();
      }
    });

    this.time.delayedCall(4000, () => this.showDayEndScreen());
  }

  private showDayEndScreen(): void {
    if (this.dayEndShown) return;
    this.dayEndShown = true;

    const overlay = this.add.graphics().setDepth(200);
    overlay.fillStyle(0x000000, 0);
    overlay.fillRect(0, 0, GAME_W, GAME_H);
    this.tweens.add({ targets: overlay, alpha: 0.78, duration: 1000 });

    const cx = GAME_W / 2;
    const panelX = cx - 200;
    const panelY = 50;
    const panelW = 400;
    const panelH = 500;

    const panel = this.add.graphics().setDepth(201);
    panel.fillStyle(COLORS.UI_PANEL, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    panel.lineStyle(2, COLORS.UI_GOLD, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    const avgCatHappiness = this.cats.reduce((s, c) => s + c.happiness, 0) / Math.max(1, this.cats.length);

    const lines = [
      { text: `Day ${this.day} Complete!`,               size: '22px', color: '#FFD700', y: 88 },
      { text: `Customers served: ${this.totalServed}`,   size: '13px', color: '#FFEEDD', y: 130 },
      { text: `Reputation: ${this.reputation} / 100`,    size: '13px', color: '#FFE566', y: 152 },
      { text: `Cat happiness: ${Math.round(avgCatHappiness)}%`, size: '13px', color: '#FF9AB0', y: 174 },
      { text: `Bank balance: ${this.money} ✦`,           size: '16px', color: '#FFD700', y: 200 },
    ];
    lines.forEach(l => {
      const t = this.add.text(cx, l.y, l.text, {
        fontSize: l.size, color: l.color, fontFamily: 'monospace', fontStyle: 'bold',
        stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5).setDepth(202).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 500, delay: 200 });
    });

    const sep = this.add.graphics().setDepth(202);
    sep.lineStyle(1, COLORS.UI_GOLD, 0.4);
    sep.lineBetween(cx - 165, 228, cx + 165, 228);

    this.add.text(cx, 234, 'Cat Shop', {
      fontSize: '15px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setDepth(202);

    // Cat shop only (tables/staff/kitchen are in the in-game store)
    this.buildCatShopButtons(cx, 260);

    const storeHint = this.add.text(cx, 388, '— Press S / D during the day to open the Store —', {
      fontSize: '10px', color: '#887755', fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(202);
    void storeHint;

    const btnY = 462;
    const btn = this.add.graphics().setDepth(202);
    const drawBtn = (hover: boolean) => {
      btn.clear();
      btn.fillStyle(hover ? 0xCC8800 : COLORS.UI_PANEL_LIGHT, 1);
      btn.fillRoundedRect(cx - 90, btnY - 20, 180, 44, 8);
      btn.lineStyle(2, COLORS.UI_GOLD, 1);
      btn.strokeRoundedRect(cx - 90, btnY - 20, 180, 44, 8);
    };
    drawBtn(false);

    const btnTxt = this.add.text(cx, btnY, 'Next Day  →', {
      fontSize: '18px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(203);

    const btnZone = this.add.zone(cx, btnY, 180, 44).setInteractive({ useHandCursor: true }).setDepth(204);
    btnZone.on('pointerover', () => { drawBtn(true); btnTxt.setColor('#FFFFFF'); });
    btnZone.on('pointerout', () => { drawBtn(false); btnTxt.setColor('#FFD700'); });
    btnZone.on('pointerdown', () => this.startNextDay());
  }

  private buildCatShopButtons(cx: number, topY: number): void {
    this.shopRefreshFns = [];

    const GRID = [
      { bx: cx - 80, by: topY },
      { bx: cx + 80, by: topY },
    ];

    SHOP_ITEMS.forEach((item, i) => {
      const bx = GRID[i].bx;
      const bw = 130, bh = 108;
      const by = GRID[i].by;

      const bg = this.add.graphics().setDepth(202);

      const nameTxt = this.add.text(bx, by + 12, item.name, {
        fontSize: '11px', color: '#FFEEDD', fontFamily: 'monospace', align: 'center',
        wordWrap: { width: bw - 8 }, stroke: '#000000', strokeThickness: 2,
      }).setOrigin(0.5, 0).setDepth(203);

      const costTxt = this.add.text(bx, by + 38, `${item.cost} ✦`, {
        fontSize: '14px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5, 0).setDepth(203);

      const countTxt = this.add.text(bx, by + 60, '', {
        fontSize: '10px', color: '#AAAAAA', fontFamily: 'monospace',
        stroke: '#000000', strokeThickness: 1,
      }).setOrigin(0.5, 0).setDepth(203);

      const descTxt = this.add.text(bx, by + 78, item.desc, {
        fontSize: '8px', color: '#778877', fontFamily: 'monospace', align: 'center',
        wordWrap: { width: bw - 8 },
      }).setOrigin(0.5, 0).setDepth(203);

      const zone = this.add.zone(bx, by + bh / 2, bw, bh).setInteractive({ useHandCursor: true }).setDepth(204);

      const getCount = () => item.id === 'cat_toy' ? this.shopState.catToys : this.shopState.catTrees;
      const canBuy = () => this.money >= item.cost && getCount() < item.max;

      const refresh = (hover = false) => {
        const count = getCount();
        const affordable = canBuy();
        bg.clear();
        bg.fillStyle(hover && affordable ? 0x443300 : affordable ? COLORS.UI_PANEL_LIGHT : 0x1A1008, 1);
        bg.fillRoundedRect(bx - bw/2, by, bw, bh, 6);
        bg.lineStyle(1, affordable ? COLORS.UI_GOLD : 0x444422, 1);
        bg.strokeRoundedRect(bx - bw/2, by, bw, bh, 6);
        const a = affordable ? 1 : 0.45;
        nameTxt.setAlpha(a);
        costTxt.setAlpha(a);
        descTxt.setAlpha(affordable ? 0.7 : 0.3);
        countTxt.setText(`${count}/${item.max} owned`).setAlpha(a);
        costTxt.setColor(affordable ? '#FFD700' : '#777744');
      };

      this.shopRefreshFns.push(refresh);
      refresh();

      zone.on('pointerover', () => refresh(true));
      zone.on('pointerout', () => refresh(false));
      zone.on('pointerdown', () => {
        if (!canBuy()) return;
        this.money -= item.cost;
        if (item.id === 'cat_toy') this.shopState.catToys++;
        else this.shopState.catTrees++;
        this.shopRefreshFns.forEach(fn => fn(false));
        this.showFloatingText(bx, by - 10, `-${item.cost} ✦`, '#FF8888');
        this.emitUIUpdate();
      });
    });
  }

  private startNextDay(): void {
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
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // AUDIO
  // ─────────────────────────────────────────────────────────────────────

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.08): void {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = type;
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      osc.start(); osc.stop(ctx.currentTime + duration / 1000);
    } catch { /* no audio context */ }
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
  // FLOATING TEXT
  // ─────────────────────────────────────────────────────────────────────

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
    this.scene.stop('UIScene');
    this.scene.start('MainMenuScene');
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

    if (pointer.y < 58) return;
    if (pointer.x > GAME_W - 160 && pointer.y < 260) return;

    const wx = pointer.worldX;
    const wy = pointer.worldY;
    const TAP_R = TILE * 1.8;

    this.showTapIndicator(wx, wy);

    if (this.player.isCarryingFood()) {
      if (Phaser.Math.Distance.Between(wx, wy, this.trashCanX, this.trashCanY) < TAP_R * 1.2) {
        const pts = this.buildWaypointsTo(this.trashCanX, this.trashCanY + TILE * 0.5);
        this.player.setMoveTargets(pts, () => {
          this.currentInteraction = this.scanInteractables();
          this.handleInteraction();
        });
        return;
      }
    }

    for (const c of this.customers) {
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

    for (const stn of this.stations) {
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
    const orders: OrderInfo[] = this.customers
      .filter(c => c.active && (c.aiState === 'order_taken' || c.aiState === 'waiting_food'))
      .map(c => {
        const cookingStn = this.stations.find(s => s.isCooking && s.currentOrderId === c.customerId);
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
          itemName: c.order?.name ?? '?', stationType: c.order?.station ?? '',
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
      extraMachines: this.shopState.extraMachines ?? 0,
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // UPDATE LOOP
  // ─────────────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (this.dayEnded && this.dayEndShown) return;

    // Ghost cursor for decor placement (works while store is open)
    if (this.isStorePanelOpen && this.ghostSprite && this.pendingDecorationDef) {
      const ptr = this.input.activePointer;
      const tileX = Math.floor(ptr.worldX / TILE);
      const tileY = Math.floor(ptr.worldY / TILE);
      this.ghostSprite.setPosition(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2);
      this.ghostSprite.setTint(this.isValidDecoTile(tileX, tileY) ? 0x88FF88 : 0xFF4444);
    }

    // Game is fully frozen while store panel is open
    if (this.isStorePanelOpen) return;

    this.player.update();

    const customerPositions = this.customers
      .filter(c => c.active && (c.aiState === 'seated' || c.aiState === 'eating'))
      .map(c => ({ x: c.x, y: c.y, id: c.customerId }));

    this.cats.forEach(cat => {
      cat.update(delta, customerPositions);
      this.customers.forEach(c => {
        if (c.active && (c.aiState === 'seated' || c.aiState === 'eating')) {
          if (cat.isNearPosition(c.x, c.y, 36) && cat.happiness > 40) {
            c.boostHappiness(delta * 0.008);
          }
        }
      });
    });

    const waitingForOrders = this.customers
      .filter(c => c.active && c.aiState === 'waiting_order')
      .map(c => ({ customerId: c.customerId, x: c.x, y: c.y }));
    this.employees.forEach(emp => emp.update(delta, waitingForOrders, this.employeeAssignedIds));

    for (let i = this.customers.length - 1; i >= 0; i--) {
      const c = this.customers[i];
      c.update(delta);
      if (c.aiState === 'gone') {
        for (const table of this.tables) {
          const seat = table.seats.find(s => s.customerId === c.customerId);
          if (seat) { seat.occupied = false; seat.customerId = null; break; }
        }
        this.employeeAssignedIds.delete(c.customerId);
        c.cleanup();
        c.destroy();
        this.customers.splice(i, 1);
        if (c.happiness < 40) this.reputation = Math.max(0, this.reputation - 1);
        this.emitUIUpdate();
      }
    }

    this.customerSpawnTimer -= delta;
    if (this.customerSpawnTimer <= 0 && !this.dayEnded) {
      this.spawnCustomer();
      this.scheduleNextCustomer();
    }

    // Cook employee: auto-start cooking
    if ((this.shopState.cooks ?? 0) > 0) {
      this.autoCookTimer -= delta;
      if (this.autoCookTimer <= 0) {
        this.autoCookTimer = Math.max(800, 4000 - (this.shopState.cooks ?? 0) * 1200);
        this.tryAutoCook();
      }
    }

    this.stations.forEach(stn => {
      if (stn.isCooking && stn.cookProgress < 1) {
        stn.cookProgress = Math.min(1, stn.cookProgress + delta / stn.cookTargetMs);
        if (stn.progressFill && stn.progressBg) {
          stn.progressFill.clear();
          const fillW = Math.round(stn.cookProgress * 44);
          const fillColor = stn.cookProgress > 0.8 ? 0x66DD66 : 0x44AADD;
          stn.progressFill.fillStyle(fillColor, 1);
          stn.progressFill.fillRect(stn.progressBg.x - 22, stn.progressBg.y - 2, fillW, 4);
        }
        if (stn.cookProgress >= 1) {
          stn.progressBg?.destroy(); stn.progressBg = undefined;
          stn.progressFill?.destroy(); stn.progressFill = undefined;
          const item = this.getCookingItem(stn);
          if (item && !stn.readyFoodSprite) {
            stn.readyFoodSprite = this.add.sprite(stn.worldX, stn.worldY - 42, `food_${item.id}`)
              .setScale(2.0).setDepth(22);
            this.tweens.add({
              targets: stn.readyFoodSprite,
              y: stn.worldY - 48,
              duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
          }
          stn.sprite.setTint(0x88FF88);
          this.tweens.add({ targets: stn.sprite, alpha: 0.4, duration: 120, yoyo: true, repeat: 2 });
          this.playChime();
        }
      }
    });

    const ctx = this.scanInteractables();
    this.currentInteraction = ctx;
    if (ctx.type !== 'none') {
      this.showInteractionPrompt(ctx);
    } else {
      this.hideInteractionPrompt();
    }

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
