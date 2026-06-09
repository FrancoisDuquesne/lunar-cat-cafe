import Phaser from 'phaser';

export abstract class BaseCharacter extends Phaser.Physics.Arcade.Sprite {
  protected navPath: Array<{x: number; y: number}> = [];
  protected stuckTimer = 0;
  protected lastX = 0;
  protected lastY = 0;

  pathFinder?: (fx: number, fy: number, tx: number, ty: number) => Array<{x: number; y: number}>;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.lastX = x;
    this.lastY = y;
  }

  protected startNav(tx: number, ty: number): void {
    if (this.pathFinder) {
      const path = this.pathFinder(this.x, this.y, tx, ty);
      this.navPath = path.length > 0 ? path : [{ x: tx, y: ty }];
    } else {
      this.navPath = [{ x: tx, y: ty }];
    }
    this.stuckTimer = 0;
    this.lastX = this.x;
    this.lastY = this.y;
  }

  /** Walk navPath toward (finalX, finalY). Returns true when within arrivalDist. */
  protected followPath(
    delta: number, speed: number,
    finalX: number, finalY: number, arrivalDist: number,
  ): boolean {
    const fdx = finalX - this.x;
    const fdy = finalY - this.y;
    if (Math.sqrt(fdx * fdx + fdy * fdy) < arrivalDist) {
      this.setVel(0, 0);
      this.navPath = [];
      return true;
    }

    while (this.navPath.length > 1) {
      const wp = this.navPath[0];
      const wx = wp.x - this.x, wy = wp.y - this.y;
      if (Math.sqrt(wx * wx + wy * wy) < 16) this.navPath.shift();
      else break;
    }

    const target = this.navPath[0] ?? { x: finalX, y: finalY };
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.setVel((dx / dist) * speed, (dy / dist) * speed);

    this.stuckTimer += delta;
    if (this.stuckTimer > 1500) {
      const moved = Math.sqrt((this.x - this.lastX) ** 2 + (this.y - this.lastY) ** 2);
      if (moved < 4) this.startNav(finalX, finalY);
      else { this.lastX = this.x; this.lastY = this.y; }
      this.stuckTimer = 0;
    }

    return false;
  }

  protected walkToward(tx: number, ty: number, speed: number): void {
    const dx = tx - this.x, dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    this.setVel((dx / dist) * speed, (dy / dist) * speed);
  }

  protected distTo(tx: number, ty: number): number {
    const dx = tx - this.x, dy = ty - this.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  protected setVel(vx: number, vy: number): void {
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);
  }

  protected updateYDepth(base: number): void {
    this.setDepth(base + this.y / 1000);
  }
}
