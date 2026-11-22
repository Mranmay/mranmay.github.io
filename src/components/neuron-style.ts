import type { Branch, Cell, Point3 } from "../data/dendrites";

type RGB = [number, number, number];
type Material = { pigment: RGB; lightPigment: RGB; emission: number };

// Segment IDs refer to individual reconstructed cells. The warm focal arbor and
// its neighbors keep the same identities and colors when visitors rotate the tissue.
const focal: Record<string, Material> = {
  "864691134918921738": {
    pigment: [236, 186, 126],
    lightPigment: [143, 96, 48],
    emission: 0.94,
  },
  "864691134886600954": {
    pigment: [182, 130, 144],
    lightPigment: [134, 85, 108],
    emission: 0.64,
  },
  "864691134939989091": {
    pigment: [137, 149, 182],
    lightPigment: [85, 104, 139],
    emission: 0.42,
  },
  "864691134989865338": {
    pigment: [117, 161, 156],
    lightPigment: [72, 117, 117],
    emission: 0.34,
  },
  "864691134941875299": {
    pigment: [151, 132, 156],
    lightPigment: [116, 102, 130],
    emission: 0.28,
  },
  "864691134948513276": {
    pigment: [131, 139, 155],
    lightPigment: [101, 109, 126],
    emission: 0.18,
  },
  "864691134964430623": {
    pigment: [117, 133, 147],
    lightPigment: [104, 122, 134],
    emission: 0.13,
  },
};
export function cellMaterial(cell: Cell): Material {
  if (focal[cell.id]) return focal[cell.id];
  const [r, g, b] = [1, 3, 5].map(
    (i) => parseInt(cell.color.slice(i, i + 2), 16) / 255,
  );
  const shade = cell.soma.x < -60 ? 0.68 : 0.94;
  const pigment: RGB = [
    (47 + 19 * r) * shade,
    (45 + 13 * g) * shade,
    (51 + 19 * b) * shade,
  ];
  return {
    pigment,
    lightPigment: [175 + 12 * r, 177 + 12 * g, 182 + 12 * b],
    emission: 0,
  };
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
