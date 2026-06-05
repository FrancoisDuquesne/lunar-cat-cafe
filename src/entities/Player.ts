import Phaser from 'phaser';
import { PLAYER_SPEED } from '../constants';
import { touchControls } from '../ui/TouchControls';
import { BaseCharacter } from './BaseCharacter';

export class Player extends BaseCharacter {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private eKey!: Phaser.Input.Keyboard.Key;

  private facing: 'down' | 'up' | 'left' | 'right' = 'down';
  private carriedFoodId: string | null = null;
  private carriedFoodSprite: Phaser.GameObjects.Sprite | null = null;
  private isInteracting = false;

  // Auto-walk queue: player walks each waypoint in order, then fires callback
  private moveTargets: Array<{ x: number; y: number }> = [];
  private moveCallback?: () => void;
  private static readonly ARRIVE_DIST = 40;

  // One-shot interact callback; scene sets this
  onInteract?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player_down');

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCircle(6, 2, 12); // circle slides around corners instead of snagging
    this.setDepth(10);
    this.setOrigin(0.5, 0.9);

    const kb = scene.input.keyboard!;
    this.cursors = kb.createCursorKeys();
    this.wasd = {
      up:    kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.eKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', () => this.tryInteract());
    this.eKey.on('down', () => this.tryInteract());
    touchControls.addInteractListener(() => this.tryInteract());
  }

  private tryInteract(): void {
    if (this.onInteract) this.onInteract();
  }

  /** Queue a series of waypoints. Callback fires once the last one is reached. */
  setMoveTargets(targets: Array<{ x: number; y: number }>, callback?: () => void): void {
    this.moveTargets = [...targets];
    this.moveCallback = callback;
    this.stuckTimer = 0;
    this.lastX = this.x;
    this.lastY = this.y;
  }

  clearMoveTargets(): void {
    this.moveTargets = [];
    this.moveCallback = undefined;
    this.stuckTimer = 0;
  }

  update(): void {
    const { left: cLeft, right: cRight, up: cUp, down: cDown } = this.cursors;
    const kLeft  = cLeft.isDown  || this.wasd.left.isDown;
    const kRight = cRight.isDown || this.wasd.right.isDown;
    const kUp    = cUp.isDown    || this.wasd.up.isDown;
    const kDown  = cDown.isDown  || this.wasd.down.isDown;
    const kActive = kLeft || kRight || kUp || kDown;

    const tdx = touchControls.dx;
    const tdy = touchControls.dy;
    const tActive = Math.abs(tdx) > 0.08 || Math.abs(tdy) > 0.08;

    if (kActive || tActive) {
      // Manual input cancels auto-walk
      this.clearMoveTargets();

      let vx: number, vy: number;
      if (kActive) {
        vx = (kLeft ? -1 : kRight ? 1 : 0) * PLAYER_SPEED;
        vy = (kUp   ? -1 : kDown  ? 1 : 0) * PLAYER_SPEED;
        if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
      } else {
        vx = tdx * PLAYER_SPEED;
        vy = tdy * PLAYER_SPEED;
      }

      this.setVel(vx, vy);
      if      (vx < -0.1) { this.facing = 'left';  this.setTexture('player_side'); this.setFlipX(true);  }
      else if (vx >  0.1) { this.facing = 'right'; this.setTexture('player_side'); this.setFlipX(false); }
      else if (vy < -0.1) { this.facing = 'up';    this.setTexture('player_up');   this.setFlipX(false); }
      else if (vy >  0.1) { this.facing = 'down';  this.setTexture('player_down'); this.setFlipX(false); }
    } else if (this.moveTargets.length > 0) {
      const t = this.moveTargets[0];
      const dx = t.x - this.x;
      const dy = t.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < Player.ARRIVE_DIST) {
        this.stuckTimer = 0;
        this.moveTargets.shift();
        if (this.moveTargets.length === 0) {
          const cb = this.moveCallback;
          this.moveCallback = undefined;
          cb?.();
        }
      } else {
        this.setVel((dx / dist) * PLAYER_SPEED, (dy / dist) * PLAYER_SPEED);
        if (Math.abs(dx) > Math.abs(dy)) {
          this.facing = dx < 0 ? 'left' : 'right';
          this.setTexture('player_side');
          this.setFlipX(dx < 0);
        } else {
          this.facing = dy < 0 ? 'up' : 'down';
          this.setTexture(dy < 0 ? 'player_up' : 'player_down');
          this.setFlipX(false);
        }

        // Give up if physically blocked for too long (obstacle in path)
        const moved = (this.x - this.lastX) ** 2 + (this.y - this.lastY) ** 2;
        if (moved < 0.5) {
          this.stuckTimer += 16; // ~1 frame at 60fps; good enough without delta
          if (this.stuckTimer > 500) this.clearMoveTargets();
        } else {
          this.stuckTimer = 0;
        }
        this.lastX = this.x;
        this.lastY = this.y;
      }
    } else {
      this.setVel(0, 0);
    }

    this.setDepth(10 + this.y / 1000);
    if (this.carriedFoodSprite) {
      this.carriedFoodSprite.setPosition(this.x + 10, this.y - 32);
      this.carriedFoodSprite.setDepth(this.depth + 0.1);
    }
  }

  pickUpFood(itemId: string): void {
    this.carriedFoodId = itemId;
    const texKey = `food_${itemId}`;
    if (this.carriedFoodSprite) this.carriedFoodSprite.destroy();
    this.carriedFoodSprite = this.scene.add.sprite(this.x + 10, this.y - 32, texKey);
    this.carriedFoodSprite.setScale(2.2);
    this.carriedFoodSprite.setDepth(this.depth + 0.1);
  }

  dropFood(): string | null {
    const id = this.carriedFoodId;
    this.carriedFoodId = null;
    if (this.carriedFoodSprite) {
      this.carriedFoodSprite.destroy();
      this.carriedFoodSprite = null;
    }
    return id;
  }

  isCarryingFood(): boolean { return this.carriedFoodId !== null; }
  getCarriedFoodId(): string | null { return this.carriedFoodId; }
  getFacing(): string { return this.facing; }
}
