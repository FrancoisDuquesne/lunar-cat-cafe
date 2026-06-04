import Phaser from 'phaser';
import { COLORS, TILE } from '../constants';

const OUT = 0x1A1428;

function makeGraphics(scene: Phaser.Scene): Phaser.GameObjects.Graphics {
  return scene.add.graphics();
}

function gen(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics, key: string, w: number, h: number): void {
  g.generateTexture(key, w, h);
  g.destroy();
}

function ol(g: Phaser.GameObjects.Graphics, lw = 2): void {
  g.lineStyle(lw, OUT, 1);
}

// ─────────────────────────────────────────────
// TILE TEXTURES
// ─────────────────────────────────────────────

export function createFloorTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Warm honey oak planks
  g.fillStyle(0xC87828, 1); g.fillRect(0, 0, TILE, TILE);
  // Plank seams
  g.fillStyle(0x7A4210, 1);
  g.fillRect(0, 10, TILE, 2);
  g.fillRect(0, 22, TILE, 2);
  // Plank top highlights
  g.fillStyle(0xE09438, 1);
  g.fillRect(0, 0, TILE, 3);
  g.fillRect(0, 12, TILE, 3);
  g.fillRect(0, 24, TILE, 3);
  gen(scene, g, 'tile_floor', TILE, TILE);
}

export function createFloorDarkTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(0xA86020, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0x6A3408, 1);
  g.fillRect(0, 10, TILE, 2);
  g.fillRect(0, 22, TILE, 2);
  g.fillStyle(0xC07830, 1);
  g.fillRect(0, 0, TILE, 3);
  g.fillRect(0, 12, TILE, 3);
  g.fillRect(0, 24, TILE, 3);
  gen(scene, g, 'tile_floor_dark', TILE, TILE);
}

export function createKitchenFloorTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Cream and warm-tan checkerboard
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      g.fillStyle((r + c) % 2 === 0 ? 0xF0E8D0 : 0xD4C494, 1);
      g.fillRect(c * 16, r * 16, 16, 16);
    }
  }
  // Bold grout lines
  g.fillStyle(0xA08858, 1);
  g.fillRect(0, 15, TILE, 2);
  g.fillRect(15, 0, 2, TILE);
  gen(scene, g, 'tile_kitchen', TILE, TILE);
}

export function createWallTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Warm cream/parchment wall
  g.fillStyle(0xE8D8A8, 1); g.fillRect(0, 0, TILE, TILE);
  // Teal accent stripe at top
  g.fillStyle(0x3A8A90, 1); g.fillRect(0, 0, TILE, 5);
  // Bottom shadow strip
  g.fillStyle(0xA89868, 1); g.fillRect(0, TILE - 4, TILE, 4);
  // Simple wainscot panel lines
  g.fillStyle(0xD4C090, 1);
  g.fillRect(4, 8, TILE - 8, 1);
  g.fillRect(4, TILE - 10, TILE - 8, 1);
  gen(scene, g, 'tile_wall', TILE, TILE);
}

export function createWindowTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Deep teal-navy space
  g.fillStyle(0x0B1A40, 1); g.fillRect(0, 0, TILE, TILE);
  // Stars
  g.fillStyle(0xFFFFFF, 1);
  [[4,5],[10,3],[18,8],[26,4],[7,14],[21,18],[29,11],[3,24]].forEach(([x,y]) => g.fillRect(x,y,2,2));
  [[14,10],[22,6],[9,20],[28,22]].forEach(([x,y]) => g.fillRect(x,y,1,1));
  // Bright star with glow
  g.fillStyle(0xFFEECC, 1); g.fillRect(16, 20, 3, 3);
  g.fillStyle(0xFFFFFF, 0.3); g.fillRect(14, 18, 7, 7);
  // Gold frame — thick
  g.fillStyle(0xF0C018, 1);
  g.fillRect(0, 0, TILE, 4);
  g.fillRect(0, TILE - 4, TILE, 4);
  g.fillRect(0, 0, 4, TILE);
  g.fillRect(TILE - 4, 0, 4, TILE);
  // Frame inner shadow
  g.fillStyle(0xAA8808, 1);
  g.fillRect(4, 4, TILE - 8, 2);
  g.fillRect(4, 4, 2, TILE - 8);
  gen(scene, g, 'tile_window', TILE, TILE);
}

export function createCounterTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Rich mahogany
  g.fillStyle(0x7C4A18, 1); g.fillRect(0, 0, TILE, TILE);
  // Gold top edge
  g.fillStyle(0xF0C018, 1); g.fillRect(0, 0, TILE, 3);
  // Highlight strip
  g.fillStyle(0xAA6A28, 1); g.fillRect(0, 3, TILE, 6);
  // Side shadow
  g.fillStyle(0x3C1C06, 1);
  g.fillRect(0, TILE - 6, TILE, 6);
  g.fillRect(0, 0, 2, TILE);
  gen(scene, g, 'tile_counter', TILE, TILE);
}

export function createSpaceTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(0x0B1A40, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0xFFFFFF, 1);
  [[5,5],[12,20],[22,8],[28,25],[3,28],[18,14],[9,3],[25,18]].forEach(([x,y]) => g.fillRect(x,y,1,1));
  g.fillStyle(0xFFEECC, 0.9); [[7,12],[22,6]].forEach(([x,y]) => g.fillRect(x,y,2,2));
  gen(scene, g, 'tile_space', TILE, TILE);
}

export function createMoonTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Warm silver-gray moon surface
  g.fillStyle(0xC8C4B0, 1); g.fillRect(0, 0, TILE, TILE);
  // Craters with clear dark + highlight
  [[8,8,5],[22,18,4],[4,22,3]].forEach(([x,y,r]) => {
    g.fillStyle(0x9A9480, 1); g.fillCircle(x, y, r);
    g.fillStyle(0xE0DDD0, 1); g.fillCircle(x-1, y-1, r > 3 ? 2 : 1);
  });
  gen(scene, g, 'tile_moon', TILE, TILE);
}

export function createDomeTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(0x0B1A40, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0x88BBCC, 0.35); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0x88BBCC, 0.7);
  g.fillRect(0, 0, 4, TILE);
  g.fillRect(TILE - 4, 0, 4, TILE);
  gen(scene, g, 'tile_dome', TILE, TILE);
}

// ─────────────────────────────────────────────
// FURNITURE / OBJECT TEXTURES
// ─────────────────────────────────────────────

export function createTableTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 52, H = 44;
  // Table top — warm mahogany
  g.fillStyle(0x6A3810, 1); g.fillRoundedRect(2, 2, W-4, H-14, 6);
  // Top highlight (cel-shade)
  g.fillStyle(0xAA6030, 1); g.fillRoundedRect(4, 4, W-8, 10, 4);
  // Wood grain lines
  g.fillStyle(0x4A2408, 1);
  [14, 26, 38].forEach(x => g.fillRect(x, 5, 2, H-20));
  // Gold trim edge
  g.fillStyle(0xF0C018, 1); g.fillRect(2, 2, W-4, 3);
  // Legs — gold
  g.fillStyle(0xD4A820, 1); g.fillRect(2, H-12, W-4, 5);
  [[6, H-7], [W-10, H-7]].forEach(([x, y]) => {
    g.fillStyle(0xD4A820, 1); g.fillRect(x, y, 6, 7);
  });
  // Outline
  ol(g, 2);
  g.strokeRoundedRect(2, 2, W-4, H-14, 6);
  g.lineStyle(2, OUT, 1); g.strokeRect(2, H-12, W-4, 5);
  gen(scene, g, 'obj_table', W, H);
}

export function createGroupTableTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 76, H = 44;
  g.fillStyle(0x6A3810, 1); g.fillRoundedRect(2, 2, W-4, H-14, 6);
  g.fillStyle(0xAA6030, 1); g.fillRoundedRect(4, 4, W-8, 10, 4);
  g.fillStyle(0x4A2408, 1);
  [18, 34, 50].forEach(x => g.fillRect(x, 5, 2, H-20));
  g.fillStyle(0xF0C018, 1); g.fillRect(2, 2, W-4, 3);
  g.fillStyle(0xD4A820, 1); g.fillRect(2, H-12, W-4, 5);
  [[6, H-7], [W-10, H-7]].forEach(([x, y]) => {
    g.fillStyle(0xD4A820, 1); g.fillRect(x, y, 6, 7);
  });
  ol(g, 2); g.strokeRoundedRect(2, 2, W-4, H-14, 6);
  gen(scene, g, 'obj_table_group', W, H);
}

