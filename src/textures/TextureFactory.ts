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
  g.fillStyle(COLORS.FLOOR_A, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(COLORS.FLOOR_SEAM, 1);
  [6, 13, 20, 27].forEach(y => g.fillRect(0, y + 1, TILE, 1));
  g.fillStyle(COLORS.FLOOR_B, 1);
  const grainX = [3, 7, 14, 22];
  const grainY = [[0,7],[9,15],[17,23],[25,30]];
  grainX.forEach(x => grainY.forEach(([a, b]) => g.fillRect(x, a, 2, b - a)));
  gen(scene, g, 'tile_floor', TILE, TILE);
}

export function createFloorDarkTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(COLORS.FLOOR_B, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(COLORS.FLOOR_SEAM, 1);
  [6, 13, 20, 27].forEach(y => g.fillRect(0, y + 1, TILE, 1));
  g.fillStyle(COLORS.FLOOR_A, 1);
  [3, 11, 18, 26].forEach(x => [0, 7, 14, 21].forEach(y => g.fillRect(x, y, 2, 5)));
  gen(scene, g, 'tile_floor_dark', TILE, TILE);
}

export function createKitchenFloorTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Checkerboard kitchen tiles
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const color = (r + c) % 2 === 0 ? COLORS.KITCHEN_A : COLORS.KITCHEN_B;
      g.fillStyle(color, 1);
      g.fillRect(c * 16, r * 16, 16, 16);
    }
  }
  // Grout lines
  g.fillStyle(COLORS.KITCHEN_GROUT, 1);
  g.fillRect(0, 15, TILE, 2);
  g.fillRect(15, 0, 2, TILE);
  gen(scene, g, 'tile_kitchen', TILE, TILE);
}

export function createWallTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(COLORS.WALL_CREAM, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(COLORS.WALL_DARK, 1);
  g.fillRect(0, TILE - 2, TILE, 2);
  g.fillRect(0, 0, 2, TILE);
  gen(scene, g, 'tile_wall', TILE, TILE);
}

export function createWindowTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(COLORS.SPACE_DEEP, 1); g.fillRect(0, 0, TILE, TILE);
  // Stars
  g.fillStyle(0xFFFFFF, 1);
  [[3,4],[7,8],[15,3],[24,11],[11,18],[26,6],[29,22],[2,28]].forEach(([x,y]) => g.fillRect(x, y, 2, 2));
  [[14,7],[22,19],[9,26],[28,9]].forEach(([x,y]) => g.fillRect(x, y, 1, 1));
  // Window frame
  g.fillStyle(COLORS.WINDOW_FRAME, 1);
  g.fillRect(0, 0, TILE, 3);
  g.fillRect(0, TILE - 3, TILE, 3);
  g.fillRect(0, 0, 3, TILE);
  g.fillRect(TILE - 3, 0, 3, TILE);
  gen(scene, g, 'tile_window', TILE, TILE);
}

export function createCounterTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(COLORS.COUNTER_TOP, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0xA07050, 1);
  g.fillRect(4, 4, TILE - 8, 2);
  g.fillRect(4, 8, TILE - 8, 1);
  g.fillStyle(COLORS.COUNTER_SIDE, 1);
  g.fillRect(0, TILE - 6, TILE, 6);
  g.fillRect(0, 0, 2, TILE);
  gen(scene, g, 'tile_counter', TILE, TILE);
}

export function createSpaceTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(COLORS.SPACE_DEEP, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0xFFFFFF, 0.8);
  [[5,5],[12,20],[22,8],[28,25],[3,28],[18,14]].forEach(([x,y]) => g.fillRect(x,y,1,1));
  gen(scene, g, 'tile_space', TILE, TILE);
}

