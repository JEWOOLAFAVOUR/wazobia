# Asset Manifest — Quaternius Universal Base Characters

## Pack

- **Asset name:** Universal Base Characters (Standard / free tier)
- **Author / source:** Quaternius — https://quaternius.com/packs/universalbasecharacters.html
- **Official download:** https://quaternius.itch.io/universal-base-characters
- **License:** CC0 1.0 Universal (public domain — personal, educational and commercial use OK)
- **Fetched:** 2026-10-03. itch.io requires a session for direct download, so files were
  taken from a community mirror of the identical CC0 files
  (raw.githubusercontent.com/zhiyuanbuqiID/AI-AI-CanvasPro) and verified
  byte-shape against the official pack layout (`Base Characters/Godot - UE/*.gltf`).
- **What we use it for:** player base bodies for the Wazobia character creator (Phase 1:
  selection screen only — no clothing/economy yet).

## Important proportion note

The free Standard tier contains the **Superhero** male/female proportions only.
The **Regular** and **Teen** proportions live in the paid Source tier ($19.99).
Decision for the prototype: start with Superhero (same pack, same art style) so we can
judge whether the Quaternius style belongs in the game; buy the Source tier later
if we want to switch the default body to Regular. No code changes needed beyond
dropping new files here — see `apps/web/game/character/characters.ts`.

## Local paths (served from `/assets/...` via Next.js `public/`)

| File | Purpose | Size |
| ---- | ------- | ---- |
| `base/male/Superhero_Male_FullBody.gltf` + `.bin` | Male base mesh, 69 nodes, 1 skin, no embedded anims | ~0.75 MB geometry |
| `base/female/Superhero_Female_FullBody.gltf` + `.bin` | Female base mesh, same rig layout | ~1.0 MB geometry |
| `base/{male,female}/T_*_BaseColor / Dark*.png` | Albedo / skin + hair color | ~1.4–1.7 MB each |
| `base/{male,female}/T_*_Normal*.png` | Normal maps (keep lossless) | ~4–4.7 MB each |
| `base/{male,female}/T_*_Roughness.png` | Roughness | ~3.2 MB each |
| `base/{male,female}/T_Eye_*.png` | Eyes | ~50 KB |
| `animations/idle-library.gltf` + `AnimationLibrary_Godot_Standard.bin` | Idle_Loop clip (46-clip library, we play `Idle_Loop` only) | ~4 MB |

Total ≈ 34 MB. Follow-up before production: downscale normal maps to 1–2K,
convert albedo to JPEG/WebP, consider `.glb` packing (ui-guide §28).

## Compatibility notes

- Character rigs use Godot/UE export bone names (`pelvis`, `thigh_l`, `hand_l`, …);
  the animation library uses Blender `DEF-` names (`DEF-hips`, `DEF-thigh.L`, …).
  `game/character/remap.ts` renames `Idle_Loop` tracks onto the character bones.
  Rest-pose positions match within ~5 cm, so the retarget is visually clean.
- Animation source: Quaternius Universal Animation Library (CC0),
  via community glTF-only mirror (github.com/J-Ponzo/gltf-universal-animation-library),
  file `glTF/AnimationLibrary_Godot_Standard.*`, clip `Idle_Loop`.
- Do NOT mix these characters with other art styles (ui-guide §24).
