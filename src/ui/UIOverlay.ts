import Phaser from 'phaser';
import {
  EMPLOYEE_TYPES, DECORATION_ITEMS, CAFE_TIERS, MENU_ITEMS,
  DecorationCategory, EmployeeRole, MACHINE_DEFS, EXPANSION_ZONES,
  BOOKING_COST, MAX_BOOKINGS,
} from '../constants';
import type { OrderInfo, MenuItemDef } from '../types';
import { isSoundEnabled, setSoundEnabled } from '../audio';

export interface DayReportData {
  day: number;
  servedToday: number;
  revenueToday: number;
  reputation: number;
  avgCatHappiness: number;
  money: number;
  popularityHistory: Array<{ day: number; served: number; revenue: number }>;
  tierLevel: number;
  bookings: number;
  rentDue: number;
}
import { touchControls } from './TouchControls';

export interface UIState {
  money: number;
  reputation: number;
  day: number;
  dayProgress: number;
  catHappiness: number;
  totalServed: number;
  phase: string;
  orders: OrderInfo[];
  ambiance?: number;
  tierName?: string;
  tierLevel?: number;
  ownedTableSlotIds?: number[];
  employees?: number;
  cooks?: number;
  guards?: number;
  caterers?: number;
  ownedMachines?: string[];
  ownedRecipeIds?: string[];
  dailyMenuIds?: string[];
  ownedExpansionIds?: string[];
}

type ManagerSection = 'overview' | 'furnish' | 'kitchen' | 'staff' | 'menu' | 'expand';

// ── SVG ICONS ─────────────────────────────────────────────────────────────────

function svg(content: string, size = 28): string {
  return `<svg viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block">${content}</svg>`;
}

const ITEM_ICONS: Record<string, string> = {
  // Bar stool
  'obj_bar_stool': svg(`
    <circle cx="14" cy="9" r="7" fill="#cc3344"/>
    <ellipse cx="12" cy="7" rx="5" ry="3" fill="#ff5566" opacity="0.7"/>
    <rect x="13" y="15" width="2" height="8" rx="1" fill="#c8b860"/>
    <rect x="9" y="22" width="10" height="3" rx="1.5" fill="#9a9030"/>
    <rect x="10" y="22" width="8" height="2" rx="1" fill="#c8b860" opacity="0.7"/>
  `),
  // Seating
  'obj_table': svg(`
    <rect x="5" y="11" width="18" height="3" rx="1.5" fill="#9a6030"/>
    <rect x="6" y="14" width="3" height="8" rx="1.5" fill="#6a3810"/>
    <rect x="19" y="14" width="3" height="8" rx="1.5" fill="#6a3810"/>
    <rect x="5" y="9" width="18" height="2.5" rx="1.2" fill="#d4a820" opacity="0.7"/>
  `),
  'obj_table_group': svg(`
    <rect x="3" y="11" width="22" height="3" rx="1.5" fill="#9a6030"/>
    <rect x="4" y="14" width="3" height="7" rx="1.5" fill="#6a3810"/>
    <rect x="21" y="14" width="3" height="7" rx="1.5" fill="#6a3810"/>
    <rect x="12" y="14" width="3" height="7" rx="1.5" fill="#6a3810"/>
    <rect x="3" y="9" width="22" height="2.5" rx="1.2" fill="#d4a820" opacity="0.7"/>
  `),
  // Furniture
  'deco_velvet_chair': svg(`
    <rect x="7" y="13" width="14" height="9" rx="2" fill="#7744bb"/>
    <rect x="4" y="7" width="7" height="10" rx="2" fill="#5522aa"/>
    <rect x="17" y="7" width="7" height="10" rx="2" fill="#5522aa"/>
    <rect x="6" y="20" width="3" height="5" rx="1.5" fill="#331166"/>
    <rect x="19" y="20" width="3" height="5" rx="1.5" fill="#331166"/>
  `),
  'deco_round_table': svg(`
    <ellipse cx="14" cy="13" rx="10" ry="5" fill="#9a6030"/>
    <ellipse cx="14" cy="11" rx="10" ry="5" fill="#b07840"/>
    <ellipse cx="14" cy="11" rx="7" ry="3.5" fill="#d4a820" opacity="0.35"/>
    <rect x="13" y="16" width="2" height="7" rx="1" fill="#6a3810"/>
  `),
  'deco_booth_seat': svg(`
    <rect x="3" y="9" width="22" height="12" rx="3" fill="#cc4444"/>
    <rect x="3" y="9" width="22" height="5" rx="2.5" fill="#aa2222"/>
    <rect x="3" y="8" width="22" height="3" rx="1.5" fill="#882222"/>
  `),
  // Lighting
  'deco_fairy_lights': svg(`
    <path d="M3 15 Q8 8 14 15 Q20 22 25 15" stroke="#ffdd44" stroke-width="1.5" fill="none"/>
    <circle cx="5" cy="13" r="2.5" fill="#ffee88"/>
    <circle cx="10" cy="16" r="2.5" fill="#ffcc44"/>
    <circle cx="18" cy="14" r="2.5" fill="#ff8844"/>
    <circle cx="23" cy="16" r="2.5" fill="#ff44aa"/>
  `),
  'deco_neon_sign': svg(`
    <rect x="3" y="8" width="22" height="12" rx="2" fill="#88ddff" opacity="0.1"/>
    <rect x="3" y="8" width="22" height="12" rx="2" stroke="#88ddff" stroke-width="1.5" fill="none"/>
    <text x="14" y="18.5" text-anchor="middle" fill="#88ddff" font-size="7" font-weight="bold" font-family="monospace">CAT</text>
  `),
  'deco_crystal_lamp': svg(`
    <polygon points="14,4 21,15 14,24 7,15" fill="#88ccff" opacity="0.75"/>
    <polygon points="14,4 21,15 14,24 7,15" stroke="#aaddff" stroke-width="1" fill="none"/>
    <ellipse cx="14" cy="14" rx="3.5" ry="3.5" fill="#ffffff" opacity="0.9"/>
    <line x1="14" y1="1" x2="14" y2="4" stroke="#bbbbbb" stroke-width="1.5"/>
  `),
  // Plants
  'deco_luna_fern': svg(`
    <path d="M14 24 Q9 15 5 8 Q11 13 14 24z" fill="#44aa44"/>
    <path d="M14 24 Q19 15 23 8 Q17 13 14 24z" fill="#228844"/>
    <rect x="13" y="21" width="2" height="5" rx="1" fill="#6a3810"/>
  `),
  'deco_space_cactus': svg(`
    <rect x="11" y="8" width="6" height="14" rx="3" fill="#228844"/>
    <rect x="4" y="12" width="9" height="4" rx="2" fill="#228844"/>
    <rect x="15" y="15" width="8" height="4" rx="2" fill="#228844"/>
    <circle cx="14" cy="8" r="3" fill="#228844"/>
    <circle cx="7.5" cy="13" r="2" fill="#ff44aa" opacity="0.8"/>
  `),
  'deco_moon_bloom': svg(`
    <circle cx="14" cy="13" r="4.5" fill="#ffccee"/>
    <ellipse cx="7.5" cy="15" rx="3" ry="5.5" fill="#ff66aa" opacity="0.8" transform="rotate(-30 7.5 15)"/>
    <ellipse cx="20.5" cy="11" rx="3" ry="5.5" fill="#ff66aa" opacity="0.8" transform="rotate(30 20.5 11)"/>
    <ellipse cx="9.5" cy="8" rx="3" ry="5.5" fill="#ff88bb" opacity="0.7" transform="rotate(30 9.5 8)"/>
    <ellipse cx="18.5" cy="18" rx="3" ry="5.5" fill="#ff88bb" opacity="0.7" transform="rotate(-30 18.5 18)"/>
    <circle cx="14" cy="13" r="2.5" fill="#ff88cc"/>
  `),
  // Wall decor
  'deco_star_map': svg(`
    <rect x="3" y="4" width="22" height="16" rx="1.5" fill="#0a1830" stroke="#c8a030" stroke-width="1.5"/>
    <circle cx="8" cy="10" r="1.2" fill="#ffe566"/>
    <circle cx="15" cy="8" r="1.5" fill="#ffe566"/>
    <circle cx="21" cy="12" r="1.2" fill="#ffe566"/>
    <circle cx="11" cy="15" r="1" fill="#aaccff"/>
    <circle cx="18" cy="17" r="1" fill="#ffaacc"/>
    <line x1="8" y1="10" x2="15" y2="8" stroke="#ffe566" stroke-width="0.6" opacity="0.5"/>
    <line x1="15" y1="8" x2="21" y2="12" stroke="#ffe566" stroke-width="0.6" opacity="0.5"/>
  `),
  'deco_moon_portrait': svg(`
    <rect x="3" y="2" width="22" height="24" rx="1.5" fill="#2a1428" stroke="#c8a030" stroke-width="1.5"/>
    <rect x="6" y="5" width="16" height="18" rx="1" fill="#0a0820"/>
    <circle cx="14" cy="12" r="5" fill="#c8c4b0"/>
    <circle cx="14" cy="12" r="3.5" fill="#9a9480"/>
  `),
  // Specialty
  'deco_telescope': svg(`
    <rect x="5" y="11" width="15" height="5" rx="2" fill="#445566" transform="rotate(-25 14 13.5)"/>
    <circle cx="8" cy="14" r="3.5" fill="#334455" stroke="#556677" stroke-width="1"/>
    <rect x="13" y="17" width="3" height="7" rx="1.5" fill="#334455"/>
    <rect x="10" y="22" width="9" height="2" rx="1" fill="#334455"/>
  `),
  'deco_rover_display': svg(`
    <rect x="4" y="15" width="20" height="8" rx="2" fill="#334455"/>
    <rect x="5" y="13" width="4.5" height="4.5" rx="1" fill="#445566"/>
    <rect x="18.5" y="13" width="4.5" height="4.5" rx="1" fill="#445566"/>
    <rect x="5" y="9" width="18" height="8" rx="2" fill="#1a44cc"/>
    <circle cx="11" cy="13" r="1.2" fill="#88ddff"/>
    <circle cx="17" cy="13" r="1.2" fill="#88ddff"/>
  `),
  'deco_cat_statue': svg(`
    <ellipse cx="14" cy="20" rx="6" ry="4" fill="#c8c4b0"/>
    <circle cx="14" cy="14" r="5" fill="#c8c4b0"/>
    <polygon points="9.5,10 11.5,4 13,9.5" fill="#c8c4b0"/>
    <polygon points="15,9.5 16.5,4 18.5,10" fill="#c8c4b0"/>
    <circle cx="12" cy="14" r="1.5" fill="#333"/>
    <circle cx="16" cy="14" r="1.5" fill="#333"/>
    <path d="M12 17 Q14 18.5 16 17" stroke="#cc8899" stroke-width="1.2" fill="none"/>
  `),
  // Kitchen machines
  'obj_griddle': svg(`
    <rect x="3" y="12" width="22" height="10" rx="2" fill="#2a1a0a"/>
    <rect x="5" y="13" width="18" height="7" rx="1.5" fill="#8b3a10"/>
    <rect x="5" y="13" width="18" height="3" rx="1" fill="#b04a18" opacity="0.9"/>
    <circle cx="11" cy="16.5" r="3.5" fill="none" stroke="#ff7722" stroke-width="1" opacity="0.6"/>
    <circle cx="19" cy="16.5" r="3.5" fill="none" stroke="#ff7722" stroke-width="1" opacity="0.6"/>
    <rect x="10" y="7" width="8" height="5" rx="1.5" fill="#1a0a00"/>
    <rect x="11" y="8" width="6" height="1.5" rx="0.5" fill="#d4a820"/>
  `),
  'obj_mixer': svg(`
    <rect x="6" y="19" width="16" height="6" rx="2.5" fill="#c0c8d8"/>
    <rect x="7" y="20" width="14" height="3" rx="1" fill="#d8e0f0" opacity="0.8"/>
    <rect x="12" y="9" width="5" height="11" rx="2" fill="#8090a8"/>
    <rect x="12.5" y="10" width="3.5" height="8" rx="1" fill="#9aaabb" opacity="0.8"/>
    <rect x="8" y="5" width="12" height="6" rx="2.5" fill="#6a8090"/>
    <rect x="9" y="6" width="10" height="3" rx="1" fill="#7a90a0" opacity="0.8"/>
    <line x1="14" y1="17" x2="12" y2="19" stroke="#d4a820" stroke-width="1.2"/>
    <line x1="14" y1="17" x2="16" y2="19" stroke="#d4a820" stroke-width="1.2"/>
  `),
  'obj_oven': svg(`
    <rect x="3" y="4" width="22" height="20" rx="2.5" fill="#2a2a3a"/>
    <rect x="3" y="4" width="22" height="4" rx="2" fill="#3a3a4a"/>
    <rect x="6" y="7" width="16" height="14" rx="1.5" fill="#1a1a28"/>
    <rect x="8" y="9" width="12" height="9" rx="1" fill="#3a1800"/>
    <rect x="8" y="9" width="12" height="9" rx="1" fill="#ff6600" opacity="0.3"/>
    <rect x="9" y="10" width="10" height="3" rx="0.5" fill="#ff8800" opacity="0.25"/>
    <rect x="8" y="21" width="12" height="2.5" rx="1.2" fill="#d4a820"/>
    <rect x="11" y="4" width="1.5" height="3" rx="0.5" fill="#d4a820"/>
    <rect x="15.5" y="4" width="1.5" height="3" rx="0.5" fill="#d4a820"/>
  `),
  'obj_coffee_machine': svg(`
    <rect x="5" y="6" width="18" height="16" rx="2" fill="#334455"/>
    <rect x="7" y="8" width="8" height="6" rx="1" fill="#1a2233"/>
    <circle cx="19.5" cy="11" r="2.8" fill="#223344" stroke="#556677" stroke-width="1"/>
    <rect x="8.5" y="17.5" width="7" height="2" rx="1" fill="#ff8844"/>
    <rect x="10" y="19.5" width="5" height="3" rx="1" fill="#6a3810"/>
  `),
  'obj_stove': svg(`
    <rect x="4" y="8" width="20" height="14" rx="2" fill="#553322"/>
    <rect x="4" y="8" width="20" height="5" rx="2" fill="#775533"/>
    <circle cx="10" cy="11" r="2.5" fill="#ff5500" opacity="0.85"/>
    <circle cx="18" cy="11" r="2.5" fill="#ff5500" opacity="0.85"/>
    <circle cx="10" cy="18" r="2" fill="#cc4400" opacity="0.7"/>
    <circle cx="18" cy="18" r="2" fill="#cc4400" opacity="0.7"/>
    <rect x="6" y="21" width="16" height="2" rx="1" fill="#443322"/>
  `),
  'obj_prep_counter': svg(`
    <rect x="3" y="14" width="22" height="8" rx="2" fill="#8B6914"/>
    <rect x="3" y="12" width="22" height="4" rx="1" fill="#c8a84b"/>
    <rect x="5" y="14" width="18" height="2" rx="1" fill="#e0c060" opacity="0.5"/>
    <rect x="5" y="17" width="4" height="5" rx="1" fill="#6a5010"/>
    <rect x="19" y="17" width="4" height="5" rx="1" fill="#6a5010"/>
  `),
};

