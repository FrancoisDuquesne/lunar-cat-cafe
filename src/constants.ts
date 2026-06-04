export const TILE = 32;
export const GAME_W = 960;
export const GAME_H = 576;
export const MAP_COLS = 30;
export const MAP_ROWS = 18;

export const PLAYER_SPEED = 130;
export const DAY_DURATION_MS = 300_000; // 5 minutes
export const CUSTOMER_SPAWN_MS = 18_000; // base 18 seconds between spawns

export const MENU_ITEMS = [
  { id: 'moon_mocha',       name: 'Moon Mocha',         price: 18, prepTime: 10000, station: 'coffee', recipeCost: 0,   description: 'Dark-roasted beans from the Sea of Tranquility, with a hint of lunar mineral water. Rich, bold, and weightless.' },
  { id: 'zerog_latte',      name: 'Zero-G Latte',       price: 14, prepTime: 8000,  station: 'coffee', recipeCost: 0,   description: 'Silky steamed milk in a sealed teal capsule — floats on the palate just like it floats in orbit.' },
  { id: 'luna_pancakes',    name: 'Lunar Pancakes',     price: 22, prepTime: 18000, station: 'stove',  recipeCost: 40,  description: 'A golden stack of fluffy pancakes made with regolith-ground flour, topped with moon-butter and crater-berry syrup.' },
  { id: 'star_cookies',     name: 'Stardust Cookies',   price: 12, prepTime: 14000, station: 'prep',   recipeCost: 30,  description: 'Crispy shortbread dusted with edible stardust and shaped into constellations. Best enjoyed with zero-gravity tea.' },
  { id: 'lunar_fondue',     name: 'Lunar Fondue',       price: 32, prepTime: 22000, station: 'stove',  recipeCost: 80,  description: 'A bubbling pot of aged moon-cheese kept molten by a low-gravity flame. Served with asteroid bread chunks for dipping.' },
  { id: 'nebula_risotto',   name: 'Nebula Risotto',     price: 48, prepTime: 28000, station: 'stove',  recipeCost: 140, description: 'Arborio rice slow-cooked in violet plasma broth and garnished with crystallised stardust. A cosmos on a plate.' },
  { id: 'gravity_souffle',  name: 'Gravity Soufflé',   price: 68, prepTime: 35000, station: 'prep',   recipeCost: 220, description: 'A gravity-defying pastry that rises perfectly in 1/6th gravity. Crisp outside, impossibly airy within. Order soon — it collapses on re-entry.' },
] as const;

export type MenuId = typeof MENU_ITEMS[number]['id'];

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

// All possible table/booth positions. IDs 0-1 are starter tables (cost=0 but still listed for consistency).
// Players begin with ownedTableSlotIds: [0, 1, 2] and purchase the rest.
export const TABLE_SLOT_DEFS: TableSlotDef[] = [
  { id: 0,  col: 2,  row: 7,  type: 'single', cost: 0,   name: 'Corner Table',    seats: 1 },
  { id: 1,  col: 21, row: 7,  type: 'single', cost: 0,   name: 'Corner Table',    seats: 1 },
  { id: 2,  col: 6,  row: 7,  type: 'single', cost: 120, name: 'Window Table',    seats: 1 },
  { id: 3,  col: 2,  row: 11, type: 'single', cost: 120, name: 'Wall Table',      seats: 1 },
  { id: 4,  col: 6,  row: 11, type: 'single', cost: 120, name: 'Garden Table',    seats: 1 },
  { id: 5,  col: 25, row: 7,  type: 'single', cost: 120, name: 'Window Table',    seats: 1 },
  { id: 6,  col: 21, row: 11, type: 'single', cost: 120, name: 'Wall Table',      seats: 1 },
  { id: 7,  col: 25, row: 11, type: 'single', cost: 120, name: 'Garden Table',    seats: 1 },
  { id: 8,  col: 3,  row: 12, type: 'group',  cost: 200, name: 'Booth (2 seats)', seats: 2 },
  { id: 9,  col: 10, row: 12, type: 'group',  cost: 200, name: 'Booth (2 seats)', seats: 2 },
  { id: 10, col: 17, row: 12, type: 'group',  cost: 200, name: 'Booth (2 seats)', seats: 2 },
  { id: 11, col: 22, row: 12, type: 'group',  cost: 200, name: 'Booth (2 seats)', seats: 2 },
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
  // Interior floor — warm amber oak planks
  FLOOR_A:         0xC87828,
  FLOOR_B:         0xA86020,
  FLOOR_SEAM:      0x7A4210,

  // Warm cream walls with teal accent
  WALL_CREAM:      0xE8D8A8,
  WALL_DARK:       0xA89868,
  WINDOW_FRAME:    0xF0C018,

  // Counters — warm mahogany
  COUNTER_TOP:     0x7C4A18,
  COUNTER_SIDE:    0x3C1C06,

  // Furniture — warm mahogany + gold
  TABLE_TOP:       0x6A3810,
  TABLE_LEG:       0xD4A820,
  CHAIR_TOP:       0xD84040,
  CHAIR_LEG:       0xD4A820,

  // Kitchen tiles — cream checkerboard
  KITCHEN_A:       0xF0E8D0,
  KITCHEN_B:       0xD4C494,
  KITCHEN_GROUT:   0xA08858,

  // Space exterior — deep teal-navy
  SPACE_DEEP:      0x0B1A40,
  SPACE_MID:       0x0D2050,
  SPACE_BLUE:      0x102860,
  MOON_GRAY:       0xC8C4B0,
  MOON_LIGHT:      0xE0DDD0,
  MOON_DARK:       0x9A9480,

  // Earth & celestial
  EARTH_OCEAN:     0x1A6FAA,
  EARTH_LAND:      0x2E7D52,
  EARTH_CLOUD:     0xDDEEFF,
  DOME_GLASS:      0x88BBCC,

  // Cat colors — vibrant, anime-saturated
  CAT_ORANGE:      0xFF7A28,
  CAT_ORANGE_D:    0xCC5810,
  CAT_GRAY:        0x9A9A9A,
  CAT_GRAY_D:      0x6A6A6A,
  CAT_BLACK:       0x222233,
  CAT_BLACK_D:     0x111122,
  CAT_CREAM:       0xF0DEB0,
  CAT_CREAM_D:     0xD0B880,
  CAT_NOSE:        0xFF8899,
  CAT_EYE:         0x44CC44,

  // Customer palette
  SKIN_A:          0xF5C88A,
  SKIN_B:          0xD49050,
  ASTRONAUT_SUIT:  0xDDDDEE,
  ASTRONAUT_VISOR: 0x28C0C8,
  SCIENTIST_COAT:  0xEEEEEE,
  SCIENTIST_HAT:   0x334466,
  TOURIST_SHIRT:   0xFF6060,
  WORKER_SUIT:     0xFF8822,

  // Player
  PLAYER_SUIT:     0xEEEEFF,
  PLAYER_VISOR:    0x30C8D0,

  // Employee
  EMPLOYEE_SUIT:   0x60CC80,
  EMPLOYEE_VISOR:  0xFFDD44,

  // UI — warm dark panels with gold
  UI_GOLD:         0xF0C018,
  UI_HEART:        0xFF5588,
  UI_STAR:         0xFFE044,
  UI_PANEL:        0x1A1428,
  UI_PANEL_LIGHT:  0x2A2040,
  UI_TEXT:         0xFFF0D8,
  UI_PATIENCE_OK:  0x55CC55,
  UI_PATIENCE_LOW: 0xFF5522,
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
