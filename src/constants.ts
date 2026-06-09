export const TILE = 32;
export const GAME_W = 960;
export const GAME_H = 576;
export const MAP_COLS = 30;
export const MAP_ROWS = 18;

export const PLAYER_SPEED = 130;
export const DAY_DURATION_MS = 300_000; // 5 minutes
export const CUSTOMER_SPAWN_MS = 18_000; // base 18 seconds between spawns

export const MENU_ITEMS = [
  { id: 'moon_mocha',      name: 'Moon Mocha',        price: 18, prepTime: 10000, machines: ['espresso_machine'],  recipeCost: 0,   description: 'Dark-roasted beans from the Sea of Tranquility, with a hint of lunar mineral water. Rich, bold, and weightless.' },
  { id: 'zerog_latte',     name: 'Zero-G Latte',      price: 14, prepTime: 8000,  machines: ['espresso_machine'],  recipeCost: 0,   description: 'Silky steamed milk in a sealed teal capsule — floats on the palate just like it floats in orbit.' },
  { id: 'luna_pancakes',   name: 'Lunar Pancakes',    price: 22, prepTime: 18000, machines: ['griddle'],           recipeCost: 40,  description: 'A golden stack of fluffy pancakes made with regolith-ground flour, topped with moon-butter and crater-berry syrup.' },
  { id: 'star_cookies',    name: 'Stardust Cookies',  price: 12, prepTime: 14000, machines: ['mixer', 'oven'],     recipeCost: 30,  description: 'Crispy shortbread dusted with edible stardust and shaped into constellations. Best enjoyed with zero-gravity tea.' },
  { id: 'lunar_fondue',    name: 'Lunar Fondue',       price: 32, prepTime: 22000, machines: ['stove'],             recipeCost: 80,  description: 'A bubbling pot of aged moon-cheese kept molten by a low-gravity flame. Served with asteroid bread chunks for dipping.' },
  { id: 'nebula_risotto',  name: 'Nebula Risotto',    price: 48, prepTime: 28000, machines: ['stove'],             recipeCost: 140, description: 'Arborio rice slow-cooked in violet plasma broth and garnished with crystallised stardust. A cosmos on a plate.' },
  { id: 'gravity_souffle', name: 'Gravity Soufflé',  price: 68, prepTime: 35000, machines: ['mixer', 'oven'],     recipeCost: 220, description: 'A gravity-defying pastry that rises perfectly in 1/6th gravity. Crisp outside, impossibly airy within. Order soon — it collapses on re-entry.' },
] as const;

export type MenuId = typeof MENU_ITEMS[number]['id'];

// ─────────────────────────────────────────────────────────────────────────────
// KITCHEN MACHINES
// ─────────────────────────────────────────────────────────────────────────────

export interface MachineDef {
  id: string;
  name: string;
  cost: number;
  col: number;
  row: number;
  texKey: string;
  label: string;
  desc: string;
  starter?: boolean;
}

// Machines sit in the back-wall kitchen: row 5 (front machine row) and row 6 (back machine row).
// Interior cols 10-19, walls at 9 and 20.
export const MACHINE_DEFS: MachineDef[] = [
  { id: 'espresso_machine', name: 'Espresso Machine', cost: 0,   col: 11, row: 5, texKey: 'obj_coffee_machine', label: 'Espresso', desc: 'Pulls rich shots for all coffee drinks.',           starter: true },
  { id: 'griddle',          name: 'Pancake Griddle',  cost: 80,  col: 13, row: 5, texKey: 'obj_griddle',        label: 'Griddle',  desc: 'Flat-iron cooking — pancakes and hot flatbreads.' },
  { id: 'stove',            name: 'Gas Stove',        cost: 100, col: 15, row: 5, texKey: 'obj_stove',          label: 'Stove',    desc: 'Hot cooking — fondue, risotto, and rich sauces.' },
  { id: 'mixer',            name: 'Stand Mixer',      cost: 120, col: 17, row: 5, texKey: 'obj_mixer',          label: 'Mixer',    desc: 'Mixes dough and batter. Pair with Oven to bake.' },
  { id: 'oven',             name: 'Convection Oven',  cost: 160, col: 13, row: 6, texKey: 'obj_oven',           label: 'Oven',     desc: 'Bakes goods prepared by the Stand Mixer.' },
];