const ROLE_ICONS: Record<EmployeeRole, string> = {
  waiter: svg(`
    <circle cx="14" cy="9" r="4" fill="#e8d0a0"/>
    <path d="M7 28 Q7 18 14 18 Q21 18 21 28" fill="#60cc80"/>
    <ellipse cx="14" cy="16" rx="5.5" ry="2" fill="#ffffff" opacity="0.6"/>
    <rect x="9" y="14" width="10" height="4" rx="2" fill="#50aa70"/>
  `),
  cook: svg(`
    <circle cx="14" cy="11" r="4" fill="#e8d0a0"/>
    <path d="M7 28 Q7 18 14 18 Q21 18 21 28" fill="#ff9944"/>
    <ellipse cx="14" cy="8" rx="6.5" ry="4.5" fill="#ffffff"/>
    <ellipse cx="14" cy="5" rx="4.5" ry="3.5" fill="#ffffff"/>
  `),
  guard: svg(`
    <circle cx="14" cy="9" r="4" fill="#e8d0a0"/>
    <path d="M7 28 Q7 18 14 18 Q21 18 21 28" fill="#6688dd"/>
    <polygon points="14,5 19,9 17,18 14,20 11,18 9,9" fill="#4466bb" opacity="0.9"/>
    <path d="M12 11 L14 13 L18 8" stroke="#ffffff" stroke-width="1.5" fill="none"/>
  `),
  caterer: svg(`
    <circle cx="14" cy="9" r="4" fill="#e8d0a0"/>
    <path d="M7 28 Q7 18 14 18 Q21 18 21 28" fill="#dd88cc"/>
    <path d="M9 18 Q9 13 14 12 Q19 13 19 18" fill="#bb66aa"/>
    <ellipse cx="14" cy="16" rx="4.5" ry="2" fill="#ffffff" opacity="0.5"/>
  `),
};

