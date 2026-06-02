import Phaser from 'phaser';
import {
  TABLE_SLOT_DEFS, EMPLOYEE_TYPES, DECORATION_ITEMS,
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
}

type StoreTab = 'seating' | 'kitchen' | 'staff' | 'decor';

const EMOJI: Record<string, string> = {
  'obj_coffee_machine': '☕',
  'player_employee':    '👤',
  'obj_table':          '🪑',
  'obj_table_group':    '🍽️',
  'deco_velvet_chair':  '🪑',
  'deco_round_table':   '⭕',
  'deco_booth_seat':    '🛋️',
  'deco_fairy_lights':  '✨',
  'deco_neon_sign':     '💡',
  'deco_crystal_lamp':  '🔮',
  'deco_luna_fern':     '🌿',
  'deco_space_cactus':  '🌵',
  'deco_moon_bloom':    '🌸',
  'deco_star_map':      '🗺️',
  'deco_moon_portrait': '🖼️',
  'deco_telescope':     '🔭',
  'deco_rover_display': '🤖',
  'deco_cat_statue':    '🐱',
};

const ROLE_EMOJI: Record<EmployeeRole, string> = {
  waiter:  '🧑‍🍽️',
  cook:    '👨‍🍳',
  guard:   '💂',
  caterer: '🍷',
};

class UIOverlay {
  private game?: Phaser.Game;
  private storeOpen = false;
  private activeTab: StoreTab = 'seating';
  private activeDecorTab: DecorationCategory = 'furniture';
  private lastState: UIState | null = null;
  private prevMoney = 0;
  private prevRep = 0;

  // DOM refs
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
  private menuHintsEl!: HTMLElement;
  private legendEl!: HTMLElement;

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
    this.menuHintsEl    = document.getElementById('menu-hints')!;
    this.legendEl       = document.getElementById('legend')!;

    // HUD buttons
    document.getElementById('btn-store')!.addEventListener('click', () => {
      if (this.storeOpen) this.closeStore();
      else this.openStore();
    });

    document.getElementById('btn-menu')!.addEventListener('click', () => {
      game.events.emit('go_menu');
    });

    document.getElementById('store-close')!.addEventListener('click', () => this.closeStore());

    touchControls.init();

    // Store tabs
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

  showHUD(): void {
    this.hudEl.classList.remove('hidden');
    this.ordersEl.classList.remove('hidden');
    this.legendEl.classList.remove('hidden');
    this.menuOverlayEl.classList.add('hidden');
    this.menuHintsEl.classList.add('hidden');
  }

  hideHUD(): void {
    this.hudEl.classList.add('hidden');
    this.ordersEl.classList.add('hidden');
    this.legendEl.classList.add('hidden');
    this.closeStore(true);
  }

  showMenu(hasSave: boolean, onStart: () => void, onNew: () => void): void {
    this.menuOverlayEl.classList.remove('hidden');
    this.menuHintsEl.classList.remove('hidden');
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
    this.menuHintsEl.classList.add('hidden');
  }

