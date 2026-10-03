import * as THREE from "three";

// Data-driven head frame: forward comes from the actual geometry
// (eyes center minus head-bone center), so accessories land correctly
// without guessing which way the model faces.
export type HeadFrame = {
  head: THREE.Bone;
  forward: THREE.Vector3;
  eyeCenter: THREE.Vector3;
  headPos: THREE.Vector3;
  headR: number;
};

function bboxOf(obj: THREE.Object3D): THREE.Box3 | null {
  const box = new THREE.Box3();
  let found = false;
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry) {
      box.expandByObject(mesh);
      found = true;
    }
  });
  return found ? box : null;
}

export function computeHeadFrame(scene: THREE.Object3D): HeadFrame | null {
  scene.updateMatrixWorld(true);
  const head = scene.getObjectByName("Head") as THREE.Bone | undefined;
  const eyes = scene.getObjectByName("Eyes");
  const brows = scene.getObjectByName("Eyebrows");
  if (!head || !eyes) return null;
  const eyeBox = bboxOf(eyes);
  if (!eyeBox) return null;
  const eyeCenter = eyeBox.getCenter(new THREE.Vector3());
  const headPos = new THREE.Vector3();
  head.getWorldPosition(headPos);
  const forward = eyeCenter.clone().sub(headPos);
  forward.y = 0;
  if (forward.lengthSq() < 1e-8) forward.set(0, 0, 1);
  forward.normalize();
  const hairBox = brows ? bboxOf(brows) : null;
  const hairSize = hairBox?.getSize(new THREE.Vector3());
  const eyeSize = eyeBox.getSize(new THREE.Vector3());
  const headR = hairSize ? (hairSize.x + hairSize.z) / 4 : Math.max(eyeSize.x * 1.6, 0.09);
  return { head, forward, eyeCenter, headPos, headR };
}

function yawTo(forward: THREE.Vector3): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), forward);
}

function solid(color: string, roughness = 0.9): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0 });
}

/** Place a world-positioned group onto a bone, preserving its world transform. */
export function pinTo(bone: THREE.Bone, group: THREE.Group): void {
  bone.updateWorldMatrix(true, false);
  bone.attach(group);
}

/** Express a world point in a freshly positioned group's local frame. */
function toLocal(group: THREE.Group, world: THREE.Vector3): THREE.Vector3 {
  group.updateMatrixWorld(true);
  return group.worldToLocal(world.clone());
}

export function buildCap(color: string, frame: HeadFrame): THREE.Group {
  const g = new THREE.Group();
  g.quaternion.copy(yawTo(frame.forward));
  const r = frame.headR;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r * 1.04, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), solid(color));
  dome.position.y = r * 0.28;
  const brim = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.02, r * 1.02, 0.014, 24, 1, false, -Math.PI / 2, Math.PI), solid(color));
  brim.position.set(0, r * 0.32, r * 0.72);
  const button = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), solid(color));
  button.position.y = r * 1.32;
  g.add(dome, brim, button);
  g.position.copy(frame.headPos).add(new THREE.Vector3(0, r * 0.12, 0));
  return g;
}

export function buildWrap(color: string, frame: HeadFrame): THREE.Group {
  const g = new THREE.Group();
  g.quaternion.copy(yawTo(frame.forward));
  const r = frame.headR;
  const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.0, r * 0.34, 12, 28), solid(color));
  band.rotation.x = Math.PI / 2;
  band.position.y = r * 0.42;
  const crown = new THREE.Mesh(new THREE.SphereGeometry(r * 1.0, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.45), solid(color));
  crown.position.y = r * 0.42;
  const knot = new THREE.Mesh(new THREE.SphereGeometry(r * 0.3, 12, 10), solid(color));
  knot.position.set(r * 0.95, r * 0.5, -r * 0.35);
  g.add(band, crown, knot);
  g.position.copy(frame.headPos);
  return g;
}

