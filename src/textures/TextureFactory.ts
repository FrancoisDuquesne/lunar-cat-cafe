import Phaser from 'phaser';
import { COLORS, TILE } from '../constants';

function px(g: Phaser.GameObjects.Graphics, color: number, x: number, y: number, w = 1, h = 1, s = 1): void {
  g.fillStyle(color, 1);
  g.fillRect(x * s, y * s, w * s, h * s);
}

function makeGraphics(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  return scene.add.graphics();
}

function gen(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics, key: string, w: number, h: number): void {
  g.generateTexture(key, w, h);
  g.destroy();
}

// ─────────────────────────────────────────────
// TILE TEXTURES
// ─────────────────────────────────────────────

export function createFloorTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Rich warm amber oak planks running horizontal
  g.fillStyle(COLORS.FLOOR_A, 1); g.fillRect(0, 0, TILE, TILE);
  // Plank seams (horizontal dark lines)
  g.fillStyle(COLORS.FLOOR_SEAM, 1);
  g.fillRect(0, 10, TILE, 1);
  g.fillRect(0, 21, TILE, 1);
  // Wood grain highlights
  g.fillStyle(0xE0922E, 1);
  g.fillRect(0, 2, TILE, 2);
  g.fillRect(0, 13, TILE, 2);
  g.fillRect(0, 24, TILE, 2);
  // Grain knots/lines
  g.fillStyle(COLORS.FLOOR_B, 1);
  g.fillRect(4, 4, 10, 1);
  g.fillRect(18, 15, 8, 1);
  g.fillRect(7, 26, 12, 1);
  // Warm highlight strip (from ambient light)
  g.fillStyle(0xDC8030, 0.4);
  g.fillRect(0, 0, TILE, 4);
  gen(scene, g, 'tile_floor', TILE, TILE);
}

export function createFloorDarkTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(COLORS.FLOOR_B, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(COLORS.FLOOR_SEAM, 1);
  g.fillRect(0, 10, TILE, 1);
  g.fillRect(0, 21, TILE, 1);
  g.fillStyle(0xBC6818, 1);
  g.fillRect(0, 2, TILE, 2);
  g.fillRect(0, 13, TILE, 2);
  g.fillRect(0, 24, TILE, 2);
  g.fillStyle(0x8A3E0A, 1);
  g.fillRect(8, 5, 8, 1);
  g.fillRect(20, 16, 6, 1);
  gen(scene, g, 'tile_floor_dark', TILE, TILE);
}

export function createKitchenFloorTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Dark slate checkerboard — moody professional kitchen
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const color = (r + c) % 2 === 0 ? COLORS.KITCHEN_A : COLORS.KITCHEN_B;
      g.fillStyle(color, 1);
      g.fillRect(c * 16, r * 16, 16, 16);
    }
  }
  // Grout lines — subtle purple-grey
  g.fillStyle(COLORS.KITCHEN_GROUT, 1);
  g.fillRect(0, 15, TILE, 2);
  g.fillRect(15, 0, 2, TILE);
  gen(scene, g, 'tile_kitchen', TILE, TILE);
}

export function createWallTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Deep indigo wall
  g.fillStyle(COLORS.WALL_CREAM, 1); g.fillRect(0, 0, TILE, TILE);
  // Darker base shadow
  g.fillStyle(COLORS.WALL_DARK, 1);
  g.fillRect(0, TILE - 4, TILE, 4);
  g.fillRect(0, 0, 2, TILE);
  // Gold decorative trim band
  g.fillStyle(COLORS.WINDOW_FRAME, 1);
  g.fillRect(2, 2, TILE - 4, 2);
  g.fillRect(2, TILE - 8, TILE - 4, 2);
  // Subtle wall panel recesses
  g.fillStyle(0x221534, 1);
  g.fillRect(4, 6, TILE - 8, TILE - 18);
  // Inner panel highlight
  g.fillStyle(0x341E52, 1);
  g.fillRect(5, 7, TILE - 10, TILE - 20);
  gen(scene, g, 'tile_wall', TILE, TILE);
}

export function createWindowTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Very deep space backdrop
  g.fillStyle(COLORS.SPACE_DEEP, 1); g.fillRect(0, 0, TILE, TILE);
  // Nebula washes
  g.fillStyle(0x1A0440, 0.6); g.fillCircle(8, 6, 12);
  g.fillStyle(0x050230, 0.8); g.fillCircle(22, 20, 14);
  // Stars — varying brightness
  g.fillStyle(0xFFFFFF, 1);
  [[3,4],[8,9],[16,4],[24,12],[11,19],[26,7],[29,23],[2,27]].forEach(([x,y]) => g.fillRect(x, y, 2, 2));
  [[14,8],[22,20],[9,27],[28,10],[5,22],[17,15]].forEach(([x,y]) => g.fillRect(x, y, 1, 1));
  // Brighter star — slight glow hint
  g.fillStyle(0xFFEECC, 1); g.fillRect(20, 6, 2, 2);
  g.fillStyle(0xFFFFFF, 0.4); g.fillRect(19, 5, 4, 4);
  // Window frame — gold with indigo shadow
  g.fillStyle(COLORS.WINDOW_FRAME, 1);
  g.fillRect(0, 0, TILE, 3);
  g.fillRect(0, TILE - 3, TILE, 3);
  g.fillRect(0, 0, 3, TILE);
  g.fillRect(TILE - 3, 0, 3, TILE);
  // Inner frame inset shadow
  g.fillStyle(0x1A0440, 1);
  g.fillRect(3, 3, TILE - 6, 2);
  g.fillRect(3, 3, 2, TILE - 6);
  gen(scene, g, 'tile_window', TILE, TILE);
}

export function createCounterTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Deep purple-slate counter top
  g.fillStyle(COLORS.COUNTER_TOP, 1); g.fillRect(0, 0, TILE, TILE);
  // Gold vein lines
  g.fillStyle(0xC8920A, 1);
  g.fillRect(0, 0, TILE, 1);
  g.fillRect(6, 0, 1, TILE);
  g.fillRect(18, 0, 1, TILE - 6);
  g.fillRect(26, 4, 1, TILE - 8);
  // Gold accent line — top edge
  g.fillStyle(0xFFD700, 1); g.fillRect(0, 0, TILE, 2);
  // Side face
  g.fillStyle(COLORS.COUNTER_SIDE, 1);
  g.fillRect(0, TILE - 6, TILE, 6);
  g.fillRect(0, 0, 2, TILE);
  // Subtle highlight on top-left of counter face
  g.fillStyle(0x3A2860, 1);
  g.fillRect(2, 2, 6, TILE - 8);
  gen(scene, g, 'tile_counter', TILE, TILE);
}

