import Phaser from 'phaser';
import { createAllTextures } from '../textures/TextureFactory';

export class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  create(): void {
    createAllTextures(this);
    this.scene.start('MainMenuScene');
  }
}