export function createMoonTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(COLORS.MOON_GRAY, 1); g.fillRect(0, 0, TILE, TILE);
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
  g.fillStyle(COLORS.TABLE_TOP, 1); g.fillRoundedRect(2, 2, W-4, H-12, 4);
  g.fillStyle(0x8B6845, 1);
  [10, 22, 36].forEach(x => g.fillRect(x, 4, 2, H - 16));
  g.fillStyle(0xAA8060, 1); g.fillRect(2, 2, W-4, 3);
  g.fillStyle(COLORS.TABLE_LEG, 1); g.fillRect(2, H-12, W-4, 6);
  [[6, H-6], [W-10, H-6]].forEach(([x, y]) => {
    g.fillStyle(COLORS.TABLE_LEG, 1); g.fillRect(x, y, 6, 6);
  });
  gen(scene, g, 'obj_table', W, H);
}

export function createGroupTableTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 76, H = 44;
  g.fillStyle(COLORS.TABLE_TOP, 1); g.fillRoundedRect(2, 2, W-4, H-12, 4);
  g.fillStyle(0x8B6845, 1);
  [14, 28, 44, 58].forEach(x => g.fillRect(x, 4, 2, H - 16));
  g.fillStyle(0xAA8060, 1); g.fillRect(2, 2, W-4, 3);
  g.fillStyle(COLORS.TABLE_LEG, 1); g.fillRect(2, H-12, W-4, 6);
  [[6, H-6], [W-10, H-6]].forEach(([x, y]) => {
    g.fillStyle(COLORS.TABLE_LEG, 1); g.fillRect(x, y, 6, 6);
  });
  gen(scene, g, 'obj_table_group', W, H);
}

export function createChairTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 22, H = 22;
  g.fillStyle(COLORS.CHAIR_TOP, 1); g.fillRoundedRect(2, 4, W-4, H-8, 3);
  g.fillStyle(0xC09070, 1); g.fillRoundedRect(4, 6, W-8, 6, 2);
  [[2,H-6],[W-6,H-6]].forEach(([x,y]) => {
    g.fillStyle(COLORS.CHAIR_LEG, 1); g.fillRect(x, y, 4, 6);
  });
  gen(scene, g, 'obj_chair', W, H);
}

export function createCoffeeMachineTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  g.fillStyle(0x444455, 1); g.fillRoundedRect(2, 4, W-4, H-8, 3);
  g.fillStyle(0x222233, 1); g.fillRoundedRect(6, 8, W-12, H-20, 2);
  g.fillStyle(COLORS.ASTRONAUT_VISOR, 1); g.fillRect(8, 10, W-16, 5);
  g.fillStyle(0xCC3333, 1); g.fillCircle(W-7, 8, 3);
  g.fillStyle(0x33CC33, 1); g.fillCircle(W-7, 16, 2);
  g.fillStyle(0x888899, 1); g.fillRect(W/2-3, H-8, 6, 4);
  gen(scene, g, 'obj_coffee_machine', W, H);
}

export function createStoveTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  g.fillStyle(0x334444, 1); g.fillRoundedRect(2, 2, W-4, H-4, 3);
  [[10,10],[20,10],[10,20],[20,20]].forEach(([cx,cy]) => {
    g.fillStyle(0x222222, 1); g.fillCircle(cx, cy, 5);
    g.fillStyle(0x444444, 1); g.fillCircle(cx, cy, 3);
  });
  gen(scene, g, 'obj_stove', W, H);
}

export function createPrepCounterTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  g.fillStyle(0xDDDDCC, 1); g.fillRoundedRect(2, 2, W-4, H-4, 2);
  g.fillStyle(0xBBBBAA, 1);
  [8,14,20].forEach(x => g.fillRect(x, 6, 2, H-12));
  [8,14,20].forEach(y => g.fillRect(6, y, W-12, 1));
  gen(scene, g, 'obj_prep_counter', W, H);
}

