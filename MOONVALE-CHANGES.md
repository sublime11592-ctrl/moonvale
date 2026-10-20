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

## Solid heroes, 4-direction walking, attack/cast sheets (Oct 18, afternoon)
- Keying is now region-based. The backdrop is the pink connected to the sheet border, plus enclosed backdrop pockets. Every figure pixel is opaque (alpha 255). Only a 1px anti-aliased edge remains, and its colour comes from interior neighbours, so there is no pink fringe. Pinholes are filled, and magenta spill on painted glows is un-mixed. Report: `tools/alpha_report.py`, with interior partial alpha at 0 on all 24 sheets.
- Hero opacity: always 1. The only exceptions are the dodge-roll afterimages and a flicker of at most 0.6s at the start of an evade window; the old constant 0.72 during evade is gone. Evade-buff "ghosts" from cinematic.js now only draw during a real roll. Audit: `tools/alpha_audit.py`.
- Directions:
  - Sheets: walkfront for down, walkback for up, side walk for everything else (mirrored for the west half). The direction is an 8-way choice from smoothed velocity with about 11° of hysteresis, so diagonals don't flicker.
  - Frames advance by distance travelled.
  - Standing after moving up shows walkback frame 1 with a slight breathing motion.
  - Frame order for walkfront and walkback is the shortest closed tour of leg-pose change; the painted order is kept when it is within 10%.
- Attack and cast sheets:
  - Effects are grouped with their figure by frame slot, not by connectivity. Figures are the solid bodies left after a morphological opening.
  - Scale uses the upright frames.
  - The impact or release key frame and a per-frame emit point (staff crystal, flame, palm) are detected and stored in anim.json; `EMIT_OVERRIDE` allows hand fixes.
  - Timing:
    - Warrior melee: impact at 48% of weaponAttack, where the damage resolves.
    - Staff basic attacks: the projectile is held back through the wind-up and spawned on the impact frame.
    - Spells: the wind-up frames span cinematic.pending, and the release frame shows when releaseSpell fires.
  - Projectiles, the charge glow and a release flare all come from the emit point, mirrored with facing. Heroes face the target and use the side sheets even when attacking up or down.

## Joystick fix + painted-hero creator (Oct 18)
- **Joystick (moonvale-input.js, new):** the movement stick now uses native touch events (tracked by touch identifier, `preventDefault` on `touchstart`) on touch devices and pointer events for mouse/pen, with move/end listened on `window`. It releases only for the tracked contact, uses an analog throw scaled to the stick size with a 10% dead zone, and has a 16px larger invisible hit ring. The old game.js handler was pointer-only (`setPointerCapture`) and released on *any* `pointercancel`/`lostpointercapture` without checking the pointer. Nothing disabled the browser's own touch gestures on the stick (no `touchstart` preventDefault, no `user-select:none`/`-webkit-touch-callout:none`, zoomable page). On a phone any system gesture would cancel the pointer and zero the stick.
- CSS (moonvale-hud.css): stick children are `pointer-events:none`; there is no selection/callout on the HUD controls; `touch-action:manipulation` is set on skill, potion, auto and nav buttons.
- **Creator (moonvale-creator.js/.css, new):** a single painted-hero screen inside #classDialog.
  - It shows a live preview from art/anim (idle → walk → attack/cast loop; tap the hero or use the Idle/Walk/Attack/Cast buttons; swipe or arrows to change hero), with a staff-tip flare on the key frame.
  - Heroes: Warden (Druid), Sentinel (Warrior), Embermage and Frostcaller (Spellweaver). Ranger is shown as "Coming soon" (no painted art).
  - The screen shows the class, role, description, and the 5 signature spells with their icons (tap to read).
  - Options kept: Name, Aura (a glow drawn around the real sprite in game, via the same draw call), Heritage (racial ability, labelled as not changing the look). The old appearance presets are gone (the painted hero always overrode them).
  - The old creator stays hidden in the DOM; the screen calls the existing `enter()` chain so saves are unchanged. `customHero.paint` and `customHero.accent` persist through save/load.
- **Bug fixed:** Frostcaller was unreachable for real players. heroFor() checked `race==='dwarf'`, but the selectable race id is `mountaindwarves`. Spellweavers now pick Embermage/Frostcaller explicitly; old saves fall back to any *dwarf* race → Frostcaller.
- Tests: tools/joy_verify.py (real CDP touch, 8 directions, analog, decorations, rim, long press, mouse, two fingers, touch taps on skills/attack), tools/creator_test.py (touch end-to-end, persistence, camp re-open). check_round.py now also checks the creator.

