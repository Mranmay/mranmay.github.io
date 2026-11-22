// Generate a repeatable illustration at build time. It represents a cell type,
// rather than a reconstruction of a specific MICrONS neuron.
type Stem = [
  x: number,
  y: number,
  angle: number,
  length: number,
  depth: number,
];
type Point = { x: number; y: number };

function arbor(stems: Stem[], seed: number) {
  let state = seed;
  function random() {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  }

  const paths: string[][] = [];
  const tips: Point[] = [];
  function branch(
    x: number,
    y: number,
    angle: number,
    length: number,
    depth: number,
  ) {
    const radians = (angle * Math.PI) / 180;
    const dx = Math.cos(radians) * length;
    const dy = Math.sin(radians) * length;
    const bend = (random() - 0.5) * 0.36;
    const endX = Math.round(x + dx);
    const endY = Math.round(y + dy);
    const controlX = Math.round(x + dx * 0.48 - dy * bend);
    const controlY = Math.round(y + dy * 0.48 + dx * bend);
    (paths[depth] ??= []).push(
      `M${x} ${y}Q${controlX} ${controlY} ${endX} ${endY}`,
    );
    if (depth === 0) {
      if (random() < 0.16) tips.push({ x: endX, y: endY });
      return;
    }
    branch(
      endX,
      endY,
      angle - 8 - random() * 28,
      length * (0.62 + random() * 0.24),
      depth - 1,
    );
    branch(
      endX,
      endY,
      angle + 9 + random() * 28,
      length * (0.6 + random() * 0.23),
      depth - 1,
    );
  }
  for (const stem of stems) branch(...stem);
  return { paths: paths.map((segments) => segments.join("")), tips };
}

export const apical = arbor(
  [
    [315, 191, -145, 41, 3],
    [321, 171, -16, 39, 3],
    [331, 149, -153, 59, 5],
    [331, 149, -119, 46, 4],
    [336, 139, -79, 39, 4],
    [336, 139, -44, 52, 5],
    [338, 128, -103, 31, 3],
  ],
  89,
);
export const basal = arbor(
  [
    [289, 265, -162, 49, 4],
    [286, 270, 163, 57, 5],
    [291, 270, 118, 37, 4],
    [297, 268, 21, 56, 4],
    [297, 269, 59, 32, 4],
  ],
  73,
);