export function createSpaceTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(COLORS.SPACE_DEEP, 1); g.fillRect(0, 0, TILE, TILE);
  // Nebula gradient blobs
  g.fillStyle(0x14042A, 0.7); g.fillCircle(12, 10, 14);
  g.fillStyle(0x0C0218, 0.6); g.fillCircle(24, 22, 12);
  // Stars
  g.fillStyle(0xFFFFFF, 0.8);
  [[5,5],[12,20],[22,8],[28,25],[3,28],[18,14],[9,3],[25,18]].forEach(([x,y]) => g.fillRect(x,y,1,1));
  g.fillStyle(0xFFEECC, 0.9); [[7,12],[22,6]].forEach(([x,y]) => g.fillRect(x,y,2,2));
  gen(scene, g, 'tile_space', TILE, TILE);
}

export function createMoonTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(COLORS.MOON_GRAY, 1); g.fillRect(0, 0, TILE, TILE);
  // Surface texture variation
  g.fillStyle(COLORS.MOON_DARK, 1);
  [[8,8,5],[22,18,4],[4,22,3]].forEach(([x,y,r]) => g.fillCircle(x,y,r));
  g.fillStyle(COLORS.MOON_LIGHT, 1);
  [[7,7,2],[21,17,2],[3,21,1]].forEach(([x,y,r]) => g.fillCircle(x,y,r));
  gen(scene, g, 'tile_moon', TILE, TILE);
}

export function createDomeTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(COLORS.SPACE_DEEP, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(COLORS.DOME_GLASS, 0.4); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(COLORS.DOME_GLASS, 0.6);
  g.fillRect(0, 0, 3, TILE);
  g.fillRect(TILE - 3, 0, 3, TILE);
  gen(scene, g, 'tile_dome', TILE, TILE);
}

// ─────────────────────────────────────────────
// FURNITURE / OBJECT TEXTURES
// ─────────────────────────────────────────────

export function createTableTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 52, H = 44;
  // Deep mahogany top
  g.fillStyle(COLORS.TABLE_TOP, 1); g.fillRoundedRect(2, 2, W-4, H-12, 4);
  // Wood grain
  g.fillStyle(0x7E4516, 1);
  [10, 22, 36].forEach(x => g.fillRect(x, 4, 2, H - 16));
  // Brass inlay edge
  g.fillStyle(0xC8920A, 1);
  g.fillRect(2, 2, W-4, 2);
  g.fillRect(2, H-14, W-4, 2);
  // Warm surface highlight (ambient lamp glow)
  g.fillStyle(0xFF9030, 0.18);
  g.fillRect(6, 4, W-12, 6);
  // Legs — brass
  g.fillStyle(0xC8920A, 1); g.fillRect(2, H-12, W-4, 6);
  [[6, H-6], [W-10, H-6]].forEach(([x, y]) => {
    g.fillStyle(0xC8920A, 1); g.fillRect(x, y, 6, 6);
  });
  gen(scene, g, 'obj_table', W, H);
}

export function createGroupTableTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 76, H = 44;
  g.fillStyle(COLORS.TABLE_TOP, 1); g.fillRoundedRect(2, 2, W-4, H-12, 4);
  g.fillStyle(0x7E4516, 1);
  [14, 28, 44, 58].forEach(x => g.fillRect(x, 4, 2, H - 16));
  g.fillStyle(0xC8920A, 1);
  g.fillRect(2, 2, W-4, 2);
  g.fillRect(2, H-14, W-4, 2);
  g.fillStyle(0xFF9030, 0.18);
  g.fillRect(6, 4, W-12, 6);
  g.fillStyle(0xC8920A, 1); g.fillRect(2, H-12, W-4, 6);
  [[6, H-6], [W-10, H-6]].forEach(([x, y]) => {
    g.fillStyle(0xC8920A, 1); g.fillRect(x, y, 6, 6);
  });
  gen(scene, g, 'obj_table_group', W, H);
}

export function createChairTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 22, H = 22;
  // Deep crimson seat cushion
  g.fillStyle(COLORS.CHAIR_TOP, 1); g.fillRoundedRect(2, 4, W-4, H-8, 3);
  // Tufted highlight
  g.fillStyle(0xAA2A50, 1); g.fillRoundedRect(4, 6, W-8, 6, 2);
  // Small central tuft
  g.fillStyle(0x7A1030, 1); g.fillCircle(W/2, 9, 2);
  g.fillStyle(0xC0304A, 1); g.fillCircle(W/2, 9, 1);
  // Brass legs
  [[2,H-6],[W-6,H-6]].forEach(([x,y]) => {
    g.fillStyle(0xC8920A, 1); g.fillRect(x, y, 4, 6);
  });
  gen(scene, g, 'obj_chair', W, H);
}

export function createCoffeeMachineTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  // Dark body with metallic sheen
  g.fillStyle(0x1A1A2A, 1); g.fillRoundedRect(2, 4, W-4, H-8, 3);
  // Glowing screen
  g.fillStyle(0x0A0A18, 1); g.fillRoundedRect(6, 8, W-12, H-20, 2);
  g.fillStyle(0x00AADD, 0.9); g.fillRect(8, 10, W-16, 5);
  // Status lights
  g.fillStyle(0xFF4444, 1); g.fillCircle(W-7, 8, 3);
  g.fillStyle(0x44FF88, 1); g.fillCircle(W-7, 16, 2);
  // Spout — glowing amber
  g.fillStyle(0xC8920A, 1); g.fillRect(W/2-3, H-8, 6, 4);
  g.fillStyle(0xFF9900, 0.7); g.fillRect(W/2-2, H-6, 4, 2);
  // Gold trim
  g.fillStyle(0xC8920A, 1);
  g.fillRect(2, 4, W-4, 2);
  g.fillRect(2, H-6, W-4, 2);
  gen(scene, g, 'obj_coffee_machine', W, H);
}

export function createStoveTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  g.fillStyle(0x1A1C28, 1); g.fillRoundedRect(2, 2, W-4, H-4, 3);
  [[10,10],[20,10],[10,20],[20,20]].forEach(([cx,cy]) => {
    g.fillStyle(0x0A0C18, 1); g.fillCircle(cx, cy, 5);
    // Glowing burner ring — orange/red
    g.fillStyle(0xFF5500, 0.8); g.fillCircle(cx, cy, 4);
    g.fillStyle(0xFF8800, 0.9); g.fillCircle(cx, cy, 3);
    g.fillStyle(0xFFAA00, 1); g.fillCircle(cx, cy, 1);
  });
  // Gold trim
  g.fillStyle(0xC8920A, 1);
  g.fillRect(2, 2, W-4, 2);
  gen(scene, g, 'obj_stove', W, H);
}

export function createPrepCounterTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  // Marble / light stone top
  g.fillStyle(0xDDDDCC, 1); g.fillRoundedRect(2, 2, W-4, H-4, 2);
  g.fillStyle(0xCCCCBB, 1);
  [8,14,20].forEach(x => g.fillRect(x, 6, 2, H-12));
  [8,14,20].forEach(y => g.fillRect(6, y, W-12, 1));
  // Gold edge trim
  g.fillStyle(0xC8920A, 1);
  g.fillRect(2, 2, W-4, 2);
  g.fillRect(2, H-4, W-4, 2);
  gen(scene, g, 'obj_prep_counter', W, H);
}

