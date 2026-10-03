import * as THREE from "three";

// The animation library ships Blender `DEF-` bone names
// (DEF-hips, DEF-thigh.L, DEF-f_index.01.L, …) while the Godot/UE character
// exports use short names (pelvis, thigh_l, index_01_l, …).
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

export function mapBone(defName: string): string | null {
  if (!defName.startsWith("DEF-")) return null;
  let n = defName.slice(4);
  let side = "";
  if (n.endsWith(".L")) {
    side = "_l";
    n = n.slice(0, -2);
  } else if (n.endsWith(".R")) {
    side = "_r";
    n = n.slice(0, -2);
  }
  n = n.replace(/\./g, "_").replace(/^f_/, "").replace(/_00(\d)$/, "_0$1");
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
