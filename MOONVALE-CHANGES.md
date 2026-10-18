# Moonvale – improved build

Static site. Serve this folder as-is (e.g. `python3 -m http.server`). Saves use the same
localStorage keys as before (`moonvale.adventure.v2`, `moonvale-hud`), so existing saves load.

## New files (loaded last in index.html)
- `moonvale-motion.js` – one character motion system. Replaces the old layered rigs
  (strip-sliced legs in animation.js / cartoon-motion.js, the triangle-mesh warp in
  jointed-motion.js, and the cut-out arm in warrior-motion.js). Each sprite is drawn as a single rigid image at its
  real aspect ratio. Motion comes from eased whole-body transforms: idle breathing, walk/run bounce
  with a foot-contact squash and a lean, attack windup → strike → recovery, a dodge roll with
  afterimages, a hit knock-back with a white flash, and a death topple and fade. It also adds soft ground shadows.
- `moonvale-world.js` – sharp canvas (backing store = CSS size × devicePixelRatio), smooth camera
  with look-ahead, per-zone atmosphere profiles (palette, multiply night lighting with light
  sources detected from the painted map, fog layers, weather/particles, foreground canopy),
  in-game clock with day/night, zone banner and fade on travel, ambient Web Audio,
  hit-stop, kill bursts, screen shake, and pop-in damage numbers. Fog switches off automatically on slow devices (add `?hq` to the URL to keep it on).
- `moonvale-hud.css` / `moonvale-hud.js` – ornate portrait-first HUD: portrait frame with
  HP/MP/XP, currency pills, round minimap with zone plate + clock, quest panel, ornate joystick,
  radial skill cluster, chat line and a 6-button bottom nav. It reuses the game's own elements and ids.
- `moonvale-art.js` (+ `art/manifest.js`) – optional painted art pack: zone maps, hero/enemy/NPC sprites and round
  icons. Only included once `tools/process_art.py` has produced the assets.

## Edits to existing files
- `index.html` – removed the Cloudflare challenge loader (404 + console error off-host), added the new files.
- `cinematic.js` – smooth camera hook, removed old fog/pollen/vignette/text pass (moved to world pass),
  DPR fix.
- `epic-atmosphere.js` – removed its duplicate weather/lighting pass and arrival banner (now one pass).
- `class-journey.js` – bug fix: only the mage starter sheets exist on the host, so choosing
  Warrior/Ranger/Druid left the creator stuck on "Preparing your hero…". Those classes now use the
  race's starter body with the class weapon drawn on top (set `MOONVALE_CLASS_SHEETS` when more sheets ship).

## Painted art pack (art/, built by tools/process_art.py from art-src/)
- **Sprites**: the hero, NPC and enemy sheets are keyed against their own magenta backdrop, with a soft matte and despill
  limited to a 2px edge band, so purple robes keep their colour and there's no pink fringe. Figures are cut out
  by connected components. Touching figures are split by morphological opening. Sparks near a figure stay with it.
  The Warrior's sword, which overlaps the Embermage's robe, is given back to the Warrior by a small hand-placed
  override. Sprites keep their true aspect ratio (max 380px tall) and are never stretched.
- **Heroes**: Druid → Warden, Sentinel → Warrior, Spellweaver → Embermage (Frostcaller for dwarves). The back view
  comes from heroes-back.jpg and the side views are mirrored. Rangers keep the original sprite.
- **NPCs**: Vale → lantern keeper, Bran → ranger, Eryn → bard, Tessa → goblin quartermaster.
  Hub NPCs in the marsh → swamp witch; in the chapel → lantern keeper.
- **Enemies**: slime, boar, boss, and wisp (marsh); chapel wisps become the blue wraith.
- **Zones**:
  - The camp painting is set into the original Elder Grove map around the campfire at character scale, feathered into the forest.
  - Hollow Sanctum and Duskfen Marsh use their paintings as the full map.
- **Icons**: a 5×4 round icon sheet. Each class's 5 skills map to the closest painting.
- Add `?classic` to keep the original character sprites, or `?noart` to turn the whole pack off.
- Mobile: Mara moved closer to the fire so the skill buttons no longer cover her name.