export function createTrashCanTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 26;
  g.fillStyle(0x1A2A1A, 1); g.fillRoundedRect(3, 5, W-6, H-7, 2);
  g.fillStyle(0x223322, 1); g.fillRoundedRect(2, 0, W-4, 5, 2);
  g.fillStyle(0xC8920A, 1); g.fillRect(W/2-2, 0, 4, 3);
  g.fillStyle(0x2A4A2A, 1);
  [10, 15, 20].forEach(y => g.fillRect(3, y, W-6, 1));
  g.fillStyle(0xC8920A, 1); g.fillRect(8, 8, 4, 8); g.fillRect(6, 7, 8, 2);
  gen(scene, g, 'obj_trash_can', W, H);
}

export function createCatToyTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 18, H = 20;
  g.fillStyle(0xCCCCCC, 1); g.fillRect(W/2-1, 0, 2, 8);
  g.fillStyle(0xFF4466, 1); g.fillCircle(W/2, 14, 6);
  g.fillStyle(0xFF88AA, 1); g.fillCircle(W/2-2, 11, 3);
  g.fillStyle(0xFFD700, 1); g.fillCircle(W/2, 14, 3);
  g.fillStyle(0xAA8800, 1); g.fillCircle(W/2, 14, 1);
  gen(scene, g, 'obj_cat_toy', W, H);
}

export function createCatTreeTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 30, H = 44;
  // Brass base
  g.fillStyle(0xC8920A, 1); g.fillRoundedRect(4, H-8, W-8, 8, 2);
  // Dark wood trunk
  g.fillStyle(0x4A2408, 1); g.fillRect(W/2-3, 16, 6, H-24);
  // Platforms — dark mahogany with crimson cushion
  g.fillStyle(0x4A2408, 1); g.fillRoundedRect(2, H-20, W-4, 6, 2);
  g.fillStyle(COLORS.CHAIR_TOP, 1); g.fillRect(3, H-19, W-6, 3);
  g.fillStyle(0x4A2408, 1); g.fillRoundedRect(4, H-36, W-8, 6, 2);
  g.fillStyle(COLORS.CHAIR_TOP, 1); g.fillRect(5, H-35, W-10, 3);
  // Top lounge — deep purple cushion
  g.fillStyle(0x4A1A6A, 1); g.fillEllipse(W/2, 8, W-6, 12);
  g.fillStyle(0x6A2A9A, 1); g.fillEllipse(W/2, 7, W-12, 8);
  gen(scene, g, 'obj_cat_tree', W, H);
}

export function createCatBedTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 36, H = 28;
  // Deep purple outer ring
  g.fillStyle(0x4A1A6A, 1); g.fillEllipse(W/2, H/2, W-4, H-4);
  // Crimson inner cushion
  g.fillStyle(COLORS.CHAIR_TOP, 1); g.fillEllipse(W/2, H/2+2, W-8, H-8);
  // Highlight
  g.fillStyle(0xAA2A50, 1); g.fillEllipse(W/2-4, H/2-2, 12, 8);
  gen(scene, g, 'obj_cat_bed', W, H);
}

export function createPlantTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 28;
  // Brass pot
  g.fillStyle(0xC8920A, 1); g.fillRect(4, H-10, W-8, 8);
  g.fillStyle(0xAA7800, 1); g.fillRect(2, H-12, W-4, 3);
  // Engraved ring
  g.fillStyle(0xFFD700, 1); g.fillRect(4, H-8, W-8, 1);
  g.fillStyle(0x7A5500, 1); g.fillRect(4, H-10, W-8, 2);
  // Rich green foliage
  g.fillStyle(0x2A7030, 1);
  g.fillEllipse(W/2, 8, 10, 14);
  g.fillEllipse(W/2-5, 12, 8, 10);
  g.fillEllipse(W/2+5, 11, 8, 10);
  g.fillStyle(0x448844, 1);
  g.fillEllipse(W/2, 6, 6, 8);
  gen(scene, g, 'obj_plant', W, H);
}

export function createFoodBowlTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 14;
  g.fillStyle(0x99BBCC, 1); g.fillEllipse(W/2, H/2, W, H);
  g.fillStyle(0xBBDDEE, 1); g.fillEllipse(W/2, H/2-1, W-4, H-6);
  g.fillStyle(0xFFAA44, 1); g.fillEllipse(W/2, H/2-1, W-8, H-8);
  gen(scene, g, 'obj_food_bowl', W, H);
}

export function createMoonRockTexture(scene: Phaser.Scene): void {
  {
    const g = makeGraphics(scene);
    const W = 24, H = 18;
    g.fillStyle(COLORS.MOON_GRAY, 1); g.fillEllipse(W/2, H/2+2, W-4, H-4);
    g.fillStyle(COLORS.MOON_DARK, 1); g.fillCircle(8, 8, 3); g.fillCircle(16, 12, 2);
    g.fillStyle(COLORS.MOON_LIGHT, 1); g.fillCircle(7, 7, 1); g.fillCircle(15, 11, 1);
    gen(scene, g, 'obj_moon_rock_sm', W, H);
  }
  {
    const g = makeGraphics(scene);
    const W = 40, H = 30;
    g.fillStyle(COLORS.MOON_GRAY, 1); g.fillEllipse(W/2, H/2+3, W-6, H-6);
    g.fillStyle(COLORS.MOON_DARK, 1);
    [[10,10,5],[24,18,3],[8,20,4]].forEach(([cx,cy,r]) => g.fillCircle(cx,cy,r));
    g.fillStyle(COLORS.MOON_LIGHT, 1);
    [[9,9,2],[23,17,1],[7,19,2]].forEach(([cx,cy,r]) => g.fillCircle(cx,cy,r));
    gen(scene, g, 'obj_moon_rock_lg', W, H);
  }
}

export function createMoonFlagTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 36;
  g.fillStyle(0xC8920A, 1); g.fillRect(8, 2, 2, H-4);
  g.fillStyle(0xFF4444, 1); g.fillRect(10, 4, W-11, 10);
  g.fillStyle(0xFFFFFF, 1);
  g.fillRect(10, 4, W-11, 3);
  g.fillRect(10, 10, W-11, 4);
  g.fillStyle(0xFFDD00, 1);
  g.fillRect(12, 6, 4, 2);
  g.fillRect(13, 5, 2, 4);
  g.fillStyle(0xC8920A, 1); g.fillRect(4, H-4, 12, 4);
  gen(scene, g, 'obj_moon_flag', W, H);
}

