import type { Cell, Point3 } from "@/data/dendrites";
import { mapCells } from "../data/neuron-scheduling";
import { somaSprite } from "./soma-sprite";
import { initNeuronGL } from "./neuron-gl";
import {
  cellMaterial,
  endpointRadii,
  focalGlow,
  somaAxes,
} from "./neuron-style";
import {
  between, nextCharge, planSpread, pulseTravelRate, recruitedCount, relayContact, traceArbor,
  toHsl, transferColor, type Stimulus,
} from "./neuron-wave";

const W = 640,
  H = 405;
const pulseHaloWidth = 3.15, pulseCoreWidth = 1.08;
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
  const incident: number[][] = Array.from({ length: points.length }, () => []);
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
      incident[a].push(edges.length - 1);
      incident[b].push(edges.length - 1);
    }
  }
  // Neighboring edges in the file follow the same cable. Enclose short runs
  // once so a tap need only project the skeletons directly under the pointer.
  const pickGroups = [];
  for (let start = 0; start < edges.length; start += 20) {
    const end = Math.min(start + 20, edges.length);
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity, width = 0;
    for (let i = start; i < end; i++) {
      const e = edges[i], a = points[e.a], b = points[e.b];
      minX = Math.min(minX, a.x, b.x); maxX = Math.max(maxX, a.x, b.x);
      minY = Math.min(minY, a.y, b.y); maxY = Math.max(maxY, a.y, b.y);
      minZ = Math.min(minZ, a.z, b.z); maxZ = Math.max(maxZ, a.z, b.z);
      width = Math.max(width, e.r1, e.r2);
    }
    pickGroups.push({
      start, end, center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 },
      radius: 0.5 * Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) + 1.5 * width,
    });
  }
  // Sample graph vertices in the component connected to the soma.
  const visited = new Uint8Array(points.length);
  const queue = [somaIndex];
  visited[somaIndex] = 1;
  for (let i = 0; i < queue.length; i++) {
    for (const edgeId of incident[queue[i]]) {
      const { a, b } = edges[edgeId];
      const next = a === queue[i] ? b : a;
      if (!visited[next]) { visited[next] = 1; queue.push(next); }
    }
  }
  const contacts: number[] = [];
  const stride = Math.max(1, Math.ceil(queue.length / 48));
  for (let i = 0; i < queue.length; i += stride) contacts.push(queue[i]);
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
    waveHighlight: "",
    somaHighlight: "",
    hue: toHsl(pigment),
    contacts, incident, pickGroups,
    shape,
    axisTip,
    points,
    edges,
    epoch: -1,
    projected: [] as Projected[],
    somaIndex,
  };
}
type Neuron = ReturnType<typeof prepare>;
const fadeDuration = 0.45;
const somaDecayTime = 0.65, somaGlowDuration = 1.8;
const somaCutoff = Math.exp(-somaGlowDuration / somaDecayTime);
// Give relays time to cross the field at the configured speed, then fade.
const burstDuration = 2.34 / pulseTravelRate + fadeDuration;
type Hit = { neuron: Neuron; edgeIndex: number; fraction: number; onSoma?: boolean };
type Pattern = ReturnType<typeof traceArbor>;
type Bridge = { from: Neuron; start: Point3; end: Point3; born: number; duration: number };
type Front = { cell: Neuron; pattern: Pattern; born: number; decay: number; bridge?: Bridge };
type Spread = {
  nodes: ReturnType<typeof planSpread<Neuron>>;
  limit: number;
  pending: number;
  nextLaunch: number;
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

export async function activateNeuron(figure: HTMLElement, cells: Cell[]) {
  const stimulus = figure.querySelector<HTMLButtonElement>(".stimulus")!;
  const canvas = figure.querySelector<HTMLCanvasElement>(".volume-activity")!;
  const glCanvas = figure.querySelector<HTMLCanvasElement>(".volume-geometry")!;
  const context = canvas.getContext("2d");
  if (!context) return;
  const ctx = context;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const [renderer, neurons] = await Promise.all([
    initNeuronGL(glCanvas, cells).catch(() => null),
    mapCells(cells, prepare),
  ]);
  let gpu = renderer;
  figure.classList.toggle("with-gpu", Boolean(gpu));
  figure.classList.toggle("software-rendered", !gpu);
  const sorted = neurons.slice();
  const featured = neurons.filter(n => n.material.emission > 0);
  const halos = new Map<string, HTMLCanvasElement>();
  let lightTheme = document.documentElement.dataset.theme === "light";
  function applyMaterials() {
    halos.clear();
    for (const n of neurons) {
      n.pigment = lightTheme ? n.material.lightPigment : n.material.pigment;
      n.color = colorAt(n.pigment, 1);
      // Lift the wavefront with a little white while preserving the arbor's hue.
      const gain = lightTheme ? 1 : 255 / Math.max(...n.pigment);
      const tint = lightTheme ? 0.08 : 0.15;
      const highlight = n.pigment.map(c => Math.round(c * gain * (1 - tint) + 255 * tint));
      n.hue = toHsl(highlight);
      n.waveHighlight = `rgb(${highlight.join(",")})`;
      n.somaHighlight = colorAt(highlight.map(c => c + (255 - c) * .28), 1);
      if (!halos.has(n.color)) halos.set(n.color, halo(n.color));
    }
  }
  applyMaterials();
  let flights: Front[] = [], inputs: Front[] = [], spreads: Spread[] = [];
  const somaHits = new Map<Neuron, number>();
  const cableMasks = new Set<Neuron>();
  const somaSprites = new WeakMap<Neuron, {
    yaw: number; pitch: number; color: string; body: ReturnType<typeof somaSprite>;
  }>();
  let stillFront: Front | undefined;
  let lastPattern: { cell: Neuron; stimulus: Stimulus; pattern: Pattern } | undefined;
  let lastTap = -Infinity, charge = 0, endsAt = -Infinity;
  let stillCells: Neuron[] = [];
  let stillTimer = 0;
  let yaw = initialYaw, pitch = initialPitch, clock = 0, cycle = 0;
  let driftTime = 0, holdViewUntil = 0;
  let visible = true, paused = false, frame = 0, drawn = -Infinity,
    scale = 1,
    offsetX = 0,
    offsetY = 0;
  let fiberScale = 1;
  const touchDevice = navigator.maxTouchPoints > 0;
  let viewPending = false;
  let scrolling = false;
  let scrollTimer = 0;
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
        neuron.projected[i] = project(neuron.points[i], neuron.projected[i]);
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
          (lightTheme ? 0.94 : 1);
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
        buffer.globalAlpha = lightTheme ? 0.42 : 0.63;
      } else if (divisor === 6) {
        buffer.globalAlpha = lightTheme ? 0.21 : 0.33;
      } else {
        // Overlapping halos retain the lit surface color on white.
        buffer.globalCompositeOperation = lightTheme ? "darken" : "screen";
        buffer.globalAlpha = (divisor === 12 ? 0.55 : 0.79) * (lightTheme ? 0.78 : 1);
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
    const a = yaw + Math.sin(driftTime * 0.11) * 0.21;
    const b = pitch + Math.sin(driftTime * 0.072) * 0.10;
    // Reuse the tissue while only the click overlay is moving.
    const threshold = gpu ? (touchDevice ? 0.0021 : 0.00065) : 0.0027;
    if (
      !force &&
      !viewPending &&
      Math.abs(a - lastYaw) < threshold &&
      Math.abs(b - lastPitch) < threshold
    )
      return;
    if (!force && gpu && !gpu.readyToDraw()) return;
    viewPending = false;
    lastYaw = a;
    lastPitch = b;
    project = camera(a, b);
    epoch++;
    if (gpu) {
      gpu.draw(a, b, scale, offsetX, offsetY, fiberScale, lightTheme);
      return;
    }
    // Composite the cached software tissue below the transparent activity
    // canvas. A pulse can now advance without copying the entire frame.
    if (!background.parentNode) {
      background.setAttribute("aria-hidden", "true");
      background.className = "volume-software";
      canvas.before(background);
    }
    if (background.width !== canvas.width || background.height !== canvas.height) {
      background.width = canvas.width;
      background.height = canvas.height;
      for (const { layer, divisor } of scattering) {
        layer.width = Math.max(1, Math.ceil(canvas.width / divisor));
        layer.height = Math.max(1, Math.ceil(canvas.height / divisor));
      }
    }
    buffer.setTransform(1, 0, 0, 1, 0, 0);
    buffer.globalAlpha = 1;
    buffer.fillStyle = lightTheme ? "#fff" : "#000";
    buffer.fillRect(0, 0, background.width, background.height);
    buffer.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    drawFallback();
    scatterLight();
  }
  function paint() {
    geometry();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    paintStimulus();
  }

  function stampSoma(n: Neuron, mask: boolean, intensity = 1) {
    const p = project(n.cell.soma);
    let entry = somaSprites.get(n);
    // Sub-pixel camera drift can reuse the stamp at its new projected center.
    if (!entry || entry.color !== n.color || Math.abs(lastYaw - entry.yaw) > .018 ||
        Math.abs(lastPitch - entry.pitch) > .018) {
      const image = entry?.body.image ?? document.createElement("canvas");
      const body = somaSprite(n.cell, project, p, n.axisTip, n.shape.elongation, n.waveHighlight, n.somaHighlight, image);
      entry = { body, yaw: lastYaw, pitch: lastPitch, color: n.color };
      somaSprites.set(n, entry);
    }
    const body = entry.body, zoom = p.size / body.size;
    if (!mask) {
      const r = Math.max(n.cell.radius * p.size * 2.3, .72 * zoom * Math.max(body.width, body.height));
      ctx.globalAlpha = intensity * .65;
      ctx.drawImage(halos.get(n.color)!, p.x - r, p.y - r, 2 * r, 2 * r);
    }
    ctx.globalAlpha = intensity;
    ctx.drawImage(body.image, p.x + body.left * zoom, p.y + body.top * zoom, body.width * zoom, body.height * zoom);
  }

  function drawBridge(front: Front, bridge: Bridge, fade: number) {
    cableMasks.add(bridge.from);
    cableMasks.add(front.cell);
    const head = Math.min(1, (clock - bridge.born) / bridge.duration);
    const tail = Math.max(0, head - 0.46);
    const a = project(between(bridge.start, bridge.end, tail));
    const b = project(between(bridge.start, bridge.end, head));
    const ink = (t: number) => transferColor(bridge.from.hue, front.cell.hue, t);
    const gradient = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
    gradient.addColorStop(0, ink(tail));
    gradient.addColorStop(0.5, ink((tail + head) / 2));
    gradient.addColorStop(1, ink(head));
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = gradient;
    ctx.lineCap = "round";
    ctx.lineWidth = pulseHaloWidth; ctx.globalAlpha = 0.21 * fade; ctx.stroke();
    ctx.lineWidth = pulseCoreWidth; ctx.globalAlpha = 0.97 * fade; ctx.stroke();
  }

  const cablePoint = { x: 0, y: 0, z: 0 };
  const cableScreen = { x: 0, y: 0, z: 0, size: 1 };
  function projectCable(a: Point3, b: Point3, t: number) {
    cablePoint.x = a.x + (b.x - a.x) * t;
    cablePoint.y = a.y + (b.y - a.y) * t;
    cablePoint.z = a.z + (b.z - a.z) * t;
    return project(cablePoint, cableScreen);
  }

  // Only visit cable pieces whose travel times intersect this frame. All
  // illuminated branches share one stroke path and two paint passes per cell.
  function drawCables(front: Front, tail: number, head: number, still: boolean, fade = 1) {
    const { bands, longest } = front.pattern;
    let lo = 0, hi = bands.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (bands[mid].start < tail - longest) lo = mid + 1;
      else hi = mid;
    }
    let pieces = 0;
    ctx.beginPath();
    for (let i = lo; i < bands.length; i++) {
      const b = bands[i];
      if (b.start >= head) break;
      if (b.end <= tail) continue;
      const rate = (b.to - b.from) / (b.end - b.start);
      const f = b.from + (Math.max(b.start, tail) - b.start) * rate;
      const t = b.from + (Math.min(b.end, head) - b.start) * rate;
      const p = front.cell.points[b.a], q = front.cell.points[b.b];
      const a = projectCable(p, q, f);
      ctx.moveTo(a.x, a.y);
      const z = projectCable(p, q, t);
      ctx.lineTo(z.x, z.y);
      pieces++;
    }
    if (!pieces) return;
    cableMasks.add(front.cell);
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.strokeStyle = front.cell.color;
    ctx.lineWidth = still ? 2.43 : pulseHaloWidth;
    ctx.globalAlpha = still ? 0.14 : 0.22 * fade;
    ctx.stroke();
    ctx.strokeStyle = front.cell.waveHighlight;
    ctx.lineWidth = still ? 0.77 : pulseCoreWidth;
    ctx.globalAlpha = still ? 0.67 : 0.96 * fade;
    ctx.stroke();
  }

  function drawFront(front: Front, fade: number) {
    const { cell, pattern } = front, age = clock - front.born;
    if (age < 0) {
      if (front.bridge) drawBridge(front, front.bridge, fade);
      return;
    }
    drawCables(front, (age - 0.22 * front.decay) * pattern.speed, age * pattern.speed, false, fade);
    if (age < 0.20) {
      const p = project(pattern.origin), r = 6 * p.size;
      ctx.globalAlpha = fade * 0.9 * (1 - age / 0.20);
      ctx.drawImage(halos.get(cell.color)!, p.x - r, p.y - r, 2 * r, 2 * r);
    }
    const arrival = front.born + pattern.distance[cell.somaIndex] / pattern.speed;
    if (arrival <= clock && clock - arrival < somaGlowDuration &&
        arrival > (somaHits.get(cell) ?? -Infinity)) somaHits.set(cell, arrival);
  }

  function paintStimulus() {
    if (!inputs.length && !flights.length && !spreads.length && !stillFront && !somaHits.size) return;
    if (clock >= endsAt && !stillFront) endBurst();
    const fade = Math.min(1, Math.max(0, (endsAt - clock) / fadeDuration));
    const alive = (f: Front) => clock < f.born + f.pattern.extent / f.pattern.speed + 0.34 * f.decay;
    if (inputs.length) inputs = inputs.filter(alive);
    if (flights.length) flights = flights.filter(alive);
    for (const spread of spreads) {
      if (fade < 1 || paused || motion.matches || !spread.pending || clock < spread.nextLaunch) continue;
      // Short, fast relays let rapid taps reach the outer cells within the
      // same release window. Only a bounded number of fronts can draw at once.
      const drive = Math.max(0, spread.limit - 4) / Math.max(1, neurons.length - 4);
      const rate = 1 + 9 * drive;
      const capacity = (touchDevice ? 10 : 14) + Math.round(8 * drive);
      let slots = Math.min(1 + Math.round(3 * drive), capacity - flights.length);
      for (let i = 1; i < spread.limit && slots > 0; i++) {
        const node = spread.nodes[i], parent = spread.nodes[node.parent];
        if (node.timing || !parent.timing || parent.arrival > clock) continue;
        const { exit, entry } = node.contact ??= relayContact(parent.cell, node.cell, parent.timing.distance);
        if (clock < parent.arrival + parent.timing.distance[exit] / parent.timing.speed) continue;
        const start = parent.cell.points[exit], end = node.cell.points[entry];
        const gap = Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z);
        const duration = gap ? Math.max(0.065, Math.min(0.55, 0.12 + gap / 235) / rate) / pulseTravelRate : 0;
        const pattern = traceArbor(node.cell, { node: entry });
        pattern.speed *= rate;
        node.arrival = clock + duration;
        node.timing = { distance: pattern.distance, speed: pattern.speed };
        flights.push({ cell: node.cell, pattern, born: node.arrival, decay: 1 / Math.sqrt(rate),
          bridge: { from: parent.cell, start, end, born: clock, duration } });
        spread.pending--;
        spread.nextLaunch = clock + 0.038 / rate;
        slots--;
      }
    }
    if (!inputs.length && !flights.length && spreads.every(s => !s.pending)) spreads = [];
    for (const front of flights) drawFront(front, fade);
    for (const front of inputs) drawFront(front, fade);
    if (stillFront) drawCables(stillFront, 0, stillFront.pattern.extent + 1, true);

    if (cableMasks.size) {
      ctx.globalCompositeOperation = "destination-out";
      for (const cell of cableMasks) stampSoma(cell, true);
      ctx.globalCompositeOperation = "source-over";
      cableMasks.clear();
    }
    for (const [cell, arrival] of somaHits) {
      const age = clock - arrival;
      if (age >= somaGlowDuration) somaHits.delete(cell);
      else stampSoma(cell, false, (Math.exp(-age / somaDecayTime) - somaCutoff) / (1 - somaCutoff));
    }
    for (const cell of stillCells) stampSoma(cell, false, 0.8);
    ctx.globalAlpha = 1;
  }

  function tick(time: number) {
    frame = 0;
    if (!visible || document.hidden || scrolling) return;
    clock = time / 1000;
    const active = inputs.length || flights.length || spreads.length || somaHits.size || stillFront;
    const drifting = gpu && !paused && !motion.matches;
    const interval = active ? 1000 / 30 : 1000 / 20;
    if (!viewPending && time - drawn < interval - 0.5) {
      play();
      return;
    }
    if (drifting && clock >= holdViewUntil && Number.isFinite(drawn))
      driftTime += Math.min(0.09, (time - drawn) / 1000);
    drawn = time;
    if (active) paint();
    else geometry();
    if (drifting || viewPending || (!paused && !motion.matches &&
        (inputs.length || flights.length || somaHits.size || spreads.some(s => s.pending)))) play();
  }
  function play() {
    if (!frame && visible && !document.hidden && !scrolling)
      frame = requestAnimationFrame(tick);
  }
  function endBurst() {
    inputs = []; flights = []; spreads = [];
  }
  function clearWaves() {
    endBurst();
    somaHits.clear(); cableMasks.clear();
    stillFront = undefined; stillCells = []; lastPattern = undefined;
    charge = 0; lastTap = endsAt = -Infinity;
    window.clearTimeout(stillTimer);
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0; drawn = -Infinity;
    clearWaves();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  function resize() {
    const rect = stimulus.getBoundingClientRect();
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
      }
      scale = Math.max(w / W, h / H) * 1.05;
      offsetX = w / 2 - 318 * scale;
      offsetY = h / 2 - 189 * scale;
      geometry(true);
      paint();
    }
  }
  function surfaceDepth(neuron: Neuron, point: { x: number; y: number }) {
    const soma = project(neuron.cell.soma);
    if (
      Math.hypot(point.x - soma.x, point.y - soma.y) >
      neuron.surfaceRadius * soma.size * 1.1
    )
      return -Infinity;
    if (!neuron.triangles.length) {
      const r = neuron.cell.radius * soma.size;
      const d2 = (point.x - soma.x) ** 2 + (point.y - soma.y) ** 2;
      return d2 < r * r ? soma.z + Math.sqrt(r * r - d2) / soma.size : -Infinity;
    }
    locate(neuron);
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
  function pick(point: { x: number; y: number }) {
    // A narrow crossing fiber should not steal a tap inside a cell body.
    // Where two somas overlap, choose the nearest actual mesh surface.
    let soma: Neuron | undefined, somaDepth = -Infinity;
    for (const neuron of sorted) {
      const z = surfaceDepth(neuron, point);
      if (z > somaDepth) { soma = neuron; somaDepth = z; }
    }
    if (soma) return { neuron: soma, edgeIndex: 0, fraction: 0, onSoma: true };

    let hit: Hit | undefined, best = Infinity, front = -Infinity, covered = false;
    const center3 = { x: 0, y: 0, z: 0, size: 1 };
    const pa = { ...center3 }, pb = { ...center3 };
    for (const neuron of sorted) {
      for (const group of neuron.pickGroups) {
        const c = project(group.center, center3);
        // Bound perspective magnification at the near side of this sphere,
        // including the apparent motion of its center away from the optical axis.
        const near = Math.max(1, 800 - c.z - group.radius);
        const r = group.radius * (784 + Math.hypot(c.x - W / 2, c.y - H / 2)) / near;
        const reach = r + (covered ? 0 : Math.max(0, best));
        if ((point.x - c.x) ** 2 + (point.y - c.y) ** 2 > reach * reach) continue;
        for (let i = group.start; i < group.end; i++) {
          const edge = neuron.edges[i];
          const cached = neuron.epoch === epoch;
          const a = cached ? neuron.projected[edge.a] : project(neuron.points[edge.a], pa);
          const b = cached ? neuron.projected[edge.b] : project(neuron.points[edge.b], pb);
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
          const center = Math.sqrt(sx * sx + sy * sy);
          const depth = a.z + f * (b.z - a.z);
          const r =
            (edge.r1 + f * (edge.r2 - edge.r1)) *
            (a.size + f * (b.size - a.size)) * fiberScale *
            (edge.axon ? 1 : 1.18 + 0.14 * neuron.material.emission);
          const inside = center <= r;
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
      }
    }
    return hit;
  }

  let lastPick: { point: { x: number; y: number }; hit: Hit; epoch: number } | undefined;
  function choose(point: { x: number; y: number }, tapTime: number) {
    clock = performance.now() / 1000;
    if (clock >= endsAt) endBurst();
    const hit = lastPick && lastPick.epoch === epoch && Math.hypot(
      lastPick.point.x - point.x, lastPick.point.y - point.y,
    ) < 0.5 ? lastPick.hit : pick(point);
    if (!hit) return;
    lastPick = { point, hit, epoch };
    const n = hit.neuron;
    const interval = tapTime - lastTap;
    lastTap = tapTime;
    holdViewUntil = clock + 0.55;
    endsAt = clock + burstDuration;
    const continuing = interval < 1.5;
    charge = nextCharge(continuing ? charge : 0, interval);
    const origin: Stimulus = hit.onSoma ? { node: n.somaIndex } :
      { edge: hit.edgeIndex, fraction: hit.fraction };
    const cached = lastPattern?.cell === n ? lastPattern : undefined;
    const same = cached && ("node" in origin
      ? "node" in cached.stimulus && origin.node === cached.stimulus.node
      : "edge" in cached.stimulus && origin.edge === cached.stimulus.edge && origin.fraction === cached.stimulus.fraction);
    const pattern = same ? cached.pattern : traceArbor(n, origin);
    lastPattern = { cell: n, stimulus: origin, pattern };
    const front: Front = { cell: n, born: clock, pattern, decay: 1 };

    let spread = spreads[spreads.length - 1];
    const replay = spread && !spread.pending && recruitedCount(spread.nodes, charge) <= spread.limit;
    if (!continuing || !spread || spread.nodes[0].cell !== n || replay) {
      const nodes = planSpread(n, neurons);
      nodes[0].arrival = clock;
      nodes[0].timing = { distance: pattern.distance, speed: pattern.speed };
      spread = { nodes, limit: 1, pending: 0, nextLaunch: nodes[0].arrival };
      spreads = [spread];
    }
    const limit = Math.max(spread.limit, recruitedCount(spread.nodes, charge));
    spread.pending += limit - spread.limit;
    spread.limit = limit;
    if (motion.matches || paused) {
      stillFront = front;
      stillCells = [...new Set([n, ...spread.nodes.slice(0, limit).map(node => node.cell)])];
      window.clearTimeout(stillTimer);
      stillTimer = window.setTimeout(() => { stop(); }, 900);
      paint();
      return;
    }
    if (inputs.length >= 4) inputs.splice(1, 1);
    inputs.push(front);
    play();
  }

  function resume() {
    if (!visible || document.hidden) return;
    resize();
    if (viewPending || (gpu && !paused && !motion.matches) || inputs.length || flights.length || spreads.length || somaHits.size)
      play();
  }
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
  motion.addEventListener("change", () => { stop(); resume(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else resume();
  });
  window.addEventListener("scroll", () => {
    if (!visible || document.hidden) return;
    if (!scrolling) {
      scrolling = true;
      cancelAnimationFrame(frame);
      frame = 0;
      drawn = -Infinity;
    }
    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(() => {
      scrolling = false;
      resume();
    }, 120);
  }, { passive: true });
  glCanvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    if (!gpu) return;
    gpu = null;
    figure.classList.remove("with-gpu");
    figure.classList.add("software-rendered");
    lastYaw = NaN;
    resize();
    play();
  });
  new ResizeObserver(resize).observe(stimulus);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) stop();
    else resume();
  }).observe(figure);
  resume();
  figure.classList.add("ready");
  return {
    tap(x: number, y: number, time: number) {
      if (!visible || document.hidden) return;
      if (x < 0) {
        const i = cycle++;
        x = 0.6 + 0.19 * Math.sin(i * 2.27);
        y = 0.4 + 0.16 * Math.cos(i * 1.71);
      }
      choose({ x: (x * canvas.width - offsetX) / scale, y: (y * canvas.height - offsetY) / scale }, time);
    },
    rotate(x: number, y: number) {
      yaw = initialYaw + x;
      pitch = y;
      viewPending = true;
      holdViewUntil = performance.now() / 1000 + 0.55;
      play();
    },
    setPaused(value: boolean) {
      paused = value;
      stop();
      resume();
    },
  };
}
