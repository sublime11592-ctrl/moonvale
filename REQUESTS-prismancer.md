# Prismancer art requests (v2: potion-punk gunslinger alchemist)

> **Status (Oct 23):** redesign approved. Reference: `/workspace/oozevale/concepts/prismancer.jpg` (front / three-quarter / back turnaround). The old pearl-knight concept is in `concepts/v1/`, and the old pearl sheets are in `art-src/ooze/incoming/prismancer/old-pearl/` (they stay live in game until the new sheets land; do not reuse them).

## Prompt core (use in every sheet)
"Oozevale painted fantasy sprite, female potion-punk gunslinger alchemist: very long hair in teal, pink and gold stripes (big high ponytail), brass goggles with prism lenses pushed up on the head, cropped brown leather jacket with brass buckles and bubble-pauldrons, bandolier of round glass potion grenades, tattered leather skirt dripping golden ooze, tall buckled boots, a **brass bubble-blaster rifle** fed by a **glass tube** from a **glowing potion tank on her hip**, iridescent soap bubbles drifting off the muzzle. Soft painted cel shading, glowing highlights, matches the Oozevale art. Flat pure magenta #FF00FF background, no ground shadow, one row of evenly spaced frames on one baseline, same scale every frame."

## Looks (same ids and filenames as now)
| id | name | palette |
|---|---|---|
| `prismpearl` | Prismancer (base) | the reference colours: teal/pink/gold hair, brown leather, brass, pink-violet potion tank |
| `prismgilt` | Gilded Alchemist | gold/amber: honey-blonde and amber hair stripes, gilded brass, amber potion tank, orange bubbles |
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
