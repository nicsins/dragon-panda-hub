# Dragon & Panda Hub

Merged **Cyberpunk Burning Man** (ground) + **Drone void-shooter** into one multi-platform landing page with:

- Shared **Controls / Xbox** remapper (`js/controls.js`, Gamepad API)
- Feature-stop **tutorial videos** (jump to each step)
- HD cyber **panda** + **spiky car** assets verified
- Automated asset checklist on the hub

## Run
```bash
cd dragon-panda-hub
python3 -m http.server 8766
# open http://localhost:8766
```

## Play
| Mode | Path | Success flow |
|------|------|----------------|
| Ground Playa | `play/ground.html` | Collect → quests → ZPEG → rogue drones → defend Man → Burn |
| Drone Arena | `play/drone.html` | Mount → fly → shoot → boom → douse → craft → readiness 100% → Burn |

## Controls
- **P** or hub button → open mapper (keyboard & Xbox stored separately)
- Default Xbox: LS move, RS look, A use, RT shoot, B boom, LB fly/drone, RB drive, Y ability, LT douse, Menu mapper

## Verify
Hub page `#verify` HEADs every sprite, video, and JS. Green = safe to ship without broken deps.

## Archive
Older builds remain under `../cyberpunk-burning-man-game/` (phases, omega, hd, v2).