export function createLunarRoverTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 50, H = 28;
  g.fillStyle(0x888899, 1); g.fillRoundedRect(8, 6, W-16, H-14, 4);
  g.fillStyle(COLORS.DOME_GLASS, 0.8); g.fillRoundedRect(14, 8, 16, 8, 3);
  g.fillStyle(0x334455, 0.5); g.fillRoundedRect(15, 9, 14, 6, 2);
  [[4,H-8],[W-12,H-8],[4,H-20],[W-12,H-20]].forEach(([wx,wy]) => {
    g.fillStyle(0x333344, 1); g.fillCircle(wx+4, wy+4, 6);
    g.fillStyle(0x555566, 1); g.fillCircle(wx+4, wy+4, 4);
    g.fillStyle(0x777788, 1); g.fillCircle(wx+4, wy+4, 2);
  });
  g.fillStyle(0xC8920A, 1); g.fillRect(W-10, 0, 2, 8);
  g.fillStyle(0xFF4444, 1); g.fillCircle(W-9, 0, 2);
  g.fillStyle(0x334488, 1); g.fillRect(0, 10, 8, 6);
  g.fillStyle(0x4455AA, 1); g.fillRect(1, 11, 6, 4);
  gen(scene, g, 'obj_lunar_rover', W, H);
}

// ─────────────────────────────────────────────
// FOOD ITEM TEXTURES
// ─────────────────────────────────────────────

export function createFoodTextures(scene: Phaser.Scene): void {
  // Moon Mocha — rich dark cup with amber glow
  {
    const g = makeGraphics(scene);
    const W = 20, H = 20;
    g.fillStyle(0x3A1A08, 1); g.fillRect(4, 6, W-8, H-8);
    g.fillStyle(0x6B3C1F, 1); g.fillRect(5, 7, W-10, 5);
    // Latte art / froth glow
    g.fillStyle(0xFFCC88, 0.9); g.fillEllipse(W/2, 8, W-12, 4);
    g.fillStyle(0xFF9040, 0.6); g.fillRect(8, 7, 4, 2);
    g.fillStyle(0xC8920A, 1); g.fillRect(2, H-4, W-4, 3);
    g.fillStyle(0xFFD700, 1); g.fillRect(2, H-4, W-4, 1);
    g.fillStyle(0xC8920A, 1); g.fillRect(W-4, 8, 4, 6);
    gen(scene, g, 'food_moon_mocha', W, H);
  }
  // Zero-G Latte — glowing cyan/teal capsule
  {
    const g = makeGraphics(scene);
    const W = 18, H = 20;
    g.fillStyle(0x0A2A2A, 1); g.fillRoundedRect(3, 4, W-6, H-6, 3);
    g.fillStyle(0x00CCBB, 0.9); g.fillRect(5, 5, W-10, 3);
    g.fillStyle(0x00FFEE, 0.5); g.fillRect(5, 5, W-10, 1);
    g.fillStyle(0x336655, 1); g.fillRect(6, 6, 2, 2);
    g.fillStyle(0x44DDCC, 1); g.fillRect(5, H-8, W-10, 3);
    gen(scene, g, 'food_zerog_latte', W, H);
  }
  // Lunar Pancakes — golden stack with amber syrup
  {
    const g = makeGraphics(scene);
    const W = 24, H = 18;
    [[0,0xC47A2A],[3,0xD48A3A],[6,0xE4A04A]].forEach(([yOff, col]) => {
      g.fillStyle(col as number, 1);
      g.fillEllipse(W/2, H-4-yOff, W-4, 5);
    });
    // Amber syrup drip
    g.fillStyle(0xFFAA00, 1); g.fillRect(W/2-3, H-14, 6, 4);
    g.fillStyle(0xFF8800, 0.7); g.fillRect(W/2-1, H-11, 2, 3);
    gen(scene, g, 'food_luna_pancakes', W, H);
  }
  // Stardust Cookies — deep golden with star sparkle
  {
    const g = makeGraphics(scene);
    const W = 22, H = 18;
    g.fillStyle(0x2A1A08, 1); g.fillEllipse(W/2, H-3, W-2, 7);
    [[6,10],[12,10],[16,12],[10,6]].forEach(([x,y]) => {
      g.fillStyle(0xCC9944, 1); g.fillCircle(x, y, 4);
      g.fillStyle(0xAA7722, 1); g.fillCircle(x, y, 2);
      g.fillStyle(0xFFDD44, 1); g.fillRect(x-1, y-2, 1, 5); g.fillRect(x-2, y-1, 5, 1);
    });
    gen(scene, g, 'food_star_cookies', W, H);
  }
  // Lunar Fondue — rich molten cheese pot with glow
  {
    const g = makeGraphics(scene);
    const W = 22, H = 20;
    g.fillStyle(0x4A2800, 1); g.fillEllipse(W/2, H-3, W-2, 8);
    g.fillStyle(0xC8920A, 1); g.fillRect(2, 8, W-4, 6);
    g.fillStyle(0xFFCC44, 0.9); g.fillEllipse(W/2, 10, W-6, 5);
    g.fillStyle(0xFFEE88, 0.7); g.fillEllipse(W/2-2, 9, 6, 3);
    g.fillStyle(0x6B3810, 1); g.fillRect(3, H-8, W-6, 4);
    g.fillStyle(0xC8920A, 1); g.fillRect(0, H-5, 3, 3); g.fillRect(W-3, H-5, 3, 3);
    gen(scene, g, 'food_lunar_fondue', W, H);
  }
  // Nebula Risotto — purple-pink cosmic rice bowl
  {
    const g = makeGraphics(scene);
    const W = 24, H = 20;
    g.fillStyle(0x1A0A2A, 1); g.fillEllipse(W/2, H-2, W-2, 8);
    g.fillStyle(0x6622AA, 1); g.fillEllipse(W/2, H-6, W-6, 7);
    g.fillStyle(0xAA44CC, 0.9); g.fillEllipse(W/2, H-8, W-10, 5);
    g.fillStyle(0xFF88EE, 0.7); g.fillEllipse(W/2-2, H-9, 6, 3);
    g.fillStyle(0xFFAAFF, 0.4); g.fillCircle(W/2+3, H-10, 2);
    g.fillStyle(0xFFD700, 0.8); g.fillRect(W/2, 4, 1, 1); g.fillRect(W/2-3, 6, 1, 1); g.fillRect(W/2+4, 5, 1, 1);
    gen(scene, g, 'food_nebula_risotto', W, H);
  }
  // Gravity Soufflé — tall risen pastry with golden crust
  {
    const g = makeGraphics(scene);
    const W = 22, H = 22;
    g.fillStyle(0x4A2E08, 1); g.fillRect(4, H-6, W-8, 5);
    g.fillStyle(0xC8920A, 1); g.fillRect(3, H-7, W-6, 2);
    g.fillStyle(0xE8A820, 1); g.fillEllipse(W/2, H-10, W-4, 8);
    g.fillStyle(0xFFCC44, 0.9); g.fillEllipse(W/2, H-13, W-8, 6);
    g.fillStyle(0xFFF4CC, 0.8); g.fillEllipse(W/2-1, H-14, 6, 4);
    g.fillStyle(0xFFD700, 0.6); g.fillRect(W/2-1, 4, 1, 3); g.fillRect(W/2+2, 2, 1, 2); g.fillRect(W/2-3, 3, 1, 2);
    gen(scene, g, 'food_gravity_souffle', W, H);
  }
}

