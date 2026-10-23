# Talent skin art requests

Each tree unlocks 3 skins at 10 / 20 / 30 points. Right now every skin is a runtime recolour + glow overlay of the hero's current sheets (see `filter` in `oozevale-talents.js`). Real art replaces them 1:1.

**Drop location:** `art-src/ooze/incoming/talents/<class>/<tree>/<skin-slug>/`

**Per skin, deliver the same 8 sheets as the base look, same frame grid, size and anchor:** `idle, walk, walkfront, walkback, attack, cast, hurt` (+ `gulp` for Prismancer), each a horizontal strip on transparent PNG, plus a 512×512 `portrait.png` and a 128×128 `swatch.png` for the talent screen.

Total: 4 classes × 2 trees × 3 skins = **24 skins** (24 × 8 sheets + portraits + swatches).

## Warrior → base look `gelguard`

### Bulwark

Theme: pale steel-blue gel plate, tower-shield silhouette; tier 3 adds a hexagonal slime shield on the back and glowing cyan rivets.

- **Bulwark Steel** (10 pts) – slug `bulwark-steel`. Prompt: "Oozevale chibi hero, gelguard body and proportions unchanged, Bulwark skin tier 1 of 3: pale steel-blue gel plate, tower-shield silhouette. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Aegis Gel** (20 pts) – slug `aegis-gel`. Prompt: "Oozevale chibi hero, gelguard body and proportions unchanged, Bulwark skin tier 2 of 3: pale steel-blue gel plate, tower-shield silhouette, more ornate. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Bastion Prime** (30 pts) – slug `bastion-prime`. Prompt: "Oozevale chibi hero, gelguard body and proportions unchanged, Bulwark skin tier 3 of 3: pale steel-blue gel plate, tower-shield silhouette, more ornate, legendary glow. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."

### Ravager

Theme: rust/orange gel, spiked pauldrons, two-handed ooze cleaver; tier 2 blood-red gel, tier 3 molten magma cracks and ember drips.

- **Ravager Rust** (10 pts) – slug `ravager-rust`. Prompt: "Oozevale chibi hero, gelguard body and proportions unchanged, Ravager skin tier 1 of 3: rust/orange gel, spiked pauldrons, two-handed ooze cleaver. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Bloodgel** (20 pts) – slug `bloodgel`. Prompt: "Oozevale chibi hero, gelguard body and proportions unchanged, Ravager skin tier 2 of 3: rust/orange gel, spiked pauldrons, two-handed ooze cleaver, more ornate. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Warlord Magma** (30 pts) – slug `warlord-magma`. Prompt: "Oozevale chibi hero, gelguard body and proportions unchanged, Ravager skin tier 3 of 3: rust/orange gel, spiked pauldrons, two-handed ooze cleaver, more ornate, legendary glow. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."

## Druid → base look `sporecaller`

### Bloomwarden

Theme: fresh green and petal-pink mushroom cap, flowers growing from the shoulders; tier 3 a golden bloom crown with drifting petals.

- **Bloom Petal** (10 pts) – slug `bloom-petal`. Prompt: "Oozevale chibi hero, sporecaller body and proportions unchanged, Bloomwarden skin tier 1 of 3: fresh green and petal-pink mushroom cap, flowers growing from the shoulders. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Grovekeeper** (20 pts) – slug `grovekeeper`. Prompt: "Oozevale chibi hero, sporecaller body and proportions unchanged, Bloomwarden skin tier 2 of 3: fresh green and petal-pink mushroom cap, flowers growing from the shoulders, more ornate. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Evergreen Crown** (30 pts) – slug `evergreen-crown`. Prompt: "Oozevale chibi hero, sporecaller body and proportions unchanged, Bloomwarden skin tier 3 of 3: fresh green and petal-pink mushroom cap, flowers growing from the shoulders, more ornate, legendary glow. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."

### Rotcaller

Theme: violet and sickly-green rot fungus, moth wings of mold; tier 3 a skeletal lich-cap with glowing spore lantern.

- **Rot Moth** (10 pts) – slug `rot-moth`. Prompt: "Oozevale chibi hero, sporecaller body and proportions unchanged, Rotcaller skin tier 1 of 3: violet and sickly-green rot fungus, moth wings of mold. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Plaguecap** (20 pts) – slug `plaguecap`. Prompt: "Oozevale chibi hero, sporecaller body and proportions unchanged, Rotcaller skin tier 2 of 3: violet and sickly-green rot fungus, moth wings of mold, more ornate. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Fungal Lich** (30 pts) – slug `fungal-lich`. Prompt: "Oozevale chibi hero, sporecaller body and proportions unchanged, Rotcaller skin tier 3 of 3: violet and sickly-green rot fungus, moth wings of mold, more ornate, legendary glow. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."

## Ranger → base look `slimewright`

### Broodmother

Theme: violet translucent brood-sac robes with baby jellies clinging on; tier 3 a jelly queen crown and trailing egg-sac train.

- **Brood Silk** (10 pts) – slug `brood-silk`. Prompt: "Oozevale chibi hero, slimewright body and proportions unchanged, Broodmother skin tier 1 of 3: violet translucent brood-sac robes with baby jellies clinging on. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Hive Violet** (20 pts) – slug `hive-violet`. Prompt: "Oozevale chibi hero, slimewright body and proportions unchanged, Broodmother skin tier 2 of 3: violet translucent brood-sac robes with baby jellies clinging on, more ornate. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Queen of Jelly** (30 pts) – slug `queen-of-jelly`. Prompt: "Oozevale chibi hero, slimewright body and proportions unchanged, Broodmother skin tier 3 of 3: violet translucent brood-sac robes with baby jellies clinging on, more ornate, legendary glow. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."

