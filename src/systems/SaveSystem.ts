import { GameSaveState, ShopState } from '../types';
import { CAT_NAMES } from '../constants';

const SAVE_KEY = 'lunar_cat_cafe_v2';

function freshShop(): ShopState {
  return {
    catToys: 0, catTrees: 0, employees: 0,
    placedDecorations: [],
    ownedTableSlotIds: [0, 1, 2],
    cooks: 0, guards: 0, caterers: 0,
    ownedRecipeIds: ['moon_mocha', 'zerog_latte'],
    dailyMenuIds: ['moon_mocha', 'zerog_latte'],
    ownedMachines: ['espresso_machine'],
  };
}

export function defaultSaveState(): GameSaveState {
  return {
    money: 200,
    reputation: 10,
    day: 1,
    totalServed: 0,
    shop: freshShop(),
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
    if (!state.shop) state.shop = freshShop();
    if (state.shop.extraMachines === undefined) state.shop.extraMachines = 0;
    if (!state.shop.placedDecorations) state.shop.placedDecorations = [];
    // Patch new fields for old saves
    if (!state.shop.ownedTableSlotIds) {
      // Old v2 save had all 12 tables by default — preserve them
      state.shop.ownedTableSlotIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    }
    if (state.shop.cooks === undefined) state.shop.cooks = 0;
    if (state.shop.guards === undefined) state.shop.guards = 0;
    if (state.shop.caterers === undefined) state.shop.caterers = 0;
    if (!state.shop.ownedRecipeIds) state.shop.ownedRecipeIds = ['moon_mocha', 'zerog_latte'];
    if (!state.shop.dailyMenuIds) state.shop.dailyMenuIds = [...state.shop.ownedRecipeIds];
    if (state.shop.bookings === undefined) state.shop.bookings = 0;
    if (!state.shop.ownedMachines) {
      // Migrate from old ownedStations system
      const stationToMachine: Record<string, string> = { coffee: 'espresso_machine', stove: 'stove', prep: 'mixer' };
      const old = state.shop.ownedStations ?? ['coffee'];
      state.shop.ownedMachines = old.map(s => stationToMachine[s] ?? s).filter(Boolean);
      // If they had extra_machines, they had both stove + prep already — add oven too
      if ((state.shop.extraMachines ?? 0) >= 1 && !state.shop.ownedMachines.includes('oven')) {
        state.shop.ownedMachines.push('oven');
      }
    }
    if (!state.popularityHistory) state.popularityHistory = [];
    return state;
  } catch (e) {
    console.warn('Load failed:', e);
    return null;
  }
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
