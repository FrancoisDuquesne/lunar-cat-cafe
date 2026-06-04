import Phaser from 'phaser';
import { CatPersonality, CatState as CatStateData } from '../types';

type CatAIState = 'sleeping' | 'waking' | 'wandering' | 'sitting' | 'approaching_customer';

interface WanderTarget { x: number; y: number }

export class Cat extends Phaser.Physics.Arcade.Sprite {
  readonly catId: number;
  readonly catName: string;
  readonly personality: CatPersonality;
  readonly colorKey: string;

  private aiState: CatAIState = 'sleeping';
  private stateTimer = 0;
  private wanderTarget: WanderTarget | null = null;
  private approachTarget: { x: number; y: number; id: number } | null = null;

  // Stats
  hunger = 80;
  happiness = 80;
  energy = 100;

  // Bounds the cat stays within
  private bounds!: Phaser.Geom.Rectangle;
  private bedX: number;
  private bedY: number;

  // Particle emitters for purring hearts when happy
  private heartEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
  private sleepZTimer = 0;
  private sleepZText?: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    data: CatStateData,
    bounds: Phaser.Geom.Rectangle,
  ) {
    super(scene, x, y, `cat_${data.colorKey}_sleep`);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.catId = data.id;
    this.catName = data.name;
    this.personality = data.personality;
    this.colorKey = data.colorKey;
    this.hunger = data.hunger;
    this.happiness = data.happiness;
    this.energy = data.energy;
    this.bounds = bounds;
    this.bedX = x;
    this.bedY = y;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(14, 10);
    body.setOffset(3, 4);
    this.setOrigin(0.5, 0.8);
    this.setDepth(5);

    // Start sleeping
    this.stateTimer = Phaser.Math.Between(3000, 8000);
    if (this.personality === 'explorer') {
      this.stateTimer = 1000; // explorers wake up quick
    }

    // Sleeping zz text
    this.sleepZText = scene.add.text(x + 8, y - 12, 'z z', {
      fontSize: '8px', color: '#aaccdd', fontFamily: 'monospace',
    }).setAlpha(0).setDepth(20);
  }

  update(delta: number, customerPositions: Array<{ x: number; y: number; id: number }>): void {
    this.stateTimer -= delta;
    this.sleepZTimer -= delta;

    // Passive stat decay — slow enough to last most of a 5-minute day
    this.hunger = Math.max(0, this.hunger - delta * 0.00025);
    this.energy = Math.max(0, Math.min(100, this.energy + (this.aiState === 'sleeping' ? delta * 0.02 : -delta * 0.005)));

    // Low hunger → sadder (gradual, not instant)
    if (this.hunger < 20) {
      this.happiness = Math.max(0, this.happiness - delta * 0.0003);
    }

    switch (this.aiState) {
      case 'sleeping':
        this.handleSleeping(delta);
        break;
      case 'waking':
        this.handleWaking(delta);
        break;
      case 'wandering':
        this.handleWandering(delta, customerPositions);
        break;
      case 'sitting':
        this.handleSitting(delta, customerPositions);
        break;
      case 'approaching_customer':
        this.handleApproachingCustomer(delta);
        break;
    }

    this.setDepth(5 + this.y / 1000);

    // Update z-text
    if (this.sleepZText) {
      this.sleepZText.setPosition(this.x + 8, this.y - 12);
    }
  }

  private handleSleeping(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.setTexture(`cat_${this.colorKey}_sleep`);

    // Sleeping z animation
    if (this.sleepZTimer <= 0) {
      this.sleepZTimer = 2000;
      if (this.sleepZText) {
        this.sleepZText.setAlpha(0.8).setPosition(this.x + 8, this.y - 12);
        this.scene.tweens.add({
          targets: this.sleepZText,
          alpha: 0, y: this.sleepZText.y - 12,
          duration: 1800, ease: 'Quad.easeIn',
        });
      }
    }

    if (this.stateTimer <= 0) {
      const shouldWake = this.energy > 30 || this.personality === 'explorer';
      if (shouldWake) {
        this.aiState = 'waking';
        this.stateTimer = 800;
      } else {
        this.stateTimer = Phaser.Math.Between(4000, 10000);
      }
    }
  }

  private handleWaking(_delta: number): void {
    if (this.stateTimer <= 0) {
      this.aiState = 'wandering';
      this.pickNewWanderTarget();
    }
  }

  private handleWandering(delta: number, customerPositions: Array<{ x: number; y: number; id: number }>): void {
    this.setTexture(`cat_${this.colorKey}`);

    if (!this.wanderTarget) {
      this.pickNewWanderTarget();
      return;
    }

    const dx = this.wanderTarget.x - this.x;
    const dy = this.wanderTarget.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 8) {
      // Reached target
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      this.wanderTarget = null;

      // Decide next action
      const roll = Math.random();
      if (roll < 0.3 && this.energy < 60) {
        this.aiState = 'sleeping';
        this.stateTimer = Phaser.Math.Between(4000, 10000);
      } else if (roll < 0.5 && customerPositions.length > 0 && this.personality === 'friendly') {
        // Friendly cats go toward customers
        const target = customerPositions[Math.floor(Math.random() * customerPositions.length)];
        this.approachTarget = target;
        this.aiState = 'approaching_customer';
      } else if (roll < 0.65) {
        this.aiState = 'sitting';
        this.stateTimer = Phaser.Math.Between(2000, 5000);
      } else {
        this.pickNewWanderTarget();
      }
    } else {
      const speed = this.personality === 'lazy' ? 30 : this.personality === 'explorer' ? 55 : 42;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
    }

    // Lazy personality occasionally stops mid-wander
    if (this.personality === 'lazy' && Math.random() < delta * 0.0005) {
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      this.aiState = 'sitting';
      this.stateTimer = Phaser.Math.Between(2000, 4000);
    }

    // Mischievous cats sometimes run suddenly
    if (this.personality === 'mischievous' && this.stateTimer <= 0) {
      this.stateTimer = Phaser.Math.Between(5000, 12000);
      if (Math.random() < 0.3) {
        this.pickNewWanderTarget();
        // Run fast for a bit
        const dx2 = (this.wanderTarget?.x ?? this.x) - this.x;
        const dy2 = (this.wanderTarget?.y ?? this.y) - this.y;
        const d2 = Math.sqrt(dx2*dx2+dy2*dy2) || 1;
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setVelocity((dx2/d2)*90, (dy2/d2)*90);
      }
    }
  }

  private handleSitting(_delta: number, customerPositions: Array<{ x: number; y: number; id: number }>): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.setTexture(`cat_${this.colorKey}`);

    // While sitting near a customer, boost their happiness (handled in GameScene)

    if (this.stateTimer <= 0) {
      // Friendly cats approach customers from sitting
      if (this.personality === 'friendly' && customerPositions.length > 0) {
        const target = customerPositions[Math.floor(Math.random() * customerPositions.length)];
        this.approachTarget = target;
        this.aiState = 'approaching_customer';
      } else {
        this.aiState = 'wandering';
        this.pickNewWanderTarget();
      }
    }
  }

  private handleApproachingCustomer(_delta: number): void {
    if (!this.approachTarget) {
      this.aiState = 'wandering';
      this.pickNewWanderTarget();
      return;
    }

    const dx = this.approachTarget.x - this.x;
    const dy = this.approachTarget.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 24) {
      // Reached customer – sit near them
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(0, 0);
      this.approachTarget = null;
      this.aiState = 'sitting';
      this.stateTimer = Phaser.Math.Between(3000, 7000);
      // Emit heart particles when near customer
      this.emitHearts();
    } else {
      const speed = 45;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setVelocity((dx / dist) * speed, (dy / dist) * speed);
    }
  }

  private pickNewWanderTarget(): void {
    // Lazy cats prefer to stay near the bed
    if (this.personality === 'lazy') {
      this.wanderTarget = {
        x: this.bedX + Phaser.Math.Between(-50, 50),
        y: this.bedY + Phaser.Math.Between(-40, 40),
      };
    } else {
      this.wanderTarget = {
        x: Phaser.Math.Clamp(this.bounds.x + Math.random() * this.bounds.width, this.bounds.left + 16, this.bounds.right - 16),
        y: Phaser.Math.Clamp(this.bounds.y + Math.random() * this.bounds.height, this.bounds.top + 16, this.bounds.bottom - 16),
      };
    }
    this.stateTimer = Phaser.Math.Between(5000, 14000);
  }

  private emitHearts(): void {
    if (!this.scene) return;
    const emitter = this.scene.add.particles(this.x, this.y - 10, 'particle_heart', {
      speed: { min: 20, max: 50 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 800,
      quantity: 4,
      gravityY: -30,
    });
    this.scene.time.delayedCall(900, () => emitter.destroy());
  }

  feed(): void {
    this.hunger = Math.min(100, this.hunger + 60);
    this.happiness = Math.min(100, this.happiness + 10);
  }

  pet(): void {
    this.happiness = Math.min(100, this.happiness + 15);
    this.energy = Math.min(100, this.energy + 5);
    this.emitHearts();
  }

  getAIState(): CatAIState { return this.aiState; }

  // Return true if close enough to boost a customer at the given world pos
  isNearPosition(wx: number, wy: number, radius = 40): boolean {
    const dx = this.x - wx, dy = this.y - wy;
    return dx*dx + dy*dy < radius*radius;
  }
}