// ─────────────────────────────────────────────────────────────────────────────
// DECORATION SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export type DecorationCategory = 'seating' | 'furniture' | 'lighting' | 'plants' | 'wallDecor' | 'specialty';

export interface DecorationDef {
  id: string;
  name: string;
  category: DecorationCategory;
  cost: number;
  ambianceValue: number;
  spriteKey: string;
  tileW: number;
  tileH: number;
  seats?: number;    // seating items register a table slot when placed
  minTier?: number;  // minimum cafe tier required to purchase
}

export interface PlacedDecoration {
  instanceId: string;
  defId: string;
  tileX: number;
  tileY: number;
}

export interface CafeTier {
  level: number;
  name: string;
  ambianceRequired: number;
  priceMultiplier: number;
  unlockedMenuIds: MenuId[];
  customerQualityBonus: number;
}

export const CAFE_TIERS: CafeTier[] = [
  { level: 1, name: 'Space Shack',      ambianceRequired:    0, priceMultiplier: 1.00, unlockedMenuIds: ['moon_mocha', 'zerog_latte'], customerQualityBonus: 0 },
  { level: 2, name: 'Lunar Café',       ambianceRequired:   80, priceMultiplier: 1.25, unlockedMenuIds: ['moon_mocha', 'zerog_latte', 'luna_pancakes', 'star_cookies'], customerQualityBonus: 0.1 },
  { level: 3, name: 'Moon Bistro',      ambianceRequired:  250, priceMultiplier: 1.60, unlockedMenuIds: ['moon_mocha', 'zerog_latte', 'luna_pancakes', 'star_cookies', 'lunar_fondue'], customerQualityBonus: 0.2 },
  { level: 4, name: 'Star Restaurant',  ambianceRequired:  600, priceMultiplier: 2.00, unlockedMenuIds: ['moon_mocha', 'zerog_latte', 'luna_pancakes', 'star_cookies', 'lunar_fondue', 'nebula_risotto'], customerQualityBonus: 0.3 },
  { level: 5, name: 'Cosmic Dining',    ambianceRequired: 1200, priceMultiplier: 2.50, unlockedMenuIds: ['moon_mocha', 'zerog_latte', 'luna_pancakes', 'star_cookies', 'lunar_fondue', 'nebula_risotto', 'gravity_souffle'], customerQualityBonus: 0.5 },
];