const FOOD_ICONS: Record<string, string> = {
  moon_mocha: svg(`
    <rect x="4" y="8" width="14" height="12" rx="2" fill="#3a1a00"/>
    <rect x="5" y="9" width="12" height="4" fill="#7a3a10"/>
    <rect x="5" y="9" width="12" height="2" fill="#aa5520" opacity="0.7"/>
    <rect x="16" y="11" width="4" height="4" rx="1" fill="#5a2808"/>
    <rect x="4" y="18" width="14" height="2" rx="1" fill="#d4a820" opacity="0.8"/>
  `, 24),
  zerog_latte: svg(`
    <rect x="5" y="5" width="14" height="16" rx="4" fill="#0a2a30"/>
    <rect x="5" y="5" width="14" height="5" fill="#00bbcc"/>
    <rect x="5" y="5" width="14" height="2" fill="#44eeff" opacity="0.7"/>
    <ellipse cx="12" cy="9" rx="6" ry="3" fill="#00ccdd" opacity="0.4"/>
  `, 24),
  luna_pancakes: svg(`
    <ellipse cx="12" cy="19" rx="10" ry="3" fill="#c47828"/>
    <ellipse cx="12" cy="15" rx="10" ry="3" fill="#d48838"/>
    <ellipse cx="12" cy="11" rx="10" ry="3" fill="#e4a848"/>
    <rect x="10" y="7" width="5" height="3" fill="#ffee88"/>
    <rect x="13" y="7" width="2" height="5" fill="#cc7700"/>
  `, 24),
  star_cookies: svg(`
    <ellipse cx="12" cy="21" rx="10" ry="3" fill="#2a1a08"/>
    <circle cx="7" cy="13" r="4" fill="#cc9944"/>
    <circle cx="13" cy="10" r="4" fill="#cc9944"/>
    <circle cx="18" cy="14" r="4" fill="#cc9944"/>
    <circle cx="7" cy="13" r="2" fill="#aa7722"/>
    <line x1="7" y1="11" x2="7" y2="15" stroke="#ffdd44" stroke-width="1"/>
    <line x1="5" y1="13" x2="9" y2="13" stroke="#ffdd44" stroke-width="1"/>
  `, 24),
  lunar_fondue: svg(`
    <rect x="4" y="10" width="16" height="11" rx="2" fill="#5a3000"/>
    <ellipse cx="12" cy="12" rx="8" ry="4" fill="#f0c020"/>
    <ellipse cx="10" cy="11" rx="4" ry="2" fill="#ffe060" opacity="0.9"/>
    <rect x="5" y="14" width="2" height="4" fill="#d4a010"/>
    <rect x="17" y="14" width="2" height="4" fill="#d4a010"/>
    <rect x="1" y="14" width="4" height="3" fill="#d4a820"/>
    <rect x="19" y="14" width="4" height="3" fill="#d4a820"/>
  `, 24),
  nebula_risotto: svg(`
    <ellipse cx="12" cy="22" rx="11" ry="4" fill="#1a0830"/>
    <ellipse cx="12" cy="17" rx="9" ry="6" fill="#7030cc"/>
    <ellipse cx="12" cy="15" rx="6" ry="4" fill="#aa50e0" opacity="0.9"/>
    <ellipse cx="10" cy="14" rx="4" ry="2" fill="#ff88ff" opacity="0.7"/>
    <line x1="12" y1="4" x2="12" y2="10" stroke="#ffdd00" stroke-width="1"/>
    <line x1="9" y1="7" x2="15" y2="7" stroke="#ffdd00" stroke-width="1"/>
  `, 24),
  gravity_souffle: svg(`
    <rect x="5" y="17" width="14" height="6" rx="1" fill="#4a2e08"/>
    <rect x="4" y="16" width="16" height="2" fill="#d4a820"/>
    <ellipse cx="12" cy="14" rx="10" ry="7" fill="#e8a820"/>
    <ellipse cx="12" cy="11" rx="7" ry="5" fill="#ffcc44"/>
    <ellipse cx="11" cy="9" rx="4" ry="3" fill="#ffee88" opacity="0.9"/>
    <line x1="12" y1="2" x2="12" y2="6" stroke="#ffffcc" stroke-width="1"/>
    <line x1="9" y1="4" x2="15" y2="4" stroke="#ffffcc" stroke-width="1"/>
  `, 24),
};

function machineName(machineId: string): string {
  return MACHINE_DEFS.find(d => d.id === machineId)?.name ?? machineId;
}

function machineLabel(machines: readonly string[] | string[]): string {
  return machines.map(machineName).join(' + ');
}

function categoryFallbackIcon(category: DecorationCategory): string {
  const map: Record<DecorationCategory, string> = {
    seating:   ITEM_ICONS['obj_table'],
    furniture: ITEM_ICONS['deco_round_table'],
    lighting:  ITEM_ICONS['deco_fairy_lights'],
    plants:    ITEM_ICONS['deco_luna_fern'],
    wallDecor: ITEM_ICONS['deco_star_map'],
    specialty: ITEM_ICONS['deco_telescope'],
  };
  return map[category] ?? svg(`<rect x="6" y="6" width="16" height="16" rx="3" fill="#887766"/>`);
}

// ─────────────────────────────────────────────────────────────────────────────

class UIOverlay {
  private game?: Phaser.Game;
  private managerOpen = false;
  private activeSection: ManagerSection = 'overview';
  private activeFurnishTab: DecorationCategory = 'seating';
  private lastState: UIState | null = null;
  private prevMoney = 0;
  private prevRep = 0;
  private lastManagerFingerprint = '';

  private hudEl!: HTMLElement;
  private moneyEl!: HTMLElement;
  private repEl!: HTMLElement;
  private catEl!: HTMLElement;
  private tierEl!: HTMLElement;
  private ambianceEl!: HTMLElement;
  private dayLabelEl!: HTMLElement;
  private dayBarFillEl!: HTMLElement;
  private phaseEl!: HTMLElement;
  private ordersEl!: HTMLElement;
  private managerPanelEl!: HTMLElement;
  private managerContentEl!: HTMLElement;
  private managerBackdropEl!: HTMLElement;
  private managerBalanceEl!: HTMLElement;
  private menuOverlayEl!: HTMLElement;
  private menuButtonsEl!: HTMLElement;
  private legendEl!: HTMLElement;
  private dayReportEl!: HTMLElement;
  private howToPlayEl!: HTMLElement;
  private htpActionBtn!: HTMLButtonElement;
  private drBookings = 0;
  private drMoney = 0;
  private drTierLevel = 0;

