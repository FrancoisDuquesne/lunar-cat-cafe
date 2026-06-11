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
  // Warm honey oak — horizontal planks
  g.fillStyle(0xB87020, 1); g.fillRect(0, 0, TILE, TILE);
  // Plank top highlights (cel-shade band)
  g.fillStyle(0xD09038, 1);
  g.fillRect(0, 0, TILE, 3);
  g.fillRect(0, 11, TILE, 3);
  g.fillRect(0, 22, TILE, 3);
  // Plank seam shadows
  g.fillStyle(0x6A3C0C, 1);
  g.fillRect(0, 9, TILE, 2);
  g.fillRect(0, 20, TILE, 2);
  g.fillRect(0, 31, TILE, 1);
  // Subtle grain streaks
  g.fillStyle(0x9A5A14, 0.5);
  g.fillRect(4, 1, 7, 1);
  g.fillRect(18, 12, 9, 1);
  g.fillRect(8, 23, 11, 1);
  gen(scene, g, 'tile_floor', TILE, TILE);
}

export function createFloorIndustrialTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Bare metal plate — cold blue-gray
  g.fillStyle(0x60666E, 1); g.fillRect(0, 0, TILE, TILE);
  // Panel seam lines — large plates
  g.fillStyle(0x48505A, 1);
  g.fillRect(0, 0, TILE, 1);
  g.fillRect(0, 0, 1, TILE);
  // Panel bevel highlight (top-left catch light)
  g.fillStyle(0x7A8088, 0.7);
  g.fillRect(1, 1, TILE-2, 2);
  g.fillRect(1, 1, 2, TILE-2);
  // Corner rivet marks
  g.fillStyle(0x383E46, 1);
  g.fillCircle(5, 5, 1.5);
  g.fillCircle(TILE-5, 5, 1.5);
  g.fillCircle(5, TILE-5, 1.5);
  g.fillCircle(TILE-5, TILE-5, 1.5);
  // Scuff / wear marks
  g.fillStyle(0x505860, 0.55);
  g.fillRect(7, 14, 11, 1);
  g.fillRect(18, 22, 7, 1);
  gen(scene, g, 'tile_floor_industrial', TILE, TILE);
}

export function createFloorDarkTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Slightly cooler oak — vertical planks (parquet variation)
  g.fillStyle(0xA06018, 1); g.fillRect(0, 0, TILE, TILE);
  // Plank top highlights
  g.fillStyle(0xC07830, 1);
  g.fillRect(0, 0, 3, TILE);
  g.fillRect(11, 0, 3, TILE);
  g.fillRect(22, 0, 3, TILE);
  // Plank seam shadows
  g.fillStyle(0x5A3008, 1);
  g.fillRect(9, 0, 2, TILE);
  g.fillRect(20, 0, 2, TILE);
  g.fillRect(31, 0, 1, TILE);
  // Subtle grain
  g.fillStyle(0x884A10, 0.5);
  g.fillRect(1, 5, 1, 8);
  g.fillRect(12, 16, 1, 9);
  g.fillRect(23, 3, 1, 7);
  gen(scene, g, 'tile_floor_dark', TILE, TILE);
}

export function createKitchenFloorTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Industrial cream/gray checkerboard tile
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      g.fillStyle((r + c) % 2 === 0 ? 0xE8E0CC : 0xC8C0A4, 1);
      g.fillRect(c * 16, r * 16, 16, 16);
    }
  }
  // Grout lines
  g.fillStyle(0x787060, 1);
  g.fillRect(0, 15, TILE, 2);
  g.fillRect(15, 0, 2, TILE);
  gen(scene, g, 'tile_kitchen', TILE, TILE);
}

export function createWallTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Riveted industrial habitat panel — dark steel blue-gray
  g.fillStyle(0x4A5060, 1); g.fillRect(0, 0, TILE, TILE);
  // Sunlit top edge highlight
  g.fillStyle(0x6A7888, 1); g.fillRect(0, 0, TILE, 4);
  // Horizontal panel seam at mid-point
  g.fillStyle(0x323844, 1); g.fillRect(0, 15, TILE, 2);
  // Vertical panel seams
  g.fillStyle(0x363C48, 1);
  g.fillRect(10, 0, 1, TILE);
  g.fillRect(21, 0, 1, TILE);
  // Rivets — two rows at panel corners
  const rivets = [
    [4, 4], [13, 4], [24, 4], [28, 4],
    [4, 12], [13, 12], [24, 12], [28, 12],
    [4, 19], [13, 19], [24, 19], [28, 19],
    [4, 28], [13, 28], [24, 28], [28, 28],
  ];
  rivets.forEach(([rx, ry]) => {
    g.fillStyle(0x3A4050, 0.8); g.fillCircle(rx, ry, 2.2); // shadow
    g.fillStyle(0x607080, 1);   g.fillCircle(rx, ry, 1.8); // body
    g.fillStyle(0x9AAABB, 0.7); g.fillCircle(rx - 0.7, ry - 0.7, 0.8); // specular
  });
  // Bottom shadow strip
  g.fillStyle(0x282D38, 1); g.fillRect(0, TILE - 4, TILE, 4);
  // Subtle horizontal brushed-metal sheen
  g.fillStyle(0xFFFFFF, 0.025);
  [2, 6, 17, 21, 25].forEach(y => g.fillRect(0, y, TILE, 1));
  gen(scene, g, 'tile_wall', TILE, TILE);
}

export function createWallWarmTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Warm timber paneling — vertical planks
  g.fillStyle(0x5A3A18, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0x6B4A22, 1); g.fillRect(0, 0, 10, TILE);
  g.fillStyle(0x612E10, 0.6); g.fillRect(10, 0, 2, TILE); // seam shadow
  g.fillStyle(0x603818, 1); g.fillRect(12, 0, 9, TILE);
  g.fillStyle(0x612E10, 0.6); g.fillRect(21, 0, 2, TILE);
  g.fillStyle(0x6B4A22, 1); g.fillRect(23, 0, 9, TILE);
  // Top decorative trim
  g.fillStyle(0x8A6030, 1); g.fillRect(0, 0, TILE, 4);
  g.fillStyle(0xBB8840, 0.5); g.fillRect(0, 0, TILE, 1);
  g.fillStyle(0x6A4820, 0.9); g.fillRect(0, 4, TILE, 1);
  // Bottom shadow strip
  g.fillStyle(0x3A1E08, 1); g.fillRect(0, TILE - 3, TILE, 3);
  // Subtle grain lines
  g.fillStyle(0xFFFFFF, 0.05);
  [2, 6, 13, 18, 25].forEach(y => g.fillRect(0, y, TILE, 1));
  gen(scene, g, 'tile_wall_warm', TILE, TILE);
}