export function createChairTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 22, H = 22;
  // Red cushion seat
  g.fillStyle(0xD84040, 1); g.fillRoundedRect(2, 4, W-4, H-10, 4);
  // Highlight
  g.fillStyle(0xF06060, 1); g.fillRoundedRect(4, 5, W-8, 6, 3);
  // Tufted center
  g.fillStyle(0xA82020, 1); g.fillCircle(W/2, 9, 3);
  g.fillStyle(0xF08080, 0.6); g.fillCircle(W/2-1, 8, 1);
  // Gold legs
  g.fillStyle(0xD4A820, 1);
  [[2, H-6],[W-6, H-6]].forEach(([x,y]) => g.fillRect(x, y, 4, 6));
  // Outline
  ol(g, 2); g.strokeRoundedRect(2, 4, W-4, H-10, 4);
  gen(scene, g, 'obj_chair', W, H);
}

export function createCoffeeMachineTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  // Dark body
  g.fillStyle(0x1A1A2A, 1); g.fillRoundedRect(2, 4, W-4, H-8, 4);
  // Highlight on body
  g.fillStyle(0x2A2A3A, 1); g.fillRect(4, 6, 8, H-14);
  // Screen
  g.fillStyle(0x00AADD, 1); g.fillRoundedRect(6, 8, W-12, 7, 2);
  g.fillStyle(0x88DDFF, 0.5); g.fillRect(7, 9, W-14, 2);
  // Status dot
  g.fillStyle(0x44FF88, 1); g.fillCircle(W-7, 8, 3);
  g.fillStyle(0xAAFFCC, 0.7); g.fillCircle(W-8, 7, 1);
  // Gold spout
  g.fillStyle(0xD4A820, 1); g.fillRoundedRect(W/2-3, H-8, 6, 5, 2);
  g.fillStyle(0xFFD840, 0.8); g.fillRect(W/2-2, H-7, 4, 2);
  // Gold trim
  g.fillStyle(0xD4A820, 1);
  g.fillRect(2, 4, W-4, 2);
  g.fillRect(2, H-6, W-4, 2);
  // Outline
  ol(g, 2); g.strokeRoundedRect(2, 4, W-4, H-8, 4);
  gen(scene, g, 'obj_coffee_machine', W, H);
}

export function createStoveTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  g.fillStyle(0x1A1C28, 1); g.fillRoundedRect(2, 2, W-4, H-4, 4);
  g.fillStyle(0x2A2C3A, 1); g.fillRect(4, 4, 8, H-10);
  [[10,10],[20,10],[10,20],[20,20]].forEach(([cx,cy]) => {
    g.fillStyle(0xFF5500, 0.9); g.fillCircle(cx, cy, 5);
    g.fillStyle(0xFF8800, 1); g.fillCircle(cx, cy, 3);
    g.fillStyle(0xFFCC00, 1); g.fillCircle(cx, cy, 1);
    ol(g, 1); g.strokeCircle(cx, cy, 5);
  });
  g.fillStyle(0xD4A820, 1); g.fillRect(2, 2, W-4, 2);
  ol(g, 2); g.strokeRoundedRect(2, 2, W-4, H-4, 4);
  gen(scene, g, 'obj_stove', W, H);
}

export function createPrepCounterTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  // Cream/ivory top
  g.fillStyle(0xF0EAD8, 1); g.fillRoundedRect(2, 2, W-4, H-4, 3);
  // Highlight
  g.fillStyle(0xFFFFEE, 1); g.fillRect(4, 4, W-8, 5);
  // Grid lines
  g.fillStyle(0xC8C0A0, 1);
  [10, 16, 22].forEach(x => g.fillRect(x, 4, 1, H-8));
  [10, 16, 22].forEach(y => g.fillRect(4, y, W-8, 1));
  // Gold edge
  g.fillStyle(0xD4A820, 1); g.fillRect(2, 2, W-4, 2); g.fillRect(2, H-4, W-4, 2);
  ol(g, 2); g.strokeRoundedRect(2, 2, W-4, H-4, 3);
  gen(scene, g, 'obj_prep_counter', W, H);
}

export function createTrashCanTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 26;
  // Body — dark teal-green
  g.fillStyle(0x1A3A28, 1); g.fillRoundedRect(3, 6, W-6, H-8, 3);
  g.fillStyle(0x2A5A40, 1); g.fillRect(5, 8, 6, H-14);
  // Lid
  g.fillStyle(0x254A34, 1); g.fillRoundedRect(2, 1, W-4, 6, 2);
  // Handle
  g.fillStyle(0xD4A820, 1); g.fillRoundedRect(W/2-2, 1, 4, 3, 1);
  // Stripes
  g.fillStyle(0x2A5A40, 1);
  [11, 16, 21].forEach(y => g.fillRect(3, y, W-6, 2));
  // Recycle icon hint
  g.fillStyle(0x3A8A60, 1); g.fillRect(7, 9, 5, 8); g.fillRect(5, 10, 9, 2);
  ol(g, 2); g.strokeRoundedRect(3, 6, W-6, H-8, 3);
  g.strokeRoundedRect(2, 1, W-4, 6, 2);
  gen(scene, g, 'obj_trash_can', W, H);
}

export function createCatToyTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 18, H = 20;
  // String
  g.fillStyle(0xCCCCCC, 1); g.fillRect(W/2-1, 0, 2, 8);
  // Ball
  g.fillStyle(0xFF4466, 1); g.fillCircle(W/2, 14, 6);
  g.fillStyle(0xFF7799, 1); g.fillCircle(W/2-2, 12, 3);
  g.fillStyle(0xFF88AA, 0.7); g.fillCircle(W/2-3, 11, 1);
  g.fillStyle(0xFFDD00, 1); g.fillCircle(W/2+1, 15, 2);
  ol(g, 1); g.strokeCircle(W/2, 14, 6);
  gen(scene, g, 'obj_cat_toy', W, H);
}

export function createCatTreeTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 30, H = 44;
  // Base
  g.fillStyle(0xD4A820, 1); g.fillRoundedRect(4, H-8, W-8, 8, 2);
  ol(g, 1); g.strokeRoundedRect(4, H-8, W-8, 8, 2);
  // Trunk
  g.fillStyle(0x5A3010, 1); g.fillRect(W/2-3, 16, 6, H-24);
  g.fillStyle(0x7A4818, 1); g.fillRect(W/2-1, 16, 2, H-24);
  // Lower platform
  g.fillStyle(0x5A3010, 1); g.fillRoundedRect(2, H-20, W-4, 6, 2);
  g.fillStyle(0xD84040, 1); g.fillRect(3, H-19, W-6, 3);
  g.fillStyle(0xF06060, 0.6); g.fillRect(5, H-19, W-10, 2);
  ol(g, 1); g.strokeRoundedRect(2, H-20, W-4, 6, 2);
  // Upper platform
  g.fillStyle(0x5A3010, 1); g.fillRoundedRect(4, H-36, W-8, 6, 2);
  g.fillStyle(0xD84040, 1); g.fillRect(5, H-35, W-10, 3);
  g.fillStyle(0xF06060, 0.6); g.fillRect(7, H-35, W-14, 2);
  ol(g, 1); g.strokeRoundedRect(4, H-36, W-8, 6, 2);
  // Top lounge — purple
  g.fillStyle(0x6A28AA, 1); g.fillEllipse(W/2, 8, W-6, 12);
  g.fillStyle(0x9A50D0, 1); g.fillEllipse(W/2, 7, W-12, 8);
  g.fillStyle(0xCC88FF, 0.5); g.fillEllipse(W/2-2, 5, 8, 4);
  ol(g, 1); g.strokeEllipse(W/2, 8, W-6, 12);
  gen(scene, g, 'obj_cat_tree', W, H);
}