### Golemsmith

Theme: amber ooze with bronze smith apron and hammer; tier 2 a glowing golem-heart core in the chest; tier 3 a full amber golem-plate exosuit.

- **Forge Amber** (10 pts) – slug `forge-amber`. Prompt: "Oozevale chibi hero, slimewright body and proportions unchanged, Golemsmith skin tier 1 of 3: amber ooze with bronze smith apron and hammer. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Golemheart** (20 pts) – slug `golemheart`. Prompt: "Oozevale chibi hero, slimewright body and proportions unchanged, Golemsmith skin tier 2 of 3: amber ooze with bronze smith apron and hammer, more ornate. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Titan Smith** (30 pts) – slug `titan-smith`. Prompt: "Oozevale chibi hero, slimewright body and proportions unchanged, Golemsmith skin tier 3 of 3: amber ooze with bronze smith apron and hammer, more ornate, legendary glow. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."

## Mage → base look `prismancer (prismpearl / prismgilt / prismtide)`

### Mirrorwall

Theme: polished silver/chrome bubble robes with mirror shards orbiting; tier 3 a prismatic mirror halo that splits light into rainbows.

- **Silvered Pearl** (10 pts) – slug `silvered-pearl`. Prompt: "Oozevale chibi hero, prismancer body and proportions unchanged, Mirrorwall skin tier 1 of 3: polished silver/chrome bubble robes with mirror shards orbiting. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Mirrorplate** (20 pts) – slug `mirrorplate`. Prompt: "Oozevale chibi hero, prismancer body and proportions unchanged, Mirrorwall skin tier 2 of 3: polished silver/chrome bubble robes with mirror shards orbiting, more ornate. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Perfect Prism** (30 pts) – slug `perfect-prism`. Prompt: "Oozevale chibi hero, prismancer body and proportions unchanged, Mirrorwall skin tier 3 of 3: polished silver/chrome bubble robes with mirror shards orbiting, more ornate, legendary glow. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."

### Alchemist

Theme: copper and orange alchemist coat with vials on a bandolier; tier 2 gilded alembic backpack; tier 3 a grand bubbling cauldron-pack with coloured fumes.

- **Copper Still** (10 pts) – slug `copper-still`. Prompt: "Oozevale chibi hero, prismancer body and proportions unchanged, Alchemist skin tier 1 of 3: copper and orange alchemist coat with vials on a bandolier. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Gilded Alembic** (20 pts) – slug `gilded-alembic`. Prompt: "Oozevale chibi hero, prismancer body and proportions unchanged, Alchemist skin tier 2 of 3: copper and orange alchemist coat with vials on a bandolier, more ornate. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."
- **Grand Alchemist** (30 pts) – slug `grand-alchemist`. Prompt: "Oozevale chibi hero, prismancer body and proportions unchanged, Alchemist skin tier 3 of 3: copper and orange alchemist coat with vials on a bandolier, more ornate, legendary glow. Same pose and frame grid as the base sheet, transparent background, soft cel shading, glowing ooze highlights."

## Also helpful (optional)

- Minion sprites (currently procedural canvas drawings): **Forge Golem** (giant amber ooze golem: idle/walk/attack/smash, 4–6 frames each, about 2.5× hero height) and **Fungal Zombie** (violet-capped mushroom zombie: rise/walk/attack/die).
- Talent node icons: 72 icons (9 per tree × 8 trees), 128×128, bronze-rimmed round sockets, diamond sockets for the ◆ key nodes.

## Tree weapons (now: procedural overlays drawn in oozevale-talents.js `weapon()`)

The weapon follows the locked tree, in game and in the talent screen. Real art replaces the overlay: for each class look, deliver the hero sheets (idle, walk ×3 directions, attack, cast, hurt) holding the tree weapon. Alternatively, deliver a separate weapon sprite (side + front + back, 512 px tall, magenta background) plus a per-frame hand anchor, and I will attach it.

| Class | Tree | Weapon | Prompt seed |
|---|---|---|---|
| Gelguard | Ravager | two-handed ooze greatsword / greataxe, orange-red molten gel blade | "huge two-handed greatsword of glowing orange ooze, bronze crossguard, dripping gel; wide heavy swings" |
| Gelguard | Bulwark | sword + tower shield | "steel-blue gel tower shield with a bronze rim and a cyan slime boss, short sword" |
| Sporecaller | Bloomwarden | blossom staff | "twisted wood staff crowned with pink glowing blossoms and leaves" |
| Sporecaller | Rotcaller | rotting spore scythe | "dark staff with a violet fungal scythe blade shedding green spores" |
| Slimewright | Broodmother | hive staff | "staff topped with a translucent violet brood hive, baby jellies clinging" |
| Slimewright | Golemsmith | forge hammer / gauntlet | "amber ooze forge hammer with a bronze-banded head" (or a big amber gel gauntlet) |
| Prismancer | Mirrorwall | mirror tower shield | "tall chrome mirror tower shield with a gold frame and reflected light streaks" |
| Prismancer | Alchemist | flask-launcher staff | "copper staff holding an orange glowing flask in a cradle, vials on the shaft" |

Attack sheets for Ravager should have wider swing arcs (the overlay adds a wide orange swing trail for now).

## Talent Keeper NPC
- A hooded keeper with a glowing teal lantern-staff, standing at each hub camp. Deliver idle (4 frames, front 3/4), magenta background, and a 512×512 portrait.
