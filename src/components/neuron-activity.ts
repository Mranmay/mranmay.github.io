import type { Cell, Point3 } from "@/data/dendrites";

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
  return Math.max(1, Math.round((width * 1.13 + 0.12) * 2.5) / 2.5);
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

// A static vector view is visible while the interactive field initializes.
export function volumePoster(cells: Cell[]) {
  const project = camera(initialYaw, initialPitch);
  return cells
    .map((cell) => {
      const soma = project(cell.soma);
      const groups = new Map<number, string[]>();
      for (const branch of cell.branches) {
        const width = strokeWeight(branch.width);
        const group = groups.get(width) ?? [];
        const d = branch.points
          .map((p, i) => {
            const q = project(p);
            return `${i ? "L" : "M"}${Math.round(q.x)} ${Math.round(q.y)}`;
          })
          .join("");
        group.push(d);
        groups.set(width, group);
      }
      const paths = Array.from(groups, ([width, parts]) => ({
        width,
        d: parts.join(""),
      }));
      return {
        paths,
        soma,
        radius: cell.radius * soma.size,
        color: signalColor(cell.color),
        opacity: brightness(soma.z),
      };
    })
    .sort((a, b) => a.soma.z - b.soma.z);
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
  const somaIndex = index(cell.soma);
  return {
    cell,
    color: signalColor(cell.color),
    points,
    groups,
    branches,
    signals,
    projected: points.map((): Projected => ({ x: 0, y: 0, z: 0, size: 1 })),
    somaIndex,
  };
}
type Neuron = ReturnType<typeof prepare>;
type Pulse = {
  neuron: Neuron;
  signal: Signal;
  born: number;
  duration: number;
  manual: boolean;
};