export function createCatBedTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 36, H = 28;
  // Outer ring — purple
  g.fillStyle(0x5A20A0, 1); g.fillEllipse(W/2, H/2, W-4, H-4);
  // Inner cushion — red
  g.fillStyle(0xD84040, 1); g.fillEllipse(W/2, H/2+2, W-8, H-8);
  g.fillStyle(0xF06060, 1); g.fillEllipse(W/2-4, H/2, 10, 7);
  ol(g, 2); g.strokeEllipse(W/2, H/2, W-4, H-4);
  gen(scene, g, 'obj_cat_bed', W, H);
}

export function createPlantTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 28;
  // Gold pot
  g.fillStyle(0xD4A820, 1); g.fillRoundedRect(4, H-10, W-8, 9, 2);
  g.fillStyle(0xF0C840, 1); g.fillRect(5, H-9, W-10, 3);
  g.fillStyle(0xAA8010, 1); g.fillRect(2, H-12, W-4, 3);
  ol(g, 1); g.strokeRoundedRect(4, H-10, W-8, 9, 2);
  // Rich green leaves
  g.fillStyle(0x228830, 1); g.fillEllipse(W/2, 8, 12, 16);
  g.fillStyle(0x228830, 1); g.fillEllipse(W/2-5, 12, 9, 11);
  g.fillStyle(0x228830, 1); g.fillEllipse(W/2+5, 11, 9, 11);
  g.fillStyle(0x44CC55, 1); g.fillEllipse(W/2-1, 6, 6, 8);
  g.fillStyle(0x88FF99, 0.5); g.fillEllipse(W/2-2, 5, 4, 5);
  ol(g, 1); g.strokeEllipse(W/2, 8, 12, 16);
  gen(scene, g, 'obj_plant', W, H);
}

export function createFoodBowlTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 14;
  g.fillStyle(0x8AACCC, 1); g.fillEllipse(W/2, H/2, W, H);
  g.fillStyle(0xBBDDEE, 1); g.fillEllipse(W/2-1, H/2-1, W-4, H-6);
  g.fillStyle(0xFF9944, 1); g.fillEllipse(W/2, H/2-1, W-8, H-8);
  g.fillStyle(0xFFCC88, 0.7); g.fillEllipse(W/2-2, H/2-2, 5, 3);
  ol(g, 1); g.strokeEllipse(W/2, H/2, W, H);
  gen(scene, g, 'obj_food_bowl', W, H);
}

export function createMoonRockTexture(scene: Phaser.Scene): void {
  {
    const g = makeGraphics(scene);
    const W = 24, H = 18;
    g.fillStyle(0xC8C4B0, 1); g.fillEllipse(W/2, H/2+2, W-4, H-4);
    g.fillStyle(0xA8A498, 1); g.fillRect(0, H/2+2, W, H/2);
    g.fillStyle(0x9A9480, 1); g.fillCircle(8, 8, 3); g.fillCircle(16, 12, 2);
    g.fillStyle(0xE0DDD0, 1); g.fillCircle(7, 7, 1); g.fillCircle(15, 11, 1);
    ol(g, 1); g.strokeEllipse(W/2, H/2+2, W-4, H-4);
    gen(scene, g, 'obj_moon_rock_sm', W, H);
  }
  {
    const g = makeGraphics(scene);
    const W = 40, H = 30;
    g.fillStyle(0xC8C4B0, 1); g.fillEllipse(W/2, H/2+3, W-6, H-6);
    g.fillStyle(0xA8A498, 1); g.fillRect(0, H/2+3, W, H/2);
    g.fillStyle(0x9A9480, 1);
    [[10,10,5],[24,18,3],[8,20,4]].forEach(([cx,cy,r]) => g.fillCircle(cx,cy,r));
    g.fillStyle(0xE0DDD0, 1);
    [[9,9,2],[23,17,1],[7,19,2]].forEach(([cx,cy,r]) => g.fillCircle(cx,cy,r));
    ol(g, 1); g.strokeEllipse(W/2, H/2+3, W-6, H-6);
    gen(scene, g, 'obj_moon_rock_lg', W, H);
  }
}

export function createMoonFlagTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 36;
  // Pole
  g.fillStyle(0xD4A820, 1); g.fillRect(8, 2, 3, H-6);
  g.fillStyle(0xFFD840, 0.6); g.fillRect(9, 2, 1, H-6);
  // Flag
  g.fillStyle(0xE83030, 1); g.fillRect(11, 4, W-12, 10);
  g.fillStyle(0xFF6060, 0.7); g.fillRect(11, 4, W-12, 4);
  g.fillStyle(0xFFFFFF, 1);
  g.fillRect(11, 4, W-12, 3);
  g.fillRect(11, 10, W-12, 4);
  // Star
  g.fillStyle(0xFFDD00, 1);
  g.fillRect(13, 6, 4, 2); g.fillRect(14, 5, 2, 4);
  // Base
  g.fillStyle(0xD4A820, 1); g.fillRoundedRect(3, H-5, 14, 5, 2);
  ol(g, 1); g.strokeRect(11, 4, W-12, 10);
  gen(scene, g, 'obj_moon_flag', W, H);
}

export function createLunarRoverTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 50, H = 28;
  // Body
  g.fillStyle(0x8A8898, 1); g.fillRoundedRect(8, 6, W-16, H-14, 4);
  g.fillStyle(0xAAAAAA, 0.5); g.fillRect(10, 8, 10, 4);
  // Dome
  g.fillStyle(0x2A5A7A, 0.9); g.fillRoundedRect(14, 8, 16, 8, 3);
  g.fillStyle(0x5A9ABB, 0.7); g.fillRect(15, 9, 7, 3);
  // Wheels
  [[4,H-8],[W-12,H-8],[4,H-20],[W-12,H-20]].forEach(([wx,wy]) => {
    g.fillStyle(0x333344, 1); g.fillCircle(wx+4, wy+4, 6);
    g.fillStyle(0x555566, 1); g.fillCircle(wx+4, wy+4, 4);
    g.fillStyle(0x8888AA, 1); g.fillCircle(wx+4, wy+4, 2);
    ol(g, 1); g.strokeCircle(wx+4, wy+4, 6);
  });
  // Antenna
  g.fillStyle(0xD4A820, 1); g.fillRect(W-10, 0, 2, 8);
  g.fillStyle(0xFF4444, 1); g.fillCircle(W-9, 0, 2);
  // Panel
  g.fillStyle(0x2244AA, 1); g.fillRect(0, 10, 8, 6);
  g.fillStyle(0x4466CC, 0.8); g.fillRect(1, 11, 6, 4);
  ol(g, 2); g.strokeRoundedRect(8, 6, W-16, H-14, 4);
  gen(scene, g, 'obj_lunar_rover', W, H);
}

export function createBarStoolTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 28;
  // Red velvet cushion seat
  g.fillStyle(0xCC3344, 1); g.fillCircle(10, 8, 8);
  g.fillStyle(0xFF6677, 1); g.fillEllipse(8, 6, 8, 5);
  ol(g, 2); g.strokeCircle(10, 8, 8);
  // Chrome stem
  g.fillStyle(0xC8B860, 1); g.fillRect(8, 15, 4, 8);
  g.fillStyle(0xEED880, 1); g.fillRect(9, 15, 2, 8);
  // Base ring
  g.fillStyle(0x9A9030, 1); g.fillRect(4, 22, 12, 4);
  g.fillStyle(0xC8B860, 1); g.fillRect(5, 22, 10, 2);
  ol(g, 1); g.strokeRect(4, 22, 12, 4);
  gen(scene, g, 'obj_bar_stool', W, H);
}

export function createQueuePoleTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 10, H = 34;
  // Base
  g.fillStyle(0x9A8820, 1); g.fillRoundedRect(1, 28, 8, 5, 2);
  // Gold pole
  g.fillStyle(0xC8A828, 1); g.fillRect(3, 4, 4, 26);
  g.fillStyle(0xEECC44, 1); g.fillRect(4, 4, 2, 26);
  // Top knob
  g.fillStyle(0xDDB830, 1); g.fillCircle(5, 4, 4);
  g.fillStyle(0xFFE050, 1); g.fillCircle(4, 3, 2);
  gen(scene, g, 'obj_queue_pole', W, H);
}

