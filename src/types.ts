import { MenuId, PlacedDecoration, EmployeeRole } from './constants';

export interface MenuItemDef {
  id: MenuId;
  name: string;
  price: number;
  prepTime: number;
  readonly machines: readonly string[];   // required machine IDs; primary (cooking) machine is machines[0]
  recipeCost?: number;
  description?: string;
}

export type CustomerType = 'astronaut' | 'scientist' | 'tourist' | 'worker';
export type CatPersonality = 'lazy' | 'friendly' | 'mischievous' | 'explorer';

export interface CatState {
  id: number;
  name: string;
  personality: CatPersonality;
  colorKey: 'orange' | 'gray' | 'black' | 'cream';
  hunger: number;
  happiness: number;
  energy: number;
}

export interface TableSeat {
  seatX: number;
  seatY: number;
  occupied: boolean;
  customerId: number | null;
}

export interface TableSlot {
  id: number;
  worldX: number;
  worldY: number;
  seats: TableSeat[];
}

export interface ShopState {
  catToys: number;
  catTrees: number;
  employees: number;
  placedDecorations: PlacedDecoration[];
  ownedTableSlotIds: number[];
  cooks: number;
  guards: number;
  caterers: number;
  ownedRecipeIds?: string[];
  dailyMenuIds?: string[];
  bookings?: number;
  ownedMachines?: string[];
  ownedExpansionIds?: string[];
  // Legacy fields — kept for save migration only
  extraMachines?: number;
  ownedStations?: string[];
}

export interface OrderInfo {
  customerId: number;
  tableId: number;
  itemName: string;
  stationType: string;
  status: 'queued' | 'cooking' | 'ready' | 'carrying';
  progress: number;
}

export interface GameSaveState {
  money: number;
  reputation: number;
  day: number;
  totalServed: number;
  cats: CatState[];
  shop: ShopState;
  popularityHistory?: Array<{ day: number; served: number; revenue: number }>;
}

export interface InteractionContext {
  type: 'station' | 'customer_order' | 'customer_deliver' | 'cat' | 'trash' | 'none';
  label: string;
  targetId?: number;
  stationId?: number;
}

// Typed command bus: UIOverlay → GameScene via game.events.emit('game_event', cmd)
export type GameCommand =
  | { type: 'start_placement'; defId: string }
  | { type: 'close_store_panel' }
  | { type: 'open_store_panel' }
  | { type: 'buy_table'; slotId: number }
  | { type: 'hire_staff'; role: EmployeeRole }
  | { type: 'buy_machine'; machineId: string }
  | { type: 'buy_recipe'; itemId: string }
  | { type: 'toggle_daily_recipe'; itemId: string }
  | { type: 'next_day' }
  | { type: 'set_bookings'; delta: number }
  | { type: 'tier_changed'; tierName: string; tierLevel: number }
  | { type: 'toggle_build_mode' }
  | { type: 'set_build_mode_active'; active: boolean }
  | { type: 'buy_expansion'; zoneId: string };
