// Base character registry — Phase 1 only shows the two Quaternius base bodies.
// To add a variant (e.g. Regular/Teen from the Source tier, or a hairstyle pack),
// drop the files under public/assets/characters/quaternius/ and append an entry here.
// No other code changes needed. See MANIFEST.md next to the assets.
export type CharacterId = "male" | "female";

export type BaseCharacter = {
  id: CharacterId;
  label: string;
  sub: string;
  modelUrl: string;
};

export const BASE_URL = "/assets/characters/quaternius";
export const IDLE_LIBRARY_URL = `${BASE_URL}/animations/idle-library.gltf`;
export const IDLE_CLIP_NAME = "Idle_Loop";

export const CHARACTERS: BaseCharacter[] = [
  {
    id: "male",
    label: "Male",
    sub: "Superhero build",
    modelUrl: `${BASE_URL}/base/male/Superhero_Male_FullBody.gltf`,
  },
  {
    id: "female",
    label: "Female",
    sub: "Superhero build",
    modelUrl: `${BASE_URL}/base/female/Superhero_Female_FullBody.gltf`,
  },
];
