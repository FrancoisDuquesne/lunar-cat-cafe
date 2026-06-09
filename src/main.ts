import Phaser from 'phaser';
import { GAME_W, GAME_H } from './constants';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#050510',
  pixelArt: true,
  parent: document.body,
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MainMenuScene, GameScene, UIScene],
};

new Phaser.Game(config);