// ─────────────────────────────────────────────
// CHARACTER TEXTURES
// ─────────────────────────────────────────────

function drawAstronautBody(g: Phaser.GameObjects.Graphics, sx: number, skinColor: number, suitColor: number, visorColor: number, facingDir: 'down' | 'up' | 'side'): void {
  const s = 1;
  px(g, suitColor,   sx+4, 0, 8, 8, s);
  if (facingDir === 'down') {
    px(g, 0x000022, sx+5, 2, 6, 3, s);
    px(g, visorColor, sx+5, 2, 6, 2, s);
  } else if (facingDir === 'up') {
    px(g, 0x111133, sx+5, 2, 6, 4, s);
  } else {
    px(g, 0x000022, sx+5, 2, 5, 4, s);
    px(g, visorColor, sx+5, 2, 5, 3, s);
  }
  px(g, 0xC8920A,  sx+3, 7, 10, 2, s); // gold neck ring
  px(g, suitColor, sx+3, 9, 10, 9, s);
  px(g, 0xC8920A,  sx+4, 10, 8, 1, s); // chest detail
  px(g, suitColor, sx+1, 10, 2, 7, s);
  px(g, suitColor, sx+13, 10, 2, 7, s);
  px(g, 0x888899, sx+1, 17, 2, 2, s);
  px(g, 0x888899, sx+13, 17, 2, 2, s);
  px(g, suitColor, sx+4, 18, 4, 5, s);
  px(g, suitColor, sx+8, 18, 4, 5, s);
  px(g, 0x444455, sx+3, 22, 5, 2, s);
  px(g, 0x444455, sx+8, 22, 5, 2, s);
  if (facingDir === 'up') {
    px(g, 0x445566, sx+3, 9, 2, 8, s);
    px(g, 0x445566, sx+11, 9, 2, 8, s);
  }
  void skinColor;
}

export function createPlayerTextures(scene: Phaser.Scene): void {
  const W = 16, H = 24;
  const dirs: Array<'down' | 'up' | 'side'> = ['down', 'up', 'side'];
  dirs.forEach(dir => {
    const suffix = dir === 'down' ? '_down' : dir === 'up' ? '_up' : '_side';
    const g = makeGraphics(scene);
    drawAstronautBody(g, 0, COLORS.SKIN_A, COLORS.PLAYER_SUIT, COLORS.PLAYER_VISOR, dir);
    gen(scene, g, `player${suffix}`, W, H);
  });
}

export function createEmployeeTexture(scene: Phaser.Scene): void {
  const W = 16, H = 24;
  const g = makeGraphics(scene);
  drawAstronautBody(g, 0, COLORS.SKIN_A, COLORS.EMPLOYEE_SUIT, COLORS.EMPLOYEE_VISOR, 'down');
  gen(scene, g, 'player_employee', W, H);
}

export function createCustomerTextures(scene: Phaser.Scene): void {
  const W = 16, H = 24;

  // Astronaut customer
  {
    const g = makeGraphics(scene);
    drawAstronautBody(g, 0, COLORS.SKIN_A, COLORS.ASTRONAUT_SUIT, COLORS.ASTRONAUT_VISOR, 'down');
    gen(scene, g, 'customer_astronaut', W, H);
  }

  // Scientist
  {
    const g = makeGraphics(scene);
    px(g, COLORS.SKIN_B, 5, 1, 6, 6);
    px(g, COLORS.SCIENTIST_HAT, 4, 0, 8, 3);
    px(g, COLORS.SCIENTIST_COAT, 3, 7, 10, 11);
    px(g, 0xDDDDDD, 6, 7, 4, 2);
    px(g, COLORS.SCIENTIST_COAT, 1, 8, 2, 8);
    px(g, COLORS.SCIENTIST_COAT, 13, 8, 2, 8);
    px(g, COLORS.SKIN_B, 1, 15, 2, 2);
    px(g, COLORS.SKIN_B, 13, 15, 2, 2);
    px(g, 0x334466, 4, 18, 4, 5);
    px(g, 0x334466, 8, 18, 4, 5);
    px(g, 0x222233, 3, 22, 5, 2);
    px(g, 0x222233, 8, 22, 5, 2);
    gen(scene, g, 'customer_scientist', W, H);
  }

  // Tourist
  {
    const g = makeGraphics(scene);
    px(g, COLORS.SKIN_A, 5, 1, 6, 6);
    px(g, 0xFFAA00, 4, 0, 8, 2);
    px(g, COLORS.TOURIST_SHIRT, 3, 7, 10, 10);
    px(g, 0xFF8888, 5, 8, 6, 2);
    px(g, COLORS.TOURIST_SHIRT, 1, 8, 2, 7);
    px(g, COLORS.TOURIST_SHIRT, 13, 8, 2, 7);
    px(g, COLORS.SKIN_A, 1, 14, 2, 2);
    px(g, COLORS.SKIN_A, 13, 14, 2, 2);
    px(g, 0x4488AA, 4, 17, 8, 6);
    px(g, 0x224466, 3, 22, 5, 2);
    px(g, 0x224466, 8, 22, 5, 2);
    gen(scene, g, 'customer_tourist', W, H);
  }

  // Lunar Worker
  {
    const g = makeGraphics(scene);
    px(g, COLORS.SKIN_B, 5, 1, 6, 6);
    px(g, 0x885533, 4, 0, 8, 2);
    px(g, COLORS.WORKER_SUIT, 3, 7, 10, 11);
    px(g, 0xCC7722, 5, 9, 6, 2);
    px(g, 0xFFDD00, 6, 10, 4, 1);
    px(g, COLORS.WORKER_SUIT, 1, 8, 2, 8);
    px(g, COLORS.WORKER_SUIT, 13, 8, 2, 8);
    px(g, COLORS.SKIN_B, 1, 15, 2, 2);
    px(g, COLORS.SKIN_B, 13, 15, 2, 2);
    px(g, 0x444433, 4, 18, 8, 5);
    px(g, 0x333322, 3, 22, 5, 2);
    px(g, 0x333322, 8, 22, 5, 2);
    gen(scene, g, 'customer_worker', W, H);
  }
}

// ─────────────────────────────────────────────
// CAT TEXTURES
// ─────────────────────────────────────────────