export function createWindowTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Deep space sky — very dark navy
  g.fillStyle(0x030812, 1); g.fillRect(0, 0, TILE, TILE);
  // Stars
  g.fillStyle(0xFFFFFF, 1);
  [[5, 3], [11, 8], [19, 2], [3, 12], [28, 4], [15, 14], [23, 9], [6, 18]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
  g.fillStyle(0xFFEECC, 1);
  [[14, 6], [7, 10], [24, 13]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
  g.fillStyle(0xCCDDFF, 0.9);
  [[22, 3], [8, 15], [27, 11]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
  g.fillStyle(0xFFAA66, 0.95); g.fillRect(17, 5, 2, 2);
  // Faint Earth glow in upper right of window
  g.fillStyle(0x2266AA, 0.30); g.fillCircle(26, 5, 5);
  g.fillStyle(0x3388CC, 0.20); g.fillCircle(26, 5, 7);
  g.fillStyle(0x44AACC, 0.12); g.fillCircle(26, 5, 9);
  // Nebula haze
  g.fillStyle(0x221155, 0.10); g.fillRect(3, 3, TILE - 6, 16);
  // Atmospheric glow above horizon
  g.fillStyle(0x8899EE, 0.40); g.fillRect(0, 19, TILE, 1);
  g.fillStyle(0x5577CC, 0.28); g.fillRect(0, 20, TILE, 1);
  // Lunar horizon — cool blue-gray matching new moon tile
  g.fillStyle(0x8090A0, 0.90); g.fillRect(0, 21, TILE, 1);
  // Regolith — cool blue-gray
  g.fillStyle(0x6A7080, 1); g.fillRect(0, 22, TILE, 10);
  g.fillStyle(0x585E68, 1); g.fillRect(0, 27, TILE, 5);
  g.fillStyle(0x40464E, 0.60); g.fillRect(0, 30, TILE, 2);
  // Surface craters (cool tones)
  g.fillStyle(0x444858, 0.9); g.fillCircle(21, 27, 3);
  g.fillStyle(0x9AACB8, 0.6); g.fillCircle(20, 26, 1);
  g.fillStyle(0x444858, 0.7); g.fillCircle(8, 29, 2);
  // Metal frame
  g.fillStyle(0x4E5668, 1);
  g.fillRect(0, 0, TILE, 3); g.fillRect(0, TILE - 3, TILE, 3);
  g.fillRect(0, 0, 3, TILE); g.fillRect(TILE - 3, 0, 3, TILE);
  g.fillStyle(0x282E38, 1);
  g.fillRect(3, 3, TILE - 6, 1); g.fillRect(3, 3, 1, TILE - 6);
  g.fillStyle(0x7A8898, 0.85); g.fillRect(0, 0, TILE, 1);
  // Glass shimmer
  g.fillStyle(0xCCEEFF, 0.18); g.fillRect(3, 3, 4, TILE - 6);
  gen(scene, g, 'tile_window', TILE, TILE);
}

export function createCounterTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Brushed stainless steel counter
  g.fillStyle(0x5A6470, 1); g.fillRect(0, 0, TILE, TILE);
  // Brushed highlight band
  g.fillStyle(0x7A8898, 1); g.fillRect(0, 0, TILE, 5);
  g.fillStyle(0x6A7888, 1); g.fillRect(0, 5, TILE, 4);
  // Horizontal brush streaks
  g.fillStyle(0xFFFFFF, 0.04);
  [1, 3, 6, 9, 12, 15, 18, 22, 26].forEach(y => g.fillRect(0, y, TILE, 1));
  // Side shadow
  g.fillStyle(0x383E48, 1);
  g.fillRect(0, TILE - 5, TILE, 5);
  g.fillRect(0, 0, 2, TILE);
  gen(scene, g, 'tile_counter', TILE, TILE);
}

export function createSpaceTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(0x030810, 1); g.fillRect(0, 0, TILE, TILE);
  // White pin-stars
  g.fillStyle(0xFFFFFF, 1);
  [[5, 5], [12, 20], [22, 8], [28, 25], [3, 28], [18, 14], [9, 3], [25, 18], [15, 6], [7, 26], [29, 9], [1, 14]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
  // Warm yellow bright stars
  g.fillStyle(0xFFEECC, 0.95);
  [[7, 12], [22, 6], [13, 22]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
  // Blue-white stars
  g.fillStyle(0xCCDDFF, 0.9);
  [[17, 16], [4, 9], [26, 3]].forEach(([x, y]) => g.fillRect(x, y, 1, 1));
  // Orange-red star
  g.fillStyle(0xFFAA66, 0.9); g.fillRect(20, 28, 2, 2);
  // Faint nebula haze
  g.fillStyle(0x221155, 0.10); g.fillRect(6, 4, 18, 14);
  gen(scene, g, 'tile_space', TILE, TILE);
}

export function createMoonTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Lunar regolith — cool blue-gray under starlight
  g.fillStyle(0x6A7080, 1); g.fillRect(0, 0, TILE, TILE);
  // Subtle directional texture (distant earthlight from upper-left)
  g.fillStyle(0x7A8090, 0.7); g.fillRect(0, 0, TILE, 8);   // lit top band
  g.fillStyle(0x50585E, 0.5); g.fillRect(0, 24, TILE, 8);   // deep shadow bottom
  // Craters with cool blue-shadow lighting
  const crats = [[8, 8, 5], [22, 18, 4], [4, 22, 3], [26, 6, 3]];
  crats.forEach(([cx, cy, r]) => {
    g.fillStyle(0x444858, 0.9); g.fillCircle(cx, cy, r);              // crater floor
    g.fillStyle(0x9AACB8, 0.6); g.fillCircle(cx - r * 0.5, cy - r * 0.5, r * 0.5); // earthlit rim
    g.fillStyle(0x303440, 0.6); g.fillCircle(cx + r * 0.4, cy + r * 0.4, r * 0.4); // shadow rim
  });
  // Faint blue-tinted dust
  g.fillStyle(0x8090A0, 0.35);
  [[13, 4], [20, 12], [7, 19], [28, 28], [16, 28]].forEach(([x, y]) => g.fillRect(x, y, 2, 1));
  gen(scene, g, 'tile_moon', TILE, TILE);
}

export function createRegolithTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  // Deeper lunar surface — slightly more textured, distant terrain feel
  g.fillStyle(0xB8B4A0, 1); g.fillRect(0, 0, TILE, TILE);
  g.fillStyle(0xC8C4B0, 0.4); g.fillRect(0, 0, TILE, 10); // lighter at horizon
  g.fillStyle(0xA8A494, 0.5); g.fillRect(0, 22, TILE, 10); // darker at base
  // Tire track impressions (faint parallel lines)
  g.fillStyle(0x909080, 0.35);
  [13, 18].forEach(x => {
    g.fillRect(x, 0, 2, TILE);
  });
  // Distant craters (smaller, flatter)
  [[6, 10, 4], [24, 20, 3], [15, 6, 2], [28, 12, 3]].forEach(([cx, cy, r]) => {
    g.fillStyle(0x808070, 0.6); g.fillCircle(cx, cy, r);
    g.fillStyle(0xD0CCB8, 0.4); g.fillCircle(cx - r * 0.4, cy - r * 0.4, r * 0.35);
  });
  // Scattered pebbles
  g.fillStyle(0x989080, 0.7);
  [[4, 25], [10, 14], [21, 7], [27, 28]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
  gen(scene, g, 'tile_regolith', TILE, TILE);
}

export function createDomeTile(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  g.fillStyle(0x060B18, 1); g.fillRect(0, 0, TILE, TILE);
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
  // Drop shadow
  g.fillStyle(0x000000, 0.20); g.fillEllipse(27, 22, 46, 18);
  // Table top — ivory marble with warm tint
  g.fillStyle(0xEFE4CC, 1); g.fillEllipse(26, 16, 46, 24);
  // Marble pattern — subtle gray veins
  g.lineStyle(1, 0xC8BAA0, 0.55);
  g.beginPath(); g.moveTo(12, 12); g.lineTo(24, 20); g.lineTo(20, 26); g.strokePath();
  g.beginPath(); g.moveTo(32, 8); g.lineTo(42, 18); g.strokePath();
  g.beginPath(); g.moveTo(16, 21); g.lineTo(30, 14); g.strokePath();
  // Highlight centre
  g.fillStyle(0xFAF3E0, 0.65); g.fillEllipse(21, 13, 18, 10);
  // Rim edge stroke
  g.lineStyle(2, 0xA89070, 1); g.strokeEllipse(26, 16, 46, 24);
  // Apron (side of table)
  g.fillStyle(0xC4A070, 1); g.fillRoundedRect(5, 25, 42, 8, 3);
  g.fillStyle(0xD8B880, 0.55); g.fillRect(5, 25, 42, 2);
  g.fillStyle(0x6A5030, 1);    g.fillRect(5, 32, 42, 1);
  // Legs
  g.fillStyle(0x9A7848, 1);
  g.fillRect(9, 33, 7, 10); g.fillRect(36, 33, 7, 10);
  g.lineStyle(2, OUT, 1);
  g.strokeRect(9, 33, 7, 10); g.strokeRect(36, 33, 7, 10);
  gen(scene, g, 'obj_table', W, H);
}

export function createGroupTableTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 76, H = 44;
  // Drop shadow
  g.fillStyle(0x000000, 0.20); g.fillEllipse(39, 22, 70, 18);
  // Table top — ivory marble
  g.fillStyle(0xEFE4CC, 1); g.fillEllipse(38, 16, 70, 24);
  // Marble veins
  g.lineStyle(1, 0xC8BAA0, 0.55);
  g.beginPath(); g.moveTo(12, 12); g.lineTo(30, 20); g.lineTo(24, 26); g.strokePath();
  g.beginPath(); g.moveTo(44, 8); g.lineTo(60, 18); g.strokePath();
  g.beginPath(); g.moveTo(18, 22); g.lineTo(42, 13); g.strokePath();
  g.beginPath(); g.moveTo(52, 20); g.lineTo(66, 14); g.strokePath();
  // Highlight
  g.fillStyle(0xFAF3E0, 0.60); g.fillEllipse(30, 13, 26, 10);
  // Rim
  g.lineStyle(2, 0xA89070, 1); g.strokeEllipse(38, 16, 70, 24);
  // Apron
  g.fillStyle(0xC4A070, 1); g.fillRoundedRect(5, 25, W - 10, 8, 3);
  g.fillStyle(0xD8B880, 0.55); g.fillRect(5, 25, W - 10, 2);
  g.fillStyle(0x6A5030, 1);    g.fillRect(5, 32, W - 10, 1);
  // Legs
  g.fillStyle(0x9A7848, 1);
  g.fillRect(9, 33, 7, 10); g.fillRect(W - 16, 33, 7, 10);
  g.lineStyle(2, OUT, 1);
  g.strokeRect(9, 33, 7, 10); g.strokeRect(W - 16, 33, 7, 10);
  gen(scene, g, 'obj_table_group', W, H);
}

export function createChairTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 22, H = 22;
  // Red cushion seat
  g.fillStyle(0xD84040, 1); g.fillRoundedRect(2, 4, W - 4, H - 10, 4);
  g.fillStyle(0xF06060, 1); g.fillRoundedRect(4, 5, W - 8, 6, 3);
  g.fillStyle(0xA82020, 1); g.fillCircle(W / 2, 9, 3);
  g.fillStyle(0xF08080, 0.6); g.fillCircle(W / 2 - 1, 8, 1);
  // Gold legs
  g.fillStyle(0xD4A820, 1);
  [[2, H - 6], [W - 6, H - 6]].forEach(([x, y]) => g.fillRect(x, y, 4, 6));
  ol(g, 2); g.strokeRoundedRect(2, 4, W - 4, H - 10, 4);
  gen(scene, g, 'obj_chair', W, H);
}

export function createCoffeeMachineTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  g.fillStyle(0x1A1A2A, 1); g.fillRoundedRect(2, 4, W - 4, H - 8, 4);
  g.fillStyle(0x2A2A3A, 1); g.fillRect(4, 6, 8, H - 14);
  // Screen
  g.fillStyle(0x00AADD, 1); g.fillRoundedRect(6, 8, W - 12, 7, 2);
  g.fillStyle(0x88DDFF, 0.5); g.fillRect(7, 9, W - 14, 2);
  // Status dot
  g.fillStyle(0x44FF88, 1); g.fillCircle(W - 7, 8, 3);
  g.fillStyle(0xAAFFCC, 0.7); g.fillCircle(W - 8, 7, 1);
  // Steel spout
  g.fillStyle(0x7A8898, 1); g.fillRoundedRect(W / 2 - 3, H - 8, 6, 5, 2);
  g.fillStyle(0xAABBCC, 0.8); g.fillRect(W / 2 - 2, H - 7, 4, 2);
  // Steel trim
  g.fillStyle(0x6A7888, 1);
  g.fillRect(2, 4, W - 4, 2);
  g.fillRect(2, H - 6, W - 4, 2);
  ol(g, 2); g.strokeRoundedRect(2, 4, W - 4, H - 8, 4);
  gen(scene, g, 'obj_coffee_machine', W, H);
}

export function createStoveTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  g.fillStyle(0x1A1C28, 1); g.fillRoundedRect(2, 2, W - 4, H - 4, 4);
  g.fillStyle(0x2A2C3A, 1); g.fillRect(4, 4, 8, H - 10);
  [[10, 10], [20, 10], [10, 20], [20, 20]].forEach(([cx, cy]) => {
    g.fillStyle(0xFF5500, 0.9); g.fillCircle(cx, cy, 5);
    g.fillStyle(0xFF8800, 1); g.fillCircle(cx, cy, 3);
    g.fillStyle(0xFFCC00, 1); g.fillCircle(cx, cy, 1);
    ol(g, 1); g.strokeCircle(cx, cy, 5);
  });
  g.fillStyle(0x6A7888, 1); g.fillRect(2, 2, W - 4, 2);
  ol(g, 2); g.strokeRoundedRect(2, 2, W - 4, H - 4, 4);
  gen(scene, g, 'obj_stove', W, H);
}