export const DECORATION_ITEMS: DecorationDef[] = [
  // Seating — place to add table + chairs that customers can sit at
  { id: 'table_single', name: 'Café Table',   category: 'seating',  cost:  90, ambianceValue: 0, spriteKey: 'obj_table',       tileW: 1, tileH: 1, seats: 1, minTier: 1 },
  { id: 'table_group',  name: 'Group Booth',  category: 'seating',  cost: 170, ambianceValue: 0, spriteKey: 'obj_table_group',  tileW: 1, tileH: 1, seats: 2, minTier: 2 },
  { id: 'bar_stool',    name: 'Bar Stool',    category: 'seating',  cost:  80, ambianceValue: 5, spriteKey: 'obj_bar_stool',    tileW: 1, tileH: 1, seats: 1, minTier: 3 },
  // Furniture
  { id: 'round_table',    name: 'Round Table',   category: 'furniture', cost:  60, ambianceValue: 12, spriteKey: 'deco_round_table',   tileW: 1, tileH: 1, minTier: 1 },
  { id: 'velvet_chair',   name: 'Velvet Chair',  category: 'furniture', cost:  80, ambianceValue: 15, spriteKey: 'deco_velvet_chair',  tileW: 1, tileH: 1, minTier: 2 },
  { id: 'booth_seat',     name: 'Booth Seat',    category: 'furniture', cost: 160, ambianceValue: 28, spriteKey: 'deco_booth_seat',    tileW: 1, tileH: 1, minTier: 3 },
  // Lighting
  { id: 'fairy_lights',   name: 'Fairy Lights',  category: 'lighting',  cost:  50, ambianceValue: 10, spriteKey: 'deco_fairy_lights',  tileW: 1, tileH: 1, minTier: 1 },
  { id: 'neon_sign',      name: 'Neon Sign',     category: 'lighting',  cost: 180, ambianceValue: 28, spriteKey: 'deco_neon_sign',     tileW: 1, tileH: 1, minTier: 2 },
  { id: 'crystal_lamp',   name: 'Crystal Lamp',  category: 'lighting',  cost: 280, ambianceValue: 40, spriteKey: 'deco_crystal_lamp',  tileW: 1, tileH: 1, minTier: 3 },
  // Plants
  { id: 'luna_fern',      name: 'Luna Fern',     category: 'plants',    cost:  55, ambianceValue: 12, spriteKey: 'deco_luna_fern',     tileW: 1, tileH: 1, minTier: 1 },
  { id: 'space_cactus',   name: 'Space Cactus',  category: 'plants',    cost:  90, ambianceValue: 18, spriteKey: 'deco_space_cactus',  tileW: 1, tileH: 1, minTier: 2 },
  { id: 'moon_bloom',     name: 'Moon Bloom',    category: 'plants',    cost: 160, ambianceValue: 30, spriteKey: 'deco_moon_bloom',    tileW: 1, tileH: 1, minTier: 3 },
  // Wall decor
  { id: 'star_map',       name: 'Star Map',      category: 'wallDecor', cost: 120, ambianceValue: 22, spriteKey: 'deco_star_map',      tileW: 1, tileH: 1, minTier: 2 },
  { id: 'moon_portrait',  name: 'Moon Portrait', category: 'wallDecor', cost: 220, ambianceValue: 35, spriteKey: 'deco_moon_portrait', tileW: 1, tileH: 1, minTier: 3 },
  // Specialty
  { id: 'telescope',      name: 'Telescope',     category: 'specialty', cost: 300, ambianceValue: 45, spriteKey: 'deco_telescope',     tileW: 1, tileH: 1, minTier: 3 },
  { id: 'rover_display',  name: 'Rover Display', category: 'specialty', cost: 400, ambianceValue: 55, spriteKey: 'deco_rover_display', tileW: 1, tileH: 1, minTier: 4 },
  { id: 'cat_statue',     name: 'Cat Statue',    category: 'specialty', cost: 240, ambianceValue: 35, spriteKey: 'deco_cat_statue',    tileW: 1, tileH: 1, minTier: 4 },
];

export const CAT_NAMES = ['Luna', 'Captain Whiskers', 'Nova', 'Comet', 'Orbit', 'Nebula'];

export const EMPLOYEE_NAMES = ['Astrid', 'Leo', 'Zara', 'Finn', 'Mira', 'Rex'];

// Day-end cat shop only
export const SHOP_ITEMS = [
  { id: 'cat_toy',  name: 'Cat Toy',  cost:  40, max: 4, desc: 'Cats play more, +happiness' },
  { id: 'cat_tree', name: 'Cat Tree', cost:  80, max: 2, desc: 'Cats love to climb!' },
] as const;

// ─── TABLE SLOTS ──────────────────────────────────────────────────────────────

export interface TableSlotDef {
  id: number;
  col: number;
  row: number;
  type: 'single' | 'group';
  cost: number;
  name: string;
  seats: number;
}

// Pre-placed starter tables inside the base shack (cols 10-19, dining rows 7-12).
// Convention: wx = (col+1)*TILE, so the table sprite center is at col+1.
// Players begin with ownedTableSlotIds: [0, 1].
export const TABLE_SLOT_DEFS: TableSlotDef[] = [
  { id: 0, col: 11, row: 8,  type: 'single', cost: 0,   name: 'Café Table',  seats: 1 },
  { id: 1, col: 16, row: 8,  type: 'single', cost: 0,   name: 'Café Table',  seats: 1 },
  { id: 2, col: 11, row: 11, type: 'single', cost: 200, name: 'Back Table',  seats: 1 },
  { id: 3, col: 16, row: 11, type: 'single', cost: 200, name: 'Back Table',  seats: 1 },
];