export function createTrashCanTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 26;
  // Lid
  g.fillStyle(0x667755, 1); g.fillRoundedRect(2, 0, W-4, 5, 2);
  g.fillStyle(0x889966, 1); g.fillRect(W/2-2, 0, 4, 3);
  // Can body
  g.fillStyle(0x556644, 1); g.fillRoundedRect(3, 5, W-6, H-7, 2);
  // Ridges
  g.fillStyle(0x445533, 1);
  [10, 15, 20].forEach(y => g.fillRect(3, y, W-6, 1));
  // Trash symbol
  g.fillStyle(0x889966, 1); g.fillRect(8, 8, 4, 8);
  g.fillRect(6, 7, 8, 2);
  gen(scene, g, 'obj_trash_can', W, H);
}

export function createCatToyTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 18, H = 20;
  // Small bouncy ball on a string
  g.fillStyle(0xCCCCCC, 1); g.fillRect(W/2-1, 0, 2, 8); // string
  g.fillStyle(0xFF5555, 1); g.fillCircle(W/2, 14, 6); // ball
  g.fillStyle(0xFF8888, 1); g.fillCircle(W/2-2, 11, 3); // highlight
  // Jingle bell
  g.fillStyle(0xFFCC00, 1); g.fillCircle(W/2, 14, 3);
  g.fillStyle(0xAA8800, 1); g.fillCircle(W/2, 14, 1);
  gen(scene, g, 'obj_cat_toy', W, H);
}

export function createCatTreeTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 30, H = 44;
  // Base
  g.fillStyle(0x885533, 1); g.fillRoundedRect(4, H-8, W-8, 8, 2);
  // Trunk
  g.fillStyle(0x996644, 1); g.fillRect(W/2-3, 16, 6, H-24);
  // Platforms
  g.fillStyle(0xBB8855, 1);
  g.fillRoundedRect(2, H-20, W-4, 6, 2);
  g.fillRoundedRect(4, H-36, W-8, 6, 2);
  // Top platform (cozy)
  g.fillStyle(0x8866AA, 1); g.fillEllipse(W/2, 8, W-6, 12);
  g.fillStyle(0xAA88CC, 1); g.fillEllipse(W/2, 7, W-12, 8);
  // Sisal texture lines
  g.fillStyle(0x886633, 1);
  [20, 24, 28, 32].forEach(y => g.fillRect(W/2-3, y, 6, 1));
  gen(scene, g, 'obj_cat_tree', W, H);
}

export function createCatBedTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 36, H = 28;
  g.fillStyle(0x8866AA, 1); g.fillEllipse(W/2, H/2, W-4, H-4);
  g.fillStyle(0xBB99DD, 1); g.fillEllipse(W/2, H/2+2, W-8, H-8);
  g.fillStyle(0xCCAAEE, 1); g.fillEllipse(W/2-4, H/2-2, 12, 8);
  gen(scene, g, 'obj_cat_bed', W, H);
}