export function createPrepCounterTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  g.fillStyle(0xF0EAD8, 1); g.fillRoundedRect(2, 2, W - 4, H - 4, 3);
  g.fillStyle(0xFFFFEE, 1); g.fillRect(4, 4, W - 8, 5);
  g.fillStyle(0xC8C0A0, 1);
  [10, 16, 22].forEach(x => g.fillRect(x, 4, 1, H - 8));
  [10, 16, 22].forEach(y => g.fillRect(4, y, W - 8, 1));
  g.fillStyle(0x6A7888, 1); g.fillRect(2, 2, W - 4, 2); g.fillRect(2, H - 4, W - 4, 2);
  ol(g, 2); g.strokeRoundedRect(2, 2, W - 4, H - 4, 3);
  gen(scene, g, 'obj_prep_counter', W, H);
}

export function createGriddleTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  g.fillStyle(0x2A1A0A, 1); g.fillRoundedRect(2, 6, W - 4, H - 10, 3);
  g.fillStyle(0x8B3A10, 1); g.fillRoundedRect(4, 8, W - 8, H - 14, 2);
  g.fillStyle(0xB04A18, 1); g.fillRoundedRect(5, 9, W - 10, H - 16, 2);
  g.lineStyle(1, 0xFF7722, 0.5);
  g.strokeCircle(10, 14, 4); g.strokeCircle(18, 14, 4);
  g.fillStyle(0x1A0A00, 1); g.fillRoundedRect(10, 2, 8, 5, 2);
  g.fillStyle(0x6A7888, 1); g.fillRect(11, 3, 6, 1);
  g.fillStyle(0x6A7888, 1); g.fillRect(2, 6, W - 4, 2);
  ol(g, 2); g.strokeRoundedRect(2, 6, W - 4, H - 10, 3);
  gen(scene, g, 'obj_griddle', W, H);
}

export function createMixerTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  g.fillStyle(0xC0C8D8, 1); g.fillRoundedRect(4, 16, W - 8, 8, 3);
  g.fillStyle(0xD8E0F0, 1); g.fillRect(5, 17, W - 10, 3);
  g.fillStyle(0x8090A8, 1); g.fillRoundedRect(11, 8, 6, 10, 2);
  g.fillStyle(0x9AAABB, 1); g.fillRect(12, 9, 3, 7);
  g.fillStyle(0x6A8090, 1); g.fillRoundedRect(8, 4, 12, 7, 3);
  g.fillStyle(0x7A90A0, 1); g.fillRect(9, 5, 10, 3);
  g.fillStyle(0x6A7888, 1); g.fillRoundedRect(13, 14, 2, 5, 1);
  g.lineStyle(1, 0x6A7888, 1);
  g.lineBetween(12, 16, 15, 19); g.lineBetween(15, 16, 12, 19);
  g.fillStyle(0x6A7888, 1); g.fillRect(4, 16, W - 8, 2);
  ol(g, 2); g.strokeRoundedRect(4, 16, W - 8, 8, 3);
  gen(scene, g, 'obj_mixer', W, H);
}

export function createOvenTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 28, H = 28;
  g.fillStyle(0x2A2A3A, 1); g.fillRoundedRect(2, 3, W - 4, H - 6, 3);
  g.fillStyle(0x3A3A4A, 1); g.fillRect(4, 5, 6, H - 12);
  g.fillStyle(0x1A1A28, 1); g.fillRoundedRect(5, 6, W - 10, H - 12, 2);
  g.fillStyle(0x3A1800, 1); g.fillRoundedRect(7, 8, W - 14, H - 16, 2);
  g.fillStyle(0xFF6600, 0.35); g.fillRoundedRect(7, 8, W - 14, H - 16, 2);
  g.fillStyle(0xFF8800, 0.2); g.fillRect(8, 9, W - 18, 3);
  g.fillStyle(0x6A7888, 1); g.fillRoundedRect(8, H - 6, W - 16, 3, 1);
  g.fillStyle(0x6A7888, 1);
  [10, 14, 18].forEach(x => g.fillRect(x, 3, 1, 3));
  ol(g, 2); g.strokeRoundedRect(2, 3, W - 4, H - 6, 3);
  gen(scene, g, 'obj_oven', W, H);
}

export function createTrashCanTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 26;
  g.fillStyle(0x1A3A28, 1); g.fillRoundedRect(3, 6, W - 6, H - 8, 3);
  g.fillStyle(0x2A5A40, 1); g.fillRect(5, 8, 6, H - 14);
  g.fillStyle(0x254A34, 1); g.fillRoundedRect(2, 1, W - 4, 6, 2);
  g.fillStyle(0x6A7888, 1); g.fillRoundedRect(W / 2 - 2, 1, 4, 3, 1);
  g.fillStyle(0x2A5A40, 1);
  [11, 16, 21].forEach(y => g.fillRect(3, y, W - 6, 2));
  g.fillStyle(0x3A8A60, 1); g.fillRect(7, 9, 5, 8); g.fillRect(5, 10, 9, 2);
  ol(g, 2); g.strokeRoundedRect(3, 6, W - 6, H - 8, 3);
  g.strokeRoundedRect(2, 1, W - 4, 6, 2);
  gen(scene, g, 'obj_trash_can', W, H);
}

export function createCatToyTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 18, H = 20;
  g.fillStyle(0xCCCCCC, 1); g.fillRect(W / 2 - 1, 0, 2, 8);
  g.fillStyle(0xFF4466, 1); g.fillCircle(W / 2, 14, 6);
  g.fillStyle(0xFF7799, 1); g.fillCircle(W / 2 - 2, 12, 3);
  g.fillStyle(0xFF88AA, 0.7); g.fillCircle(W / 2 - 3, 11, 1);
  g.fillStyle(0xFFDD00, 1); g.fillCircle(W / 2 + 1, 15, 2);
  ol(g, 1); g.strokeCircle(W / 2, 14, 6);
  gen(scene, g, 'obj_cat_toy', W, H);
}

export function createCatTreeTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 30, H = 44;
  g.fillStyle(0xD4A820, 1); g.fillRoundedRect(4, H - 8, W - 8, 8, 2);
  ol(g, 1); g.strokeRoundedRect(4, H - 8, W - 8, 8, 2);
  g.fillStyle(0x5A3010, 1); g.fillRect(W / 2 - 3, 16, 6, H - 24);
  g.fillStyle(0x7A4818, 1); g.fillRect(W / 2 - 1, 16, 2, H - 24);
  g.fillStyle(0x5A3010, 1); g.fillRoundedRect(2, H - 20, W - 4, 6, 2);
  g.fillStyle(0xD84040, 1); g.fillRect(3, H - 19, W - 6, 3);
  g.fillStyle(0xF06060, 0.6); g.fillRect(5, H - 19, W - 10, 2);
  ol(g, 1); g.strokeRoundedRect(2, H - 20, W - 4, 6, 2);
  g.fillStyle(0x5A3010, 1); g.fillRoundedRect(4, H - 36, W - 8, 6, 2);
  g.fillStyle(0xD84040, 1); g.fillRect(5, H - 35, W - 10, 3);
  g.fillStyle(0xF06060, 0.6); g.fillRect(7, H - 35, W - 14, 2);
  ol(g, 1); g.strokeRoundedRect(4, H - 36, W - 8, 6, 2);
  g.fillStyle(0x6A28AA, 1); g.fillEllipse(W / 2, 8, W - 6, 12);
  g.fillStyle(0x9A50D0, 1); g.fillEllipse(W / 2, 7, W - 12, 8);
  g.fillStyle(0xCC88FF, 0.5); g.fillEllipse(W / 2 - 2, 5, 8, 4);
  ol(g, 1); g.strokeEllipse(W / 2, 8, W - 6, 12);
  gen(scene, g, 'obj_cat_tree', W, H);
}

export function createCatBedTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 36, H = 28;
  g.fillStyle(0x5A20A0, 1); g.fillEllipse(W / 2, H / 2, W - 4, H - 4);
  g.fillStyle(0xD84040, 1); g.fillEllipse(W / 2, H / 2 + 2, W - 8, H - 8);
  g.fillStyle(0xF06060, 1); g.fillEllipse(W / 2 - 4, H / 2, 10, 7);
  ol(g, 2); g.strokeEllipse(W / 2, H / 2, W - 4, H - 4);
  gen(scene, g, 'obj_cat_bed', W, H);
}

export function createPlantTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 28;
  g.fillStyle(0x6A7888, 1); g.fillRoundedRect(4, H - 10, W - 8, 9, 2);
  g.fillStyle(0x8A98A8, 1); g.fillRect(5, H - 9, W - 10, 3);
  g.fillStyle(0x4A5868, 1); g.fillRect(2, H - 12, W - 4, 3);
  ol(g, 1); g.strokeRoundedRect(4, H - 10, W - 8, 9, 2);
  g.fillStyle(0x228830, 1); g.fillEllipse(W / 2, 8, 12, 16);
  g.fillStyle(0x228830, 1); g.fillEllipse(W / 2 - 5, 12, 9, 11);
  g.fillStyle(0x228830, 1); g.fillEllipse(W / 2 + 5, 11, 9, 11);
  g.fillStyle(0x44CC55, 1); g.fillEllipse(W / 2 - 1, 6, 6, 8);
  g.fillStyle(0x88FF99, 0.5); g.fillEllipse(W / 2 - 2, 5, 4, 5);
  ol(g, 2); g.strokeEllipse(W / 2, 8, 12, 16);
  gen(scene, g, 'obj_plant', W, H);
}

