/**
 * Material / plating colours common for anti-tarnish jewellery
 * (stainless steel, PVD / ion-plated, gold-tone fashion jewellery).
 */
export const MATERIAL_COLOUR_OPTIONS = [
  "Yellow",
  "White",
  "Rose",
  "Pink",
  "Silver",
  "Gold",
  "Champagne",
  "Platinum",
  "Rhodium",
  "Antique Gold",
  "Antique Silver",
  "Oxidised",
  "Black",
  "Gunmetal",
  "Ruthenium",
  "Copper",
  "Bronze",
  "Matte Gold",
  "Matte Silver",
  "Two Tone",
  "Tri Color",
  "Multicolor",
] as const;

export type MaterialColourOption = (typeof MATERIAL_COLOUR_OPTIONS)[number];
