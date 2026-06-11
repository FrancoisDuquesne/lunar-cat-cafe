import Phaser from 'phaser';
import { uiOverlay, UIState, DayReportData } from '../ui/UIOverlay';

export class UIScene extends Phaser.Scene {
  constructor() { super({ key: 'UIScene', active: false }); }

  create(): void {
    uiOverlay.init(this.game);
    uiOverlay.showHUD();

    this.game.events.on('ui_update', (state: UIState) => {
      uiOverlay.applyState(state);
    }, this);

    this.game.events.on('show_day_report', (data: DayReportData) => {
      uiOverlay.showDayReport(data);
    }, this);

    this.game.events.on('refresh_day_report', (data: { money: number; bookings: number }) => {
      uiOverlay.refreshDayReport(data.money, data.bookings);
    }, this);

    this.game.events.on('game_event', (evt: { type: string; active?: boolean }) => {
      if (evt.type === 'open_store_panel') uiOverlay.openStore(true);
      else if (evt.type === 'close_store_panel') uiOverlay.closeStore(true);
      else if (evt.type === 'set_build_mode_active') uiOverlay.setBuildModeActive(evt.active ?? false);
    }, this);

    this.events.once('shutdown', () => {
      uiOverlay.hideHUD();
      uiOverlay.hideDayReport();
      this.game.events.off('ui_update', undefined, this);
      this.game.events.off('show_day_report', undefined, this);
      this.game.events.off('refresh_day_report', undefined, this);
      this.game.events.off('game_event', undefined, this);
    }, this);
  }

}
