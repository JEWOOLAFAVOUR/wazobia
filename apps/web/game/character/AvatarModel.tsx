"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CHARACTERS, IDLE_CLIP_NAME, IDLE_LIBRARY_URL } from "./characters";
import { applyAppearance } from "./appearance";
import { remapIdleClip } from "./remap";
import {
  FOOT_JOINTS,
  LEG_JOINTS,
  SHOULDER_JOINTS,
  SLEEVE_JOINTS,
  TORSO_JOINTS,
  buildShell,
  buildSkirt,
  cloth,
  computeLandmarks,
  dressCharacter,
  findBodyMesh,
  type ShellDef,
} from "./garments";
import {
  buildBackpack,
  buildButtons,
  buildCap,
  buildCollar,
  buildGlasses,
  buildHandbag,
  buildWatch,
  buildWrap,
  computeHeadFrame,
  pinTo,
} from "./attachments";
import type { Avatar } from "./wardrobe";

function topDef(top: NonNullable<Avatar["top"]>["id"], lm: { elbowY: number; midThighY: number }): ShellDef & { collar: boolean; buttons: boolean } {
  const trim = { upperarm_l: lm.elbowY + 0.02, upperarm_r: lm.elbowY + 0.02 };
  switch (top) {
    case "longsleeve":
      return { joints: [...TORSO_JOINTS, ...SHOULDER_JOINTS, ...SLEEVE_JOINTS], collar: false, buttons: false };
    case "native":
      return {
        joints: [...TORSO_JOINTS, ...SHOULDER_JOINTS, ...SLEEVE_JOINTS, "thigh_l", "thigh_r"],
        yMin: { thigh_l: lm.midThighY + 0.1, thigh_r: lm.midThighY + 0.1 },
        offset: 0.01,
        collar: true,
        buttons: false,
      };
    case "polo":
      return { joints: [...TORSO_JOINTS, ...SHOULDER_JOINTS], yMin: trim, collar: true, buttons: false };
    case "shirt":
      return { joints: [...TORSO_JOINTS, ...SHOULDER_JOINTS], yMin: trim, collar: true, buttons: true };
    case "tee":
    default:
      return { joints: [...TORSO_JOINTS, ...SHOULDER_JOINTS], yMin: trim, collar: false, buttons: false };
  }
}

/** World-space bbox of the vertices driven by the given joints. */
function jointBBox(body: THREE.SkinnedMesh, joints: string[]): THREE.Box3 {
  const box = new THREE.Box3();
  const geo = body.geometry as THREE.BufferGeometry;
  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const si = geo.getAttribute("skinIndex") as THREE.BufferAttribute;
  const sw = geo.getAttribute("skinWeight") as THREE.BufferAttribute;
  const bones = body.skeleton.bones;
  const allow = new Set(joints);
  const v = new THREE.Vector3();
  body.updateWorldMatrix(true, false);
  for (let i = 0; i < pos.count; i++) {
    let best = 0;
    let bestW = -1;
    for (let k = 0; k < 4; k++) {
      const w = sw.getX(i * 4 + k);
      if (w > bestW) {
        bestW = w;
        best = si.getX(i * 4 + k);
      }
    }
    if (!allow.has(bones[best]?.name)) continue;
    v.fromBufferAttribute(pos, i).applyMatrix4(body.matrixWorld);
    box.expandByPoint(v);
  }
  return box;
}

function boneOf(scene: THREE.Object3D, name: string): THREE.Bone | undefined {
  const o = scene.getObjectByName(name);
  return o as THREE.Bone | undefined;
}

