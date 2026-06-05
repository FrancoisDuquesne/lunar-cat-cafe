# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start Vite dev server (hot reload)
npm run build     # tsc type-check + Vite production build → dist/
npm run preview   # serve the dist/ build locally
```

There is no test runner configured.

## Architecture

**Stack:** Phaser 3.80 + TypeScript 5.3 + Vite 5. Runs entirely in the browser — no server, no image files. All textures are generated procedurally at boot time by `src/textures/TextureFactory.ts`.

### Scene flow

```
BootScene → MainMenuScene → GameScene (+ UIScene launched in parallel)
```

- **BootScene** calls `createAllTextures()` then immediately starts `MainMenuScene`.
- **MainMenuScene** starts both `GameScene` and `UIScene` together; `UIScene` is brought to top.
- **GameScene** restarts itself (via `scene.restart()`) on each new day — all mutable state must be explicitly reset at the top of `create()`.
- **UIScene** is a passive Phaser overlay. It receives data exclusively through `this.game.events.emit('ui_update', payload)` fired by `GameScene`. It never reads `GameScene` state directly.
- **UIOverlay** (`src/ui/UIOverlay.ts`) is a separate DOM-based HTML panel (the store/manager panel). It emits typed `GameCommand` events back to `GameScene` via `game.events.emit('game_event', cmd)`.

### Communication patterns

- `GameScene → UIScene`: `game.events.emit('ui_update', UIState)` — live HUD updates.
- `UIOverlay → GameScene`: `game.events.emit('game_event', GameCommand)` — typed command bus (buy table, hire staff, buy recipe, etc.). See `GameCommand` in `src/types.ts`.
- `GameScene` listens to `game_event` and dispatches based on `cmd.type`.

### Texture naming convention

`TextureFactory.ts` generates every sprite key. Naming patterns:
- `tile_*` — map tiles (floor, wall, window, counter, kitchen, space, moon)
- `obj_*` — furniture and props (table, chair, stove, coffee_machine, cat_bed, plant, trash_can, …)
- `deco_*` — purchasable decoration sprites (round_table, neon_sign, luna_fern, telescope, …)
- `customer_{type}` — astronaut, scientist, tourist, worker
- `cat_{colorKey}` / `cat_{colorKey}_sleep` — orange, gray, black, cream
- `player_down` / `player_up` / `player_side` / `player_employee`
- `food_{menuId}` — moon_mocha, zerog_latte, luna_pancakes, star_cookies, lunar_fondue, nebula_risotto, gravity_souffle
- `ui_*` — HUD elements (coin, star, heart, progress_bg, e_prompt, order_bubble)
- `particle_*` — steam, star, heart, coin

When adding a new sprite, create its texture in `TextureFactory.ts` and call the function from `createAllTextures()`.

### Map layout

The map is a hardcoded `number[][]` at the top of `GameScene.ts` (30 cols × 18 rows, `TILE = 32px`). The kitchen is a **central island** in the middle of the café, not a back wall.

```
Row  0–1 : space exterior
Row  2–3 : windows (back wall)
Row  4   : dining (open area)
Row  5   : dining left/right + island counter top (cols 10–19)
Row  6   : dining left/right + counter walls (cols 10, 19) + kitchen interior (cols 11–18)
Row  7   : dining left/right + open island sides (cols 10, 19 = floor) + kitchen (cols 11–18)
Row  8   : same as row 7
Row  9   : dining left/right + counter walls (cols 10, 19) + kitchen (cols 11–18)
Row 10   : dining + island pass-through bottom (cols 11–18 = floor)
Row 11–14: dining area (full width inside walls)
Row 15   : front wall with door at cols 14–17
Row 16–17: moon exterior
```

Tile codes: `0` space/moon, `1` floor, `2` wall, `3` window, `4` counter, `5` door, `6` kitchen. Walls and counters get invisible physics bodies added to `wallGroup`.

The kitchen interior is at cols 11–18, rows 6–9. Players/NPCs enter from the open sides (rows 7–8, cols 10 and 19 = floor).

### Gameplay loop

Each day lasts `DAY_DURATION_MS` (5 min). Phases: morning → afternoon → evening → night (day-end).

1. Customer spawns from the door, walks to a free seat (waypoint first, then seat). If no seat is free, joins a queue (capacity scales with cafe tier).
2. After a short pause, customer shows an order bubble (`waiting_order`).
3. Player (or waiter NPC) walks near the customer and presses E to take the order (`order_taken` → `waiting_food`).
4. Player walks to the matching kitchen station and presses E to start cooking (or cook NPC auto-starts).
5. When `cookProgress >= 1`, player presses E again to pick up the food (cook NPC returns to wander).
6. Player delivers to the customer by pressing E while adjacent. Money and reputation are awarded.
7. Customer eats, then walks out. If patience runs out, customer leaves unhappy (reputation penalty).

### Entity classes

All entities extend `Phaser.Physics.Arcade.Sprite`.

- **`BaseCharacter`** (`src/entities/BaseCharacter.ts`) — abstract base for all moving characters. Owns A\* nav (`navPath`, `followPath()`, `startNav()`), a stuck-detection timer, and `pathFinder` callback. Subclasses use `followPath()` in their update loops.
- **`Player`** — WASD/arrow movement, E/Space interact key fires `onInteract` callback set by `GameScene`.
- **`Customer`** — states: `walking_in → seated → waiting_order → order_taken → waiting_food → eating → walking_out → gone`. Tip = base price × patience bonus × happiness bonus.
- **`Cat`** — states: `sleeping → waking → wandering → sitting → approaching_customer`. Personality (`lazy`, `friendly`, `mischievous`, `explorer`) affects speed and behavior.
- **`Employee`** (waiter, hired from shop) — states: `idle → going_to_customer`. Wanders the dining area and auto-takes orders from `waiting_order` customers. `GameScene` maintains `employeeAssignedIds` to prevent double-assignment. Employees also auto-deliver ready food.
- **`CookNpc`** (`src/entities/CookNpc.ts`) — kitchen NPC. States: `wandering → going_to_station → at_station`. Wanders inside kitchen island; when `KitchenSystem` auto-starts a cook cycle, it calls `cook.goToStation(id, wx, wy)`. On cook complete, `cook.returnToKitchen()`.

### Systems

- **`KitchenSystem`** (`src/systems/KitchenSystem.ts`) — owns all `Station` objects and `CookNpc` instances. Handles auto-cook logic (triggered by timer when cooks are hired). Exposes `startCooking()`, `pickupFromStation()`, `getPendingOrder()`, `getReadyStations()`. Built via `kitchen.build()` in `GameScene.create()`.
- **`CustomerSystem`** (`src/systems/CustomerSystem.ts`) — owns all `Customer` instances. Handles spawn scheduling (with reputation factor and day-phase multiplier), queue management (visible ghost sprites in the moon exterior), group spawns (28% chance, needs a 2-seat table), and booked-guest spawns. Calls back to `GameScene` via `CustomerCallbacks` interface.
- **`Pathfinder`** (`src/systems/Pathfinder.ts`) — A\* on the tile grid. Built once, queried many times. Has `blockRect()`/`unblockRect()` for furniture. Two instances are created: `pathfinder` (for player and staff, blocks furniture/tables) and `customerPathfinder` (for customers, separate walkability).

### Kitchen stations

Stations are built by `KitchenSystem.build()` from `BASE_STATION_DEFS` and `EXTRA_STATION_DEFS`:

| Station  | Base position   | Extra position  | Unlock              |
|----------|-----------------|-----------------|---------------------|
| Coffee   | col 12, row 7   | col 12, row 8   | Starts owned        |
| Stove    | col 15, row 7   | col 15, row 8   | Buy via `buy_kitchen` |
| Prep     | col 17, row 7   | col 17, row 8   | Buy via `buy_kitchen` |

Extra stations (row 8) are added when the `extra_machines` upgrade is purchased. Stations track: `isCooking`, `cookProgress` (0–1), `cookTargetMs`, `currentOrderId`, `cookingItemId`. Progress bar graphics are created/destroyed per cook cycle. A ready food sprite bobs above the station when done.

### Interaction system

`GameScene.scanInteractables()` runs every frame and returns an `InteractionContext` (radius `INTERACTION_REACH = 52px`). Priority: trash can > stations > customers > cats. `handleInteraction()` acts on the context when E/Space is pressed.

### Cafe tier system

`CAFE_TIERS` (in `constants.ts`) defines 5 tiers keyed by `ambianceRequired` (total ambiance score from placed decorations):

| Level | Name            | Ambiance needed | Price mult |
|-------|-----------------|-----------------|------------|
| 1     | Space Shack     | 0               | ×1.00      |
| 2     | Lunar Café      | 80              | ×1.25      |
| 3     | Moon Bistro     | 250             | ×1.60      |
| 4     | Star Restaurant | 600             | ×2.00      |
| 5     | Cosmic Dining   | 1200            | ×2.50      |

Higher tiers unlock more menu items, attract better customers, and unlock more shop purchases (`minTier` on employees, decorations).

### Decoration & table slot systems

- **`DECORATION_ITEMS`** — purchasable decor items with categories (`seating`, `furniture`, `lighting`, `plants`, `wallDecor`, `specialty`), `ambianceValue`, `spriteKey`, and `minTier`. Seating items (`table_single`, `table_group`, `bar_stool`) also register a seat when placed, but table capacity is mainly controlled by `TABLE_SLOT_DEFS`.
- **`TABLE_SLOT_DEFS`** — 12 fixed slot positions for tables/booths (IDs 0–11). Players start with slots 0, 1, 2 owned and buy more. Each slot has `col`, `row`, `seats` (1 or 2), and `cost`. `GameScene` builds `TableSlot[]` from owned IDs in `shopState.ownedTableSlotIds`.
- Placed decorations are stored in `shopState.placedDecorations: PlacedDecoration[]` and persisted to save.
- The `Pathfinder` is updated via `blockRect()`/`unblockRect()` when decorations are placed or removed.

### Employee roles

Four roles in `EMPLOYEE_TYPES`:

| Role    | Cost | Max | Effect                               | Min tier |
|---------|------|-----|--------------------------------------|----------|
| waiter  | 150  | 3   | Auto-takes orders from customers     | 1        |
| cook    | 250  | 2   | Kitchen NPC, auto-starts cooking     | 1        |
| guard   | 200  | 1   | +5 rep/day                           | 2        |
| caterer | 300  | 1   | +25% tip bonus                       | 3        |

Waiters are `Employee` instances; cooks are `CookNpc` instances managed by `KitchenSystem`. Guards and caterers have passive effects only.

### Menu items

7 items defined in `MENU_ITEMS` (`constants.ts`):

| id               | Price | Prep   | Station | Recipe cost |
|------------------|-------|--------|---------|-------------|
| moon_mocha       | 18    | 10 s   | coffee  | Free        |
| zerog_latte      | 14    | 8 s    | coffee  | Free        |
| luna_pancakes    | 22    | 18 s   | stove   | 40          |
| star_cookies     | 12    | 14 s   | prep    | 30          |
| lunar_fondue     | 32    | 22 s   | stove   | 80          |
| nebula_risotto   | 48    | 28 s   | stove   | 140         |
| gravity_souffle  | 68    | 35 s   | prep    | 220         |

`shopState.ownedRecipeIds` tracks purchased recipes; `shopState.dailyMenuIds` tracks which are on today's menu.

### Save system

`src/systems/SaveSystem.ts` — `localStorage` key `lunar_cat_cafe_v2`. Saves `GameSaveState` (money, reputation, day, totalServed, cats[], shop, popularityHistory). Auto-saves every 10 s during play and on "Next Day". `loadGame()` patches missing fields for forward-compatibility.

### Depth layers

| Depth | Content |
|-------|---------|
| 0 | Floor tiles |
| 0.5 | Ambient lighting graphics |
| 1–2 | Exterior decor, cat beds |
| 3–4 | Furniture, stations, props |
| 5+ | Cats (+ y/1000 for Y-sort) |
| 7–8 | Customer queue sprites |
| 8+ | Customers (+ y/1000) |
| 10+ | Player, employees, cook NPCs (+ y/1000) |
| 20–21 | Cooking progress bars |
| 22 | Ready food sprites (bobbing above station) |
| 50 | Order speech bubbles |
| 100 | Floating text |
| 105 | UIScene HUD |
| 200+ | Day-end overlay and panel |

### Audio

All sound synthesised via the Web Audio API (`AudioContext` + `OscillatorNode`) directly in `GameScene`. No audio files. Helpers: `playPop()`, `playCook()`, `playChime()`.

### Touch controls

`src/ui/TouchControls.ts` provides a virtual D-pad for mobile. Imported and initialised in `UIScene`.