// ─────────────────────────────────────────────
// FOOD ITEM TEXTURES
// ─────────────────────────────────────────────

export function createFoodTextures(scene: Phaser.Scene): void {
  // Moon Mocha — dark cup, amber latte art
  {
    const g = makeGraphics(scene);
    const W = 20, H = 20;
    // Cup body
    g.fillStyle(0x3A1A08, 1); g.fillRoundedRect(3, 6, W-6, H-7, 2);
    g.fillStyle(0x6B3820, 1); g.fillRect(4, 7, W-8, 4);
    // Froth
    g.fillStyle(0xF0E0B8, 1); g.fillEllipse(W/2, 8, W-8, 5);
    g.fillStyle(0xFFCC88, 0.8); g.fillEllipse(W/2-2, 7, 6, 3);
    // Latte art swirl hint
    g.fillStyle(0xD4A020, 1); g.fillRect(W/2-2, 7, 4, 1); g.fillRect(W/2, 6, 1, 3);
    // Saucer
    g.fillStyle(0xD4A820, 1); g.fillRoundedRect(1, H-4, W-2, 3, 1);
    // Handle
    g.fillStyle(0x5A2808, 1); g.fillRect(W-4, 9, 4, 5);
    g.fillStyle(0x7A3A10, 0.7); g.fillRect(W-3, 10, 2, 3);
    ol(g, 1); g.strokeRoundedRect(3, 6, W-6, H-7, 2);
    gen(scene, g, 'food_moon_mocha', W, H);
  }
  // Zero-G Latte — teal capsule with glow
  {
    const g = makeGraphics(scene);
    const W = 18, H = 20;
    g.fillStyle(0x0A2A30, 1); g.fillRoundedRect(3, 4, W-6, H-6, 4);
    g.fillStyle(0x00BBCC, 1); g.fillRect(5, 5, W-10, 4);
    g.fillStyle(0x44EEFF, 0.7); g.fillRect(5, 5, W-10, 2);
    g.fillStyle(0x005566, 1); g.fillRect(5, 9, W-10, H-14);
    g.fillStyle(0x00CCDD, 0.4); g.fillEllipse(W/2, 8, W-8, 5);
    ol(g, 1); g.strokeRoundedRect(3, 4, W-6, H-6, 4);
    gen(scene, g, 'food_zerog_latte', W, H);
  }
  // Lunar Pancakes — golden stack
  {
    const g = makeGraphics(scene);
    const W = 24, H = 18;
    // 3 pancakes, slightly offset
    [[0, 0xC47828], [3, 0xD48838], [6, 0xE4A848]].forEach(([yOff, col]) => {
      g.fillStyle(col as number, 1);
      g.fillEllipse(W/2, H-4-(yOff as number), W-4, 5);
      g.fillStyle((col as number) + 0x181808, 0.6);
      g.fillEllipse(W/2, H-3-(yOff as number), W-6, 2);
      ol(g, 1); g.strokeEllipse(W/2, H-4-(yOff as number), W-4, 5);
    });
    // Butter pat
    g.fillStyle(0xFFEE88, 1); g.fillRect(W/2-2, H-12, 5, 3);
    // Syrup drip
    g.fillStyle(0xCC7700, 1); g.fillRect(W/2+3, H-12, 2, 5);
    gen(scene, g, 'food_luna_pancakes', W, H);
  }
  // Stardust Cookies — golden plate of cookies
  {
    const g = makeGraphics(scene);
    const W = 22, H = 18;
    // Plate
    g.fillStyle(0x2A1A08, 1); g.fillEllipse(W/2, H-3, W-2, 7);
    g.fillStyle(0x3A2810, 0.7); g.fillEllipse(W/2, H-4, W-4, 4);
    // Cookies
    [[6,9],[12,9],[16,11],[9,5]].forEach(([x,y]) => {
      g.fillStyle(0xCC9944, 1); g.fillCircle(x, y, 4);
      g.fillStyle(0xAA7722, 1); g.fillCircle(x, y, 2);
      // Star on cookie
      g.fillStyle(0xFFDD44, 1); g.fillRect(x-1, y-2, 1, 4); g.fillRect(x-2, y-1, 4, 1);
      ol(g, 1); g.strokeCircle(x, y, 4);
    });
    gen(scene, g, 'food_star_cookies', W, H);
  }
  // Lunar Fondue — golden bubbling pot
  {
    const g = makeGraphics(scene);
    const W = 22, H = 20;
    // Pot body
    g.fillStyle(0x5A3000, 1); g.fillRoundedRect(3, 8, W-6, H-10, 2);
    g.fillStyle(0x7A4800, 1); g.fillRect(4, 9, W-8, 4);
    // Melted cheese
    g.fillStyle(0xF0C020, 1); g.fillEllipse(W/2, 10, W-6, 6);
    g.fillStyle(0xFFE060, 0.9); g.fillEllipse(W/2-2, 9, 7, 3);
    // Drips over edge
    g.fillStyle(0xD4A010, 1);
    g.fillRect(5, 13, 2, 4); g.fillRect(15, 13, 2, 4);
    // Handles
    g.fillStyle(0xD4A820, 1); g.fillRect(0, H-7, 4, 3); g.fillRect(W-4, H-7, 4, 3);
    // Feet
    g.fillStyle(0x5A3000, 1); g.fillEllipse(W/2, H-2, W-4, 5);
    ol(g, 1); g.strokeRoundedRect(3, 8, W-6, H-10, 2);
    gen(scene, g, 'food_lunar_fondue', W, H);
  }
  // Nebula Risotto — purple cosmic bowl
  {
    const g = makeGraphics(scene);
    const W = 24, H = 20;
    // Bowl rim
    g.fillStyle(0x1A0830, 1); g.fillEllipse(W/2, H-2, W-2, 7);
    // Risotto
    g.fillStyle(0x7030CC, 1); g.fillEllipse(W/2, H-6, W-6, 8);
    g.fillStyle(0xAA50E0, 0.9); g.fillEllipse(W/2, H-8, W-10, 6);
    g.fillStyle(0xFF88FF, 0.7); g.fillEllipse(W/2-2, H-9, 7, 4);
    g.fillStyle(0xFFAAFF, 0.5); g.fillCircle(W/2+4, H-10, 2);
    // Sparkle garnish
    g.fillStyle(0xFFDD00, 1);
    [[W/2, 4],[W/2-3, 6],[W/2+4, 5]].forEach(([x,y]) => {
      g.fillRect(x-0.5, y-2, 1, 4); g.fillRect(x-2, y-0.5, 4, 1);
    });
    ol(g, 1); g.strokeEllipse(W/2, H-2, W-2, 7);
    gen(scene, g, 'food_nebula_risotto', W, H);
  }
  // Gravity Soufflé — tall risen pastry
  {
    const g = makeGraphics(scene);
    const W = 22, H = 22;
    // Ramekin
    g.fillStyle(0x4A2E08, 1); g.fillRect(4, H-6, W-8, 5);
    g.fillStyle(0xD4A820, 1); g.fillRect(3, H-7, W-6, 2);
    ol(g, 1); g.strokeRect(4, H-6, W-8, 5);
    // Risen top (puffed golden dome)
    g.fillStyle(0xE8A820, 1); g.fillEllipse(W/2, H-9, W-2, 9);
    g.fillStyle(0xFFCC44, 1); g.fillEllipse(W/2, H-12, W-6, 7);
    g.fillStyle(0xFFEE88, 0.9); g.fillEllipse(W/2-1, H-13, 7, 4);
    ol(g, 1); g.strokeEllipse(W/2, H-9, W-2, 9);
    // Sparkles
    g.fillStyle(0xFFFFCC, 1);
    [[W/2, 3],[W/2+4, 5],[W/2-3, 4]].forEach(([x,y]) => {
      g.fillRect(x-0.5, y-2, 1, 4); g.fillRect(x-2, y-0.5, 4, 1);
    });
    gen(scene, g, 'food_gravity_souffle', W, H);
  }
}