  init(game: Phaser.Game): void {
    if (this.game) return;
    this.game = game;

    this.updateScale();
    window.addEventListener('resize', () => this.updateScale());

    this.hudEl          = document.getElementById('hud')!;
    this.moneyEl        = document.getElementById('stat-money')!;
    this.repEl          = document.getElementById('stat-rep')!;
    this.catEl          = document.getElementById('stat-cat')!;
    this.tierEl         = document.getElementById('tier-name')!;
    this.ambianceEl     = document.getElementById('ambiance-val')!;
    this.dayLabelEl     = document.getElementById('day-label')!;
    this.dayBarFillEl   = document.getElementById('day-bar-fill')!;
    this.phaseEl        = document.getElementById('phase-text')!;
    this.ordersEl       = document.getElementById('orders-strip')!;
    this.managerPanelEl   = document.getElementById('manager-panel')!;
    this.managerContentEl = document.getElementById('manager-content')!;
    this.managerBackdropEl = document.getElementById('manager-backdrop')!;
    this.managerBalanceEl  = document.getElementById('mgr-balance-val')!;
    this.menuOverlayEl  = document.getElementById('menu-overlay')!;
    this.menuButtonsEl  = document.getElementById('menu-buttons')!;
    this.legendEl       = document.getElementById('legend')!;
    this.dayReportEl    = document.getElementById('day-report')!;
    this.howToPlayEl    = document.getElementById('how-to-play-modal')!;
    this.htpActionBtn   = document.getElementById('htp-action-btn')! as HTMLButtonElement;

    document.getElementById('btn-build')!.addEventListener('click', () => {
      game.events.emit('game_event', { type: 'toggle_build_mode' });
    });

    document.getElementById('btn-store')!.addEventListener('click', () => {
      if (this.managerOpen) this.closeManager();
      else this.openManager();
    });

    document.getElementById('btn-menu')!.addEventListener('click', () => {
      game.events.emit('go_menu');
    });

    document.getElementById('manager-close')!.addEventListener('click', () => this.closeManager());
    this.managerBackdropEl.addEventListener('click', () => this.closeManager());

    document.querySelectorAll('.mgr-nav-item').forEach(navItem => {
      navItem.addEventListener('click', () => {
        this.switchSection((navItem as HTMLElement).dataset.section as ManagerSection);
      });
    });

    // Sound toggle (HUD)
    const hudSoundBtn = document.getElementById('btn-sound')!;
    const syncSoundBtns = () => {
      const on = isSoundEnabled();
      const onSvg = `<svg viewBox="0 0 20 20" fill="none"><path d="M3 7v6h4l5 5V2L7 7H3z" fill="#5A2E06"/><path d="M14.5 7.5a5 5 0 0 1 0 5" stroke="#5A2E06" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M17 5a8 8 0 0 1 0 10" stroke="#5A2E06" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.5"/></svg>`;
      const offSvg = `<svg viewBox="0 0 20 20" fill="none"><path d="M3 7v6h4l5 5V2L7 7H3z" fill="#5A2E06" opacity="0.45"/><line x1="13" y1="7" x2="18" y2="13" stroke="#5A2E06" stroke-width="1.5" stroke-linecap="round"/><line x1="18" y1="7" x2="13" y2="13" stroke="#5A2E06" stroke-width="1.5" stroke-linecap="round"/></svg>`;
      const menuIconOn = `<svg viewBox="0 0 20 20" fill="none"><path d="M3 7v6h4l5 5V2L7 7H3z" fill="#8aaabb"/><path d="M14.5 7.5a5 5 0 0 1 0 5" stroke="#8aaabb" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M17 5a8 8 0 0 1 0 10" stroke="#8aaabb" stroke-width="1.2" fill="none" stroke-linecap="round" opacity="0.5"/></svg>`;
      const menuIconOff = `<svg viewBox="0 0 20 20" fill="none"><path d="M3 7v6h4l5 5V2L7 7H3z" fill="#8aaabb" opacity="0.4"/><line x1="13" y1="7" x2="18" y2="13" stroke="#8aaabb" stroke-width="1.5" stroke-linecap="round"/><line x1="18" y1="7" x2="13" y2="13" stroke="#8aaabb" stroke-width="1.5" stroke-linecap="round"/></svg>`;
      hudSoundBtn.innerHTML = on ? onSvg : offSvg;
      hudSoundBtn.title = on ? 'Mute sound' : 'Unmute sound';
      const menuSoundBtn = document.getElementById('menu-sound-btn');
      if (menuSoundBtn) {
        menuSoundBtn.innerHTML = on ? menuIconOn : menuIconOff;
        menuSoundBtn.title = on ? 'Mute sound' : 'Unmute sound';
      }
    };
    syncSoundBtns();
    const onSoundToggle = () => { setSoundEnabled(!isSoundEnabled()); syncSoundBtns(); };
    hudSoundBtn.addEventListener('click', onSoundToggle);
    document.getElementById('menu-sound-btn')?.addEventListener('click', onSoundToggle);

    // How to Play buttons — menu and in-game HUD
    document.getElementById('menu-htp-btn')?.addEventListener('click', () => {
      this.showHowToPlay();
    });
    document.getElementById('btn-htp')?.addEventListener('click', () => {
      this.showHowToPlay();
    });

    touchControls.init();
  }

  // ── VISIBILITY ─────────────────────────────────────────────────

  private updateScale(): void {
    const scale = Math.max(window.innerWidth / 960, window.innerHeight / 576);
    document.documentElement.style.setProperty('--gs', scale.toFixed(4));
  }

  showHUD(): void {
    this.hudEl.classList.remove('hidden');
    this.ordersEl.classList.remove('hidden');
    this.menuOverlayEl.classList.add('hidden');
  }

  hideHUD(): void {
    this.hudEl.classList.add('hidden');
    this.ordersEl.classList.add('hidden');
    this.legendEl.classList.add('hidden');
    this.closeManager(true);
  }

  showDayReport(data: DayReportData): void {
    this.drBookings = data.bookings;
    this.drMoney = data.money;
    this.drTierLevel = data.tierLevel;
    this.dayReportEl.classList.remove('hidden');
    requestAnimationFrame(() => this.dayReportEl.classList.add('visible'));
    this.renderDayReport(data);
    const nextDayBtn = document.getElementById('dr-next-day')! as HTMLButtonElement;
    nextDayBtn.disabled = false;
    nextDayBtn.onclick = () => {
      nextDayBtn.disabled = true;
      this.game?.events.emit('game_event', { type: 'next_day' });
    };
  }

  hideDayReport(): void {
    this.dayReportEl.classList.remove('visible');
    this.dayReportEl.classList.add('hidden');
  }

  refreshDayReport(money: number, bookings: number): void {
    this.drMoney = money;
    this.drBookings = bookings;
    if (this.drTierLevel >= 4) this.renderDrBookings(money, bookings);
  }

  private renderDayReport(d: DayReportData): void {
    document.getElementById('dr-title')!.textContent = `Day ${d.day} Complete!`;

    const balanceAfterRent = d.money - d.rentDue;
    const struggling = balanceAfterRent < 0;
    document.getElementById('dr-stats')!.innerHTML = `
      <div class="dr-stat">
        <div class="dr-stat-label">Served</div>
        <div class="dr-stat-val green">${d.servedToday}</div>
      </div>
      <div class="dr-stat">
        <div class="dr-stat-label">Earned</div>
        <div class="dr-stat-val gold">${d.revenueToday} ✦</div>
      </div>
      <div class="dr-stat">
        <div class="dr-stat-label">Reputation</div>
        <div class="dr-stat-val">${d.reputation} / 100</div>
      </div>
      <div class="dr-stat">
        <div class="dr-stat-label">Cat Happiness</div>
        <div class="dr-stat-val pink">${Math.round(d.avgCatHappiness)}%</div>
      </div>
      <div class="dr-stat" style="grid-column:1/-1">
        <div class="dr-stat-label">Rent Due</div>
        <div class="dr-stat-val" style="color:#FF7755">-${d.rentDue} ✦</div>
      </div>
      <div class="dr-stat" style="grid-column:1/-1">
        <div class="dr-stat-label">Balance after rent</div>
        <div class="dr-stat-val ${struggling ? '' : 'gold'}" style="${struggling ? 'color:#FF4444' : ''};font-size:calc(20px * var(--gs))">${balanceAfterRent} ✦${struggling ? '  ⚠ STRUGGLING' : ''}</div>
      </div>`;

    this.renderDrChart(d);

    const bookSection = document.getElementById('dr-bookings-section')!;
    if (d.tierLevel >= 4) {
      bookSection.innerHTML = '<div class="dr-sep" style="margin-bottom:calc(12px * var(--gs))"></div><div id="dr-bookings-inner"></div>';
      this.renderDrBookings(d.money, d.bookings);
    } else {
      bookSection.innerHTML = '';
    }
  }

  private renderDrChart(d: DayReportData): void {
    const section = document.getElementById('dr-chart-section')!;
    const history = d.popularityHistory;
    if (history.length === 0) { section.innerHTML = ''; return; }
    const maxServed = Math.max(1, ...history.map(h => h.served));
    const bars = history.map(h => {
      const pct = Math.max(5, Math.round(h.served / maxServed * 100));
      const isCurrent = h.day === d.day;
      const color = isCurrent ? '#f0c018' : h.served >= maxServed * 0.7 ? '#55cc55' : h.served >= maxServed * 0.4 ? '#ffaa44' : '#556688';
      return `
        <div style="display:flex;flex-direction:column;align-items:center;flex:1;gap:3px;min-width:0">
          <div class="dr-bar" style="width:100%;height:${pct}%;background:${color};opacity:${isCurrent ? 1 : 0.75}"></div>
          <div style="font-size:calc(8px * var(--gs));color:${isCurrent ? 'var(--c-gold)' : 'var(--c-text-dim)'};font-family:'Space Mono',monospace;white-space:nowrap">${h.day}</div>
        </div>`;
    }).join('');
    section.innerHTML = `
      <div class="dr-section-title">Served per day</div>
      <div style="display:flex;align-items:flex-end;gap:calc(4px * var(--gs));height:calc(52px * var(--gs));padding-bottom:calc(16px * var(--gs));position:relative">${bars}</div>`;
  }