// ─── EXPANSION ZONES ──────────────────────────────────────────────────────────

export interface MapPatch { row: number; col: number; tile: number; }

export interface ExpansionZone {
  id: string;
  name: string;
  desc: string;
  cost: number;
  minReputation: number;
  patches: MapPatch[];
}

// Left wing adds cols 5-9 (rows 7-13) alongside the base shack.
// Right wing adds cols 20-24 (rows 7-13) on the other side.
export const EXPANSION_ZONES: ExpansionZone[] = [
  {
    id: 'expansion_left',
    name: 'Left Annex',
    desc: 'Extends the café to the left — adds a new dining wing with room for more tables.',
    cost: 800,
    minReputation: 25,
    patches: [
      // Top wall closing off the annex (row 6 = second kitchen row; annex roof above dining rows)
      { row: 6, col: 5, tile: 2 }, { row: 6, col: 6, tile: 2 }, { row: 6, col: 7, tile: 2 }, { row: 6, col: 8, tile: 2 },
      // Annex body rows 7-12: outer left wall + interior floor + open shared wall at col 9
      { row: 7,  col: 5, tile: 2 }, { row: 7,  col: 6, tile: 1 }, { row: 7,  col: 7, tile: 1 }, { row: 7,  col: 8, tile: 1 }, { row: 7,  col: 9, tile: 1 },
      { row: 8,  col: 5, tile: 2 }, { row: 8,  col: 6, tile: 1 }, { row: 8,  col: 7, tile: 1 }, { row: 8,  col: 8, tile: 1 }, { row: 8,  col: 9, tile: 1 },
      { row: 9,  col: 5, tile: 2 }, { row: 9,  col: 6, tile: 1 }, { row: 9,  col: 7, tile: 1 }, { row: 9,  col: 8, tile: 1 }, { row: 9,  col: 9, tile: 1 },
      { row: 10, col: 5, tile: 2 }, { row: 10, col: 6, tile: 1 }, { row: 10, col: 7, tile: 1 }, { row: 10, col: 8, tile: 1 }, { row: 10, col: 9, tile: 1 },
      { row: 11, col: 5, tile: 2 }, { row: 11, col: 6, tile: 1 }, { row: 11, col: 7, tile: 1 }, { row: 11, col: 8, tile: 1 }, { row: 11, col: 9, tile: 1 },
      { row: 12, col: 5, tile: 2 }, { row: 12, col: 6, tile: 1 }, { row: 12, col: 7, tile: 1 }, { row: 12, col: 8, tile: 1 }, { row: 12, col: 9, tile: 1 },
      // Front wall extension
      { row: 13, col: 5, tile: 2 }, { row: 13, col: 6, tile: 2 }, { row: 13, col: 7, tile: 2 }, { row: 13, col: 8, tile: 2 },
    ],
  },
  {
    id: 'expansion_right',
    name: 'Right Annex',
    desc: 'Extends the café to the right — adds a new dining wing with room for more tables.',
    cost: 800,
    minReputation: 25,
    patches: [
      // Top wall
      { row: 6, col: 21, tile: 2 }, { row: 6, col: 22, tile: 2 }, { row: 6, col: 23, tile: 2 }, { row: 6, col: 24, tile: 2 },
      // Annex body rows 7-12: open shared wall at col 20 + interior floor + outer right wall at col 24
      { row: 7,  col: 20, tile: 1 }, { row: 7,  col: 21, tile: 1 }, { row: 7,  col: 22, tile: 1 }, { row: 7,  col: 23, tile: 1 }, { row: 7,  col: 24, tile: 2 },
      { row: 8,  col: 20, tile: 1 }, { row: 8,  col: 21, tile: 1 }, { row: 8,  col: 22, tile: 1 }, { row: 8,  col: 23, tile: 1 }, { row: 8,  col: 24, tile: 2 },
      { row: 9,  col: 20, tile: 1 }, { row: 9,  col: 21, tile: 1 }, { row: 9,  col: 22, tile: 1 }, { row: 9,  col: 23, tile: 1 }, { row: 9,  col: 24, tile: 2 },
      { row: 10, col: 20, tile: 1 }, { row: 10, col: 21, tile: 1 }, { row: 10, col: 22, tile: 1 }, { row: 10, col: 23, tile: 1 }, { row: 10, col: 24, tile: 2 },
      { row: 11, col: 20, tile: 1 }, { row: 11, col: 21, tile: 1 }, { row: 11, col: 22, tile: 1 }, { row: 11, col: 23, tile: 1 }, { row: 11, col: 24, tile: 2 },
      { row: 12, col: 20, tile: 1 }, { row: 12, col: 21, tile: 1 }, { row: 12, col: 22, tile: 1 }, { row: 12, col: 23, tile: 1 }, { row: 12, col: 24, tile: 2 },
      // Front wall extension
      { row: 13, col: 21, tile: 2 }, { row: 13, col: 22, tile: 2 }, { row: 13, col: 23, tile: 2 }, { row: 13, col: 24, tile: 2 },
    ],
  },
];

