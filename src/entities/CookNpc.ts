import Phaser from 'phaser';
import { TILE } from '../constants';
import { StaffNpc } from './StaffNpc';

// Kitchen interior: cols 11–18, rows 5–6 (back-wall kitchen layout)
const WANDER_X_MIN = 11 * TILE + TILE / 2;
const WANDER_X_MAX = 18 * TILE + TILE / 2;
const WANDER_Y_MIN = 5 * TILE + TILE / 2;
const WANDER_Y_MAX = 6 * TILE + TILE / 2;
const COOK_SPEED = 65;

type CookState = 'wandering' | 'going_to_station' | 'at_station';

export class CookNpc extends StaffNpc {
  private cookState: CookState = 'wandering';
  private wanderTarget: { x: number; y: number } | null = null;
  private wanderTimer = 0;
  private assignedStationId: number | null = null;
  private stationX = 0;
  private stationY = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, name: string) {
    super(scene, x, y, name, '#FFCC88', '#442200');
    this.setTint(0xFFBB66);
    this.wanderTimer = Phaser.Math.Between(500, 1500);
    this.pickWanderTarget();
  }

  getAssignedStationId(): number | null { return this.assignedStationId; }

  goToStation(stationId: number, wx: number, wy: number): void {
    this.assignedStationId = stationId;
    this.stationX = wx;
    this.stationY = wy + 4;
    this.cookState = 'going_to_station';
    this.startNav(this.stationX, this.stationY);
  }

  returnToKitchen(): void {
    this.assignedStationId = null;
    this.cookState = 'wandering';
    this.wanderTarget = null;
    this.wanderTimer = Phaser.Math.Between(300, 800);
    this.setVel(0, 0);
  }

  update(delta: number): void {
    this.updateBadgeAndDepth();

    switch (this.cookState) {
      case 'wandering': {
        this.wanderTimer -= delta;
        if (!this.wanderTarget || this.distTo(this.wanderTarget.x, this.wanderTarget.y) < 10) {
          this.setVel(0, 0);
          if (this.wanderTimer <= 0) this.pickWanderTarget();
        } else {
          this.walkToward(this.wanderTarget.x, this.wanderTarget.y, COOK_SPEED);
        }
        break;
      }

      case 'going_to_station': {
        const arrived = this.followPath(delta, COOK_SPEED, this.stationX, this.stationY, 30);
        if (arrived) this.cookState = 'at_station';
        break;
      }

      case 'at_station':
        this.setVel(0, 0);
        break;
    }
  }

  private pickWanderTarget(): void {
    this.wanderTarget = {
      x: Phaser.Math.Between(WANDER_X_MIN, WANDER_X_MAX),
      y: Phaser.Math.Between(WANDER_Y_MIN, WANDER_Y_MAX),
    };
    this.wanderTimer = Phaser.Math.Between(1500, 4000);
    this.navPath = [];
  }

}
