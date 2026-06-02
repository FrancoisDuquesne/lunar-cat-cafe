import { GameSaveState, ShopState } from '../types';
import { CAT_NAMES } from '../constants';

const SAVE_KEY = 'lunar_cat_cafe_v2';

const DEFAULT_SHOP: ShopState = { catToys: 0, catTrees: 0, employees: 0, extraMachines: 0, placedDecorations: [] };

export function defaultSaveState(): GameSaveState {
  return {
    money: 150,
    reputation: 10,
    day: 1,
    totalServed: 0,
    shop: { ...DEFAULT_SHOP },
    cats: [
      { id: 0, name: CAT_NAMES[0], personality: 'friendly',   colorKey: 'orange', hunger: 80, happiness: 80, energy: 100 },
      { id: 1, name: CAT_NAMES[1], personality: 'lazy',        colorKey: 'gray',   hunger: 80, happiness: 80, energy: 100 },
      { id: 2, name: CAT_NAMES[2], personality: 'explorer',    colorKey: 'black',  hunger: 80, happiness: 80, energy: 100 },
      { id: 3, name: CAT_NAMES[3], personality: 'mischievous', colorKey: 'cream',  hunger: 80, happiness: 80, energy: 100 },
    ],
  };
}

export function saveGame(state: GameSaveState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ state, timestamp: Date.now() }));
  } catch (e) {
    console.warn('Save failed:', e);
  }
}

export function loadGame(): GameSaveState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const { state } = JSON.parse(raw) as { state: GameSaveState };
    if (!state.shop) state.shop = { ...DEFAULT_SHOP };
    if (state.shop.extraMachines === undefined) state.shop.extraMachines = 0;
    if (!state.shop.placedDecorations) state.shop.placedDecorations = [];
    return state;
  } catch (e) {
    console.warn('Load failed:', e);
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
