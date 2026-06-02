import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../constants';
import { loadGame, clearSave } from '../systems/SaveSystem';
import { uiOverlay } from '../ui/UIOverlay';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  create(): void {
    uiOverlay.init(this.game);
    this.buildBackground();
    this.buildCats();
    this.showMenu();
  }

  private showMenu(): void {
    const saved = loadGame();
    uiOverlay.showMenu(
      !!saved,
      () => this.startGame(false),
      () => this.startGame(true),
    );
  }

  private startGame(fresh: boolean): void {
    if (fresh) clearSave();
    this.scene.start('GameScene');
    this.scene.start('UIScene');
    this.scene.bringToTop('UIScene');
  }

  // ── Background (kept in Phaser canvas) ──────────────────────────

  private buildBackground(): void {
    const cx = GAME_W / 2;

    // Deep space gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x03020E, 0x03020E, 0x06041C, 0x04020E, 1);
    bg.fillRect(0, 0, GAME_W, GAME_H);

    // Nebula clouds
    bg.fillStyle(0x6600AA, 0.18); bg.fillCircle(GAME_W * 0.72, GAME_H * 0.25, 240);
    bg.fillStyle(0x002266, 0.14); bg.fillCircle(GAME_W * 0.18, GAME_H * 0.55, 220);
    bg.fillStyle(0x880022, 0.10); bg.fillCircle(GAME_W * 0.85, GAME_H * 0.75, 180);
    bg.fillStyle(0xCC5500, 0.07); bg.fillCircle(GAME_W * 0.5,  GAME_H * 0.35, 260);
    bg.fillStyle(0x440088, 0.12); bg.fillCircle(GAME_W * 0.3,  GAME_H * 0.15, 160);

    // Stars
    const starColors = [0xFFFFFF, 0xFFEECC, 0xDDEEFF, 0xFFEEFF, 0xFFFFCC, 0xCCEEFF, 0xFFCC88];
    for (let i = 0; i < 320; i++) {
      const color = starColors[Math.floor(Math.random() * starColors.length)];
      const a = 0.3 + Math.random() * 0.7;
      const big = Math.random() < 0.08;
      const glow = Math.random() < 0.04;
      const sx = Math.random() * GAME_W;
      const sy = Math.random() * GAME_H;
      if (glow) {
        bg.fillStyle(color, 0.12); bg.fillRect(sx - 2, sy - 2, 6, 6);
        bg.fillStyle(color, 0.35); bg.fillRect(sx - 1, sy - 1, 4, 4);
      }
      bg.fillStyle(color, a);
      bg.fillRect(sx, sy, big ? 2 : 1, big ? 2 : 1);
    }

    // Moon surface
    const moon = this.add.graphics();
    moon.fillStyle(0x9A9AAA, 1);
    moon.fillEllipse(cx, GAME_H + 50, GAME_W * 1.3, 220);
    moon.fillStyle(0x787888, 1);
    [[cx - 220, GAME_H - 14, 20], [cx + 140, GAME_H - 2, 14], [cx - 50, GAME_H + 18, 10]].forEach(
      ([x, y, r]) => moon.fillCircle(x as number, y as number, r as number),
    );
    moon.fillStyle(COLORS.MOON_LIGHT, 1);
    [[cx - 223, GAME_H - 17, 9], [cx + 137, GAME_H - 5, 6]].forEach(
      ([x, y, r]) => moon.fillCircle(x as number, y as number, r as number),
    );
    [[cx - 370, GAME_H - 8, 22, 14], [cx + 330, GAME_H - 5, 30, 18], [cx - 250, GAME_H + 5, 18, 12]].forEach(
      ([rx, ry, rw, rh]) => {
        moon.fillStyle(0x8A8A9A, 1);
        moon.fillEllipse(rx as number, ry as number, rw as number, rh as number);
      },
    );

    // Bio-dome glow
    const dome = this.add.graphics();
    dome.fillStyle(0xFF8800, 0.18); dome.fillEllipse(cx, GAME_H - 50, 400, 230);
    dome.fillStyle(0xFF6600, 0.12); dome.fillEllipse(cx, GAME_H - 50, 340, 190);
    dome.fillStyle(0xFFAA00, 0.06); dome.fillEllipse(cx, GAME_H - 50, 280, 160);
    dome.fillStyle(0x080318, 0.6);  dome.fillEllipse(cx, GAME_H - 50, 370, 205);
    dome.lineStyle(3, 0xC8920A, 0.95);
    dome.strokeEllipse(cx, GAME_H - 50, 370, 205);
    dome.lineStyle(1, 0xC8920A, 0.22);
    for (let gx = -140; gx <= 140; gx += 46) {
      dome.lineBetween(cx + gx, GAME_H - 160, cx + gx * 0.3, GAME_H + 10);
    }
    dome.fillStyle(0xFFCC66, 0.14);
    dome.fillRoundedRect(cx - 100, GAME_H - 150, 68, 48, 6);
    dome.fillRoundedRect(cx + 22, GAME_H - 138, 68, 48, 6);

    // Earth
    const earth = this.add.graphics();
    earth.fillStyle(COLORS.EARTH_OCEAN, 1); earth.fillCircle(GAME_W - 84, 78, 52);
    earth.fillStyle(0x104060, 0.35);        earth.fillCircle(GAME_W - 84, 78, 52);
    earth.fillStyle(COLORS.EARTH_LAND, 1);
    earth.fillEllipse(GAME_W - 94, 56, 32, 24);
    earth.fillEllipse(GAME_W - 62, 90, 24, 20);
    earth.fillEllipse(GAME_W - 100, 88, 18, 14);
    earth.fillStyle(COLORS.EARTH_CLOUD, 0.9);
    earth.fillEllipse(GAME_W - 86, 50, 34, 14);
    earth.fillEllipse(GAME_W - 56, 72, 26, 12);
    earth.fillEllipse(GAME_W - 100, 80, 20, 10);
    earth.fillStyle(0x44AAFF, 0.18); earth.fillCircle(GAME_W - 84, 78, 58);

    // Dome pulse animation
    this.tweens.add({
      targets: dome, alpha: { from: 1, to: 0.82 },
      duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // Twinkling particles
    const twinkleKeys = ['particle_star', 'particle_heart', 'particle_coin'];
    this.time.addEvent({
      delay: 350, loop: true,
      callback: () => {
        const key = twinkleKeys[Math.floor(Math.random() * twinkleKeys.length)];
        const spr = this.add.sprite(Math.random() * GAME_W, Math.random() * GAME_H * 0.65, key)
          .setAlpha(0).setDepth(1).setScale(0.45 + Math.random() * 0.3);
        this.tweens.add({
          targets: spr, alpha: { from: 0, to: 0.85 },
          duration: 180, yoyo: true,
          onComplete: () => spr.destroy(),
        });
      },
    });
  }

  private buildCats(): void {
    const cx = GAME_W / 2;

    // Small cat sprites flanking where the title will appear (HTML overlay)
    const catL = this.add.sprite(cx - 88, 140, 'cat_orange').setScale(2.4).setDepth(11);
    const catR = this.add.sprite(cx + 86, 143, 'cat_cream').setScale(2.4).setDepth(11).setFlipX(true);
    const catExL = this.add.sprite(cx - 320, GAME_H - 130, 'cat_gray').setScale(1.8).setDepth(11);
    const catExR = this.add.sprite(cx + 310, GAME_H - 135, 'cat_black').setScale(1.8).setDepth(11).setFlipX(true);

    this.tweens.add({ targets: catL,   y: '+=5', duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: catR,   y: '+=5', duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: catExL, y: '+=4', duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: catExR, y: '+=4', duration: 2100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
