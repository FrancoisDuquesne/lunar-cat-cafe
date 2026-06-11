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
  steamEmitter?: Phaser.GameObjects.Particles.ParticleEmitter;
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
  private glitchTimers = new Map<number, number>(); // stationId → remaining ms
  supplyRushMs = 0;

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
    this.trashCanY = 6 * TILE + TILE / 2;
    this.scene.add.sprite(this.trashCanX, this.trashCanY, 'obj_trash_can').setDepth(4).setOrigin(0.5, 0.7);
    this.scene.add.text(this.trashCanX, this.trashCanY - 16, 'Discard', {
      fontSize: '10px', color: '#998877', fontFamily: 'monospace',
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(5).setAlpha(0);
  }

  setupSteam(): void {
    for (const stn of this.stations) {
      const emitter = this.scene.add.particles(stn.worldX, stn.worldY - 22, 'particle_steam', {
        speed: { min: 5, max: 14 },
        scale: { start: 0.44, end: 0 },
        alpha: { start: 0.38, end: 0 },
        lifespan: { min: 900, max: 1800 },
        frequency: 700,
        gravityY: -14,
        angle: { min: -28, max: 28 },
      });
      emitter.setDepth(6);
      stn.steamEmitter = emitter;
    }
  }

  spawnCooks(nameOffset: number): void {
    for (let i = 0; i < (this.shopState.cooks ?? 0); i++) {
      this.spawnOneCook(i, nameOffset);
    }
  }

  spawnOneCook(index: number, nameOffset: number): void {
    const positions = [{ col: 12, row: 5 }, { col: 16, row: 5 }];
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
    return (MENU_ITEMS as readonly MenuItemDef[]).find(m => m.id === stn.cookingItemId)?.name ?? null;
  }

  // ── Mutations ────────────────────────────────────────────────────────────────

  startCooking(stationId: number, customers: Customer[], carriedFoodId: string | null): boolean {
    const stn = this.stations.find(s => s.id === stationId);
    if (!stn || stn.isCooking || this.glitchTimers.has(stationId)) return false;
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

  glitchStation(stationId: number, durationMs: number): void {
    const stn = this.stations.find(s => s.id === stationId);
    if (!stn || stn.isCooking) return;
    this.glitchTimers.set(stationId, durationMs);
    stn.sprite.setTint(0xFF3333);
    stn.label.setText('!! OFFLINE !!');
  }

  startSupplyRush(durationMs: number): void {
    this.supplyRushMs = durationMs;
  }

  isGlitched(stationId: number): boolean {
    return this.glitchTimers.has(stationId);
  }

  stealFood(stationId: number): string | null {
    const stn = this.stations.find(s => s.id === stationId);
    if (!stn || !stn.isCooking || stn.cookProgress < 1) return null;
    const name = (MENU_ITEMS as readonly MenuItemDef[]).find(m => m.id === stn.cookingItemId)?.name ?? stn.cookingItemId;
    this.clearStation(stn);
    return name ?? null;
  }

  // ── Update loop ──────────────────────────────────────────────────────────────

  update(delta: number, customers: Customer[], carriedFoodId: string | null, urgentMachineIds?: ReadonlySet<string>): void {
    this.cookNpcs.forEach(c => c.update(delta));

    // Tick supply rush countdown
    if (this.supplyRushMs > 0) this.supplyRushMs = Math.max(0, this.supplyRushMs - delta);

    // Tick glitch countdowns and recover stations when timer expires
    for (const [id, remaining] of this.glitchTimers) {
      const next = remaining - delta;
      if (next <= 0) {
        this.glitchTimers.delete(id);
        const stn = this.stations.find(s => s.id === id);
        if (stn) {
          stn.sprite.clearTint();
          stn.label.setText(MACHINE_DEFS.find(d => d.id === stn.machineId)?.label ?? stn.machineId);
        }
      } else {
        this.glitchTimers.set(id, next);
      }
    }

    if ((this.shopState.cooks ?? 0) > 0) {
      this.autoCookTimer -= delta;
      if (this.autoCookTimer <= 0) {
        this.autoCookTimer = Math.max(800, 4000 - (this.shopState.cooks ?? 0) * 1200);
        this.tryAutoCook(customers, carriedFoodId);
      }
    }

    const cookDelta = this.supplyRushMs > 0 ? delta * 1.4 : delta;

    for (const stn of this.stations) {
      const isGlitched = this.glitchTimers.has(stn.id);
      if (!stn.isCooking) {
        if (isGlitched) continue; // skip tint logic while glitched (red tint stays)
        const hasPending = this.getPendingOrder(stn.machineId, customers, carriedFoodId) !== null;
        const isUrgent = hasPending && (urgentMachineIds?.has(stn.machineId) ?? false);
        if (isUrgent) {
          // Strong orange pulse + slight scale to draw the player's eye
          const t = (Math.sin(this.scene.time.now * 0.008) + 1) / 2;
          const g = Math.round(0x88 + t * 0x77);
          stn.sprite.setTint((0xFF << 16) | (g << 8) | 0x00);
          stn.sprite.setScale(1 + t * 0.06);
        } else if (hasPending) {
          // Ambient blue-white tint: someone ordered but it's not the player's concern
          const t = (Math.sin(this.scene.time.now * 0.005) + 1) / 2;
          const r = Math.round(0xAA + t * 0x55);
          const g = Math.round(0xCC + t * 0x33);
          stn.sprite.setTint((r << 16) | (g << 8) | 0xFF);
          stn.sprite.setScale(1);
        } else {
          stn.sprite.clearTint();
          stn.sprite.setScale(1);
        }
      }

      if (stn.isCooking && stn.cookProgress < 1) {
        stn.cookProgress = Math.min(1, stn.cookProgress + cookDelta / stn.cookTargetMs);
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
    }).setOrigin(0.5, 1).setDepth(5).setAlpha(0);
    const station: Station = {
      id: this.stations.length, machineId: def.id, worldX: wx, worldY: wy,
      sprite, label, isCooking: false, cookProgress: 0,
      cookTargetMs: 0, currentOrderId: null, cookingItemId: null,
    };
    this.stations.push(station);
    return station;
  }

  private startCookingVisual(stn: Station): void {
    stn.sprite.setScale(1);
    stn.progressBg = this.scene.add.sprite(stn.worldX, stn.worldY - 50, 'ui_progress_bg').setDepth(20);
    stn.progressFill = this.scene.add.graphics().setDepth(21);
    stn.steamEmitter?.setFrequency(120);
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
    stn.sprite.setScale(1);
    stn.steamEmitter?.setFrequency(2000);
  }

  private getItem(itemId: string | null): MenuItemDef | null {
    if (!itemId) return null;
    return (MENU_ITEMS as readonly MenuItemDef[]).find(m => m.id === itemId) ?? null;
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
