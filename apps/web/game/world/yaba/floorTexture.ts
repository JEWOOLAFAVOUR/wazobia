"use client";

import * as THREE from "three";

/**
 * Procedural floor tiles — no image assets. Warm terracotta/cream checker with
 * grout lines and subtle per-tile tone variation, sized so one texture repeat
 * covers a 2×2 tile block.
 */
export function makeTileTexture(): THREE.CanvasTexture {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d canvas unavailable");
  const tiles = ["#d9a05f", "#e8cfa3"];
  const n = 2;
  const cell = S / n;
  for (let ix = 0; ix < n; ix++) {
    for (let iz = 0; iz < n; iz++) {
      const base = tiles[(ix + iz) % 2];
      ctx.fillStyle = base;
      ctx.fillRect(ix * cell, iz * cell, cell, cell);
      // deterministic tonal variation, no RNG needed at runtime
      const shade = 0.94 + 0.06 * (((ix * 7 + iz * 13) % 5) / 4);
      ctx.fillStyle = `rgba(120,70,30,${(1 - shade) * 0.9})`;
      ctx.fillRect(ix * cell, iz * cell, cell, cell);
      // inner bevel highlight
      ctx.strokeStyle = "rgba(255,245,225,0.35)";
      ctx.lineWidth = 6;
      ctx.strokeRect(ix * cell + 8, iz * cell + 8, cell - 16, cell - 16);
    }
  }
  // grout lines
  ctx.strokeStyle = "#8a7358";
  ctx.lineWidth = 10;
  for (let i = 0; i <= n; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell, 0);
    ctx.lineTo(i * cell, S);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cell);
    ctx.lineTo(S, i * cell);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