  private renderDrBookings(money: number, bookings: number): void {
    const el = document.getElementById('dr-bookings-inner');
    if (!el) return;
    el.innerHTML = `
      <div class="dr-section-title">Reservations for Tomorrow</div>
      <div class="dr-bookings-row">
        <div class="dr-book-info">
          <div class="dr-book-count">${bookings}/${MAX_BOOKINGS} reserved (${BOOKING_COST}✦ each)</div>
          <div class="dr-book-desc">${bookings > 0 ? `Booked guests arrive early · Cost: ${bookings * BOOKING_COST}✦` : 'No reservations — guests arrive normally'}</div>
        </div>
        <div class="dr-book-btns">
          <button class="dr-book-btn" id="dr-book-minus" ${bookings <= 0 ? 'disabled' : ''}>−</button>
          <button class="dr-book-btn" id="dr-book-plus"  ${bookings >= MAX_BOOKINGS || money < BOOKING_COST ? 'disabled' : ''}>+</button>
        </div>
      </div>`;
    document.getElementById('dr-book-minus')!.onclick = () =>
      this.game?.events.emit('game_event', { type: 'set_bookings', delta: -1 });
    document.getElementById('dr-book-plus')!.onclick = () =>
      this.game?.events.emit('game_event', { type: 'set_bookings', delta: +1 });
  }

  showMenu(hasSave: boolean, onStart: () => void, onNew: () => void): void {
    this.menuOverlayEl.classList.remove('hidden');
    this.menuButtonsEl.innerHTML = '';

    if (hasSave) {
      const contBtn = this.makeMenuBtn('Continue', 'primary');
      contBtn.addEventListener('click', () => {
        this.hideMenu();
        onStart();
      });
      this.menuButtonsEl.appendChild(contBtn);

      const newBtn = this.makeMenuBtn('New Game', 'secondary');
      newBtn.addEventListener('click', () => {
        this.hideMenu();
        this.showHowToPlay(onNew);
      });
      this.menuButtonsEl.appendChild(newBtn);
    } else {
      const startBtn = this.makeMenuBtn('Start Game', 'primary');
      startBtn.addEventListener('click', () => {
        this.hideMenu();
        this.showHowToPlay(onStart);
      });
      this.menuButtonsEl.appendChild(startBtn);
    }
  }

  hideMenu(): void {
    this.menuOverlayEl.classList.add('hidden');
  }

  showHowToPlay(onDone?: () => void): void {
    this.howToPlayEl.classList.remove('hidden');
    this.htpActionBtn.textContent = onDone ? "Let's Go! →" : 'Got it!';
    this.htpActionBtn.onclick = () => {
      this.howToPlayEl.classList.add('hidden');
      onDone?.();
    };
  }

