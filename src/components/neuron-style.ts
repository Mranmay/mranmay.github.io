import type { Branch, Cell, Point3 } from "../data/dendrites";

type RGB = [number, number, number];
// Earth and mineral tones leave luminance available for surface shading and activity.
const pigments: [number, RGB][] = [
  [0, [205, 144, 129]],
  [32, [205, 168, 124]],
  [62, [187, 181, 131]],
  [100, [151, 174, 142]],
  [150, [123, 172, 157]],
  [190, [124, 164, 177]],
  [220, [140, 156, 183]],
  [259, [155, 151, 181]],
  [296, [178, 151, 173]],
  [330, [191, 148, 158]],
  [360, [205, 144, 129]],
];
export function cellPigment(hex: string): RGB {
  const [r, g, b] = [1, 3, 5].map(
    (p) => parseInt(hex.slice(p, p + 2), 16) / 255,
  );
  const high = Math.max(r, g, b),
    low = Math.min(r, g, b),
    delta = high - low;
  const hue =
    delta === 0
      ? 220
      : ((high === r
          ? (g - b) / delta
          : high === g
            ? 2 + (b - r) / delta
            : 4 + (r - g) / delta) *
          60 +
          360) %
        360;
  const index = pigments.findIndex(([degrees]) => degrees >= hue);
  const [a, below] = pigments[Math.max(0, index - 1)],
    [z, above] = pigments[index];
  const f = a === z ? 0 : (hue - a) / (z - a);
  return below.map((v, i) => Math.round(v + (above[i] - v) * f)) as RGB;
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
