export const TILE = 32;
export const GAME_W = 960;
export const GAME_H = 576;
export const MAP_COLS = 30;
export const MAP_ROWS = 18;

export const PLAYER_SPEED = 130;
export const DAY_DURATION_MS = 300_000; // 5 minutes
export const CUSTOMER_SPAWN_MS = 18_000; // base 18 seconds between spawns

export const MENU_ITEMS = [
  { id: 'moon_mocha',       name: 'Moon Mocha',         price: 18, prepTime: 10000, station: 'coffee' },
  { id: 'zerog_latte',      name: 'Zero-G Latte',       price: 14, prepTime: 8000,  station: 'coffee' },
  { id: 'luna_pancakes',    name: 'Lunar Pancakes',     price: 22, prepTime: 18000, station: 'stove'  },
  { id: 'star_cookies',     name: 'Stardust Cookies',   price: 12, prepTime: 14000, station: 'prep'   },
  { id: 'lunar_fondue',     name: 'Lunar Fondue',       price: 32, prepTime: 22000, station: 'stove'  },
  { id: 'nebula_risotto',   name: 'Nebula Risotto',     price: 48, prepTime: 28000, station: 'stove'  },
  { id: 'gravity_souffle',  name: 'Gravity Soufflé',   price: 68, prepTime: 35000, station: 'prep'   },
] as const;

export type MenuId = typeof MENU_ITEMS[number]['id'];

// ─────────────────────────────────────────────────────────────────────────────
// DECORATION SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

export type DecorationCategory = 'furniture' | 'lighting' | 'plants' | 'wallDecor' | 'specialty';

export interface DecorationDef {
  id: string;
  name: string;
  category: DecorationCategory;
  cost: number;
  ambianceValue: number;
  spriteKey: string;
  tileW: number;
  tileH: number;
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
  // Furniture
  { id: 'velvet_chair',   name: 'Velvet Chair',       category: 'furniture',  cost:  80, ambianceValue: 15, spriteKey: 'deco_velvet_chair',   tileW: 1, tileH: 1 },
  { id: 'round_table',    name: 'Round Table',         category: 'furniture',  cost:  60, ambianceValue: 12, spriteKey: 'deco_round_table',    tileW: 1, tileH: 1 },
  { id: 'booth_seat',     name: 'Booth Seat',          category: 'furniture',  cost: 160, ambianceValue: 28, spriteKey: 'deco_booth_seat',     tileW: 1, tileH: 1 },
  // Lighting
  { id: 'fairy_lights',   name: 'Fairy Lights',        category: 'lighting',   cost:  50, ambianceValue: 10, spriteKey: 'deco_fairy_lights',   tileW: 1, tileH: 1 },
  { id: 'neon_sign',      name: 'Neon Sign',           category: 'lighting',   cost: 180, ambianceValue: 28, spriteKey: 'deco_neon_sign',      tileW: 1, tileH: 1 },
  { id: 'crystal_lamp',   name: 'Crystal Lamp',        category: 'lighting',   cost: 280, ambianceValue: 40, spriteKey: 'deco_crystal_lamp',   tileW: 1, tileH: 1 },
  // Plants
  { id: 'luna_fern',      name: 'Luna Fern',           category: 'plants',     cost:  55, ambianceValue: 12, spriteKey: 'deco_luna_fern',      tileW: 1, tileH: 1 },
  { id: 'space_cactus',   name: 'Space Cactus',        category: 'plants',     cost:  90, ambianceValue: 18, spriteKey: 'deco_space_cactus',   tileW: 1, tileH: 1 },
  { id: 'moon_bloom',     name: 'Moon Bloom',          category: 'plants',     cost: 160, ambianceValue: 30, spriteKey: 'deco_moon_bloom',     tileW: 1, tileH: 1 },
  // Wall decor
  { id: 'star_map',       name: 'Star Map',            category: 'wallDecor',  cost: 120, ambianceValue: 22, spriteKey: 'deco_star_map',       tileW: 1, tileH: 1 },
  { id: 'moon_portrait',  name: 'Moon Portrait',       category: 'wallDecor',  cost: 220, ambianceValue: 35, spriteKey: 'deco_moon_portrait',  tileW: 1, tileH: 1 },
  // Specialty
  { id: 'telescope',      name: 'Telescope',           category: 'specialty',  cost: 300, ambianceValue: 45, spriteKey: 'deco_telescope',      tileW: 1, tileH: 1 },
  { id: 'rover_display',  name: 'Rover Display',       category: 'specialty',  cost: 400, ambianceValue: 55, spriteKey: 'deco_rover_display',  tileW: 1, tileH: 1 },
  { id: 'cat_statue',     name: 'Cat Statue',          category: 'specialty',  cost: 240, ambianceValue: 35, spriteKey: 'deco_cat_statue',     tileW: 1, tileH: 1 },
];

