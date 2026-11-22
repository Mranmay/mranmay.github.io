import type { Cell, Point3 } from "@/data/dendrites";
import { initNeuronGL } from "./neuron-gl";
import { createPropagation, type PropagationSegment } from "./neuron-wave";

const W = 640,
  H = 405;
const initialYaw = -0.15,
  initialPitch = 0.1;
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
    const size = 0.96 / (1 - z / 1200);
    result.x = W / 2 + horizontal * size;
    result.y = H / 2 + y * size;
    result.z = z;
    result.size = size;
    return result;
  };
}

function strokeWeight(width: number) {
  return Math.max(0.38, Math.round((width * 1.03 + 0.03) * 3) / 3);
}
function signalColor(hex: string) {
  const rgb = [1, 3, 5].map((start) =>
    parseInt(hex.slice(start, start + 2), 16),
  );
  const mid = (Math.min(...rgb) + Math.max(...rgb)) / 2;
  return (
    "rgb(" +
    rgb
      .map((c) =>
        Math.round(Math.min(255, Math.max(0, mid + (c - mid) * 1.32 + 12))),
      )
      .join(",") +
    ")"
  );
}

function brightness(z: number) {
  return (
    0.33 + 0.67 * Math.pow(Math.max(0, Math.min(1, (z + 165) / 305)), 0.62)
  );
}
type Projected = ReturnType<ReturnType<typeof camera>>;
type Segment = { points: number[]; width: number };
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
    width: branch.width,
    points: branch.points.map(index),
  }));
  // Batch same-weight fibers of a cell into a single stroke.
  const groups = new Map<number, Segment[]>();
  for (const branch of branches) {
    const weight = strokeWeight(branch.width);
    const group = groups.get(weight) ?? [];
    group.push(branch);
    groups.set(weight, group);
  }
  const signals: Signal[] = cell.signals
    .filter((path) => path.length > 1)
    .map((path) => {
      const distances = [0];
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1],
          b = path[i];
        distances.push(
          distances[i - 1] + Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z),
        );
      }
      return {
        points: path.map(index),
        distances,
        length: distances[distances.length - 1],
      };
    })
    .filter((path) => path.length > 0);
  const edges: { a: number; b: number; length: number }[] = [];
  const seen = new Set<string>();
  for (const branch of branches) {
    for (let i = 1; i < branch.points.length; i++) {
      const a = branch.points[i - 1],
        b = branch.points[i];
      const key = a < b ? a + "," + b : b + "," + a;
      if (a === b || seen.has(key)) continue;
      seen.add(key);
      const p = points[a],
        q = points[b];
      edges.push({ a, b, length: Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z) });
    }
  }
  const somaIndex = index(cell.soma);
  return {
    cell,
    color: signalColor(cell.color),
    points,
    groups,
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
  grad.addColorStop(0, color);
  grad.addColorStop(0.14, color);
  grad.addColorStop(1, color.replace("rgb(", "rgba(").replace(")", ",0)"));
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
  const playback = figure.querySelector<HTMLButtonElement>(".playback")!;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const neurons = cells.map(prepare);
  const sorted = neurons.slice();
  const halos = new Map(neurons.map((n) => [n.color, halo(n.color)]));
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
  function fiber(neuron: Neuron) {
    const { cell, projected } = neuron;
    const soma = projected[neuron.somaIndex];
    const light = brightness(soma.z);
    buffer.strokeStyle = neuron.color;
    buffer.fillStyle = neuron.color;
    buffer.lineCap = "round";
    buffer.lineJoin = "round";
    const radius = Math.max(1.25, cell.radius * soma.size);
    const glowSize = radius * 6;
    buffer.globalAlpha = light * 0.25;
    buffer.drawImage(
      halos.get(neuron.color)!,
      soma.x - glowSize / 2,
      soma.y - glowSize / 2,
      glowSize,
      glowSize,
    );
    buffer.globalAlpha = light;
    for (const [weight, branches] of neuron.groups) {
      buffer.lineWidth = soma.size * weight * fiberScale;
      buffer.beginPath();
      for (const branch of branches) {
        const nodes = branch.points;
        const first = projected[nodes[0]];
        buffer.moveTo(first.x, first.y);
        for (let i = 1; i < nodes.length; i++) {
          const p = projected[nodes[i]];
          buffer.lineTo(p.x, p.y);
        }
      }
      if (weight > 1.42) {
        const width = buffer.lineWidth;
        buffer.globalAlpha = light * 0.14;
        buffer.lineWidth = width * 2.8;
        buffer.stroke();
        buffer.globalAlpha = light;
        buffer.lineWidth = width;
      }
      buffer.stroke();
    }
    buffer.beginPath();
    buffer.ellipse(
      soma.x,
      soma.y,
      radius * 0.72,
      radius * 1.1,
      -0.32,
      0,
      Math.PI * 2,
    );
    buffer.fill();
    buffer.globalAlpha = light * 0.52;
    buffer.beginPath();
    buffer.ellipse(
      soma.x - radius * 0.15,
      soma.y - radius * 0.2,
      radius * 0.32,
      radius * 0.55,
      -0.32,
      0,
      Math.PI * 2,
    );
    buffer.fillStyle = "#fff";
    buffer.fill();
  }

  function geometry(force = false) {
    const a = yaw + Math.sin(autoTime * 0.15) * 0.3,
      b = pitch + Math.sin(autoTime * 0.11) * 0.15;
    // Reuse the projected layer when slow camera drift moves it by less than a pixel.
    if (
      !force &&
      Math.abs(a - lastYaw) < 0.0017 &&
      Math.abs(b - lastPitch) < 0.0017
    )
      return;
    lastYaw = a;
    lastPitch = b;
    project = camera(a, b);
    epoch++;
    if (gpu) {
      gpu.draw(a, b, scale, offsetX, offsetY, fiberScale);
      return;
    }
    buffer.setTransform(1, 0, 0, 1, 0, 0);
    buffer.globalAlpha = 1;
    buffer.fillStyle = "#000";
    buffer.fillRect(0, 0, background.width, background.height);
    buffer.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    for (const neuron of neurons) locate(neuron);
    sorted.sort(
      (a, b) => a.projected[a.somaIndex].z - b.projected[b.somaIndex].z,
    );
    for (const neuron of sorted) fiber(neuron);
    buffer.globalAlpha = 1;
  }
  function pulse(neuron: Neuron, signalIndex: number, time: number) {
    const signal = neuron.signals[signalIndex % neuron.signals.length];
    if (!signal) return;
    pulses.push({
      neuron,
      signal,
      born: time,
      duration: Math.max(0.45, Math.min(2.4, signal.length / 105)),
    });
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
    return { x: a.x + (b.x - a.x) * factor, y: a.y + (b.y - a.y) * factor };
  }
  function paint() {
    geometry();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (gpu) ctx.clearRect(0, 0, canvas.width, canvas.height);
    else ctx.drawImage(background, 0, 0);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    pulses = pulses.filter((p) => clock - p.born <= p.duration);
    for (const p of pulses) {
      if (clock < p.born) continue;
      locate(p.neuron);
      const distance = ((clock - p.born) / p.duration) * p.signal.length;
      const head = at(p.neuron, p.signal, distance);
      ctx.beginPath();
      for (let step = 0; step <= 5; step++) {
        const pos = at(
          p.neuron,
          p.signal,
          Math.max(0, distance - 19 + step * 3.8),
        );
        if (step === 0) ctx.moveTo(pos.x, pos.y);
        else ctx.lineTo(pos.x, pos.y);
      }
      ctx.strokeStyle = p.neuron.color;
      ctx.lineCap = "round";
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = p.neuron.color;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(head.x, head.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff5df";
      ctx.beginPath();
      ctx.arc(head.x, head.y, 1.45, 0, Math.PI * 2);
      ctx.fill();
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
      trail = 37;
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
    band(radius - trail, radius, 9, 0.14, ink);
    band(radius - trail, radius, 3.2, 0.95, ink);
    band(radius - 11, radius, 1.65, 1, "#ffffed");
    if (radius < 38 || stillWave === w) {
      const intensity = stillWave === w ? 1 : Math.max(0, 1 - radius / 38);
      const size = 22 + radius * 0.22;
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
      ctx.fillStyle = "#fff9d6";
      ctx.beginPath();
      ctx.arc(x, y, 2.05, 0, Math.PI * 2);
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
    if (auto && !dragging) autoTime += dt;
    if (auto && clock >= ambient) {
      for (let i = 0; i < 3; i++) {
        const neuron = neurons[(cycle * 19 + i * 17 + 2) % neurons.length];
        pulse(neuron, cycle + i, clock - i * 0.12);
      }
      cycle++;
      ambient = clock + 0.36;
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
      }
      scale = Math.max(w / W, h / H);
      offsetX = (w - scale * W) / 2;
      offsetY = (h - scale * H) / 2;
      geometry(true);
      paint();
    }
  }
  function choose(point?: { x: number; y: number }) {
    let hit: Hit | undefined;
    if (point) {
      let best = Infinity;
      for (const neuron of sorted) {
        locate(neuron);
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
          const distance = sx * sx + sy * sy;
          if (distance <= best) {
            best = distance;
            hit = { neuron, edgeIndex: i, fraction: f };
          }
        }
      }
    } else {
      const neuron = neurons[(cycle++ * 13 + 3) % neurons.length];
      if (neuron.edges.length)
        hit = {
          neuron,
          edgeIndex: Math.floor(neuron.edges.length * 0.48),
          fraction: 0.5,
        };
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
      speed: Math.max(83, extent / 3.35),
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
    if (e.detail === 0) return choose();
    if (moved) return;
    const r = canvas.getBoundingClientRect();
    choose({
      x: (((e.clientX - r.left) * canvas.width) / r.width - offsetX) / scale,
      y: (((e.clientY - r.top) * canvas.height) / r.height - offsetY) / scale,
    });
  });
  playback.addEventListener("click", () => {
    paused = !paused;
    resetTiming();
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
