import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../constants';
import { OrderInfo } from '../types';

interface UIState {
  money: number;
  reputation: number;
  day: number;
  dayProgress: number;
  catHappiness: number;
  totalServed: number;
  phase: 'morning' | 'afternoon' | 'evening' | 'night';
  orders: OrderInfo[];
}

export class UIScene extends Phaser.Scene {
  private moneyText!: Phaser.GameObjects.Text;
  private repText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private catHappyText!: Phaser.GameObjects.Text;
  private dayBarFill!: Phaser.GameObjects.Graphics;
  private dayBarBg!: Phaser.GameObjects.Graphics;
  private ordersContainer!: Phaser.GameObjects.Container;

  private prevMoney = 0;
  private prevRep = 0;

  constructor() { super({ key: 'UIScene', active: false }); }

  create(): void {
    this.buildHUD();
    this.buildLegend();
    this.ordersContainer = this.add.container(GAME_W - 158, 58).setDepth(105);

    this.game.events.on('ui_update', (state: UIState) => this.applyState(state), this);
  }

  private buildHUD(): void {
    const PAD = 12;

    // ── Top panel ────────────────────────────────────────────────────────
    const topPanel = this.add.graphics();
    topPanel.fillStyle(COLORS.UI_PANEL, 0.9);
    topPanel.fillRoundedRect(PAD, PAD, GAME_W - PAD * 2, 44, 8);
    topPanel.lineStyle(1, COLORS.UI_GOLD, 0.5);
    topPanel.strokeRoundedRect(PAD, PAD, GAME_W - PAD * 2, 44, 8);

    // Coin icon + money
    this.add.sprite(32, 34, 'ui_coin').setDepth(110);
    this.moneyText = this.add.text(48, 34, '150', {
      fontSize: '16px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(110);

    // Star icon + reputation
    this.add.sprite(130, 34, 'ui_star').setDepth(110);
    this.repText = this.add.text(147, 34, '10', {
      fontSize: '15px', color: '#FFE566', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(110);

    // Heart icon + cat happiness
    this.add.sprite(210, 34, 'ui_heart').setDepth(110);
    this.catHappyText = this.add.text(227, 34, '80%', {
      fontSize: '15px', color: '#FF9AB0', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(110);

    // Day info (right side)
    this.dayText = this.add.text(GAME_W - PAD - 10, 21, 'Day 1', {
      fontSize: '15px', color: '#FFEEDD', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(110);

    this.phaseText = this.add.text(GAME_W - PAD - 10, 38, '☀ Morning', {
      fontSize: '11px', color: '#FFCC88', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(110);

    // Day progress bar
    const barW = 160, barH = 6;
    const barX = GAME_W / 2 - barW / 2;
    const barY = 19;

    this.dayBarBg = this.add.graphics().setDepth(109);
    this.dayBarBg.fillStyle(0x111111, 0.8);
    this.dayBarBg.fillRoundedRect(barX, barY, barW, barH, 3);

    this.dayBarFill = this.add.graphics().setDepth(110);
    this.drawDayBar(0);

    this.add.text(GAME_W / 2, barY + barH + 4, 'Day Progress', {
      fontSize: '9px', color: '#778899', fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(110);
  }

  private drawDayBar(progress: number): void {
    const barW = 160, barH = 6;
    const barX = GAME_W / 2 - barW / 2;
    const barY = 19;
    const phase = progress < 0.33 ? 0xFFCC66 : progress < 0.66 ? 0xFF9933 : 0x996699;

    this.dayBarFill.clear();
    if (progress > 0) {
      this.dayBarFill.fillStyle(phase, 1);
      this.dayBarFill.fillRoundedRect(barX, barY, Math.round(progress * barW), barH, 3);
    }
  }

  private buildLegend(): void {
    // Controls hint (bottom-right)
    const hints = [
      'WASD: Move',
      'E / Space: Interact',
      'Take orders → Cook → Serve',
    ];
    hints.forEach((h, i) => {
      this.add.text(GAME_W - 14, GAME_H - 14 - (hints.length - 1 - i) * 16, h, {
        fontSize: '10px', color: '#556677', fontFamily: 'monospace',
      }).setOrigin(1, 1).setDepth(105);
    });
  }

  private applyState(state: UIState): void {
    // Animate money change
    if (state.money !== this.prevMoney) {
      this.tweens.add({
        targets: this.moneyText,
        scaleX: 1.2, scaleY: 1.2,
        duration: 120, yoyo: true,
        onComplete: () => this.moneyText.setText(String(state.money)),
      });
      this.prevMoney = state.money;
    } else {
      this.moneyText.setText(String(state.money));
    }

    // Reputation flash on change
    if (state.reputation !== this.prevRep) {
      const color = state.reputation > this.prevRep ? '#FFE566' : '#FF6644';
      this.repText.setColor(color);
      this.time.delayedCall(600, () => this.repText.setColor('#FFE566'));
      this.prevRep = state.reputation;
    }
    this.repText.setText(String(state.reputation));

    this.catHappyText.setText(`${state.catHappiness}%`);
    // Color cat happiness
    const catColor = state.catHappiness > 60 ? '#FF9AB0' : state.catHappiness > 30 ? '#FFAA44' : '#FF4444';
    this.catHappyText.setColor(catColor);

    this.dayText.setText(`Day ${state.day}`);
    const phaseIcon = state.phase === 'morning' ? '☀' : state.phase === 'afternoon' ? '🌤' : state.phase === 'evening' ? '🌙' : '★';
    const phaseName = state.phase.charAt(0).toUpperCase() + state.phase.slice(1);
    this.phaseText.setText(`${phaseIcon} ${phaseName}`);

    this.drawDayBar(state.dayProgress);
    this.renderOrders(state.orders ?? []);
  }

  private renderOrders(orders: OrderInfo[]): void {
    this.ordersContainer.removeAll(true);
    if (orders.length === 0) return;

    const W = 148, PAD = 6;
    const rowH = 22;
    const panelH = 26 + orders.length * rowH + PAD;

    const bg = this.add.graphics();
    bg.fillStyle(COLORS.UI_PANEL, 0.9);
    bg.fillRoundedRect(0, 0, W, panelH, 6);
    bg.lineStyle(1, COLORS.UI_GOLD, 0.35);
    bg.strokeRoundedRect(0, 0, W, panelH, 6);

    const title = this.add.text(W / 2, 7, 'ORDERS', {
      fontSize: '9px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.ordersContainer.add([bg, title]);

    orders.slice(0, 6).forEach((order, i) => {
      const y = 24 + i * rowH;
      const { color, icon } = this.orderStatusDisplay(order.status);

      const nameText = this.add.text(PAD, y, `${icon} ${order.itemName}`, {
        fontSize: '9px', color, fontFamily: 'monospace',
      }).setOrigin(0, 0.5);
      this.ordersContainer.add(nameText);

      if (order.status === 'cooking') {
        const barW = 36;
        const barX = W - barW - PAD;
        const bar = this.add.graphics();
        bar.fillStyle(0x222222, 1);
        bar.fillRect(barX, y - 3, barW, 6);
        bar.fillStyle(0x44AADD, 1);
        bar.fillRect(barX, y - 3, Math.round(order.progress * barW), 6);
        this.ordersContainer.add(bar);
      }
    });
  }

  private orderStatusDisplay(status: OrderInfo['status']): { color: string; icon: string } {
    switch (status) {
      case 'queued':   return { color: '#888888', icon: '○' };
      case 'cooking':  return { color: '#88CCFF', icon: '◔' };
      case 'ready':    return { color: '#66FF88', icon: '●' };
      case 'carrying': return { color: '#FFD700', icon: '→' };
    }
  }
}
