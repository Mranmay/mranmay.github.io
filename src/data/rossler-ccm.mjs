// Recreate the oscillator experiment when Astro builds the article.
const librarySizes = Array.from({ length: 8 }, (_, i) => Math.floor(50 + 950 * i / 7));
const maxLibrary = librarySizes.at(-1);
const delay = 5;
const offset = 2 * delay;

function simulate() {
  let x = 1, y = 0, z = 0;
  const first = [], second = [];
  for (let step = 0; step < 15000; step++) {
    [x, y, z] = [
      x + 0.05 * (-y - z),
      y + 0.05 * (x + 0.2 * y),
      z + 0.05 * (0.2 + z * (x - 5.7)),
    ];
    if (step >= 2000) {
      first.push(x);
      second.push(y);
    }
  }
  return [first, second];
}

function reconstruct(source, target) {
  const results = librarySizes.map(size => ({
    size, n: 0, sumX: 0, sumY: 0, sumXX: 0, sumYY: 0, sumXY: 0,
  }));
  for (let t = offset + librarySizes[0]; t < source.length; t++) {
    const distances = [Infinity, Infinity, Infinity, Infinity];
    const indices = [0, 0, 0, 0];
    let sizeIndex = 0;
    // Growing the library preserves its four closest neighbors until a closer row arrives.
    for (let j = offset; j < Math.min(t, offset + maxLibrary); j++) {
      const a = source[t] - source[j];
      const b = source[t - delay] - source[j - delay];
      const c = source[t - offset] - source[j - offset];
      const sq = a * a + b * b + c * c;
      if (sq < distances[3]) {
        let slot = 3;
        while (slot > 0 && sq < distances[slot - 1]) {
          distances[slot] = distances[slot - 1];
          indices[slot] = indices[slot - 1];
          slot--;
        }
        distances[slot] = sq;
        indices[slot] = j;
      }
      if (j - offset + 1 !== librarySizes[sizeIndex]) continue;
      let weighted = 0, norm = 0;
      for (let k = 0; k < 4; k++) {
        const weight = distances[0] === 0
          ? Number(distances[k] === 0)
          : Math.exp(-Math.sqrt(distances[k] / distances[0]));
        weighted += weight * target[indices[k]];
        norm += weight;
      }
      const prediction = weighted / norm;
      const actual = target[t];
      const r = results[sizeIndex++];
      r.n++;
      r.sumX += prediction;
      r.sumY += actual;
      r.sumXX += prediction * prediction;
      r.sumYY += actual * actual;
      r.sumXY += prediction * actual;
    }
  }
  return results.map(({ size, n, sumX, sumY, sumXX, sumYY, sumXY }) => ({
      size,
      rho: (n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX ** 2) * (n * sumYY - sumY ** 2)),
    }));
}

export function rosslerResults() {
  const [x, y] = simulate();
  return [reconstruct(y, x), reconstruct(x, y)];
}