export const CAT_NAMES = ['Luna', 'Captain Whiskers', 'Nova', 'Comet', 'Orbit', 'Nebula'];

export const EMPLOYEE_NAMES = ['Astrid', 'Leo', 'Zara', 'Finn'];

export const SHOP_ITEMS = [
  { id: 'cat_toy',        name: 'Cat Toy',        cost:  40, max: 4, desc: 'Cats play more, +happiness' },
  { id: 'cat_tree',       name: 'Cat Tree',        cost:  80, max: 2, desc: 'Cats love to climb!' },
  { id: 'employee',       name: 'Hire Waiter',     cost: 150, max: 2, desc: 'Auto-takes orders' },
  { id: 'extra_machines', name: 'Extra Machines',  cost: 180, max: 1, desc: '+1 station of each type for parallel cooking' },
] as const;

export const COLORS = {
  // Interior floor — warm amber parquet with rich dark grain
  FLOOR_A:         0xC8762A,  // warm amber oak
  FLOOR_B:         0xA85E1A,  // darker amber
  FLOOR_SEAM:      0x7A3E08,  // dark wood seam

  // Rich plum/indigo walls with gold trim
  WALL_CREAM:      0x2A1A40,  // deep indigo wall
  WALL_DARK:       0x180E28,  // darker indigo base
  WINDOW_FRAME:    0xC8920A,  // gold frame

  // Counters — dark marble with gold veining
  COUNTER_TOP:     0x2E1E4A,  // deep purple-slate
  COUNTER_SIDE:    0x1C1030,

  // Furniture — rich mahogany + brass
  TABLE_TOP:       0x6B3A10,  // deep mahogany
  TABLE_LEG:       0x4A2408,
  CHAIR_TOP:       0x8B2040,  // deep crimson cushion
  CHAIR_LEG:       0x5A1428,

  // Kitchen tiles — dark slate with warm accent
  KITCHEN_A:       0x1E2030,  // dark slate
  KITCHEN_B:       0x161828,  // darker slate
  KITCHEN_GROUT:   0x3A3050,

  // Space exterior — very deep indigo/violet
  SPACE_DEEP:      0x03020E,
  SPACE_MID:       0x06041C,
  SPACE_BLUE:      0x0A0830,
  MOON_GRAY:       0x8A8A9A,  // moon surface
  MOON_LIGHT:      0xB0B0C0,
  MOON_DARK:       0x6A6A7A,

  // Earth & celestial
  EARTH_OCEAN:     0x1A6FAA,
  EARTH_LAND:      0x2E7D52,
  EARTH_CLOUD:     0xDDEEFF,
  DOME_GLASS:      0x88AACC,

  // Cat colors
  CAT_ORANGE:      0xFF8C42,
  CAT_ORANGE_D:    0xCC6020,
  CAT_GRAY:        0x9E9E9E,
  CAT_GRAY_D:      0x6E6E6E,
  CAT_BLACK:       0x222233,
  CAT_BLACK_D:     0x111122,
  CAT_CREAM:       0xF0DEB0,
  CAT_CREAM_D:     0xD0B890,
  CAT_NOSE:        0xFF9999,
  CAT_EYE:         0x44CC44,

  // Customer palette
  SKIN_A:          0xFFDBAC,
  SKIN_B:          0xD4944A,
  ASTRONAUT_SUIT:  0xCCCCDD,
  ASTRONAUT_VISOR: 0x4ECDC4,
  SCIENTIST_COAT:  0xEEEEEE,
  SCIENTIST_HAT:   0x334466,
  TOURIST_SHIRT:   0xFF6B6B,
  WORKER_SUIT:     0xFF9A3C,

  // Player
  PLAYER_SUIT:     0xDDDDFF,
  PLAYER_VISOR:    0x5CE0D8,

  // Employee
  EMPLOYEE_SUIT:   0x66CC88,
  EMPLOYEE_VISOR:  0xFFDD44,

  // UI — deep space-purple panels with gold
  UI_GOLD:         0xFFD700,
  UI_HEART:        0xFF6B8A,
  UI_STAR:         0xFFE566,
  UI_PANEL:        0x0E0820,  // very deep indigo
  UI_PANEL_LIGHT:  0x1E1438,
  UI_TEXT:         0xFFEDD0,
  UI_PATIENCE_OK:  0x66DD66,
  UI_PATIENCE_LOW: 0xFF6633,
  PARTICLE_STEAM:  0xCCDDDD,
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