export function createFoodBowlTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 14;
  g.fillStyle(0x8AACCC, 1); g.fillEllipse(W / 2, H / 2, W, H);
  g.fillStyle(0xBBDDEE, 1); g.fillEllipse(W / 2 - 1, H / 2 - 1, W - 4, H - 6);
  g.fillStyle(0xFF9944, 1); g.fillEllipse(W / 2, H / 2 - 1, W - 8, H - 8);
  g.fillStyle(0xFFCC88, 0.7); g.fillEllipse(W / 2 - 2, H / 2 - 2, 5, 3);
  ol(g, 1); g.strokeEllipse(W / 2, H / 2, W, H);
  gen(scene, g, 'obj_food_bowl', W, H);
}

export function createMoonRockTexture(scene: Phaser.Scene): void {
  {
    const g = makeGraphics(scene);
    const W = 24, H = 18;
    g.fillStyle(0xC0BCA8, 1); g.fillEllipse(W / 2, H / 2 + 2, W - 4, H - 4);
    g.fillStyle(0xA8A494, 1); g.fillRect(0, H / 2 + 2, W, H / 2);
    g.fillStyle(0x888070, 1); g.fillCircle(8, 8, 3); g.fillCircle(16, 12, 2);
    g.fillStyle(0xD8D4C0, 0.8); g.fillCircle(7, 7, 1); g.fillCircle(15, 11, 1);
    ol(g, 2); g.strokeEllipse(W / 2, H / 2 + 2, W - 4, H - 4);
    gen(scene, g, 'obj_moon_rock_sm', W, H);
  }
  {
    const g = makeGraphics(scene);
    const W = 40, H = 30;
    g.fillStyle(0xC0BCA8, 1); g.fillEllipse(W / 2, H / 2 + 3, W - 6, H - 6);
    g.fillStyle(0xA8A494, 1); g.fillRect(0, H / 2 + 3, W, H / 2);
    g.fillStyle(0x888070, 1);
    [[10, 10, 5], [24, 18, 3], [8, 20, 4]].forEach(([cx, cy, r]) => g.fillCircle(cx, cy, r));
    g.fillStyle(0xD8D4C0, 0.8);
    [[9, 9, 2], [23, 17, 1], [7, 19, 2]].forEach(([cx, cy, r]) => g.fillCircle(cx, cy, r));
    ol(g, 2); g.strokeEllipse(W / 2, H / 2 + 3, W - 6, H - 6);
    gen(scene, g, 'obj_moon_rock_lg', W, H);
  }
}

export function createMoonFlagTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 36;
  g.fillStyle(0x8A9098, 1); g.fillRect(8, 2, 3, H - 6);
  g.fillStyle(0xAABBCC, 0.6); g.fillRect(9, 2, 1, H - 6);
  g.fillStyle(0xE83030, 1); g.fillRect(11, 4, W - 12, 10);
  g.fillStyle(0xFF6060, 0.7); g.fillRect(11, 4, W - 12, 4);
  g.fillStyle(0xFFFFFF, 1);
  g.fillRect(11, 4, W - 12, 3);
  g.fillRect(11, 10, W - 12, 4);
  g.fillStyle(0xFFDD00, 1);
  g.fillRect(13, 6, 4, 2); g.fillRect(14, 5, 2, 4);
  g.fillStyle(0x6A7888, 1); g.fillRoundedRect(3, H - 5, 14, 5, 2);
  ol(g, 1); g.strokeRect(11, 4, W - 12, 10);
  gen(scene, g, 'obj_moon_flag', W, H);
}

export function createLunarRoverTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 50, H = 28;
  g.fillStyle(0x8A8898, 1); g.fillRoundedRect(8, 6, W - 16, H - 14, 4);
  g.fillStyle(0xAAAAAA, 0.5); g.fillRect(10, 8, 10, 4);
  g.fillStyle(0x2A5A7A, 0.9); g.fillRoundedRect(14, 8, 16, 8, 3);
  g.fillStyle(0x5A9ABB, 0.7); g.fillRect(15, 9, 7, 3);
  [[4, H - 8], [W - 12, H - 8], [4, H - 20], [W - 12, H - 20]].forEach(([wx, wy]) => {
    g.fillStyle(0x333344, 1); g.fillCircle(wx + 4, wy + 4, 6);
    g.fillStyle(0x555566, 1); g.fillCircle(wx + 4, wy + 4, 4);
    g.fillStyle(0x8888AA, 1); g.fillCircle(wx + 4, wy + 4, 2);
    ol(g, 1); g.strokeCircle(wx + 4, wy + 4, 6);
  });
  g.fillStyle(0x8A9098, 1); g.fillRect(W - 10, 0, 2, 8);
  g.fillStyle(0xFF4444, 1); g.fillCircle(W - 9, 0, 2);
  g.fillStyle(0x2244AA, 1); g.fillRect(0, 10, 8, 6);
  g.fillStyle(0x4466CC, 0.8); g.fillRect(1, 11, 6, 4);
  ol(g, 2); g.strokeRoundedRect(8, 6, W - 16, H - 14, 4);
  gen(scene, g, 'obj_lunar_rover', W, H);
}

export function createBarStoolTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 20, H = 28;
  g.fillStyle(0xCC3344, 1); g.fillCircle(10, 8, 8);
  g.fillStyle(0xFF6677, 1); g.fillEllipse(8, 6, 8, 5);
  ol(g, 2); g.strokeCircle(10, 8, 8);
  g.fillStyle(0x7A8898, 1); g.fillRect(8, 15, 4, 8);
  g.fillStyle(0x9AAABB, 1); g.fillRect(9, 15, 2, 8);
  g.fillStyle(0x5A6878, 1); g.fillRect(4, 22, 12, 4);
  g.fillStyle(0x7A8898, 1); g.fillRect(5, 22, 10, 2);
  ol(g, 1); g.strokeRect(4, 22, 12, 4);
  gen(scene, g, 'obj_bar_stool', W, H);
}

export function createQueuePoleTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 10, H = 34;
  g.fillStyle(0x7A8090, 1); g.fillRoundedRect(1, 28, 8, 5, 2);
  g.fillStyle(0x9AAABB, 1); g.fillRect(3, 4, 4, 26);
  g.fillStyle(0xBBCCDD, 1); g.fillRect(4, 4, 2, 26);
  g.fillStyle(0x8898AA, 1); g.fillCircle(5, 4, 4);
  g.fillStyle(0xCCDDEE, 1); g.fillCircle(4, 3, 2);
  gen(scene, g, 'obj_queue_pole', W, H);
}

// ─────────────────────────────────────────────
// EXTERIOR OBJECT TEXTURES
// ─────────────────────────────────────────────

export function createAntennaTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 22, H = 46;
  // Base anchor
  g.fillStyle(0x555566, 1); g.fillRoundedRect(6, H - 7, 10, 7, 2);
  g.fillStyle(0x7A7A8A, 0.7); g.fillRect(7, H - 6, 8, 3);
  ol(g, 2); g.strokeRoundedRect(6, H - 7, 10, 7, 2);
  // Support struts
  g.fillStyle(0x5A5A6A, 1);
  g.fillRect(5, H - 7, 2, 1);  // strut anchor left
  g.fillRect(15, H - 7, 2, 1); // strut anchor right
  g.lineStyle(1, 0x6A6A7A, 1);
  g.lineBetween(11, 14, 5, 32);
  g.lineBetween(11, 14, 17, 32);
  g.fillStyle(0x5A5A6A, 1); g.fillRect(5, 31, 12, 2);
  // Main pole
  g.fillStyle(0x7A7A88, 1); g.fillRect(9, 10, 4, H - 17);
  g.fillStyle(0x9A9AA8, 1); g.fillRect(10, 10, 2, H - 17);
  // Dish
  g.fillStyle(0xA8A8B8, 1); g.fillEllipse(11, 10, 18, 9);
  g.fillStyle(0xC8C8D8, 0.8); g.fillEllipse(10, 9, 12, 5);
  ol(g, 2); g.strokeEllipse(11, 10, 18, 9);
  // Transponder dot
  g.fillStyle(0xF0C018, 1); g.fillCircle(11, 6, 2);
  g.fillStyle(0xFFE050, 0.8); g.fillCircle(10, 5, 1);
  // Signal warning light
  g.fillStyle(0xFF3300, 1); g.fillCircle(11, 2, 2);
  g.fillStyle(0xFF9966, 0.6); g.fillCircle(11, 2, 3);
  gen(scene, g, 'obj_antenna', W, H);
}

export function createCargoCrateTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 42, H = 30;
  // Main body — industrial steel
  g.fillStyle(0x4A5868, 1); g.fillRoundedRect(2, 3, W - 4, H - 6, 3);
  // Top face highlight
  g.fillStyle(0x6A7888, 1); g.fillRoundedRect(4, 4, W - 8, 8, 2);
  g.fillStyle(0x8898A8, 0.5); g.fillRect(5, 5, W - 10, 3);
  // Panel seam lines
  g.fillStyle(0x323A48, 1);
  g.fillRect(W / 2, 3, 2, H - 6);
  g.fillRect(2, H / 2 - 1, W - 4, 2);
  // Hazard corner strips (yellow)
  g.fillStyle(0xDDB830, 1);
  g.fillRect(2, 3, 6, 3); g.fillRect(W - 8, 3, 6, 3);
  g.fillRect(2, H - 6, 6, 3); g.fillRect(W - 8, H - 6, 6, 3);
  // Hazard diagonal on left face
  g.fillStyle(0xDDB830, 0.35);
  for (let i = 0; i < 3; i++) {
    g.fillRect(2 + i * 5, 3, 3, H - 6);
  }
  // Stencil text hint (white bars)
  g.fillStyle(0xFFFFFF, 0.12);
  g.fillRect(14, 8, 13, 3); g.fillRect(14, 13, 13, 2); g.fillRect(14, 18, 13, 3);
  // Lift handles
  g.fillStyle(0x7A8898, 1);
  g.fillRoundedRect(8, 1, 5, 3, 1);
  g.fillRoundedRect(W - 13, 1, 5, 3, 1);
  ol(g, 2); g.strokeRoundedRect(2, 3, W - 4, H - 6, 3);
  gen(scene, g, 'obj_cargo_crate', W, H);
}

