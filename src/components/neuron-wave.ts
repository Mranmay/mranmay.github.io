import type { Point3 } from "../data/dendrites";

type Arbor = {
  cell: { soma: Point3 };
  points: Point3[];
  somaIndex: number;
  edges: { a: number; b: number; length: number }[];
  incident: number[][];
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

export type Stimulus = { node: number } | { edge: number; fraction: number };
type Band = { a: number; b: number; from: number; to: number; start: number; end: number };

// Travel in both directions from the contact. Distances are along cables and
// include compartment/caliber timing. A junction transmits into every outlet.
export function traceArbor(n: Arbor, stimulus: Stimulus) {
  const distance = new Float64Array(n.incident.length).fill(Infinity);
  const queue: number[] = [];
  function offer(node: number, time: number) {
    if (time >= distance[node]) return;
    distance[node] = time;
    queue.push(node);
  }
  let origin: Point3;
  if ("node" in stimulus) {
    offer(stimulus.node, 0);
    origin = n.points[stimulus.node];
  } else {
    const e = n.edges[stimulus.edge];
    offer(e.a, stimulus.fraction * e.length);
    offer(e.b, (1 - stimulus.fraction) * e.length);
    origin = between(n.points[e.a], n.points[e.b], stimulus.fraction);
  }
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i];
    for (const id of n.incident[node]) {
      const e = n.edges[id];
      offer(e.a === node ? e.b : e.a, distance[node] + e.length);
    }
  }
  const bands: Band[] = [];
  let extent = 0, longest = 0;
  for (let id = 0; id < n.edges.length; id++) {
    const e = n.edges[id], da = distance[e.a], db = distance[e.b];
    if (!Number.isFinite(da)) continue;
    // In a loop, opposing fronts stop where they meet. An interior click
    // splits its cable into two intervals sharing the exact click position.
    function add(from: number, to: number, start: number) {
      const span = Math.abs(to - from) * e.length;
      if (span < 1e-7) return;
      const end = start + span;
      extent = Math.max(extent, end);
      longest = Math.max(longest, span);
      bands.push({ a: e.a, b: e.b, from, to, start, end });
    }
    function interval(lo: number, hi: number, left: number, right: number) {
      const meet = Math.max(lo, Math.min(hi, (lo + hi + (right - left) / e.length) / 2));
      add(lo, meet, left);
      add(hi, meet, right);
    }
    if ("edge" in stimulus && stimulus.edge === id) {
      interval(0, stimulus.fraction, da, 0);
      interval(stimulus.fraction, 1, 0, db);
    } else {
      interval(0, 1, da, db);
    }
  }
  bands.sort((a, b) => a.start - b.start);
  return { bands, distance, origin, extent, longest, speed: Math.max(145, extent / 1.9) };
}

// Only the gap between the two arbors is synthetic. Each side attaches
// to a real graph vertex, so the bridge fires when the front reaches it.
export function relayContact(from: Arbor, to: Arbor, distance: Float64Array) {
  const target = between(from.cell.soma, to.cell.soma, 0.52);
  let exit = nearestContact(from, target);
  // A disconnected trace can only relay from the component that was touched.
  if (!Number.isFinite(distance[exit])) {
    let best = Infinity;
    for (let i = 0; i < distance.length; i++) {
      if (!Number.isFinite(distance[i])) continue;
      const d = squared(from.points[i], target);
      if (d < best) { best = d; exit = i; }
    }
  }
  const entry = nearestContact(to, between(from.points[exit], to.cell.soma, 0.42));
  return { exit, entry };
}

// Each cell relays from a nearer, already reachable neighbor. Ordering by
// physical distance lets the tap envelope open a radius in the 3D volume.
export function planSpread<T extends Arbor>(source: T, cells: T[]) {
  const order = [source, ...cells.filter(n => n !== source)
    .sort((a, b) => squared(a.cell.soma, source.cell.soma) - squared(b.cell.soma, source.cell.soma))];
  return order.map((cell, i) => {
    let parent = 0, shortest = Infinity;
    for (let j = 0; j < (i <= 3 ? 1 : i); j++) {
      const d = squared(cell.cell.soma, order[j].cell.soma);
      if (d < shortest) { shortest = d; parent = j; }
    }
    return {
      cell, parent, radius: Math.sqrt(squared(source.cell.soma, cell.cell.soma)), arrival: Infinity,
      timing: null as Pick<ReturnType<typeof traceArbor>, "distance" | "speed"> | null,
      contact: null as ReturnType<typeof relayContact> | null,
    };
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