// ─── EMPLOYEE TYPES ───────────────────────────────────────────────────────────

export type EmployeeRole = 'waiter' | 'cook' | 'guard' | 'caterer';

export interface EmployeeTypeDef {
  role: EmployeeRole;
  name: string;
  cost: number;
  max: number;
  desc: string;
  badgeColor: number;
  badgeHex: string;
  minTier?: number;
}

export const EMPLOYEE_TYPES: EmployeeTypeDef[] = [
  { role: 'waiter',  name: 'Waiter',         cost: 150, max: 3, desc: 'Takes orders for you',       badgeColor: 0x60CC80, badgeHex: '#60CC80' },
  { role: 'cook',    name: 'Cook',            cost: 250, max: 2, desc: 'Kitchen NPC — auto-starts cooking so you focus on orders', badgeColor: 0xFF9944, badgeHex: '#FF9944' },
  { role: 'guard',   name: 'Security Guard', cost: 200, max: 1, desc: '+5 reputation per day',       badgeColor: 0x6688DD, badgeHex: '#6688DD', minTier: 2 },
  { role: 'caterer', name: 'Wine Caterer',   cost: 300, max: 1, desc: '+25% tip bonus',              badgeColor: 0xDD88CC, badgeHex: '#DD88CC', minTier: 3 },
];

