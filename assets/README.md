# Demo Asset Pack

Retro Java-phone inspired pixel assets for the small mecha RPG demo. These are original local sprites, generated to match the era's low-resolution style rather than copying any source art.

- `tiles.png`: 10 tiles at 32x32. Ground, wall, rubble, base, repair, road, crate, gate, oil, warning floor.
- `map-mechs.png`: 6 map mech pieces at 32x32.
- `mecha-sd-battle.png`: current SD battle mech action sheet, 4 columns x 2 rows, each frame 256x256. Frame order: idle, ready, slash windup, slash, ranged attack, hurt, guard, victory.
- `mecha-assault-actions.png`: assault beam-saber mech action sheet, 4 columns x 2 rows, each frame 256x256. Frame order: idle, ready, slash windup, slash, ranged attack, hurt, guard, victory.
- `mecha-heavy-actions.png`: heavy artillery mech action sheet, 4 columns x 2 rows, each frame 256x256. Frame order: idle, ready, missile/cannon windup, cannon fire, missile salvo, hurt, guard, victory.
- `mecha-guardian-actions.png`: support guardian mech action sheet, 4 columns x 2 rows, each frame 256x256. Frame order: idle, ready, lance windup, lance thrust, repair/support pulse, hurt, guard, victory.
- `enemy-mecha-raider-actions.png`: villain obsidian raider action sheet, 4 columns x 2 rows, each frame 256x256. Frame order: idle, ready, claw windup, claw slash, dark pulse, hurt, guard, intimidation.
- `enemy-mecha-warlord-actions.png`: villain wasteland warlord action sheet, 4 columns x 2 rows, each frame 256x256. Frame order: idle, ready, pod windup, rotary cannon fire, missile barrage, hurt, guard, intimidation.
- `enemy-mecha-corruptor-actions.png`: villain corrupted core action sheet, 4 columns x 2 rows, each frame 256x256. Frame order: idle, ready, tendril windup, tendril slash, corrosive beam, hurt, guard, core flare.
- `characters.png`: 5 map characters at 32x32.
- `portraits.png`: 5 comms portraits at 64x64.
- `effects.png`: 8 attack/support effects at 64x64.
- `ui-icons.png`: 8 icons at 24x24.
- `battle-bg.png`: 640x284 side-view canyon battle background.
- `battle-bg-field.png`: 640x360 tactical runway battle background, previous field version.
- `battle-bg-fixed-stage.png`: 640x360 fixed-anchor tactical arena background. Player foot anchor is around `(165, 255)`, enemy foot anchor is around `(475, 112)`.

Run `python scripts/generate_demo_assets.py` to regenerate the whole pack.
- `hero-actions.png`: protagonist pilot action sheet, 12 frames at 32x48.
- `hero-portrait.png`: protagonist comms portrait at 64x64.
- `hero-preview.png`: preview sheet for quick visual checking.
- `hero-walk-sheet.png`: protagonist 4-direction walk sheet, 4 rows x 4 columns, each frame 32x48.
- `hero_steps/`: individual split frames for each direction and step.
- `hero-walk-preview.png`: enlarged preview of all walking frames.
- `pilot-character-sheet.png`: character poses, 4 columns x 2 rows, 32x32 frames.
- `pilot-action-sheet.png`: 4-direction action sheet, 4 rows x 8 columns, 32x32 frames.
- `pilot_frames/`: split individual frames for walking and actions.
- `pilot-portrait.png`: matching 64x64 portrait.
- `pilot-action-preview.png`: enlarged preview.
