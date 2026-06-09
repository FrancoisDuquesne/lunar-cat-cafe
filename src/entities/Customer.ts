import Phaser from 'phaser';
import { CustomerType, MenuItemDef } from '../types';
import { TILE, MENU_ITEMS, COLORS } from '../constants';
import { BaseCharacter } from './BaseCharacter';

// Waypoints aligned with the door opening (cols 14–15, row 13)
const DOOR_INNER_Y  = 12 * TILE + TILE / 2; // row 12 — just inside the last dining row
const DOOR_CENTER_X = 14 * TILE + TILE / 2; // col 14 center — inside the door
const DOOR_EXIT_Y   = 13 * TILE + TILE / 2; // row 13 — at the door when leaving

type CustomerAIState = 'walking_in' | 'seated' | 'waiting_order' | 'order_taken' | 'waiting_food' | 'eating' | 'walking_out' | 'gone';

export class Customer extends BaseCharacter {
  readonly customerId: number;
  readonly customerType: CustomerType;

  aiState: CustomerAIState = 'walking_in';
  seatX = 0;
  seatY = 0;
  tableId = -1;
  order: MenuItemDef | null = null;

  patience = 100;         // 0–100; decreases while waiting
  happiness = 70;         // 0–100
  tipMultiplier = 1;      // VIP customers use 3×
  private patienceDrainRate = 0; // per ms, set after order is taken

  // Injected by GameScene — returns the effective menu for the current café tier
  getAvailableMenuItems?: () => MenuItemDef[];
  // Fired the moment the customer starts walking out, so GameScene can free their station
  onBeginLeave?: (customerId: number) => void;

