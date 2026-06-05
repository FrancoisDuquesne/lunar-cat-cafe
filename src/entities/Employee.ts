import Phaser from 'phaser';
import { BaseCharacter } from './BaseCharacter';

type EmpAIState = 'idle' | 'going_to_customer' | 'going_to_station' | 'delivering_food';

export interface ReadyStation {
  stationId: number;
  stationX: number;
  stationY: number;
  customerId: number;
  customerX: number;
  customerY: number;
}

export class Employee extends BaseCharacter {
  readonly employeeId: number;
  readonly employeeName: string;

  private aiState: EmpAIState = 'idle';
  private idleTimer = 1000 + Math.random() * 2000;
  private targetCustomerId: number | null = null;
  private targetX = 0;
  private targetY = 0;
  private nameBadge: Phaser.GameObjects.Text;
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
    super(scene, x, y, 'player_employee');

    this.employeeId = id;
    this.employeeName = name;

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(12, 12);
    body.setOffset(2, 12);
    this.setDepth(10);
    this.setOrigin(0.5, 0.9);

    this.nameBadge = scene.add.text(x, y - 24, name, {
      fontSize: '8px', color: '#AAFFAA', fontFamily: 'monospace',
      stroke: '#003300', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(11);

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

    this.nameBadge.setPosition(this.x, this.y - 24);
    this.setDepth(10 + this.y / 1000);

    if (this.foodCarrySprite) {
      this.foodCarrySprite.setPosition(this.x, this.y - 28);
      this.foodCarrySprite.setDepth(this.depth + 1);
    }

    switch (this.aiState) {
      case 'idle': {
        if (this.wanderTimer <= 0) {
          this.wanderTimer = Phaser.Math.Between(2000, 5000);
          this.wanderX = Phaser.Math.Between(2 * 32, 27 * 32);
          this.wanderY = Phaser.Math.Between(10 * 32, 14 * 32);
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
    this.nameBadge.destroy();
    this.foodCarrySprite?.destroy();
  }
}
