import Phaser from 'phaser';
import { PLAYER_SPEED } from '../constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private eKey!: Phaser.Input.Keyboard.Key;

  private facing: 'down' | 'up' | 'left' | 'right' = 'down';
  private carriedFoodId: string | null = null;
  private carriedFoodSprite: Phaser.GameObjects.Sprite | null = null;
  private isInteracting = false;

  // One-shot interact callback; scene sets this
  onInteract?: () => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player_down');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 12);
    body.setOffset(2, 12);
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
  }

  private tryInteract(): void {
    if (this.onInteract) this.onInteract();
  }

  update(): void {
    const { left: cLeft, right: cRight, up: cUp, down: cDown } = this.cursors;
    const left  = cLeft.isDown  || this.wasd.left.isDown;
    const right = cRight.isDown || this.wasd.right.isDown;
    const up    = cUp.isDown    || this.wasd.up.isDown;
    const down  = cDown.isDown  || this.wasd.down.isDown;

    let vx = (left ? -1 : right ? 1 : 0) * PLAYER_SPEED;
    let vy = (up   ? -1 : down  ? 1 : 0) * PLAYER_SPEED;

    // Normalize diagonal
    if (vx !== 0 && vy !== 0) {
      vx *= 0.707;
      vy *= 0.707;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx, vy);

    // Update facing direction and texture
    if (vx < 0) { this.facing = 'left'; this.setTexture('player_side'); this.setFlipX(true); }
    else if (vx > 0) { this.facing = 'right'; this.setTexture('player_side'); this.setFlipX(false); }
    else if (vy < 0) { this.facing = 'up'; this.setTexture('player_up'); this.setFlipX(false); }
    else if (vy > 0) { this.facing = 'down'; this.setTexture('player_down'); this.setFlipX(false); }

    // Update depth for Y-sorting
    this.setDepth(10 + this.y / 1000);

    // Update carried food position
    if (this.carriedFoodSprite) {
      this.carriedFoodSprite.setPosition(this.x + 10, this.y - 18);
      this.carriedFoodSprite.setDepth(this.depth + 0.1);
    }
  }

  pickUpFood(itemId: string): void {
    this.carriedFoodId = itemId;
    const texKey = `food_${itemId}`;
    if (this.carriedFoodSprite) this.carriedFoodSprite.destroy();
    this.carriedFoodSprite = this.scene.add.sprite(this.x + 10, this.y - 18, texKey);
    this.carriedFoodSprite.setDepth(this.depth + 0.1);
    // Bobbing tween
    this.scene.tweens.add({
      targets: this.carriedFoodSprite,
      y: '-=4',
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
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