export function AvatarModel({ avatar }: { avatar: Avatar }) {
  const entry = CHARACTERS.find((c) => c.id === avatar.body) ?? CHARACTERS[0];
  const { scene } = useGLTF(entry.modelUrl);
  const { animations } = useGLTF(IDLE_LIBRARY_URL);
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  const built = useRef<{ obj: THREE.Object3D; geo: THREE.BufferGeometry[]; mat: THREE.Material[] }[]>([]);

  const idle = useMemo(() => {
    const clip = animations.find((a) => a.name === IDLE_CLIP_NAME);
    if (!clip) return null;
    return remapIdleClip(clip);
  }, [animations]);

  useEffect(() => {
    if (!idle) return;
    const m = new THREE.AnimationMixer(scene);
    const action = m.clipAction(idle);
    action.play();
    mixer.current = m;
    return () => {
      action.stop();
      m.uncacheClip(idle);
      mixer.current = null;
    };
  }, [scene, idle]);

  useEffect(() => {
    applyAppearance(scene, avatar.body, avatar.skin, avatar.hair, avatar.eyes);
  }, [scene, avatar.body, avatar.skin, avatar.hair, avatar.eyes]);

  useFrame((_, rawDt) => {
    mixer.current?.update(Math.min(rawDt, 0.05));
  });

  // Wardrobe build — shells, skirt, collar, headwear, accessories.
  useEffect(() => {
    for (const b of built.current) {
      b.obj.parent?.remove(b.obj);
      b.geo.forEach((g) => g.dispose());
      b.mat.forEach((m) => m.dispose());
    }
    built.current = [];
    const track = (obj: THREE.Object3D) => {
      const geo: THREE.BufferGeometry[] = [];
      const mat: THREE.Material[] = [];
      obj.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          if (mesh.geometry) geo.push(mesh.geometry as THREE.BufferGeometry);
          const ms = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          ms.forEach((m) => m && mat.push(m as THREE.Material));
        }
      });
      built.current.push({ obj, geo, mat });
    };

    scene.updateMatrixWorld(true);
    const body = findBodyMesh(scene);
    if (!body) return;
    const lm = computeLandmarks(scene, body.skeleton);
    const frame = computeHeadFrame(scene);
    const chestDepth = new THREE.Box3().setFromObject(body).getSize(new THREE.Vector3()).z;

    if (avatar.top) {
      const def = topDef(avatar.top.id, lm);
      const shell = buildShell(body, def, cloth(avatar.top.color));
      if (shell) {
        dressCharacter(scene, body, shell);
        track(shell);
      }
      if (def.collar) {
        const neck = boneOf(scene, "neck_01");
        const spine = boneOf(scene, "spine_03");
        if (neck && spine) {
          const cl = boneOf(scene, "clavicle_l");
          const cr = boneOf(scene, "clavicle_r");
          const spread = cl && cr ? Math.abs(cl.position.x - cr.position.x) : 0.2;
          const collar = buildCollar(avatar.top.color, neck, Math.max(0.05, spread * 0.3));
          pinTo(spine, collar);
          track(collar);
        }
      }
      if (def.buttons) {
        const spine = boneOf(scene, "spine_02");
        if (spine && frame) {
          const buttons = buildButtons(spine, frame.forward, chestDepth / 2 + 0.012);
          pinTo(spine, buttons);
          track(buttons);
        }
      }
    }

    if (avatar.bottom) {
      if (avatar.bottom.id === "skirt" && avatar.body === "female") {
        const skirt = buildSkirt(body, lm, cloth(avatar.bottom.color));
        if (skirt) {
          dressCharacter(scene, body, skirt);
          track(skirt);
        }
      } else if (avatar.bottom.id === "shorts") {
        const shell = buildShell(
          body,
          { joints: ["thigh_l", "thigh_r"], yMin: { thigh_l: lm.midThighY, thigh_r: lm.midThighY }, offset: 0.008 },
          cloth(avatar.bottom.color),
        );
        if (shell) {
          dressCharacter(scene, body, shell);
          track(shell);
        }
      } else if (avatar.bottom.id === "trousers" || avatar.bottom.id === "jeans") {
        const shell = buildShell(body, { joints: LEG_JOINTS, offset: 0.008 }, cloth(avatar.bottom.color));
        if (shell) {
          dressCharacter(scene, body, shell);
          track(shell);
        }
      }
    }

    if (avatar.shoes) {
      if (avatar.shoes.id === "sneakers" || avatar.shoes.id === "leather") {
        const shell = buildShell(body, { joints: FOOT_JOINTS, offset: 0.005 }, cloth(avatar.shoes.color));
        if (shell) {
          dressCharacter(scene, body, shell);
          track(shell);
        }
      } else {
        const foot = boneOf(scene, "foot_l");
        const box = jointBBox(body, FOOT_JOINTS);
        if (foot && !box.isEmpty() && frame) {
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const g = new THREE.Group();
          g.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), frame.forward));
          const mat = cloth(avatar.shoes.color);
          const sole = new THREE.Mesh(new THREE.BoxGeometry(size.x + 0.03, 0.025, size.z + 0.05), mat);
          sole.position.set(0, box.min.y - center.y - 0.0125, 0.01);
          g.add(sole);
          const strapY = box.min.y - center.y + 0.055;
          const strap = new THREE.Mesh(
            new THREE.BoxGeometry(size.x + 0.02, 0.018, avatar.shoes.id === "slides" ? 0.07 : 0.03),
            mat,
          );
          strap.position.set(0, strapY, avatar.shoes.id === "slides" ? 0.06 : 0.02);
          g.add(strap);
          if (avatar.shoes.id === "sandals") {
            const back = strap.clone();
            back.position.set(0, strapY - 0.01, -0.07);
            g.add(back);
          }
          g.position.copy(center);
          pinTo(foot, g);
          track(g);
        }
      }
    }

    if (frame) {
      if (avatar.headwear.id === "cap") {
        const cap = buildCap(avatar.headwear.color, frame);
        pinTo(frame.head, cap);
        track(cap);
      } else if (avatar.headwear.id === "wrap") {
        const wrap = buildWrap(avatar.headwear.color, frame);
        pinTo(frame.head, wrap);
        track(wrap);
      }
      if (avatar.accessory === "glasses") {
        const glasses = buildGlasses(frame);
        pinTo(frame.head, glasses);
        track(glasses);
      }
    }
    if (avatar.accessory === "watch") {
      const lower = boneOf(scene, "lowerarm_l");
      const hand = boneOf(scene, "hand_l");
      if (lower && hand) {
        const watch = buildWatch("#e8e2d6", lower, hand);
        pinTo(lower, watch);
        track(watch);
      }
    }
    if (avatar.accessory === "backpack") {
      const spine = boneOf(scene, "spine_02");
      if (spine && frame) {
        const pack = buildBackpack("#274b73", spine, frame.forward, chestDepth);
        pinTo(spine, pack);
        track(pack);
      }
    }
    if (avatar.accessory === "handbag") {
      const hand = boneOf(scene, "hand_r");
      if (hand && frame) {
        const bag = buildHandbag("#5a3a24", hand, frame.forward);
        pinTo(hand, bag);
        track(bag);
      }
    }

    return () => {
      for (const b of built.current) {
        b.obj.parent?.remove(b.obj);
        b.geo.forEach((g) => g.dispose());
        b.mat.forEach((m) => m.dispose());
      }
      built.current = [];
    };
  }, [scene, avatar.body, avatar.top, avatar.bottom, avatar.shoes, avatar.headwear, avatar.accessory]);

  return <primitive object={scene} />;
}
