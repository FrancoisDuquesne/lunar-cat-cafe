import Phaser from 'phaser';
import { CustomerType, MenuItemDef } from '../types';
import { TILE, MENU_ITEMS, COLORS } from '../constants';

// Waypoints that keep customers aligned with the door opening (cols 14-17)
const DOOR_INNER_Y  = 14 * TILE + TILE / 2; // row 14, just inside the café
const DOOR_CENTER_X = 15 * TILE + TILE / 2; // col 15 center — safely inside the door
const DOOR_EXIT_Y   = 15 * TILE + TILE / 2; // row 15, at the door when leaving

type CustomerAIState = 'walking_in' | 'seated' | 'waiting_order' | 'order_taken' | 'waiting_food' | 'eating' | 'walking_out' | 'gone';

export class Customer extends Phaser.Physics.Arcade.Sprite {
  readonly customerId: number;
  readonly customerType: CustomerType;

  aiState: CustomerAIState = 'walking_in';
  seatX = 0;
  seatY = 0;
  tableId = -1;
  order: MenuItemDef | null = null;

  patience = 100;         // 0–100; decreases while waiting
  happiness = 70;         // 0–100
  private patienceDrainRate = 0; // per ms, set after order is taken

  // Injected by GameScene — used to route around obstacles (e.g. island counter)
  pathFinder?: (fromX: number, fromY: number, toX: number, toY: number) => Array<{x: number; y: number}>;
  // Injected by GameScene — returns the effective menu for the current café tier
  getAvailableMenuItems?: () => MenuItemDef[];

  private stateTimer = 0;
  private speechBubble?: Phaser.GameObjects.Container;
  private patienceBar?: Phaser.GameObjects.Graphics;
  private exitX = 0;
  private exitY = 0;
  private waypoint: { x: number; y: number } | null = null;
  private navPath: Array<{x: number; y: number}> = [];

  constructor(scene: Phaser.Scene, x: number, y: number, id: number, type: CustomerType, seatX: number, seatY: number, exitX: number, exitY: number) {
    super(scene, x, y, `customer_${type}`);
    scene.add.existing(this);
    scene.physics.add.existing(this);

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
          this.walkToward(this.waypoint.x, this.waypoint.y, 80, delta);
          if (this.distTo(this.waypoint.x, this.waypoint.y) < 16) {
            this.waypoint = null;
            // Phase 2: compute A* path from door inner to seat
            this.navPath = this.pathFinder
              ? this.pathFinder(DOOR_CENTER_X, DOOR_INNER_Y, this.seatX, this.seatY)
              : [{ x: this.seatX, y: this.seatY }];
          }
        } else if (this.navPath.length > 0) {
          const next = this.navPath[0];
          this.walkToward(next.x, next.y, 80, delta);
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
          const menu = this.getAvailableMenuItems?.() ?? (MENU_ITEMS as unknown as MenuItemDef[]);
          this.order = menu[Math.floor(Math.random() * menu.length)];
          this.aiState = 'waiting_order';
          this.showOrderBubble();
        }
        break;

      case 'waiting_order':
        // Waiting for player to take order – no timer, just show bubble
        break;

      case 'order_taken':
        this.aiState = 'waiting_food';
        this.patienceDrainRate = 100 / ((this.order?.prepTime ?? 5000) * 6); // patience runs out 6× cook time
        break;

      case 'waiting_food':
        this.patience = Math.max(0, this.patience - this.patienceDrainRate * delta);
        this.updatePatienceBar();
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
          this.walkToward(next.x, next.y, 85, delta);
          if (this.distTo(next.x, next.y) < 16) this.navPath.shift();
        } else {
          // navPath exhausted (reached door threshold) — walk off-screen
          this.walkToward(this.exitX, this.exitY, 85, delta);
          if (this.distTo(this.exitX, this.exitY) < 10) {
            this.aiState = 'gone';
            this.setActive(false);
            this.setVisible(false);
          }
        }
        break;
    }

    this.setDepth(8 + this.y / 1000);

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
    this.patienceBar.clear();

    // Background
    this.patienceBar.fillStyle(0x333333, 1);
    this.patienceBar.fillRect(0, 0, 48, 6);

    // Fill color based on patience level
    const color = this.patience > 50 ? COLORS.UI_PATIENCE_OK : this.patience > 25 ? 0xFFAA33 : COLORS.UI_PATIENCE_LOW;
    this.patienceBar.fillStyle(color, 1);
    this.patienceBar.fillRect(1, 1, Math.round((this.patience / 100) * 46), 4);
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
    this.waypoint = null;
    // Route back to the door via A* so they navigate around the island
    this.navPath = this.pathFinder
      ? this.pathFinder(this.x, this.y, DOOR_CENTER_X, DOOR_EXIT_Y)
      : [{ x: DOOR_CENTER_X, y: DOOR_EXIT_Y }];
    this.patienceBar?.destroy();
    this.patienceBar = undefined;
    this.hideOrderBubble();
  }

  private walkToward(tx: number, ty: number, speed: number, _delta: number): void {
    const dx = tx - this.x, dy = ty - this.y;
    const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    this.setVel((dx/dist)*speed, (dy/dist)*speed);
  }

  private setVel(vx: number, vy: number): void {
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
  }

  private distTo(tx: number, ty: number): number {
    const dx = tx - this.x, dy = ty - this.y;
    return Math.sqrt(dx*dx + dy*dy);
  }

  getTip(): number {
    const base = this.order?.price ?? 0;
    const patienceBonus = Math.floor((this.patience / 100) * base * 0.5);
    const happinessBonus = Math.floor((this.happiness / 100) * base * 0.3);
    return Math.floor(base + patienceBonus + happinessBonus);
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
  }
}
