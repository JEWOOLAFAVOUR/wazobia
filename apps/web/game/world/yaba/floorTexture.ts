"use client";

import * as THREE from "three";

/**
 * Procedural ceramic floor tiles — no image assets, tiny download.
 * One texture holds a 4×4 tile block; tiling repeats it every ~2.4m so each
 * tile reads at a believable 0.6m household scale whatever the room size.
 * A paired roughness map keeps tiles satin and grout matte under the lights.
 */

const TONE_A = "#cdb896";
const TONE_B = "#e9dcc3";
const GROUT = "#766957";

function paintTiles(ctx: CanvasRenderingContext2D, S: number, n: number): void {
  const cell = S / n;
  for (let ix = 0; ix < n; ix++) {
    for (let iz = 0; iz < n; iz++) {
      ctx.fillStyle = (ix + iz) % 2 === 0 ? TONE_A : TONE_B;
      ctx.fillRect(ix * cell, iz * cell, cell, cell);
      // deterministic tonal variation per tile
      const v = ((ix * 7 + iz * 13) % 5) / 4;
      ctx.fillStyle = `rgba(120,70,30,${(0.03 + v * 0.06).toFixed(3)})`;
      ctx.fillRect(ix * cell, iz * cell, cell, cell);
      // soft inner bevel highlight
      ctx.strokeStyle = "rgba(255,246,228,0.30)";
      ctx.lineWidth = Math.max(2, S / 128);
      ctx.strokeRect(ix * cell + 5, iz * cell + 5, cell - 10, cell - 10);
    }
  }
  // grout lines
  ctx.strokeStyle = GROUT;
  ctx.lineWidth = Math.max(4, S / 48);
  for (let i = 0; i <= n; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cell + 0.5, 0);
    ctx.lineTo(i * cell + 0.5, S);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * cell + 0.5);
    ctx.lineTo(S, i * cell + 0.5);
    ctx.stroke();
  }
}

function paintRoughness(ctx: CanvasRenderingContext2D, S: number, n: number): void {
  // green channel drives roughness: tiles satin (~0.42), grout matte (~0.95)
  const cell = S / n;
  ctx.fillStyle = "rgb(107,107,107)";
  ctx.fillRect(0, 0, S, S);
  for (let ix = 0; ix < n; ix++) {
    for (let iz = 0; iz < n; iz++) {
      const v = 100 + ((ix * 5 + iz * 11) % 5) * 4;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(ix * cell + 4, iz * cell + 4, cell - 8, cell - 8);
    }
  }
  ctx.strokeStyle = "rgb(242,242,242)";
  ctx.lineWidth = Math.max(4, S / 48);
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    ctx.moveTo(i * cell + 0.5, 0);
    ctx.lineTo(i * cell + 0.5, S);
    ctx.moveTo(0, i * cell + 0.5);
    ctx.lineTo(S, i * cell + 0.5);
  }
  ctx.stroke();
}

function toTexture(canvas: HTMLCanvasElement, srgb: boolean): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function makeTileMaps(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const S = 512;
  const color = document.createElement("canvas");
  color.width = S;
  color.height = S;
  const cctx = color.getContext("2d");
  if (!cctx) throw new Error("2d canvas unavailable");
  paintTiles(cctx, S, 4);

  const rough = document.createElement("canvas");
  rough.width = S;
  rough.height = S;
  const rctx = rough.getContext("2d");
  if (!rctx) throw new Error("2d canvas unavailable");
  paintRoughness(rctx, S, 4);

  return { map: toTexture(color, true), roughnessMap: toTexture(rough, false) };
}

/** Back-compat single-texture entry (color map only). */
export function makeTileTexture(): THREE.CanvasTexture {
  return makeTileMaps().map;
}
