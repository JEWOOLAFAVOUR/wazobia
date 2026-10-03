import * as THREE from "three";

// The animation library ships Blender `DEF-` bone names, but three.js strips
// dots when it builds track names, so the loaded clip arrives as
// `DEF-spine001`, `DEF-thighL`, `DEF-f_index01L`, … while our Godot/UE
// character export uses `spine_01`, `thigh_l`, `index_01_l`, …
// Same rig, same rest pose — only the names differ — so the Idle_Loop clip
// is retargeted by renaming its tracks. Unmapped tracks are dropped.
const SPECIAL: Record<string, string> = {
  hips: "pelvis",
  head: "Head",
  neck: "neck_01",
  toe: "ball",
  shoulder: "clavicle",
  upper_arm: "upperarm",
  forearm: "lowerarm",
  shin: "calf",
};

export function mapBone(loaded: string): string | null {
  if (loaded === "root") return "root";
  if (!loaded.startsWith("DEF-")) return null;
  let n = loaded.slice(4);
  let side = "";
  if (n.endsWith("L") || n.endsWith("R")) {
    side = n.endsWith("L") ? "_l" : "_r";
    n = n.slice(0, -1);
  }
  // fingers: f_index01 -> index_01 ; spine001 -> spine_01 ; thumb01 -> thumb_01
  if (/^spine00\d$/.test(n)) {
    n = `spine_0${n.slice(-1)}`;
  } else {
    n = n.replace(/^f_/, "").replace(/(\d+)$/, "_$1");
  }
  n = SPECIAL[n] ?? n;
  return n + side;
}

export function remapIdleClip(clip: THREE.AnimationClip): THREE.AnimationClip {
  const tracks: THREE.KeyframeTrack[] = [];
  for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf(".");
    if (dot < 0) continue;
    const mapped = mapBone(track.name.slice(0, dot));
    if (!mapped) continue;
    const renamed = track.clone();
    renamed.name = `${mapped}.${track.name.slice(dot + 1)}`;
    tracks.push(renamed);
  }
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}