function createCatVariant(scene: Phaser.Scene, key: string, bodyColor: number, darkColor: number, markings?: number[][]): void {
  const W = 20, H = 16;
  const g = makeGraphics(scene);
  px(g, bodyColor, 1, 10, 3, 2);
  px(g, bodyColor, 0, 8, 2, 2);
  px(g, bodyColor, 0, 6, 2, 2);
  px(g, bodyColor, 4, 4, 12, 9);
  px(g, bodyColor, 3, 5, 14, 7);
  px(g, bodyColor, 5, 1, 3, 3);
  px(g, bodyColor, 6, 0, 2, 2);
  px(g, bodyColor, 13, 1, 3, 3);
  px(g, bodyColor, 13, 0, 2, 2);
  px(g, COLORS.CAT_NOSE, 6, 1, 2, 2);
  px(g, COLORS.CAT_NOSE, 13, 1, 2, 2);
  px(g, bodyColor, 5, 2, 10, 5);
  px(g, COLORS.CAT_EYE, 7, 4, 2, 2);
  px(g, COLORS.CAT_EYE, 12, 4, 2, 2);
  px(g, 0x000000, 8, 4, 1, 2);
  px(g, 0x000000, 13, 4, 1, 2);
  px(g, COLORS.CAT_NOSE, 10, 6, 2, 1);
  px(g, darkColor, 4, 6, 3, 1);
  px(g, darkColor, 14, 6, 3, 1);
  if (markings) markings.forEach(([x,y,w,h]) => px(g, darkColor, x, y, w, h));
  px(g, bodyColor, 5, 13, 3, 2);
  px(g, bodyColor, 12, 13, 3, 2);
  gen(scene, g, key, W, H);
}

function createCatSleeping(scene: Phaser.Scene, key: string, bodyColor: number, darkColor: number): void {
  const W = 22, H = 12;
  const g = makeGraphics(scene);
  px(g, bodyColor, 3, 2, 16, 8);
  px(g, bodyColor, 1, 4, 20, 6);
  px(g, bodyColor, 4, 1, 8, 5);
  px(g, darkColor, 6, 3, 3, 1);
  px(g, bodyColor, 14, 4, 4, 3);
  px(g, bodyColor, 17, 2, 2, 3);
  px(g, bodyColor, 5, 0, 2, 2);
  px(g, COLORS.CAT_NOSE, 5, 0, 1, 1);
  gen(scene, g, key, W, H);
}

export function createCatTextures(scene: Phaser.Scene): void {
  createCatVariant(scene, 'cat_orange', COLORS.CAT_ORANGE, COLORS.CAT_ORANGE_D,
    [[8,3,1,3],[11,3,1,4],[14,3,1,3]]
  );
  createCatSleeping(scene, 'cat_orange_sleep', COLORS.CAT_ORANGE, COLORS.CAT_ORANGE_D);
  createCatVariant(scene, 'cat_gray', COLORS.CAT_GRAY, COLORS.CAT_GRAY_D);
  createCatSleeping(scene, 'cat_gray_sleep', COLORS.CAT_GRAY, COLORS.CAT_GRAY_D);
  createCatVariant(scene, 'cat_black', COLORS.CAT_BLACK, COLORS.CAT_BLACK_D, [[9,7,4,2]]);
  createCatSleeping(scene, 'cat_black_sleep', COLORS.CAT_BLACK, COLORS.CAT_BLACK_D);
  createCatVariant(scene, 'cat_cream', COLORS.CAT_CREAM, COLORS.CAT_CREAM_D);
  createCatSleeping(scene, 'cat_cream_sleep', COLORS.CAT_CREAM, COLORS.CAT_CREAM_D);
}

// ─────────────────────────────────────────────
// UI TEXTURES
// ─────────────────────────────────────────────

export function createUITextures(scene: Phaser.Scene): void {
  // Order bubble
  {
    const g = makeGraphics(scene);
    const W = 40, H = 34;
    g.fillStyle(0xFFFFFF, 1); g.fillRoundedRect(0, 0, W, H-8, 6);
    g.fillStyle(0xCCCCCC, 1); g.fillRect(0, 0, W, 2); g.fillRect(0, 0, 2, H-8);
    g.fillStyle(0xFFFFFF, 1); g.fillTriangle(8, H-8, 16, H-8, 10, H);
    gen(scene, g, 'ui_order_bubble', W, H);
  }
  // Coin — gold dinar with inner detail
  {
    const g = makeGraphics(scene);
    g.fillStyle(COLORS.UI_GOLD, 1); g.fillCircle(8, 8, 7);
    g.fillStyle(0xCC9900, 1); g.fillCircle(8, 8, 5);
    g.fillStyle(COLORS.UI_GOLD, 1); g.fillRect(6, 5, 4, 6);
    g.fillStyle(0xFFEE44, 1); g.fillRect(7, 6, 2, 4);
    gen(scene, g, 'ui_coin', 16, 16);
  }
  // Star icon
  {
    const g = makeGraphics(scene);
    g.fillStyle(COLORS.UI_STAR, 1);
    const cx = 8, cy = 8, or = 7, ir = 3;
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? or : ir;
      const a = (i * 36 - 90) * Math.PI / 180;
      pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    g.fillPoints(pts.map((v, i) => ({ x: pts[i*2] ?? 0, y: pts[i*2+1] ?? 0 })).filter((_, i) => i < 10), true);
    gen(scene, g, 'ui_star', 16, 16);
  }
  // Heart icon
  {
    const g = makeGraphics(scene);
    g.fillStyle(COLORS.UI_HEART, 1);
    g.fillCircle(5, 5, 4); g.fillCircle(11, 5, 4);
    g.fillTriangle(1, 7, 15, 7, 8, 15);
    gen(scene, g, 'ui_heart', 16, 16);
  }
  // Progress bar background — deep indigo
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x0E0820, 1); g.fillRect(0, 0, 48, 8);
    g.fillStyle(0x080410, 1); g.fillRect(1, 1, 46, 6);
    gen(scene, g, 'ui_progress_bg', 48, 8);
  }
  // E-key prompt — gold on deep indigo
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xFFD700, 1); g.fillRoundedRect(0, 0, 18, 18, 3);
    g.fillStyle(0x0E0820, 1); g.fillRoundedRect(1, 1, 16, 16, 2);
    g.fillStyle(0xFFD700, 1);
    g.fillRect(5, 4, 8, 2);
    g.fillRect(5, 8, 7, 2);
    g.fillRect(5, 12, 8, 2);
    g.fillRect(5, 4, 2, 10);
    gen(scene, g, 'ui_e_prompt', 18, 18);
  }
  // Patience bar fill
  {
    const g = makeGraphics(scene);
    g.fillStyle(COLORS.UI_PATIENCE_OK, 1); g.fillRect(0, 0, 46, 6);
    gen(scene, g, 'ui_patience_fill', 46, 6);
  }
}

// ─────────────────────────────────────────────
// PARTICLE TEXTURES
// ─────────────────────────────────────────────

