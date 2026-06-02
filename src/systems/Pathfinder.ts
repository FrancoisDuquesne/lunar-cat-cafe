/**
 * Simple A* pathfinder on a tile grid.
 * Designed for static maps — build once, query many times.
 */

const SQRT2 = 1.4142135623730951;

export class Pathfinder {
  private readonly walkable: Uint8Array; // 1 = passable, 0 = blocked
  private readonly cols: number;
  private readonly rows: number;
  private readonly T: number; // tile size in pixels

  constructor(map: number[][], tileSize: number, walkableTileTypes: Set<number>) {
    this.T    = tileSize;
    this.rows = map.length;
    this.cols = map[0].length;
    this.walkable = new Uint8Array(this.rows * this.cols);
    for (let r = 0; r < this.rows; r++)
      for (let c = 0; c < this.cols; c++)
        this.walkable[r * this.cols + c] = walkableTileTypes.has(map[r][c]) ? 1 : 0;
  }

  /** Mark a world-space body rectangle (top-left origin) as non-walkable. */
  blockRect(left: number, top: number, w: number, h: number): void {
    const c0 = Math.max(0, Math.floor(left / this.T));
    const c1 = Math.min(this.cols - 1, Math.floor((left + w - 1) / this.T));
    const r0 = Math.max(0, Math.floor(top / this.T));
    const r1 = Math.min(this.rows - 1, Math.floor((top + h - 1) / this.T));
    for (let r = r0; r <= r1; r++)
      for (let c = c0; c <= c1; c++)
        this.walkable[r * this.cols + c] = 0;
  }

  private ok(r: number, c: number): boolean {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols
      && this.walkable[r * this.cols + c] === 1;
  }

  /**
   * Find a path from world-point (sx,sy) to (tx,ty).
   * Returns an array of world-space waypoints (not including the start).
   * Returns [{x:tx,y:ty}] if no path is found (direct fallback).
   */
  findPath(sx: number, sy: number, tx: number, ty: number): Array<{ x: number; y: number }> {
    const T = this.T;
    const sc = Math.floor(sx / T), sr = Math.floor(sy / T);
    let   tc = Math.floor(tx / T), tr = Math.floor(ty / T);

    // If the target tile is blocked, find the nearest walkable neighbour.
    if (!this.ok(tr, tc)) {
      let found = false;
      outer: for (let d = 1; d <= 4 && !found; d++) {
        for (let dr = -d; dr <= d && !found; dr++) {
          for (let dc = -d; dc <= d && !found; dc++) {
            if (Math.abs(dr) < d && Math.abs(dc) < d) continue;
            if (this.ok(tr + dr, tc + dc)) {
              tr += dr; tc += dc; found = true;
            }
          }
        }
      }
      if (!found) return [{ x: tx, y: ty }];
    }

    if (sr === tr && sc === tc) return [{ x: tx, y: ty }];

    // ── A* ───────────────────────────────────────────────────────────────
    const N = this.rows * this.cols;
    const g      = new Float32Array(N).fill(1e9);
    const parent = new Int32Array(N).fill(-1);
    const inOpen = new Uint8Array(N);

    const key = (r: number, c: number) => r * this.cols + c;
    const h   = (r: number, c: number) => Math.hypot(r - tr, c - tc);

    const open: Array<{ i: number; r: number; c: number; f: number }> = [];
    const si = key(sr, sc);
    g[si] = 0;
    inOpen[si] = 1;
    open.push({ i: si, r: sr, c: sc, f: h(sr, sc) });

    // 8-directional neighbours: [dr, dc, cost]
    const DIRS: [number, number, number][] = [
      [-1, 0, 1], [1, 0, 1], [0, -1, 1], [0, 1, 1],
      [-1, -1, SQRT2], [-1, 1, SQRT2], [1, -1, SQRT2], [1, 1, SQRT2],
    ];

    while (open.length > 0) {
      // Pop minimum-f node (linear scan — fast enough for a 540-node grid)
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0];
      inOpen[cur.i] = 0;

      if (cur.r === tr && cur.c === tc) {
        // Reconstruct tile path
        const path: Array<{ x: number; y: number }> = [];
        let idx = cur.i;
        while (idx !== si) {
          path.unshift({ x: (idx % this.cols) * T + T / 2, y: Math.floor(idx / this.cols) * T + T / 2 });
          idx = parent[idx];
        }
        if (path.length === 0) return [{ x: tx, y: ty }];
        path[path.length - 1] = { x: tx, y: ty }; // snap last to exact target
        return this.smooth(path);
      }

      for (const [dr, dc, cost] of DIRS) {
        const nr = cur.r + dr, nc = cur.c + dc;
        if (!this.ok(nr, nc)) continue;
        // No diagonal corner-cutting through blocked tiles
        if (dr !== 0 && dc !== 0 && (!this.ok(cur.r, nc) || !this.ok(nr, cur.c))) continue;

        const ni  = key(nr, nc);
        const ng  = g[cur.i] + cost;
        if (ng < g[ni]) {
          g[ni]      = ng;
          parent[ni] = cur.i;
          if (!inOpen[ni]) {
            inOpen[ni] = 1;
            open.push({ i: ni, r: nr, c: nc, f: ng + h(nr, nc) });
          }
        }
      }
    }

    return [{ x: tx, y: ty }]; // no path found
  }

  /**
   * Greedy string-pulling: remove waypoints that can be skipped
   * via an unobstructed Bresenham line-of-sight.
   */
  private smooth(path: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
    if (path.length <= 2) return path;
    const T = this.T;
    const out = [path[0]];
    let i = 0;
    while (i < path.length - 1) {
      let j = path.length - 1;
      while (j > i + 1 && !this.los(
        Math.floor(path[i].x / T), Math.floor(path[i].y / T),
        Math.floor(path[j].x / T), Math.floor(path[j].y / T),
      )) j--;
      out.push(path[j]);
      i = j;
    }
    return out;
  }

  private los(c0: number, r0: number, c1: number, r1: number): boolean {
    let c = c0, r = r0;
    const dc = Math.abs(c1 - c0), dr = Math.abs(r1 - r0);
    const sc = c0 < c1 ? 1 : -1, sr2 = r0 < r1 ? 1 : -1;
    let err = dc - dr;
    for (;;) {
      if (!this.ok(r, c)) return false;
      if (c === c1 && r === r1) return true;
      const e2 = 2 * err;
      if (e2 > -dr) { err -= dr; c += sc; }
      if (e2 <  dc) { err += dc; r += sr2; }
    }
  }
}
