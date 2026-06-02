import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS, DECORATION_ITEMS, DecorationCategory, DecorationDef } from '../constants';
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
  ambiance?: number;
  tierName?: string;
  tierLevel?: number;
}

export class UIScene extends Phaser.Scene {
  private moneyText!: Phaser.GameObjects.Text;
  private repText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private catHappyText!: Phaser.GameObjects.Text;
  private tierText!: Phaser.GameObjects.Text;
  private ambianceText!: Phaser.GameObjects.Text;
  private dayBarFill!: Phaser.GameObjects.Graphics;
  private dayBarBg!: Phaser.GameObjects.Graphics;
  private ordersContainer!: Phaser.GameObjects.Container;

  private prevMoney = 0;
  private prevRep = 0;

  // Decoration panel state
  private decorPanel?: Phaser.GameObjects.Container;
  private decorPanelOpen = false;
  private decorActiveTab: DecorationCategory = 'furniture';
  private decorPanelMoney = 0;

  constructor() { super({ key: 'UIScene', active: false }); }

  create(): void {
    this.buildHUD();
    this.buildLegend();
    this.buildMenuButton();
    this.buildDecorButton();
    this.ordersContainer = this.add.container(0, 58).setDepth(105);

    this.game.events.on('ui_update', (state: UIState) => this.applyState(state), this);
    this.game.events.on('game_event', (evt: { type: string; tierName?: string; tierLevel?: number }) => {
      if (evt.type === 'open_decorate_panel') this.openDecorationPanel();
      else if (evt.type === 'close_decorate_panel' && this.decorPanelOpen) this.closeDecorationPanel();
      else if (evt.type === 'tier_changed' && evt.tierName) {
        this.tierText?.setText(evt.tierName);
      }
    }, this);

    // D key toggles decoration panel
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D).on('down', () => {
      if (this.decorPanelOpen) this.closeDecorationPanel();
      else this.openDecorationPanel();
    });
  }

  private buildHUD(): void {
    const PAD = 12;

    // ── Top panel ────────────────────────────────────────────────────────
    const topPanel = this.add.graphics();
    topPanel.fillStyle(COLORS.UI_PANEL, 0.93);
    topPanel.fillRoundedRect(PAD, PAD, GAME_W - PAD * 2, 44, 8);
    topPanel.lineStyle(1, COLORS.UI_GOLD, 0.75);
    topPanel.strokeRoundedRect(PAD, PAD, GAME_W - PAD * 2, 44, 8);
    topPanel.lineStyle(1, COLORS.UI_GOLD, 0.18);
    topPanel.strokeRoundedRect(PAD + 2, PAD + 2, GAME_W - PAD * 2 - 4, 40, 6);

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

    // Tier badge — center-right area
    this.tierText = this.add.text(GAME_W / 2 + 130, 24, 'Space Shack', {
      fontSize: '11px', color: '#FFDD88', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(110);
    this.ambianceText = this.add.text(GAME_W / 2 + 130, 38, '✦ 0 ambiance', {
      fontSize: '9px', color: '#AA9966', fontFamily: 'monospace',
    }).setOrigin(0, 0.5).setDepth(110);

    // Day info (right side) — shifted left to leave room for menu button
    this.dayText = this.add.text(GAME_W - PAD - 52, 21, 'Day 1', {
      fontSize: '15px', color: '#FFEEDD', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(110);

    this.phaseText = this.add.text(GAME_W - PAD - 52, 38, '☀ Morning', {
      fontSize: '11px', color: '#FFCC88', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(110);

    // Day progress bar
    const barW = 160, barH = 6;
    const barX = GAME_W / 2 - barW / 2;
    const barY = 19;

    this.dayBarBg = this.add.graphics().setDepth(109);
    this.dayBarBg.fillStyle(0x080412, 0.9);
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
      'WASD/Arrows or Tap: Move',
      'E / Space or Tap: Interact',
      'D: Decorate',
    ];
    hints.forEach((h, i) => {
      this.add.text(GAME_W - 14, GAME_H - 14 - (hints.length - 1 - i) * 16, h, {
        fontSize: '10px', color: '#556677', fontFamily: 'monospace',
      }).setOrigin(1, 1).setDepth(105);
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // DECORATE BUTTON
  // ─────────────────────────────────────────────────────────────────────

  private buildDecorButton(): void {
    const PAD = 12;
    const cx = GAME_W - PAD - 20 - 42; // left of the menu button
    const cy = PAD + 22;
    const W = 36, H = 40;

    const bg = this.add.graphics().setDepth(111);
    const draw = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? 0x004466 : COLORS.UI_PANEL_LIGHT, hover ? 0.95 : 0.85);
      bg.fillRoundedRect(cx - W / 2, PAD + 2, W, H, 5);
      bg.lineStyle(1, 0x44DDFF, hover ? 1 : 0.4);
      bg.strokeRoundedRect(cx - W / 2, PAD + 2, W, H, 5);
    };
    draw(false);

    this.add.text(cx, cy, '✦', {
      fontSize: '16px', color: '#44DDFF', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(112);

    const zone = this.add.zone(cx, cy, W, H).setInteractive({ useHandCursor: true }).setDepth(113);
    zone.on('pointerover', () => draw(true));
    zone.on('pointerout', () => draw(false));
    zone.on('pointerdown', () => {
      if (this.decorPanelOpen) this.closeDecorationPanel();
      else this.openDecorationPanel();
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // DECORATION PANEL
  // ─────────────────────────────────────────────────────────────────────

  private openDecorationPanel(): void {
    if (this.decorPanelOpen) return;
    this.decorPanelOpen = true;
    this.game.events.emit('game_event', { type: 'open_decorate_panel' });
    this.buildDecorationPanel();
  }

  private closeDecorationPanel(): void {
    if (!this.decorPanelOpen) return;
    this.decorPanelOpen = false;
    this.game.events.emit('game_event', { type: 'close_decorate_panel' });
    if (this.decorPanel) {
      this.tweens.add({
        targets: this.decorPanel, x: GAME_W + 10, duration: 220, ease: 'Quad.easeIn',
        onComplete: () => { this.decorPanel?.destroy(); this.decorPanel = undefined; },
      });
    }
  }

  private buildDecorationPanel(): void {
    const PW = 210;
    const PH = GAME_H - 58;
    const startX = GAME_W + PW;
    const targetX = GAME_W - PW;

    const container = this.add.container(startX, 58).setDepth(115);
    this.decorPanel = container;

    // Background
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.UI_PANEL, 0.97);
    bg.fillRoundedRect(0, 0, PW, PH, { tl: 8, tr: 0, br: 0, bl: 8 });
    bg.lineStyle(1, COLORS.UI_GOLD, 0.7);
    bg.strokeRoundedRect(0, 0, PW, PH, { tl: 8, tr: 0, br: 0, bl: 8 });
    container.add(bg);

    // Title
    container.add(this.add.text(PW / 2, 14, '✦ DECORATE', {
      fontSize: '13px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0));
    container.add(this.add.text(PW / 2, 30, 'Tap tile to place • tap placed to sell', {
      fontSize: '8px', color: '#666655', fontFamily: 'monospace',
    }).setOrigin(0.5, 0));

    // Separator
    const sep = this.add.graphics();
    sep.lineStyle(1, COLORS.UI_GOLD, 0.3);
    sep.lineBetween(8, 44, PW - 8, 44);
    container.add(sep);

    // Tabs
    const tabs: DecorationCategory[] = ['furniture', 'lighting', 'plants', 'wallDecor', 'specialty'];
    const tabLabels: Record<DecorationCategory, string> = {
      furniture: 'Furn', lighting: 'Light', plants: 'Plant', wallDecor: 'Wall', specialty: 'Spec',
    };
    const tabW = Math.floor((PW - 8) / tabs.length);
    const tabGfx = this.add.graphics();
    container.add(tabGfx);
    const tabTexts: Phaser.GameObjects.Text[] = [];
    const drawTabs = () => {
      tabGfx.clear();
      tabs.forEach((tab, i) => {
        const tx = 4 + i * tabW;
        const active = tab === this.decorActiveTab;
        tabGfx.fillStyle(active ? COLORS.UI_PANEL_LIGHT : 0x080412, active ? 1 : 0.7);
        tabGfx.fillRoundedRect(tx, 46, tabW - 2, 22, 3);
        tabGfx.lineStyle(1, active ? COLORS.UI_GOLD : 0x333322, 1);
        tabGfx.strokeRoundedRect(tx, 46, tabW - 2, 22, 3);
        if (tabTexts[i]) tabTexts[i].setColor(active ? '#FFD700' : '#777766');
      });
    };
    tabs.forEach((tab, i) => {
      const tx = 4 + i * tabW + tabW / 2;
      const t = this.add.text(tx, 57, tabLabels[tab], {
        fontSize: '8px', color: '#777766', fontFamily: 'monospace',
      }).setOrigin(0.5, 0.5);
      tabTexts.push(t);
      container.add(t);

      const zone = this.add.zone(4 + i * tabW + tabW / 2, 57, tabW - 2, 22)
        .setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => {
        this.decorActiveTab = tab;
        drawTabs();
        this.refreshDecorItems(container, PW);
      });
      container.add(zone);
    });
    drawTabs();

    this.refreshDecorItems(container, PW);

    // Close button
    const closeBtn = this.add.text(PW - 10, 6, '✕', {
      fontSize: '14px', color: '#887766', fontFamily: 'monospace',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#FFDDAA'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#887766'));
    closeBtn.on('pointerdown', () => this.closeDecorationPanel());
    container.add(closeBtn);

    // Slide in
    this.tweens.add({ targets: container, x: targetX, duration: 250, ease: 'Quad.easeOut' });
  }

  private refreshDecorItems(container: Phaser.GameObjects.Container, PW: number): void {
    // Remove old item children (tagged with 'decor_item')
    const toRemove = container.list.filter(c => (c as any).getData?.('decor_item'));
    toRemove.forEach(c => { container.remove(c, true); });

    const items = DECORATION_ITEMS.filter(d => d.category === this.decorActiveTab);
    const IH = 82;
    const startY = 72;

    items.forEach((item, i) => {
      const iy = startY + i * IH;
      this.buildDecorItemRow(container, item, PW, iy);
    });
  }

  private buildDecorItemRow(container: Phaser.GameObjects.Container, item: DecorationDef, PW: number, y: number): void {
    const IH = this.IH;
    const tag = (obj: Phaser.GameObjects.GameObject) => { (obj as any).setData('decor_item', true); return obj; };

    const rowBg = this.add.graphics();
    rowBg.fillStyle(COLORS.UI_PANEL_LIGHT, 0.6);
    rowBg.fillRoundedRect(6, y, PW - 12, IH - 4, 4);
    rowBg.lineStyle(1, 0x2A2040, 1);
    rowBg.strokeRoundedRect(6, y, PW - 12, IH - 4, 4);
    container.add(tag(rowBg));

    // Sprite preview
    const spr = this.add.image(28, y + (IH - 4) / 2, item.spriteKey).setScale(0.85);
    container.add(tag(spr));

    // Name
    container.add(tag(this.add.text(52, y + 10, item.name, {
      fontSize: '9px', color: '#FFEEDD', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0)));

    // Ambiance
    container.add(tag(this.add.text(52, y + 24, `+${item.ambianceValue} ambiance`, {
      fontSize: '8px', color: '#FFDD44', fontFamily: 'monospace',
    }).setOrigin(0, 0)));

    // Cost
    const canAfford = this.decorPanelMoney >= item.cost;
    container.add(tag(this.add.text(52, y + 38, `${item.cost} ✦`, {
      fontSize: '10px', color: canAfford ? '#FFD700' : '#776644', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0, 0)));

    // Place button
    const btnW = 50, btnH = 20;
    const btnX = PW - 20;
    const btnY = y + (IH - 4) / 2;
    const btnBg = this.add.graphics();
    const drawBtn = (hover: boolean) => {
      btnBg.clear();
      if (!canAfford) {
        btnBg.fillStyle(0x221810, 1);
        btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);
        return;
      }
      btnBg.fillStyle(hover ? 0x665500 : 0x443300, 1);
      btnBg.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);
      btnBg.lineStyle(1, COLORS.UI_GOLD, hover ? 1 : 0.6);
      btnBg.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 4);
    };
    drawBtn(false);
    container.add(tag(btnBg));

    const btnTxt = this.add.text(btnX, btnY, 'PLACE', {
      fontSize: '8px', color: canAfford ? '#FFD700' : '#443322', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    container.add(tag(btnTxt));

    if (canAfford) {
      const zone = this.add.zone(btnX, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => drawBtn(true));
      zone.on('pointerout', () => drawBtn(false));
      zone.on('pointerdown', () => {
        this.game.events.emit('game_event', { type: 'start_placement', defId: item.id });
      });
      container.add(tag(zone));
    }
  }

  private get IH(): number { return 82; }

  private buildMenuButton(): void {
    const PAD = 12;
    const cx = GAME_W - PAD - 20;
    const cy = PAD + 22;
    const W = 36, H = 40;

    const bg = this.add.graphics().setDepth(111);
    const draw = (hover: boolean) => {
      bg.clear();
      bg.fillStyle(hover ? 0x664400 : COLORS.UI_PANEL_LIGHT, hover ? 0.95 : 0.85);
      bg.fillRoundedRect(cx - W / 2, PAD + 2, W, H, 5);
      bg.lineStyle(1, COLORS.UI_GOLD, hover ? 1 : 0.55);
      bg.strokeRoundedRect(cx - W / 2, PAD + 2, W, H, 5);
    };
    draw(false);

    this.add.text(cx, cy, '☰', {
      fontSize: '16px', color: '#FFD700', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(112);

    const zone = this.add.zone(cx, cy, W, H).setInteractive({ useHandCursor: true }).setDepth(113);
    zone.on('pointerover', () => draw(true));
    zone.on('pointerout', () => draw(false));
    zone.on('pointerdown', () => { draw(true); this.game.events.emit('go_menu'); });
    zone.on('pointerup', () => draw(false));
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

    if (state.tierName) this.tierText?.setText(state.tierName);
    if (state.ambiance !== undefined) this.ambianceText?.setText(`✦ ${state.ambiance} ambiance`);

    // Keep decoration panel money in sync
    this.decorPanelMoney = state.money;
  }

  private renderOrders(orders: OrderInfo[]): void {
    this.ordersContainer.removeAll(true);
    if (orders.length === 0) return;

    const TW = 112;   // ticket width
    const BODY_H = 68;
    const TEAR_MAX = 10;
    const RAIL_H = 9;
    const GAP = 5;
    const shown = orders.slice(0, 5);

    // Centre the rail horizontally
    const totalW = shown.length * TW + (shown.length - 1) * GAP;
    this.ordersContainer.setX(Math.round((GAME_W - totalW) / 2));

    // ── Clip rail ────────────────────────────────────────────────────────
    const rail = this.add.graphics();
    rail.fillStyle(0x8A8A9A, 1);
    rail.fillRect(0, 0, totalW, RAIL_H);
    rail.fillStyle(0xCCCCDD, 0.55);
    rail.fillRect(2, 1, totalW - 4, 2);
    rail.fillStyle(0x444455, 1);
    rail.fillRect(0, RAIL_H - 1, totalW, 1);
    this.ordersContainer.add(rail);

    shown.forEach((order, i) => {
      const tx = i * (TW + GAP);
      const si = this.orderStatusDisplay(order.status);
      const tearPts = this.makeTearPoints(order.customerId, TW, TEAR_MAX);
      const fringePts = tearPts.map(p => ({ x: tx + p.x, y: RAIL_H + BODY_H + p.y }));

      // Pin clip above this ticket
      rail.fillStyle(0x666677, 1);
      rail.fillRect(tx + Math.round(TW / 2) - 3, RAIL_H, 6, 5);
      rail.fillStyle(0xAAAABB, 0.6);
      rail.fillRect(tx + Math.round(TW / 2) - 2, RAIL_H + 1, 4, 1);

      // Shadow
      const shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.16);
      shadow.fillRect(tx + 3, RAIL_H + 2, TW, BODY_H + TEAR_MAX);
      this.ordersContainer.add(shadow);

      // Paper
      const paper = this.add.graphics();

      paper.fillStyle(0xFFFAEE, 1);
      paper.fillRect(tx, RAIL_H, TW, BODY_H);

      // Torn fringe
      paper.fillStyle(0xFFFAEE, 1);
      paper.fillPoints(fringePts, true);

      // Ruled lines
      paper.lineStyle(1, 0xE8DEC8, 0.5);
      for (let ry = RAIL_H + 18; ry < RAIL_H + BODY_H - 2; ry += 11) {
        paper.beginPath(); paper.moveTo(tx + 7, ry); paper.lineTo(tx + TW - 7, ry); paper.strokePath();
      }

      // Status colour strip
      paper.fillStyle(si.stripColor, 0.9);
      paper.fillRect(tx, RAIL_H, 5, BODY_H);

      // Top fold line
      paper.fillStyle(0xCCBB99, 1);
      paper.fillRect(tx, RAIL_H, TW, 1);

      // Pin hole
      paper.fillStyle(0x000000, 0.18);
      paper.fillCircle(tx + TW / 2, RAIL_H + 5, 3.5);
      paper.fillStyle(0xFFFAEE, 1);
      paper.fillCircle(tx + TW / 2, RAIL_H + 5, 2);

      // Torn edge stroke
      paper.lineStyle(1, 0xBBAA88, 1);
      paper.beginPath();
      fringePts.forEach((p, j) => { j === 0 ? paper.moveTo(p.x, p.y) : paper.lineTo(p.x, p.y); });
      paper.strokePath();

      this.ordersContainer.add(paper);

      // Table number badge (top-right corner)
      const tableLabel = `T${order.tableId + 1}`;
      const tableBadge = this.add.graphics();
      tableBadge.fillStyle(0x334466, 0.88);
      tableBadge.fillRoundedRect(tx + TW - 26, RAIL_H + 3, 21, 13, 3);
      this.ordersContainer.add(tableBadge);
      this.ordersContainer.add(
        this.add.text(tx + TW - 15, RAIL_H + 10, tableLabel, {
          fontSize: '8px', color: '#AACCFF', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0.5, 0.5)
      );

      // Item name
      const nameY = RAIL_H + (order.status === 'cooking' ? 18 : 24);
      this.ordersContainer.add(
        this.add.text(tx + 9, nameY, order.itemName, {
          fontSize: '8px', color: '#2A1A08', fontFamily: 'monospace', fontStyle: 'bold',
        }).setOrigin(0, 0.5)
      );

      // Status label
      const statusY = RAIL_H + (order.status === 'cooking' ? 30 : 36);
      this.ordersContainer.add(
        this.add.text(tx + 9, statusY, si.label, {
          fontSize: '8px', color: si.textColor, fontFamily: 'monospace',
        }).setOrigin(0, 0.5)
      );

      // Station type (bottom-right of ticket)
      this.ordersContainer.add(
        this.add.text(tx + TW - 7, RAIL_H + BODY_H - 9, order.stationType, {
          fontSize: '7px', color: '#998877', fontFamily: 'monospace',
        }).setOrigin(1, 0.5)
      );

      // Cook progress bar
      if (order.status === 'cooking') {
        const barW = TW - 14;
        const barY = RAIL_H + 43;
        const prog = this.add.graphics();
        prog.fillStyle(0xDDD0BB, 1);
        prog.fillRect(tx + 7, barY, barW, 5);
        prog.fillStyle(0x5599CC, 1);
        prog.fillRect(tx + 7, barY, Math.round(order.progress * barW), 5);
        this.ordersContainer.add(prog);
      }
    });
  }

  private makeTearPoints(seed: number, width: number, maxH: number): { x: number; y: number }[] {
    const N = 14;
    const pts: { x: number; y: number }[] = [{ x: 0, y: 0 }];
    let rng = (seed * 2654435761) >>> 0;
    for (let i = 1; i < N; i++) {
      rng = ((rng * 1664525 + 1013904223) >>> 0);
      const frac = (rng & 0xFFFF) / 0x10000;
      const x = (i / N) * width;
      const y = i % 2 === 1
        ? maxH * (0.55 + frac * 0.45)
        : maxH * frac * 0.3;
      pts.push({ x, y });
    }
    pts.push({ x: width, y: 0 });
    return pts;
  }

  private orderStatusDisplay(status: OrderInfo['status']): {
    label: string; textColor: string; stripColor: number;
  } {
    switch (status) {
      case 'queued':   return { label: 'waiting',   textColor: '#887760', stripColor: 0x998877 };
      case 'cooking':  return { label: 'cooking',   textColor: '#336699', stripColor: 0x5599CC };
      case 'ready':    return { label: '** READY',  textColor: '#226633', stripColor: 0x44BB66 };
      case 'carrying': return { label: '> serving', textColor: '#886600', stripColor: 0xCCAA00 };
    }
  }
}
