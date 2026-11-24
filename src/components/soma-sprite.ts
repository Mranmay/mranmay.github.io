import type { Cell, Point3 } from "../data/dendrites";

type Projection = { x: number; y: number; size: number };
type Project = (point: Point3) => Projection;

// The opaque silhouette serves as both the cable mask and the emissive body.
// Only a contacted cell needs a sprite. Use its small membrane mesh, without
// projecting its arbor or reading pixels back from the tissue canvas.
export function somaSprite(
  cell: Cell, project: Project, base: Projection, axisTip: Point3,
  elongation: number, color: string, highlight: string, image: HTMLCanvasElement,
) {
  const shape = new Path2D();
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
  const radius = cell.radius * base.size;
  if (cell.surface?.indices.length) {
    const { positions, indices } = cell.surface;
    const vertices = [];
    for (let i = 0; i < positions.length; i += 3) {
      const p = project({
        x: cell.soma.x + positions[i], y: cell.soma.y + positions[i + 1],
        z: cell.soma.z + positions[i + 2],
      });
      const x = p.x - base.x, y = p.y - base.y;
      vertices.push({ x, y });
      left = Math.min(left, x); right = Math.max(right, x);
      top = Math.min(top, y); bottom = Math.max(bottom, y);
    }
    // Wind every projected triangle the same way so the nonzero fill
    // produces one solid silhouette, including overlaps and cropped meshes.
    for (let i = 0; i < indices.length; i += 3) {
      const a = vertices[indices[i]], b = vertices[indices[i + 1]], c = vertices[indices[i + 2]];
      const forward = (b.x - a.x) * (c.y - a.y) >= (b.y - a.y) * (c.x - a.x);
      const second = forward ? b : c, third = forward ? c : b;
      shape.moveTo(a.x, a.y);
      shape.lineTo(second.x, second.y);
      shape.lineTo(third.x, third.y);
      shape.closePath();
    }
  } else {
    const tip = project(axisTip), dx = tip.x - base.x, dy = tip.y - base.y;
    const stretch = 1 + (elongation - 1) * Math.min(1, Math.hypot(dx, dy) / radius);
    const major = radius * stretch;
    shape.ellipse(0, 0, major, radius / Math.sqrt(stretch), Math.atan2(dy, dx), 0, 2 * Math.PI);
    left = top = -major; right = bottom = major;
  }
  left -= 1; top -= 1;
  const width = right + 1 - left, height = bottom + 1 - top;
  const density = Math.min(3, 96 / Math.max(width, height));
  image.width = Math.max(1, Math.ceil(width * density));
  image.height = Math.max(1, Math.ceil(height * density));
  const pen = image.getContext("2d")!;
  const sx = image.width / width, sy = image.height / height;
  pen.setTransform(sx, 0, 0, sy, -left * sx, -top * sy);
  const fill = pen.createRadialGradient(-radius * .2, -radius * .25, 0, 0, 0, Math.max(radius, width / 2, height / 2));
  fill.addColorStop(0, highlight);
  fill.addColorStop(1, color);
  pen.fillStyle = fill;
  pen.fill(shape);
  return { image, left, top, width, height, size: base.size };
}
