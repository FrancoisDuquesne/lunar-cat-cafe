import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../constants';
import { loadGame, defaultSaveState, clearSave } from '../systems/SaveSystem';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenuScene'); }

  create(): void {
    const cx = GAME_W / 2;

    // ── Vibrant nebula background ─────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x080416, 0x080416, 0x120820, 0x0A1030, 1);
    bg.fillRect(0, 0, GAME_W, GAME_H);

    // Nebula colour clouds
    bg.fillStyle(0x5A0080, 0.22); bg.fillCircle(GAME_W * 0.72, GAME_H * 0.25, 220);
    bg.fillStyle(0x003888, 0.20); bg.fillCircle(GAME_W * 0.18, GAME_H * 0.65, 200);
    bg.fillStyle(0x700048, 0.16); bg.fillCircle(GAME_W * 0.85, GAME_H * 0.75, 170);
    bg.fillStyle(0x003A55, 0.18); bg.fillCircle(GAME_W * 0.35, GAME_H * 0.2, 150);

    // Stars — multi-colour
    const starColors = [0xFFFFFF, 0xFFEEDD, 0xDDEEFF, 0xFFDDFF, 0xFFFFAA, 0xAAFFFF];
    for (let i = 0; i < 240; i++) {
      const color = starColors[Math.floor(Math.random() * starColors.length)];
      const a = 0.35 + Math.random() * 0.65;
      bg.fillStyle(color, a);
      const big = Math.random() < 0.12;
      bg.fillRect(
        Math.random() * GAME_W,
        Math.random() * GAME_H,
        big ? 2 : 1, big ? 2 : 1,
      );
    }

    // ── Moon surface ──────────────────────────────────────────────────
    const moon = this.add.graphics();
    moon.fillStyle(0x9A9AAA, 1);
    moon.fillEllipse(cx, GAME_H + 50, GAME_W * 1.3, 220);
    // Craters
    moon.fillStyle(0x787888, 1);
    [[cx - 220, GAME_H - 14, 20], [cx + 140, GAME_H - 2, 14], [cx - 50, GAME_H + 18, 10]].forEach(
      ([x, y, r]) => moon.fillCircle(x as number, y as number, r as number),
    );
    moon.fillStyle(COLORS.MOON_LIGHT, 1);
    [[cx - 223, GAME_H - 17, 9], [cx + 137, GAME_H - 5, 6]].forEach(
      ([x, y, r]) => moon.fillCircle(x as number, y as number, r as number),
    );

    // Moon rocks (foreground)
    [[cx - 370, GAME_H - 8, 22, 14], [cx + 330, GAME_H - 5, 30, 18], [cx - 250, GAME_H + 5, 18, 12]].forEach(
      ([rx, ry, rw, rh]) => {
        moon.fillStyle(0x8A8A9A, 1);
        moon.fillEllipse(rx as number, ry as number, rw as number, rh as number);
      },
    );

    // ── Bio-dome ─────────────────────────────────────────────────────
    const dome = this.add.graphics();
    // Inner warm glow
    dome.fillStyle(0xFF9940, 0.14);
    dome.fillEllipse(cx, GAME_H - 50, 360, 200);
    dome.fillStyle(0xFF6688, 0.07);
    dome.fillEllipse(cx, GAME_H - 50, 300, 160);
    // Dome shell
    dome.fillStyle(0x101838, 0.55);
    dome.fillEllipse(cx, GAME_H - 50, 370, 205);
    dome.lineStyle(3, 0x88DDFF, 0.85);
    dome.strokeEllipse(cx, GAME_H - 50, 370, 205);
    // Glass panel glints
    dome.fillStyle(0x88CCFF, 0.28);
    dome.fillRoundedRect(cx - 100, GAME_H - 150, 68, 48, 6);
    dome.fillRoundedRect(cx + 22, GAME_H - 138, 68, 48, 6);
    // Dome grid lines
    dome.lineStyle(1, 0x88DDFF, 0.18);
    for (let gx = -140; gx <= 140; gx += 46) {
      dome.lineBetween(cx + gx, GAME_H - 160, cx + gx * 0.3, GAME_H + 10);
    }

    // ── Earth ────────────────────────────────────────────────────────
    const earth = this.add.graphics();
    earth.fillStyle(COLORS.EARTH_OCEAN, 1); earth.fillCircle(GAME_W - 84, 78, 52);
    earth.fillStyle(0x104060, 0.35); earth.fillCircle(GAME_W - 84, 78, 52); // shadow tint
    earth.fillStyle(COLORS.EARTH_LAND, 1);
    earth.fillEllipse(GAME_W - 94, 56, 32, 24);
    earth.fillEllipse(GAME_W - 62, 90, 24, 20);
    earth.fillEllipse(GAME_W - 100, 88, 18, 14);
    earth.fillStyle(COLORS.EARTH_CLOUD, 0.9);
    earth.fillEllipse(GAME_W - 86, 50, 34, 14);
    earth.fillEllipse(GAME_W - 56, 72, 26, 12);
    earth.fillEllipse(GAME_W - 100, 80, 20, 10);
    // Atmosphere rim
    earth.fillStyle(0x44AAFF, 0.18); earth.fillCircle(GAME_W - 84, 78, 58);

    // ── Title ─────────────────────────────────────────────────────────
    const titleShadow = this.add.text(cx + 4, 102, 'CAT CAFE', {
      fontSize: '66px', fontFamily: '"Courier New", monospace',
      color: '#660033', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9);
    void titleShadow;

    const title1 = this.add.text(cx, 99, 'CAT CAFE', {
      fontSize: '66px', fontFamily: '"Courier New", monospace',
      color: '#FF88CC', fontStyle: 'bold',
      stroke: '#880044', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(10);

    const title2 = this.add.text(cx, 173, 'ON THE MOON', {
      fontSize: '38px', fontFamily: '"Courier New", monospace',
      color: '#88DDFF', fontStyle: 'bold',
      stroke: '#004466', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    // Subtitle sparkle line
    this.add.text(cx, 215, '~ a cozy lunar cafe ~', {
      fontSize: '13px', fontFamily: '"Courier New", monospace',
      color: '#FFAADD', alpha: 0.8,
    } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5).setDepth(10).setAlpha(0.8);

    // Cat icons flanking the title
    const catL = this.add.sprite(cx - 88, 140, 'cat_orange').setScale(2.4).setDepth(11);
    const catR = this.add.sprite(cx + 86, 143, 'cat_cream').setScale(2.4).setDepth(11).setFlipX(true);
    const catExtra = this.add.sprite(cx - 320, GAME_H - 130, 'cat_gray').setScale(1.8).setDepth(11);
    const catExtra2 = this.add.sprite(cx + 310, GAME_H - 135, 'cat_black').setScale(1.8).setDepth(11).setFlipX(true);

    // Floating title animation
    this.tweens.add({
      targets: [title1, title2], y: '+=7',
      duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    this.tweens.add({ targets: catL,      y: '+=5', duration: 1900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: catR,      y: '+=5', duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: catExtra,  y: '+=4', duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: catExtra2, y: '+=4', duration: 2100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // ── Buttons ───────────────────────────────────────────────────────
    const saved = loadGame();
    const buttonY = 300;

    if (saved) {
      this.makeButton(cx, buttonY, 'Continue', '#FF88CC', 0xFF44AA, () => this.startGame(false));
      this.makeButton(cx, buttonY + 65, 'New Game', '#88DDFF', 0x44AADD, () => {
        clearSave();
        this.startGame(true);
      }, true);
    } else {
      this.makeButton(cx, buttonY, 'Start Game', '#FF88CC', 0xFF44AA, () => this.startGame(true));
    }

    // ── Info strip ────────────────────────────────────────────────────
    this.add.text(cx, GAME_H - 52, 'WASD / Arrows: Move     E / Space: Interact', {
      fontSize: '12px', color: '#8899BB', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);

    this.add.text(cx, GAME_H - 30, 'Serve customers, keep the cats happy, grow your cafe!', {
      fontSize: '11px', color: '#667799', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);

    // Twinkling multi-colour stars
    const twinkleColors = ['particle_star', 'particle_heart', 'particle_coin'];
    this.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => {
        const starX = Math.random() * GAME_W;
        const starY = Math.random() * (GAME_H * 0.65);
        const tex = twinkleColors[Math.floor(Math.random() * twinkleColors.length)];
        const star = this.add.sprite(starX, starY, tex).setAlpha(0).setDepth(1).setScale(0.45 + Math.random() * 0.3);
        this.tweens.add({
          targets: star, alpha: { from: 0, to: 0.85 },
          duration: 180, yoyo: true,
          onComplete: () => star.destroy(),
        });
      },
    });

    // Slow dome glow pulse
    this.tweens.add({
      targets: dome, alpha: { from: 1, to: 0.82 },
      duration: 3000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  private makeButton(
    x: number, y: number, label: string,
    textColor: string, hoverFill: number,
    cb: () => void, small = false,
  ): void {
    const w = small ? 210 : 260;
    const h = small ? 44 : 56;

    const bg = this.add.graphics().setDepth(10);
    const drawBg = (hover: boolean) => {
      bg.clear();
      if (hover) {
        bg.fillStyle(hoverFill, 1);
      } else {
        bg.fillStyle(0x1A0830, 0.9);
      }
      bg.fillRoundedRect(x - w/2, y - h/2, w, h, 10);
      bg.lineStyle(2, hoverFill, hover ? 1 : 0.7);
      bg.strokeRoundedRect(x - w/2, y - h/2, w, h, 10);
    };
    drawBg(false);

    const txt = this.add.text(x, y, label, {
      fontSize: small ? '15px' : '20px',
      fontFamily: 'monospace',
      color: textColor,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);

    const zone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true }).setDepth(12);
    zone.on('pointerover', () => { drawBg(true); txt.setColor('#FFFFFF'); });
    zone.on('pointerout', () => { drawBg(false); txt.setColor(textColor); });
    zone.on('pointerdown', cb);
  }

  private startGame(fresh: boolean): void {
    void fresh;
    this.scene.start('GameScene');
    this.scene.start('UIScene');
    this.scene.bringToTop('UIScene');
  }
}
