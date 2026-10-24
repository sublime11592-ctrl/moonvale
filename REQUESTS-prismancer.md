# Prismancer art requests (v3: approved hybrid look)

> **Status (Oct 23, 9:46 PM PT):** the user APPROVED `/workspace/oozevale/concepts/prismancer-hybrid.jpg` as the official look (in-game copies: `art/prismancer/reference-hybrid.jpg`, and `portrait-hybrid.png` for the creator card). It combines pearl-glass and gold armor, long rose-gold wavy hair, a bubble cape, a brass blaster and a hip potion tank. The 8 core `prismpearl` sheets in this look landed at 9:48 PM and are ingested (`prism_ingest.py prismpearl real`; the amber puddle under the feet is masked out on attack and hurt). The earlier gunner sheets were placeholders (moved to `old-gunner/`).

## Prompt core (use in every sheet)
"Oozevale painted fantasy sprite, the PRISMANCER: a female potion-punk gunslinger in **pearl-glass and gold armor** (iridescent pearl plates with gold filigree trim), **long rose-gold wavy hair**, a translucent **bubble cape** trailing soap bubbles, a **brass bubble-blaster rifle** fed by a tube from a **glowing potion tank on her hip**, gold-ooze drips, tall gold-buckled boots, iridescent bubbles drifting off the muzzle. Soft painted cel shading with glowing highlights, matching the Oozevale art. Flat pure magenta #FF00FF background, no ground shadow or puddle, one row of evenly spaced frames on one baseline, the same scale in every frame."

## Looks (same ids and filenames as now)
| id | name | palette |
|---|---|---|
| `prismpearl` | Prismancer (base) | the reference colours: teal/pink/gold hair, brown leather, brass, pink-violet potion tank |
| `prismpearl` | Prismancer (base) | the approved hybrid: pearl-glass plates, gold trim, rose-gold hair, bubble cape, brass blaster, pink-violet hip tank |
| `prismtide` | Tideglass Mirror | sea-teal: teal and silver hair, tideglass-green leather, chrome-silver gun, teal potion tank |

## Sheets: 8 per look (what Image Creator is painting)
File: `art-src/ooze/incoming/prismancer/<id>-<sheet>.png`. Side views face **right**, with the gun held in the forward hand so the muzzle leads. Keep the gun on the **same hand in every side sheet**: don't mirror single sheets.

| sheet | frames | content |
|---|---|---|
| idle | 4 | three-quarter view, rifle resting, tank glowing, bubbles drifting |
| walk | 8 | side, walking right, rifle at the hip |
| walkfront | 8–10 | pure front view walking toward the camera |
| walkback | 8–10 | pure back view (hair, tank and tube visible) |
| attack | 6 | **gun shot**: raise and aim, fire (muzzle flash and bubble bolt leaving the muzzle on frame 3), recoil kick, settle |
| cast | 6 | **charged gun shot**: aim, tank glows and the tube fills with light, big prismatic blast from the muzzle, recoil |
| hurt | 4 | side, recoil from a hit |
| gulp | 6 | drinks a vial from the bandolier (no gun shot; rifle lowered) |

The muzzle point is computed per frame from these sheets. Please keep the muzzle tip clearly visible (not covered by bubbles or hair) on the fire frames.

### Optional extra gun animations (nice to have, same rules)
| sheet | frames | use |
|---|---|---|
| aim | 4 | hold aim (channelled spells) |
| shoot | 4 | quick auto-fire shot |
| recoil | 3 | heavy shot kick (Refraction Nova / Prism Cascade) |
| reload | 6 | pump the rifle and swap the potion tank |
| grenade | 6 | pull a potion grenade off the bandolier and lob it (Alchemist "Potion Grenade" talent) |

## Spells and the gun (for reference while painting)
Prism Shard (auto-shot), Bounce Bolt, Bubble Ward (a bubble shot that wraps her), Mirror Gel (reflected shards fly out of the muzzle), Refraction Nova and Prism Cascade all **fire from the blaster**. Gulp Brew is a drink from a vial. The Alchemist tree's Potion Grenade throws a bandolier grenade.

## Talent tree weapon variants (talent skins)
- **Mirrorwall:** a mirrored blunderbuss shield-gun (a chrome tower-mirror shield with a short flared brass blunderbuss built in).
- **Alchemist:** a long brass blaster rifle with a large orange potion tank and longer feed tube.

Deliver these as extra `attack` + `cast` sheets per look: `<id>-mirrorwall-attack.png`, `<id>-alchemist-cast.png`, etc. Until then the game draws overlays.

## Also needed
- **HUD portrait** per look: 512×512, head and shoulders with the goggles and hair (the HUD still shows the old mage face).
- **Pet Bubblet** (brass-capped bubble slime with a tiny potion cork): baby / grown / evolved, 6-frame idle + hop each, magenta background.
- **Skill icons** (128×128, bronze-rim sockets): Bounce Bolt, Bubble Ward, Gulp Brew, Mirror Gel, Refraction Nova, Prism Shard, Prism Cascade, Potion Grenade, Volatile Vial, Mirrorwall, Prism Bastion.
