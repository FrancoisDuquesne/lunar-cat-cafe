import Phaser from 'phaser';
import { TILE, MENU_ITEMS, EMPLOYEE_NAMES, MACHINE_DEFS, MachineDef } from '../constants';
import { MenuItemDef, ShopState } from '../types';
import { CookNpc } from '../entities/CookNpc';
import { Customer } from '../entities/Customer';
import { Pathfinder } from './Pathfinder';
import type { ReadyStation } from '../entities/Employee';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Station {
  id: number;
  machineId: string;
  worldX: number;
  worldY: number;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  isCooking: boolean;
  cookProgress: number;
  cookTargetMs: number;
  progressBg?: Phaser.GameObjects.Sprite;
  progressFill?: Phaser.GameObjects.Graphics;
  readyFoodSprite?: Phaser.GameObjects.Sprite;
  currentOrderId: number | null;
  cookingItemId: string | null;
}

export interface KitchenCallbacks {
  onUIUpdate: () => void;
  onChime: () => void;
  onCook: () => void;
}

// ── KitchenSystem ──────────────────────────────────────────────────────────────

export class KitchenSystem {
  readonly stations: Station[] = [];
  readonly cookNpcs: CookNpc[] = [];
  trashCanX = 0;
  trashCanY = 0;

  private autoCookTimer = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly shopState: ShopState,
    private readonly wallGroup: Phaser.Physics.Arcade.StaticGroup,
    private readonly pathfinder: Pathfinder,
    private readonly cb: KitchenCallbacks,
  ) {}

  // ── Build ────────────────────────────────────────────────────────────────────

  build(): void {
    const owned = new Set(this.shopState.ownedMachines ?? ['espresso_machine']);
    MACHINE_DEFS.filter(d => owned.has(d.id)).forEach(def => this.buildOneStation(def));

    this.trashCanX = 18 * TILE + TILE / 2;
    this.trashCanY = 8 * TILE + TILE / 2;
    this.scene.add.sprite(this.trashCanX, this.trashCanY, 'obj_trash_can').setDepth(4).setOrigin(0.5, 0.7);
    this.scene.add.text(this.trashCanX, this.trashCanY - 16, 'Discard', {
      fontSize: '10px', color: '#998877', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(5);
  }

  setupSteam(): void {
    const coffeeStation = this.stations.find(s => s.machineId === 'espresso_machine');
    if (!coffeeStation) return;
    const emitter = this.scene.add.particles(coffeeStation.worldX, coffeeStation.worldY - 20, 'particle_steam', {
      speed: { min: 8, max: 20 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.5, end: 0 },
      lifespan: { min: 600, max: 1200 },
      frequency: 400,
      gravityY: -18,
      angle: { min: -20, max: 20 },
    });
    emitter.setDepth(6);
  }

  spawnCooks(nameOffset: number): void {
    for (let i = 0; i < (this.shopState.cooks ?? 0); i++) {
      this.spawnOneCook(i, nameOffset);
    }
  }

  spawnOneCook(index: number, nameOffset: number): void {
    const positions = [{ col: 12, row: 7 }, { col: 16, row: 7 }];
    const pos = positions[index % positions.length];
    const name = EMPLOYEE_NAMES[(nameOffset + index) % EMPLOYEE_NAMES.length];
    const cook = new CookNpc(this.scene, pos.col * TILE + TILE / 2, pos.row * TILE + TILE / 2, name);
    cook.pathFinder = (fx, fy, tx, ty) => this.pathfinder.findPath(fx, fy, tx, ty);
    this.scene.physics.add.collider(cook, this.wallGroup);
    this.cookNpcs.push(cook);
  }

  // ── Runtime shop additions ───────────────────────────────────────────────────

  addMachine(machineId: string): void {
    const def = MACHINE_DEFS.find(d => d.id === machineId);
    if (!def) return;
    this.buildOneStation(def);
  }

  // ── Queries ──────────────────────────────────────────────────────────────────

  getPendingOrder(
    machineId: string,
    customers: Customer[],
    carriedFoodId: string | null,
  ): { customerId: number; item: MenuItemDef } | null {
    for (const c of customers) {
      if (!c.active) continue;
      if ((c.aiState === 'order_taken' || c.aiState === 'waiting_food') && (c.order as any)?.machines?.[0] === machineId) {
        if (carriedFoodId && c.order?.id === carriedFoodId) continue;
        if (!this.stations.some(s => s.isCooking && s.currentOrderId === c.customerId)) {
          if (!c.order) continue;
          return { customerId: c.customerId, item: c.order };
        }
      }
    }
    return null;
  }

  getReadyStations(customers: Customer[]): ReadyStation[] {
    return this.stations
      .filter(s => s.isCooking && s.cookProgress >= 1 && s.cookingItemId !== null)
      .flatMap(s => {
        const customer =
          (s.currentOrderId
            ? customers.find(c => c.customerId === s.currentOrderId && c.aiState === 'waiting_food')
            : null)
          ?? customers.find(c => c.active && c.aiState === 'waiting_food' && c.order?.id === s.cookingItemId);
        if (!customer) return [];
        return [{ stationId: s.id, stationX: s.worldX, stationY: s.worldY + 16,
          customerId: customer.customerId, customerX: customer.x, customerY: customer.y }];
      });
  }

  getReadyItemName(stationId: number): string | null {
    const stn = this.stations.find(s => s.id === stationId);
    if (!stn?.cookingItemId) return null;
    return (MENU_ITEMS as unknown as MenuItemDef[]).find(m => m.id === stn.cookingItemId)?.name ?? null;
  }

  // ── Mutations ────────────────────────────────────────────────────────────────

  startCooking(stationId: number, customers: Customer[], carriedFoodId: string | null): boolean {
    const stn = this.stations.find(s => s.id === stationId);
    if (!stn || stn.isCooking) return false;
    const pending = this.getPendingOrder(stn.machineId, customers, carriedFoodId);
    if (!pending) return false;
    stn.isCooking = true;
    stn.cookProgress = 0;
    stn.cookTargetMs = pending.item.prepTime;
    stn.currentOrderId = pending.customerId;
    stn.cookingItemId = pending.item.id;
    this.startCookingVisual(stn);
    return true;
  }

  pickupFromStation(stationId: number): string | null {
    const stn = this.stations.find(s => s.id === stationId);
    if (!stn || !stn.isCooking || stn.cookProgress < 1 || !stn.cookingItemId) return null;
    const itemId = stn.cookingItemId;
    this.clearStation(stn);
    this.autoCookTimer = 0;
    return itemId;
  }

  unlinkCustomer(customerId: number): void {
    for (const stn of this.stations) {
      if (stn.currentOrderId === customerId) stn.currentOrderId = null;
    }
  }

  // ── Update loop ──────────────────────────────────────────────────────────────

  update(delta: number, customers: Customer[], carriedFoodId: string | null): void {
    this.cookNpcs.forEach(c => c.update(delta));

    if ((this.shopState.cooks ?? 0) > 0) {
      this.autoCookTimer -= delta;
      if (this.autoCookTimer <= 0) {
        this.autoCookTimer = Math.max(800, 4000 - (this.shopState.cooks ?? 0) * 1200);
        this.tryAutoCook(customers, carriedFoodId);
      }
    }

    for (const stn of this.stations) {
      if (!stn.isCooking) {
        const hasPending = this.getPendingOrder(stn.machineId, customers, carriedFoodId) !== null;
        if (hasPending) {
          const t = (Math.sin(this.scene.time.now * 0.005) + 1) / 2;
          const r = Math.round(0xAA + t * 0x55);
          const g = Math.round(0xCC + t * 0x33);
          stn.sprite.setTint((r << 16) | (g << 8) | 0xFF);
        } else {
          stn.sprite.clearTint();
        }
      }

      if (stn.isCooking && stn.cookProgress < 1) {
        stn.cookProgress = Math.min(1, stn.cookProgress + delta / stn.cookTargetMs);
        if (stn.progressFill && stn.progressBg) {
          stn.progressFill.clear();
          const fillW = Math.round(stn.cookProgress * 44);
          stn.progressFill.fillStyle(stn.cookProgress > 0.8 ? 0x66DD66 : 0x44AADD, 1);
          stn.progressFill.fillRect(stn.progressBg.x - 22, stn.progressBg.y - 2, fillW, 4);
        }
        if (stn.cookProgress >= 1) {
          stn.progressBg?.destroy(); stn.progressBg = undefined;
          stn.progressFill?.destroy(); stn.progressFill = undefined;
          const item = this.getItem(stn.cookingItemId);
          if (item && !stn.readyFoodSprite) {
            stn.readyFoodSprite = this.scene.add.sprite(stn.worldX, stn.worldY - 42, `food_${item.id}`)
              .setScale(2.0).setDepth(22);
            this.scene.tweens.add({
              targets: stn.readyFoodSprite, y: stn.worldY - 48,
              duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
            });
          }
          stn.sprite.setTint(0x88FF88);
          this.scene.tweens.add({ targets: stn.sprite, alpha: 0.4, duration: 120, yoyo: true, repeat: 2 });
          this.cb.onChime();
          this.cookNpcs.find(c => c.getAssignedStationId() === stn.id)?.returnToKitchen();
        }
      }
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private buildOneStation(def: MachineDef): Station {
    const wx = def.col * TILE + TILE / 2;
    const wy = def.row * TILE + TILE / 2;
    const sprite = this.scene.add.sprite(wx, wy - 4, def.texKey).setDepth(4).setOrigin(0.5, 0.7);
    const label = this.scene.add.text(wx, wy - 20, def.label, {
      fontSize: '10px', color: '#FFEEDD', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(5);
    const station: Station = {
      id: this.stations.length, machineId: def.id, worldX: wx, worldY: wy,
      sprite, label, isCooking: false, cookProgress: 0,
      cookTargetMs: 0, currentOrderId: null, cookingItemId: null,
    };
    this.stations.push(station);
    return station;
  }

  private startCookingVisual(stn: Station): void {
    stn.progressBg = this.scene.add.sprite(stn.worldX, stn.worldY - 50, 'ui_progress_bg').setDepth(20);
    stn.progressFill = this.scene.add.graphics().setDepth(21);
  }

  private clearStation(stn: Station): void {
    stn.isCooking = false;
    stn.cookProgress = 0;
    stn.currentOrderId = null;
    stn.cookingItemId = null;
    stn.progressBg?.destroy(); stn.progressBg = undefined;
    stn.progressFill?.destroy(); stn.progressFill = undefined;
    stn.readyFoodSprite?.destroy(); stn.readyFoodSprite = undefined;
    stn.sprite.clearTint();
  }

  private getItem(itemId: string | null): MenuItemDef | null {
    if (!itemId) return null;
    return (MENU_ITEMS as unknown as MenuItemDef[]).find(m => m.id === itemId) ?? null;
  }

  private tryAutoCook(customers: Customer[], carriedFoodId: string | null): void {
    for (const stn of this.stations) {
      if (stn.isCooking) continue;
      const pending = this.getPendingOrder(stn.machineId, customers, carriedFoodId);
      if (pending) {
        stn.isCooking = true;
        stn.cookProgress = 0;
        stn.cookTargetMs = pending.item.prepTime;
        stn.currentOrderId = pending.customerId;
        stn.cookingItemId = pending.item.id;
        this.startCookingVisual(stn);
        this.cb.onCook();
        const npc = this.cookNpcs.find(c => c.getAssignedStationId() === null) ?? this.cookNpcs[0];
        if (npc) npc.goToStation(stn.id, stn.worldX, stn.worldY);
        this.cb.onUIUpdate();
        return;
      }
    }
  }
}