export function createPlantTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 28;
  g.fillStyle(0xCC7744, 1); g.fillRect(4, H-10, W-8, 8);
  g.fillStyle(0xAA5533, 1); g.fillRect(2, H-12, W-4, 3);
  g.fillStyle(0x886633, 1); g.fillRect(4, H-10, W-8, 2);
  g.fillStyle(0x553311, 1); g.fillRect(4, H-12, W-8, 2);
  g.fillStyle(0x3A8C3A, 1);
  g.fillEllipse(W/2, 8, 10, 14);
  g.fillEllipse(W/2-5, 12, 8, 10);
  g.fillEllipse(W/2+5, 11, 8, 10);
  g.fillStyle(0x55BB55, 1);
  g.fillEllipse(W/2, 7, 6, 8);
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
  // Small moon rock
  {
    const g = makeGraphics(scene);
    const W = 24, H = 18;
    g.fillStyle(COLORS.MOON_GRAY, 1); g.fillEllipse(W/2, H/2+2, W-4, H-4);
    g.fillStyle(COLORS.MOON_DARK, 1); g.fillCircle(8, 8, 3); g.fillCircle(16, 12, 2);
    g.fillStyle(COLORS.MOON_LIGHT, 1); g.fillCircle(7, 7, 1); g.fillCircle(15, 11, 1);
    gen(scene, g, 'obj_moon_rock_sm', W, H);
  }
  // Large moon rock
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
  // Pole
  g.fillStyle(0xCCCCDD, 1); g.fillRect(8, 2, 2, H-4);
  // Flag fabric
  g.fillStyle(0xFF4444, 1); g.fillRect(10, 4, W-11, 10);
  g.fillStyle(0xFFFFFF, 1);
  g.fillRect(10, 4, W-11, 3);
  g.fillRect(10, 10, W-11, 4);
  // Star on flag
  g.fillStyle(0xFFDD00, 1);
  g.fillRect(12, 6, 4, 2);
  g.fillRect(13, 5, 2, 4);
  // Base
  g.fillStyle(0xCCCCDD, 1); g.fillRect(4, H-4, 12, 4);
  gen(scene, g, 'obj_moon_flag', W, H);
}

export function createLunarRoverTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 50, H = 28;
  // Body
  g.fillStyle(0x888899, 1); g.fillRoundedRect(8, 6, W-16, H-14, 4);
  // Cockpit window
  g.fillStyle(COLORS.DOME_GLASS, 0.8); g.fillRoundedRect(14, 8, 16, 8, 3);
  g.fillStyle(0x334455, 0.5); g.fillRoundedRect(15, 9, 14, 6, 2);
  // Wheels
  [[4,H-8],[W-12,H-8],[4,H-20],[W-12,H-20]].forEach(([wx,wy]) => {
    g.fillStyle(0x333344, 1); g.fillCircle(wx+4, wy+4, 6);
    g.fillStyle(0x555566, 1); g.fillCircle(wx+4, wy+4, 4);
    g.fillStyle(0x777788, 1); g.fillCircle(wx+4, wy+4, 2);
  });
  // Antenna
  g.fillStyle(0xCCCCDD, 1); g.fillRect(W-10, 0, 2, 8);
  g.fillStyle(0xFF4444, 1); g.fillCircle(W-9, 0, 2);
  // Solar panel
  g.fillStyle(0x334488, 1); g.fillRect(0, 10, 8, 6);
  g.fillStyle(0x4455AA, 1); g.fillRect(1, 11, 6, 4);
  gen(scene, g, 'obj_lunar_rover', W, H);
}

// ─────────────────────────────────────────────
// FOOD ITEM TEXTURES
// ─────────────────────────────────────────────

