> **Status (Oct 23):** Pearl look delivered (all 8 sheets, wired in). Still needed: Gilded + Tideglass sheets, a Prismancer HUD portrait, pet sheets, skill icons.

# Art requests: Prismancer (mage slot)

Put the generated files in `art-src/ooze/incoming/prismancer/`. The code already runs on placeholders: tinted Chrome Veil frames in `art/prismancer/`, registered by `oozevale-prism-looks.js`. When the real sheets land, process them like the other heroes (magenta key, 6 sheets per look), name them `<look>-<anim>.png` and update `art/prismancer/placeholder.js`, or register them in anim.json.

Style reference: `/workspace/oozevale/concepts/prismancer.jpg`.

## Common prompt core (prepend to every sheet)
"2D hand-painted fantasy game sprite sheet, side-view action RPG, the PRISMANCER: a slender hero in polished silver-chrome and pearl plate armor, short silver-lavender hair, an iridescent soap-bubble ooze cape that flows and drips in teal-purple-gold rainbow sheen, a round chrome hand-mirror buckler on the left forearm, and a belt of glowing potion vials (teal, purple, gold, orange). Consistent character in every frame, same scale, feet on one baseline, evenly spaced cells in a single horizontal row, flat pure magenta (#FF00FF) background, no shadows on the background, no text, crisp edges, painterly detail matching the reference."

## Looks (3 presets) × sheets
Looks:
1. `prismpearl` · Pearl Prismancer: silver chrome + pearl, teal-purple-gold bubble cape (the reference).
2. `prismgilt` · Gilded Alchemist: gold-washed chrome, amber/orange bubble cape, a bandolier of bubbling orange elixirs.
3. `prismtide` · Tideglass Mirror: pale chrome with teal tideglass inlays and a sea-teal bubble cape.

Sheets per look (frame counts match the existing heroes):
| file | frames | action |
|---|---|---|
| `<look>-idle.png` | 4 | breathing idle, cape bubbles drift, mirror buckler glints |
| `<look>-walk.png` | 8 | side walk facing right, cape trailing |
| `<look>-walkfront.png` | 10 | walking toward camera |
| `<look>-walkback.png` | 10 | walking away from camera |
| `<look>-attack.png` | 6 | flick a prism shard from the open hand (Prism Shard auto-attack); release on frame 4 |
| `<look>-cast.png` | 6 | raise the mirror buckler, a bubble of ooze swells from it; release on frame 4 |
| `<look>-hurt.png` | 4 | flinch back, cape splashes, vials clink |
| `<look>-gulp.png` | 6 | uncork a vial, tip head back and glug, wipe mouth (Gulp Brew) |

## Extras
- `prismancer-portrait.png`: 512×512 bust for the HUD portrait and the character select cards (pearl look). The HUD portrait currently still shows the old mage face.
- `pet-prismancer-baby.png`, `-grown.png`, `-evolved.png`: the Bubblet line (a pearly jelly bubble with a chrome glint and a tiny face; grown adds orbiting mini-bubbles; evolved is the Mirrorgel Orb with a chrome halo). Same layout as `art/ooze/pet-gelguard-*.png`.
- Skill icons (256×256, painted, dark iron/bronze ring frame like the current icons): Bounce Bolt, Bubble Ward, Gulp Brew, Mirror Gel, Refraction Nova, Prism Cascade.