## Ship-polish pass (Oct 18, evening)
New files (all loaded last, legacy ids/flows kept):
- `moonvale-title.js` / `moonvale-title.css` — boot screen hand-off (`#mvBoot` in index.html; hides on DOMContentLoaded + title art decoded + fonts, 10 s hard fallback), painted title (`art/title-a.webp`, portrait hero+moon window over a blurred cover backdrop, drift + mouse/tilt parallax, canvas fireflies, gold Cinzel logo), buttons Begin Adventure / Continue (only with a save) / Settings, Settings dialog (music, effects, reduced motion — persisted in `localStorage['moonvale-prefs']`; Saves & backups, Controls & guide), Chapter I prologue (`art/title-b.webp`) for fresh heroes, fade-from-black veil into the world and on Continue.
- `moonvale-theme.css` — shared theme: `.mv-btn`, `.mv-btn-gold`, `.mv-kicker`, `.mv-toggle`; every dialog/panel, close button, pause overlay and toast restyled to the creator look.
- `moonvale-ship.js` — NPC talk sheet (`#mvTalk`: Vale / Lantern board, accept + turn-in), "You have fallen" screen (`#mvFallen`), Hero sheet (`#mvHero`, Hero tab + portrait), non-blocking level-up banner, removal of stale UI (starter-preset button, false "visible gear" copy, disabled contract stub, PRE-RELEASE kicker).
- `moonvale-walk.js` v2 — walk masks for camp, chapel and marsh; blocked portals and objectives relocated to open ground; hero/mobs nudged out of blocked spots.
- `moonvale-hud.js` v3 — Vale no longer follows into other zones (Lantern board instead), NPC labels anchored to the feet (Bran).
Tools: `tools/ship_survey2.py`, `first_run.py`, `overflow_check.py`, `reach_check.py`, `walk_overlay.py`, `title_shot.py`.
- `moonvale-buttons.css` + `art/ui/*.png` (generated by `tools/make_ui.py`, 160 KB, pixel art at 2x) — painted button kit replacing every gold-fill button/selected state: blackened-iron plates with midnight-blue enamel, antique-bronze filigree, moonstone end gems, diamond studs and faint runes (hover = moonlight glow + lit runes, pressed = darker/inset, selected = teal-silver #7fe3d6→#bff5ee glow + sparkles, disabled = grey iron); larger pulsing plate for Begin Adventure / Enter Moonvale / primary actions; square 9-slice tabs for segments, tiles, menu grid and filters; bronze socket rings for spell icons and close buttons; round bronze arrow buttons; filigree panel corners with moonstones; crescent-medallion divider; teal toggles. Before/after: `shots/ship/buttons-before-after.png`.

## Glow & jelly pass (taste: glow, teal/purple/gold/silver, translucent slime)
- `moonvale-glow.js` (new, loaded after moonvale-ship.js): one additive overlay layer, all pre-rendered sprites (no per-frame gradients or shadowBlur).
  - Glowing mushroom clusters (teal/purple, 3 variants, soft pulse) placed on walk-mask fringes in grove and marsh zones; 12–18 per zone, seeded so they never move.
  - Flickering warm lantern glows on the Elder Grove's lanterns and camp fire; painted mushrooms glow too.
  - Floating teal/purple/gold motes (16 on phones, 28 on desktop, none with Reduced motion).
  - Silver chrome glint on dropped loot; chrome ring and sweep on loot-feed icons, silver text for item drops.
  - Jelly slimes: new art `art/enemy-jelly.png` (translucent body, violet core, bubbles, gloss), plus live squash-and-stretch wobble, rising bubbles, fading drip trail and a soft halo (halo is desktop-only).
- Performance: culling to the viewport, phone-lite mode (fewer motes, no secondary lamp cores, no slime halo) and an auto-degrade that drops lamp and cluster glows if frames average below ~30 fps for 3 s. `MV_NOGLOW=true` in the console disables the whole layer.
- Fix: dialog close buttons are pinned to the top of their sheet (the Bag's × sat below the fold on phones, leaving no visible way out without Escape).

## Oozevale, phase 1 (Oct 18, night): slime takeover
The game is now **Oozevale** everywhere it shows: page title, boot screen, header, title screen, settings, release/story/HUD text. Until the painted logo is imported, the title uses a CSS slime logo (teal-to-violet jelly letters with gold edges and slow drips).
Three classes can be played. The two spellweavers show as locked "coming soon" cards and can't be picked, but old mage saves still load.

| Class (slot) | Kit | Presets (looks) | Pet line |
|---|---|---|---|
| **Gelguard** (warrior) | Gelbreaker, Ooze Cyclone, Jelly Bash, Slime Surge, Gel Bulwark. Every hit splashes ooze | **Chrome Ooze Knight** ✔, Tidemane (sheets made, needs import), Gilded Gloop (not painted) | Bulwark Blob: Blobling → Bulwark Blob (lv 10) → Gel Golem (lv 25) |
| **Sporecaller** (druid) | Spore Burst, Mycelium Snare, Glowcap Mend, Sporefall, Cap Shell; Spores resource, Glowcap Grove signature | **Glowcap Witch** ✔, Mossmother (not painted), Ambercap (not painted) | Capslime: Sporeling → Capslime → Elder Shroomgel |
| **Slimewright** (ranger) | Acid Glob, **Summon Jellies**, **Gloop Command**, Slime Slip, Feeding Frenzy; Ooze resource, Gelspike Lance signature | **Hooded Oozeseer** ✔, Chrome Veil (not painted), Lanternhood (not painted) | Jelly Familiar: Gloomlet → Jelly Familiar → Void Gelwyrm |

✔ = can be picked now. The preset-1 looks come from the user's own concept sheet (`art-src/ooze/user-favorites.jpg`, cut by `tools/ooze_looks.py`).

New files:
- `oozevale.js`
  - `MoonSlime`: slime presets teal, amethyst, ember, gold and chrome. The recolour runs at runtime and only touches each look's slime hue band (`SPEC`), so plate, cloth and faces stay put. It covers frame sheets and stills alike, and the result is cached.
  - `MoonLooks`: the 3×3 preset registry. A look can be picked only when its art is in the build.
  - `MoonPet`: one pet line per class. AI rules:
    - It only fights what you fight.
    - It defends you if you are AFK and something hits you.
    - It stops and follows when you run.
    - It stays leashed with spring-damped catch-up.
    - It auto-loots into a stash you can sort, sell or keep. The items glint inside the jelly, and the stash saves with the adventure.
    - Pounce support for Gloop Command.
  - Also holds the class renames and kits, identity text and gear names.
- `oozevale-kits.js` (loaded last)
  - Slimewright jellylings: 2, or 3 from level 10, for 13 s, at most 5 out. They stay leashed to you and attack your target or whatever is hitting you.
  - Gloop Command pounces with a 2 s glue. With no slimes out, an orb lash replaces it.
  - The Slimewright fires jelly globs, not arrows.
  - Looks without frame sheets cast from the painted staff tip or palm orb (`art/ooze/looks.js`).
- `oozevale.css`: logo, look chips, slime swatches, pet card, pet stash, and hero-sheet button wrap.
- `art/hero-chromeknight.png`, `hero-glowcap.png`, `hero-oozeseer.png`, `art/ooze/looks.js`
- `tools/ooze_looks.py`, `tools/ooze_import.py` (generated art → assets), `tools/ooze_test.py`, `tools/ooze_shots.py`

Changed files:
- `moonvale-creator.js`: class tiles, a row of 3 look chips, slime colour and companion card (species, evolution line, name, jelly colour). Arrows and swipe step through every look. Stills get transform-based idle, walk, attack and cast in the preview.
- `moonvale-art.js`: `heroFor` resolves the saved look and tints frames. Spell icons updated.
- `moonvale-motion.js`: tint hook and staff-tip emit for the new looks.
- `moonvale-title.js`: Oozevale logo and title art from `OOZE_ART` when present.
- `moonvale-ship.js`: new names.
- `moonvale-buttons.css`: look chips are excluded from the painted button kit.
- `tools/process_anim.py`: per-character runs, frame overrides, and no purple de-spill on heroes that wear purple or on green keys.
- `tools/creator_test.py`, `tools/enter.py`: moved to the new classes.

Art pipeline: the frame sheets for all three preset-1 looks, plus the Tidemane sheets and the pets, were generated but sit outside the box. Copy them into `art-src/ooze/incoming/` and run `python3 tools/ooze_import.py`. It processes the sheets, writes `anim.js`, `manifest.js` and `ooze-art.js`, and cache-busts them. Then re-run `python3 tools/ooze_shots.py`. Until then the preset-1 looks play as painted stills with rigid motion: bob, lean, lunge, cast lift, and the same front image for every direction.

## Oozevale, phase 1b (Oct 18, late): all 9 looks animated, joystick root cause, juice + design must-fixes
**Joystick.** Root cause: `body.mv-ui2 .touch-stick{display:none!important}` sat inside `@media(min-width:900px)`. So on any touch device at least 900 CSS px wide the stick was hidden and nothing was steering it: iPad, Pro Max landscape (932), and iPhone "Request Desktop Website" (980). On top of that, the stick depended on whichever element iOS hit-tested.
Fix:
- `moonvale-input.js` v2: a document-level capture `touchstart` decides by the touch point.
  - Inside the stick plus 24 px, the fixed stick takes the touch.
  - Anywhere else on the left half of the field, a floating stick (`#stick.mv-floating`) appears under the thumb.
  - HUD buttons, dialogs and pause are ignored.
- `moonvale-hud.css` v4: the stick is always shown on touch devices (`body.mv-touch`, `any-pointer:coarse`).
- Verified with CDP touch (`tools/joy_final.py`) at 390×844, 932×430 and 1024×768, after both New game and Continue, plus WebKit (`tools/joy_wk.py`).

**Looks.** All 9 presets have full drawn sheets (idle, walk side, walkfront, walkback, attack, cast) and stills, and all of them can be picked:
- Gelguard: Chrome Ooze Knight, Tidemane, Gilded Gloop.
- Sporecaller: Glowcap Witch, Mossmother, Ambercap.
- Slimewright: Hooded Oozeseer, Chrome Veil, Lanternhood.

`MoonLooks` only lets you pick a look when every one of the 6 sheets exists with more than 1 frame. Tidemane wears the user's pick: a translucent teal jelly hood over a dark iron half-mask, with no mane.

**`oozevale-juice.js`** (new, loaded last; spec `design/juice.md`):
- Sound:
  - `sweep` / `noiseHit` synth and an 18-cue SFX table: squelch, hit, jellyHit, crit, kill, multikill, hurt, heartbeat, summon, pounce, slurp, lootRare, lootEpic, signature, levelUp, evolve, uiTap, uiDeny.
  - Every cue gets ±6 % pitch and ±1.5 dB gain jitter, with per-key cooldowns.
  - A compressor sits on `soundBus`.
  - The pet's `sfx('hit')` now makes a sound.
- Hit-stop: a freeze-then-ease curve, at most 180 ms, merged by taking the max.
- Shake: the trauma model (trauma² × 10 px) drives `cinematic.shake`. Ooze Quake adds 0.55 trauma; it used to be a 0.2 px wobble.
- Splats and puddles:
  - Droplets bounce once and leave puddles that last 4 s, with at most 60 at a time.
  - Kills, crits and skills each have their own splats.
  - The Cyclone throws tangential bands; the Quake leaves a ring of puddles and a slime-hex shock ring.
- Damage feedback:
  - A red vignette on taking damage, plus a low-HP pulse and heartbeat.
  - Damage numbers are tagged by source: player, crit, pet, jellyling (merged), DoT, heal and words. They stack in lanes, with at most 14 on screen.
  - "SPLAT ×3" multi-kill callout. `drawText` in `moonvale-world.js` reads the tags.
- Level-up beat: a flash, a gold ring, a column of rising droplets and a soft knock-back.
- Pet evolution: a 2.2 s cinematic with a dim, a jelly cocoon, a white flash, a splat and a name card with the new ability. Mobs freeze for its duration.
- Loot: beams for uncommon, rare and epic drops, and a slurp-in when the pet swallows loot.
- Pet and summon hits never shake the screen or stop time. Reduced motion scales everything down.

**Design must-fixes** (`design/review.md`, `classes.md`):
- Summon Jellies is self-cast: with no target in range, the jellies orbit you.
- Ooze is now earned by fighting: +4 per jellyling or familiar hit, +10 per Acid Glob hit, +8/s standing still, and moving never drains it.
- Gelguard:
  - Its resource is **Gel** and its signature is **Ooze Quake** (short label "Quake").
  - All Rage, Earthbreaker, Whirlwind, Focus and "lunar" text is gone.
  - At 60+ Gel it gains +2 armor.
  - Gelbreaker grants +10 Gel.
  - The Cyclone pulls foes in, slows them, and spreads the goo coat.
  - Jelly Bash now stuns for 1.5 s, then roots for 1.5 s.
- Skill unlocks are `[1,1,2,4,6]`. The arrays are reordered so the combo partner sits in slot 3: Gelguard Slime Surge, Slimewright Gloop Command (Frenzy is slot 4, Slip slot 5). `originalSkills` is refreshed to match.
- The XP curve is `55+35(L-1)+6(L-1)²`, so level 10 takes about 1,800 XP instead of about 4,060.
- Loot names are class-themed with rarity prefixes (Murky, Glossy, Glowing, Radiant). The ring is included. No more Longbow, Runeblade or Moonstaff, and old items are renamed on load.
- Pet loot vacuum: the pet no longer waits for you to stand still. It reaches up to 220 px and starts as soon as no aggro foe is within 200.
- Pet milestones: a trick at lv3, a bond at lv5 (stash +4, fetches gold within 220), tiers at lv15 and lv20, and evolutions at lv10 and lv25. Each pet line has 3 abilities:
  - Gelguard: Bodyblock, Jelly Taunt, and Golem Slam plus its ward.
  - Sporecaller: Spore Puff (a 4 s rot), Glowcap Snack, and Twin Grove plus a root.
  - Slimewright: Lead the Swarm (+15 %), Bud (a free jelly every 15 s), and Void Maw.
  - Also added: Brood Bond, Rooted in Rot, and Feeding Frenzy, whose marked foe bursts a jellyling when it dies.

Not touched: `moonvale-glow.js` and the zone art; the environment worker owns them.
Tests: `tools/juice_test.py` (new), `tools/ooze_test.py`, `tools/creator_test.py` and `tools/joy_final.py`.

## Environment repaint (Oct 18, night): ooze-world zones, walk masks, living FX

**Zones repainted** (new painted maps in `art/env/`, ~270–640 KB webp each):
- 0 The Elder Grove / lantern camp (`zone-camp.webp`, 1800×1200)
- 1 Moonwater Reach (`zone-moonwater.webp`): teal ooze pools, jelly waterfalls, bridge
- 9 Briarbrook Orchards (`zone-briarbrook.webp`, 3000×2000 drawn at 3600×2400): amber honey-ooze ponds, lantern paths
- 2 Hollow Sanctum (`zone-sanctum.webp`): purple jelly falls, crystal ruins
- 5 Duskfen Marsh (`zone-duskfen.webp`): teal bog pools, boardwalks, glow-mushrooms
- 10 Amberleaf Woods (`zone-amberleaf.webp`, frontier 3600×2400): amber pools, waystone arch

**New runtime: `oozevale-world.js`** (one script tag after `oozevale-kits.js`; `?noart` disables it).
- Loads `art/env/env-data.js` (masks, FX and lighting profile per zone; about 28 KB). It lazy-loads the current zone image first, then neighbour zones when the browser is idle. A zone switches to new art only once its image is decoded and the world size matches.
- **Walk masks:** 1-bit grids (10 px cells for story zones, 20 px for frontier zones) wrap `blocked()`. Portals, objective and expansion points, quest givers and destinations that land on blocked ground move to the nearest walkable cell. The hero, mobs and residents are settled out of blocked cells when a zone is shown and every 1.5 s. All six zones pass `reach_check` (bad=[]).
- **FX:**
  - Ground layer: caustic shimmer on pools, ripples, rising bubbles, scrolling jelly waterfalls.
  - Top layer, drawn after night lighting: light shafts, lantern flicker and glow pulses, slime drips (bead, fall, splat), drifting spores.
  - All sprites are pre-rendered and only drawn when on screen. There are 3 quality levels:
    - Phones and small screens get fewer bubbles and spores, and no shafts.
    - The level drops on its own when frame rate stays under 30 fps for 3 s.
    - The level drops to 0 when MoonGlow degrades.
  - Reduced motion (`mv-calm` or `prefers-reduced-motion`) leaves only still glows.
- **Emissive slime (design review M1):** hero and pet slime no longer turn grey at night. The hero's draw calls are recorded, then the slime-coloured pixels (hero and pet hue bands, plus chrome highlights) are replayed additively after the lighting pass, with a soft halo. Turn it off with `MV_NOGLOW` / `MV_NOEMIT`.
- Repainted zones get a lighter night profile (dark ≤ .24) so the painting reads. `MoonLights.find` returns the painted lantern and mushroom lights for these maps.
- `moonvale-glow.js` v6: the procedural mushroom clusters and the hard-coded zone-0 lamps are skipped in repainted zones, because the painting already has them.

**Pipeline (tools/):**
- `env_guide.py` renders a layout guide from the zone data.
- The guide drives the generated painting. `env_fetch.py` picks the right output by matching it against the guide.
- `env_build.py` does the 4× ESRGAN upscale, webp encode, mask build (colour segmentation plus hand overrides from `env_spec.py`), FX/light extraction and the cache-hash bump.
- `env_shots.py`, `env_tour.py` and `env_fps.py` produce the QA shots and FPS numbers.
- Source art lives in `art-src/env/`.

**Known gaps:**
- Old `art/zone-*.webp` entries in `art/manifest.js` still preload (~1.6 MB wasted). Not removed, to keep the manifest untouched.
- The minimap and world-map thumbnails still show the old paintings.
- Props in frontier and realm maps are large for the 3600-wide world.
- Briarbrook fences are walkable.
- Painted portal rings may sit a little off the relocated portal points.
- Zones 3, 4, 6, 7, 8, 11–24 are not repainted yet.

**Smart cast (all classes, melee too)** in `oozevale-juice.js`:
- When you press an ability and have no valid target, the game selects the closest living foe within max(440, the ability's range + 220). That foe stays selected.
- If it is out of the ability's range, the hero walks toward it and casts the moment it is in range. For melee skills that is melee range.
- While the hero approaches, a dashed range ring in the slime colour shows around them. Every selected target gets a clear gold ring with orbiting ticks at its feet.
- Touching the joystick (fixed or floating) or any movement key cancels the approach. The approach also gives up if the foe dies, you pick another target, you stop making progress for 1.2 s, or 6 s pass.
- Self-cast and around-self abilities fire at once with no target: shields, heals, Ooze Cyclone, Slime Slip and Summon Jellies.
- Pets join the new fight under their existing rules.
- Test: `tools/autotarget_test.py` covers phone (390×844, CDP touch on the hotbar and stick) and desktop (1280×800, number keys and arrow keys). The per-class GIFs open with a smart cast.

**Fixes:**
- Hit-stop never feeds `dt=0` into the update any more. Motion code divided by it, which turned the camera into NaN; `MoonCamera` now also recovers from a non-finite value.
- Preloads:
  - `art/title-a.webp` is no longer preloaded; the title uses `art/ooze/title-ooze.webp`.
  - `moonvale-art.js` skips the old zone images for the repainted zones 0, 1, 2, 5, 9 and 10 (about 1.6 MB), unless `?noart` or `?classic_env` is set.
  - The creator backdrops use the new `art/env/` maps.

## Environment repaint, pass 2 (Oct 18, late night)

**New zones repainted:**
- 3 Sunmeadow Downs: golden wheat paths, teal ooze ponds, six stone portal arches.
- 4 Frostpine Vale: snow plazas, icy-teal pools, a frozen purple jelly fall.
- 19 Windmere Plains: windmill roads and teal ponds.
- 13 Roseveil Gardens: rose-hedge paths and teal/pink jelly fountains.
- Bonus: 6 Tideglass Coast (sea-ooze tide pools, coral arches) and 14 Mooncap Hollow (giant glowing mushrooms, mushroom-house doors).

Twelve zones now use `art/env/`.

**Fixes:**
- **World map:** repainted regions show a 480×320 thumbnail of the new painting (`art/env/thumb-*.webp`, about 20–40 KB each). `oozevale-world.js` wraps `openWorld`. The minimap already draws the current zone art, so it shows the new paintings once they load.
- **Briarbrook fences block:** the walk mask covers only the painted dirt roads and clearings. Fences, hedges and orchard grass are blocked. The spawn by the cottage connects to the campfire road.
- **Portals line up with the paintings:**
  - Painted guide-marker rings were clone-stamped out of the Moonwater, Sanctum and Duskfen sources (`tools/env_rings.py` plus manual offsets).
  - Portals are nudged onto painted arches and doors with per-zone `moves`: zone 0 Briarbrook shrine, zone 2 alcove, zone 5 arch and hut door, zone 13 rose arch, zone 14 mushroom doors.
  - The new zones were painted with arches at the real portal slots.
- **Zone 0 at night:** lighter night profile (dark .15) plus a tone lift baked into the painting (gamma .8, gain 1.08).

**Tools:**
- `env_build.py` caches upscales in `art-src/env/up/`, has a `tone` option, merges `env-data.js` under a lock, and writes thumbnails.
- `env_ba.py` makes the before/after and contact sheets.
- `env_portals.py` and `env_rings.py` are new.
- `reach_check.py` now also checks quest givers, landmarks and the quest destination.
