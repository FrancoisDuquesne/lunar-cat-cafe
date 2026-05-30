export const TILE = 32;
export const GAME_W = 960;
export const GAME_H = 576;
export const MAP_COLS = 30;
export const MAP_ROWS = 18;

export const PLAYER_SPEED = 130;
export const DAY_DURATION_MS = 300_000; // 5 minutes
export const CUSTOMER_SPAWN_MS = 18_000; // base 18 seconds between spawns

export const MENU_ITEMS = [
  { id: 'moon_mocha',    name: 'Moon Mocha',       price: 18, prepTime: 10000, station: 'coffee' },
  { id: 'zerog_latte',   name: 'Zero-G Latte',     price: 14, prepTime: 8000,  station: 'coffee' },
  { id: 'luna_pancakes', name: 'Lunar Pancakes',   price: 22, prepTime: 18000, station: 'stove'  },
  { id: 'star_cookies',  name: 'Stardust Cookies', price: 12, prepTime: 14000, station: 'prep'   },
] as const;

export type MenuId = typeof MENU_ITEMS[number]['id'];

export const CAT_NAMES = ['Luna', 'Captain Whiskers', 'Nova', 'Comet', 'Orbit', 'Nebula'];

export const EMPLOYEE_NAMES = ['Astrid', 'Leo', 'Zara', 'Finn'];

export const SHOP_ITEMS = [
  { id: 'cat_toy',        name: 'Cat Toy',        cost:  40, max: 4, desc: 'Cats play more, +happiness' },
  { id: 'cat_tree',       name: 'Cat Tree',        cost:  80, max: 2, desc: 'Cats love to climb!' },
  { id: 'employee',       name: 'Hire Waiter',     cost: 150, max: 2, desc: 'Auto-takes orders' },
  { id: 'extra_machines', name: 'Extra Machines',  cost: 180, max: 1, desc: '+1 station of each type for parallel cooking' },
] as const;

export const COLORS = {
  // Interior warm palette
  FLOOR_A:         0xC49030,
  FLOOR_B:         0xB07820,
  FLOOR_SEAM:      0x8B5A14,
  WALL_CREAM:      0xF0E0C0,
  WALL_DARK:       0xD4B896,
  WINDOW_FRAME:    0xDDCCAA,
  COUNTER_TOP:     0x8B6040,
  COUNTER_SIDE:    0x6B4020,
  TABLE_TOP:       0x9B7050,
  TABLE_LEG:       0x7B5030,
  CHAIR_TOP:       0xB08060,
  CHAIR_LEG:       0x8B6040,

  // Kitchen floor
  KITCHEN_A:       0xCCBBAA,
  KITCHEN_B:       0xAA9988,
  KITCHEN_GROUT:   0x887766,

  // Space / exterior palette
  SPACE_DEEP:      0x050510,
  SPACE_MID:       0x0A0A28,
  SPACE_BLUE:      0x0D1040,
  MOON_GRAY:       0x8A8A9A,
  MOON_LIGHT:      0xB0B0C0,
  MOON_DARK:       0x6A6A7A,
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
  ASTRONAUT_SUIT:  0xDDDDEE,
  ASTRONAUT_VISOR: 0x4ECDC4,
  SCIENTIST_COAT:  0xEEEEEE,
  SCIENTIST_HAT:   0x334466,
  TOURIST_SHIRT:   0xFF6B6B,
  WORKER_SUIT:     0xFF9A3C,

  // Player
  PLAYER_SUIT:     0xEEEEFF,
  PLAYER_VISOR:    0x5CE0D8,

  // Employee
  EMPLOYEE_SUIT:   0x66CC88,
  EMPLOYEE_VISOR:  0xFFDD44,

  // UI
  UI_GOLD:         0xFFD700,
  UI_HEART:        0xFF6B8A,
  UI_STAR:         0xFFE566,
  UI_PANEL:        0x2A1F0F,
  UI_PANEL_LIGHT:  0x4A3520,
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
