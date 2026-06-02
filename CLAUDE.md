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

**Stack:** Phaser 3.80 + TypeScript 5.3 + Vite 5. The game runs entirely in the browser — no server, no image files. All textures are generated procedurally at boot time by `src/textures/TextureFactory.ts`.

### Scene flow

```
BootScene → MainMenuScene → GameScene (+ UIScene launched in parallel)
```

- **BootScene** calls `createAllTextures()` then immediately starts `MainMenuScene`.
- **MainMenuScene** starts both `GameScene` and `UIScene` together; `UIScene` is brought to top.
- **GameScene** restarts itself (via `scene.restart()`) on each new day rather than re-constructing — all mutable state must be explicitly reset at the top of `create()`.
- **UIScene** is a passive overlay. It receives data exclusively through `this.game.events.emit('ui_update', payload)` fired by `GameScene`. It never reads `GameScene` state directly.

### Texture naming convention

`TextureFactory.ts` generates every sprite key used in the game. Naming patterns:
- `tile_*` — map tiles (floor, wall, window, counter, kitchen, space, moon)
- `obj_*` — furniture and props (table, chair, stove, coffee_machine, cat_bed, plant, …)
- `customer_{type}` — astronaut, scientist, tourist, worker
- `cat_{colorKey}` / `cat_{colorKey}_sleep` — orange, gray, black, cream
- `player_down` / `player_up` / `player_side` / `player_employee`
- `food_{menuId}` — moon_mocha, zerog_latte, luna_pancakes, star_cookies
- `ui_*` — HUD elements (coin, star, heart, progress_bg, e_prompt, order_bubble)
- `particle_*` — steam, star, heart, coin

When adding a new sprite, create its texture in `TextureFactory.ts` and call the function from `createAllTextures()`.

### Map layout

The map is a hardcoded `number[][]` at the top of `GameScene.ts` (30 cols × 18 rows, `TILE = 32px`):
- Rows 0–1: space exterior
- Rows 2–3: windows (back wall)
- Rows 4–6: kitchen
- Row 7: service counter with opening at cols 13–17
- Rows 8–14: dining area
- Row 15: front wall with door at cols 14–17
- Rows 16–17: moon exterior

Tile codes: `0` space/moon, `1` floor, `2` wall, `3` window, `4` counter, `5` door, `6` kitchen. Walls and counters get invisible physics bodies added to `wallGroup`.

### Gameplay loop

Each day lasts `DAY_DURATION_MS` (5 min). The core player flow is:

1. Customer spawns from the door, walks to a free seat (walks to `DOOR_INNER_Y` waypoint first, then to seat).
2. After a short pause, customer shows an order bubble (`waiting_order`).
3. Player (or employee) walks near the customer and presses E to take the order (`order_taken` → `waiting_food`).
4. Player walks to the matching station (coffee/stove/prep) and presses E to start cooking.
5. When `cookProgress >= 1`, player presses E again to pick up the food.
6. Player delivers to the customer by pressing E while adjacent. Money and reputation are awarded.
7. Customer eats, then walks out through the door. If patience runs out before delivery, the customer leaves unhappy, costing reputation.

### Entity classes

All entities extend `Phaser.Physics.Arcade.Sprite` and own their own AI state machine updated each frame:
- **Player** — WASD/arrow movement, E/Space interact key fires `onInteract` callback set by `GameScene`.
- **Customer** — states: `walking_in → seated → waiting_order → order_taken → waiting_food → eating → walking_out → gone`. Tip = base price × patience bonus × happiness bonus.
- **Cat** — states: `sleeping → waking → wandering → sitting → approaching_customer`. Personality affects speed and behavior (`lazy`, `friendly`, `mischievous`, `explorer`).
- **Employee** (shop upgrade) — states: `idle → going_to_customer`. Wanders the dining area and auto-takes orders from `waiting_order` customers. `GameScene` maintains `employeeAssignedIds` to prevent double-assignment.

### Interaction system

`GameScene.scanInteractables()` runs every frame and returns an `InteractionContext` based on player proximity (radius 52px). Priority order: trash can > stations > customers > cats. `handleInteraction()` acts on the current context when E/Space is pressed.

### Kitchen stations

Base stations: coffee (col 4), stove (col 14), prep (col 23). Buying the `extra_machines` shop upgrade adds a second station of each type at cols 9, 19, 27. Stations track `isCooking`, `cookProgress` (0–1), and `currentOrderId`. Progress bar graphics are created/destroyed per cook cycle.

### Save system

`src/systems/SaveSystem.ts` uses `localStorage` key `lunar_cat_cafe_v2`. Saves `GameSaveState` (money, reputation, day, totalServed, cats[], shop). Auto-saves every 10 seconds during play and on "Next Day". `loadGame()` patches missing fields for forward-compatibility.

### Depth layers

| Depth | Content |
|-------|---------|
| 0 | Floor tiles |
| 0.5 | Ambient lighting graphics |
| 1–2 | Exterior decor, cat beds |
| 3–4 | Furniture, stations, props |
| 5+ | Cats (+ y/1000 for Y-sort) |
| 8+ | Customers (+ y/1000) |
| 10+ | Player, employees (+ y/1000) |
| 20 | Cooking progress bars, sleep-Z text |
| 50 | Order speech bubbles |
| 100 | Floating text |
| 105 | UIScene HUD |
| 200+ | Day-end overlay and panel |

### Audio

All sound is synthesised via the Web Audio API (`AudioContext` + `OscillatorNode`) directly in `GameScene`. No audio files. The three helpers are `playPop()`, `playCook()`, and `playChime()`.