export const COLORS = {
  // ── Interior floor — warm honey oak planks ──────────────────────────
  FLOOR_A:         0xB87020,
  FLOOR_B:         0xA06018,
  FLOOR_SEAM:      0x6A3C0C,

  // ── Habitat walls — riveted industrial steel ────────────────────────
  WALL_STEEL:      0x4A5060,
  WALL_STEEL_HI:   0x6A7888,
  WALL_STEEL_LO:   0x2A2F3C,
  WALL_RIVET:      0x5A6878,
  // Legacy aliases (kept for buildDecorations references)
  WALL_CREAM:      0x4A5060,
  WALL_DARK:       0x2A2F3C,
  WINDOW_FRAME:    0x5A6070,

  // ── Counter — brushed stainless steel ───────────────────────────────
  COUNTER_TOP:     0x5A6470,
  COUNTER_SIDE:    0x383E48,

  // ── Furniture — warm mahogany + gold accent ──────────────────────────
  TABLE_TOP:       0x6A3810,
  TABLE_LEG:       0xD4A820,
  CHAIR_TOP:       0xD84040,
  CHAIR_LEG:       0xD4A820,

  // ── Kitchen tiles — industrial cream/gray checkerboard ──────────────
  KITCHEN_A:       0xE8E0CC,
  KITCHEN_B:       0xC8C0A4,
  KITCHEN_GROUT:   0x888070,

  // ── Space exterior — deep void navy ─────────────────────────────────
  SPACE_DEEP:      0x060B18,
  SPACE_MID:       0x080E20,
  SPACE_BLUE:      0x0A1228,

  // ── Lunar surface palette ────────────────────────────────────────────
  MOON_GRAY:       0xC0BCA8,  // warm silver-gray regolith
  MOON_LIGHT:      0xD8D4C0,  // sunlit crater rim highlight
  MOON_DARK:       0x888070,  // crater shadow / depression
  MOON_DUST:       0xB0AC98,  // flat dust expanse

  // ── Earth & celestial ────────────────────────────────────────────────
  EARTH_OCEAN:     0x1A6FAA,
  EARTH_LAND:      0x2E7D52,
  EARTH_CLOUD:     0xDDEEFF,
  DOME_GLASS:      0x88BBCC,

  // ── Cat colors ───────────────────────────────────────────────────────
  CAT_ORANGE:      0xE87020,
  CAT_ORANGE_D:    0xB85010,
  CAT_GRAY:        0x909090,
  CAT_GRAY_D:      0x606060,
  CAT_BLACK:       0x222233,
  CAT_BLACK_D:     0x111122,
  CAT_CREAM:       0xEED0A0,
  CAT_CREAM_D:     0xC8A870,
  CAT_NOSE:        0xFF7788,
  CAT_EYE:         0x30B840,

  // ── Customer palette ─────────────────────────────────────────────────
  SKIN_A:          0xE8B878,
  SKIN_B:          0xC88040,
  ASTRONAUT_SUIT:  0xCCCCDC,
  ASTRONAUT_VISOR: 0x20A8B8,
  SCIENTIST_COAT:  0xE8E8E8,
  SCIENTIST_HAT:   0x2A3850,
  TOURIST_SHIRT:   0xE05050,
  WORKER_SUIT:     0xE07818,

  // ── Player ───────────────────────────────────────────────────────────
  PLAYER_SUIT:     0xD8D8E8,
  PLAYER_VISOR:    0x28B0C0,

  // ── Employee ─────────────────────────────────────────────────────────
  EMPLOYEE_SUIT:   0x50B868,
  EMPLOYEE_VISOR:  0xEECC30,

  // ── UI — warm dark panels with gold accent ───────────────────────────
  UI_GOLD:         0xF0C018,
  UI_HEART:        0xFF5588,
  UI_STAR:         0xFFE044,
  UI_PANEL:        0x1A1428,
  UI_PANEL_LIGHT:  0x2A2040,
  UI_TEXT:         0xFFF0D8,
  UI_PATIENCE_OK:  0x44BB44,
  UI_PATIENCE_LOW: 0xFF4411,
  PARTICLE_STEAM:  0xCCEEEE,
} as const;

// Tile type constants
export const T = {
  SPACE:   0,
  FLOOR:   1,
  WALL:    2,
  WINDOW:  3,
  COUNTER: 4,
  DOOR:    5,
  KITCHEN: 6,
} as const;

// ─── GAMEPLAY TUNING CONSTANTS ────────────────────────────────────────────────
export const INTERACTION_REACH = 52;       // px radius for E-prompt / scan
export const PET_COOLDOWN_MS = 8000;       // ms between cat pets
export const BOOKING_COST = 25;            // ✦ per booking slot
export const MAX_BOOKINGS = 4;             // max pre-booked guests per day
export const DECORATION_REFUND_RATIO = 0.5; // fraction refunded on removal


// Daily rent — increases as the café grows
export const DAILY_RENT_TABLE: ReadonlyArray<{ fromDay: number; rent: number }> = [
  { fromDay: 1,  rent: 50  },
  { fromDay: 3,  rent: 80  },
  { fromDay: 6,  rent: 120 },
  { fromDay: 10, rent: 160 },
] as const;

export function getDailyRent(day: number): number {
  let rent = DAILY_RENT_TABLE[0].rent;
  for (const entry of DAILY_RENT_TABLE) {
    if (day >= entry.fromDay) rent = entry.rent;
  }
  return rent;
}