  private stateTimer = 0;
  private speechBubble?: Phaser.GameObjects.Container;
  private patienceBar?: Phaser.GameObjects.Graphics;
  private angryEmote?: Phaser.GameObjects.Text;
  private angryShakeTimer = 0;
  private wasAngry = false;
  private exitX = 0;
  private exitY = 0;
  private waypoint: { x: number; y: number } | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, id: number, type: CustomerType, seatX: number, seatY: number, exitX: number, exitY: number) {
    super(scene, x, y, `customer_${type}`);

    this.customerId = id;
    this.customerType = type;
    this.seatX = seatX;
    this.seatY = seatY;
    this.exitX = exitX;
    this.exitY = exitY;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(10, 12);
    body.setOffset(3, 12);
    this.setOrigin(0.5, 0.9);
    this.setDepth(8);

    // Walk straight up through the door before heading to seat
    this.waypoint = { x, y: DOOR_INNER_Y };
    // Order is picked when seated, using the injected getAvailableMenuItems callback
  }

  update(delta: number): void {
    switch (this.aiState) {
      case 'walking_in':
        if (this.waypoint) {
          // Phase 1: walk through the door to the inner threshold
          this.walkToward(this.waypoint.x, this.waypoint.y, 80);
          if (this.distTo(this.waypoint.x, this.waypoint.y) < 16) {
            this.waypoint = null;
            // Phase 2: compute A* path from door inner to seat
            this.navPath = this.pathFinder
              ? this.pathFinder(DOOR_CENTER_X, DOOR_INNER_Y, this.seatX, this.seatY)
              : [{ x: this.seatX, y: this.seatY }];
          }
        } else if (this.navPath.length > 0) {
          const next = this.navPath[0];
          this.walkToward(next.x, next.y, 80);
          if (this.distTo(next.x, next.y) < 20) {
            this.navPath.shift();
            if (this.navPath.length === 0) this.arrive();
          }
        } else {
          this.arrive();
        }
        break;

      case 'seated':
        this.setVel(0, 0);
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) {
          const menu = this.getAvailableMenuItems?.() ?? (MENU_ITEMS as readonly MenuItemDef[]);
          if (menu.length === 0) { this.beginLeave(); break; }
          this.order = menu[Math.floor(Math.random() * menu.length)];
          this.aiState = 'waiting_order';
          this.showOrderBubble();
        }
        break;

      case 'waiting_order':
        // Slow drain — customer leaves if ignored for ~90 seconds (VIP drains 2× faster)
        this.patience = Math.max(0, this.patience - delta * 0.0011 * (this.tipMultiplier > 1 ? 2 : 1));
        this.updatePatienceBar();
        if (this.patience <= 0) {
          this.happiness = 20;
          this.beginLeave();
        }
        break;

      case 'order_taken':
        this.aiState = 'waiting_food';
        this.patienceDrainRate = 100 / ((this.order?.prepTime ?? 5000) * 6); // patience runs out 6× cook time
        break;

      case 'waiting_food':
        this.patience = Math.max(0, this.patience - this.patienceDrainRate * delta);
        this.updatePatienceBar();
        this.updateAngryShake(delta);
        if (this.patience <= 0) {
          // Lost patience – walk out unhappy
          this.happiness = 20;
          this.beginLeave();
        }
        break;

      case 'eating':
        this.stateTimer -= delta;
        if (this.stateTimer <= 0) {
          this.beginLeave();
        }
        break;

      case 'walking_out':
        if (this.navPath.length > 0) {
          const next = this.navPath[0];
          this.walkToward(next.x, next.y, 85);
          if (this.distTo(next.x, next.y) < 16) this.navPath.shift();
        } else {
          // navPath exhausted (reached door threshold) — walk off-screen
          this.walkToward(this.exitX, this.exitY, 85);
          if (this.distTo(this.exitX, this.exitY) < 10) {
            this.aiState = 'gone';
            this.setActive(false);
            this.setVisible(false);
          }
        }
        break;
    }

    this.updateYDepth(8);

    // Update speech bubble position
    if (this.speechBubble) {
      this.speechBubble.setPosition(this.x - 18, this.y - 48);
    }
    if (this.patienceBar) {
      this.patienceBar.setPosition(this.x - 24, this.y - 34);
    }
  }

  private arrive(): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.setPosition(this.seatX, this.seatY);
    this.aiState = 'seated';
    this.stateTimer = Phaser.Math.Between(800, 2000);
  }

  showOrderBubble(): void {
    if (this.speechBubble) return;
    if (!this.order) return;

    const container = this.scene.add.container(this.x - 18, this.y - 48);
    container.setDepth(50);

    const bg = this.scene.add.sprite(0, 0, 'ui_order_bubble');
    bg.setOrigin(0, 0);

    const food = this.scene.add.sprite(10, 6, `food_${this.order.id}`);
    food.setOrigin(0.5, 0.5).setScale(0.85);

    container.add([bg, food]);

    // Pop in animation
    container.setScale(0);
    this.scene.tweens.add({
      targets: container,
      scaleX: 1, scaleY: 1,
      duration: 250,
      ease: 'Back.easeOut',
    });

    this.speechBubble = container;

    // Create patience bar
    this.patienceBar = this.scene.add.graphics();
    this.patienceBar.setDepth(51);
    this.patienceBar.setPosition(this.x - 24, this.y - 34);
    this.updatePatienceBar();
  }

  private updatePatienceBar(): void {
    if (!this.patienceBar) return;
    this.patienceBar.setPosition(this.x - 24, this.y - 34);
    this.patienceBar.clear();

    // Background
    this.patienceBar.fillStyle(0x333333, 1);
    this.patienceBar.fillRect(0, 0, 48, 6);

    // Fill color based on patience level
    const color = this.patience > 50 ? COLORS.UI_PATIENCE_OK : this.patience > 25 ? 0xFFAA33 : COLORS.UI_PATIENCE_LOW;
    this.patienceBar.fillStyle(color, 1);
    this.patienceBar.fillRect(1, 1, Math.round((this.patience / 100) * 46), 4);
  }

  private updateAngryShake(delta: number): void {
    const critical = this.patience < 20;

    if (critical && !this.wasAngry) {
      // First time dropping below 20% — show angry emote
      this.wasAngry = true;
      if (!this.angryEmote) {
        this.angryEmote = this.scene.add.text(this.x + 12, this.y - 52, '!!', {
          fontSize: '11px', color: '#FF3333', fontFamily: 'monospace', fontStyle: 'bold',
          stroke: '#000000', strokeThickness: 2,
        }).setDepth(52).setOrigin(0.5);
      }
    }

    if (critical) {
      this.angryShakeTimer -= delta;
      if (this.angryShakeTimer <= 0) {
        this.angryShakeTimer = 300;
        const ox = Phaser.Math.Between(-1, 1);
        this.scene.tweens.add({
          targets: this, x: this.x + ox * 2, duration: 60, yoyo: true, repeat: 2,
        });
      }
      if (this.angryEmote) {
        this.angryEmote.setPosition(this.x + 12, this.y - 52);
      }
    } else if (this.angryEmote) {
      this.angryEmote.destroy();
      this.angryEmote = undefined;
    }
  }

  takeOrder(): void {
    if (this.aiState !== 'waiting_order') return;
    this.aiState = 'order_taken';
    this.hideOrderBubble();
  }

  hideOrderBubble(): void {
    if (this.speechBubble) {
      this.scene.tweens.add({
        targets: this.speechBubble,
        scaleX: 0, scaleY: 0,
        duration: 150,
        onComplete: () => { this.speechBubble?.destroy(); this.speechBubble = undefined; },
      });
    }
  }

  receiveFood(): void {
    this.hideOrderBubble();
    this.patienceBar?.destroy();
    this.patienceBar = undefined;

    // Calculate happiness based on patience remaining
    const patienceBonus = Math.floor(this.patience * 0.3);
    this.happiness = Math.min(100, 70 + patienceBonus);
    this.aiState = 'eating';
    this.stateTimer = Phaser.Math.Between(4000, 8000);

    // Happy eating animation
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.05, scaleY: 0.95,
      duration: 150,
      yoyo: true,
      repeat: 3,
    });

    // Show floating coin
    this.showFloatingText(`+${this.getTip()}`, COLORS.UI_GOLD);
  }

  beginLeave(): void {
    this.aiState = 'walking_out';
    this.onBeginLeave?.(this.customerId);
    this.waypoint = null;
    // Route back to the door via A* so they navigate around the island
    this.navPath = this.pathFinder
      ? this.pathFinder(this.x, this.y, DOOR_CENTER_X, DOOR_EXIT_Y)
      : [{ x: DOOR_CENTER_X, y: DOOR_EXIT_Y }];
    this.patienceBar?.destroy();
    this.patienceBar = undefined;
    this.angryEmote?.destroy();
    this.angryEmote = undefined;
    this.hideOrderBubble();
  }


  getTip(): number {
    const base = this.order?.price ?? 0;
    const patienceBonus = Math.floor((this.patience / 100) * base * 0.5);
    const happinessBonus = Math.floor((this.happiness / 100) * base * 0.3);
    return Math.floor((base + patienceBonus + happinessBonus) * this.tipMultiplier);
  }

  private showFloatingText(text: string, color: number): void {
    const hex = `#${color.toString(16).padStart(6, '0')}`;
    const t = this.scene.add.text(this.x, this.y - 10, text, {
      fontSize: '12px', color: hex, fontFamily: 'monospace', fontStyle: 'bold',
    }).setDepth(100).setOrigin(0.5);

    this.scene.tweens.add({
      targets: t,
      y: t.y - 28,
      alpha: 0,
      duration: 1200,
      ease: 'Quad.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  boostHappiness(amount: number): void {
    this.happiness = Math.min(100, this.happiness + amount);
  }

  cleanup(): void {
    this.speechBubble?.destroy();
    this.patienceBar?.destroy();
    this.angryEmote?.destroy();
  }
}