// ─────────────────────────────────────────────
// CHARACTER TEXTURES
// ─────────────────────────────────────────────

function drawAnimeAstronaut(
  g: Phaser.GameObjects.Graphics,
  suitColor: number,
  visorColor: number,
  _skinColor: number,
  dir: 'down' | 'up' | 'side'
): void {
  // Helmet
  g.fillStyle(suitColor, 1); g.fillCircle(8, 6, 6);
  if (dir === 'down') {
    g.fillStyle(visorColor, 1); g.fillEllipse(8, 6, 10, 8);
    g.fillStyle(0xFFFFFF, 0.3); g.fillEllipse(6, 4, 4, 3);
  } else if (dir === 'up') {
    g.fillStyle(0x111133, 1); g.fillRect(4, 3, 8, 6);
    g.fillStyle(suitColor, 0.4); g.fillRect(5, 3, 6, 3);
  } else {
    g.fillStyle(visorColor, 1); g.fillRect(5, 3, 6, 6);
    g.fillStyle(0xFFFFFF, 0.3); g.fillRect(5, 3, 3, 2);
  }
  ol(g, 1); g.strokeCircle(8, 6, 6);
  // Gold neck ring
  g.fillStyle(0xD4A820, 1); g.fillRect(3, 11, 10, 2);
  // Body
  g.fillStyle(suitColor, 1); g.fillRect(3, 13, 10, 8);
  g.fillStyle(0xFFFFFF, 0.15); g.fillRect(4, 14, 4, 5);
  // Chest pack
  g.fillStyle(0xD4A820, 1); g.fillRect(5, 16, 6, 3);
  g.fillStyle(0xFFD840, 0.7); g.fillRect(6, 17, 4, 1);
  ol(g, 1); g.strokeRect(3, 13, 10, 8);
  // Arms
  g.fillStyle(suitColor, 1);
  g.fillRect(1, 13, 2, 7); g.fillRect(13, 13, 2, 7);
  // Gloves
  g.fillStyle(0x888899, 1);
  g.fillRect(1, 19, 2, 2); g.fillRect(13, 19, 2, 2);
  ol(g, 1); g.strokeRect(1, 13, 2, 7); g.strokeRect(13, 13, 2, 7);
  // Legs
  g.fillStyle(suitColor, 1);
  g.fillRect(3, 21, 4, 2); g.fillRect(9, 21, 4, 2);
  // Boots
  g.fillStyle(0x333344, 1);
  g.fillRect(2, 22, 5, 2); g.fillRect(9, 22, 5, 2);
  ol(g, 1); g.strokeRect(2, 22, 5, 2); g.strokeRect(9, 22, 5, 2);
}

export function createPlayerTextures(scene: Phaser.Scene): void {
  const W = 16, H = 24;
  (['down', 'up', 'side'] as const).forEach(dir => {
    const g = makeGraphics(scene);
    drawAnimeAstronaut(g, COLORS.PLAYER_SUIT, COLORS.PLAYER_VISOR, COLORS.SKIN_A, dir);
    const suffix = dir === 'down' ? '_down' : dir === 'up' ? '_up' : '_side';
    gen(scene, g, `player${suffix}`, W, H);
  });
}

export function createEmployeeTexture(scene: Phaser.Scene): void {
  const W = 16, H = 24;
  const g = makeGraphics(scene);
  drawAnimeAstronaut(g, COLORS.EMPLOYEE_SUIT, COLORS.EMPLOYEE_VISOR, COLORS.SKIN_A, 'down');
  gen(scene, g, 'player_employee', W, H);
}

export function createCustomerTextures(scene: Phaser.Scene): void {
  const W = 16, H = 24;

  // Astronaut customer
  {
    const g = makeGraphics(scene);
    drawAnimeAstronaut(g, COLORS.ASTRONAUT_SUIT, COLORS.ASTRONAUT_VISOR, COLORS.SKIN_A, 'down');
    gen(scene, g, 'customer_astronaut', W, H);
  }

  // Scientist
  {
    const g = makeGraphics(scene);
    // Head
    g.fillStyle(COLORS.SKIN_B, 1); g.fillCircle(8, 5, 5);
    g.fillStyle(COLORS.SKIN_B, 0.8); g.fillRect(5, 5, 6, 4);
    // Dark hair
    g.fillStyle(COLORS.SCIENTIST_HAT, 1); g.fillRect(4, 0, 8, 4);
    g.fillStyle(0x445577, 1); g.fillRect(3, 3, 10, 2);
    // Glasses
    g.lineStyle(1, 0x1A1428, 1);
    g.strokeRect(5, 5, 3, 2); g.strokeRect(9, 5, 3, 2);
    g.lineBetween(8, 6, 9, 6);
    // White coat
    g.fillStyle(COLORS.SCIENTIST_COAT, 1); g.fillRect(3, 9, 10, 9);
    g.fillStyle(0xDDDDDD, 1); g.fillRect(4, 10, 8, 2);
    // Lapels
    g.fillStyle(COLORS.SCIENTIST_COAT, 1);
    g.fillTriangle(7, 10, 4, 12, 7, 15); g.fillTriangle(9, 10, 12, 12, 9, 15);
    // Arms
    g.fillStyle(COLORS.SCIENTIST_COAT, 1);
    g.fillRect(1, 10, 2, 7); g.fillRect(13, 10, 2, 7);
    g.fillStyle(COLORS.SKIN_B, 1);
    g.fillRect(1, 16, 2, 2); g.fillRect(13, 16, 2, 2);
    ol(g, 1); g.strokeCircle(8, 5, 5); g.strokeRect(3, 9, 10, 9);
    // Pants
    g.fillStyle(0x334466, 1); g.fillRect(3, 18, 10, 6);
    g.fillStyle(0x222244, 1); g.fillRect(2, 22, 5, 2); g.fillRect(9, 22, 5, 2);
    gen(scene, g, 'customer_scientist', W, H);
  }

  // Tourist
  {
    const g = makeGraphics(scene);
    // Head
    g.fillStyle(COLORS.SKIN_A, 1); g.fillCircle(8, 5, 5);
    g.fillStyle(COLORS.SKIN_A, 0.8); g.fillRect(5, 5, 6, 4);
    // Sun hat
    g.fillStyle(0xFFAA00, 1); g.fillEllipse(8, 1, 12, 4);
    g.fillStyle(0xFFCC44, 0.7); g.fillEllipse(7, 1, 8, 2);
    // Face smile implied by color block
    g.fillStyle(0xCC8866, 0.5); g.fillRect(7, 7, 3, 1);
    // Colorful shirt
    g.fillStyle(COLORS.TOURIST_SHIRT, 1); g.fillRect(3, 9, 10, 9);
    g.fillStyle(0xFF9999, 0.7); g.fillRect(4, 10, 8, 3);
    g.fillStyle(0xFFCC88, 0.5); g.fillRect(4, 13, 4, 3);
    // Arms
    g.fillStyle(COLORS.TOURIST_SHIRT, 1);
    g.fillRect(1, 10, 2, 6); g.fillRect(13, 10, 2, 6);
    g.fillStyle(COLORS.SKIN_A, 1);
    g.fillRect(1, 15, 2, 2); g.fillRect(13, 15, 2, 2);
    ol(g, 1); g.strokeCircle(8, 5, 5); g.strokeRect(3, 9, 10, 9);
    // Shorts
    g.fillStyle(0x4488AA, 1); g.fillRect(3, 18, 10, 6);
    g.fillStyle(0x224466, 1); g.fillRect(2, 22, 5, 2); g.fillRect(9, 22, 5, 2);
    gen(scene, g, 'customer_tourist', W, H);
  }

  // Lunar Worker
  {
    const g = makeGraphics(scene);
    // Head
    g.fillStyle(COLORS.SKIN_B, 1); g.fillCircle(8, 5, 5);
    g.fillStyle(COLORS.SKIN_B, 0.8); g.fillRect(5, 5, 6, 4);
    // Hard hat
    g.fillStyle(0xFF8822, 1); g.fillEllipse(8, 2, 12, 5);
    g.fillStyle(0xFFAA44, 0.7); g.fillEllipse(7, 1, 8, 3);
    // Brim
    g.fillStyle(0xCC6600, 1); g.fillRect(3, 4, 10, 2);
    // Orange work suit
    g.fillStyle(COLORS.WORKER_SUIT, 1); g.fillRect(3, 9, 10, 9);
    // Safety stripes
    g.fillStyle(0xFFDD00, 1);
    g.fillRect(3, 13, 10, 2);
    // Arms
    g.fillStyle(COLORS.WORKER_SUIT, 1);
    g.fillRect(1, 10, 2, 7); g.fillRect(13, 10, 2, 7);
    g.fillStyle(COLORS.SKIN_B, 1);
    g.fillRect(1, 16, 2, 2); g.fillRect(13, 16, 2, 2);
    ol(g, 1); g.strokeCircle(8, 5, 5); g.strokeRect(3, 9, 10, 9);
    // Pants
    g.fillStyle(0x444433, 1); g.fillRect(3, 18, 10, 6);
    g.fillStyle(0x333322, 1); g.fillRect(2, 22, 5, 2); g.fillRect(9, 22, 5, 2);
    gen(scene, g, 'customer_worker', W, H);
  }
}

