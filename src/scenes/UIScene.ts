import Phaser from 'phaser';
import { uiOverlay, UIState } from '../ui/UIOverlay';

export class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene', active: false }); }

  create(): void {
    uiOverlay.init(this.game);
    uiOverlay.showHUD();

    this.game.events.on('ui_update', (state: UIState) => {
      uiOverlay.applyState(state);
    }, this);

    this.game.events.on('game_event', (evt: { type: string }) => {
      if (evt.type === 'open_store_panel') uiOverlay.openStore(true);
      else if (evt.type === 'close_store_panel') uiOverlay.closeStore(true);
    }, this);

    this.events.once('shutdown', () => {
      uiOverlay.hideHUD();
      this.game.events.off('ui_update', undefined, this);
      this.game.events.off('game_event', undefined, this);
    }, this);
  }
}
