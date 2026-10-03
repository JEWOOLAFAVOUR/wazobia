import * as THREE from "three";

// Shell-tailored garments (Phase 2B STEP 1): clothing is cut from the
// character's own body mesh — same vertices, same skin weights, same skeleton.
// That guarantees the clothes follow the idle animation with no rigging work.
// Each garment is the set of body triangles whose dominant skin joint belongs
// to the garment, optionally trimmed by bind-pose height, pushed slightly
// outward along the normals so it never z-fights the skin.

export type JointSet = string[];

export const TORSO_JOINTS = ["pelvis", "spine_01", "spine_02", "spine_03"];
export const SHOULDER_JOINTS = ["clavicle_l", "clavicle_r", "upperarm_l", "upperarm_r"];
export const SLEEVE_JOINTS = ["lowerarm_l", "lowerarm_r"];
export const LEG_JOINTS = ["thigh_l", "thigh_r", "calf_l", "calf_r"];
export const FOOT_JOINTS = ["foot_l", "foot_r", "ball_l", "ball_r", "ball_leaf_l", "ball_leaf_r"];

export type Landmarks = {
  neckY: number;
  elbowY: number;
  kneeY: number;
  hipY: number;
  midThighY: number;
};

export function findBodyMesh(scene: THREE.Object3D): THREE.SkinnedMesh | null {
  let found: THREE.SkinnedMesh | null = null;
  scene.traverse((o) => {
    const mesh = o as THREE.SkinnedMesh;
    if (!mesh.isSkinnedMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    if (mats.some((m) => m && (m as THREE.Material).name.startsWith("MI_Superhero"))) {
      found = mesh;
    }
  });
  return found;
}

function boneY(skeleton: THREE.Skeleton, name: string): number {
  const b = skeleton.bones.find((x) => x.name === name);
  if (!b) return 0;
  const v = new THREE.Vector3();
  b.getWorldPosition(v);
  return v.y;
}

export function computeLandmarks(scene: THREE.Object3D, skeleton: THREE.Skeleton): Landmarks {
  scene.updateMatrixWorld(true);
  const kneeY = (boneY(skeleton, "calf_l") + boneY(skeleton, "calf_r")) / 2;
  const thighY = (boneY(skeleton, "thigh_l") + boneY(skeleton, "thigh_r")) / 2;
  return {
    neckY: boneY(skeleton, "neck_01"),
    elbowY: (boneY(skeleton, "lowerarm_l") + boneY(skeleton, "lowerarm_r")) / 2,
    kneeY,
    hipY: boneY(skeleton, "pelvis"),
    midThighY: thighY + (kneeY - thighY) * 0.45,
  };
}

export type ShellDef = {
  joints: JointSet;
  /** minimum bind-pose Y per dominant joint (for hems: sleeves, shorts) */
  yMin?: Record<string, number>;
  /** outward offset in meters */
  offset?: number;
};

function dominantJoint(
  skinIndex: THREE.BufferAttribute,
  skinWeight: THREE.BufferAttribute,
  vi: number,
  bones: THREE.Bone[],
): string {
  let best = 0;
  let bestW = -1;
  for (let k = 0; k < 4; k++) {
    const w = skinWeight.getX(vi * 4 + k);
    if (w > bestW) {
      bestW = w;
      best = skinIndex.getX(vi * 4 + k);
    }
  }
  return bones[best]?.name ?? "";
}

export function buildShell(
  body: THREE.SkinnedMesh,
  def: ShellDef,
  material: THREE.Material,
): THREE.SkinnedMesh | null {
  const src = body.geometry as THREE.BufferGeometry;
  const pos = src.getAttribute("position") as THREE.BufferAttribute;
  const nor = src.getAttribute("normal") as THREE.BufferAttribute;
  const si = src.getAttribute("skinIndex") as THREE.BufferAttribute;
  const sw = src.getAttribute("skinWeight") as THREE.BufferAttribute;
  if (!pos || !nor || !si || !sw) return null;
  const bones = body.skeleton.bones;
  const allow = new Set(def.joints);
  const offset = def.offset ?? 0.007;

  const index = src.getIndex();
  const triCount = index ? index.count / 3 : pos.count / 3;
  const keep: number[] = [];
  const v = new THREE.Vector3();
  for (let t = 0; t < triCount; t++) {
    const vis = [0, 1, 2].map((k) => (index ? index.getX(t * 3 + k) : t * 3 + k));
    const joints = vis.map((vi) => dominantJoint(si, sw, vi, bones));
    if (!joints.every((j) => allow.has(j))) continue;
    if (def.yMin) {
      let ok = true;
      for (let k = 0; k < 3; k++) {
        v.fromBufferAttribute(pos, vis[k]);
        const floor = def.yMin[joints[k]];
        if (floor !== undefined && v.y < floor) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
    }
    keep.push(...vis);
  }
  if (keep.length === 0) return null;

  const geo = new THREE.BufferGeometry();
  const p2 = new Float32Array(pos.array.length);
  const n2 = new Float32Array(nor.array.length);
  p2.set(pos.array as Float32Array);
  n2.set(nor.array as Float32Array);
  const used = new Set(keep);
  const nv = new THREE.Vector3();
  const nn = new THREE.Vector3();
  for (const vi of used) {
    nv.fromBufferAttribute(pos, vi);
    nn.fromBufferAttribute(nor, vi);
    p2[vi * 3] += nn.x * offset;
    p2[vi * 3 + 1] += nn.y * offset;
    p2[vi * 3 + 2] += nn.z * offset;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(p2, 3));
  geo.setAttribute("normal", new THREE.BufferAttribute(n2, 3));
  geo.setAttribute("skinIndex", si);
  geo.setAttribute("skinWeight", sw);
  geo.setIndex(keep);
  geo.computeBoundingSphere();

  const garment = new THREE.SkinnedMesh(geo, material);
  garment.frustumCulled = false;
  return garment;
}

export function cloth(color: string): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });
}

