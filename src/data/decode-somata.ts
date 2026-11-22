import membranes from "./microns-somata.json";

export interface SomaSurface {
  positions: number[];
  indices: number[];
}

export function decodeSomata(): Map<string, SomaSurface> {
  const surfaces = new Map<string, SomaSurface>();
  for (const [segmentId, [vertices, triangles]] of Object.entries(membranes)) {
    const positions = Array.from(atob(vertices), (byte) => {
      const value = byte.charCodeAt(0);
      return (value < 128 ? value : value - 256) * 0.25;
    });
    const indices = Array.from(atob(triangles), (byte) => byte.charCodeAt(0));
    surfaces.set(segmentId, { positions, indices });
  }
  return surfaces;
}