// ─────────────────────────────────────────────
// CAT TEXTURES
// ─────────────────────────────────────────────

function createCatVariant(scene: Phaser.Scene, key: string, bodyColor: number, darkColor: number): void {
  const W = 20, H = 16;
  const g = makeGraphics(scene);

  // Body
  g.fillStyle(bodyColor, 1); g.fillEllipse(10, 12, 16, 8);
  // Bottom shadow
  g.fillStyle(darkColor, 0.35); g.fillEllipse(10, 13, 14, 5);
  // Head
  g.fillStyle(bodyColor, 1); g.fillCircle(9, 7, 7);
  // Ears
  g.fillStyle(bodyColor, 1);
  g.fillTriangle(3, 7, 5, 1, 8, 6);
  g.fillTriangle(10, 6, 13, 1, 15, 7);
  // Inner ear
  g.fillStyle(darkColor, 0.55);
  g.fillTriangle(4, 6, 5, 2, 7, 6);
  g.fillTriangle(11, 6, 13, 2, 14, 6);
  // Eyes — big, expressive
  g.fillStyle(0x44CC44, 1); g.fillCircle(6, 7, 2); g.fillCircle(12, 7, 2);
  g.fillStyle(0x111122, 1); g.fillCircle(6, 7, 1); g.fillCircle(12, 7, 1);
  g.fillStyle(0xFFFFFF, 1); g.fillCircle(6, 6, 0.7); g.fillCircle(12, 6, 0.7);
  // Nose
  g.fillStyle(0xFF8899, 1); g.fillTriangle(8, 9, 9, 10, 10, 9);
  // Whiskers
  g.lineStyle(1, darkColor, 0.4);
  g.lineBetween(2, 8, 6, 8); g.lineBetween(2, 9, 6, 9);
  g.lineBetween(12, 8, 17, 8); g.lineBetween(12, 9, 17, 9);
  // Tail
  g.fillStyle(bodyColor, 1); g.fillEllipse(18, 12, 5, 4);
  g.fillStyle(darkColor, 0.3); g.fillEllipse(18, 13, 4, 3);
  // Outline
  ol(g, 1);
  g.strokeCircle(9, 7, 7);
  g.strokeEllipse(10, 12, 16, 8);
  gen(scene, g, key, W, H);
}

function createCatSleeping(scene: Phaser.Scene, key: string, bodyColor: number, darkColor: number): void {
  const W = 22, H = 12;
  const g = makeGraphics(scene);
  // Sleeping curled body
  g.fillStyle(bodyColor, 1); g.fillEllipse(11, 7, 20, 9);
  g.fillStyle(darkColor, 0.3); g.fillEllipse(11, 9, 18, 5);
  // Head tucked at left
  g.fillStyle(bodyColor, 1); g.fillCircle(5, 6, 5);
  // Ear
  g.fillStyle(bodyColor, 1); g.fillTriangle(1, 4, 3, 0, 6, 4);
  g.fillStyle(darkColor, 0.5); g.fillTriangle(2, 4, 3, 1, 5, 4);
  // Closed eyes (curved lines)
  g.lineStyle(1, darkColor, 1);
  g.beginPath(); g.arc(4, 6, 2, 0.1, Math.PI - 0.1); g.strokePath();
  g.beginPath(); g.arc(7, 6, 2, 0.1, Math.PI - 0.1); g.strokePath();
  // Tail at right
  g.fillStyle(bodyColor, 1); g.fillEllipse(19, 8, 5, 4);
  // Outline
  ol(g, 1);
  g.strokeEllipse(11, 7, 20, 9);
  g.strokeCircle(5, 6, 5);
  gen(scene, g, key, W, H);
}

export function createCatTextures(scene: Phaser.Scene): void {
  createCatVariant(scene, 'cat_orange', COLORS.CAT_ORANGE, COLORS.CAT_ORANGE_D);
  createCatSleeping(scene, 'cat_orange_sleep', COLORS.CAT_ORANGE, COLORS.CAT_ORANGE_D);
  createCatVariant(scene, 'cat_gray', COLORS.CAT_GRAY, COLORS.CAT_GRAY_D);
  createCatSleeping(scene, 'cat_gray_sleep', COLORS.CAT_GRAY, COLORS.CAT_GRAY_D);
  createCatVariant(scene, 'cat_black', COLORS.CAT_BLACK, COLORS.CAT_BLACK_D);
  createCatSleeping(scene, 'cat_black_sleep', COLORS.CAT_BLACK, COLORS.CAT_BLACK_D);
  createCatVariant(scene, 'cat_cream', COLORS.CAT_CREAM, COLORS.CAT_CREAM_D);
  createCatSleeping(scene, 'cat_cream_sleep', COLORS.CAT_CREAM, COLORS.CAT_CREAM_D);
}

// ─────────────────────────────────────────────
// UI TEXTURES
// ─────────────────────────────────────────────

export function createUITextures(scene: Phaser.Scene): void {
  // Order bubble — white with rounded corners, bold outline, pointer
  {
    const g = makeGraphics(scene);
    const W = 40, H = 34;
    g.fillStyle(0xFFFAF0, 1); g.fillRoundedRect(0, 0, W, H-8, 6);
    g.fillStyle(0xFFFAF0, 1); g.fillTriangle(8, H-8, 16, H-8, 10, H);
    ol(g, 2);
    g.strokeRoundedRect(1, 1, W-2, H-9, 6);
    g.lineStyle(2, OUT, 1);
    g.moveTo(8, H-8); g.lineTo(10, H); g.lineTo(16, H-8); g.strokePath();
    gen(scene, g, 'ui_order_bubble', W, H);
  }
  // Coin — bold gold circle
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xF0C018, 1); g.fillCircle(8, 8, 7);
    g.fillStyle(0xFFE050, 1); g.fillCircle(7, 7, 4);
    g.fillStyle(0xAA8800, 1); g.fillCircle(8, 8, 7); // ring
    g.fillStyle(0xF0C018, 1); g.fillCircle(8, 8, 5);
    g.fillStyle(0xFFD840, 1); g.fillRect(6, 5, 4, 6); // $ symbol hint
    g.fillStyle(0xFFE878, 0.7); g.fillRect(7, 6, 2, 4);
    ol(g, 1); g.strokeCircle(8, 8, 7);
    gen(scene, g, 'ui_coin', 16, 16);
  }
  // Star icon
  {
    const g = makeGraphics(scene);
    g.fillStyle(COLORS.UI_STAR, 1);
    const cx = 8, cy = 8, or = 7, ir = 3;
    const pts: { x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? or : ir;
      const a = (i * 36 - 90) * Math.PI / 180;
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    g.fillPoints(pts, true);
    g.fillStyle(0xFFFF99, 0.6); g.fillCircle(7, 6, 3);
    ol(g, 1); g.beginPath();
    pts.forEach((p, i) => i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y));
    g.closePath(); g.strokePath();
    gen(scene, g, 'ui_star', 16, 16);
  }
  // Heart icon
  {
    const g = makeGraphics(scene);
    g.fillStyle(COLORS.UI_HEART, 1);
    g.fillCircle(5, 5, 4); g.fillCircle(11, 5, 4);
    g.fillTriangle(1, 7, 15, 7, 8, 15);
    g.fillStyle(0xFF99BB, 0.7); g.fillCircle(4, 4, 2);
    ol(g, 1);
    g.strokeCircle(5, 5, 4); g.strokeCircle(11, 5, 4);
    g.strokeTriangle(1, 7, 15, 7, 8, 15);
    gen(scene, g, 'ui_heart', 16, 16);
  }
  // Progress bar background — warm dark
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x1A1428, 1); g.fillRoundedRect(0, 0, 48, 8, 3);
    g.fillStyle(0x2A2040, 1); g.fillRoundedRect(1, 1, 46, 6, 2);
    gen(scene, g, 'ui_progress_bg', 48, 8);
  }
  // E-key prompt — bold gold key icon
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xF0C018, 1); g.fillRoundedRect(0, 0, 18, 18, 3);
    g.fillStyle(0x1A1428, 1); g.fillRoundedRect(2, 2, 14, 14, 2);
    g.fillStyle(0xF0C018, 1);
    g.fillRect(5, 4, 8, 2); g.fillRect(5, 8, 7, 2); g.fillRect(5, 12, 8, 2);
    g.fillRect(5, 4, 2, 10);
    gen(scene, g, 'ui_e_prompt', 18, 18);
  }
  // Patience bar fill
  {
    const g = makeGraphics(scene);
    g.fillStyle(COLORS.UI_PATIENCE_OK, 1); g.fillRoundedRect(0, 0, 46, 6, 2);
    g.fillStyle(0xAAFFAA, 0.5); g.fillRect(2, 1, 20, 2);
    gen(scene, g, 'ui_patience_fill', 46, 6);
  }
}