  private makeMenuBtn(label: string, variant: 'primary' | 'secondary'): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = `mo-btn mo-btn-${variant}`;
    btn.textContent = label;
    return btn;
  }

  // ── MANAGER ────────────────────────────────────────────────────

  isStoreOpen(): boolean { return this.managerOpen; }

  openStore(silent = false): void { this.openManager(silent); }
  closeStore(silent = false): void { this.closeManager(silent); }

  setBuildModeActive(active: boolean): void {
    document.getElementById('btn-build')?.classList.toggle('active', active);
  }

  openManager(silent = false): void {
    if (this.managerOpen) return;
    this.managerOpen = true;
    this.lastManagerFingerprint = '';
    this.managerPanelEl.classList.add('open');
    this.managerBackdropEl.style.display = 'block';
    if (!silent) this.game?.events.emit('game_event', { type: 'open_store_panel' });
    this.refreshManager();
  }

  closeManager(silent = false): void {
    if (!this.managerOpen) return;
    this.managerOpen = false;
    this.managerPanelEl.classList.remove('open');
    this.managerBackdropEl.style.display = 'none';
    if (!silent) this.game?.events.emit('game_event', { type: 'close_store_panel' });
  }

  private switchSection(section: ManagerSection): void {
    this.activeSection = section;
    this.lastManagerFingerprint = '';
    document.querySelectorAll('.mgr-nav-item').forEach(el => {
      (el as HTMLElement).classList.toggle('active', (el as HTMLElement).dataset.section === section);
    });
    this.refreshManager();
  }

  private sectionFingerprint(s: UIState): string {
    switch (this.activeSection) {
      case 'overview':
        return `${s.tierLevel}|${s.ambiance}|${s.money}|${s.employees}|${s.cooks}|${s.guards}|${s.caterers}|${(s.dailyMenuIds ?? []).join(',')}`;
      case 'furnish':
        return `${this.activeFurnishTab}|${s.tierLevel}|${s.ambiance}|${s.money}`;
      case 'kitchen':
        return `${(s.ownedMachines ?? []).join(',')}|${s.money}`;
      case 'staff':
        return `${s.tierLevel}|${s.money}|${s.employees}|${s.cooks}|${s.guards}|${s.caterers}`;
      case 'menu':
        return `${s.tierLevel}|${s.money}|${(s.ownedMachines ?? []).join(',')}|${(s.ownedRecipeIds ?? []).join(',')}|${(s.dailyMenuIds ?? []).join(',')}`;
      case 'expand':
        return `${s.money}|${s.reputation}|${(s.ownedExpansionIds ?? []).join(',')}`;
    }
  }

  private refreshManager(): void {
    if (!this.managerOpen || !this.lastState) return;
    const fp = this.sectionFingerprint(this.lastState);
    if (fp === this.lastManagerFingerprint) return;
    this.lastManagerFingerprint = fp;
    const s = this.lastState;
    switch (this.activeSection) {
      case 'overview': this.renderOverview(s); break;
      case 'furnish':  this.renderFurnish(s);  break;
      case 'kitchen':  this.renderKitchen(s);  break;
      case 'staff':    this.renderStaff(s);    break;
      case 'menu':     this.renderMenu(s);     break;
      case 'expand':   this.renderExpand(s);   break;
    }
  }

  // ── OVERVIEW ───────────────────────────────────────────────────

  private renderOverview(s: UIState): void {
    const tier = s.tierLevel ?? 1;
    const ambiance = s.ambiance ?? 0;
    const nextTier = CAFE_TIERS.find(t => t.level === tier + 1);

    let html = '';

    // Tier progress
    if (nextTier) {
      const pct = Math.min(1, ambiance / nextTier.ambianceRequired);
      html += `
        <div class="sp-tier-card">
          <div class="sp-tier-row">
            <span class="sp-tier-cur">${s.tierName ?? 'Tier ' + tier}</span>
            <span class="sp-tier-arrow">&#8594;</span>
            <span class="sp-tier-nxt">${nextTier.name}</span>
          </div>
          <div class="sp-tier-bar-track">
            <div class="sp-tier-bar-fill" style="width:${pct * 100}%"></div>
          </div>
          <div class="sp-tier-hint">${ambiance} / ${nextTier.ambianceRequired} ambiance &mdash; place decorations to upgrade</div>
        </div>`;
    } else {
      html += `<div class="sp-tier-card sp-tier-maxed">&#9733; Max tier reached: ${s.tierName ?? ''}</div>`;
    }

    // Summary grid
    html += `<div class="ov-grid">`;

    // ── Staff card
    html += `<div class="ov-card">`;
    html += `<div class="ov-card-title">Staff</div>`;
    const visibleStaff = EMPLOYEE_TYPES.filter(e => !e.minTier || e.minTier <= tier);
    if (visibleStaff.length === 0) {
      html += `<div class="ov-empty-hint">Upgrade café to unlock staff.</div>`;
    } else {
      visibleStaff.forEach(emp => {
        const count = this.getCount(s, emp.role);
        html += `
          <div class="ov-role-row">
            <div class="ov-role-icon">${ROLE_ICONS[emp.role]}</div>
            <div class="ov-role-info">
              <div class="ov-role-name">${emp.name}</div>
              <div class="ov-role-count">${count}/${emp.max} hired</div>
            </div>
          </div>`;
      });
    }
    html += `<div class="ov-card-manage" data-goto-section="staff">Hire staff &#8594;</div>`;
    html += `</div>`;

    // ── Kitchen card
    html += `<div class="ov-card">`;
    html += `<div class="ov-card-title">Kitchen</div>`;
    const ownedMachines = new Set(s.ownedMachines ?? ['espresso_machine']);
    MACHINE_DEFS.forEach(def => {
      const isOwned = ownedMachines.has(def.id);
      html += `
        <div class="ov-equip-row">
          <div class="ov-equip-check ${isOwned ? 'owned' : 'missing'}">${isOwned ? '&#10003;' : '&#8729;'}</div>
          <span style="color:${isOwned ? 'var(--c-text)' : 'var(--c-text-dim)'};opacity:${isOwned ? 1 : 0.45}">${def.name}</span>
        </div>`;
    });
    html += `<div class="ov-card-manage" data-goto-section="kitchen">Upgrade kitchen &#8594;</div>`;
    html += `</div>`;

    // ── Menu card
    html += `<div class="ov-card">`;
    html += `<div class="ov-card-title">Today&apos;s Menu</div>`;
    const dailyIds = new Set<string>(s.dailyMenuIds ?? s.ownedRecipeIds ?? ['moon_mocha', 'zerog_latte']);
    const allItems = MENU_ITEMS as readonly MenuItemDef[];
    const onMenu = allItems.filter(i => dailyIds.has(i.id));
    const MAX_SHOW = 4;
    onMenu.slice(0, MAX_SHOW).forEach(item => {
      const icon = FOOD_ICONS[item.id] ?? svg(`<rect x="6" y="6" width="12" height="12" rx="2" fill="#887766"/>`);
      html += `
        <div class="ov-menu-item">
          <div class="ov-food-icon">${icon}</div>
          <div class="ov-food-name">${item.name}</div>
        </div>`;
    });
    if (onMenu.length > MAX_SHOW) {
      html += `<div style="font-size:calc(10px * var(--gs));color:var(--c-text-dim);font-family:'Space Mono',monospace;margin-top:calc(4px * var(--gs))">+${onMenu.length - MAX_SHOW} more</div>`;
    }
    if (onMenu.length === 0) {
      html += `<div class="ov-empty-hint">No items on today&apos;s menu.</div>`;
    }
    html += `<div class="ov-card-manage" data-goto-section="menu">Edit menu &#8594;</div>`;
    html += `</div>`;

    html += `</div>`; // end ov-grid

    this.managerContentEl.innerHTML = html;

    this.managerContentEl.querySelectorAll<HTMLElement>('[data-goto-section]').forEach(el => {
      el.addEventListener('click', () => {
        this.switchSection(el.dataset.gotoSection as ManagerSection);
      });
    });
  }

  // ── FURNISH ────────────────────────────────────────────────────

  private renderFurnish(s: UIState): void {
    const cats: DecorationCategory[] = ['seating', 'furniture', 'lighting', 'plants', 'wallDecor', 'specialty'];
    const labels: Record<DecorationCategory, string> = {
      seating: 'Tables', furniture: 'Decor', lighting: 'Lighting',
      plants: 'Plants', wallDecor: 'Wall', specialty: 'Special',
    };
    const tier = s.tierLevel ?? 1;
    const ambiance = s.ambiance ?? 0;

    const nextTier = CAFE_TIERS.find(t => t.level === tier + 1);
    let html = '';
    if (nextTier) {
      const pct = Math.min(1, ambiance / nextTier.ambianceRequired);
      html += `
        <div class="sp-tier-card">
          <div class="sp-tier-row">
            <span class="sp-tier-cur">${s.tierName ?? 'Tier ' + tier}</span>
            <span class="sp-tier-arrow">&#8594;</span>
            <span class="sp-tier-nxt">${nextTier.name}</span>
          </div>
          <div class="sp-tier-bar-track">
            <div class="sp-tier-bar-fill" style="width:${pct * 100}%"></div>
          </div>
          <div class="sp-tier-hint">${ambiance} / ${nextTier.ambianceRequired} ambiance &mdash; place decorations to upgrade</div>
          ${this.renderAmbiancePath(ambiance, nextTier.ambianceRequired, tier)}
        </div>`;
    } else {
      html += `<div class="sp-tier-card sp-tier-maxed">Max tier reached: ${s.tierName ?? ''}</div>`;
    }

    html += '<div class="sp-subtabs">';
    cats.forEach(c => {
      const active = c === this.activeFurnishTab ? ' active' : '';
      html += `<span class="sp-subtab${active}" data-subtab="${c}">${labels[c]}</span>`;
    });
    html += '</div>';

    if (this.activeFurnishTab === 'seating') {
      html += `<p class="sp-meta">Buy to place a table — click on any floor tile</p>`;
    } else {
      html += `<p class="sp-meta">Buy to enter placement mode · tap placed item to sell</p>`;
    }

    const items = DECORATION_ITEMS.filter(d =>
      d.category === this.activeFurnishTab && (!d.minTier || d.minTier <= tier),
    );

    if (items.length === 0) {
      html += `<p class="sp-empty">Upgrade your café to unlock items in this category.</p>`;
    } else {
      items.forEach(item => {
        const can = s.money >= item.cost;
        const desc = item.seats
          ? `${item.seats} seat${item.seats > 1 ? 's' : ''} · place on any floor tile`
          : `+${item.ambianceValue} ambiance`;
        const icon = ITEM_ICONS[item.spriteKey] ?? categoryFallbackIcon(item.category);
        html += this.itemCard({
          icon, name: item.name, desc,
          cost: item.cost, can, owned: false,
          attr: `data-place-decor="${item.id}"`, btnLabel: 'Place',
        });
      });
    }

    this.managerContentEl.innerHTML = html;

    this.managerContentEl.querySelectorAll('.sp-subtab').forEach(el => {
      (el as HTMLElement).addEventListener('click', () => {
        this.activeFurnishTab = (el as HTMLElement).dataset.subtab as DecorationCategory;
        this.renderFurnish(s);
      });
    });

    this.attachListeners();
  }

  private renderKitchen(s: UIState): void {
    const owned = new Set(s.ownedMachines ?? ['espresso_machine']);
    let html = '';

    MACHINE_DEFS.forEach(def => {
      if (def.starter) return;
      const isOwned = owned.has(def.id);
      const can = !isOwned && (s.money ?? 0) >= def.cost;
      const icon = ITEM_ICONS[def.texKey] ?? ITEM_ICONS['obj_coffee_machine'];
      html += this.itemCard({
        icon, name: def.name, desc: def.desc,
        cost: def.cost, can, owned: isOwned,
        attr: `data-buy-machine="${def.id}"`, btnLabel: 'Buy',
      });
    });

    this.managerContentEl.innerHTML = html;
    this.attachListeners();
  }

  private renderStaff(s: UIState): void {
    const tier = s.tierLevel ?? 1;
    let html = '';
    EMPLOYEE_TYPES.forEach(emp => {
      if (emp.minTier && emp.minTier > tier) return;
      const current = this.getCount(s, emp.role);
      const maxed = current >= emp.max;
      const can = !maxed && s.money >= emp.cost;
      html += this.itemCard({
        icon: ROLE_ICONS[emp.role],
        name: emp.name,
        desc: `${emp.desc} · ${current}/${emp.max} hired`,
        cost: emp.cost,
        can: can && !maxed,
        owned: false,
        disabled: maxed,
        attr: `data-hire-staff="${emp.role}"`,
        btnLabel: maxed ? 'Full' : 'Hire',
      });
    });

    const locked = EMPLOYEE_TYPES.filter(e => e.minTier && e.minTier > tier);
    if (locked.length > 0) {
      const next = locked.reduce((a, b) => (a.minTier ?? 99) < (b.minTier ?? 99) ? a : b);
      const tierName = CAFE_TIERS.find(t => t.level === next.minTier)?.name ?? `Tier ${next.minTier}`;
      html += `<p class="sp-meta" style="margin-top:12px;border-top:1px solid rgba(255,255,255,0.06);padding-top:12px">
        ${locked.length} more staff unlock as your café upgrades &mdash; next at <strong>${tierName}</strong>.
      </p>`;
    }

    this.managerContentEl.innerHTML = html;
    this.attachListeners();
  }

  private renderMenu(s: UIState): void {
    const tier = s.tierLevel ?? 1;
    const tierDef = CAFE_TIERS.find(t => t.level === tier)!;
    const tierUnlocked = new Set<string>(tierDef?.unlockedMenuIds ?? []);
    const owned = new Set<string>(s.ownedRecipeIds ?? ['moon_mocha', 'zerog_latte']);
    const daily = new Set<string>(s.dailyMenuIds ?? owned);
    const money = s.money ?? 0;
    const ownedMachines = new Set<string>(s.ownedMachines ?? ['espresso_machine']);

    const allItems = MENU_ITEMS as readonly MenuItemDef[];

    let html = '';

    // ── On today's menu
    const onMenu = allItems.filter(i => daily.has(i.id));
    if (onMenu.length > 0) {
      html += `<p class="sp-meta" style="margin-bottom:6px">Serving today &mdash; toggle to remove from today&apos;s menu.</p>`;
      onMenu.forEach(item => {
        const icon = FOOD_ICONS[item.id] ?? svg(`<rect x="6" y="6" width="12" height="12" rx="2" fill="#887766"/>`);
        const prepSec = Math.round(item.prepTime / 1000);
        const canRemove = onMenu.length > 1;
        html += `
          <div class="si afford">
            <div class="si-icon">${icon}</div>
            <div class="si-info">
              <div class="si-name">${item.name} <span style="font-size:0.75em;color:#44bb66;font-weight:400">● Serving</span></div>
              <div class="si-desc">${machineLabel(item.machines)} &middot; ${prepSec}s &middot; ${item.price} ✦</div>
            </div>
            <div class="si-right">
              <button class="si-btn${canRemove ? '' : ' disabled'}"${canRemove ? '' : ' disabled'}${canRemove ? '' : ' title="Need at least one item on the menu"'} data-toggle-recipe="${item.id}" style="font-size:0.85em">Remove</button>
            </div>
          </div>`;
      });
    }

    // ── Owned but off menu
    const offMenu = allItems.filter(i => owned.has(i.id) && !daily.has(i.id));
    if (offMenu.length > 0) {
      html += `<p class="sp-meta" style="margin-top:12px;margin-bottom:6px;border-top:1px solid rgba(255,255,255,0.06);padding-top:12px">
        Your recipes &mdash; not on today&apos;s menu.</p>`;
      offMenu.forEach(item => {
        const icon = FOOD_ICONS[item.id] ?? svg(`<rect x="6" y="6" width="12" height="12" rx="2" fill="#887766"/>`);
        const prepSec = Math.round(item.prepTime / 1000);
        html += `
          <div class="si">
            <div class="si-icon" style="opacity:0.55">${icon}</div>
            <div class="si-info">
              <div class="si-name" style="opacity:0.75">${item.name}</div>
              <div class="si-desc">${machineLabel(item.machines)} &middot; ${prepSec}s &middot; ${item.price} ✦</div>
            </div>
            <div class="si-right">
              <button class="si-btn" data-toggle-recipe="${item.id}" style="font-size:0.85em">Add today</button>
            </div>
          </div>`;
      });
    }

    // ── Buyable (tier-unlocked, all machines owned, not yet owned)
    const buyable = allItems.filter(i => tierUnlocked.has(i.id) && !owned.has(i.id) && i.machines.every(m => ownedMachines.has(m)));
    if (buyable.length > 0) {
      html += `<p class="sp-meta" style="margin-top:12px;margin-bottom:6px;border-top:1px solid rgba(255,255,255,0.06);padding-top:12px">
        Available to learn.</p>`;
      buyable.forEach(item => {
        const icon = FOOD_ICONS[item.id] ?? svg(`<rect x="6" y="6" width="12" height="12" rx="2" fill="#887766"/>`);
        const cost = item.recipeCost ?? 0;
        const canAfford = money >= cost;
        html += `
          <div class="si ${canAfford ? '' : ''}">
            <div class="si-icon" style="opacity:0.6">${icon}</div>
            <div class="si-info">
              <div class="si-name" style="opacity:0.8">${item.name}</div>
              <div class="si-desc">${item.description ?? ''}</div>
            </div>
            <div class="si-right">
              <span class="si-cost${canAfford ? '' : ' dim'}">${cost} ✦</span>
              <button class="si-btn${canAfford ? '' : ' disabled'}"${canAfford ? '' : ' disabled'} data-buy-recipe="${item.id}">Learn</button>
            </div>
          </div>`;
      });
    }

    // ── Machine-locked (tier-unlocked but missing a required machine)
    const machineLocked = allItems.filter(i => tierUnlocked.has(i.id) && !owned.has(i.id) && !i.machines.every(m => ownedMachines.has(m)));
    if (machineLocked.length > 0) {
      html += `<p class="sp-meta" style="margin-top:12px;margin-bottom:6px;border-top:1px solid rgba(255,255,255,0.06);padding-top:12px">
        Requires machines you don&apos;t own yet.</p>`;
      machineLocked.forEach(item => {
        const icon = FOOD_ICONS[item.id] ?? svg(`<rect x="6" y="6" width="12" height="12" rx="2" fill="#887766"/>`);
        const missing = item.machines.filter(m => !ownedMachines.has(m)).map(machineName).join(', ');
        html += `
          <div class="si">
            <div class="si-icon" style="opacity:0.35">${icon}</div>
            <div class="si-info">
              <div class="si-name" style="opacity:0.5">${item.name}</div>
              <div class="si-desc" style="opacity:0.6">Needs: ${missing}</div>
            </div>
            <div class="si-right">
              <button class="si-btn disabled" disabled>Locked</button>
            </div>
          </div>`;
      });
    }

    // ── Tier-locked
    const tierLocked = allItems.filter(i => !tierUnlocked.has(i.id));
    if (tierLocked.length > 0) {
      html += `<p class="sp-meta" style="margin-top:12px;border-top:1px solid rgba(255,255,255,0.06);padding-top:12px">
        ${tierLocked.length} more recipe${tierLocked.length > 1 ? 's' : ''} unlock as your café upgrades.</p>`;
    }

    this.managerContentEl.innerHTML = html;
    this.attachListeners();
  }

  private itemCard(o: {
    icon: string; name: string; desc: string;
    cost: number; can: boolean; owned: boolean;
    attr: string; btnLabel: string; disabled?: boolean;
  }): string {
    const cls = o.owned ? 'owned' : o.can ? 'afford' : '';
    const costCls = o.can || o.owned ? '' : ' dim';
    const btnCls = o.owned ? ' owned-lbl' : '';
    const isDisabled = o.disabled || (!o.can && !o.owned);
    const disabledAttr = isDisabled ? ' disabled' : '';
    const needsConfirm = !o.owned && !isDisabled && o.cost >= 300;
    const confirmAttr = needsConfirm ? ' data-needs-confirm="1"' : '';
    return `
      <div class="si ${cls}">
        <div class="si-icon">${o.icon}</div>
        <div class="si-info">
          <div class="si-name">${o.name}</div>
          <div class="si-desc">${o.desc.replace(/\n/g, '<br>')}</div>
        </div>
        <div class="si-right">
          <span class="si-cost${costCls}">${o.cost} ✦</span>
          <button class="si-btn${btnCls}"${disabledAttr}${confirmAttr} ${o.attr}>${o.owned ? '&#10003; Owned' : o.btnLabel}</button>
        </div>
      </div>`;
  }

  private renderExpand(s: UIState): void {
    const owned = new Set<string>(s.ownedExpansionIds ?? []);
    const money = s.money ?? 0;
    const rep = s.reputation ?? 0;
    let html = '';

    html += `<p class="sp-meta">Purchase expansions to grow your café. Takes effect the next day.</p>`;

    if (EXPANSION_ZONES.length === 0) {
      html += `<p class="sp-empty">No expansions available yet.</p>`;
    } else {
      EXPANSION_ZONES.forEach(zone => {
        const isOwned = owned.has(zone.id);
        const repLocked = rep < zone.minReputation;
        const canAfford = money >= zone.cost;
        const can = !isOwned && !repLocked && canAfford;
        const cls = isOwned ? 'owned' : can ? 'afford' : '';
        const costCls = can || isOwned ? '' : ' dim';
        const icon = svg(`
          <rect x="3" y="10" width="22" height="14" rx="2" fill="#334455"/>
          <rect x="3" y="7" width="10" height="7" rx="2" fill="#445566"/>
          <rect x="15" y="7" width="10" height="7" rx="2" fill="#445566"/>
          <rect x="12" y="5" width="4" height="4" rx="1" fill="#88ddff" opacity="0.6"/>
        `);
        const lockNote = repLocked
          ? `<div style="font-size:calc(10px * var(--gs));color:#FF6644;margin-top:calc(3px * var(--gs))">Needs ${zone.minReputation} rep (you have ${rep})</div>`
          : '';
        html += `
          <div class="si ${cls}">
            <div class="si-icon">${icon}</div>
            <div class="si-info">
              <div class="si-name">${zone.name}</div>
              <div class="si-desc">${zone.desc}</div>
              ${lockNote}
            </div>
            <div class="si-right">
              <span class="si-cost${costCls}">${zone.cost} ✦</span>
              <button class="si-btn${isOwned ? ' owned-lbl' : ''}"${(isOwned || repLocked || !canAfford) ? ' disabled' : ''} data-buy-expansion="${zone.id}">
                ${isOwned ? '&#10003; Owned' : 'Buy'}
              </button>
            </div>
          </div>`;
      });
    }

    this.managerContentEl.innerHTML = html;
    this.attachListeners();
  }

  private renderAmbiancePath(currentAmbiance: number, needed: number, tier: number): string {
    const deficit = needed - currentAmbiance;
    if (deficit <= 0) return '';
    // Find cheapest combination of available decoration items that covers the deficit
    const candidates = DECORATION_ITEMS
      .filter(d => d.ambianceValue > 0 && (!d.minTier || d.minTier <= tier))
      .sort((a, b) => b.ambianceValue - a.ambianceValue);  // highest value first
    if (candidates.length === 0) return '';

    // Greedy fill: take multiples of the best-value/cost item until covered
    const picks: string[] = [];
    let remaining = deficit;
    for (const item of candidates) {
      if (remaining <= 0) break;
      const count = Math.ceil(remaining / item.ambianceValue);
      const qty = Math.min(count, 3); // cap display at 3 of any one item
      picks.push(`${qty > 1 ? qty + '× ' : ''}${item.name} (+${qty * item.ambianceValue} ✦ ambiance)`);
      remaining -= qty * item.ambianceValue;
    }
    if (picks.length === 0) return '';
    return `<div style="font-size:calc(10px * var(--gs));color:var(--c-text-dim);margin-top:calc(4px * var(--gs));line-height:1.4">
      Quick path: ${picks.slice(0, 2).join(', ')}
    </div>`;
  }

  private withConfirm(btn: HTMLElement, action: () => void): void {
    if (!btn.dataset.needsConfirm) { action(); return; }
    if (btn.dataset.confirming === '1') {
      btn.dataset.confirming = '';
      btn.textContent = btn.dataset.origLabel ?? 'Buy';
      btn.style.background = '';
      action();
    } else {
      btn.dataset.confirming = '1';
      btn.dataset.origLabel = btn.textContent ?? 'Buy';
      btn.textContent = 'Confirm →';
      btn.style.background = 'rgba(255,180,30,0.25)';
      const reset = () => {
        if (btn.dataset.confirming !== '1') return;
        btn.dataset.confirming = '';
        btn.textContent = btn.dataset.origLabel ?? 'Buy';
        btn.style.background = '';
      };
      document.addEventListener('click', function handler(e) {
        if (e.target !== btn) { reset(); document.removeEventListener('click', handler); }
      });
    }
  }

  private attachListeners(): void {
    this.managerContentEl.querySelectorAll<HTMLElement>('[data-buy-machine]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.withConfirm(btn, () => {
          this.game?.events.emit('game_event', { type: 'buy_machine', machineId: btn.dataset.buyMachine });
        });
      });
    });
    this.managerContentEl.querySelectorAll<HTMLElement>('[data-hire-staff]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.withConfirm(btn, () => {
          this.game?.events.emit('game_event', { type: 'hire_staff', role: btn.dataset.hireStaff as EmployeeRole });
        });
      });
    });
    this.managerContentEl.querySelectorAll<HTMLElement>('[data-place-decor]').forEach(btn => {
      btn.addEventListener('click', () => {
        const defId = btn.dataset.placeDecor;
        this.withConfirm(btn, () => {
          this.closeManager();
          setTimeout(() => {
            this.game?.events.emit('game_event', { type: 'start_placement', defId });
          }, 0);
        });
      });
    });
    this.managerContentEl.querySelectorAll<HTMLElement>('[data-buy-recipe]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.withConfirm(btn, () => {
          this.game?.events.emit('game_event', { type: 'buy_recipe', itemId: btn.dataset.buyRecipe });
        });
      });
    });
    this.managerContentEl.querySelectorAll<HTMLElement>('[data-toggle-recipe]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.game?.events.emit('game_event', { type: 'toggle_daily_recipe', itemId: btn.dataset.toggleRecipe });
      });
    });
    this.managerContentEl.querySelectorAll<HTMLElement>('[data-buy-expansion]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.withConfirm(btn, () => {
          this.game?.events.emit('game_event', { type: 'buy_expansion', zoneId: btn.dataset.buyExpansion });
        });
      });
    });
  }

  private getCount(s: UIState, role: EmployeeRole): number {
    switch (role) {
      case 'waiter':  return s.employees ?? 0;
      case 'cook':    return s.cooks ?? 0;
      case 'guard':   return s.guards ?? 0;
      case 'caterer': return s.caterers ?? 0;
    }
  }

  // ── STATE ───────────────────────────────────────────────────────

  applyState(state: UIState): void {
    this.lastState = state;

    if (state.money !== this.prevMoney) {
      this.moneyEl.classList.remove('bump');
      void this.moneyEl.offsetWidth;
      this.moneyEl.classList.add('bump');
      this.prevMoney = state.money;
    }
    this.moneyEl.textContent = String(state.money);
    this.managerBalanceEl.textContent = String(state.money);

    if (state.reputation !== this.prevRep) {
      this.repEl.style.color = state.reputation > this.prevRep ? '#FFE566' : '#FF6644';
      setTimeout(() => { if (this.repEl) this.repEl.style.color = '#FFE566'; }, 600);
      this.prevRep = state.reputation;
    }
    this.repEl.textContent = String(state.reputation);

    this.catEl.textContent = `${state.catHappiness}%`;
    this.catEl.style.color = state.catHappiness > 60 ? '#FF9AB0' : state.catHappiness > 30 ? '#FFAA44' : '#FF4444';

    if (state.tierName)                    this.tierEl.textContent     = state.tierName;
    if (state.ambiance !== undefined)      this.ambianceEl.textContent = `✦ ${state.ambiance} ambiance`;

    this.dayLabelEl.textContent = `Day ${state.day}`;

    const p = Math.max(0, Math.min(1, state.dayProgress));
    this.dayBarFillEl.style.width = `${p * 100}%`;
    this.dayBarFillEl.style.background = p < 0.33
      ? 'linear-gradient(90deg, #ffcc66, #ff9933)'
      : p < 0.66
      ? 'linear-gradient(90deg, #ff9933, #cc6600)'
      : 'linear-gradient(90deg, #9966aa, #664488)';

    const phaseLabel = state.phase.charAt(0).toUpperCase() + state.phase.slice(1);
    const phaseDot = state.phase === 'morning' ? '#ffcc44' : state.phase === 'afternoon' ? '#ff9933' : '#9966cc';
    this.phaseEl.innerHTML = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${phaseDot};margin-right:5px;vertical-align:middle"></span>${phaseLabel}`;

    const timeEl = document.getElementById('time-remaining');
    if (timeEl && state.dayProgress !== undefined) {
      const remainMs = Math.max(0, (1 - state.dayProgress) * 300000);
      const m = Math.floor(remainMs / 60000);
      const s = Math.floor((remainMs % 60000) / 1000);
      timeEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
      timeEl.style.color = remainMs < 60000 ? '#FF4444' : remainMs < 90000 ? '#FFAA33' : '';
    }

    this.renderOrders(state.orders ?? []);

    if (this.managerOpen) this.refreshManager();
  }

  // ── ORDERS ──────────────────────────────────────────────────────

  private renderOrders(orders: OrderInfo[]): void {
    const statusInfo = (s: OrderInfo['status']) => {
      switch (s) {
        case 'queued':   return { label: 'waiting',    color: '#998877', stripe: '#998877' };
        case 'cooking':  return { label: 'cooking...',  color: '#5599cc', stripe: '#5599cc' };
        case 'ready':    return { label: 'READY',       color: '#44bb66', stripe: '#44bb66' };
        case 'carrying': return { label: 'serving',    color: '#ccaa00', stripe: '#ccaa00' };
      }
    };

    const MAX_VISIBLE = 4;
    const overflow = orders.length - MAX_VISIBLE;
    const overflowTag = overflow > 0
      ? `<div class="order-ticket" style="justify-content:center;align-items:center;opacity:0.65;font-size:calc(9px * var(--gs));padding:0 4px">+${overflow} more</div>`
      : '';
    this.ordersEl.innerHTML = orders.slice(0, MAX_VISIBLE).map(o => {
      const si = statusInfo(o.status);
      const prog = o.status === 'cooking'
        ? `<div class="ot-prog"><div class="ot-prog-fill" style="width:${o.progress * 100}%"></div></div>`
        : '';
      return `
        <div class="order-ticket">
          <div class="ot-rail"></div>
          <div class="ot-body">
            <div class="ot-stripe" style="background:${si.stripe}"></div>
            <div class="ot-badge">T${o.tableId + 1}</div>
            <div class="ot-name">${o.itemName}</div>
            <div class="ot-status" style="color:${si.color}">${si.label}</div>
            ${prog}
            <div class="ot-type">${o.stationType}</div>
          </div>
          <div class="ot-fringe"></div>
        </div>`;
    }).join('') + overflowTag;
  }
}

export const uiOverlay = new UIOverlay();