/** Knee-length flared skirt, skinned to pelvis + thighs (female bodies). */
export function buildSkirt(
  body: THREE.SkinnedMesh,
  lm: Landmarks,
  material: THREE.Material,
): THREE.SkinnedMesh | null {
  const bones = body.skeleton.bones;
  const idx = (name: string): number => bones.findIndex((b) => b.name === name);
  const pelvis = idx("pelvis");
  const thighL = idx("thigh_l");
  const thighR = idx("thigh_r");
  if (pelvis < 0 || thighL < 0 || thighR < 0) return null;
  const waistY = lm.hipY + 0.07;
  const hemY = lm.kneeY + 0.08;
  const waistR = Math.abs(bones[thighL].getWorldPosition(new THREE.Vector3()).x - bones[thighR].getWorldPosition(new THREE.Vector3()).x) / 2 + 0.045;
  const hemR = waistR + 0.1;
  const geo = new THREE.CylinderGeometry(waistR, hemR, waistY - hemY, 28, 4, true);
  geo.translate(0, (waistY + hemY) / 2, 0);
  const count = geo.getAttribute("position").count;
  const skinIndex = new Uint16Array(count * 4);
  const skinWeight = new Float32Array(count * 4);
  const p = new THREE.Vector3();
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < count; i++) {
    p.fromBufferAttribute(pos, i);
    const t = Math.min(1, Math.max(0, (waistY - 0.04 - p.y) / Math.max(0.001, waistY - 0.04 - hemY)));
    const side = p.x >= 0 ? thighR : thighL;
    skinIndex[i * 4] = pelvis;
    skinIndex[i * 4 + 1] = side;
    skinWeight[i * 4] = 1 - t * 0.75;
    skinWeight[i * 4 + 1] = t * 0.75;
  }
  geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndex, 4));
  geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeight, 4));
  const mat = (material as THREE.MeshStandardMaterial).clone();
  mat.side = THREE.DoubleSide;
  const skirt = new THREE.SkinnedMesh(geo, mat);
  skirt.frustumCulled = false;
  return skirt;
}

/**
 * Attach a garment to the live character: same parent, same mesh transform,
 * same skeleton — bound with the body's own bind matrix so the shared
 * skeleton's inverses are never recalculated mid-pose.
 */
export function dressCharacter(
  scene: THREE.Object3D,
  body: THREE.SkinnedMesh,
  garment: THREE.SkinnedMesh,
): void {
  body.parent?.add(garment);
  garment.position.copy(body.position);
  garment.quaternion.copy(body.quaternion);
  garment.scale.copy(body.scale);
  scene.updateMatrixWorld(true);
  garment.bind(body.skeleton, body.bindMatrix.clone());
}
