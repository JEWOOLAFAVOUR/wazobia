// One palette for the whole area so every kit piece belongs to the same game.
// Lagos palette: weathered plaster, laterite ground, sun-bleached paint,
// galvanised roofing, painted shopfronts.

export const PALETTE = {
  // ground
  earth: "#5a4a37",
  laterite: "#6d4f33",
  asphalt: "#2f3236",
  asphaltWorn: "#3a3d41",
  paintOld: "#b9a97f",
  concrete: "#8e8b83",
  concreteDark: "#5f5c56",
  curb: "#a09a8d",

  // water + drainage
  drainWater: "#2b3a33",
  drainConcrete: "#7d7a72",

  // buildings
  plasterA: "#d8c9a8",
  plasterB: "#c9b896",
  plasterC: "#b98d5e",
  plasterD: "#a8a396",
  paintGreen: "#2e6b46",
  paintBlue: "#274b73",
  paintOrange: "#c96a2c",
  paintRed: "#a83a32",
  paintCream: "#e0cfa8",
  paintTeal: "#2f6b63",

  // roofing / metal
  roofGalv: "#8d9298",
  roofRust: "#7a5b43",
  roofDark: "#3a3733",
  steel: "#8f979e",
  steelDark: "#4c4a46",

  // utility
  poleWood: "#4a3826",
  wire: "#0f0f0f",
  tankBlack: "#1c1c1c",
  generatorRed: "#a83a32",

  // vegetation
  leafDark: "#3d6b34",
  leafMid: "#4a7d3a",
  leafDry: "#6b7a35",
  trunk: "#5b3a1e",

  // vehicles
  danfoYellow: "#e8a90c",
  danfoWhite: "#efe9dc",
  glass: "#1d2b33",
  tyre: "#151515",

  // interiors
  floorTile: "#b7ada0",
  floorTileAlt: "#9a9086",
  wallInt: "#e6ded0",
  wallIntWarm: "#dcc9ad",
  ceiling: "#eae6de",
  wood: "#8a5a2b",
  woodDark: "#5a3a24",
  plasticRed: "#c0392b",
  plasticBlue: "#274b73",
  formica: "#e8e2d6",
  lampWarm: "#ffd9a0",
} as const;

export type PaletteKey = keyof typeof PALETTE;