export function createSolarPanelTexture(scene: Phaser.Scene): void {
  const g = makeGraphics(scene);
  const W = 50, H = 26;
  // Mounting base
  g.fillStyle(0x5A6070, 1); g.fillRoundedRect(0, H - 7, W, 7, 2);
  g.fillStyle(0x7A8088, 0.7); g.fillRect(2, H - 6, W - 4, 3);
  // Support arm (center)
  g.fillStyle(0x4A5060, 1); g.fillRect(W / 2 - 2, 8, 4, H - 10);
  g.fillStyle(0x6A7080, 1); g.fillRect(W / 2 - 1, 9, 2, H - 12);
  // Left panel body
  g.fillStyle(0x18243A, 1); g.fillRoundedRect(1, 1, W / 2 - 5, H - 12, 2);
  // Right panel body
  g.fillStyle(0x18243A, 1); g.fillRoundedRect(W / 2 + 4, 1, W / 2 - 5, H - 12, 2);
  // Solar cell grid — left
  g.fillStyle(0x243450, 1);
  for (let c = 0; c <= 4; c++) g.fillRect(1 + c * 5, 1, 1, H - 12);
  for (let r = 0; r <= 2; r++) g.fillRect(1, 1 + r * 5, W / 2 - 5, 1);
  // Solar cell grid — right
  for (let c = 0; c <= 4; c++) g.fillRect(W / 2 + 4 + c * 5, 1, 1, H - 12);
  for (let r = 0; r <= 2; r++) g.fillRect(W / 2 + 4, 1 + r * 5, W / 2 - 5, 1);
  // Blue photovoltaic sheen
  g.fillStyle(0x2A4080, 0.4); g.fillRoundedRect(1, 1, W / 2 - 5, H - 12, 2);
  g.fillStyle(0x2A4080, 0.4); g.fillRoundedRect(W / 2 + 4, 1, W / 2 - 5, H - 12, 2);
  // Highlight glint on panels
  g.fillStyle(0x88AAFF, 0.22);
  g.fillRect(2, 2, 4, H - 13);
  g.fillRect(W / 2 + 5, 2, 4, H - 13);
  // Conduit connecting panels to pole
  g.fillStyle(0x4A5060, 1); g.fillRect(W / 2 - 4, H / 2, 8, 3);
  ol(g, 2);
  g.strokeRoundedRect(1, 1, W / 2 - 5, H - 12, 2);
  g.strokeRoundedRect(W / 2 + 4, 1, W / 2 - 5, H - 12, 2);
  gen(scene, g, 'obj_solar_panel', W, H);
}

// ─────────────────────────────────────────────
// FOOD ITEM TEXTURES
// ─────────────────────────────────────────────

export function createFoodTextures(scene: Phaser.Scene): void {
  // Moon Mocha
  {
    const g = makeGraphics(scene);
    const W = 20, H = 20;
    g.fillStyle(0x3A1A08, 1); g.fillRoundedRect(3, 6, W - 6, H - 7, 2);
    g.fillStyle(0x6B3820, 1); g.fillRect(4, 7, W - 8, 4);
    g.fillStyle(0xF0E0B8, 1); g.fillEllipse(W / 2, 8, W - 8, 5);
    g.fillStyle(0xFFCC88, 0.8); g.fillEllipse(W / 2 - 2, 7, 6, 3);
    g.fillStyle(0xD4A020, 1); g.fillRect(W / 2 - 2, 7, 4, 1); g.fillRect(W / 2, 6, 1, 3);
    g.fillStyle(0x6A7888, 1); g.fillRoundedRect(1, H - 4, W - 2, 3, 1);
    g.fillStyle(0x5A2808, 1); g.fillRect(W - 4, 9, 4, 5);
    g.fillStyle(0x7A3A10, 0.7); g.fillRect(W - 3, 10, 2, 3);
    ol(g, 2); g.strokeRoundedRect(3, 6, W - 6, H - 7, 2);
    gen(scene, g, 'food_moon_mocha', W, H);
  }
  // Zero-G Latte
  {
    const g = makeGraphics(scene);
    const W = 18, H = 20;
    g.fillStyle(0x0A2A30, 1); g.fillRoundedRect(3, 4, W - 6, H - 6, 4);
    g.fillStyle(0x00BBCC, 1); g.fillRect(5, 5, W - 10, 4);
    g.fillStyle(0x44EEFF, 0.7); g.fillRect(5, 5, W - 10, 2);
    g.fillStyle(0x005566, 1); g.fillRect(5, 9, W - 10, H - 14);
    g.fillStyle(0x00CCDD, 0.4); g.fillEllipse(W / 2, 8, W - 8, 5);
    ol(g, 2); g.strokeRoundedRect(3, 4, W - 6, H - 6, 4);
    gen(scene, g, 'food_zerog_latte', W, H);
  }
  // Lunar Pancakes
  {
    const g = makeGraphics(scene);
    const W = 24, H = 18;
    [[0, 0xC47828], [3, 0xD48838], [6, 0xE4A848]].forEach(([yOff, col]) => {
      g.fillStyle(col as number, 1);
      g.fillEllipse(W / 2, H - 4 - (yOff as number), W - 4, 5);
      g.fillStyle((col as number) + 0x181808, 0.6);
      g.fillEllipse(W / 2, H - 3 - (yOff as number), W - 6, 2);
      ol(g, 2); g.strokeEllipse(W / 2, H - 4 - (yOff as number), W - 4, 5);
    });
    g.fillStyle(0xFFEE88, 1); g.fillRect(W / 2 - 2, H - 12, 5, 3);
    g.fillStyle(0xCC7700, 1); g.fillRect(W / 2 + 3, H - 12, 2, 5);
    gen(scene, g, 'food_luna_pancakes', W, H);
  }
  // Stardust Cookies
  {
    const g = makeGraphics(scene);
    const W = 22, H = 18;
    g.fillStyle(0x2A1A08, 1); g.fillEllipse(W / 2, H - 3, W - 2, 7);
    g.fillStyle(0x3A2810, 0.7); g.fillEllipse(W / 2, H - 4, W - 4, 4);
    [[6, 9], [12, 9], [16, 11], [9, 5]].forEach(([x, y]) => {
      g.fillStyle(0xCC9944, 1); g.fillCircle(x, y, 4);
      g.fillStyle(0xAA7722, 1); g.fillCircle(x, y, 2);
      g.fillStyle(0xFFDD44, 1); g.fillRect(x - 1, y - 2, 1, 4); g.fillRect(x - 2, y - 1, 4, 1);
      ol(g, 2); g.strokeCircle(x, y, 4);
    });
    gen(scene, g, 'food_star_cookies', W, H);
  }
  // Lunar Fondue
  {
    const g = makeGraphics(scene);
    const W = 22, H = 20;
    g.fillStyle(0x5A3000, 1); g.fillRoundedRect(3, 8, W - 6, H - 10, 2);
    g.fillStyle(0x7A4800, 1); g.fillRect(4, 9, W - 8, 4);
    g.fillStyle(0xF0C020, 1); g.fillEllipse(W / 2, 10, W - 6, 6);
    g.fillStyle(0xFFE060, 0.9); g.fillEllipse(W / 2 - 2, 9, 7, 3);
    g.fillStyle(0xD4A010, 1);
    g.fillRect(5, 13, 2, 4); g.fillRect(15, 13, 2, 4);
    g.fillStyle(0x6A7888, 1); g.fillRect(0, H - 7, 4, 3); g.fillRect(W - 4, H - 7, 4, 3);
    g.fillStyle(0x5A3000, 1); g.fillEllipse(W / 2, H - 2, W - 4, 5);
    ol(g, 2); g.strokeRoundedRect(3, 8, W - 6, H - 10, 2);
    gen(scene, g, 'food_lunar_fondue', W, H);
  }
  // Nebula Risotto
  {
    const g = makeGraphics(scene);
    const W = 24, H = 20;
    g.fillStyle(0x1A0830, 1); g.fillEllipse(W / 2, H - 2, W - 2, 7);
    g.fillStyle(0x7030CC, 1); g.fillEllipse(W / 2, H - 6, W - 6, 8);
    g.fillStyle(0xAA50E0, 0.9); g.fillEllipse(W / 2, H - 8, W - 10, 6);
    g.fillStyle(0xFF88FF, 0.7); g.fillEllipse(W / 2 - 2, H - 9, 7, 4);
    g.fillStyle(0xFFAAFF, 0.5); g.fillCircle(W / 2 + 4, H - 10, 2);
    g.fillStyle(0xFFDD00, 1);
    [[W / 2, 4], [W / 2 - 3, 6], [W / 2 + 4, 5]].forEach(([x, y]) => {
      g.fillRect(x - 0.5, y - 2, 1, 4); g.fillRect(x - 2, y - 0.5, 4, 1);
    });
    ol(g, 2); g.strokeEllipse(W / 2, H - 2, W - 2, 7);
    gen(scene, g, 'food_nebula_risotto', W, H);
  }
  // Gravity Soufflé
  {
    const g = makeGraphics(scene);
    const W = 22, H = 22;
    g.fillStyle(0x4A2E08, 1); g.fillRect(4, H - 6, W - 8, 5);
    g.fillStyle(0x6A7888, 1); g.fillRect(3, H - 7, W - 6, 2);
    ol(g, 2); g.strokeRect(4, H - 6, W - 8, 5);
    g.fillStyle(0xE8A820, 1); g.fillEllipse(W / 2, H - 9, W - 2, 9);
    g.fillStyle(0xFFCC44, 1); g.fillEllipse(W / 2, H - 12, W - 6, 7);
    g.fillStyle(0xFFEE88, 0.9); g.fillEllipse(W / 2 - 1, H - 13, 7, 4);
    ol(g, 2); g.strokeEllipse(W / 2, H - 9, W - 2, 9);
    g.fillStyle(0xFFFFCC, 1);
    [[W / 2, 3], [W / 2 + 4, 5], [W / 2 - 3, 4]].forEach(([x, y]) => {
      g.fillRect(x - 0.5, y - 2, 1, 4); g.fillRect(x - 2, y - 0.5, 4, 1);
    });
    gen(scene, g, 'food_gravity_souffle', W, H);
  }
}

// ─────────────────────────────────────────────
// CHARACTER TEXTURES
// ─────────────────────────────────────────────

