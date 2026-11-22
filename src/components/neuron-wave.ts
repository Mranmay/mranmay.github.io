// Distances along a single cell's neurites, beginning at the exact contact point.
export interface PropagationSegment {
  a: number;
  b: number;
  from: number;
  to: number;
  start: number;
  end: number;
}

export function createPropagation(
  edges: { a: number; b: number; length: number }[],
  nodeCount: number,
  startEdge: number,
  fraction: number,
): PropagationSegment[] {
  const source = edges[startEdge];
  if (!source || !Number.isFinite(fraction)) return [];
  const origin = Math.min(1, Math.max(0, fraction));
  const neighbors: { to: number; length: number }[][] = Array.from(
    { length: nodeCount },
    () => [],
  );
  for (const { a, b, length } of edges) {
    neighbors[a].push({ to: b, length });
    neighbors[b].push({ to: a, length });
  }

  // Each graph contains one cell. Its few hundred vertices make a linear
  // minimum search small, and this queue also handles coincident vertices.
  const distance = new Float64Array(nodeCount).fill(Infinity);
  distance[source.a] = source.length * origin;
  distance[source.b] = Math.min(
    distance[source.b],
    source.length * (1 - origin),
  );
  const visited = new Uint8Array(nodeCount);
  for (;;) {
    let nearest = -1;
    let minimum = Infinity;
    for (let node = 0; node < nodeCount; node++) {
      if (!visited[node] && distance[node] < minimum) {
        nearest = node;
        minimum = distance[node];
      }
    }
    if (nearest === -1) break;
    visited[nearest] = 1;
    for (const neighbor of neighbors[nearest]) {
      const candidate = minimum + neighbor.length;
      if (candidate < distance[neighbor.to]) distance[neighbor.to] = candidate;
    }
  }

  const segments: PropagationSegment[] = [];
  for (let i = 0; i < edges.length; i++) {
    const { a, b, length } = edges[i];
    if (!length || !Number.isFinite(distance[a])) continue;
    function add(from: number, to: number, start: number) {
      const travel = length * Math.abs(to - from);
      if (travel > 1e-8)
        segments.push({ a, b, from, to, start, end: start + travel });
    }
    // Fronts entering both ends of an interval meet where their accumulated
    // distances are equal. The clicked edge contains a third source in its interior.
    function interval(lo: number, hi: number, left: number, right: number) {
      const meet = Math.max(
        lo,
        Math.min(hi, (lo + hi + (right - left) / length) / 2),
      );
      add(lo, meet, left);
      add(hi, meet, right);
    }
    if (i === startEdge) {
      interval(0, origin, distance[a], 0);
      interval(origin, 1, 0, distance[b]);
    } else {
      interval(0, 1, distance[a], distance[b]);
    }
  }
  return segments.sort((x, y) => x.start - y.start || x.end - y.end);
}