export function buildGlasses(frame: HeadFrame): THREE.Group {
  const g = new THREE.Group();
  g.position.copy(frame.headPos);
  g.quaternion.copy(yawTo(frame.forward));
  const eyes = frame.head.parent?.getObjectByName("Eyes");
  const eyeBox = new THREE.Box3();
  if (eyes) eyeBox.expandByObject(eyes);
  const eyeW = Math.max(eyeBox.getSize(new THREE.Vector3()).x, 0.07);
  const eyeCenter = toLocal(g, frame.eyeCenter);
  const mat = solid("#191512", 0.5);
  const dx = eyeW * 0.24;
  const lensR = eyeW * 0.15;
  for (const s of [-1, 1]) {
    const lens = new THREE.Mesh(new THREE.TorusGeometry(lensR, 0.006, 8, 24), mat);
    lens.position.set(s * dx, eyeCenter.y, eyeCenter.z + 0.012);
    g.add(lens);
    const temple = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.008, frame.headR * 1.4), mat);
    temple.position.set(s * (dx + lensR), eyeCenter.y, eyeCenter.z - frame.headR * 0.6);
    g.add(temple);
  }
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(dx * 2 - lensR * 1.4, 0.007, 0.007), mat);
  bridge.position.set(0, eyeCenter.y + 0.004, eyeCenter.z + 0.012);
  g.add(bridge);
  return g;
}

export function buildWatch(faceColor: string, lowerarm: THREE.Bone, hand: THREE.Bone): THREE.Group {
  const g = new THREE.Group();
  const elbow = new THREE.Vector3();
  const wrist = new THREE.Vector3();
  lowerarm.getWorldPosition(elbow);
  hand.getWorldPosition(wrist);
  const dir = wrist.clone().sub(elbow).normalize();
  const at = elbow.clone().lerp(wrist, 0.82);
  g.position.copy(at);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.014, 10, 24), solid("#26221e", 0.7));
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.032, 20), solid(faceColor, 0.35));
  g.add(band, face);
  return g;
}

export function buildBackpack(color: string, spine: THREE.Bone, forward: THREE.Vector3, chestDepth: number): THREE.Group {
  const g = new THREE.Group();
  g.quaternion.copy(yawTo(forward));
  const pos = new THREE.Vector3();
  spine.getWorldPosition(pos);
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.38, 0.17), solid(color));
  pack.position.set(0, 0, -(chestDepth / 2 + 0.1));
  g.add(pack);
  const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.05), solid(color));
  pocket.position.set(0, -0.06, -(chestDepth / 2 + 0.2));
  g.add(pocket);
  for (const s of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.34, 0.025), solid(color));
    strap.position.set(s * 0.1, 0.05, chestDepth / 2 + 0.005);
    g.add(strap);
  }
  g.position.copy(pos);
  return g;
}

export function buildHandbag(color: string, hand: THREE.Bone, forward: THREE.Vector3): THREE.Group {
  const g = new THREE.Group();
  g.quaternion.copy(yawTo(forward));
  const pos = new THREE.Vector3();
  hand.getWorldPosition(pos);
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.17, 0.09), solid(color));
  bag.position.set(0, -0.22, 0.02);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 8, 20, Math.PI), solid(color));
  handle.position.set(0, -0.13, 0.02);
  g.add(bag, handle);
  g.position.copy(pos);
  return g;
}

/** Shirt collar ring at the base of the neck. */
export function buildCollar(color: string, neck: THREE.Bone, radius: number): THREE.Group {
  const g = new THREE.Group();
  const pos = new THREE.Vector3();
  neck.getWorldPosition(pos);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.02, 10, 24), solid(color));
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  g.position.copy(pos).add(new THREE.Vector3(0, -0.03, 0));
  return g;
}

/** Shirt buttons down the sternum, sitting just off the cloth. */
export function buildButtons(spine: THREE.Bone, forward: THREE.Vector3, frontOffset: number): THREE.Group {
  const g = new THREE.Group();
  const pos = new THREE.Vector3();
  spine.getWorldPosition(pos);
  g.position.copy(pos);
  const mat = solid("#e8e2d6", 0.5);
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), mat);
    b.position.set(0, 0.09 - i * 0.055, 0).addScaledVector(forward, frontOffset);
    g.add(b);
  }
  return g;
}