## HUD v2 (after the four reference mockups)
- Compact portrait (name, class name in its colour, level badge, slim HP/MP bars with numbers, buff icons with timers).
- Small centred zone + clock banner; round ornate minimap (zoomed on the hero, red enemy dots, quest/NPC markers, N marker).
- Translucent quest tracker under the minimap (gold titles, checkbox objectives with counts; tap opens the journal).
- Loot feed on the left; big orange outlined damage numbers, yellow "146!" crits with a "Critical!" callout; ability name pops above the hero.
- Enemy name plates with thin red HP bars; NPC names in small coloured text with a speech bubble for quest givers.
- Ornate joystick with emblem, potion button with count, 5-skill arc with number badges and labels (5th largest),
  auto-attack as a small diamond in the arc, target/dodge as small buttons; locked skills show their dimmed icon + a tiny lock.
- Slim bottom bar: level shield, XP bar, Bag / Hero / Skills / Quests / More, plus a chat-bubble toggle.
- Removed the Trail run / Racial pills, LV placeholders, big E·Camp pill and the side button column
  (Trail run, Racial, Signature, Codex, Menu now live in "More"); interaction is a small "E" prompt over the target.
- All keyboard controls unchanged. Old HUD kept as moonvale-hud.v1.*.txt (not loaded).

## UI v2b (phone composition)
- Portrait phones: world zoom 1.27 (was 1.05, ~1.21x larger); camera keeps the hero's feet at ~62% (66% on short phones) so the body sits near mid-screen; camera may overscroll map edges, filled with a mirrored, darkened strip of the zone art.
- Camp folk spread around the fire (two rows); they stay in the Elder Grove. Vale still appears wherever she is the active quest giver.
- Compact quarter-circle skill arc and smaller joystick/potion hugging the corners; tips (#toast) become a small pill under the portrait.
- "World map" added to the More sheet (Bran's service outside the camp).

## Polish pass (ship)
- Ovals fixed: styles.css gave `.skill` `min-height:72px` (69px on phones) + `flex:1`; min-height beat our height so buttons were 50x69. Now min-height:0, aspect-ratio:1, flex:none on every round element. `tools/check_round.py` asserts |w-h|<=0.5px for all round elements at 390x844, 360x740, 430x932, 1280x800.
- Locked skills: dimmed icon + one 16px round lock glyph (no "LV n" pills). Labels one font/size, no wrap.
- Bundled OFL fonts (Cinzel, Fira Sans; fonts/ + licences) so phones match the design; canvas text uses them too.
- Player frame bars re-spaced (class name no longer touches HP bar; numbers centred; mana number not clipped); "Arcane charges 0 / 3" spacing.
- World labels: shared font + outline, clamped on-screen (portal "Road to Moonwater Reach", NPC names), hidden under the top HUD band, no orphan labels for off-screen NPCs; NPC names placed from real sprite height.
- Quest arrow only when the target is off-screen (no arrow over the hero). Camp prompt tucks under the hero's feet when standing on the fire.
- Minimap window clamped inside the world (no empty band), player arrow moves within it; drawMini guarded.
- Phone HUD nudged toward mockup sizes (portrait 56, minimap 96, joystick 98, skills 46/58).
- Dialogs, title card and inventory re-skinned to the warm dark + gold HUD language; inventory hero preview now shows the painted hero (was blank).

## Frame-by-frame hero animation (Oct 18)
- `tools/process_anim.py` turns `art-src/anim/<char>-<anim>.jpg` (pink-keyed sheets) into `art/anim/<char>-<anim>.png` + `art/anim/anim.js`:
  hue-range key, connected-component split per figure, small-hole fill, feet on a shared baseline, torso centred, one uniform scale per sheet (never stretched),
  body height (head top to feet, staffs and capes ignored) normalised to 260 px. It also measures leg motion and flags weak walks. Re-running it updates the cache-busted script tag in index.html.
- `moonvale-motion.js` frame animator (heroes with sheets):
  - Left/right: side walk sheet, mirrored for left, frame from distance travelled (118 px per cycle).
  - Standing: front idle (4 fps), mirrored toward the last side faced.
  - Up/down: idle frames with a step bob and sway until `walkback` sheets exist.
  - attack/cast/hurt sheets are picked up automatically when present. Until then the existing lunge, cast lift, knockback and flash, and roll transforms play over the current frame.
  - Size: on-screen body = the static painted hero's body, so walk, idle and static art share one height.
  - Fallback: enemies, NPCs, the ranger, classic art and `MoonMotion.disableFrames=true` keep the rigid motion.
- Checks: `tools/anim_ingame.py` (in-game capture), `tools/anim_gifs.py` (GIFs in shots/anim/).
