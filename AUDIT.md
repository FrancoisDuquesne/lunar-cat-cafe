# Lunar Cat Café — Design Audit Findings

*Audited against Steam-release standards. Scored and prioritised.*

---

## Scores

| Area | Score |
|---|---|
| First Impression | 4/10 |
| Visual Direction | 3/10 |
| Fantasy & Theme | 5/10 |
| User Interface | 5/10 |
| Game Feel | 4/10 |
| Market Positioning | 4/10 |
| Steam Store Readiness | 1/10 |
| **Overall** | **3.5/10** |

---

## Top 10 Problems (ordered by impact)

1. **Exterior terrain dominates screen and is visually dead.** ~60% of every screenshot is a repeating gray tile. Single biggest screenshot killer.
2. **Debug labels in the game world.** "T1", "T2", "KITCHEN", "Espresso", "Discard" as floating world-space text signals unfinished work.
3. **Cats are invisible.** The game's central fantasy character appears as an ~8px blob. No emotional connection possible.
4. **No unified visual language.** Three separate palette schemes fight each other: warm gray exterior, cold blue-gray interior, golden HUD.
5. **Camera zoom is wrong.** Shows entire café plus 60% exterior, making everything feel small and empty.
6. **Title screen sells the wrong thing.** Shows empty space and a dome instead of warm cats, coffee, and charming chaos.
7. **Store Manager panel is too small and generic.** Primary management UI needs to be confident, spacious, and on-brand.
8. **No cozy atmosphere.** No warmth, no soft lighting, no ambient life. Feels like a grid editor.
9. **No visual progression feedback.** Upgrading the café doesn't visually look like an upgrade.
10. **No single iconic visual moment.** No screenshot that makes a player think "I want to live there."

---

## Implementation Plan

### Phase 1 — Low-Effort Polish ✅ DONE

- [x] **Camera zoom** — 1.8× zoom with smooth player follow. Café fills ~80%+ of screen.
- [x] **Remove debug labels** — T1/T2, KITCHEN, Espresso, Discard all removed/hidden.
- [x] **Screen vignette** — CSS radial-gradient dark frame. Exterior visually recedes.
- [x] **Scale up cats** — 1.8× display scale. Cats now clearly recognisable with faces.
- [x] **Exterior color** — Moon tiles shifted from warm sandy beige → cool blue-gray. Creates contrast.
- [x] **Warm wood floor** — Replaced cold industrial tile with warm dark oak at all tiers (was tier 3+ only).
- [x] **Warm interior overlay** — Subtle ADD-blend warm fill over café interior area.
- [x] **Title fix** — "CAT CAFÉ / ON THE MOON" → "LUNAR CAT CAFÉ" (cyan + pink dual-tone) with better subtitle.

### Phase 2 — Medium-Effort Redesign ✅ DONE

- [x] **Exterior environment** — Earth (detailed sphere with continents + atmosphere) and distant mountain silhouettes added to `buildExteriorDecor()`.
- [x] **Table redesign** — Ivory marble oval tables with visible apron and legs. T1/T2 labels removed.
- [x] **Kitchen visual upgrade** — Always-on ambient steam (700ms frequency) from every station; cooking boosts to 120ms. Station labels hidden.
- [x] **Cat sprite upgrade** — 28×22 awake / 28×16 sleeping textures with big eyes, smile, paws, whiskers. Scale 1.5×.
- [x] **Store Manager redesign** — 940px wide panel, horizontal tab bar (Overview / Furnish / Kitchen / Staff / Menu / Expand), cyan accent theme.
- [x] **Title screen** — Dome now shows warm café interior (tables, pendant lamps, cat silhouette, steam particles, hearts drifting up). Sleeping cat added to moon surface.

### Phase 3 — Full Art Direction Overhaul

- [ ] New tileset: warm cream/ivory floors, deep navy walls with neon accent trim, glowing signage.
- [ ] New characters: cats 32×48 with expressive faces. Customers with personality poses.
- [ ] New exterior: illustrated parallax — moon surface, Earth glow, distant structures.
- [ ] New HUD: holographic display aesthetic with neon accent palette.
- [ ] Ambient café sounds: music, coffee brewing, cat purring.

---

## Color Direction

**Target palette — "Warm neon space-cozy":**
- Background space: `#0a0a1a` deep navy
- Moon surface: `#2a2a3a` cool slate (not warm beige)
- Café floor: `#f5e6c8` warm cream/ivory
- Café walls: `#1a1a3a` deep navy with `#00d4ff` neon accent trim
- Warm light: `#ffb347` amber glow overlay
- HUD: match neon accent palette

---

## Key Insight

The game's **systems are at 60th percentile** quality for a $5+ Steam game.  
The game's **visuals are at 15th percentile**.

The concept is strong. The mechanics work. The presentation is the only thing preventing launch.  
Every problem is a visual/polish problem — none require redesigning gameplay.
