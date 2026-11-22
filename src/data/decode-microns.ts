import type { Cell, Point3 } from "./dendrites";

interface PackedCell {
  id: string;
  source: string;
  soma: Point3;
  radius: number;
  color: string;
  paths: string;
}

// Each path starts at an offset from the soma and continues as signed x/y/z
// steps. Varints keep the many short steps on fine branches small on the wire.
export function decodeMicrons(records: readonly PackedCell[]): Cell[] {
  return records.map(({ soma, radius, color, paths }) => {
    const bytes = atob(paths);
    let cursor = 0;

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

    const branches = Array.from({ length: readUnsigned() }, () => {
      const width = readUnsigned() / 100;
      return { width, points: readPath() };
    });
    const signals = Array.from({ length: readUnsigned() }, readPath);
    if (cursor !== bytes.length) throw new Error("Unexpected MICrONS geometry");
    return { soma, radius, color, branches, signals };
  });
}
