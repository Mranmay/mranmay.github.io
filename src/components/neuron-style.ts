import type { Branch, Cell, Point3 } from "../data/dendrites";

type RGB = [number, number, number];
type Material = { pigment: RGB; lightPigment: RGB; emission: number };

// Paired segmentation colors keep each arbor recognizable against either matte.
const pigments: Record<string, [RGB, RGB]> = {
  fuchsia: [[253, 36, 190], [236, 8, 161]],
  orchid:  [[226, 59, 245], [196, 35, 244]],
  violet:  [[158, 91, 255], [133, 61, 243]],
  indigo:  [[109, 126, 253], [64, 102, 237]],
  aqua:    [[38, 238, 225], [0, 185, 189]],
  azure:   [[58, 196, 248], [0, 151, 225]],
  mint:    [[59, 238, 167], [0, 179, 116]],
  emerald: [[77, 226, 100], [31, 166, 66]],
  lime:    [[189, 241, 50], [125, 178, 6]],
  yellow:  [[255, 223, 54], [236, 177, 2]],
  amber:   [[255, 160, 53], [244, 119, 5]],
  coral:   [[251, 99, 82], [238, 76, 62]],
  carmine: [[250, 58, 112], [234, 33, 97]],
};

const labels = [
  "aqua", "fuchsia", "yellow", "mint", "violet", "carmine", "azure",
  "lime", "orchid", "amber", "indigo", "emerald", "coral", "aqua",
  "fuchsia", "violet", "orchid", "yellow",
];

// Choose conspicuous, spatially separated proximal arbors across the volume.
// Remaining segment IDs receive stable labels with individual stain densities.
const landmarks: Record<string, string> = {
  "864691134918921738": "aqua",
  "864691134886600954": "fuchsia",
  "864691134939989091": "amber",
  "864691134989865338": "lime",
  "864691134941875299": "violet",
  "864691134918238218": "mint",
  "864691134885508858": "yellow",
  "864691134948203260": "carmine",
  "864691134919017994": "emerald",
  "864691134939988067": "azure",
  "864691134941299811": "orchid",
};

export function cellMaterial(cell: Cell): Material {
  let hash = 2166136261;
  for (let i = 0; i < cell.id.length; i++)
    hash = Math.imul(hash ^ cell.id.charCodeAt(i), 16777619);
  const seed = hash >>> 0;
  const landmark = landmarks[cell.id];
  const [dark, light] = pigments[landmark ?? labels[seed % labels.length]];
  const density = ((seed >>> 8) & 255) / 255;
  const strength = landmark ? 1 : 0.73 + 0.25 * density;
  const paper = landmark ? 0 : 0.025 + 0.10 * (1 - density);
  const emission = landmark ? 0.86 : density > 0.53 ? 0.17 + 0.46 * density ** 3 : 0;
  const pigment: RGB = [dark[0] * strength, dark[1] * strength, dark[2] * strength];
  const lightPigment: RGB = [
    light[0] + (255 - light[0]) * paper,
    light[1] + (255 - light[1]) * paper,
    light[2] + (255 - light[2]) * paper,
  ];
  return { pigment, lightPigment, emission };
}

export function focalGlow(cell: Cell) {
  const guide = cell.signals.reduce<Point3[]>(
    (best, route) => (route.length > best.length ? route : best),
    [],
  );
  const distal = guide[Math.floor(guide.length * 0.66)] ?? cell.soma;
  const sites: [Point3, number, number][] = [
    [cell.soma, 10, 0.96],
    [distal, 9, 0.78],
  ];
  if (guide.length > 2)
    sites.push([guide[Math.floor(guide.length * 0.33)], 7, 0.58]);
  return { distal, sites };
}

export function neuriteRadius(width: number) {
  return Math.max(0.13, width * 0.5);
}
export function endpointRadii(branch: Branch): number[] {
  if (branch.radii) return branch.radii.map((r) => Math.max(0.11, r));
  const radius = neuriteRadius(branch.width);
  return branch.points.map(
    (_, i) =>
      radius * (1.06 - (0.16 * i) / Math.max(1, branch.points.length - 1)),
  );
}

// SWCs have a point soma. Estimate its long axis from the incident processes,
// weighting thicker proximal trunks more heavily than thin collaterals.
export function somaAxes(cell: Cell): { axis: Point3; elongation: number } {
  const directions: { x: number; y: number; z: number; weight: number }[] = [];
  let dominant: Point3 = { x: 0, y: -1, z: 0 },
    largest = 0;
  for (const branch of cell.branches) {
    const p = branch.points[0];
    if (
      Math.hypot(p.x - cell.soma.x, p.y - cell.soma.y, p.z - cell.soma.z) > 1.5
    )
      continue;
    const q =
      branch.points.find(
        (point) =>
          Math.hypot(point.x - p.x, point.y - p.y, point.z - p.z) >
          cell.radius * 1.5,
      ) ?? branch.points[branch.points.length - 1];
    const length = Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z);
    if (length < 0.01) continue;
    const d = {
      x: (q.x - p.x) / length,
      y: (q.y - p.y) / length,
      z: (q.z - p.z) / length,
      weight: (branch.radii?.[1] ?? neuriteRadius(branch.width)) ** 2,
    };
    directions.push(d);
    if (d.weight > largest) {
      largest = d.weight;
      dominant = d;
    }
  }
  let axis = dominant;
  for (let i = 0; i < 7; i++) {
    let x = 0,
      y = 0,
      z = 0;
    for (const d of directions) {
      const v = (d.x * axis.x + d.y * axis.y + d.z * axis.z) * d.weight;
      x += v * d.x;
      y += v * d.y;
      z += v * d.z;
    }
    const norm = Math.hypot(x, y, z);
    if (norm < 0.001) break;
    axis = { x: x / norm, y: y / norm, z: z / norm };
  }
  const total = directions.reduce((s, d) => s + d.weight, 0);
  const concentration =
    directions.reduce(
      (s, d) =>
        s + d.weight * (d.x * axis.x + d.y * axis.y + d.z * axis.z) ** 2,
      0,
    ) / Math.max(0.001, total);
  return { axis, elongation: 1 + Math.max(0, concentration - 0.33) * 0.62 };
}
