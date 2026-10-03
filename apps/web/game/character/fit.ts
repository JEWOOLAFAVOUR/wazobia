import * as THREE from "three";
import { TORSO_JOINTS } from "./garments";

// Fits an UNRIGGED garment (e.g. the Poly by Google tee) onto the Quaternius
// skeleton by copying skin weights from the nearest body vertex, then binding
// it with the body's own bind matrix. No Blender needed. Works when the
// garment roughly matches the body in a neutral pose; loose fit hides error.
export type FitReport = {
  verts: number;
  meanGapMm: number;
  maxGapMm: number;
  scale: number;
};

type BodyCache = {
  pos: Float32Array;
  grid: Map<string, number[]>;
};

const CELL = 0.04;

function cellKey(x: number, y: number, z: number): string {
  return `${Math.floor(x / CELL)},${Math.floor(y / CELL)},${Math.floor(z / CELL)}`;
}

function buildCache(body: THREE.SkinnedMesh): BodyCache {
  const geo = body.geometry as THREE.BufferGeometry;
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const world = new Float32Array(pos.count * 3);
  const grid = new Map<string, number[]>();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(body.matrixWorld);
    world[i * 3] = v.x;
    world[i * 3 + 1] = v.y;
    world[i * 3 + 2] = v.z;
    const k = cellKey(v.x, v.y, v.z);
    let cell = grid.get(k);
    if (!cell) {
      cell = [];
      grid.set(k, cell);
    }
    cell.push(i);
  }
  return { pos: world, grid };
}

function nearest(
  si: THREE.BufferAttribute,
  sw: THREE.BufferAttribute,
  cache: BodyCache,
  x: number,
  y: number,
  z: number,
): { dist: number; joints: number[]; weights: number[] } {
  const cx = Math.floor(x / CELL);
  const cy = Math.floor(y / CELL);
  const cz = Math.floor(z / CELL);
  let best = -1;
  let bestD = Infinity;
  for (let ix = cx - 2; ix <= cx + 2; ix++) {
    for (let iy = cy - 2; iy <= cy + 2; iy++) {
      for (let iz = cz - 2; iz <= cz + 2; iz++) {
        const cell = cache.grid.get(`${ix},${iy},${iz}`);
        if (!cell) continue;
        for (const i of cell) {
          const dx = cache.pos[i * 3] - x;
          const dy = cache.pos[i * 3 + 1] - y;
          const dz = cache.pos[i * 3 + 2] - z;
          const d = dx * dx + dy * dy + dz * dz;
          if (d < bestD) {
            bestD = d;
            best = i;
          }
        }
      }
    }
  }
  if (best < 0) return { dist: Infinity, joints: [0, 0, 0, 0], weights: [1, 0, 0, 0] };
  // itemSize 4: vertex `best` owns components X/Y/Z/W of item `best`.
  const joints = [si.getX(best), si.getY(best), si.getZ(best), si.getW(best)];
  const weights = [sw.getX(best), sw.getY(best), sw.getZ(best), sw.getW(best)];
  return { dist: Math.sqrt(bestD), joints, weights };
}

/** World-space bbox of torso vertices (for sizing the garment). */
function torsoBox(body: THREE.SkinnedMesh): THREE.Box3 {
  const geo = body.geometry as THREE.BufferGeometry;
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const si = geo.getAttribute("skinIndex") as THREE.BufferAttribute;
  const sw = geo.getAttribute("skinWeight") as THREE.BufferAttribute;
  const allow = new Set(TORSO_JOINTS);
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const jw: Array<[number, number]> = [
      [si.getX(i), sw.getX(i)],
      [si.getY(i), sw.getY(i)],
      [si.getZ(i), sw.getZ(i)],
      [si.getW(i), sw.getW(i)],
    ];
    let best = jw[0][0];
    let bestW = jw[0][1];
    for (let k = 1; k < 4; k++) {
      if (jw[k][1] > bestW) {
        bestW = jw[k][1];
        best = jw[k][0];
      }
    }
    if (!allow.has(body.skeleton.bones[best]?.name)) continue;
    v.fromBufferAttribute(pos, i).applyMatrix4(body.matrixWorld);
    box.expandByPoint(v);
  }
  return box;
}

