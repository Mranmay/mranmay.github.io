import type { Cell, Point3 } from "./dendrites";
import { decodeSomata } from "./decode-somata";

interface PackedCell {
  id: string;
  source: string;
  soma: Point3;
  radius: number;
  color: string;
  paths: string;
  radii?: string;
  axons?: string;
}

// Each path starts at an offset from the soma and continues as signed x/y/z
// steps. Varints keep the many short steps on fine branches small on the wire.
export function decodeMicrons(records: readonly PackedCell[]): Cell[] {
  const surfaces = decodeSomata();
  return records.map(({ id, soma, radius, color, paths, radii, axons }) => {
    const bytes = atob(paths);
    const radiusBytes = radii ? atob(radii) : null;
    const compartments = axons ? atob(axons) : null;
    let cursor = 0,
      radiusIndex = 0;

    function readUnsigned() {
      let value = 0;
      let shift = 0;
      while (cursor < bytes.length) {
        const byte = bytes.charCodeAt(cursor++);
        value += (byte & 127) * 2 ** shift;
        if (byte < 128) return value;
        shift += 7;
        if (shift > 28) break;
      }
      throw new Error("Invalid MICrONS geometry");
    }

    function readStep() {
      const value = readUnsigned();
      return (value & 1) === 0 ? value / 2 : -(value + 1) / 2;
    }

    function readPath() {
      let { x, y, z } = soma;
      return Array.from({ length: readUnsigned() }, () => {
        x += readStep();
        y += readStep();
        z += readStep();
        return { x, y, z };
      });
    }

    const branches = Array.from({ length: readUnsigned() }, (_, i) => {
      const width = readUnsigned() / 100;
      const points = readPath();
      const localRadii = radiusBytes
        ? points.map(() => radiusBytes.charCodeAt(radiusIndex++) / 40)
        : undefined;
      const axon = compartments
        ? Boolean(compartments.charCodeAt(i >> 3) & (1 << (i % 8)))
        : false;
      return { width, points, radii: localRadii, axon };
    });
    const signals = Array.from({ length: readUnsigned() }, readPath);
    if (
      cursor !== bytes.length ||
      (radiusBytes && radiusIndex !== radiusBytes.length) ||
      (compartments && compartments.length !== Math.ceil(branches.length / 8))
    )
      throw new Error("Unexpected MICrONS geometry");
    return {
      id,
      soma,
      radius,
      color,
      branches,
      signals,
      surface: surfaces.get(id),
    };
  });
}
