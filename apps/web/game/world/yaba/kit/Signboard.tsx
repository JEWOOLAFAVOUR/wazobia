"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";

/**
 * In-world painted signboard (replaces the old floating HTML card, ui-guide §16).
 * Text is painted to a canvas texture and applied to a real shopfront panel, so it
 * occludes correctly, costs one draw call, and reads as part of the building.
 */
export function useSignTexture(text: string, opts: { bg: string; fg: string; border?: string }): THREE.CanvasTexture {
  const { bg, fg, border } = opts;
  const tex = useMemo(() => {
    const w = 512;
    const h = 128;
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    if (border) {
      g.strokeStyle = border;
      g.lineWidth = 8;
      g.strokeRect(6, 6, w - 12, h - 12);
    }
    g.fillStyle = fg;
    g.textAlign = "center";
    g.textBaseline = "middle";
    let size = 62;
    g.font = `800 ${size}px Arial, Helvetica, sans-serif`;
    while (g.measureText(text).width > w - 56 && size > 20) {
      size -= 4;
      g.font = `800 ${size}px Arial, Helvetica, sans-serif`;
    }
    g.fillText(text, w / 2, h / 2 + 2);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [text, bg, fg, border]);

  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/** Board bolted above a shopfront. `w`/`h` are metres. */
export default function Signboard({
  text,
  position,
  rotationY = 0,
  w = 3.4,
  h = 0.8,
  bg = "#141210",
  fg = "#f5b301",
  border,
}: {
  text: string;
  position: [number, number, number];
  rotationY?: number;
  w?: number;
  h?: number;
  bg?: string;
  fg?: string;
  border?: string;
}) {
  const tex = useSignTexture(text, { bg, fg, border });
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow>
        <boxGeometry args={[w + 0.12, h + 0.12, 0.08]} />
        <meshStandardMaterial color="#2a2724" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0, 0.045]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={tex} roughness={0.7} />
      </mesh>
    </group>
  );
}