export function activateNeuron(figure: HTMLElement, cells: Cell[]) {
  const stimulus = figure.querySelector<HTMLButtonElement>(".stimulus")!;
  const canvas = figure.querySelector("canvas")!;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return;
  const ctx = context;
  const playback = figure.querySelector<HTMLButtonElement>(".playback")!;
  const clear = figure.querySelector<HTMLButtonElement>(".clear-cell")!;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const neurons = cells.map(prepare);
  const sorted = neurons.slice();
  const ring = { x: 0, y: 0, born: -Infinity };
  let selected: Neuron | null = null;
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
    scaleX = 1,
    scaleY = 1;
  let fiberScale = 1;
  let dragging = false;
  const background = document.createElement("canvas");
  const buffer = background.getContext("2d", { alpha: false })!;
  let lastYaw = NaN,
    lastPitch = NaN;

  function fiber(neuron: Neuron, chosen: boolean) {
    const { cell, projected } = neuron;
    const soma = projected[neuron.somaIndex];
    const light = brightness(soma.z);
    buffer.strokeStyle = neuron.color;
    buffer.fillStyle = neuron.color;
    buffer.lineCap = "round";
    buffer.lineJoin = "round";
    buffer.globalAlpha = chosen ? 0.99 : light * (selected ? 0.28 : 1);
    for (const [weight, branches] of neuron.groups) {
      buffer.lineWidth = (chosen ? 1.4 : 1) * soma.size * weight * fiberScale;
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
      buffer.stroke();
    }
    const radius = Math.max(1.25, cell.radius * soma.size);
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
    buffer.globalAlpha =
      (chosen ? 0.6 : light * 0.3) * (selected && !chosen ? 0.28 : 1);
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
    const a = yaw + Math.sin(autoTime * 0.16) * 0.18,
      b = pitch + Math.sin(autoTime * 0.12) * 0.07;
    // Reuse the projected layer when slow camera drift moves it by less than a pixel.
    if (
      !force &&
      Math.abs(a - lastYaw) < 0.0017 &&
      Math.abs(b - lastPitch) < 0.0017
    )
      return;
    lastYaw = a;
    lastPitch = b;
    const project = camera(a, b);
    buffer.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    buffer.globalAlpha = 1;
    buffer.fillStyle = "#000";
    buffer.fillRect(0, 0, W, H);
    for (const neuron of neurons) {
      for (let i = 0; i < neuron.points.length; i++)
        project(neuron.points[i], neuron.projected[i]);
    }
    sorted.sort(
      (a, b) => a.projected[a.somaIndex].z - b.projected[b.somaIndex].z,
    );
    for (const neuron of sorted) if (neuron !== selected) fiber(neuron, false);
    if (selected) fiber(selected, true);
    buffer.globalAlpha = 1;
  }
  function pulse(
    neuron: Neuron,
    signalIndex: number,
    time: number,
    manual = false,
  ) {
    const signal = neuron.signals[signalIndex % neuron.signals.length];
    if (!signal) return;
    pulses.push({
      neuron,
      signal,
      born: time,
      duration: Math.max(
        0.45,
        Math.min(2.4, signal.length / (manual ? 145 : 100)),
      ),
      manual,
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
    ctx.drawImage(background, 0, 0);
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0);
    pulses = pulses.filter((p) => clock - p.born <= p.duration);
    for (const p of pulses) {
      if (clock < p.born) continue;
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
      ctx.lineWidth = p.manual ? 3.1 : 2.4;
      ctx.stroke();
      ctx.fillStyle = p.neuron.color;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(head.x, head.y, p.manual ? 8 : 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff5df";
      ctx.beginPath();
      ctx.arc(head.x, head.y, p.manual ? 2.55 : 1.85, 0, Math.PI * 2);
      ctx.fill();
    }
    const age = clock - ring.born;
    if (age >= 0 && age < 0.42 && selected) {
      ctx.strokeStyle = selected.color;
      ctx.globalAlpha = 1 - age / 0.42;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, 5 + age * 40, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
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
    if (auto && !selected && clock >= ambient) {
      for (let i = 0; i < 2; i++) {
        const neuron = neurons[(cycle * 19 + i * 31 + 2) % neurons.length];
        pulse(neuron, cycle + i, clock - i * 0.18);
      }
      cycle++;
      ambient = clock + 0.43;
    } else if (auto && selected && clock >= ambient) {
      pulse(selected, cycle++, clock);
      ambient = clock + 0.72;
    }
    paint();
    if (auto || pulses.length) frame = requestAnimationFrame(tick);
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
    if (motion.matches || paused) pulses = [];
    playback.hidden = motion.matches;
    playback.toggleAttribute("data-paused", paused);
    playback.title = paused ? "Play animation" : "Pause animation";
    playback.setAttribute("aria-label", playback.title);
    play();
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
    const w = Math.max(1, Math.round(rect.width * dpr)),
      h = Math.max(1, Math.round(rect.height * dpr));
    if (
      w !== canvas.width ||
      h !== canvas.height ||
      !Number.isFinite(lastYaw)
    ) {
      fiberScale = Math.max(1, Math.min(1.45, 510 / rect.width));
      background.width = canvas.width = w;
      background.height = canvas.height = h;
      scaleX = w / W;
      scaleY = h / H;
      geometry(true);
      paint();
    }
  }
  function choose(point?: { x: number; y: number }) {
    if (!neurons[0].projected.length) geometry(true);
    let best = Infinity;
    let chosen = neurons[(cycle++ * 17 + 7) % neurons.length];
    if (point) {
      for (const neuron of sorted) {
        const centroid = neuron.projected[neuron.somaIndex];
        const dist = Math.hypot(point.x - centroid.x, point.y - centroid.y);
        let nearby = Math.max(0, dist - neuron.cell.radius);
        for (const branch of neuron.branches) {
          for (let i = 1; i < branch.points.length; i++) {
            const a = neuron.projected[branch.points[i - 1]],
              b = neuron.projected[branch.points[i]];
            const dx = b.x - a.x,
              dy = b.y - a.y;
            const t = Math.max(
              0,
              Math.min(
                1,
                ((point.x - a.x) * dx + (point.y - a.y) * dy) /
                  (dx * dx + dy * dy || 1),
              ),
            );
            nearby = Math.min(
              nearby,
              Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy),
            );
          }
        }
        const score = nearby - brightness(centroid.z) * 1.7;
        if (score <= best) {
          best = score;
          chosen = neuron;
        }
      }
      ring.x = point.x;
      ring.y = point.y;
      ring.born = clock;
    }
    selected = chosen;
    clear.hidden = false;
    pulses = [];
    if (!motion.matches && !paused) {
      chosen.signals.forEach((_, i) =>
        pulse(chosen, i, clock + i * 0.08, true),
      );
      ambient = clock + 1.8;
    }
    geometry(true);
    paint();
    play();
  }

  let down: { x: number; y: number; a: number; b: number } | null = null;
  let moved = false;
  stimulus.addEventListener("pointerdown", (e) => {
    down = { x: e.clientX, y: e.clientY, a: yaw, b: pitch };
    moved = false;
  });
  stimulus.addEventListener("pointermove", (e) => {
    if (!down) return;
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
      x: ((e.clientX - r.left) * W) / r.width,
      y: ((e.clientY - r.top) * H) / r.height,
    });
  });
  clear.addEventListener("click", () => {
    selected = null;
    clear.hidden = true;
    pulses = [];
    ring.born = -Infinity;
    ambient = clock;
    geometry(true);
    paint();
    play();
    stimulus.focus({ preventScroll: true });
  });
  playback.addEventListener("click", () => {
    paused = !paused;
    resetTiming();
  });
  motion.addEventListener("change", resetTiming);
  document.addEventListener("visibilitychange", resetTiming);
  new ResizeObserver(resize).observe(stimulus);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    resetTiming();
  }).observe(figure);
  resize();
  figure.classList.add("ready");
  figure.querySelector<HTMLElement>(".interaction-hint")!.hidden = false;
  stimulus.disabled = false;
}