const fitCache = new Map<string, THREE.SkinnedMesh[]>();

export function fitUnrigged(
  scene: THREE.Object3D,
  body: THREE.SkinnedMesh,
  src: THREE.Object3D,
  key: string,
): { meshes: THREE.SkinnedMesh[]; report: FitReport; cached: boolean } {
  const hit = fitCache.get(key);
  if (hit) {
    // Re-dress fresh meshes sharing the cached (already fitted) geometry.
    const out = hit.map((m) => {
      const c = new THREE.SkinnedMesh(m.geometry, m.material);
      c.frustumCulled = false;
      return c;
    });
    return { meshes: out, report: { verts: 0, meanGapMm: 0, maxGapMm: 0, scale: 1 }, cached: true };
  }

  scene.updateMatrixWorld(true);
  body.updateWorldMatrix(true, false);
  const geo = body.geometry as THREE.BufferGeometry;
  const cache = buildCache(body);
  const tbox = torsoBox(body);
  const tsize = tbox.getSize(new THREE.Vector3());
  const tcenter = tbox.getCenter(new THREE.Vector3());

  // Collect source meshes.
  const parts: THREE.Mesh[] = [];
  src.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry && (mesh.geometry as THREE.BufferGeometry).getAttribute("position")) {
      parts.push(mesh);
    }
  });

  const out: THREE.SkinnedMesh[] = [];
  let total = 0;
  let gapSum = 0;
  let gapMax = 0;
  let scale = 1;

  for (const part of parts) {
    const sg = (part.geometry as THREE.BufferGeometry).clone().toNonIndexed();
    sg.computeBoundingBox();
    const sb = sg.boundingBox as THREE.Box3;
    const ssize = sb.getSize(new THREE.Vector3());
    const scenter = sb.getCenter(new THREE.Vector3());
    // Lateral = longer horizontal axis; rotate so it lies on X.
    const needRot = ssize.z > ssize.x;
    const lateral = Math.max(ssize.x, ssize.z);
    scale = (tsize.x * 1.12) / Math.max(0.001, lateral);
    const rot = new THREE.Matrix4().makeRotationY(needRot ? Math.PI / 2 : 0);
    const m = new THREE.Matrix4()
      .makeTranslation(tcenter.x, tcenter.y, tcenter.z)
      .multiply(rot)
      .multiply(new THREE.Matrix4().makeScale(scale, scale, scale))
      .multiply(new THREE.Matrix4().makeTranslation(-scenter.x, -scenter.y, -scenter.z));
    sg.applyMatrix4(m);

    const sp = sg.getAttribute("position") as THREE.BufferAttribute;
    const n = sp.count;
    const skinIndex = new Uint16Array(n * 4);
    const skinWeight = new Float32Array(n * 4);
    const v = new THREE.Vector3();
    const si = geo.getAttribute("skinIndex") as THREE.BufferAttribute;
    const sw = geo.getAttribute("skinWeight") as THREE.BufferAttribute;
    for (let i = 0; i < n; i++) {
      v.fromBufferAttribute(sp, i);
      const r = nearest(si, sw, cache, v.x, v.y, v.z);
      for (let k = 0; k < 4; k++) {
        skinIndex[i * 4 + k] = r.joints[k];
        skinWeight[i * 4 + k] = r.weights[k];
      }
      gapSum += r.dist;
      gapMax = Math.max(gapMax, r.dist);
      total++;
    }
    sg.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIndex, 4));
    sg.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWeight, 4));
    // Into body-mesh space for binding with the body's bind matrix.
    sg.applyMatrix4(body.matrixWorld.clone().invert());
    const mats = Array.isArray(part.material) ? part.material : [part.material];
    const skinned = new THREE.SkinnedMesh(sg, mats.length > 1 ? mats : mats[0]);
    skinned.frustumCulled = false;
    out.push(skinned);
  }

  fitCache.set(key, out);
  return {
    meshes: out.map((mm) => new THREE.SkinnedMesh(mm.geometry, mm.material)),
    report: { verts: total, meanGapMm: total ? (gapSum / total) * 1000 : 0, maxGapMm: gapMax * 1000, scale },
    cached: false,
  };
}
