import type { Cell, Point3 } from "@/data/dendrites";
import { initNeuronGL } from "./neuron-gl";
import {
  cellMaterial,
  endpointRadii,
  focalGlow,
  somaAxes,
} from "./neuron-style";
import { createPropagation, type PropagationSegment } from "./neuron-wave";

const W = 640,
  H = 405;
const initialYaw = -0.23,
  initialPitch = 0.19;
function camera(yaw: number, pitch: number) {
  const a = Math.cos(yaw),
    b = Math.sin(yaw),
    c = Math.cos(pitch),
    d = Math.sin(pitch);
  return (p: Point3, result = { x: 0, y: 0, z: 0, size: 1 }) => {
    const horizontal = a * p.x + b * p.z,
      depth = a * p.z - b * p.x;
    const y = c * p.y - d * depth,
      z = c * depth + d * p.y;
    const size = 0.98 / (1 - z / 800);
    result.x = W / 2 + horizontal * size;
    result.y = H / 2 + y * size;
    result.z = z;
    result.size = size;
    return result;
  };
}

function brightness(z: number) {
  return Math.min(1, Math.max(0.33, Math.exp(-0.0046 * Math.max(0, 105 - z))));
}
function colorAt(rgb: number[], factor: number) {
  return (
    "rgb(" +
    rgb.map((c) => Math.round(Math.min(255, c * factor))).join(",") +
    ")"
  );
}
type Projected = ReturnType<ReturnType<typeof camera>>;
type Segment = { points: number[]; radii: number[]; axon: boolean };
type Signal = { points: number[]; distances: number[]; length: number };
function prepare(cell: Cell) {
  const points: Point3[] = [];
  const indices = new Map<string, number>();
  function index(p: Point3) {
    const key = `${p.x},${p.y},${p.z}`;
    const found = indices.get(key);
    if (found !== undefined) return found;
    points.push(p);
    indices.set(key, points.length - 1);
    return points.length - 1;
  }
  const branches: Segment[] = cell.branches.map((branch) => ({
    points: branch.points.map(index),
    radii: endpointRadii(branch),
    axon: branch.axon === true,
  }));
  const somaIndex = index(cell.soma);
  const neighbors: number[][] = Array.from({ length: points.length }, () => []);
  const edges: {
    a: number;
    b: number;
    length: number;
    r1: number;
    r2: number;
    axon: boolean;
    proximal: boolean;
  }[] = [];
  const seen = new Set<string>();
  for (const branch of branches) {
    for (let i = 1; i < branch.points.length; i++) {
      const a = branch.points[i - 1],
        b = branch.points[i],
        key = a < b ? a + "," + b : b + "," + a;
      if (a === b || seen.has(key)) continue;
      seen.add(key);
      const p = points[a],
        q = points[b],
        r1 = branch.radii[i - 1],
        r2 = branch.radii[i];
      const distance = Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
      // Relative visual timing follows caliber and compartment. Display time is slowed.
      const rate =
        (branch.axon ? 1.65 : 0.96) *
        Math.max(0.65, Math.min(1.45, Math.sqrt((r1 + r2) / 0.6)));
      const proximal = !branch.axon && r1 + r2 > 0.85 &&
        Math.hypot(p.x - cell.soma.x, p.y - cell.soma.y, p.z - cell.soma.z) < 42;
      edges.push({ a, b, length: distance / rate, r1, r2, axon: branch.axon, proximal });
      neighbors[a].push(b);
      neighbors[b].push(a);
    }
  }
  // Follow the traced edges between each chosen distal terminal and its soma.
  const parent = new Int32Array(points.length).fill(-1),
    queue = [somaIndex];
  parent[somaIndex] = somaIndex;
  for (let i = 0; i < queue.length; i++) {
    for (const next of neighbors[queue[i]]) {
      if (parent[next] === -1) {
        parent[next] = queue[i];
        queue.push(next);
      }
    }
  }
  const signals: Signal[] = [];
  for (const route of cell.signals) {
    const terminal = route[route.length - 1];
    if (!terminal) continue;
    const last = indices.get(`${terminal.x},${terminal.y},${terminal.z}`);
    if (last === undefined || last === somaIndex || parent[last] === -1)
      continue;
    const nodes = [last];
    while (nodes[nodes.length - 1] !== somaIndex)
      nodes.push(parent[nodes[nodes.length - 1]]);
    const distances = [0];
    for (let i = 1; i < nodes.length; i++) {
      const a = points[nodes[i - 1]],
        b = points[nodes[i]];
      distances.push(
        distances[i - 1] + Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z),
      );
    }
    signals.push({
      points: nodes,
      distances,
      length: distances[distances.length - 1],
    });
  }
  const material = cellMaterial(cell),
    pigment = material.pigment,
    shape = somaAxes(cell);
  const axisTip = {
    x: cell.soma.x + shape.axis.x * cell.radius,
    y: cell.soma.y + shape.axis.y * cell.radius,
    z: cell.soma.z + shape.axis.z * cell.radius,
  };
  const triangles: { a: number; b: number; c: number; normal: Point3 }[] = [];
  let surfaceRadius = cell.radius;
  if (cell.surface) {
    const local = cell.surface.positions,
      trianglesIndex = cell.surface.indices;
    const ids: number[] = [];
    for (let i = 0; i < local.length; i += 3)
      surfaceRadius = Math.max(
        surfaceRadius,
        Math.hypot(local[i], local[i + 1], local[i + 2]),
      );
    for (let i = 0; i < local.length; i += 3)
      ids.push(
        index({
          x: cell.soma.x + local[i],
          y: cell.soma.y + local[i + 1],
          z: cell.soma.z + local[i + 2],
        }),
      );
    for (let i = 0; i < trianglesIndex.length; i += 3) {
      const a = ids[trianglesIndex[i]],
        b = ids[trianglesIndex[i + 1]],
        c = ids[trianglesIndex[i + 2]];
      const p = points[a],
        q = points[b],
        r = points[c];
      const x1 = q.x - p.x,
        y1 = q.y - p.y,
        z1 = q.z - p.z,
        x2 = r.x - p.x,
        y2 = r.y - p.y,
        z2 = r.z - p.z;
      const nx = y1 * z2 - z1 * y2,
        ny = z1 * x2 - x1 * z2,
        nz = x1 * y2 - y1 * x2,
        mag = Math.hypot(nx, ny, nz);
      if (mag > 0.0001)
        triangles.push({
          a,
          b,
          c,
          normal: { x: nx / mag, y: ny / mag, z: nz / mag },
        });
    }
  }
  return {
    cell,
    triangles,
    surfaceRadius,
    material,
    glowSites: material.emission ? focalGlow(cell).sites : [],
    pigment,
    color: colorAt(pigment, 1),
    shape,
    axisTip,
    points,
    edges,
    signals,
    epoch: -1,
    projected: points.map((): Projected => ({ x: 0, y: 0, z: 0, size: 1 })),
    somaIndex,
  };
}
type Neuron = ReturnType<typeof prepare>;
type Pulse = { neuron: Neuron; signal: Signal; born: number; duration: number };
type Hit = { neuron: Neuron; edgeIndex: number; fraction: number };
type Wave = {
  hit: Hit;
  segments: PropagationSegment[];
  born: number;
  extent: number;
  speed: number;
  touch?: { x: number; y: number };
};

