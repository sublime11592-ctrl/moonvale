# Race art requests

Races in the creator (race-styles.js `selectableRaces`): **Humans**, **Moon Elves**, **Goblins**, **Dwarves** (`mountaindwarves`).

**Now (code placeholders, oozevale-races.js):** each race changes the whole model:
- **Dwarf:** 80% height, 116% width, heavier gait bob, 0.95× walk speed, slower walk cycle, a braided ginger beard under the helmet.
- **Moon Elf:** 108% height, 90% width, 1.04× speed, long pointed ears through the helmet.
- **Goblin:** 74% height, 1.05× speed, quick walk cycle, big green ears and green hands.
- **Human:** the baseline.

Helmet OFF draws a placeholder race head. Real art replaces all of this.

## Deliverable: full per-race BODY sheets
For each class look × race, deliver the same sheets the game uses, as horizontal strips on a **flat magenta (#FF00FF) background**, one character per cell, evenly spaced, feet on a common baseline, facing right for side views:

| sheet | frames | notes |
|---|---|---|
| idle | 4 | front 3/4, gentle breathing |
| walk | 8 | side view, facing right |
| walkfront | 8–10 | pure front view |
| walkback | 8–10 | pure back view |
| attack | 6 | side, the class weapon swing |
| cast | 6 | side, spell release from staff/hand |
| hurt | 4 | side, recoil |

Deliver each set **twice**: `helm` (the look's helmet/hat as now) and `face` (helmet off, the race's head and hair visible). Naming: `art-src/ooze/incoming/races/<look>/<race>-<helm|face>-<sheet>.png`. I key, slice and wire them (same pipeline as tools/prism_ingest.py).

### Race direction
- **Humans:** standard proportions (as the current art), warm skin, varied hair.
- **Dwarves:** about 80% height and about 115% width, stocky and broad-shouldered, short thick legs, a big braided beard (ginger/brown/black) that shows under the helmet, heavier armour silhouette, heavy plodding gait.
- **Moon Elves:** about 108% height, slender, long pointed ears (with the helmet on: through slots in the helm), pale lavender-silver skin, silver hair, light gliding gait.
- **Goblins:** about 74% height, big head, large sideways ears, green skin on hands and face, a mischievous grin, quick bouncy steps.

### Priority (first): the 3 favourite looks × all 4 races
1. **Chrome Ooze Knight** (`chromeknight`, Gelguard)
2. **Glowcap Witch** (`glowcap`, Sporecaller)
3. **Hooded Oozeseer** (`oozeseer`, Slimewright)

That is 3 looks × 4 races × 2 head variants × 7 sheets = 168 strips. Then the remaining looks (Prismancer looks, the other Gelguard / Sporecaller / Slimewright looks).

### Prompt template
"Oozevale painted chibi-fantasy hero sprite sheet, <LOOK DESCRIPTION> as a <RACE DESCRIPTION>, <helmet on | helmet off showing the face and hair>, <SHEET> animation, <N> frames in one horizontal row, evenly spaced, same scale and baseline, <view>, flat pure magenta #FF00FF background, no shadows on the background, glowing ooze highlights, soft cel shading, matching the existing Oozevale art."

## Also: race heads for the portrait
512×512 portrait per look × race × helm/face, the same style as the current HUD portraits.