// Stylized cel-shaded spacesuit — proportional (not chibi)
function drawSpacesuit(
  g: Phaser.GameObjects.Graphics,
  suitColor: number,
  visorColor: number,
  dir: 'down' | 'up' | 'side'
): void {
  // ── Helmet (rows 0-9) ────────────────────────────────────────────────
  g.fillStyle(suitColor, 1); g.fillCircle(8, 5, 5);
  // Helmet highlight (cel-shade)
  const hlColor = Phaser.Display.Color.IntegerToColor(suitColor);
  const hl = Phaser.Display.Color.GetColor(
    Math.min(255, hlColor.red + 40),
    Math.min(255, hlColor.green + 40),
    Math.min(255, hlColor.blue + 40),
  );
  g.fillStyle(hl, 0.5); g.fillEllipse(6, 3, 7, 4);

  // Visor — horizontal band, not anime oval
  if (dir === 'down') {
    g.fillStyle(visorColor, 1);   g.fillRect(4, 3, 8, 5);
    g.fillStyle(0xFFFFFF, 0.22); g.fillRect(4, 3, 4, 2); // reflection streak
    g.fillStyle(OUT, 0.4);       g.fillRect(4, 7, 8, 1); // visor bottom edge
  } else if (dir === 'up') {
    g.fillStyle(0x111133, 1);     g.fillRect(4, 2, 8, 5);
    g.fillStyle(suitColor, 0.3);  g.fillRect(4, 2, 8, 2);
  } else {
    g.fillStyle(visorColor, 1);   g.fillRect(6, 3, 6, 4);
    g.fillStyle(0xFFFFFF, 0.22); g.fillRect(6, 3, 3, 2);
  }
  ol(g, 2); g.strokeCircle(8, 5, 5);

  // ── Neck collar ring ─────────────────────────────────────────────────
  g.fillStyle(0xC8B050, 1); g.fillRect(3, 10, 10, 2);
  ol(g, 1); g.strokeRect(3, 10, 10, 2);

  // ── Torso/body (rows 12-19) ──────────────────────────────────────────
  g.fillStyle(suitColor, 1); g.fillRect(2, 12, 12, 8);
  // Shoulder highlight
  g.fillStyle(hl, 0.35); g.fillRect(2, 12, 12, 3);
  // PLSS (life support) backpack hint on chest
  g.fillStyle(0xC8B050, 1); g.fillRect(5, 15, 6, 3);
  g.fillStyle(0xFFE060, 0.6); g.fillRect(6, 16, 4, 1);
  ol(g, 2); g.strokeRect(2, 12, 12, 8);

  // ── Arms ─────────────────────────────────────────────────────────────
  g.fillStyle(suitColor, 1);
  if (dir !== 'up') {
    g.fillRect(0, 12, 2, 7); g.fillRect(14, 12, 2, 7);
    // Gloves
    g.fillStyle(0x606070, 1);
    g.fillRect(0, 18, 2, 2); g.fillRect(14, 18, 2, 2);
    ol(g, 1); g.strokeRect(0, 12, 2, 7); g.strokeRect(14, 12, 2, 7);
  }

  // ── Legs (rows 20-21) ────────────────────────────────────────────────
  g.fillStyle(suitColor, 1);
  g.fillRect(2, 20, 5, 2); g.fillRect(9, 20, 5, 2);

  // ── Boots (rows 22-23) ───────────────────────────────────────────────
  g.fillStyle(0x333344, 1);
  g.fillRect(1, 22, 6, 2); g.fillRect(9, 22, 6, 2);
  ol(g, 1); g.strokeRect(1, 22, 6, 2); g.strokeRect(9, 22, 6, 2);
}

export function createPlayerTextures(scene: Phaser.Scene): void {
  const W = 16, H = 24;
  (['down', 'up', 'side'] as const).forEach(dir => {
    const g = makeGraphics(scene);
    drawSpacesuit(g, COLORS.PLAYER_SUIT, COLORS.PLAYER_VISOR, dir);
    const suffix = dir === 'down' ? '_down' : dir === 'up' ? '_up' : '_side';
    gen(scene, g, `player${suffix}`, W, H);
  });
}

export function createEmployeeTexture(scene: Phaser.Scene): void {
  const W = 16, H = 24;
  const g = makeGraphics(scene);
  drawSpacesuit(g, COLORS.EMPLOYEE_SUIT, COLORS.EMPLOYEE_VISOR, 'down');
  gen(scene, g, 'player_employee', W, H);
}

export function createCustomerTextures(scene: Phaser.Scene): void {
  const W = 16, H = 24;

  // Astronaut customer
  {
    const g = makeGraphics(scene);
    drawSpacesuit(g, COLORS.ASTRONAUT_SUIT, COLORS.ASTRONAUT_VISOR, 'down');
    gen(scene, g, 'customer_astronaut', W, H);
  }

  // Scientist
  {
    const g = makeGraphics(scene);
    // Head (slightly smaller)
    g.fillStyle(COLORS.SKIN_B, 1); g.fillCircle(8, 5, 5);
    g.fillStyle(COLORS.SKIN_B, 0.8); g.fillRect(5, 5, 6, 4);
    // Hair — dark structured
    g.fillStyle(COLORS.SCIENTIST_HAT, 1); g.fillRect(3, 0, 10, 5);
    g.fillStyle(0x3A4A6A, 1); g.fillRect(3, 4, 10, 2);
    // Glasses
    g.lineStyle(2, OUT, 1);
    g.strokeRect(4, 4, 4, 3); g.strokeRect(9, 4, 4, 3);
    g.lineBetween(8, 5, 9, 5);
    // White lab coat
    g.fillStyle(COLORS.SCIENTIST_COAT, 1); g.fillRect(2, 10, 12, 10);
    g.fillStyle(0xDDDDDD, 1); g.fillRect(3, 11, 10, 2);
    // Lapels
    g.fillStyle(COLORS.SCIENTIST_COAT, 1);
    g.fillTriangle(7, 11, 3, 13, 7, 16); g.fillTriangle(9, 11, 13, 13, 9, 16);
    // Arms
    g.fillStyle(COLORS.SCIENTIST_COAT, 1);
    g.fillRect(0, 11, 2, 8); g.fillRect(14, 11, 2, 8);
    g.fillStyle(COLORS.SKIN_B, 1);
    g.fillRect(0, 18, 2, 2); g.fillRect(14, 18, 2, 2);
    ol(g, 2); g.strokeCircle(8, 5, 5); g.strokeRect(2, 10, 12, 10);
    // Pants
    g.fillStyle(0x2A3850, 1); g.fillRect(2, 20, 12, 4);
    g.fillStyle(0x1A2840, 1); g.fillRect(1, 23, 6, 1); g.fillRect(9, 23, 6, 1);
    gen(scene, g, 'customer_scientist', W, H);
  }

  // Tourist
  {
    const g = makeGraphics(scene);
    g.fillStyle(COLORS.SKIN_A, 1); g.fillCircle(8, 5, 5);
    g.fillStyle(COLORS.SKIN_A, 0.8); g.fillRect(5, 5, 6, 4);
    // Sun hat
    g.fillStyle(0xFFAA00, 1); g.fillEllipse(8, 1, 14, 4);
    g.fillStyle(0xFFCC44, 0.7); g.fillEllipse(7, 1, 9, 3);
    // Colorful shirt
    g.fillStyle(COLORS.TOURIST_SHIRT, 1); g.fillRect(2, 10, 12, 10);
    g.fillStyle(0xFF8888, 0.5); g.fillRect(3, 11, 10, 3);
    g.fillStyle(0xFFCC66, 0.4); g.fillRect(3, 14, 6, 3);
    // Arms
    g.fillStyle(COLORS.TOURIST_SHIRT, 1);
    g.fillRect(0, 11, 2, 7); g.fillRect(14, 11, 2, 7);
    g.fillStyle(COLORS.SKIN_A, 1);
    g.fillRect(0, 17, 2, 2); g.fillRect(14, 17, 2, 2);
    ol(g, 2); g.strokeCircle(8, 5, 5); g.strokeRect(2, 10, 12, 10);
    // Shorts
    g.fillStyle(0x3A7890, 1); g.fillRect(2, 20, 12, 4);
    g.fillStyle(0x2A5870, 1); g.fillRect(1, 23, 6, 1); g.fillRect(9, 23, 6, 1);
    gen(scene, g, 'customer_tourist', W, H);
  }

  // Lunar Worker
  {
    const g = makeGraphics(scene);
    g.fillStyle(COLORS.SKIN_B, 1); g.fillCircle(8, 5, 5);
    g.fillStyle(COLORS.SKIN_B, 0.8); g.fillRect(5, 5, 6, 4);
    // Hard hat
    g.fillStyle(0xFF8822, 1); g.fillEllipse(8, 2, 14, 5);
    g.fillStyle(0xFFAA44, 0.7); g.fillEllipse(7, 1, 9, 3);
    g.fillStyle(0xCC6600, 1); g.fillRect(2, 4, 12, 2);
    // Work suit
    g.fillStyle(COLORS.WORKER_SUIT, 1); g.fillRect(2, 10, 12, 10);
    g.fillStyle(0xFFDD00, 1); g.fillRect(2, 14, 12, 2); // safety stripe
    // Arms
    g.fillStyle(COLORS.WORKER_SUIT, 1);
    g.fillRect(0, 11, 2, 8); g.fillRect(14, 11, 2, 8);
    g.fillStyle(COLORS.SKIN_B, 1);
    g.fillRect(0, 18, 2, 2); g.fillRect(14, 18, 2, 2);
    ol(g, 2); g.strokeCircle(8, 5, 5); g.strokeRect(2, 10, 12, 10);
    // Pants
    g.fillStyle(0x3A3828, 1); g.fillRect(2, 20, 12, 4);
    g.fillStyle(0x2A2818, 1); g.fillRect(1, 23, 6, 1); g.fillRect(9, 23, 6, 1);
    gen(scene, g, 'customer_worker', W, H);
  }
}

// ─────────────────────────────────────────────
// CAT TEXTURES
// ─────────────────────────────────────────────

