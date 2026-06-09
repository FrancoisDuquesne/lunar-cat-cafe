import Phaser from 'phaser';
import { TILE, MAP_COLS, MAP_ROWS } from '../constants';

export type BuildSubMode = 'idle' | 'placing' | 'moving';

export class BuildModeSystem {
  private scene: Phaser.Scene;
  private validityMapGraphics: Phaser.GameObjects.Graphics;
  private gridGraphics: Phaser.GameObjects.Graphics;
  private cellHighlight: Phaser.GameObjects.Graphics;
  private ghostSprite: Phaser.GameObjects.Image | null = null;

  private _buildActive = false;
  private _subMode: BuildSubMode = 'idle';

  movingInstanceId: string | null = null;
  movingOriginalTile: { tileX: number; tileY: number } | null = null;

  // Set by GameScene
  isValidTile: (tileX: number, tileY: number) => boolean = () => false;
  // Returns true for floor/door tiles (valid terrain regardless of occupancy)
  isBuildableTile: (tileX: number, tileY: number) => boolean = () => false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.validityMapGraphics = scene.add.graphics().setDepth(1.4).setVisible(false);
    this.gridGraphics = scene.add.graphics().setDepth(1.5).setVisible(false);
    this.cellHighlight = scene.add.graphics().setDepth(1.6).setVisible(false);
    this._drawGrid();
  }

  // ─── Public getters ───────────────────────────────────────────────────────

  get isBuildActive(): boolean { return this._buildActive; }
  get subMode(): BuildSubMode { return this._subMode; }
  get isMoving(): boolean { return this._subMode === 'moving'; }
  get isPlacing(): boolean { return this._subMode === 'placing'; }
  get hasActiveAction(): boolean { return this._subMode !== 'idle'; }

  // ─── Build mode on/off ────────────────────────────────────────────────────

  enter(): void {
    this._buildActive = true;
    this._subMode = 'idle';
    this.refreshValidityMap();
    this.validityMapGraphics.setVisible(true);
    this.gridGraphics.setVisible(true);
  }

  exit(): void {
    this._buildActive = false;
    this._subMode = 'idle';
    this.movingInstanceId = null;
    this.movingOriginalTile = null;
    this._destroyGhost();
    this.validityMapGraphics.setVisible(false);
    this.gridGraphics.setVisible(false);
  }

  refreshValidityMap(): void {
    const g = this.validityMapGraphics;
    g.clear();
    for (let ty = 0; ty < MAP_ROWS; ty++) {
      for (let tx = 0; tx < MAP_COLS; tx++) {
        if (!this.isBuildableTile(tx, ty)) continue;
        if (this.isValidTile(tx, ty)) {
          g.fillStyle(0x38CC60, 0.11);
          g.fillRect(tx * TILE, ty * TILE, TILE, TILE);
          g.lineStyle(1, 0x44EE70, 0.22);
          g.strokeRect(tx * TILE + 0.5, ty * TILE + 0.5, TILE - 1, TILE - 1);
        } else {
          g.fillStyle(0xCC2818, 0.09);
          g.fillRect(tx * TILE, ty * TILE, TILE, TILE);
          g.lineStyle(1, 0xEE3322, 0.18);
          g.strokeRect(tx * TILE + 0.5, ty * TILE + 0.5, TILE - 1, TILE - 1);
        }
      }
    }
  }

  toggle(): void {
    if (this._buildActive) this.exit();
    else this.enter();
  }

  // ─── Ghost management ─────────────────────────────────────────────────────

  showGhostForPlacing(spriteKey: string): void {
    this._destroyGhost();
    this._subMode = 'placing';
    this._createGhost(spriteKey);
    this.gridGraphics.setVisible(true);
  }

  showGhostForMoving(instanceId: string, spriteKey: string, tileX: number, tileY: number): void {
    this._destroyGhost();
    this._subMode = 'moving';
    this.movingInstanceId = instanceId;
    this.movingOriginalTile = { tileX, tileY };
    this._createGhost(spriteKey);
  }

  destroyGhost(): void {
    this._destroyGhost();
    this._subMode = 'idle';
    if (!this._buildActive) {
      this.gridGraphics.setVisible(false);
    }
  }

  endMove(): void {
    this.movingInstanceId = null;
    this.movingOriginalTile = null;
    this._destroyGhost();
    this._subMode = 'idle';
  }

  // ─── Per-frame update ─────────────────────────────────────────────────────

  update(pointer: Phaser.Input.Pointer): void {
    if (!this.ghostSprite) {
      this.cellHighlight.setVisible(false);
      return;
    }
    const tileX = Math.floor(pointer.worldX / TILE);
    const tileY = Math.floor(pointer.worldY / TILE);
    this.ghostSprite.setPosition(tileX * TILE + TILE / 2, tileY * TILE + TILE / 2);
    const valid = this.isValidTile(tileX, tileY);
    this.ghostSprite.setTint(valid ? 0x88FF88 : 0xFF4444);

    // Cell backdrop: filled rect + clean border
    this.cellHighlight.clear().setVisible(true);
    const fillColor   = valid ? 0x38CC60 : 0xCC2818;
    const strokeColor = valid ? 0x55FF88 : 0xFF4433;
    this.cellHighlight.fillStyle(fillColor, 0.22);
    this.cellHighlight.fillRect(tileX * TILE, tileY * TILE, TILE, TILE);
    this.cellHighlight.lineStyle(2, strokeColor, 0.95);
    this.cellHighlight.strokeRect(tileX * TILE + 1, tileY * TILE + 1, TILE - 2, TILE - 2);
  }

  getHoveredTile(pointer: Phaser.Input.Pointer): { tileX: number; tileY: number } {
    return {
      tileX: Math.floor(pointer.worldX / TILE),
      tileY: Math.floor(pointer.worldY / TILE),
    };
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────────

  destroy(): void {
    this._destroyGhost();
    this.validityMapGraphics.destroy();
    this.cellHighlight.destroy();
    this.gridGraphics.destroy();
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private _createGhost(spriteKey: string): void {
    this.ghostSprite = this.scene.add.image(-999, -999, spriteKey)
      .setAlpha(0.72)
      .setDepth(150);
  }

  private _destroyGhost(): void {
    this.ghostSprite?.destroy();
    this.ghostSprite = null;
    this.cellHighlight.clear().setVisible(false);
  }

  private _drawGrid(): void {
    const g = this.gridGraphics;
    g.lineStyle(1, 0xC8B090, 0.16);
    for (let c = 0; c <= MAP_COLS; c++) {
      g.moveTo(c * TILE, 0);
      g.lineTo(c * TILE, MAP_ROWS * TILE);
    }
    for (let r = 0; r <= MAP_ROWS; r++) {
      g.moveTo(0, r * TILE);
      g.lineTo(MAP_COLS * TILE, r * TILE);
    }
    g.strokePath();
  }
}