export function createFoodTextures(scene: Phaser.Scene): void {
  // Moon Mocha
  {
    const g = makeGraphics(scene);
    const W = 20, H = 20;
    g.fillStyle(0xEEDDCC, 1); g.fillRect(4, 6, W-8, H-8);
    g.fillStyle(0x6B3C1F, 1); g.fillRect(5, 7, W-10, 5);
    g.fillStyle(0xEEEEFF, 1); g.fillEllipse(W/2, 7, W-10, 4);
    g.fillStyle(0xCCBBAA, 1); g.fillRect(2, H-4, W-4, 3);
    g.fillStyle(0xEEDDCC, 1); g.fillRect(W-4, 8, 4, 6);
    g.fillStyle(0xCCBBAA, 1); g.fillRect(W-3, 9, 2, 4);
    gen(scene, g, 'food_moon_mocha', W, H);
  }
  // Zero-G Latte
  {
    const g = makeGraphics(scene);
    const W = 18, H = 20;
    g.fillStyle(0xAACCBB, 1); g.fillRoundedRect(3, 4, W-6, H-6, 3);
    g.fillStyle(0xEEEEFF, 1); g.fillRect(5, 5, W-10, 3);
    g.fillStyle(0x336655, 1); g.fillRect(6, 6, 2, 2);
    g.fillStyle(0xCCEEDD, 1); g.fillRect(5, H-8, W-10, 3);
    gen(scene, g, 'food_zerog_latte', W, H);
  }
  // Lunar Pancakes
  {
    const g = makeGraphics(scene);
    const W = 24, H = 18;
    [[0,0xC47A2A],[3,0xD48A3A],[6,0xE49A4A]].forEach(([yOff, col]) => {
      g.fillStyle(col as number, 1);
      g.fillEllipse(W/2, H-4-yOff, W-4, 5);
    });
    g.fillStyle(0xFFDD44, 1); g.fillRect(W/2-3, H-14, 6, 4);
    gen(scene, g, 'food_luna_pancakes', W, H);
  }
  // Stardust Cookies
  {
    const g = makeGraphics(scene);
    const W = 22, H = 18;
    g.fillStyle(0xDDCCBB, 1); g.fillEllipse(W/2, H-3, W-2, 7);
    [[6,10],[12,10],[16,12],[10,6]].forEach(([x,y]) => {
      g.fillStyle(0xCC9944, 1); g.fillCircle(x, y, 4);
      g.fillStyle(0xAA7722, 1); g.fillCircle(x, y, 2);
      g.fillStyle(0xFFFFFF, 0.8); g.fillRect(x-1, y-1, 2, 1);
    });
    gen(scene, g, 'food_star_cookies', W, H);
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
    px(g, 0x333344, sx+5, 2, 6, 4, s);
  } else {
    px(g, 0x000022, sx+5, 2, 5, 4, s);
    px(g, visorColor, sx+5, 2, 5, 3, s);
  }
  px(g, 0xCCCCDD, sx+3, 7, 10, 2, s);
  px(g, suitColor, sx+3, 9, 10, 9, s);
  px(g, 0xCCCCDD, sx+4, 10, 8, 1, s);
  px(g, suitColor, sx+1, 10, 2, 7, s);
  px(g, suitColor, sx+13, 10, 2, 7, s);
  px(g, 0x888899, sx+1, 17, 2, 2, s);
  px(g, 0x888899, sx+13, 17, 2, 2, s);
  px(g, suitColor, sx+4, 18, 4, 5, s);
  px(g, suitColor, sx+8, 18, 4, 5, s);
  px(g, 0x666677, sx+3, 22, 5, 2, s);
  px(g, 0x666677, sx+8, 22, 5, 2, s);
  if (facingDir === 'up') {
    px(g, 0x556677, sx+3, 9, 2, 8, s);
    px(g, 0x556677, sx+11, 9, 2, 8, s);
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

  createCatVariant(scene, 'cat_black', COLORS.CAT_BLACK, COLORS.CAT_BLACK_D,
    [[9,7,4,2]]
  );
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
  // Coin icon
  {
    const g = makeGraphics(scene);
    g.fillStyle(COLORS.UI_GOLD, 1); g.fillCircle(8, 8, 7);
    g.fillStyle(0xCC9900, 1); g.fillCircle(8, 8, 5);
    g.fillStyle(COLORS.UI_GOLD, 1); g.fillRect(6, 5, 4, 6);
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
  // Progress bar background
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x333333, 1); g.fillRect(0, 0, 48, 8);
    g.fillStyle(0x111111, 1); g.fillRect(1, 1, 46, 6);
    gen(scene, g, 'ui_progress_bg', 48, 8);
  }
  // E-key prompt
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xFFEE44, 1); g.fillRoundedRect(0, 0, 18, 18, 3);
    g.fillStyle(0x332200, 1); g.fillRoundedRect(1, 1, 16, 16, 2);
    g.fillStyle(0xFFEE44, 1);
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
    g.fillStyle(0xFFFFFF, 1); g.fillRect(3, 0, 2, 8); g.fillRect(0, 3, 8, 2);
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
}