function createCatVariant(scene: Phaser.Scene, key: string, bodyColor: number, darkColor: number): void {
  const W = 28, H = 22;
  const g = makeGraphics(scene);
  // Body
  g.fillStyle(bodyColor, 1);    g.fillEllipse(14, 18, 22, 9);
  g.fillStyle(darkColor, 0.28); g.fillEllipse(14, 20, 18, 5);
  // Tail (curled right side)
  g.fillStyle(bodyColor, 1);    g.fillEllipse(25, 16, 7, 5);
  g.fillStyle(darkColor, 0.25); g.fillEllipse(25, 17, 5, 3);
  // Front paws
  g.fillStyle(bodyColor, 1);    g.fillEllipse(9, 21, 6, 4);
  g.fillStyle(bodyColor, 1);    g.fillEllipse(16, 21, 6, 4);
  // Head
  g.fillStyle(bodyColor, 1);    g.fillCircle(13, 9, 8);
  // Ears
  g.fillStyle(bodyColor, 1);
  g.fillTriangle(5, 8, 8, 1, 12, 7);
  g.fillTriangle(14, 7, 18, 1, 21, 8);
  // Inner ear
  g.fillStyle(darkColor, 0.55);
  g.fillTriangle(6, 8, 8, 2, 11, 7);
  g.fillTriangle(15, 7, 18, 2, 20, 8);
  // Eyes — large and expressive
  g.fillStyle(COLORS.CAT_EYE, 1); g.fillCircle(9, 9, 3); g.fillCircle(17, 9, 3);
  g.fillStyle(0x111122, 1);        g.fillCircle(9, 9, 1.5); g.fillCircle(17, 9, 1.5);
  g.fillStyle(0xFFFFFF, 1);        g.fillCircle(10, 8, 1); g.fillCircle(18, 8, 1);
  // Nose
  g.fillStyle(COLORS.CAT_NOSE, 1); g.fillTriangle(11, 12, 13, 14, 15, 12);
  // Mouth (little "w" smile)
  g.lineStyle(1.5, darkColor, 0.6);
  g.lineBetween(12, 14, 11, 16); g.lineBetween(14, 14, 15, 16);
  // Whiskers
  g.lineStyle(1, darkColor, 0.5);
  g.lineBetween(1, 11, 8, 12); g.lineBetween(1, 13, 8, 13);
  g.lineBetween(18, 12, 26, 11); g.lineBetween(18, 13, 26, 13);
  // Outline
  ol(g, 2);
  g.strokeCircle(13, 9, 8);
  g.strokeEllipse(14, 18, 22, 9);
  gen(scene, g, key, W, H);
}