function halo(color: string) {
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 64;
  const c = sprite.getContext("2d")!;
  const grad = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  const alpha = (v: number) =>
    color.replace("rgb(", "rgba(").replace(")", "," + v + ")");
  for (const t of [0, 0.12, 0.25, 0.4, 0.56, 0.72, 0.86, 1]) {
    const q = t * 3.6;
    grad.addColorStop(
      t,
      alpha(
        t === 1
          ? 0
          : (0.26 * Math.exp(-0.5 * q * q) + 0.05 * Math.exp(-0.16 * q * q)) /
              0.31,
      ),
    );
  }
  c.fillStyle = grad;
  c.fillRect(0, 0, 64, 64);
  return sprite;
}

export function activateNeuron(figure: HTMLElement, cells: Cell[]) {
  const stimulus = figure.querySelector<HTMLButtonElement>(".stimulus")!;
  const canvas = figure.querySelector<HTMLCanvasElement>(".volume-activity")!;
  const glCanvas = figure.querySelector<HTMLCanvasElement>(".volume-geometry")!;
  const context = canvas.getContext("2d");
  if (!context) return;
  const ctx = context;
  let gpu = initNeuronGL(glCanvas, cells);
  figure.classList.toggle("with-gpu", Boolean(gpu));
  // Keep the full depth-rendered, theme-matched surface beneath live tracings on
  // devices without WebGL. A drag switches to interactive software geometry.
  let posterActive = !gpu;
  figure.classList.toggle("poster-active", posterActive);
  const playback = figure.querySelector<HTMLButtonElement>(".playback")!;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const compactLayout = matchMedia("(max-width: 760px)");
  const neurons = cells.map(prepare);
  const sorted = neurons.slice();
  const halos = new Map<string, HTMLCanvasElement>();
  let lightTheme = document.documentElement.dataset.theme === "light";
  const featured = neurons.filter((n) => n.material.emission > 0);
  function applyMaterials() {
    halos.clear();
    for (const n of neurons) {
      n.pigment = lightTheme ? n.material.lightPigment : n.material.pigment;
      n.color = colorAt(n.pigment, 1);
      if (!halos.has(n.color)) halos.set(n.color, halo(n.color));
    }
  }
  applyMaterials();
  let waves: Wave[] = [];
  let stillWave: Wave | null = null;
  let stillTimer = 0;
  let pulses: Pulse[] = [];
  let yaw = initialYaw,
    pitch = initialPitch,
    autoTime = 0,
    clock = 0,
    ambient = 0,
    cycle = 0;
  let visible = false,
    paused = false,
    frame = 0,
    previous = 0,
    drawn = 0,
    scale = 1,
    offsetX = 0,
    offsetY = 0;
  let fiberScale = 1;
  let dragging = false;
  const background = document.createElement("canvas");
  const buffer = background.getContext("2d", { alpha: false })!;
  const emissionSurface = document.createElement("canvas");
  const emissionPen = emissionSurface.getContext("2d", { alpha: false })!;
  const scattering = [2, 6, 12, 32].map((divisor) => {
    const layer = document.createElement("canvas");
    return { divisor, layer, pen: layer.getContext("2d", { alpha: false })! };
  });
  let lastYaw = NaN,
    lastPitch = NaN;

  let epoch = 0;
  let project = camera(initialYaw, initialPitch);
  function locate(neuron: Neuron) {
    if (neuron.epoch !== epoch) {
      for (let i = 0; i < neuron.points.length; i++)
        project(neuron.points[i], neuron.projected[i]);
      neuron.epoch = epoch;
    }
  }
  function somaSurface(neuron: Neuron) {
    const shaft = project(neuron.axisTip),
      base = neuron.projected[neuron.somaIndex];
    if (neuron.triangles.length) {
      const faces = new Map<number, Path2D>();
      const silhouette = new Path2D(),
        fog = brightness(base.z) ** (0.8 - 0.18 * neuron.material.emission);
      const ca = Math.cos(lastYaw),
        sa = Math.sin(lastYaw),
        cb = Math.cos(lastPitch),
        sb = Math.sin(lastPitch);
      for (const triangle of neuron.triangles) {
        const n = triangle.normal;
        const x = ca * n.x + sa * n.z,
          depth = ca * n.z - sa * n.x;
        const y = cb * n.y - sb * depth,
          z = cb * depth + sb * n.y;
        const side = z >= 0 ? 1 : -1;
        const light = Math.max(0, (-0.46 * x - 0.55 * y + 0.7 * z) * side);
        const tone = Math.round((0.61 + 0.55 * light) * 10);
        const key = (side > 0 ? 20 : 0) + tone;
        let face = faces.get(key);
        if (!face) {
          face = new Path2D();
          faces.set(key, face);
        }
        const a = neuron.projected[triangle.a],
          b = neuron.projected[triangle.b],
          c = neuron.projected[triangle.c];
        face.moveTo(a.x, a.y);
        face.lineTo(b.x, b.y);
        face.lineTo(c.x, c.y);
        face.closePath();
        if (side > 0) {
          silhouette.moveTo(a.x, a.y);
          silhouette.lineTo(b.x, b.y);
          silhouette.lineTo(c.x, c.y);
          silhouette.closePath();
        }
      }
      const r = neuron.cell.radius * base.size * 1.28;
      const wash = buffer.createRadialGradient(
        base.x - 0.38 * r, base.y - 0.44 * r, 0, base.x, base.y, 1.6 * r,
      );
      wash.addColorStop(0, surfaceInk(neuron.pigment, 1.17, fog));
      wash.addColorStop(0.52, surfaceInk(neuron.pigment, 0.97, fog));
      wash.addColorStop(1, surfaceInk(neuron.pigment, 0.54, fog));
      buffer.globalAlpha = 1;
      buffer.fillStyle = wash;
      buffer.fill(silhouette);
      emissionPen.fill(silhouette);
      buffer.globalAlpha = 0.64;
      for (const key of Array.from(faces.keys()).sort((a, b) => a - b)) {
        const substrate = lightTheme ? 255 : 0;
        buffer.fillStyle =
          "rgb(" +
          neuron.pigment
            .map((c) =>
              Math.round(
                substrate * (1 - fog) +
                  fog * Math.min(255, (c * (key % 20)) / 10),
              ),
            )
            .join(",") +
          ")";
        buffer.fill(faces.get(key)!);
      }
      buffer.globalAlpha = 1;
      return;
    }
    const radius = neuron.cell.radius * base.size;
    const dx = shaft.x - base.x,
      dy = shaft.y - base.y;
    const elongation =
      1 +
      (neuron.shape.elongation - 1) * Math.min(1, Math.hypot(dx, dy) / radius);
    const light = buffer.createRadialGradient(
      base.x - radius * 0.35,
      base.y - radius * 0.4,
      0,
      base.x,
      base.y,
      radius * elongation,
    );
    light.addColorStop(0, colorAt(neuron.pigment, 1.16));
    light.addColorStop(0.44, neuron.color);
    light.addColorStop(0.85, colorAt(neuron.pigment, 0.55));
    light.addColorStop(1, colorAt(neuron.pigment, 0.3));
    buffer.globalAlpha = brightness(base.z);
    buffer.fillStyle = light;
    buffer.beginPath();
    buffer.ellipse(
      base.x,
      base.y,
      radius * elongation,
      radius / Math.sqrt(elongation),
      Math.atan2(dy, dx),
      0,
      Math.PI * 2,
    );
    buffer.fill();
  }
  function paintLocalLight() {
    for (const n of featured) {
      for (const [point, sigma, power] of n.glowSites) {
        const p = project(point),
          dia = 7.2 * sigma * p.size;
        const t = Math.max(0, Math.min(1, (p.z + 120) / 240));
        const atmosphere = 0.68 + 0.32 * t * t * (3 - 2 * t);
        buffer.globalAlpha =
          0.095 *
          atmosphere *
          n.material.emission *
          power *
          (lightTheme ? 0.76 : 1);
        buffer.drawImage(
          halos.get(n.color)!,
          p.x - dia / 2,
          p.y - dia / 2,
          dia,
          dia,
        );
      }
    }
    buffer.globalAlpha = 1;
  }
  function prepareEmissionSurface() {
    const width = Math.max(1, Math.ceil(background.width / 3));
    const height = Math.max(1, Math.ceil(background.height / 3));
    if (width !== emissionSurface.width || height !== emissionSurface.height) {
      emissionSurface.width = width;
      emissionSurface.height = height;
    }
    emissionPen.setTransform(1, 0, 0, 1, 0, 0);
    emissionPen.fillStyle = lightTheme ? "#fff" : "#000";
    emissionPen.fillRect(0, 0, width, height);
    emissionPen.setTransform(scale / 3, 0, 0, scale / 3, offsetX / 3, offsetY / 3);
    emissionPen.lineWidth = 1.5;
    emissionPen.lineCap = "round";
    emissionPen.lineJoin = "round";
  }
  function scatterLight() {
    const { width, height } = background;
    // Fine scatter follows the whole stack. At wider scales only the cell
    // bodies and their proximal, thick branches contribute appreciable light.
    for (const { layer, divisor, pen } of scattering) {
      pen.imageSmoothingQuality = "high";
      pen.drawImage(divisor < 12 ? background : emissionSurface, 0, 0, layer.width, layer.height);
    }
    buffer.save();
    buffer.setTransform(1, 0, 0, 1, 0, 0);
    buffer.imageSmoothingQuality = "high";
    for (const { layer, divisor } of scattering) {
      if (divisor === 2) {
        buffer.globalAlpha = lightTheme ? 0.47 : 0.63;
      } else if (divisor === 6) {
        buffer.globalAlpha = lightTheme ? 0.26 : 0.33;
      } else {
        buffer.globalCompositeOperation = lightTheme ? "multiply" : "screen";
        buffer.globalAlpha = (divisor === 12 ? 0.55 : 0.79) * (lightTheme ? 0.58 : 1);
      }
      buffer.drawImage(layer, 0, 0, width, height);
    }
    buffer.restore();
  }
  function surfaceInk(pigment: number[], light: number, depth: number) {
    const matte = lightTheme ? 255 : 0;
    return "rgb(" + pigment.map(c => Math.round(
      matte + (Math.min(255, c * light) - matte) * depth,
    )).join(",") + ")";
  }
  function drawFallback() {
    // Depth slices put distant crossings behind nearby surfaces. Each cell/slice
    // batches its tapered silhouettes and the directional highlights of thick trunks.
    type Slice = {
      neuron: Neuron;
      fibers: Path2D;
      body: Path2D;
      trunk: Path2D;
      facet: Path2D;
      hasSoma: boolean;
    };
    const bins: Map<Neuron, Slice>[] = Array.from(
      { length: 12 },
      () => new Map(),
    );
    function slice(n: Neuron, z: number) {
      const bucket =
        bins[Math.max(0, Math.min(11, Math.floor((z + 180) / 30)))];
      let s = bucket.get(n);
      if (!s) {
        s = {
          neuron: n,
          fibers: new Path2D(),
          body: new Path2D(),
          trunk: new Path2D(),
          facet: new Path2D(),
          hasSoma: false,
        };
        bucket.set(n, s);
      }
      return s;
    }
    const xMin = -offsetX / scale - 3,
      xMax = (canvas.width - offsetX) / scale + 3;
    const yMin = -offsetY / scale - 3,
      yMax = (canvas.height - offsetY) / scale + 3;
    for (const n of neurons) {
      locate(n);
      const soma = n.projected[n.somaIndex],
        sr = n.surfaceRadius * soma.size;
      if (
        soma.x + sr >= xMin &&
        soma.x - sr <= xMax &&
        soma.y + sr >= yMin &&
        soma.y - sr <= yMax
      )
        slice(n, soma.z).hasSoma = true;
      for (const e of n.edges) {
        const a = n.projected[e.a],
          b = n.projected[e.b];
        if (
          (a.x < xMin && b.x < xMin) ||
          (a.x > xMax && b.x > xMax) ||
          (a.y < yMin && b.y < yMin) ||
          (a.y > yMax && b.y > yMax)
        )
          continue;
        const dx = b.x - a.x,
          dy = b.y - a.y,
          d = Math.hypot(dx, dy);
        if (d < 0.001) continue;
        const nx = -dy / d,
          ny = dx / d;
        const caliber = e.axon ? 1 : 1.18 + 0.14 * n.material.emission;
        const r1 = Math.max(0.25 / scale, e.r1 * a.size * fiberScale * caliber),
          r2 = Math.max(0.25 / scale, e.r2 * b.size * fiberScale * caliber);
        const s = slice(n, (a.z + b.z) * 0.5);
        const body = e.axon ? s.fibers : e.proximal ? s.trunk : s.body;
        body.moveTo(a.x + nx * r1, a.y + ny * r1);
        body.lineTo(b.x + nx * r2, b.y + ny * r2);
        body.lineTo(b.x - nx * r2, b.y - ny * r2);
        body.lineTo(a.x - nx * r1, a.y - ny * r1);
        body.closePath();
        if (e.axon || Math.max(r1, r2) * scale < 0.65) continue;
        const face = (nx + ny > 0 ? -1 : 1) * 0.55;
        const tip = s.facet;
        tip.moveTo(a.x + nx * r1 * face, a.y + ny * r1 * face);
        tip.lineTo(b.x + nx * r2 * face, b.y + ny * r2 * face);
        tip.lineTo(b.x - nx * r2 * 0.12 * face, b.y - ny * r2 * 0.12 * face);
        tip.lineTo(a.x - nx * r1 * 0.12 * face, a.y - ny * r1 * 0.12 * face);
        tip.closePath();
      }
    }
    paintLocalLight();
    prepareEmissionSurface();
    bins.forEach((bin, i) => {
      const depth = brightness(-165 + i * 30);
      for (const s of bin.values()) {
        const emission = s.neuron.material.emission;
        buffer.globalAlpha = 1;
        buffer.fillStyle = surfaceInk(s.neuron.pigment, 0.72, depth * (0.47 + 0.25 * depth));
        buffer.fill(s.fibers);
        buffer.fillStyle = surfaceInk(s.neuron.pigment, 0.72 + 0.10 * emission, depth);
        buffer.fill(s.body);
        buffer.fillStyle = surfaceInk(s.neuron.pigment, 1.04 + 0.09 * emission, depth ** 0.66);
        buffer.fill(s.trunk);
        const spill = surfaceInk(s.neuron.pigment, 1.03, (0.48 + 0.49 * emission) * depth ** 0.72);
        emissionPen.strokeStyle = emissionPen.fillStyle = spill;
        emissionPen.fill(s.trunk);
        emissionPen.stroke(s.trunk);
        buffer.globalAlpha = 0.7;
        buffer.fillStyle = surfaceInk(s.neuron.pigment, 1.07, depth);
        buffer.fill(s.facet);
        if (s.hasSoma) somaSurface(s.neuron);
      }
    });
    buffer.globalAlpha = 1;
  }
  function geometry(force = false) {
    const a = yaw + Math.sin(autoTime * 0.11) * 0.21,
      b = pitch + Math.sin(autoTime * 0.072) * 0.1;
    // Reuse the projected layer when slow camera drift moves it by less than a pixel.
    if (
      !force &&
      Math.abs(a - lastYaw) < (gpu ? 0.0003 : 0.0027) &&
      Math.abs(b - lastPitch) < (gpu ? 0.0003 : 0.0027)
    )
      return;
    lastYaw = a;
    lastPitch = b;
    project = camera(a, b);
    epoch++;
    if (posterActive) return;
    if (gpu) {
      gpu.draw(a, b, scale, offsetX, offsetY, fiberScale, lightTheme);
      return;
    }
    buffer.setTransform(1, 0, 0, 1, 0, 0);
    buffer.globalAlpha = 1;
    buffer.fillStyle = lightTheme ? "#fff" : "#000";
    buffer.fillRect(0, 0, background.width, background.height);
    buffer.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    drawFallback();
    scatterLight();
  }
  function pulseVisibleArbor() {
    const pool = cycle % 4 === 3 ? neurons : featured;
    for (let i = 0; i < pool.length; i++) {
      const neuron = pool[(cycle * 19 + i * 7 + 2) % pool.length];
      const signal = neuron.signals[cycle % neuron.signals.length];
      if (!signal) continue;
      const j = Math.floor((signal.points.length - 1) * (0.33 + 0.3 * ((cycle % 3) / 2)));
      const sample = project(neuron.points[signal.points[j]]);
      const x = (offsetX + scale * sample.x) / canvas.width;
      const y = (offsetY + scale * sample.y) / canvas.height;
      if (x < (compactLayout.matches ? 0.06 : 0.43) || x > 0.94 ||
          y < (compactLayout.matches ? 0.18 : 0.06) || y > 0.83) continue;
      const duration = Math.max(0.56, Math.min(2.3, signal.length / 112));
      pulses.push({
        neuron, signal, duration,
        born: clock - duration * signal.distances[j] / signal.length,
      });
      break;
    }
  }
  function at(neuron: Neuron, signal: Signal, distance: number) {
    let i = 1;
    while (i < signal.points.length - 1 && signal.distances[i] < distance) i++;
    const factor = Math.max(
      0,
      Math.min(
        1,
        (distance - signal.distances[i - 1]) /
          (signal.distances[i] - signal.distances[i - 1] || 1),
      ),
    );
    const a = neuron.projected[signal.points[i - 1]],
      b = neuron.projected[signal.points[i]];
    return {
      x: a.x + (b.x - a.x) * factor,
      y: a.y + (b.y - a.y) * factor,
      z: a.z + (b.z - a.z) * factor,
    };
  }
  function paint() {
    geometry();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (gpu || posterActive) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else ctx.drawImage(background, 0, 0);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    pulses = pulses.filter((p) => clock - p.born <= p.duration);
    for (const p of pulses) {
      if (clock < p.born) continue;
      locate(p.neuron);
      const distance = ((clock - p.born) / p.duration) * p.signal.length;
      const head = at(p.neuron, p.signal, distance);
      const elapsed = (clock - p.born) / p.duration;
      const fade =
        Math.min(1, elapsed * 10, (1 - elapsed) * 10) *
        (0.28 + 0.64 * brightness(head.z));
      ctx.lineCap = "round";
      function stroke(
        tail: number,
        width: number,
        color: string,
        alpha: number,
      ) {
        ctx.beginPath();
        for (let i = 0; i <= 5; i++) {
          const pos = at(
            p.neuron,
            p.signal,
            Math.max(0, distance - tail * (1 - i / 5)),
          );
          if (i === 0) ctx.moveTo(pos.x, pos.y);
          else ctx.lineTo(pos.x, pos.y);
        }
        ctx.strokeStyle = color;
        ctx.globalAlpha = fade * alpha;
        ctx.lineWidth = width;
        ctx.stroke();
      }
      stroke(14, 2.55, p.neuron.color, 0.47);
      stroke(
        7.5,
        1.15,
        lightTheme ? "#885a33" : "#f9e5bc",
        p.neuron.material.emission ? 0.92 : 0.48,
      );
      ctx.globalAlpha = 1;
    }
    waves = waves.filter((w) => (clock - w.born) * w.speed < w.extent + 37);
    for (const wave of waves) drawWave(wave, (clock - wave.born) * wave.speed);
    if (stillWave) drawWave(stillWave, 28);
  }

  function drawWave(w: Wave, radius: number) {
    const { neuron, edgeIndex, fraction } = w.hit;
    locate(neuron);
    const origin = neuron.edges[edgeIndex];
    const pa = neuron.projected[origin.a],
      pb = neuron.projected[origin.b];
    const x = pa.x + (pb.x - pa.x) * fraction,
      y = pa.y + (pb.y - pa.y) * fraction;
    const ink = neuron.color,
      trail = 26;
    const attenuation =
      Math.exp(-radius / (origin.axon ? 580 : 195)) *
      (0.66 + 0.34 * brightness(pa.z + (pb.z - pa.z) * fraction));
    const core = Math.min(2.7, Math.max(1.25, (origin.r1 + origin.r2) * 1.25));
    ctx.lineCap = "round";
    // Each band is clipped in graph distance, so the light follows true cell
    // geometry and splits exactly where the dendrite forks.
    function band(
      start: number,
      end: number,
      width: number,
      alpha: number,
      color: string,
    ) {
      if (end <= 0) return;
      ctx.beginPath();
      for (const seg of w.segments) {
        if (seg.start > end) break;
        if (seg.end <= start) continue;
        const span = seg.end - seg.start;
        const t1 =
          seg.from +
          (seg.to - seg.from) * Math.max(0, (start - seg.start) / span);
        const t2 =
          seg.from +
          (seg.to - seg.from) * Math.min(1, (end - seg.start) / span);
        const a = neuron.projected[seg.a],
          b = neuron.projected[seg.b];
        ctx.moveTo(a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1);
        ctx.lineTo(a.x + (b.x - a.x) * t2, a.y + (b.y - a.y) * t2);
      }
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.stroke();
    }
    band(radius - trail, radius, core + 5, 0.25 * attenuation, ink);
    band(
      radius - 17,
      radius,
      core + 1.1,
      0.97 * attenuation,
      lightTheme ? "#aa6338" : "#ffe4a5",
    );
    band(
      radius - 8.5,
      radius,
      core * 0.82,
      attenuation,
      lightTheme ? "#663751" : "#fffbea",
    );
    if (radius < 38 || stillWave === w) {
      const intensity = stillWave === w ? 1 : Math.max(0, 1 - radius / 38);
      const size = 13 + radius * 0.08;
      ctx.globalAlpha = intensity * 0.9;
      ctx.drawImage(halos.get(ink)!, x - size / 2, y - size / 2, size, size);
      if (w.touch && (w.touch.x - x) ** 2 + (w.touch.y - y) ** 2 > 5) {
        ctx.globalAlpha = intensity * 0.53;
        ctx.drawImage(
          halos.get(ink)!,
          w.touch.x - size * 0.6,
          w.touch.y - size * 0.6,
          size * 1.2,
          size * 1.2,
        );
      }
      ctx.globalAlpha = intensity;
      ctx.fillStyle = lightTheme ? "#693b48" : "#fff9d6";
      ctx.beginPath();
      ctx.arc(x, y, core * 0.61, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function tick(time: number) {
    frame = 0;
    if (!visible || document.hidden) return;
    if (previous && time - drawn < 1000 / 30) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const dt = previous ? Math.min(0.09, (time - previous) / 1000) : 0;
    previous = time;
    drawn = time;
    clock += dt;
    const auto = !paused && !motion.matches;
    if (auto && !dragging && !posterActive) autoTime += dt;
    if (auto && clock >= ambient) {
      pulseVisibleArbor();
      cycle++;
      ambient = clock + 0.48 + 0.19 * (0.5 + 0.5 * Math.sin(cycle * 2.7));
    }
    paint();
    if (auto) frame = requestAnimationFrame(tick);
    else previous = 0;
  }
  function play() {
    if (!frame && visible && !document.hidden)
      frame = requestAnimationFrame(tick);
  }
  function resetTiming() {
    previous = 0;
    cancelAnimationFrame(frame);
    frame = 0;
    if (motion.matches || paused) {
      pulses = [];
      waves = [];
    }
    playback.hidden = motion.matches;
    playback.toggleAttribute("data-paused", paused);
    playback.title = paused ? "Play animation" : "Pause animation";
    playback.setAttribute("aria-label", playback.title);
    play();
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      1.65,
      Math.sqrt(1900000 / Math.max(1, rect.width * rect.height)),
    );
    const w = Math.max(1, Math.round(rect.width * dpr)),
      h = Math.max(1, Math.round(rect.height * dpr));
    if (
      w !== canvas.width ||
      h !== canvas.height ||
      !Number.isFinite(lastYaw)
    ) {
      fiberScale = Math.max(
        0.85,
        Math.min(1.1, 850 / Math.max(rect.width, rect.height)),
      );
      canvas.width = w;
      canvas.height = h;
      if (gpu) {
        glCanvas.width = w;
        glCanvas.height = h;
      } else {
        background.width = w;
        background.height = h;
        for (const { layer, divisor } of scattering) {
          layer.width = Math.max(1, Math.ceil(w / divisor));
          layer.height = Math.max(1, Math.ceil(h / divisor));
        }
      }
      scale = Math.max(w / W, h / H) * 1.05;
      offsetX = w / 2 - 318 * scale;
      offsetY = h / 2 - 189 * scale;
      geometry(true);
      paint();
    }
  }
  function surfaceDepth(neuron: Neuron, point: { x: number; y: number }) {
    const soma = neuron.projected[neuron.somaIndex];
    if (
      Math.hypot(point.x - soma.x, point.y - soma.y) >
      neuron.surfaceRadius * soma.size * 1.1
    )
      return -Infinity;
    let front = -Infinity;
    for (const face of neuron.triangles) {
      const a = neuron.projected[face.a],
        b = neuron.projected[face.b],
        c = neuron.projected[face.c];
      const bx = b.x - a.x,
        by = b.y - a.y,
        cx = c.x - a.x,
        cy = c.y - a.y,
        px = point.x - a.x,
        py = point.y - a.y;
      const det = bx * cy - by * cx;
      if (Math.abs(det) < 0.00001) continue;
      const u = (px * cy - py * cx) / det,
        v = (bx * py - by * px) / det;
      if (u >= 0 && v >= 0 && u + v <= 1)
        front = Math.max(front, a.z + u * (b.z - a.z) + v * (c.z - a.z));
    }
    return front;
  }
  function choose(point: { x: number; y: number }) {
    let hit: Hit | undefined;
    let best = Infinity,
      front = -Infinity,
      covered = false;
    for (const neuron of sorted) {
      locate(neuron);
      let localDistance = Infinity,
        localIndex = 0,
        localFraction = 0;
      for (let i = 0; i < neuron.edges.length; i++) {
        const edge = neuron.edges[i];
        const a = neuron.projected[edge.a],
          b = neuron.projected[edge.b];
        const dx = b.x - a.x,
          dy = b.y - a.y;
        const f = Math.max(
          0,
          Math.min(
            1,
            ((point.x - a.x) * dx + (point.y - a.y) * dy) /
              (dx * dx + dy * dy || 1),
          ),
        );
        const sx = point.x - a.x - f * dx,
          sy = point.y - a.y - f * dy;
        const center = Math.hypot(sx, sy);
        const depth = a.z + f * (b.z - a.z);
        const r =
          (edge.r1 + f * (edge.r2 - edge.r1)) *
          (a.size + f * (b.size - a.size)) * fiberScale *
          (edge.axon ? 1 : 1.18 + 0.14 * neuron.material.emission);
        const inside = center <= r;
        if (center < localDistance) {
          localDistance = center;
          localIndex = i;
          localFraction = f;
        }
        if (
          (inside && (!covered || depth > front)) ||
          (!covered && !inside && center - r < best)
        ) {
          covered = inside;
          front = depth;
          best = center - r;
          hit = { neuron, edgeIndex: i, fraction: f };
        }
      }
      // A membrane can obscure a crossing from a different cell. Use the
      // foreground surface and stimulate the closest traced cable it encloses.
      const meshDepth = surfaceDepth(neuron, point);
      if (meshDepth > front && Number.isFinite(localDistance)) {
        front = meshDepth;
        covered = true;
        hit = { neuron, edgeIndex: localIndex, fraction: localFraction };
      }
    }
    if (!hit) return;
    const segments = createPropagation(
      hit.neuron.edges,
      hit.neuron.points.length,
      hit.edgeIndex,
      hit.fraction,
    );
    const extent = segments.reduce((n, s) => Math.max(n, s.end), 0);
    const wave = {
      hit,
      segments,
      touch: point,
      born: clock,
      speed: Math.max(124, extent / 2.85),
      extent,
    };
    if (motion.matches || paused) {
      stillWave = wave;
      window.clearTimeout(stillTimer);
      stillTimer = window.setTimeout(() => {
        stillWave = null;
        paint();
      }, 900);
    } else {
      // Repeated touches illuminate multiple cells without stopping the ongoing activity.
      waves = [...waves.slice(-7), wave];
    }
    paint();
    play();
  }

  let down: { x: number; y: number; a: number; b: number } | null = null;
  let moved = false;
  stimulus.addEventListener("pointerdown", (e) => {
    if (!e.isPrimary || e.button !== 0) return;
    down = { x: e.clientX, y: e.clientY, a: yaw, b: pitch };
    moved = false;
  });
  stimulus.addEventListener("pointermove", (e) => {
    if (!e.isPrimary || !down) return;
    const dx = e.clientX - down.x,
      dy = e.clientY - down.y;
    if (!moved && Math.hypot(dx, dy) < 6) return;
    moved = true;
    if (e.pointerType === "touch" && !dragging && Math.abs(dy) > Math.abs(dx))
      return;
    if (!dragging) {
      dragging = true;
      if (posterActive) {
        posterActive = false;
        figure.classList.remove("poster-active");
      }
      stimulus.setPointerCapture(e.pointerId);
    }
    yaw = down.a + dx * 0.007;
    pitch = Math.max(-0.95, Math.min(0.95, down.b + dy * 0.005));
    geometry();
    paint();
  });
  function release() {
    down = null;
    dragging = false;
  }
  stimulus.addEventListener("pointerup", release);
  stimulus.addEventListener("pointercancel", () => {
    moved = true;
    release();
  });
  stimulus.addEventListener("lostpointercapture", release);
  stimulus.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    if (e.detail === 0) {
      const index = cycle++;
      const y = 0.4 + 0.16 * Math.cos(index * 1.71);
      return choose({
        x:
          (canvas.width * (0.6 + 0.19 * Math.sin(index * 2.27)) - offsetX) /
          scale,
        y: (canvas.height * y - offsetY) / scale,
      });
    }
    if (moved) return;
    if (e.clientY < r.top || e.clientY > r.bottom) return;
    choose({
      x: (((e.clientX - r.left) * canvas.width) / r.width - offsetX) / scale,
      y: (((e.clientY - r.top) * canvas.height) / r.height - offsetY) / scale,
    });
  });
  playback.addEventListener("click", () => {
    paused = !paused;
    resetTiming();
  });
  new MutationObserver(() => {
    const next = document.documentElement.dataset.theme === "light";
    if (next === lightTheme) return;
    lightTheme = next;
    applyMaterials();
    geometry(true);
    paint();
  }).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  motion.addEventListener("change", resetTiming);
  document.addEventListener("visibilitychange", resetTiming);
  glCanvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    if (!gpu) return;
    gpu = null;
    figure.classList.remove("with-gpu");
    lastYaw = NaN;
    resize();
    play();
  });
  new ResizeObserver(resize).observe(stimulus);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    resetTiming();
  }).observe(figure);
  resize();
  figure.classList.add("ready");
  stimulus.disabled = false;
}
