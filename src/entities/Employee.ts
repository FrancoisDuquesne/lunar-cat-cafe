import Phaser from 'phaser';
import { StaffNpc } from './StaffNpc';

type EmpAIState = 'idle' | 'going_to_customer' | 'going_to_station' | 'delivering_food';

export interface ReadyStation {
  stationId: number;
  stationX: number;
  stationY: number;
  customerId: number;
  customerX: number;
  customerY: number;
}

export class Employee extends StaffNpc {
  readonly employeeId: number;
  readonly employeeName: string;

  private aiState: EmpAIState = 'idle';
  private idleTimer = 1000 + Math.random() * 2000;
  private targetCustomerId: number | null = null;
  private targetX = 0;
  private targetY = 0;
  private wanderTimer = 0;
  private wanderX = 0;
  private wanderY = 0;

  private carriedFoodItemId: string | null = null;
  private targetStationId: number | null = null;
  private foodCarrySprite?: Phaser.GameObjects.Sprite;

  onTakeOrder?: (customerId: number) => void;
  onPickupFood?: (stationId: number) => string | null;
  onDeliverFood?: (customerId: number, itemId: string) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, id: number, name: string) {
    super(scene, x, y, name, '#AAFFAA', '#003300');

    this.employeeId = id;
    this.employeeName = name;
    this.wanderX = x;
    this.wanderY = y;
  }

  // ── Main update ────────────────────────────────────────────────────────

  update(
    delta: number,
    waitingCustomers: Array<{ customerId: number; x: number; y: number }>,
    assignedIds: Set<number>,
    readyStations: ReadyStation[],
    stationDeliveryIds: Set<number>,
  ): void {
    this.idleTimer -= delta;
    this.wanderTimer -= delta;

    this.updateBadgeAndDepth();

    if (this.foodCarrySprite) {
      this.foodCarrySprite.setPosition(this.x, this.y - 28);
      this.foodCarrySprite.setDepth(this.depth + 1);
    }

    switch (this.aiState) {
      case 'idle': {
        if (this.wanderTimer <= 0) {
          this.wanderTimer = Phaser.Math.Between(2000, 5000);
          this.wanderX = Phaser.Math.Between(11 * 32, 18 * 32);
          this.wanderY = Phaser.Math.Between(8 * 32, 12 * 32);
        }
        const wx = this.wanderX - this.x;
        const wy = this.wanderY - this.y;
        const wd = Math.sqrt(wx * wx + wy * wy) || 1;
        if (wd > 8) {
          this.setVel((wx / wd) * 40, (wy / wd) * 40);
        } else {
          this.setVel(0, 0);
        }

        if (this.idleTimer <= 0) {
          this.idleTimer = 1500;
          // Deliver ready food first — a waiting customer drains patience faster than one waiting to order
          const station = readyStations.find(s => !stationDeliveryIds.has(s.customerId));
          if (station) {
            this.targetStationId = station.stationId;
            this.targetCustomerId = station.customerId;
            this.targetX = station.stationX;
            this.targetY = station.stationY;
            this.aiState = 'going_to_station';
            stationDeliveryIds.add(station.customerId);
            this.startNav(this.targetX, this.targetY);
          } else {
            const orderTarget = waitingCustomers.find(c => !assignedIds.has(c.customerId));
            if (orderTarget) {
              this.targetCustomerId = orderTarget.customerId;
              this.targetX = orderTarget.x;
              this.targetY = orderTarget.y;
              this.aiState = 'going_to_customer';
              assignedIds.add(orderTarget.customerId);
              this.startNav(this.targetX, this.targetY);
            }
          }
        }
        break;
      }

      case 'going_to_customer': {
        const still = waitingCustomers.find(c => c.customerId === this.targetCustomerId);
        if (!still) {
          if (this.targetCustomerId !== null) assignedIds.delete(this.targetCustomerId);
          this.targetCustomerId = null;
          this.aiState = 'idle';
          this.idleTimer = 1000;
          this.setVel(0, 0);
          break;
        }

        if (Math.abs(still.x - this.targetX) > 8 || Math.abs(still.y - this.targetY) > 8) {
          this.targetX = still.x;
          this.targetY = still.y;
          this.startNav(this.targetX, this.targetY);
        }

        const arrived = this.followPath(delta, 85, this.targetX, this.targetY, 40);
        if (arrived) {
          if (this.targetCustomerId !== null && this.onTakeOrder) {
            this.onTakeOrder(this.targetCustomerId);
          }
          assignedIds.delete(this.targetCustomerId!);
          this.targetCustomerId = null;
          this.aiState = 'idle';
          this.idleTimer = 2000;
          this.wanderTimer = 0;
        }
        break;
      }

      case 'going_to_station': {
        const stationStillReady = readyStations.find(
          s => s.stationId === this.targetStationId && s.customerId === this.targetCustomerId,
        );
        if (!stationStillReady) {
          if (this.targetCustomerId !== null) stationDeliveryIds.delete(this.targetCustomerId);
          this.targetCustomerId = null;
          this.targetStationId = null;
          this.aiState = 'idle';
          this.idleTimer = 500;
          this.setVel(0, 0);
          break;
        }

        const arrived = this.followPath(delta, 90, this.targetX, this.targetY, 48);
        if (arrived) {
          if (this.targetStationId !== null && this.onPickupFood) {
            const itemId = this.onPickupFood(this.targetStationId);
            if (itemId && this.targetCustomerId !== null) {
              this.carriedFoodItemId = itemId;
              this.foodCarrySprite = this.scene.add
                .sprite(this.x, this.y - 28, `food_${itemId}`)
                .setScale(1.2)
                .setDepth(this.depth + 1);
              this.targetX = stationStillReady.customerX;
              this.targetY = stationStillReady.customerY;
              this.aiState = 'delivering_food';
              this.targetStationId = null;
              this.startNav(this.targetX, this.targetY);
            } else {
              if (this.targetCustomerId !== null) stationDeliveryIds.delete(this.targetCustomerId);
              this.targetCustomerId = null;
              this.targetStationId = null;
              this.aiState = 'idle';
              this.idleTimer = 500;
            }
          }
        }
        break;
      }

      case 'delivering_food': {
        const arrived = this.followPath(delta, 90, this.targetX, this.targetY, 40);
        if (arrived) {
          if (this.targetCustomerId !== null && this.carriedFoodItemId && this.onDeliverFood) {
            this.onDeliverFood(this.targetCustomerId, this.carriedFoodItemId);
          }
          if (this.targetCustomerId !== null) stationDeliveryIds.delete(this.targetCustomerId);
          this.carriedFoodItemId = null;
          this.targetCustomerId = null;
          this.foodCarrySprite?.destroy();
          this.foodCarrySprite = undefined;
          this.aiState = 'idle';
          this.idleTimer = 2000;
          this.wanderTimer = 0;
          this.setVel(0, 0);
        }
        break;
      }
    }
  }

  cleanup(): void {
    super.cleanup();
    this.foodCarrySprite?.destroy();
  }
}
