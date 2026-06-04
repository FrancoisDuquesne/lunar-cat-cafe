import Phaser from 'phaser';

type EmpAIState = 'idle' | 'going_to_customer' | 'going_to_station' | 'delivering_food';

export interface ReadyStation {
  stationId: number;
  stationX: number;
  stationY: number;
  customerId: number;
  customerX: number;
  customerY: number;
}

export class Employee extends Phaser.Physics.Arcade.Sprite {
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

  // Pathfinding
  pathFinder?: (fx: number, fy: number, tx: number, ty: number) => Array<{x: number; y: number}>;
  private navPath: Array<{x: number; y: number}> = [];
  private stuckTimer = 0;
  private lastX = 0;
  private lastY = 0;

  onTakeOrder?: (customerId: number) => void;
  onPickupFood?: (stationId: number) => string | null;
  onDeliverFood?: (customerId: number, itemId: string) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, id: number, name: string) {
    super(scene, x, y, 'player_employee');
    scene.add.existing(this);
    scene.physics.add.existing(this);

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
    this.lastX = x;
    this.lastY = y;
  }

  // ── Navigation helpers ─────────────────────────────────────────────────

  private startNav(tx: number, ty: number): void {
    if (this.pathFinder) {
      const path = this.pathFinder(this.x, this.y, tx, ty);
      this.navPath = path.length > 0 ? path : [{ x: tx, y: ty }];
    } else {
      this.navPath = [{ x: tx, y: ty }];
    }
    this.stuckTimer = 0;
    this.lastX = this.x;
    this.lastY = this.y;
  }

  // Move along navPath toward (finalX, finalY). Returns true when within arrivalDist.
  private followPath(delta: number, speed: number, finalX: number, finalY: number, arrivalDist: number): boolean {
    const fdx = finalX - this.x;
    const fdy = finalY - this.y;
    if (Math.sqrt(fdx * fdx + fdy * fdy) < arrivalDist) {
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
      this.navPath = [];
      return true;
    }

    // Advance past waypoints we've reached
    while (this.navPath.length > 1) {
      const wp = this.navPath[0];
      const wx = wp.x - this.x, wy = wp.y - this.y;
      if (Math.sqrt(wx * wx + wy * wy) < 16) {
        this.navPath.shift();
      } else {
        break;
      }
    }

    const target = this.navPath[0] ?? { x: finalX, y: finalY };
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity((dx / dist) * speed, (dy / dist) * speed);

    // Stuck detection: if we haven't moved 4px in 1.5s, recompute the path
    this.stuckTimer += delta;
    if (this.stuckTimer > 1500) {
      const moved = Math.sqrt((this.x - this.lastX) ** 2 + (this.y - this.lastY) ** 2);
      if (moved < 4) {
        this.startNav(finalX, finalY);
      } else {
        this.lastX = this.x;
        this.lastY = this.y;
      }
      this.stuckTimer = 0;
    }

    return false;
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
          (this.body as Phaser.Physics.Arcade.Body).setVelocity((wx / wd) * 40, (wy / wd) * 40);
        } else {
          (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        }

        if (this.idleTimer <= 0) {
          this.idleTimer = 1500;
          const orderTarget = waitingCustomers.find(c => !assignedIds.has(c.customerId));
          if (orderTarget) {
            this.targetCustomerId = orderTarget.customerId;
            this.targetX = orderTarget.x;
            this.targetY = orderTarget.y;
            this.aiState = 'going_to_customer';
            assignedIds.add(orderTarget.customerId);
            this.startNav(this.targetX, this.targetY);
          } else {
            const station = readyStations.find(s => !stationDeliveryIds.has(s.customerId));
            if (station) {
              this.targetStationId = station.stationId;
              this.targetCustomerId = station.customerId;
              this.targetX = station.stationX;
              this.targetY = station.stationY;
              this.aiState = 'going_to_station';
              stationDeliveryIds.add(station.customerId);
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
          (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
          break;
        }

        // Re-target if customer moved significantly (shouldn't happen when seated, but just in case)
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
          (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
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
          (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
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
