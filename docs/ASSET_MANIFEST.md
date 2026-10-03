# ASSET MANIFEST — Wazobia world & characters

Every visual asset in the game is recorded here. Rule: no mystery meshes.
`Authored in project` = procedural geometry in code (flat-shaded, Lagos palette).
No external 3D downloads are currently used on main.

## Characters (creator + in-world player)

| Asset | Source | License / commercial | Path / notes |
| ----- | ------ | -------------------- | ------------ |
| Stylized avatar (body, clothes, hair, accessories) | Authored in project | n/a | `game/character/SimpleAvatar.tsx` — capsule/sphere/box pieces, 9 haircuts, 4 outfits, 7 fabrics |
| Idle motion | Authored in project | n/a | sine bob + arm sway in `SimpleAvatar.tsx` (no mocap) |

Realistic-asset track (Quaternius bodies, Poly tee, official hair): parked on
branch `wip/quaternius-avatar` with its own manifest. Not on main.

## Yaba neighbourhood (`game/world/yaba/`)

All geometry authored in project unless noted.

| Asset | Source | Notes |
| ----- | ------ | ----- |
| Roads / sidewalks / curbs / drains | Authored in project | derived from `layout.ts` ROADS |
| Plot shells, parapets, roofs, facades | Authored in project | wall boxes mirror `derive.ts` colliders 1:1 |
| Restaurant interior (counter, stools, tables, pendants, kitchen pass) | Authored in project | `interiors.tsx` |
| Shop interior (shelves + goods, counter, till, drinks fridge) | Authored in project | `interiors.tsx` |
| Apartment interior (sofa, TV, rug, bed, wardrobe, kitchen, partitions) | Authored in project | `interiors.tsx` |
| Signboards (shop/restaurant/street names) | Authored in project | drei `Html` overlay, `parts.tsx` Sign |
| Utility poles + wires, street trees, bins | Authored in project | `parts.tsx`, `derive.ts` streetPieces |
| Danfo bus (parked) | Authored in project | `parts.tsx` Danfo |
| Water tanks, generators, AC units | Authored in project | `Hood.tsx` |
| Compound walls + gate (Adeyemi) | Authored in project | `Hood.tsx` |
| Church cross, mosque dome + minaret, bank ATM, bus shelter | Authored in project | `Hood.tsx` Landmark |

## Visual gaps (external asset only if it fills one of these)

- [high] Danfo with real proportions/detail (current is a box bus)
- [high] Nigerian storefront signage textures / sign painter lettering
- [medium] Better vegetation (palms, roadside shrubs)
- [medium] More vehicles (okada, keke, BRT)
- [medium] Street props (traffic cones, barriers, market stalls)
- [low/medium] Restaurant furniture variety

## License policy (ui-guide §26)

Every future external asset must add a row above with: name, source, URL,
license, commercial-use status, modifications, local path. Never assume a
downloadable asset is commercially usable. Prefer CC0 / royalty-free with
written terms. No generative-AI assets without explicit approval.
