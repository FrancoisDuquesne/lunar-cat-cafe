import Phaser from 'phaser';
import { TILE, GAME_W, GAME_H, CUSTOMER_SPAWN_MS } from '../constants';
import { MenuItemDef, CustomerType, TableSlot, ShopState } from '../types';
import { Customer } from '../entities/Customer';
import { Pathfinder } from './Pathfinder';

const CUSTOMER_TYPES: CustomerType[] = ['astronaut', 'scientist', 'tourist', 'worker'];

export interface CustomerCallbacks {
  getEffectiveMenu: () => MenuItemDef[];
  getCurrentTierLevel: () => number;
  onBeginLeave: (customerId: number) => void;
  onCustomerGone: (customerId: number, happiness: number) => void;
  onBookedGuestArrived: () => void;
  onTutorial: () => void;
  onUIUpdate: () => void;
}

export class CustomerSystem {
  readonly customers: Customer[] = [];

  private customerQueue: Array<{ type: CustomerType }> = [];
  private queueSprites: Phaser.GameObjects.Sprite[] = [];
  private queueLabel?: Phaser.GameObjects.Text;
  private nextCustomerId = 1;
  private customerSpawnTimer = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly tables: TableSlot[],
    private readonly wallGroup: Phaser.Physics.Arcade.StaticGroup,
    private readonly customerPathfinder: Pathfinder,
    private readonly shopState: ShopState,
    private readonly cb: CustomerCallbacks,
  ) {}

  // ── Spawn scheduling ─────────────────────────────────────────────────────────

  scheduleNextCustomer(reputation: number, dayPhase: string): void {
    const repFactor = Math.max(0.4, 1 - reputation * 0.01);
    const phaseMult = dayPhase === 'afternoon' ? 0.55 : dayPhase === 'evening' ? 0.80 : 1.0;
    const delay = CUSTOMER_SPAWN_MS * repFactor * phaseMult + Phaser.Math.Between(-2000, 2000);
    this.customerSpawnTimer = Math.max(4000, delay);
  }

  spawnCustomer(dayEnded: boolean, dayPhase: string, reputation: number, day: number): void {
    if (dayEnded) return;

    if (Math.random() < 0.28) {
      const groupTable = this.tables.find(t => t.seats.filter(s => !s.occupied).length >= 2);
      if (groupTable) { this.spawnGroup(groupTable); return; }
    }

    const freeTable = this.tables.find(t => t.seats.some(s => !s.occupied));
    if (!freeTable) {
      const cap = this.getQueueCapacity();
      if (this.customerQueue.length < cap) {
        this.customerQueue.push({ type: CUSTOMER_TYPES[Math.floor(Math.random() * CUSTOMER_TYPES.length)] });
        this.rebuildQueueSprites();
      }
      return;
    }

    let type: CustomerType;
    if (this.customerQueue.length > 0) {
      type = this.customerQueue.shift()!.type;
      this.rebuildQueueSprites();
    } else {
      type = CUSTOMER_TYPES[Math.floor(Math.random() * CUSTOMER_TYPES.length)];
    }

    this.seatNewCustomer(type, freeTable);

    if (day === 1 && this.nextCustomerId === 2) {
      this.scene.time.delayedCall(4000, () => this.cb.onTutorial());
    }
  }

  tryDequeueCustomer(dayEnded: boolean): void {
    if (this.customerQueue.length === 0 || dayEnded) return;
    const freeTable = this.tables.find(t => t.seats.some(s => !s.occupied));
    if (!freeTable) return;
    const entry = this.customerQueue.shift()!;
    this.rebuildQueueSprites();
    this.seatNewCustomer(entry.type, freeTable);
  }

  spawnBookedGuests(): void {
    const count = this.shopState.bookings ?? 0;
    if (count <= 0) return;
    this.shopState.bookings = 0;
    for (let i = 0; i < count; i++) {
      this.scene.time.delayedCall(2000 + i * 2500, () => {
        const freeTable = this.tables.find(t => t.seats.some(s => !s.occupied));
        if (!freeTable) return;
        const type = CUSTOMER_TYPES[Math.floor(Math.random() * CUSTOMER_TYPES.length)];
        this.seatNewCustomer(type, freeTable, true);
        this.cb.onBookedGuestArrived();
      });
    }
  }

  // ── Day lifecycle ────────────────────────────────────────────────────────────

  endDay(): void {
    this.clearQueue();
    this.customers.forEach(c => {
      if (c.active && c.aiState !== 'walking_out' && c.aiState !== 'gone') c.beginLeave();
    });
  }

  clearQueue(): void {
    this.queueSprites.forEach(s => s.destroy());
    this.queueSprites = [];
    this.queueLabel?.destroy();
    this.queueLabel = undefined;
    this.customerQueue = [];
  }

  // ── Queries for other systems ────────────────────────────────────────────────

  getSeatedCustomers(): Array<{ x: number; y: number; id: number }> {
    return this.customers
      .filter(c => c.active && (c.aiState === 'seated' || c.aiState === 'eating'))
      .map(c => ({ x: c.x, y: c.y, id: c.customerId }));
  }

  getWaitingForOrders(): Array<{ customerId: number; x: number; y: number }> {
    return this.customers
      .filter(c => c.active && c.aiState === 'waiting_order')
      .map(c => ({ customerId: c.customerId, x: c.x, y: c.y }));
  }

  // ── Update loop ──────────────────────────────────────────────────────────────

  update(delta: number, dayEnded: boolean, dayPhase: string, reputation: number, day: number): void {
    for (let i = this.customers.length - 1; i >= 0; i--) {
      const c = this.customers[i];
      c.update(delta);
      if (c.aiState === 'gone') {
        for (const table of this.tables) {
          const seat = table.seats.find(s => s.customerId === c.customerId);
          if (seat) { seat.occupied = false; seat.customerId = null; break; }
        }
        const { customerId, happiness } = { customerId: c.customerId, happiness: c.happiness };
        c.cleanup();
        c.destroy();
        this.customers.splice(i, 1);
        this.cb.onCustomerGone(customerId, happiness);
        this.tryDequeueCustomer(dayEnded);
      }
    }

    this.customerSpawnTimer -= delta;
    if (this.customerSpawnTimer <= 0 && !dayEnded) {
      this.spawnCustomer(dayEnded, dayPhase, reputation, day);
      this.scheduleNextCustomer(reputation, dayPhase);
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private seatNewCustomer(type: CustomerType, table: TableSlot, boostedPatience = false): Customer {
    const freeSeat = table.seats.find(s => !s.occupied)!;
    const customer = this.createCustomerOfType(freeSeat.seatX, freeSeat.seatY, type, boostedPatience);
    customer.tableId = table.id;
    this.customers.push(customer);
    freeSeat.occupied = true;
    freeSeat.customerId = customer.customerId;
    this.scene.physics.add.collider(customer, this.wallGroup);
    return customer;
  }

  private createCustomerOfType(seatX: number, seatY: number, type: CustomerType, boostedPatience: boolean): Customer {
    const spawnX = (14 + Math.floor(Math.random() * 4)) * TILE + TILE / 2;
    const spawnY = 16 * TILE + TILE / 2;
    const customer = new Customer(
      this.scene, spawnX, spawnY,
      this.nextCustomerId++, type,
      seatX, seatY,
      GAME_W / 2, GAME_H + 20,
    );
    customer.pathFinder = (fx, fy, tx, ty) => this.customerPathfinder.findPath(fx, fy, tx, ty);
    customer.getAvailableMenuItems = () => this.cb.getEffectiveMenu();
    customer.onBeginLeave = (customerId) => this.cb.onBeginLeave(customerId);
    if (boostedPatience) customer.patience = 150;
    return customer;
  }

  private spawnGroup(table: TableSlot): void {
    const freeCount = table.seats.filter(s => !s.occupied).slice(0, 2).length;
    for (let i = 0; i < freeCount; i++) {
      this.seatNewCustomer(CUSTOMER_TYPES[Math.floor(Math.random() * CUSTOMER_TYPES.length)], table);
    }
  }

  private getQueueCapacity(): number {
    const tier = this.cb.getCurrentTierLevel();
    return tier <= 1 ? 0 : Math.min(8, (tier - 1) * 2);
  }

  private rebuildQueueSprites(): void {
    this.queueSprites.forEach(s => s.destroy());
    this.queueSprites = [];
    this.queueLabel?.destroy();
    this.queueLabel = undefined;

    if (this.customerQueue.length === 0) return;

    const positions = this.getQueuePositions();
    this.customerQueue.forEach((entry, i) => {
      if (i >= positions.length) return;
      const pos = positions[i];
      const spr = this.scene.add.sprite(pos.x, pos.y, `customer_${entry.type}`)
        .setScale(0.72).setDepth(7).setTint(0xBBBBCC).setAlpha(0.88);
      this.queueSprites.push(spr);
    });

    const overflow = this.customerQueue.length - positions.length;
    const labelText = overflow > 0
      ? `⏳ ${this.customerQueue.length} waiting (+${overflow})`
      : `⏳ ${this.customerQueue.length} waiting`;
    this.queueLabel = this.scene.add.text(15.5 * TILE, 16 * TILE - 6, labelText, {
      fontSize: '10px', color: '#FFD700', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
      backgroundColor: '#00000077', padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 1).setDepth(8);
  }

  private getQueuePositions(): Array<{ x: number; y: number }> {
    const cx = 15.5 * TILE;
    const y1 = 16.5 * TILE;
    const y2 = 17.2 * TILE;
    return [
      { x: cx,            y: y1 },
      { x: cx - TILE,     y: y1 },
      { x: cx + TILE,     y: y1 },
      { x: cx - 2 * TILE, y: y1 },
      { x: cx + 2 * TILE, y: y1 },
      { x: cx,            y: y2 },
      { x: cx - TILE,     y: y2 },
      { x: cx + TILE,     y: y2 },
    ];
  }
}
