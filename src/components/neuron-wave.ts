import type { Point3 } from "../data/dendrites";

type Arbor = {
  cell: { soma: Point3 };
  points: Point3[];
  somaIndex: number;
  parent: Int32Array;
  contacts: number[];
};

const squared = (a: Point3, b: Point3) =>
  (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;

export function between(a: Point3, b: Point3, t: number): Point3 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

function nearestContact(n: Arbor, target: Point3) {
  let best = n.somaIndex, distance = squared(n.cell.soma, target);
  for (const index of n.contacts) {
    const d = squared(n.points[index], target);
    if (d < distance) { best = index; distance = d; }
  }
  return best;
}

function toSoma(n: Arbor, from: number) {
  const path: Point3[] = [];
  let node = from;
  if (n.parent[node] < 0) {
    path.push(n.points[node]);
    node = nearestContact(n, n.points[node]);
  }
  while (node !== n.somaIndex) {
    path.push(n.points[node]);
    node = n.parent[node];
  }
  path.push(n.cell.soma);
  return path;
}

export function inputPath(n: Arbor, edge: { a: number; b: number }, fraction: number, onSoma: boolean) {
  if (onSoma) return [n.cell.soma];
  const { a, b } = edge;
  const node = n.parent[a] === b ? b : n.parent[b] === a ? a : fraction < 0.5 ? a : b;
  return [between(n.points[a], n.points[b], fraction), ...toSoma(n, node)];
}

// A visual relay uses traced processes on both cells and a synthetic bridge
// between them. The reconstruction contains no measured synapse pairs.
export function relayPath(from: Arbor, to: Arbor) {
  const exit = nearestContact(from, between(from.cell.soma, to.cell.soma, 0.52));
  const entry = nearestContact(to, between(from.points[exit], to.cell.soma, 0.42));
  return [...toSoma(from, exit).reverse(), ...toSoma(to, entry)];
}

export function measurePath(path: Point3[]) {
  const points = [path[0]], distance = [0];
  let length = 0;
  for (const p of path.slice(1)) {
    const step = Math.sqrt(squared(points[points.length - 1], p));
    if (!step) continue;
    length += step;
    points.push(p);
    distance.push(length);
  }
  return { points, distance, length };
}

// Each cell relays from a nearer, already reachable neighbor. Ordering by
// physical distance lets the tap envelope open a radius in the 3D volume.
export function planSpread<T extends Arbor>(source: T, cells: T[]) {
  const order = [source, ...cells.filter(n => n !== source)
    .sort((a, b) => squared(a.cell.soma, source.cell.soma) - squared(b.cell.soma, source.cell.soma))];
  return order.map((cell, i) => {
    let parent = 0, shortest = Infinity;
    for (let j = 0; j < i; j++) {
      const d = squared(cell.cell.soma, order[j].cell.soma);
      if (d < shortest) { shortest = d; parent = j; }
    }
    return { cell, parent, radius: Math.sqrt(squared(source.cell.soma, cell.cell.soma)), arrival: Infinity };
  });
}

export function nextCharge(previous: number, interval: number) {
  return 1 + previous * Math.exp(-interval / 1.15);
}

export function recruitedCount(plan: { radius: number }[], charge: number) {
  const local = Math.min(4, plan.length);
  const drive = Math.min(1, Math.max(0, (charge - 1) / 3.6));
  if (!drive) return local;
  const near = plan[local - 1].radius, far = plan[plan.length - 1].radius;
  const radius = near + (far - near) * drive ** 1.45;
  let end = local;
  while (end < plan.length && plan[end].radius <= radius + 1e-6) end++;
  return end;
}

export function toHsl(rgb: number[]) {
  const [r, g, b] = rgb.map(c => c / 255);
  const hi = Math.max(r, g, b), lo = Math.min(r, g, b), range = hi - lo;
  const l = (hi + lo) / 2;
  if (!range) return { h: 0, s: 0, l };
  const sector = hi === r ? (g - b) / range : hi === g ? 2 + (b - r) / range : 4 + (r - g) / range;
  return { h: (sector * 60 + 360) % 360, s: range / (1 - Math.abs(2 * l - 1)), l };
}

export function transferColor(a: ReturnType<typeof toHsl>, b: ReturnType<typeof toHsl>, t: number) {
  const hue = a.h + (((b.h - a.h + 540) % 360) - 180) * t;
  return `hsl(${hue.toFixed(1)},${((a.s + (b.s - a.s) * t) * 100).toFixed(1)}%,${((a.l + (b.l - a.l) * t) * 100).toFixed(1)}%)`;
}