  private makeMenuBtn(label: string, variant: 'primary' | 'secondary'): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = `mo-btn mo-btn-${variant}`;
    btn.textContent = label;
    return btn;
  }

  // ── STORE ───────────────────────────────────────────────────────

  private updateScale(): void {
    // Match ENVELOP scale: fill viewport, maintaining game aspect ratio
    const scale = Math.max(window.innerWidth / 960, window.innerHeight / 576);
    document.documentElement.style.setProperty('--gs', scale.toFixed(4));
  }

  isStoreOpen(): boolean { return this.storeOpen; }

  openStore(silent = false): void {
    if (this.storeOpen) return;
    this.storeOpen = true;
    this.storePanelEl.classList.add('open');
    if (!silent) this.game?.events.emit('game_event', { type: 'open_store_panel' });
    this.refreshStore();
  }

  closeStore(silent = false): void {
    if (!this.storeOpen) return;
    this.storeOpen = false;
    this.storePanelEl.classList.remove('open');
    if (!silent) this.game?.events.emit('game_event', { type: 'close_store_panel' });
  }

  private refreshStore(): void {
    if (!this.storeOpen || !this.lastState) return;
    const s = this.lastState;
    switch (this.activeTab) {
      case 'seating':  this.renderSeating(s); break;
      case 'kitchen':  this.renderKitchen(s); break;
      case 'staff':    this.renderStaff(s);   break;
      case 'decor':    this.renderDecor(s);   break;
    }
  }

  private renderSeating(s: UIState): void {
    const owned = new Set(s.ownedTableSlotIds ?? []);
    const unowned = TABLE_SLOT_DEFS.filter(sl => sl.cost > 0 && !owned.has(sl.id));

    let html = `<p class="sp-meta">Tables owned: ${owned.size} / ${TABLE_SLOT_DEFS.length}</p>`;

    if (unowned.length === 0) {
      html += `<p class="sp-empty">All tables purchased!</p>`;
    } else {
      unowned.forEach(slot => {
        const can = s.money >= slot.cost;
        html += this.itemCard({
          icon: slot.type === 'group' ? '🍽️' : '🪑',
          name: slot.name,
          desc: `${slot.seats} seat${slot.seats > 1 ? 's' : ''} · Slot ${slot.id + 1}`,
          cost: slot.cost, can, owned: false,
          attr: `data-buy-table="${slot.id}"`, btnLabel: 'Buy',
        });
      });
    }
    this.storeContentEl.innerHTML = html;
    this.attachListeners();
  }

  private renderKitchen(s: UIState): void {
    const hasMachines = (s.extraMachines ?? 0) >= 1;
    const can = !hasMachines && s.money >= 180;
    let html = this.itemCard({
      icon: '☕', name: 'Extra Machines',
      desc: '+1 of each station · parallel cooking',
      cost: 180, can, owned: hasMachines,
      attr: `data-buy-kitchen="extra_machines"`, btnLabel: 'Buy',
    });
    html += `<p class="sp-meta" style="margin-top:14px;color:#443322">More upgrades coming soon!</p>`;
    this.storeContentEl.innerHTML = html;
    this.attachListeners();
  }

  private renderStaff(s: UIState): void {
    let html = '';
    EMPLOYEE_TYPES.forEach(emp => {
      const current = this.getCount(s, emp.role);
      const maxed = current >= emp.max;
      const can = !maxed && s.money >= emp.cost;
      html += this.itemCard({
        icon: ROLE_EMOJI[emp.role], name: emp.name,
        desc: `${emp.desc} · ${current}/${emp.max} hired`,
        cost: emp.cost, can, owned: maxed,
        attr: `data-hire-staff="${emp.role}"`,
        btnLabel: maxed ? 'Maxed' : 'Hire',
      });
    });
    this.storeContentEl.innerHTML = html;
    this.attachListeners();
  }

  private renderDecor(s: UIState): void {
    const cats: DecorationCategory[] = ['furniture', 'lighting', 'plants', 'wallDecor', 'specialty'];
    const labels: Record<DecorationCategory, string> = {
      furniture: 'Furniture', lighting: 'Lighting', plants: 'Plants',
      wallDecor: 'Wall', specialty: 'Specialty',
    };

    let html = '<div class="sp-subtabs">';
    cats.forEach(c => {
      const active = c === this.activeDecorTab ? ' active' : '';
      html += `<span class="sp-subtab${active}" data-subtab="${c}">${labels[c]}</span>`;
    });
    html += '</div>';
    html += `<p class="sp-meta">Buy to enter placement mode · tap placed item to sell</p>`;

    DECORATION_ITEMS.filter(d => d.category === this.activeDecorTab).forEach(item => {
      const can = s.money >= item.cost;
      html += this.itemCard({
        icon: EMOJI[item.spriteKey] ?? '✦', name: item.name,
        desc: `+${item.ambianceValue} ambiance`,
        cost: item.cost, can, owned: false,
        attr: `data-place-decor="${item.id}"`, btnLabel: 'Place',
      });
    });

    this.storeContentEl.innerHTML = html;

    this.storeContentEl.querySelectorAll('.sp-subtab').forEach(el => {
      (el as HTMLElement).addEventListener('click', () => {
        this.activeDecorTab = (el as HTMLElement).dataset.subtab as DecorationCategory;
        this.renderDecor(s);
      });
    });

    this.attachListeners();
  }

  private itemCard(o: {
    icon: string; name: string; desc: string;
    cost: number; can: boolean; owned: boolean;
    attr: string; btnLabel: string;
  }): string {
    const cls = o.owned ? 'owned' : o.can ? 'afford' : '';
    const costCls = o.can || o.owned ? '' : ' dim';
    const btnCls = o.owned ? ' owned-lbl' : '';
    const disabled = !o.can && !o.owned ? ' disabled' : '';
    return `
      <div class="si ${cls}">
        <div class="si-icon">${o.icon}</div>
        <div class="si-info">
          <div class="si-name">${o.name}</div>
          <div class="si-desc">${o.desc.replace(/\n/g, '<br>')}</div>
        </div>
        <div class="si-right">
          <span class="si-cost${costCls}">${o.cost} ✦</span>
          <button class="si-btn${btnCls}"${disabled} ${o.attr}>${o.owned ? '✓ Owned' : o.btnLabel}</button>
        </div>
      </div>`;
  }

  private attachListeners(): void {
    this.storeContentEl.querySelectorAll<HTMLElement>('[data-buy-table]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.game?.events.emit('game_event', { type: 'buy_table', slotId: parseInt(btn.dataset.buyTable!) });
      });
    });
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
        this.game?.events.emit('game_event', { type: 'start_placement', defId: btn.dataset.placeDecor });
        this.closeStore();
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

    if (state.tierName)       this.tierEl.textContent     = state.tierName;
    if (state.ambiance !== undefined) this.ambianceEl.textContent = `✦ ${state.ambiance} ambiance`;

    this.dayLabelEl.textContent = `Day ${state.day}`;

    const p = Math.max(0, Math.min(1, state.dayProgress));
    this.dayBarFillEl.style.width = `${p * 100}%`;
    this.dayBarFillEl.style.background = p < 0.33
      ? 'linear-gradient(90deg, #ffcc66, #ff9933)'
      : p < 0.66
      ? 'linear-gradient(90deg, #ff9933, #cc6600)'
      : 'linear-gradient(90deg, #9966aa, #664488)';

    const icon = state.phase === 'morning' ? '☀️' : state.phase === 'afternoon' ? '🌤️' : state.phase === 'evening' ? '🌙' : '★';
    this.phaseEl.textContent = `${icon} ${state.phase.charAt(0).toUpperCase()}${state.phase.slice(1)}`;

    this.renderOrders(state.orders ?? []);

    if (this.storeOpen) this.refreshStore();
  }

  // ── ORDERS ──────────────────────────────────────────────────────

  private renderOrders(orders: OrderInfo[]): void {
    const statusInfo = (s: OrderInfo['status']) => {
      switch (s) {
        case 'queued':   return { label: 'waiting',    color: '#998877', stripe: '#998877' };
        case 'cooking':  return { label: 'cooking…',   color: '#5599cc', stripe: '#5599cc' };
        case 'ready':    return { label: '★ READY',    color: '#44bb66', stripe: '#44bb66' };
        case 'carrying': return { label: '▶ serving',  color: '#ccaa00', stripe: '#ccaa00' };
      }
    };

    this.ordersEl.innerHTML = orders.slice(0, 5).map(o => {
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
    }).join('');
  }
}

export const uiOverlay = new UIOverlay();
