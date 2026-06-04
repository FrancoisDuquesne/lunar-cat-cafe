import Phaser from 'phaser';
import {
  EMPLOYEE_TYPES, DECORATION_ITEMS, CAFE_TIERS, MENU_ITEMS,
  DecorationCategory, EmployeeRole,
} from '../constants';
import type { OrderInfo } from '../types';
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
  extraMachines?: number;
  ownedRecipeIds?: string[];
  dailyMenuIds?: string[];
}

type StoreTab = 'furnish' | 'kitchen' | 'staff' | 'menu';

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
  // Kitchen
  'obj_coffee_machine': svg(`
    <rect x="5" y="6" width="18" height="16" rx="2" fill="#334455"/>
    <rect x="7" y="8" width="8" height="6" rx="1" fill="#1a2233"/>
    <circle cx="19.5" cy="11" r="2.8" fill="#223344" stroke="#556677" stroke-width="1"/>
    <rect x="8.5" y="17.5" width="7" height="2" rx="1" fill="#ff8844"/>
    <rect x="10" y="19.5" width="5" height="3" rx="1" fill="#6a3810"/>
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

const STATION_LABELS: Record<string, string> = {
  coffee: 'Coffee Machine',
  stove: 'Stove',
  prep: 'Prep Counter',
};

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
  private storeOpen = false;
  private activeTab: StoreTab = 'furnish';
  private activeFurnishTab: DecorationCategory = 'seating';
  private lastState: UIState | null = null;
  private prevMoney = 0;
  private prevRep = 0;

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
  private storePanelEl!: HTMLElement;
  private storeContentEl!: HTMLElement;
  private menuOverlayEl!: HTMLElement;
  private menuButtonsEl!: HTMLElement;
  private legendEl!: HTMLElement;
  private backdropEl!: HTMLElement;

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
    this.storePanelEl   = document.getElementById('store-panel')!;
    this.storeContentEl = document.getElementById('store-content')!;
    this.menuOverlayEl  = document.getElementById('menu-overlay')!;
    this.menuButtonsEl  = document.getElementById('menu-buttons')!;
    this.legendEl       = document.getElementById('legend')!;
    this.backdropEl     = document.getElementById('store-backdrop')!;

    document.getElementById('btn-store')!.addEventListener('click', () => {
      if (this.storeOpen) this.closeStore();
      else this.openStore();
    });

    document.getElementById('btn-menu')!.addEventListener('click', () => {
      game.events.emit('go_menu');
    });

    document.getElementById('store-close')!.addEventListener('click', () => this.closeStore());

    this.backdropEl.addEventListener('click', () => this.closeStore());

    touchControls.init();

    document.querySelectorAll('.sp-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const id = (tab as HTMLElement).dataset.tab as StoreTab;
        this.activeTab = id;
        document.querySelectorAll('.sp-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.refreshStore();
      });
    });
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
    this.closeStore(true);
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
        onNew();
      });
      this.menuButtonsEl.appendChild(newBtn);
    } else {
      const startBtn = this.makeMenuBtn('Start Game', 'primary');
      startBtn.addEventListener('click', () => {
        this.hideMenu();
        onStart();
      });
      this.menuButtonsEl.appendChild(startBtn);
    }
  }

  hideMenu(): void {
    this.menuOverlayEl.classList.add('hidden');
  }

  private makeMenuBtn(label: string, variant: 'primary' | 'secondary'): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = `mo-btn mo-btn-${variant}`;
    btn.textContent = label;
    return btn;
  }

  // ── STORE ───────────────────────────────────────────────────────

  isStoreOpen(): boolean { return this.storeOpen; }

  openStore(silent = false): void {
    if (this.storeOpen) return;
    this.storeOpen = true;
    this.storePanelEl.classList.add('open');
    this.backdropEl.style.display = 'block';
    if (!silent) this.game?.events.emit('game_event', { type: 'open_store_panel' });
    this.refreshStore();
  }

  closeStore(silent = false): void {
    if (!this.storeOpen) return;
    this.storeOpen = false;
    this.storePanelEl.classList.remove('open');
    this.backdropEl.style.display = 'none';
    if (!silent) this.game?.events.emit('game_event', { type: 'close_store_panel' });
  }

  private refreshStore(): void {
    if (!this.storeOpen || !this.lastState) return;
    const s = this.lastState;
    switch (this.activeTab) {
      case 'furnish': this.renderFurnish(s); break;
      case 'kitchen': this.renderKitchen(s); break;
      case 'staff':   this.renderStaff(s);   break;
      case 'menu':    this.renderMenu(s);     break;
    }
  }

  private renderFurnish(s: UIState): void {
    const cats: DecorationCategory[] = ['seating', 'furniture', 'lighting', 'plants', 'wallDecor', 'specialty'];
    const labels: Record<DecorationCategory, string> = {
      seating: 'Tables', furniture: 'Decor', lighting: 'Lighting',
      plants: 'Plants', wallDecor: 'Wall', specialty: 'Special',
    };
    const tier = s.tierLevel ?? 1;
    const ambiance = s.ambiance ?? 0;

    // Tier progress banner
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

    this.storeContentEl.innerHTML = html;

    this.storeContentEl.querySelectorAll('.sp-subtab').forEach(el => {
      (el as HTMLElement).addEventListener('click', () => {
        this.activeFurnishTab = (el as HTMLElement).dataset.subtab as DecorationCategory;
        this.renderFurnish(s);
      });
    });

    this.attachListeners();
  }

  private renderKitchen(s: UIState): void {
    const hasMachines = (s.extraMachines ?? 0) >= 1;
    const can = !hasMachines && s.money >= 180;
    let html = this.itemCard({
      icon: ITEM_ICONS['obj_coffee_machine'],
      name: 'Extra Machines',
      desc: '+1 of each station · parallel cooking',
      cost: 180, can, owned: hasMachines,
      attr: `data-buy-kitchen="extra_machines"`, btnLabel: 'Buy',
    });
    html += `<p class="sp-meta" style="margin-top:14px;color:#443322">More upgrades coming soon!</p>`;
    this.storeContentEl.innerHTML = html;
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

    this.storeContentEl.innerHTML = html;
    this.attachListeners();
  }

  private renderMenu(s: UIState): void {
    const tier = s.tierLevel ?? 1;
    const tierDef = CAFE_TIERS.find(t => t.level === tier)!;
    const tierUnlocked = new Set<string>(tierDef?.unlockedMenuIds ?? []);
    const owned = new Set<string>(s.ownedRecipeIds ?? ['moon_mocha', 'zerog_latte']);
    const daily = new Set<string>(s.dailyMenuIds ?? owned);
    const money = s.money ?? 0;

    type RichItem = { id: string; name: string; price: number; prepTime: number; station: string; recipeCost: number; description?: string };
    const allItems = MENU_ITEMS as unknown as RichItem[];

    let html = '';

    // ── On today's menu ──────────────────────────────────────────
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
              <div class="si-desc">${STATION_LABELS[item.station] ?? item.station} &middot; ${prepSec}s &middot; ${item.price} ✦</div>
            </div>
            <div class="si-right">
              <button class="si-btn${canRemove ? '' : ' disabled'}"${canRemove ? '' : ' disabled'}${canRemove ? '' : ' title="Need at least one item on the menu"'} data-toggle-recipe="${item.id}" style="font-size:0.85em">Remove</button>
            </div>
          </div>`;
      });
    }

    // ── Owned but off menu ────────────────────────────────────────
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
              <div class="si-desc">${STATION_LABELS[item.station] ?? item.station} &middot; ${prepSec}s &middot; ${item.price} ✦</div>
            </div>
            <div class="si-right">
              <button class="si-btn" data-toggle-recipe="${item.id}" style="font-size:0.85em">Add today</button>
            </div>
          </div>`;
      });
    }

    // ── Buyable (tier-unlocked, not yet owned) ────────────────────
    const buyable = allItems.filter(i => tierUnlocked.has(i.id) && !owned.has(i.id));
    if (buyable.length > 0) {
      html += `<p class="sp-meta" style="margin-top:12px;margin-bottom:6px;border-top:1px solid rgba(255,255,255,0.06);padding-top:12px">
        Available to learn.</p>`;
      buyable.forEach(item => {
        const icon = FOOD_ICONS[item.id] ?? svg(`<rect x="6" y="6" width="12" height="12" rx="2" fill="#887766"/>`);
        const cost = item.recipeCost;
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

    // ── Tier-locked ───────────────────────────────────────────────
    const tierLocked = allItems.filter(i => !tierUnlocked.has(i.id));
    if (tierLocked.length > 0) {
      html += `<p class="sp-meta" style="margin-top:12px;border-top:1px solid rgba(255,255,255,0.06);padding-top:12px">
        ${tierLocked.length} more recipe${tierLocked.length > 1 ? 's' : ''} unlock as your café upgrades.</p>`;
    }

    this.storeContentEl.innerHTML = html;
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
    return `
      <div class="si ${cls}">
        <div class="si-icon">${o.icon}</div>
        <div class="si-info">
          <div class="si-name">${o.name}</div>
          <div class="si-desc">${o.desc.replace(/\n/g, '<br>')}</div>
        </div>
        <div class="si-right">
          <span class="si-cost${costCls}">${o.cost} ✦</span>
          <button class="si-btn${btnCls}"${disabledAttr} ${o.attr}>${o.owned ? '&#10003; Owned' : o.btnLabel}</button>
        </div>
      </div>`;
  }

  private attachListeners(): void {
    this.storeContentEl.querySelectorAll<HTMLElement>('[data-buy-kitchen]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.game?.events.emit('game_event', { type: 'buy_kitchen', upgradeId: btn.dataset.buyKitchen });
      });
    });
    this.storeContentEl.querySelectorAll<HTMLElement>('[data-hire-staff]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.game?.events.emit('game_event', { type: 'hire_staff', role: btn.dataset.hireStaff as EmployeeRole });
      });
    });
    this.storeContentEl.querySelectorAll<HTMLElement>('[data-place-decor]').forEach(btn => {
      btn.addEventListener('click', () => {
        const defId = btn.dataset.placeDecor;
        this.closeStore();
        setTimeout(() => {
          this.game?.events.emit('game_event', { type: 'start_placement', defId });
        }, 0);
      });
    });
    this.storeContentEl.querySelectorAll<HTMLElement>('[data-buy-recipe]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.game?.events.emit('game_event', { type: 'buy_recipe', itemId: btn.dataset.buyRecipe });
      });
    });
    this.storeContentEl.querySelectorAll<HTMLElement>('[data-toggle-recipe]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.game?.events.emit('game_event', { type: 'toggle_daily_recipe', itemId: btn.dataset.toggleRecipe });
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

    if (this.storeOpen) this.refreshStore();
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
