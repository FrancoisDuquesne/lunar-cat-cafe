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
    if (fresh) {
      clearSave();
      // Discard any sleeping in-progress game
      if (this.scene.isSleeping('GameScene')) this.scene.stop('GameScene');
      this.scene.start('GameScene');
      this.scene.start('UIScene');
      this.scene.bringToTop('UIScene');
    } else if (this.scene.isSleeping('GameScene')) {
      // Resume the paused in-progress session — no restart, no data loss
      this.scene.wake('GameScene');
      this.scene.launch('UIScene');          // restart UIScene to show HUD
      this.scene.bringToTop('UIScene');
      this.scene.stop();                     // close the menu
    } else {
      // No in-progress session — load from save as usual
      this.scene.start('GameScene');
      this.scene.start('UIScene');
      this.scene.bringToTop('UIScene');
    }
  }

  // ── Background (kept in Phaser canvas) ──────────────────────────

  private buildBackground(): void {
    const cx = GAME_W / 2;
    const domeY = GAME_H - 60;

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

    // Earth (top-right corner)
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

    // Moon surface
    const moon = this.add.graphics();
    moon.fillStyle(0x9A9AAA, 1);
    moon.fillEllipse(cx, GAME_H + 30, GAME_W * 1.3, 220);
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

    // ── Warm glow pooling up from dome — sets the cozy mood ──
    const warmGlow = this.add.graphics();
    warmGlow.fillStyle(0xFF9933, 0.07); warmGlow.fillEllipse(cx, domeY - 30, 620, 420);
    warmGlow.fillStyle(0xFFBB55, 0.06); warmGlow.fillEllipse(cx, domeY - 10, 440, 280);

    // ── Bio-dome — warm café interior visible through the glass ──
    const dome = this.add.graphics();
    // Warm interior fill (lamp-lit café)
    dome.fillStyle(0xFFAA44, 0.22); dome.fillEllipse(cx, domeY, 420, 220);
    dome.fillStyle(0xFF8811, 0.15); dome.fillEllipse(cx, domeY, 360, 190);
    // Dark glass silhouette (slightly translucent so interior shows through)
    dome.fillStyle(0x080A20, 0.52);  dome.fillEllipse(cx, domeY, 420, 220);
    // Café interior silhouettes — tables, counter, chairs
    dome.fillStyle(0x3A2510, 0.85);
    dome.fillRoundedRect(cx - 110, domeY - 30, 54, 28, 4);   // left table top
    dome.fillRect(cx - 96, domeY - 2, 8, 22);                  // left table leg L
    dome.fillRect(cx - 70, domeY - 2, 8, 22);                  // left table leg R
    dome.fillRoundedRect(cx + 56, domeY - 24, 54, 28, 4);     // right table top
    dome.fillRect(cx + 68, domeY - 2, 8, 22);                  // right table leg L
    dome.fillRect(cx + 92, domeY - 2, 8, 22);                  // right table leg R
    // Tiny cups on tables
    dome.fillStyle(0xFFDD99, 0.75);
    dome.fillEllipse(cx - 83, domeY - 18, 12, 8);   // cup on left table
    dome.fillEllipse(cx + 85, domeY - 11, 12, 8);   // cup on right table
    // Counter/bar silhouette at back
    dome.fillStyle(0x2A1A08, 0.9);
    dome.fillRoundedRect(cx - 148, domeY - 68, 296, 18, 3);
    // Hanging pendant lamps (small warm circles)
    dome.fillStyle(0xFFEEBB, 0.90);
    dome.fillCircle(cx - 60, domeY - 78, 6);
    dome.fillCircle(cx,      domeY - 82, 6);
    dome.fillCircle(cx + 60, domeY - 78, 6);
    dome.fillStyle(0xFFDD88, 0.28);
    dome.fillCircle(cx - 60, domeY - 78, 14);
    dome.fillCircle(cx,      domeY - 82, 14);
    dome.fillCircle(cx + 60, domeY - 78, 14);
    // Glass dome frame
    dome.lineStyle(3, 0xC8920A, 0.95);
    dome.strokeEllipse(cx, domeY, 420, 220);
    // Structural ribs
    dome.lineStyle(1, 0xC8920A, 0.28);
    for (let gx = -160; gx <= 160; gx += 53) {
      dome.lineBetween(cx + gx, domeY - 110, cx + gx * 0.25, domeY + 110);
    }
    // Sleeping cat silhouette in dome (sitting at left table)
    dome.fillStyle(0x1A0E04, 0.9);
    dome.fillEllipse(cx - 83, domeY + 12, 28, 14);  // sleeping cat body
    dome.fillCircle(cx - 98, domeY + 8, 7);          // head
    dome.fillTriangle(cx - 102, domeY + 3, cx - 98, domeY - 3, cx - 94, domeY + 3); // ear

    // Dome pulse animation
    this.tweens.add({
      targets: dome, alpha: { from: 1, to: 0.88 },
      duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.tweens.add({
      targets: warmGlow, alpha: { from: 1, to: 0.65 },
      duration: 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    // ── Steam / hearts drifting up from dome ──
    this.add.particles(cx, domeY - 100, 'particle_steam', {
      speed: { min: 8, max: 20 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.45, end: 0 },
      lifespan: { min: 1200, max: 2400 },
      frequency: 600,
      gravityY: -18,
      angle: { min: -25, max: 25 },
      x: { min: -110, max: 110 },
    }).setDepth(2);

    this.time.addEvent({
      delay: 2800, loop: true,
      callback: () => {
        const hx = cx + (Math.random() - 0.5) * 180;
        const spr = this.add.sprite(hx, domeY - 90, 'particle_heart')
          .setAlpha(0).setDepth(3).setScale(0.55);
        this.tweens.add({
          targets: spr,
          alpha: { from: 0, to: 0.7 },
          y: spr.y - 60,
          duration: 1600, ease: 'Sine.easeOut',
          onComplete: () => this.tweens.add({
            targets: spr, alpha: 0, duration: 400,
            onComplete: () => spr.destroy(),
          }),
        });
      },
    });

    // Twinkling particles (stars in sky)
    const twinkleKeys = ['particle_star', 'particle_coin'];
    this.time.addEvent({
      delay: 380, loop: true,
      callback: () => {
        const key = twinkleKeys[Math.floor(Math.random() * twinkleKeys.length)];
        const spr = this.add.sprite(Math.random() * GAME_W, Math.random() * GAME_H * 0.60, key)
          .setAlpha(0).setDepth(1).setScale(0.4 + Math.random() * 0.25);
        this.tweens.add({
          targets: spr, alpha: { from: 0, to: 0.75 },
          duration: 200, yoyo: true,
          onComplete: () => spr.destroy(),
        });
      },
    });
  }

  private buildCats(): void {
    const cx = GAME_W / 2;
    const domeY = GAME_H - 60;

    // Two cats flanking title
    const catL = this.add.sprite(cx - 92, 138, 'cat_orange').setScale(2.6).setDepth(11);
    const catR = this.add.sprite(cx + 90, 141, 'cat_cream').setScale(2.6).setDepth(11).setFlipX(true);
    // Two cats perched on the moon surface beside the dome
    const catExL = this.add.sprite(cx - 240, domeY - 28, 'cat_gray').setScale(2.0).setDepth(12);
    const catExR = this.add.sprite(cx + 232, domeY - 32, 'cat_black').setScale(2.0).setDepth(12).setFlipX(true);
    // Sleeping cat on moon surface
    const catSleep = this.add.sprite(cx - 380, domeY + 10, 'cat_orange_sleep').setScale(1.8).setDepth(12);

    this.tweens.add({ targets: catL,     y: '+=6', duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: catR,     y: '+=6', duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: catExL,   y: '+=4', duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: catExR,   y: '+=4', duration: 2100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: catSleep, y: '+=3', duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}