// ─────────────────────────────────────────────
// PARTICLE TEXTURES
// ─────────────────────────────────────────────

export function createParticleTextures(scene: Phaser.Scene): void {
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xCCEEEE, 0.9); g.fillCircle(4, 4, 4);
    g.fillStyle(0xFFFFFF, 0.5); g.fillCircle(3, 3, 2);
    gen(scene, g, 'particle_steam', 8, 8);
  }
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xFFEE88, 1); g.fillRect(3, 0, 2, 8); g.fillRect(0, 3, 8, 2);
    g.fillStyle(0xFFFFCC, 0.7); g.fillRect(3, 2, 2, 4);
    gen(scene, g, 'particle_star', 8, 8);
  }
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xF0C018, 1); g.fillCircle(4, 4, 4);
    g.fillStyle(0xFFE050, 0.8); g.fillCircle(3, 3, 2);
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
// DECORATION TEXTURES
// ─────────────────────────────────────────────

export function createDecorationTextures(scene: Phaser.Scene): void {
  const S = 28;

  // Velvet Chair — rich red seat, gold legs
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x1A0830, 1); g.fillRoundedRect(4, 10, S-8, S-14, 3);
    g.fillStyle(0xC03060, 1); g.fillRoundedRect(5, 7, S-10, 11, 5);
    g.fillStyle(0xE05080, 1); g.fillEllipse(S/2, 10, S-14, 6);
    g.fillStyle(0xFF80A0, 0.5); g.fillEllipse(S/2-3, 9, 8, 3);
    g.fillStyle(0xD4A820, 1); g.fillRect(5, S-5, 3, 5); g.fillRect(S-8, S-5, 3, 5);
    ol(g, 1); g.strokeRoundedRect(5, 7, S-10, 11, 5);
    gen(scene, g, 'deco_velvet_chair', S, S);
  }
  // Round Table — mahogany top, gold pedestal
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x6A3810, 1); g.fillEllipse(S/2, S/2-2, S-4, S-8);
    g.fillStyle(0xAA6030, 1); g.fillEllipse(S/2-2, S/2-4, 10, 5);
    g.fillStyle(0xD4A820, 1); g.fillRect(S/2-2, S/2+2, 4, 6); g.fillEllipse(S/2, S-4, 10, 4);
    ol(g, 1); g.strokeEllipse(S/2, S/2-2, S-4, S-8);
    gen(scene, g, 'deco_round_table', S, S);
  }
  // Booth Seat — teal padded bench
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x0A3030, 1); g.fillRoundedRect(2, 8, S-4, S-12, 3);
    g.fillStyle(0x1A6060, 1); g.fillRoundedRect(3, 7, S-6, 10, 3);
    g.fillStyle(0x30A0A0, 0.7); g.fillRect(4, 8, S-8, 4);
    g.fillStyle(0x88DDDD, 0.4); g.fillRect(5, 8, S-10, 2);
    g.fillStyle(0xD4A820, 1); g.fillRect(2, 7, S-4, 1); g.fillRect(2, S-5, S-4, 1);
    ol(g, 1); g.strokeRoundedRect(3, 7, S-6, 10, 3);
    gen(scene, g, 'deco_booth_seat', S, S);
  }

  // Fairy Lights — colorful bulbs on wire
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x333322, 1); g.fillRect(2, S/2, S-4, 2);
    const cols = [0xFFDD44, 0xFF6688, 0x44DDFF, 0xAAFF44, 0xFFAA22];
    for (let i = 0; i < 5; i++) {
      const cx = 4 + i*5, cy = S/2+1;
      g.fillStyle(cols[i], 1); g.fillCircle(cx, cy, 3);
      g.fillStyle(cols[i], 0.3); g.fillCircle(cx, cy, 5);
      g.fillStyle(0xFFFFFF, 0.5); g.fillCircle(cx-1, cy-1, 1);
      ol(g, 1); g.strokeCircle(cx, cy, 3);
    }
    gen(scene, g, 'deco_fairy_lights', S, S);
  }
  // Neon Sign — glowing pink OPEN sign
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x0A0415, 1); g.fillRoundedRect(1, 5, S-2, S-10, 4);
    g.fillStyle(0xFF44CC, 0.25); g.fillRoundedRect(2, 6, S-4, S-12, 3);
    ol(g, 2); g.strokeRoundedRect(2, 6, S-4, S-12, 3);
    g.lineStyle(2, 0xFF44CC, 1);
    // "OPEN" as two horizontal bars and a center glow
    g.strokeRect(5, 9, 4, 7);
    g.strokeRect(11, 9, 4, 7);
    g.strokeRect(17, 9, 4, 7);
    g.fillStyle(0xFF88EE, 0.7); g.fillEllipse(S/2, S/2, S-8, S-14);
    gen(scene, g, 'deco_neon_sign', S, S);
  }
  // Crystal Lamp — hanging chandelier
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xD4A820, 1); g.fillRect(S/2-1, 0, 2, 5);
    g.fillStyle(0xF0C018, 1); g.fillEllipse(S/2, 8, 12, 6);
    g.fillStyle(0xCCEEFF, 0.9); g.fillEllipse(S/2, 8, 8, 4);
    [[S/2-6,10],[S/2,10],[S/2+6,10]].forEach(([cx,cy]) => {
      g.fillStyle(0xCCEEFF, 1); g.fillRect(cx-1, cy, 2, 8);
      g.fillStyle(0x88CCFF, 0.9);
      g.fillTriangle(cx-2, cy+8, cx+2, cy+8, cx, cy+12);
      ol(g, 1); g.strokeTriangle(cx-2, cy+8, cx+2, cy+8, cx, cy+12);
    });
    g.fillStyle(0xFFFFCC, 0.4); g.fillCircle(S/2, 8, 10);
    gen(scene, g, 'deco_crystal_lamp', S, S);
  }

  // Luna Fern — glowing teal fern
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x2A4422, 1); g.fillEllipse(S/2, S-4, 10, 5);
    g.fillStyle(0x0A4433, 1); g.fillRect(S/2-1, 6, 2, S-12);
    g.fillStyle(0x00AA88, 1);
    g.fillEllipse(S/2-7, 14, 12, 6); g.fillEllipse(S/2+7, 12, 12, 6);
    g.fillEllipse(S/2-5, 8, 10, 5); g.fillEllipse(S/2+5, 6, 10, 5);
    g.fillStyle(0x44FFCC, 0.5);
    g.fillEllipse(S/2-8, 13, 6, 3); g.fillEllipse(S/2+8, 11, 6, 3);
    gen(scene, g, 'deco_luna_fern', S, S);
  }
  // Space Cactus
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x2A4422, 1); g.fillEllipse(S/2, S-4, 10, 5);
    g.fillStyle(0x2A5A2A, 1); g.fillRoundedRect(S/2-4, 6, 8, S-12, 2);
    g.fillStyle(0x3A7A3A, 1); g.fillRect(S/2-3, 7, 6, S-14);
    g.fillStyle(0x3A6A2A, 1);
    g.fillRoundedRect(S/2-9, 12, 5, 4, 2); g.fillRoundedRect(S/2+4, 10, 5, 4, 2);
    g.fillStyle(0xBB44FF, 1); g.fillCircle(S/2, 6, 3);
    g.fillStyle(0xDD88FF, 0.6); g.fillCircle(S/2-1, 5, 2);
    ol(g, 1); g.strokeRoundedRect(S/2-4, 6, 8, S-12, 2);
    gen(scene, g, 'deco_space_cactus', S, S);
  }
  // Moon Bloom — white flower with gold center
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x2A4422, 1); g.fillEllipse(S/2, S-4, 10, 5);
    g.fillStyle(0x2A4A2A, 1); g.fillRect(S/2-1, 12, 2, S-14);
    g.fillStyle(0xEEEEFF, 1);
    for (let a = 0; a < 6; a++) {
      const ax = S/2 + Math.cos(a * Math.PI/3) * 7;
      const ay = 10 + Math.sin(a * Math.PI/3) * 7;
      g.fillEllipse(ax, ay, 6, 8);
    }
    g.fillStyle(0xF0C018, 1); g.fillCircle(S/2, 10, 4);
    g.fillStyle(0xFFEE66, 0.8); g.fillCircle(S/2-1, 9, 2);
    ol(g, 1); g.strokeCircle(S/2, 10, 4);
    gen(scene, g, 'deco_moon_bloom', S, S);
  }

  // Star Map — framed chart
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x2A1A40, 1); g.fillRoundedRect(2, 3, S-4, S-6, 2);
    g.fillStyle(0xD4A820, 1); g.lineStyle(2, 0xD4A820, 1); g.strokeRoundedRect(2, 3, S-4, S-6, 2);
    g.fillStyle(0x06041C, 1); g.fillRect(5, 6, S-10, S-12);
    const stars = [[6,8],[14,7],[20,10],[10,14],[18,18],[8,20],[22,16]];
    g.fillStyle(0xFFFFCC, 1);
    stars.forEach(([sx,sy]) => g.fillCircle(sx, sy, 1.5));
    g.lineStyle(1, 0x445566, 0.8);
    g.beginPath(); g.moveTo(6,8); g.lineTo(14,7); g.lineTo(20,10); g.lineTo(18,18); g.strokePath();
    gen(scene, g, 'deco_star_map', S, S);
  }
  // Moon Portrait — framed moon painting
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x3A1A08, 1); g.fillRoundedRect(1, 2, S-2, S-4, 2);
    g.fillStyle(0xD4A820, 1); g.lineStyle(2, 0xD4A820, 1); g.strokeRoundedRect(1, 2, S-2, S-4, 2);
    g.fillStyle(0x06041C, 1); g.fillRect(4, 5, S-8, S-10);
    g.fillStyle(0xC8C4B0, 1); g.fillCircle(S/2, S/2-1, 9);
    g.fillStyle(0x9A9480, 1); g.fillCircle(S/2-3, S/2-3, 4); g.fillCircle(S/2+4, S/2+2, 3);
    g.fillStyle(0xE0DDD0, 0.8); g.fillCircle(S/2-4, S/2-4, 2);
    g.fillStyle(0xFFFFCC, 0.3); g.fillCircle(S/2-1, S/2-5, 5);
    gen(scene, g, 'deco_moon_portrait', S, S);
  }

  // Telescope — brass body on tripod
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xD4A820, 1); g.fillRoundedRect(S/2-6, 7, 14, 5, 2);
    g.fillStyle(0xFFD840, 0.7); g.fillRect(S/2-5, 8, 12, 2);
    g.fillStyle(0xD4A820, 1); g.fillRoundedRect(S/2-4, 11, 10, 4, 1);
    g.fillStyle(0x886600, 1); g.fillRect(S/2-2, 15, 4, 4);
    // Tripod legs
    g.fillStyle(0xD4A820, 1);
    g.fillRect(S/2-9, 19, 4, 2); g.fillRect(S/2+1, 18, 4, 2); g.fillRect(S/2-4, 18, 3, 7);
    // Eyepiece
    g.fillStyle(0x334466, 1); g.fillRoundedRect(S/2-9, 6, 4, 6, 1);
    g.fillStyle(0x88AAFF, 0.9); g.fillRect(S/2-8, 7, 2, 4);
    ol(g, 1); g.strokeRoundedRect(S/2-6, 7, 14, 5, 2);
    gen(scene, g, 'deco_telescope', S, S);
  }
  // Rover Display — mini rover model on plinth
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x4A4A5A, 1); g.fillRoundedRect(3, S-6, S-6, 4, 2);
    g.fillStyle(0xD4A820, 1); g.fillRect(2, S-7, S-4, 1);
    g.fillStyle(0x8A8898, 1); g.fillRoundedRect(6, 11, S-12, 8, 2);
    g.fillStyle(0x5566AA, 1); g.fillRoundedRect(8, 9, 7, 5, 1);
    g.fillStyle(0x88AACC, 0.8); g.fillRect(9, 10, 5, 3);
    g.fillStyle(0x555566, 1);
    g.fillCircle(7, S-9, 3); g.fillCircle(S-7, S-9, 3);
    g.fillStyle(0xAAAAAA, 0.7); g.fillCircle(7, S-9, 1); g.fillCircle(S-7, S-9, 1);
    g.fillStyle(0xD4A820, 1); g.fillRect(S-8, 7, 2, 6);
    ol(g, 1); g.strokeRoundedRect(6, 11, S-12, 8, 2);
    gen(scene, g, 'deco_rover_display', S, S);
  }
  // Cat Statue — cute cat silhouette on pedestal
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x4A4A3A, 1); g.fillRoundedRect(5, S-6, S-10, 4, 2);
    g.fillStyle(0xD4A820, 1); g.fillRect(4, S-7, S-8, 1);
    // Statue body
    g.fillStyle(0xD4C090, 1);
    g.fillEllipse(S/2, 14, 10, 12);
    // Ears
    g.fillTriangle(S/2-4, 8, S/2-1, 2, S/2-1, 8);
    g.fillTriangle(S/2+4, 8, S/2+1, 2, S/2+1, 8);
    // Inner ears
    g.fillStyle(0xBBAA80, 1); g.fillEllipse(S/2, 15, 7, 8);
    // Eyes
    g.fillStyle(0xFFD700, 0.9); g.fillCircle(S/2-2, 13, 1.5); g.fillCircle(S/2+2, 13, 1.5);
    g.fillStyle(0x1A1428, 1); g.fillCircle(S/2-2, 13, 0.8); g.fillCircle(S/2+2, 13, 0.8);
    // Support column
    g.fillStyle(0xD4A820, 1); g.fillRect(S/2-2, S-6, 4, 5);
    ol(g, 1); g.strokeEllipse(S/2, 14, 10, 12);
    gen(scene, g, 'deco_cat_statue', S, S);
  }
}

// ─────────────────────────────────────────────
// MASTER FACTORY
// ─────────────────────────────────────────────

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
  createBarStoolTexture(scene);
  createQueuePoleTexture(scene);

  createFoodTextures(scene);
  createPlayerTextures(scene);
  createEmployeeTexture(scene);
  createCustomerTextures(scene);
  createCatTextures(scene);
  createUITextures(scene);
  createParticleTextures(scene);
  createDecorationTextures(scene);
}