function createCatSleeping(scene: Phaser.Scene, key: string, bodyColor: number, darkColor: number): void {
  const W = 28, H = 16;
  const g = makeGraphics(scene);
  // Curled body
  g.fillStyle(bodyColor, 1);    g.fillEllipse(14, 11, 24, 10);
  g.fillStyle(darkColor, 0.25); g.fillEllipse(14, 13, 20, 6);
  // Tail curling around
  g.fillStyle(bodyColor, 1);    g.fillEllipse(24, 11, 8, 5);
  g.fillStyle(darkColor, 0.2);  g.fillEllipse(24, 12, 6, 3);
  // Head resting
  g.fillStyle(bodyColor, 1);    g.fillCircle(6, 7, 6);
  // Ear
  g.fillStyle(bodyColor, 1);    g.fillTriangle(1, 6, 4, 1, 8, 5);
  g.fillStyle(darkColor, 0.5);  g.fillTriangle(2, 6, 4, 2, 7, 5);
  // Closed crescent eyes
  g.lineStyle(2.5, darkColor, 1);
  g.beginPath(); g.arc(4, 8, 2.5, 0.15, Math.PI - 0.15); g.strokePath();
  g.beginPath(); g.arc(9, 8, 2.5, 0.15, Math.PI - 0.15); g.strokePath();
  // Whiskers
  g.lineStyle(1, darkColor, 0.4);
  g.lineBetween(0, 8, 4, 9); g.lineBetween(0, 10, 4, 10);
  g.lineBetween(9, 9, 13, 8); g.lineBetween(9, 10, 13, 10);
  // Outline
  ol(g, 2);
  g.strokeEllipse(14, 11, 24, 10);
  g.strokeCircle(6, 7, 6);
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
  // Order bubble
  {
    const g = makeGraphics(scene);
    const W = 40, H = 34;
    g.fillStyle(0xFFFAF0, 1); g.fillRoundedRect(0, 0, W, H - 8, 6);
    g.fillStyle(0xFFFAF0, 1); g.fillTriangle(8, H - 8, 16, H - 8, 10, H);
    ol(g, 2);
    g.strokeRoundedRect(1, 1, W - 2, H - 9, 6);
    g.lineStyle(2, OUT, 1);
    g.moveTo(8, H - 8); g.lineTo(10, H); g.lineTo(16, H - 8); g.strokePath();
    gen(scene, g, 'ui_order_bubble', W, H);
  }
  // Coin
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xF0C018, 1); g.fillCircle(8, 8, 7);
    g.fillStyle(0xFFE050, 1); g.fillCircle(7, 7, 4);
    g.fillStyle(0xAA8800, 1); g.fillCircle(8, 8, 7);
    g.fillStyle(0xF0C018, 1); g.fillCircle(8, 8, 5);
    g.fillStyle(0xFFD840, 1); g.fillRect(6, 5, 4, 6);
    g.fillStyle(0xFFE878, 0.7); g.fillRect(7, 6, 2, 4);
    ol(g, 2); g.strokeCircle(8, 8, 7);
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
    ol(g, 2); g.beginPath();
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
    ol(g, 2);
    g.strokeCircle(5, 5, 4); g.strokeCircle(11, 5, 4);
    g.strokeTriangle(1, 7, 15, 7, 8, 15);
    gen(scene, g, 'ui_heart', 16, 16);
  }
  // Progress bar background
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x1A1428, 1); g.fillRoundedRect(0, 0, 48, 8, 3);
    g.fillStyle(0x2A2040, 1); g.fillRoundedRect(1, 1, 46, 6, 2);
    gen(scene, g, 'ui_progress_bg', 48, 8);
  }
  // E-key prompt
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

  // Velvet Chair
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x1A0830, 1); g.fillRoundedRect(4, 10, S - 8, S - 14, 3);
    g.fillStyle(0xC03060, 1); g.fillRoundedRect(5, 7, S - 10, 11, 5);
    g.fillStyle(0xE05080, 1); g.fillEllipse(S / 2, 10, S - 14, 6);
    g.fillStyle(0xFF80A0, 0.5); g.fillEllipse(S / 2 - 3, 9, 8, 3);
    g.fillStyle(0xD4A820, 1); g.fillRect(5, S - 5, 3, 5); g.fillRect(S - 8, S - 5, 3, 5);
    ol(g, 2); g.strokeRoundedRect(5, 7, S - 10, 11, 5);
    gen(scene, g, 'deco_velvet_chair', S, S);
  }
  // Round Table
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x6A3810, 1); g.fillEllipse(S / 2, S / 2 - 2, S - 4, S - 8);
    g.fillStyle(0xAA6030, 1); g.fillEllipse(S / 2 - 2, S / 2 - 4, 10, 5);
    g.fillStyle(0xD4A820, 1); g.fillRect(S / 2 - 2, S / 2 + 2, 4, 6); g.fillEllipse(S / 2, S - 4, 10, 4);
    ol(g, 2); g.strokeEllipse(S / 2, S / 2 - 2, S - 4, S - 8);
    gen(scene, g, 'deco_round_table', S, S);
  }
  // Booth Seat
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x0A3030, 1); g.fillRoundedRect(2, 8, S - 4, S - 12, 3);
    g.fillStyle(0x1A6060, 1); g.fillRoundedRect(3, 7, S - 6, 10, 3);
    g.fillStyle(0x30A0A0, 0.7); g.fillRect(4, 8, S - 8, 4);
    g.fillStyle(0x88DDDD, 0.4); g.fillRect(5, 8, S - 10, 2);
    g.fillStyle(0x6A7888, 1); g.fillRect(2, 7, S - 4, 1); g.fillRect(2, S - 5, S - 4, 1);
    ol(g, 2); g.strokeRoundedRect(3, 7, S - 6, 10, 3);
    gen(scene, g, 'deco_booth_seat', S, S);
  }
  // Fairy Lights
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x333322, 1); g.fillRect(2, S / 2, S - 4, 2);
    const cols = [0xFFDD44, 0xFF6688, 0x44DDFF, 0xAAFF44, 0xFFAA22];
    for (let i = 0; i < 5; i++) {
      const cx = 4 + i * 5, cy = S / 2 + 1;
      g.fillStyle(cols[i], 1); g.fillCircle(cx, cy, 3);
      g.fillStyle(cols[i], 0.3); g.fillCircle(cx, cy, 5);
      g.fillStyle(0xFFFFFF, 0.5); g.fillCircle(cx - 1, cy - 1, 1);
      ol(g, 2); g.strokeCircle(cx, cy, 3);
    }
    gen(scene, g, 'deco_fairy_lights', S, S);
  }
  // Neon Sign
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x0A0415, 1); g.fillRoundedRect(1, 5, S - 2, S - 10, 4);
    g.fillStyle(0xFF44CC, 0.25); g.fillRoundedRect(2, 6, S - 4, S - 12, 3);
    ol(g, 2); g.strokeRoundedRect(2, 6, S - 4, S - 12, 3);
    g.lineStyle(2, 0xFF44CC, 1);
    g.strokeRect(5, 9, 4, 7); g.strokeRect(11, 9, 4, 7); g.strokeRect(17, 9, 4, 7);
    g.fillStyle(0xFF88EE, 0.7); g.fillEllipse(S / 2, S / 2, S - 8, S - 14);
    gen(scene, g, 'deco_neon_sign', S, S);
  }
  // Crystal Lamp
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x6A7888, 1); g.fillRect(S / 2 - 1, 0, 2, 5);
    g.fillStyle(0x8898A8, 1); g.fillEllipse(S / 2, 8, 12, 6);
    g.fillStyle(0xCCEEFF, 0.9); g.fillEllipse(S / 2, 8, 8, 4);
    [[S / 2 - 6, 10], [S / 2, 10], [S / 2 + 6, 10]].forEach(([cx, cy]) => {
      g.fillStyle(0xCCEEFF, 1); g.fillRect(cx - 1, cy, 2, 8);
      g.fillStyle(0x88CCFF, 0.9);
      g.fillTriangle(cx - 2, cy + 8, cx + 2, cy + 8, cx, cy + 12);
      ol(g, 2); g.strokeTriangle(cx - 2, cy + 8, cx + 2, cy + 8, cx, cy + 12);
    });
    g.fillStyle(0xFFFFCC, 0.4); g.fillCircle(S / 2, 8, 10);
    gen(scene, g, 'deco_crystal_lamp', S, S);
  }
  // Luna Fern
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x4A5868, 1); g.fillEllipse(S / 2, S - 4, 10, 5);
    g.fillStyle(0x0A4433, 1); g.fillRect(S / 2 - 1, 6, 2, S - 12);
    g.fillStyle(0x00AA88, 1);
    g.fillEllipse(S / 2 - 7, 14, 12, 6); g.fillEllipse(S / 2 + 7, 12, 12, 6);
    g.fillEllipse(S / 2 - 5, 8, 10, 5); g.fillEllipse(S / 2 + 5, 6, 10, 5);
    g.fillStyle(0x44FFCC, 0.5);
    g.fillEllipse(S / 2 - 8, 13, 6, 3); g.fillEllipse(S / 2 + 8, 11, 6, 3);
    gen(scene, g, 'deco_luna_fern', S, S);
  }
  // Space Cactus
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x4A5868, 1); g.fillEllipse(S / 2, S - 4, 10, 5);
    g.fillStyle(0x2A5A2A, 1); g.fillRoundedRect(S / 2 - 4, 6, 8, S - 12, 2);
    g.fillStyle(0x3A7A3A, 1); g.fillRect(S / 2 - 3, 7, 6, S - 14);
    g.fillStyle(0x3A6A2A, 1);
    g.fillRoundedRect(S / 2 - 9, 12, 5, 4, 2); g.fillRoundedRect(S / 2 + 4, 10, 5, 4, 2);
    g.fillStyle(0xBB44FF, 1); g.fillCircle(S / 2, 6, 3);
    g.fillStyle(0xDD88FF, 0.6); g.fillCircle(S / 2 - 1, 5, 2);
    ol(g, 2); g.strokeRoundedRect(S / 2 - 4, 6, 8, S - 12, 2);
    gen(scene, g, 'deco_space_cactus', S, S);
  }
  // Moon Bloom
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x4A5868, 1); g.fillEllipse(S / 2, S - 4, 10, 5);
    g.fillStyle(0x2A4A2A, 1); g.fillRect(S / 2 - 1, 12, 2, S - 14);
    g.fillStyle(0xEEEEFF, 1);
    for (let a = 0; a < 6; a++) {
      const ax = S / 2 + Math.cos(a * Math.PI / 3) * 7;
      const ay = 10 + Math.sin(a * Math.PI / 3) * 7;
      g.fillEllipse(ax, ay, 6, 8);
    }
    g.fillStyle(0xF0C018, 1); g.fillCircle(S / 2, 10, 4);
    g.fillStyle(0xFFEE66, 0.8); g.fillCircle(S / 2 - 1, 9, 2);
    ol(g, 2); g.strokeCircle(S / 2, 10, 4);
    gen(scene, g, 'deco_moon_bloom', S, S);
  }
  // Star Map
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x2A1A40, 1); g.fillRoundedRect(2, 3, S - 4, S - 6, 2);
    g.lineStyle(2, 0x6A7888, 1); g.strokeRoundedRect(2, 3, S - 4, S - 6, 2);
    g.fillStyle(0x06041C, 1); g.fillRect(5, 6, S - 10, S - 12);
    const stars = [[6, 8], [14, 7], [20, 10], [10, 14], [18, 18], [8, 20], [22, 16]];
    g.fillStyle(0xFFFFCC, 1);
    stars.forEach(([sx, sy]) => g.fillCircle(sx, sy, 1.5));
    g.lineStyle(1, 0x445566, 0.8);
    g.beginPath(); g.moveTo(6, 8); g.lineTo(14, 7); g.lineTo(20, 10); g.lineTo(18, 18); g.strokePath();
    gen(scene, g, 'deco_star_map', S, S);
  }
  // Moon Portrait
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x3A1A08, 1); g.fillRoundedRect(1, 2, S - 2, S - 4, 2);
    g.lineStyle(2, 0x6A7888, 1); g.strokeRoundedRect(1, 2, S - 2, S - 4, 2);
    g.fillStyle(0x06041C, 1); g.fillRect(4, 5, S - 8, S - 10);
    g.fillStyle(0xC0BCA8, 1); g.fillCircle(S / 2, S / 2 - 1, 9);
    g.fillStyle(0x888070, 1); g.fillCircle(S / 2 - 3, S / 2 - 3, 4); g.fillCircle(S / 2 + 4, S / 2 + 2, 3);
    g.fillStyle(0xD8D4C0, 0.8); g.fillCircle(S / 2 - 4, S / 2 - 4, 2);
    g.fillStyle(0xFFFFCC, 0.3); g.fillCircle(S / 2 - 1, S / 2 - 5, 5);
    gen(scene, g, 'deco_moon_portrait', S, S);
  }
  // Telescope
  {
    const g = makeGraphics(scene);
    g.fillStyle(0xB89030, 1); g.fillRoundedRect(S / 2 - 6, 7, 14, 5, 2);
    g.fillStyle(0xD4B040, 0.7); g.fillRect(S / 2 - 5, 8, 12, 2);
    g.fillStyle(0xB89030, 1); g.fillRoundedRect(S / 2 - 4, 11, 10, 4, 1);
    g.fillStyle(0x886600, 1); g.fillRect(S / 2 - 2, 15, 4, 4);
    g.fillStyle(0xB89030, 1);
    g.fillRect(S / 2 - 9, 19, 4, 2); g.fillRect(S / 2 + 1, 18, 4, 2); g.fillRect(S / 2 - 4, 18, 3, 7);
    g.fillStyle(0x2A3850, 1); g.fillRoundedRect(S / 2 - 9, 6, 4, 6, 1);
    g.fillStyle(0x88AAFF, 0.9); g.fillRect(S / 2 - 8, 7, 2, 4);
    ol(g, 2); g.strokeRoundedRect(S / 2 - 6, 7, 14, 5, 2);
    gen(scene, g, 'deco_telescope', S, S);
  }
  // Rover Display
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x4A4A5A, 1); g.fillRoundedRect(3, S - 6, S - 6, 4, 2);
    g.fillStyle(0x6A7888, 1); g.fillRect(2, S - 7, S - 4, 1);
    g.fillStyle(0x8A8898, 1); g.fillRoundedRect(6, 11, S - 12, 8, 2);
    g.fillStyle(0x5566AA, 1); g.fillRoundedRect(8, 9, 7, 5, 1);
    g.fillStyle(0x88AACC, 0.8); g.fillRect(9, 10, 5, 3);
    g.fillStyle(0x555566, 1);
    g.fillCircle(7, S - 9, 3); g.fillCircle(S - 7, S - 9, 3);
    g.fillStyle(0xAAAAAA, 0.7); g.fillCircle(7, S - 9, 1); g.fillCircle(S - 7, S - 9, 1);
    g.fillStyle(0x6A7888, 1); g.fillRect(S - 8, 7, 2, 6);
    ol(g, 2); g.strokeRoundedRect(6, 11, S - 12, 8, 2);
    gen(scene, g, 'deco_rover_display', S, S);
  }
  // Cat Statue
  {
    const g = makeGraphics(scene);
    g.fillStyle(0x4A4A3A, 1); g.fillRoundedRect(5, S - 6, S - 10, 4, 2);
    g.fillStyle(0x6A7888, 1); g.fillRect(4, S - 7, S - 8, 1);
    g.fillStyle(0xD4C090, 1);
    g.fillEllipse(S / 2, 14, 10, 12);
    g.fillTriangle(S / 2 - 4, 8, S / 2 - 1, 2, S / 2 - 1, 8);
    g.fillTriangle(S / 2 + 4, 8, S / 2 + 1, 2, S / 2 + 1, 8);
    g.fillStyle(0xBBAA80, 1); g.fillEllipse(S / 2, 15, 7, 8);
    g.fillStyle(0xFFD700, 0.9); g.fillCircle(S / 2 - 2, 13, 1.5); g.fillCircle(S / 2 + 2, 13, 1.5);
    g.fillStyle(0x1A1428, 1); g.fillCircle(S / 2 - 2, 13, 0.8); g.fillCircle(S / 2 + 2, 13, 0.8);
    g.fillStyle(0x6A7888, 1); g.fillRect(S / 2 - 2, S - 6, 4, 5);
    ol(g, 2); g.strokeEllipse(S / 2, 14, 10, 12);
    gen(scene, g, 'deco_cat_statue', S, S);
  }
}

// ─────────────────────────────────────────────
// MASTER FACTORY
// ─────────────────────────────────────────────

export function createAllTextures(scene: Phaser.Scene): void {
  createFloorTile(scene);
  createFloorIndustrialTile(scene);
  createFloorDarkTile(scene);
  createKitchenFloorTile(scene);
  createWallTile(scene);
  createWindowTile(scene);
  createCounterTile(scene);
  createSpaceTile(scene);
  createMoonTile(scene);
  createRegolithTile(scene);
  createDomeTile(scene);

  createTableTexture(scene);
  createGroupTableTexture(scene);
  createChairTexture(scene);
  createCoffeeMachineTexture(scene);
  createStoveTexture(scene);
  createPrepCounterTexture(scene);
  createGriddleTexture(scene);
  createMixerTexture(scene);
  createOvenTexture(scene);
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
  createAntennaTexture(scene);
  createCargoCrateTexture(scene);
  createSolarPanelTexture(scene);

  createFoodTextures(scene);
  createPlayerTextures(scene);
  createEmployeeTexture(scene);
  createCustomerTextures(scene);
  createCatTextures(scene);
  createUITextures(scene);
  createParticleTextures(scene);
  createDecorationTextures(scene);
}