export function createParticleTextures(scene: Phaser.Scene): void {
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xCCDDDD, 0.8); g.fillCircle(4, 4, 4);
    gen(scene, g, 'particle_steam', 8, 8);
  }
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xFFEE88, 1); g.fillRect(3, 0, 2, 8); g.fillRect(0, 3, 8, 2);
    gen(scene, g, 'particle_star', 8, 8);
  }
  {
    const g = makeGraphics(scene);
    g.fillStyle(COLORS.UI_GOLD, 1); g.fillCircle(4, 4, 4);
    gen(scene, g, 'particle_coin', 8, 8);
  }
  {
    const g = makeGraphics(scene);
    g.fillStyle(COLORS.UI_HEART, 1);
    g.fillCircle(2, 3, 2); g.fillCircle(6, 3, 2);
    g.fillTriangle(0, 4, 8, 4, 4, 8);
    gen(scene, g, 'particle_heart', 8, 8);
  }
}

// ─────────────────────────────────────────────
// MASTER FACTORY
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// DECORATION TEXTURES
// ─────────────────────────────────────────────

export function createDecorationTextures(scene: Phaser.Scene): void {
  const S = 28; // sprite canvas size

  // Velvet Chair — plush purple seat with gold legs
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x2A0A3A, 1); g.fillRoundedRect(4, 10, S-8, S-14, 3);
    g.fillStyle(0x6A1A8A, 1); g.fillRoundedRect(5, 8, S-10, 10, 4);
    g.fillStyle(0x9A3ABA, 0.8); g.fillEllipse(S/2, 11, S-14, 5);
    g.fillStyle(0xC8920A, 1); g.fillRect(5, S-5, 3, 5); g.fillRect(S-8, S-5, 3, 5);
    g.fillStyle(0xFFD700, 0.5); g.fillRect(5, S-6, 3, 1); g.fillRect(S-8, S-6, 3, 1);
    gen(scene, g, 'deco_velvet_chair', S, S);
  }
  // Round Table — circular mahogany top with brass pedestal
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x4A2408, 1); g.fillEllipse(S/2, S/2-2, S-4, S-8);
    g.fillStyle(0x6B3A10, 0.8); g.fillEllipse(S/2-2, S/2-4, 10, 5);
    g.fillStyle(0xC8920A, 1); g.fillRect(S/2-2, S/2+2, 4, 6); g.fillEllipse(S/2, S-4, 10, 4);
    gen(scene, g, 'deco_round_table', S, S);
  }
  // Booth Seat — wide padded bench, dark teal leather with gold trim
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x0A2A2A, 1); g.fillRoundedRect(2, 8, S-4, S-12, 3);
    g.fillStyle(0x1A4A4A, 1); g.fillRoundedRect(3, 7, S-6, 10, 3);
    g.fillStyle(0x2A6A6A, 0.7); g.fillRect(4, 8, S-8, 4);
    g.fillStyle(0xC8920A, 1); g.fillRect(2, 7, S-4, 1); g.fillRect(2, S-5, S-4, 1);
    gen(scene, g, 'deco_booth_seat', S, S);
  }

  // Fairy Lights — small glowing dots on a line
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x333322, 1); g.fillRect(2, S/2-1, S-4, 2);
    const cols = [0xFFDD44, 0xFF6688, 0x44DDFF, 0xAAFF44, 0xFFAA22];
    for (let i = 0; i < 5; i++) {
      g.fillStyle(cols[i], 1); g.fillCircle(4 + i*5, S/2, 3);
      g.fillStyle(cols[i], 0.4); g.fillCircle(4 + i*5, S/2, 5);
    }
    gen(scene, g, 'deco_fairy_lights', S, S);
  }
  // Neon Sign — glowing "OPEN" rectangle with pink/purple neon
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x0A0415, 1); g.fillRoundedRect(1, 6, S-2, S-12, 3);
    g.lineStyle(2, 0xFF44CC, 1); g.strokeRoundedRect(2, 7, S-4, S-14, 2);
    g.fillStyle(0xFF44CC, 0.3); g.fillRoundedRect(2, 7, S-4, S-14, 2);
    // Letters O-P-E-N as glowing dots
    [[4,2],[8,2],[12,2],[16,2]].forEach(([x, _]) => {
      g.fillStyle(0xFF88EE, 0.9); g.fillRect(x+2, 10, 2, 6);
    });
    g.fillStyle(0xFF44CC, 0.6); g.fillEllipse(S/2, S/2, S-6, S-14);
    gen(scene, g, 'deco_neon_sign', S, S);
  }
  // Crystal Lamp — hanging chandelier with prisms
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xC8920A, 1); g.fillRect(S/2-1, 0, 2, 5);
    g.fillStyle(0xFFD700, 1); g.fillEllipse(S/2, 8, 12, 6);
    g.fillStyle(0xAADDFF, 0.9); g.fillEllipse(S/2, 8, 8, 4);
    // Hanging crystals
    [[S/2-6,10],[S/2,10],[S/2+6,10]].forEach(([cx,cy]) => {
      g.fillStyle(0xCCEEFF, 0.9); g.fillRect(cx-1, cy, 2, 8);
      g.fillStyle(0x88CCFF, 0.7); g.fillTriangle(cx-2, cy+8, cx+2, cy+8, cx, cy+12);
    });
    g.fillStyle(0xFFFFCC, 0.5); g.fillCircle(S/2, 8, 10);
    gen(scene, g, 'deco_crystal_lamp', S, S);
  }

  // Luna Fern — glowing blue-green fern
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x334422, 1); g.fillEllipse(S/2, S-4, 10, 5);
    g.fillStyle(0x0A4433, 1); g.fillRect(S/2-1, 6, 2, S-12);
    g.fillStyle(0x00AA88, 0.9);
    g.fillEllipse(S/2-7, 14, 12, 6); g.fillEllipse(S/2+7, 12, 12, 6);
    g.fillEllipse(S/2-5, 8, 10, 5); g.fillEllipse(S/2+5, 6, 10, 5);
    g.fillStyle(0x44FFCC, 0.4);
    g.fillEllipse(S/2-8, 13, 6, 3); g.fillEllipse(S/2+8, 11, 6, 3);
    gen(scene, g, 'deco_luna_fern', S, S);
  }
  // Space Cactus — spiky purple-green cactus with glow
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x334422, 1); g.fillEllipse(S/2, S-4, 10, 5);
    g.fillStyle(0x2A5A2A, 1); g.fillRect(S/2-3, 6, 6, S-12);
    g.fillStyle(0x3A7A3A, 1); g.fillRect(S/2-4, 8, 8, S-14);
    g.fillStyle(0x4A4A2A, 1);
    g.fillRect(S/2-8, 12, 5, 3); g.fillRect(S/2+3, 10, 5, 3);
    g.fillStyle(0xBB44FF, 0.7); g.fillCircle(S/2, 6, 3);
    g.fillStyle(0xDD88FF, 0.5); g.fillCircle(S/2, 6, 5);
    gen(scene, g, 'deco_space_cactus', S, S);
  }
  // Moon Bloom — flower with silver-white petals and gold center
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x334422, 1); g.fillEllipse(S/2, S-4, 10, 5);
    g.fillStyle(0x2A4A2A, 1); g.fillRect(S/2-1, 12, 2, S-14);
    g.fillStyle(0xCCDDEE, 0.9);
    for (let a = 0; a < 6; a++) {
      const ax = S/2 + Math.cos(a * Math.PI/3) * 7;
      const ay = 10 + Math.sin(a * Math.PI/3) * 7;
      g.fillEllipse(ax, ay, 6, 8);
    }
    g.fillStyle(0xFFD700, 1); g.fillCircle(S/2, 10, 4);
    g.fillStyle(0xFFFF88, 0.8); g.fillCircle(S/2-1, 9, 2);
    gen(scene, g, 'deco_moon_bloom', S, S);
  }

  // Star Map — framed chart with constellation dots
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x2A1A40, 1); g.fillRoundedRect(2, 3, S-4, S-6, 2);
    g.fillStyle(0xC8920A, 1); g.lineStyle(1, 0xC8920A, 1); g.strokeRoundedRect(2, 3, S-4, S-6, 2);
    g.fillStyle(0x06041C, 1); g.fillRect(4, 5, S-8, S-10);
    // Stars and constellation lines
    const stars = [[6,8],[14,7],[20,10],[10,14],[18,18],[8,20],[22,16]];
    g.fillStyle(0xFFFFCC, 1);
    stars.forEach(([sx,sy]) => g.fillCircle(sx, sy, 1));
    g.lineStyle(1, 0x445566, 0.6);
    g.beginPath(); g.moveTo(6,8); g.lineTo(14,7); g.lineTo(20,10); g.lineTo(18,18); g.strokePath();
    gen(scene, g, 'deco_star_map', S, S);
  }
  // Moon Portrait — framed painting of the Moon surface
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x3A1A08, 1); g.fillRoundedRect(1, 2, S-2, S-4, 2);
    g.fillStyle(0xC8920A, 1); g.lineStyle(2, 0xC8920A, 1); g.strokeRoundedRect(1, 2, S-2, S-4, 2);
    g.fillStyle(0x060414, 1); g.fillRect(3, 4, S-6, S-8);
    g.fillStyle(0xB0B0C0, 1); g.fillCircle(S/2, S/2-1, 9);
    g.fillStyle(0x6A6A7A, 0.8); g.fillCircle(S/2-3, S/2-3, 4);
    g.fillStyle(0x8A8A9A, 0.8); g.fillCircle(S/2+4, S/2+2, 3);
    g.fillStyle(0xFFFFCC, 0.4); g.fillCircle(S/2-1, S/2-5, 6);
    gen(scene, g, 'deco_moon_portrait', S, S);
  }

  // Telescope — brass body on tripod
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xC8920A, 1); g.fillRect(S/2-6, 8, 12, 5);
    g.fillStyle(0xFFD700, 0.7); g.fillRect(S/2-5, 9, 10, 2);
    g.fillStyle(0xC8920A, 1); g.fillRect(S/2-4, 12, 8, 4);
    g.fillStyle(0x886600, 1); g.fillRect(S/2-2, 16, 4, 4);
    g.fillStyle(0xC8920A, 1);
    g.fillRect(S/2-8, 20, 4, 2); g.fillRect(S/2, 19, 4, 2); g.fillRect(S/2-4, 19, 3, 6);
    g.fillStyle(0x334466, 1); g.fillRect(S/2-8, 7, 3, 6);
    g.fillStyle(0x88AAFF, 0.8); g.fillRect(S/2-7, 8, 2, 4);
    gen(scene, g, 'deco_telescope', S, S);
  }
  // Rover Display — mini moon rover model on a plinth
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x4A4A5A, 1); g.fillRect(4, S-6, S-8, 4);
    g.fillStyle(0xC8920A, 1); g.fillRect(3, S-7, S-6, 1);
    g.fillStyle(0x888899, 1); g.fillRect(6, 12, S-12, 8);
    g.fillStyle(0x5566AA, 0.9); g.fillRect(8, 10, 7, 5);
    g.fillStyle(0x88AACC, 0.8); g.fillRect(9, 11, 5, 3);
    g.fillStyle(0x666677, 1);
    g.fillCircle(7, S-8, 3); g.fillCircle(S-7, S-8, 3);
    g.fillStyle(0xAAAAAA, 0.7); g.fillCircle(7, S-8, 1); g.fillCircle(S-7, S-8, 1);
    g.fillStyle(0xC8920A, 1); g.fillRect(S-8, 8, 2, 6);
    gen(scene, g, 'deco_rover_display', S, S);
  }
  // Cat Statue — carved cat silhouette on pedestal
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x4A4A3A, 1); g.fillRect(6, S-6, S-12, 4);
    g.fillStyle(0xC8920A, 1); g.fillRect(5, S-7, S-10, 1);
    g.fillStyle(0xD4C090, 1);
    g.fillEllipse(S/2, 14, 10, 12);
    g.fillTriangle(S/2-4, 8, S/2-1, 2, S/2-1, 8);
    g.fillTriangle(S/2+4, 8, S/2+1, 2, S/2+1, 8);
    g.fillStyle(0xBBAA80, 1); g.fillEllipse(S/2, 15, 7, 8);
    g.fillStyle(0xFFD700, 0.9); g.fillCircle(S/2-2, 13, 1); g.fillCircle(S/2+2, 13, 1);
    g.fillStyle(0xC8920A, 1); g.fillRect(S/2-1, S-6, 2, 4);
    gen(scene, g, 'deco_cat_statue', S, S);
  }
}

export function createAllTextures(scene: Phaser.Scene): void {
  createFloorTile(scene);
  createFloorDarkTile(scene);
  createKitchenFloorTile(scene);
  createWallTile(scene);
  createWindowTile(scene);
  createCounterTile(scene);
  createSpaceTile(scene);
  createMoonTile(scene);
  createDomeTile(scene);

  createTableTexture(scene);
  createGroupTableTexture(scene);
  createChairTexture(scene);
  createCoffeeMachineTexture(scene);
  createStoveTexture(scene);
  createPrepCounterTexture(scene);
  createCatBedTexture(scene);
  createPlantTexture(scene);
  createFoodBowlTexture(scene);
  createTrashCanTexture(scene);
  createCatToyTexture(scene);
  createCatTreeTexture(scene);
  createMoonRockTexture(scene);
  createMoonFlagTexture(scene);
  createLunarRoverTexture(scene);

  createFoodTextures(scene);
  createPlayerTextures(scene);
  createEmployeeTexture(scene);
  createCustomerTextures(scene);
  createCatTextures(scene);
  createUITextures(scene);
  createParticleTextures(scene);
  createDecorationTextures(scene);
}
