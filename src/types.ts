import { MenuId } from './constants';

export interface MenuItemDef {
  id: MenuId;
  name: string;
  price: number;
  prepTime: number;
  station: 'coffee' | 'stove' | 'prep';
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

export interface ActiveOrder {
  customerId: number;
  item: MenuItemDef;
  takenByPlayer: boolean;
  cooking: boolean;
  cookProgress: number;
  ready: boolean;
  delivered: boolean;
  waitMs: number;
}

export interface ShopState {
  catToys: number;
  catTrees: number;
  employees: number;
  extraMachines: number;
}

export interface OrderInfo {
  customerId: number;
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
}

export interface InteractionContext {
  type: 'station' | 'customer_order' | 'customer_deliver' | 'cat' | 'trash' | 'none';
  label: string;
  targetId?: number;
  stationId?: number;
}
