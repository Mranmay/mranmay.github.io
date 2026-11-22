import type { Branch, Cell, Point3 } from "../data/dendrites";

type RGB = [number, number, number];
// Project each segmentation hue into a bright pigment range. Retain the
// differences between pastel and deeply saturated cells of the same hue.
export function cellPigment(hex: string): RGB {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const lo = Math.min(...channels),
    hi = Math.max(...channels);
  if (hi - lo < 1) return [208, 222, 235];
  const chroma = (hi - lo) / hi;
  const floor = Math.round(20 + 80 * (1 - chroma));
  const tint = channels.map(
    (c) => floor + ((253 - floor) * (c - lo)) / (hi - lo),
  );
  // Blue-violet has low photopic luminance. A small lift keeps fine traces
  // readable among equal-size yellow and mint processes.
  const luma = 0.213 * tint[0] + 0.715 * tint[1] + 0.072 * tint[2];
  const lift = Math.max(0, (129 - luma) / (255 - luma));
  return tint.map((c) => Math.round(c + (255 - c) * lift)) as RGB;
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
