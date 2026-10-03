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

## Customization notes (Phase 2A)

- Skin: albedo textures are mid-brown, no `baseColorFactor` — tones are material-color
  tint multipliers (target ÷ sampled base: male `#986a4c`, female `#a4714f`).
  See `game/character/appearance.ts`. 5 tones, immediate, no extra downloads.
- Hair: each FullBody file bakes exactly ONE hairstyle (male mesh `Face`/MI_Hair_1,
  female mesh `Eyebrows`/MI_Hair_2). The free tier's other hairstyles are separate
  files not vendored here. Hair albedo is mid-gray (meant to be tinted), so hair
  COLOR is also a tint multiplier — 3 shades implemented, dark default doubles
  as a fix for the ashy untinted look.

## Procedural wardrobe (Phase 2B — no downloads, authored in code)

All items below are generated at runtime in `game/character/` — no external
source, no license risk (project code). They follow the Quaternius skeleton
exactly (shells share its skin weights; props pin to its bones):

| Item | Method | File |
| ---- | ------ | ---- |
| Tee / Polo / Button-up / Long-sleeve / Native top | Body-shell cut + collar ring + button spheres | `garments.ts`, `attachments.ts`, `AvatarModel.tsx` |
| Trousers / Jeans / Shorts | Body-shell cut (shorts = knee trim) | `garments.ts` |
| Skirt (female) | Skinned flare cone, pelvis/thigh weights | `garments.ts` `buildSkirt` |
| Sneakers / Leather shoes | Foot shell | `garments.ts` |
| Sandals / Slides | Procedural sole + straps, sized from foot geometry | `AvatarModel.tsx` |
| Cap / Head wrap | Procedural dome+brim / band+crown, fitted to measured head | `attachments.ts` |
| Glasses / Watch / Backpack / Handbag | Procedural, placed from measured eye/wrist/torso landmarks | `attachments.ts` |

## Real T-shirt (Poly by Google, CC-BY)

- **Required attribution (reproduced verbatim):**
  `T-shirt by Poly by Google [CC-BY] via Poly Pizza`
- **File:** `public/assets/clothing/tops/poly-tee.glb` (182 KB, ~5.8k verts,
  6 primitives, vertex colors, unrigged) + the author's original `.zip`
  (`.obj` + `.mtl`, kept out of the repo).
- **Source page:** https://poly.pizza/m/bdOMzzh-fSl (CC-BY 3.0, commercial use
  permitted with attribution above).
- **Integration:** nearest-vertex skin-weight transfer in
  `game/character/fit.ts` — weights copied from the closest body vertex,
  bound with the body's own bind matrix. No Blender step. Shell tops remain
  as fallback options alongside it.

## Official hairstyles (from the Standard ZIP, CC0)

- **Source:** `Universal Base Characters[Standard].zip` →
  `Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/`
  (https://quaternius.itch.io/universal-base-characters)
- **Files:** `public/assets/characters/quaternius/hair/` —
  `buzzed`, `buzzedfemale`, `buns`, `long`, `simpleparted` (`.gltf` + `.bin`,
  ~700 KB total). Buffer + image URIs rewritten to lowercase filenames and
  the shared base textures (no duplicates). Joint order verified identical
  to the bodies, so they bind with `dressCharacter` directly. Base pack-in
  hair hides when a style is worn.
- Beard (`Hair_Beard`) and `Eyebrows_Regular` exist in the ZIP, not wired yet.

## Decision log

- Cornrows (OCBacon, Sketchfab CC-BY): download blocked — Sketchfab API 401,
  and the user is region-blocked from downloading. Official Quaternius cuts
  above cover the hair brief for now; cornrows remain the top pick if access opens.
- Regular bodies: free tier is Superhero-only (confirmed from the official ZIP
  contents). No Source purchase made.
