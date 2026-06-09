import Phaser from 'phaser';
import { BaseCharacter } from './BaseCharacter';

export abstract class StaffNpc extends BaseCharacter {
  protected readonly nameBadge: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    name: string,
    badgeColor: string,
    strokeColor: string,
  ) {
    super(scene, x, y, 'player_employee');

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 12);
    body.setOffset(2, 12);
    this.setOrigin(0.5, 0.9);
    this.setDepth(10);

    this.nameBadge = scene.add.text(x, y - 24, name, {
      fontSize: '8px', color: badgeColor, fontFamily: 'monospace',
      stroke: strokeColor, strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(11);
  }

  protected updateBadgeAndDepth(): void {
    this.nameBadge.setPosition(this.x, this.y - 24);
    this.updateYDepth(10);
  }

  cleanup(): void {
    this.nameBadge.destroy();
  }
}
