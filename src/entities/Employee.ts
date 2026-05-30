import Phaser from 'phaser';

type EmpAIState = 'idle' | 'going_to_customer';

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

  // Set by GameScene so the employee can trigger game logic
  onTakeOrder?: (customerId: number) => void;

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
  }

  update(
    delta: number,
    waitingCustomers: Array<{ customerId: number; x: number; y: number }>,
    assignedIds: Set<number>,
  ): void {
    this.idleTimer -= delta;
    this.wanderTimer -= delta;

    // Update name badge to follow the sprite
    this.nameBadge.setPosition(this.x, this.y - 24);
    this.setDepth(10 + this.y / 1000);

    switch (this.aiState) {
      case 'idle': {
        // Slow wander in dining area
        if (this.wanderTimer <= 0) {
          this.wanderTimer = Phaser.Math.Between(2000, 5000);
          this.wanderX = Phaser.Math.Between(3 * 32, 21 * 32);
          this.wanderY = Phaser.Math.Between(9 * 32, 13 * 32);
        }
        const wx = this.wanderX - this.x;
        const wy = this.wanderY - this.y;
        const wd = Math.sqrt(wx * wx + wy * wy) || 1;
        if (wd > 8) {
          (this.body as Phaser.Physics.Arcade.Body).setVelocity((wx / wd) * 40, (wy / wd) * 40);
        } else {
          (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        }

        // Every ~1.5s, check for unattended waiting_order customers
        if (this.idleTimer <= 0) {
          this.idleTimer = 1500;
          const target = waitingCustomers.find(c => !assignedIds.has(c.customerId));
          if (target) {
            this.targetCustomerId = target.customerId;
            this.targetX = target.x;
            this.targetY = target.y;
            this.aiState = 'going_to_customer';
            assignedIds.add(target.customerId);
          }
        }
        break;
      }

      case 'going_to_customer': {
        // Check if the customer is still waiting
        const still = waitingCustomers.find(c => c.customerId === this.targetCustomerId);
        if (!still) {
          // Customer gone or already served
          if (this.targetCustomerId !== null) assignedIds.delete(this.targetCustomerId);
          this.targetCustomerId = null;
          this.aiState = 'idle';
          this.idleTimer = 1000;
          break;
        }
        // Update target in case customer moved slightly
        this.targetX = still.x;
        this.targetY = still.y;

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        if (dist < 40) {
          // Close enough – take the order
          (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
          if (this.targetCustomerId !== null && this.onTakeOrder) {
            this.onTakeOrder(this.targetCustomerId);
          }
          assignedIds.delete(this.targetCustomerId!);
          this.targetCustomerId = null;
          this.aiState = 'idle';
          this.idleTimer = 2000;
          this.wanderTimer = 0;
        } else {
          const speed = 85;
          (this.body as Phaser.Physics.Arcade.Body).setVelocity((dx / dist) * speed, (dy / dist) * speed);
        }
        break;
      }
    }
  }

  cleanup(): void {
    this.nameBadge.destroy();
  }
}
