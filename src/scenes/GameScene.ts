import Phaser from 'phaser';
import { TILE, GAME_W, GAME_H, MAP_COLS, MAP_ROWS, COLORS, MENU_ITEMS, DAY_DURATION_MS, CUSTOMER_SPAWN_MS, SHOP_ITEMS, EMPLOYEE_NAMES } from '../constants';
import { MenuItemDef, CustomerType, InteractionContext, TableSlot, TableSeat, ShopState, OrderInfo } from '../types';
import { Player } from '../entities/Player';
import { Cat } from '../entities/Cat';
import { Customer } from '../entities/Customer';
import { Employee } from '../entities/Employee';
import { loadGame, defaultSaveState, saveGame } from '../systems/SaveSystem';

// ─────────────────────────────────────────────────────────────────────────────
// MAP DEFINITION
// Tile codes: 0=space/moon, 1=floor, 2=wall, 3=window, 4=counter, 5=door, 6=kitchen
// Kitchen: rows 4-6  |  Service counter: row 7 (opening cols 13-17)  |  Dining: rows 8-14
// ─────────────────────────────────────────────────────────────────────────────
const MAP: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 0  space
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 1  space
  [2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2], // 2  windows
  [2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2], // 3  windows
  [2,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,2], // 4  kitchen
  [2,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,2], // 5  kitchen (stations)
  [2,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,6,2], // 6  kitchen
  [2,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,1,1,4,4,4,4,4,4,4,4,4,4,4,2], // 7  service counter + opening
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2], // 8  dining
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2], // 9  dining
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2], // 10 dining
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2], // 11 dining
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2], // 12 dining
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2], // 13 dining
  [2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2], // 14 dining
  [2,2,2,2,2,2,2,2,2,2,2,2,2,2,5,5,5,5,2,2,2,2,2,2,2,2,2,2,2,2], // 15 front wall + door
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 16 exterior
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], // 17 exterior
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
  private shopState: ShopState = { catToys: 0, catTrees: 0, employees: 0, extraMachines: 0 };

  private interactionPrompt?: Phaser.GameObjects.Container;
  private currentInteraction: InteractionContext = { type: 'none', label: '' };

  private customerSpawnTimer = 0;
  private autoSaveTimer = 0;
  private dayPhase: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
  private dayEnded = false;
  private dayEndShown = false;

  private steamEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  private trashCanX = 0;
  private trashCanY = 0;

  private shopRefreshFns: Array<(hover?: boolean) => void> = [];
  private uiRefreshTimer = 0;

  constructor() { super('GameScene'); }

  create(): void {
    // Reset mutable state — Phaser reuses the instance on scene.restart()
    this.customers = [];
    this.stations = [];
    this.tables = [];
    this.cats = [];
    this.employees = [];
    this.employeeAssignedIds = new Set();
    this.shopRefreshFns = [];
    this.uiRefreshTimer = 0;
    this.dayProgress = 0;
    this.dayEnded = false;
    this.dayEndShown = false;
    this.dayPhase = 'morning';
    this.nextCustomerId = 1;
    this.customerSpawnTimer = 0;
    this.autoSaveTimer = 0;
    this.interactionPrompt = undefined;
    this.currentInteraction = { type: 'none', label: '' };

    const saved = loadGame() ?? defaultSaveState();
    this.money = saved.money;
    this.reputation = saved.reputation;
    this.day = saved.day;
    this.totalServed = saved.totalServed;
    this.shopState = saved.shop ?? { catToys: 0, catTrees: 0, employees: 0, extraMachines: 0 };

    this.buildMap();
    this.buildFurniture();
    this.buildKitchenStations();
    this.buildCatBeds();
    this.buildDecorations();
    this.buildExteriorDecor();

    this.player = new Player(this, GAME_W / 2, 5.5 * TILE);
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
  // FURNITURE
  // ─────────────────────────────────────────────────────────────────────

  private buildFurniture(): void {
    this.furnitureGroup = this.physics.add.staticGroup();

    // Layout: 4 single tables + 4 group tables (2 seats each)
    // Single tables: left side of dining area
    const singleLayout = [
      { col: 3, row: 9 }, { col: 8, row: 9 },
      { col: 3, row: 12 }, { col: 8, row: 12 },
    ];
    // Group tables: right side of dining area
    const groupLayout = [
      { col: 14, row: 9 }, { col: 20, row: 9 },
      { col: 14, row: 12 }, { col: 20, row: 12 },
    ];

    let tableId = 0;

    // Single-seat tables
    for (const pos of singleLayout) {
      const wx = pos.col * TILE + TILE;
      const wy = pos.row * TILE + TILE / 2;

      this.add.sprite(wx, wy, 'obj_table').setOrigin(0.5, 0.8).setDepth(3);

      const tBody = this.furnitureGroup.create(wx, wy, 'obj_table') as Phaser.Physics.Arcade.Image;
      tBody.setVisible(false).setSize(44, 28).setOffset(4, 2);
      tBody.refreshBody();

      this.add.sprite(wx, wy - 26, 'obj_chair').setDepth(2).setFlipY(true);
      this.add.sprite(wx, wy + 26, 'obj_chair').setDepth(4);

      const seat: TableSeat = { seatX: wx, seatY: wy + 22, occupied: false, customerId: null };
      this.tables.push({ id: tableId++, worldX: wx, worldY: wy, seats: [seat] });
    }

    // 2-seat group tables
    for (const pos of groupLayout) {
      const wx = pos.col * TILE + TILE + 10;
      const wy = pos.row * TILE + TILE / 2;

      this.add.sprite(wx, wy, 'obj_table_group').setOrigin(0.5, 0.8).setDepth(3);

      const tBody = this.furnitureGroup.create(wx, wy, 'obj_table_group') as Phaser.Physics.Arcade.Image;
      tBody.setVisible(false).setSize(68, 28).setOffset(4, 2);
      tBody.refreshBody();

      // 4 chairs: 2 north, 2 south
      this.add.sprite(wx - 18, wy - 26, 'obj_chair').setDepth(2).setFlipY(true);
      this.add.sprite(wx + 18, wy - 26, 'obj_chair').setDepth(2).setFlipY(true);
      this.add.sprite(wx - 18, wy + 26, 'obj_chair').setDepth(4);
      this.add.sprite(wx + 18, wy + 26, 'obj_chair').setDepth(4);

      const seats: TableSeat[] = [
        { seatX: wx - 18, seatY: wy + 22, occupied: false, customerId: null },
        { seatX: wx + 18, seatY: wy + 22, occupied: false, customerId: null },
      ];
      this.tables.push({ id: tableId++, worldX: wx, worldY: wy, seats });
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // KITCHEN
  // ─────────────────────────────────────────────────────────────────────

  private buildKitchenStations(): void {
    type StationDef = { col: number; type: 'coffee' | 'stove' | 'prep'; tex: string; label: string };

    const baseDefs: StationDef[] = [
      { col: 4,  type: 'coffee', tex: 'obj_coffee_machine', label: 'Coffee'   },
      { col: 14, type: 'stove',  tex: 'obj_stove',          label: 'Stove'    },
      { col: 23, type: 'prep',   tex: 'obj_prep_counter',   label: 'Prep'     },
    ];
    const extraDefs: StationDef[] = [
      { col: 9,  type: 'coffee', tex: 'obj_coffee_machine', label: 'Coffee 2' },
      { col: 19, type: 'stove',  tex: 'obj_stove',          label: 'Stove 2'  },
      { col: 27, type: 'prep',   tex: 'obj_prep_counter',   label: 'Prep 2'   },
    ];

    const defs = this.shopState.extraMachines >= 1
      ? [...baseDefs, ...extraDefs]
      : baseDefs;

    defs.forEach((def, i) => {
      const wx = def.col * TILE + TILE / 2;
      const wy = 5 * TILE + TILE / 2;

      const sprite = this.add.sprite(wx, wy - 4, def.tex).setDepth(4).setOrigin(0.5, 0.7);
      const label = this.add.text(wx, wy - 30, def.label, {
        fontSize: '9px', color: '#FFEEDD', fontFamily: 'monospace',
      }).setOrigin(0.5, 1).setDepth(5);

      this.stations.push({
        id: i, type: def.type, worldX: wx, worldY: wy,
        sprite, label, isCooking: false, cookProgress: 0,
        cookTargetMs: 0, currentOrderId: null,
      });
    });

    // Trash can (col 28, right wall side)
    this.trashCanX = 28 * TILE + TILE / 2;
    this.trashCanY = 5 * TILE + TILE / 2;
    this.add.sprite(this.trashCanX, this.trashCanY, 'obj_trash_can').setDepth(4).setOrigin(0.5, 0.7);
    this.add.text(this.trashCanX, this.trashCanY - 22, 'Discard', {
      fontSize: '8px', color: '#888877', fontFamily: 'monospace',
    }).setOrigin(0.5, 1).setDepth(5);
  }

  // ─────────────────────────────────────────────────────────────────────
  // CAT BEDS + DECORATIONS
  // ─────────────────────────────────────────────────────────────────────

  private buildCatBeds(): void {
    const bedPositions = [
      { col: 22, row: 9 }, { col: 25, row: 9 },
      { col: 22, row: 12 }, { col: 25, row: 12 },
    ];
    bedPositions.forEach(pos => {
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE/2, 'obj_cat_bed').setDepth(1).setOrigin(0.5, 0.7);
    });
  }

  private buildDecorations(): void {
    // Large Earth visible through back windows (positioned over window area)
    const earthX = 22 * TILE;
    const earthY = 2.5 * TILE;
    const earth = this.add.graphics().setDepth(1.5);
    // Atmosphere glow
    earth.fillStyle(COLORS.EARTH_OCEAN, 0.08); earth.fillCircle(earthX, earthY, 56);
    // Ocean
    earth.fillStyle(COLORS.EARTH_OCEAN, 1); earth.fillCircle(earthX, earthY, 42);
    // Landmasses
    earth.fillStyle(COLORS.EARTH_LAND, 1);
    earth.fillEllipse(earthX - 10, earthY - 14, 26, 20);
    earth.fillEllipse(earthX + 12, earthY + 10, 22, 16);
    earth.fillEllipse(earthX - 14, earthY + 12, 16, 14);
    // Clouds
    earth.fillStyle(COLORS.EARTH_CLOUD, 0.88);
    earth.fillEllipse(earthX - 2, earthY - 24, 30, 12);
    earth.fillEllipse(earthX + 14, earthY, 22, 10);
    earth.fillEllipse(earthX - 18, earthY + 2, 18, 8);

    // A second smaller Earth/moon in another corner
    const moonX = 6 * TILE;
    const moonY = 2.5 * TILE;
    const moonG = this.add.graphics().setDepth(1.5);
    moonG.fillStyle(COLORS.MOON_LIGHT, 0.6); moonG.fillCircle(moonX, moonY, 20);
    moonG.fillStyle(COLORS.MOON_DARK, 0.8); moonG.fillCircle(moonX, moonY, 18);
    moonG.fillStyle(COLORS.MOON_GRAY, 1); moonG.fillCircle(moonX - 4, moonY - 3, 14);

    // Plants in dining area corners
    const plantPositions = [
      { col: 1, row: 8 }, { col: 1, row: 14 },
      { col: 28, row: 8 }, { col: 28, row: 14 },
      { col: 11, row: 8 }, { col: 11, row: 14 },
    ];
    plantPositions.forEach(pos => {
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE, 'obj_plant').setDepth(3).setOrigin(0.5, 1);
    });

    // Plants in kitchen area
    this.add.sprite(1 * TILE + TILE/2, 4 * TILE + TILE, 'obj_plant').setDepth(3).setOrigin(0.5, 1);
    this.add.sprite(28 * TILE + TILE/2, 4 * TILE + TILE, 'obj_plant').setDepth(3).setOrigin(0.5, 1);

    // Cat food bowls
    [{ col: 21, row: 14 }, { col: 26, row: 14 }].forEach(pos => {
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE/2, 'obj_food_bowl').setDepth(2).setOrigin(0.5, 0.7);
    });

    // Shop-purchased cat toys
    const toyPositions = [
      { col: 18, row: 8 }, { col: 22, row: 13 }, { col: 27, row: 10 }, { col: 19, row: 13 },
    ];
    for (let i = 0; i < Math.min(this.shopState.catToys, toyPositions.length); i++) {
      const pos = toyPositions[i];
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE/2, 'obj_cat_toy').setDepth(3).setOrigin(0.5, 1);
    }

    // Shop-purchased cat trees
    const treePositions = [
      { col: 26, row: 8 }, { col: 20, row: 14 },
    ];
    for (let i = 0; i < Math.min(this.shopState.catTrees, treePositions.length); i++) {
      const pos = treePositions[i];
      this.add.sprite(pos.col * TILE + TILE/2, pos.row * TILE + TILE, 'obj_cat_tree').setDepth(3).setOrigin(0.5, 1);
    }

    // Ambient warm light spots
    const lightGraphics = this.add.graphics().setDepth(0.5).setBlendMode(Phaser.BlendModes.ADD);
    const lightPositions = [
      [5 * TILE, 10 * TILE], [12 * TILE, 10 * TILE],
      [5 * TILE, 13 * TILE], [12 * TILE, 13 * TILE],
      [15 * TILE, 5 * TILE], [6 * TILE, 5 * TILE],
    ];
    lightPositions.forEach(([lx, ly]) => {
      lightGraphics.fillStyle(0xFFCC66, 0.045);
      lightGraphics.fillCircle(lx, ly, 90);
    });

    // "KITCHEN" zone label
    this.add.text(15 * TILE, 4 * TILE + 6, 'KITCHEN', {
      fontSize: '10px', color: '#AAAAAA', fontFamily: 'monospace', alpha: 0.6,
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5, 0).setDepth(2).setAlpha(0.45);
  }

  private buildExteriorDecor(): void {
    // Moon rocks around exterior (rows 16-17)
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

    // Also rocks beside the building walls (outside, rows 4-6 at cols 0-1 and 28-29)
    [ { col: 0, row: 4 }, { col: 0, row: 10 }, { col: 29, row: 6 }, { col: 29, row: 12 } ].forEach(r => {
      this.add.sprite(r.col * TILE + TILE/2, r.row * TILE + TILE/2, 'obj_moon_rock_sm').setDepth(2).setOrigin(0.5, 0.8);
    });

    // Moon flag (left of door)
    this.add.sprite(9 * TILE + TILE/2, 16 * TILE, 'obj_moon_flag').setDepth(3).setOrigin(0.5, 1);

    // Lunar rover (right side of exterior)
    this.add.sprite(23 * TILE, 16 * TILE + 4, 'obj_lunar_rover').setDepth(3).setOrigin(0.5, 1);

    // Footprints trail near the door (simple graphics)
    const footG = this.add.graphics().setDepth(1.5).setAlpha(0.5);
    footG.fillStyle(COLORS.MOON_DARK, 1);
    for (let i = 0; i < 8; i++) {
      const fx = 15 * TILE + (i % 2 === 0 ? -6 : 6);
      const fy = 15 * TILE + 20 + i * 12;
      footG.fillEllipse(fx, fy, 8, 5);
    }

    // Some craters in the exterior area
    const craterG = this.add.graphics().setDepth(0.5);
    [[4 * TILE, 16 * TILE + 14], [13 * TILE, 17 * TILE + 6], [27 * TILE, 17 * TILE + 10]].forEach(([cx, cy]) => {
      craterG.fillStyle(COLORS.MOON_DARK, 1); craterG.fillCircle(cx, cy, 10);
      craterG.fillStyle(COLORS.MOON_LIGHT, 0.6); craterG.fillCircle(cx - 3, cy - 3, 4);
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // CATS
  // ─────────────────────────────────────────────────────────────────────

  private spawnCats(catData: ReturnType<typeof defaultSaveState>['cats']): void {
    const catPositions = [
      { col: 22, row: 9 }, { col: 25, row: 9 },
      { col: 22, row: 12 }, { col: 25, row: 12 },
    ];
    // Cats wander only in the dining area
    const bounds = new Phaser.Geom.Rectangle(TILE, 8 * TILE, 27 * TILE, 6 * TILE);

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
    const empPositions = [
      { col: 5, row: 11 }, { col: 17, row: 11 },
    ];
    for (let i = 0; i < this.shopState.employees; i++) {
      const pos = empPositions[i % empPositions.length];
      const emp = new Employee(
        this, pos.col * TILE + TILE/2, pos.row * TILE + TILE/2,
        i, EMPLOYEE_NAMES[i % EMPLOYEE_NAMES.length],
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

    // 28% chance of spawning a pair (group)
    const tryGroup = Math.random() < 0.28;
    if (tryGroup) {
      const groupTable = this.tables.find(t => t.seats.filter(s => !s.occupied).length >= 2);
      if (groupTable) {
        this.spawnGroup(groupTable);
        return;
      }
    }

    // Single customer
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
    return new Customer(
      this, spawnX, spawnY,
      this.nextCustomerId++, type,
      seatX, seatY,
      GAME_W / 2, GAME_H + 20,
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // INTERACTION SYSTEM
  // ─────────────────────────────────────────────────────────────────────

  private scanInteractables(): InteractionContext {
    const px = this.player.x;
    const py = this.player.y;
    const REACH = 52;

    // Trash can (discard carried food)
    if (this.player.isCarryingFood()) {
      const trashDist = Phaser.Math.Distance.Between(px, py, this.trashCanX, this.trashCanY);
      if (trashDist < REACH) {
        const foodId = this.player.getCarriedFoodId();
        const item = MENU_ITEMS.find(m => m.id === foodId);
        return { type: 'trash', label: `Discard ${item?.name ?? 'item'}` };
      }
    }

    // Kitchen stations
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

    // Customers
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

    // Cats
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
          const earned = c.getTip();
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
      bg.fillStyle(COLORS.UI_PANEL, 0.88);
      bg.fillRoundedRect(0, 0, 220, 28, 6);
      bg.lineStyle(1, COLORS.UI_GOLD, 0.7);
      bg.strokeRoundedRect(0, 0, 220, 28, 6);
      const prompt = this.add.sprite(10, 14, 'ui_e_prompt').setOrigin(0, 0.5).setScale(0.9);
      const txt = this.add.text(36, 14, '', {
        fontSize: '11px', color: '#FFEEDD', fontFamily: 'monospace',
      }).setOrigin(0, 0.5);
      container.add([bg, prompt, txt]);
      container.setData('txt', txt);
      this.interactionPrompt = container;
    }
    const txt = this.interactionPrompt.getData('txt') as Phaser.GameObjects.Text;
    txt.setText(ctx.label);
    this.interactionPrompt.setPosition(this.player.x - 110, this.player.y - 52);
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
    const panelX = cx - 190;
    const panelY = 62;
    const panelW = 380;
    const panelH = 510;

    const panel = this.add.graphics().setDepth(201);
    panel.fillStyle(COLORS.UI_PANEL, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    panel.lineStyle(2, COLORS.UI_GOLD, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    const avgCatHappiness = this.cats.reduce((s, c) => s + c.happiness, 0) / Math.max(1, this.cats.length);

    const lines = [
      { text: `Day ${this.day} Complete!`,          size: '22px', color: '#FFD700', y: 102 },
      { text: `Customers served: ${this.totalServed}`, size: '13px', color: '#FFEEDD', y: 146 },
      { text: `Reputation: ${this.reputation} / 100`, size: '13px', color: '#FFE566', y: 168 },
      { text: `Cat happiness: ${Math.round(avgCatHappiness)}%`, size: '13px', color: '#FF9AB0', y: 190 },
      { text: `Bank balance: ${this.money} ✦`,      size: '15px', color: '#FFD700', y: 218 },
    ];
    lines.forEach(l => {
      const t = this.add.text(cx, l.y, l.text, {
        fontSize: l.size, color: l.color, fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(202).setAlpha(0);
      this.tweens.add({ targets: t, alpha: 1, duration: 500, delay: 200 });
    });

    // Separator
    const sep = this.add.graphics().setDepth(202);
    sep.lineStyle(1, COLORS.UI_GOLD, 0.4);
    sep.lineBetween(cx - 155, 248, cx + 155, 248);

    this.add.text(cx, 255, 'Shop', {
      fontSize: '14px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setDepth(202);

    // Shop items
    this.buildShopButtons(cx, 280);

    // Next Day button
    const btnY = 494;
    const btn = this.add.graphics().setDepth(202);
    const drawBtn = (hover: boolean) => {
      btn.clear();
      btn.fillStyle(hover ? 0xCC8800 : COLORS.UI_PANEL_LIGHT, 1);
      btn.fillRoundedRect(cx - 90, btnY - 20, 180, 42, 8);
      btn.lineStyle(2, COLORS.UI_GOLD, 1);
      btn.strokeRoundedRect(cx - 90, btnY - 20, 180, 42, 8);
    };
    drawBtn(false);

    const btnTxt = this.add.text(cx, btnY, 'Next Day', {
      fontSize: '17px', color: '#FFD700', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(203);

    const btnZone = this.add.zone(cx, btnY, 180, 42).setInteractive({ useHandCursor: true }).setDepth(204);
    btnZone.on('pointerover', () => { drawBtn(true); btnTxt.setColor('#FFFFFF'); });
    btnZone.on('pointerout', () => { drawBtn(false); btnTxt.setColor('#FFD700'); });
    btnZone.on('pointerdown', () => this.startNextDay());
  }

  private buildShopButtons(cx: number, topY: number): void {
    this.shopRefreshFns = [];

    // 2×2 grid: [cat_toy, cat_tree] / [employee, extra_machines]
    const GRID = [
      { bx: cx - 60, by: topY },
      { bx: cx + 60, by: topY },
      { bx: cx - 60, by: topY + 110 },
      { bx: cx + 60, by: topY + 110 },
    ];

    SHOP_ITEMS.forEach((item, i) => {
      const bx = GRID[i].bx;
      const bw = 110, bh = 100;
      const by = GRID[i].by;

      const bg = this.add.graphics().setDepth(202);

      const nameTxt = this.add.text(bx, by + 10, item.name, {
        fontSize: '9px', color: '#FFEEDD', fontFamily: 'monospace', align: 'center', wordWrap: { width: bw - 8 },
      }).setOrigin(0.5, 0).setDepth(203);

      const costTxt = this.add.text(bx, by + 36, `${item.cost} ✦`, {
        fontSize: '12px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0.5, 0).setDepth(203);

      const countTxt = this.add.text(bx, by + 56, '', {
        fontSize: '9px', color: '#AAAAAA', fontFamily: 'monospace',
      }).setOrigin(0.5, 0).setDepth(203);

      const descTxt = this.add.text(bx, by + 72, item.desc, {
        fontSize: '7px', color: '#778877', fontFamily: 'monospace', align: 'center', wordWrap: { width: bw - 8 },
      }).setOrigin(0.5, 0).setDepth(203);

      const zone = this.add.zone(bx, by + bh / 2, bw, bh).setInteractive({ useHandCursor: true }).setDepth(204);

      const getCount = () => {
        if (item.id === 'cat_toy') return this.shopState.catToys;
        if (item.id === 'cat_tree') return this.shopState.catTrees;
        if (item.id === 'employee') return this.shopState.employees;
        return this.shopState.extraMachines;
      };
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
        else if (item.id === 'cat_tree') this.shopState.catTrees++;
        else if (item.id === 'employee') this.shopState.employees++;
        else this.shopState.extraMachines++;

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
      fontSize: '13px', color, fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);
    this.tweens.add({
      targets: t, y: y - 32, alpha: 0,
      duration: 1400, ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
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
        return { customerId: c.customerId, itemName: c.order?.name ?? '?', stationType: c.order?.station ?? '', status, progress };
      });

    this.game.events.emit('ui_update', {
      money: this.money,
      reputation: this.reputation,
      day: this.day,
      dayProgress: this.dayProgress,
      catHappiness: Math.round(avgCatHappiness),
      totalServed: this.totalServed,
      phase: this.dayPhase,
      orders,
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // UPDATE LOOP
  // ─────────────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (this.dayEnded && this.dayEndShown) return;

    this.player.update();

    // Cat updates
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

    // Employee updates
    const waitingForOrders = this.customers
      .filter(c => c.active && c.aiState === 'waiting_order')
      .map(c => ({ customerId: c.customerId, x: c.x, y: c.y }));
    this.employees.forEach(emp => emp.update(delta, waitingForOrders, this.employeeAssignedIds));

    // Customer updates
    for (let i = this.customers.length - 1; i >= 0; i--) {
      const c = this.customers[i];
      c.update(delta);
      if (c.aiState === 'gone') {
        // Free their seat
        for (const table of this.tables) {
          const seat = table.seats.find(s => s.customerId === c.customerId);
          if (seat) { seat.occupied = false; seat.customerId = null; break; }
        }
        // Remove from employee tracking
        this.employeeAssignedIds.delete(c.customerId);
        c.cleanup();
        c.destroy();
        this.customers.splice(i, 1);
        if (c.happiness < 40) this.reputation = Math.max(0, this.reputation - 1);
        this.emitUIUpdate();
      }
    }

    // Customer spawn timer
    this.customerSpawnTimer -= delta;
    if (this.customerSpawnTimer <= 0 && !this.dayEnded) {
      this.spawnCustomer();
      this.scheduleNextCustomer();
    }

    // Station cooking progress
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
          this.tweens.add({ targets: stn.sprite, alpha: 0.3, duration: 150, yoyo: true, repeat: 3 });
          this.playChime();
        }
      }
    });

    // Interaction scanning
    const ctx = this.scanInteractables();
    this.currentInteraction = ctx;
    if (ctx.type !== 'none') {
      this.showInteractionPrompt(ctx);
    } else {
      this.hideInteractionPrompt();
    }

    // Day progress
    this.dayProgress = Math.min(1, this.dayProgress + delta / DAY_DURATION_MS);
    const phase = this.dayProgress < 0.33 ? 'morning' : this.dayProgress < 0.66 ? 'afternoon' : 'evening';
    if (phase !== this.dayPhase) this.dayPhase = phase;

    // Frequent UI refresh for orders panel
    this.uiRefreshTimer -= delta;
    if (this.uiRefreshTimer <= 0) {
      this.uiRefreshTimer = 500;
      this.emitUIUpdate();
    }

    // Throttled autosave
    this.autoSaveTimer -= delta;
    if (this.autoSaveTimer <= 0) {
      this.autoSaveTimer = 10000;
      this.saveCurrentState();
    }
  }
}
