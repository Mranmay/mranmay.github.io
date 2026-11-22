import type { Cell, Point3 } from "../data/dendrites";

const vertexSource = `#version 300 es
precision highp float;
layout(location=0) in vec3 startPoint;
layout(location=1) in vec3 endPoint;
layout(location=2) in vec3 pigment;
layout(location=3) in float weight;
layout(location=4) in vec2 corner;

uniform vec4 rotation;
uniform vec2 viewport;
uniform vec4 view; // scale, offset x, offset y, fiber width multiplier
uniform bool soma;
out vec2 local;
flat out float span;
flat out float radius;
flat out vec3 color;
flat out float light;

vec3 project(vec3 p) {
  float depth = rotation.x*p.z - rotation.y*p.x;
  vec3 r = vec3(rotation.x*p.x + rotation.y*p.z,
                rotation.z*p.y - rotation.w*depth,
                rotation.z*depth + rotation.w*p.y);
  float size = .96 / (1. - r.z/1200.);
  return vec3((vec2(320.,202.5) + r.xy*size)*view.x + view.yz, r.z);
}

void main() {
  vec3 a = project(startPoint);
  vec3 b = project(endPoint);
  float z = (a.z+b.z)*.5;
  float size = .96 / (1. - z/1200.);
  vec2 tangent = b.xy - a.xy;
  span = length(tangent);
  tangent = soma || span < .001 ? vec2(1.,0.) : tangent / span;
  vec2 normal = vec2(-tangent.y,tangent.x);
  radius = soma ? max(1.25, weight*size)*view.x : weight*size*view.w*view.x*.5;
  float halo = soma ? 3. : 2.5;
  float pad = radius*halo+1.;
  float x = corner.x < 0. ? -pad : span+pad;
  float y = corner.y*pad;
  local = vec2(x,y);
  vec2 pixel = a.xy + x*tangent + y*normal;
  gl_Position = vec4(pixel/viewport*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);
  light = .33+.67*pow(clamp((z+165.)/305.,0.,1.),.62);
  color = pigment;
}`;

const fragmentSource = `#version 300 es
precision highp float;
in vec2 local;
flat in float span;
flat in float radius;
flat in vec3 color;
flat in float light;
uniform bool soma;
out vec4 pixel;
void main() {
  float coverage;
  vec3 ink = color;
  if (soma) {
    vec2 p = local/max(radius,.001);
    vec2 oriented = mat2(.949,.315,-.315,.949)*p;
    vec2 norm = oriented / vec2(.72,1.1);
    float edge = length(norm);
    float core = 1. - smoothstep(1.-.55/radius, 1.+.55/radius, edge);
    float halo = exp(-dot(p,p)*.60)*.20;
    coverage = max(core,halo);
    float shine = exp(-dot(norm+vec2(.24,.33),norm+vec2(.24,.33))*4.2);
    ink = mix(ink, vec3(1.), shine*.58*core);
  } else {
    vec2 outside = vec2(local.x - clamp(local.x,0.,span),local.y);
    float d = length(outside);
    // Integrate narrow, subpixel fibers over a one-pixel footprint.
    float core = clamp(radius+.5-d,0.,1.) - clamp(.5-radius-d,0.,1.);
    float glow = .13 * smoothstep(.6,1.25,radius) * (1.-smoothstep(radius,2.5*radius+.5,d));
    coverage = max(core,glow);
    float highlight = clamp(1.-d/max(radius,.01),0.,1.);
    ink = mix(ink,vec3(1.),.075*highlight*smoothstep(.75,1.5,radius));
  }
  float alpha = coverage*light;
  if (alpha < .003) discard;
  pixel = vec4(ink,alpha);
}`;

export function initNeuronGL(canvas: HTMLCanvasElement, cells: Cell[]) {
  let candidate: WebGL2RenderingContext | null;
  try {
    candidate = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    });
  } catch {
    return null;
  }
  if (!candidate) return null;
  const gl = candidate;

  function compile(type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }
  const vert = compile(gl.VERTEX_SHADER, vertexSource);
  const frag = compile(gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (vert && frag && program) {
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
  }
  if (vert) gl.deleteShader(vert);
  if (frag) gl.deleteShader(frag);
  if (!program || !gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (program) gl.deleteProgram(program);
    return null;
  }

  const sorted = cells.slice().sort((a, b) => a.soma.z - b.soma.z);
  const fibers: number[] = [];
  const somas: number[] = [];
  function append(
    out: number[],
    a: Point3,
    b: Point3,
    pigment: number[],
    width: number,
  ) {
    out.push(
      a.x,
      a.y,
      a.z,
      b.x,
      b.y,
      b.z,
      pigment[0],
      pigment[1],
      pigment[2],
      width,
    );
  }
  for (const cell of sorted) {
    const rgb = [1, 3, 5].map((i) => parseInt(cell.color.slice(i, i + 2), 16));
    const middle = (Math.min(...rgb) + Math.max(...rgb)) * 0.5;
    const pigment = rgb.map((c) =>
      Math.max(0, Math.min(1, (middle + (c - middle) * 1.32 + 12) / 255)),
    );
    append(somas, cell.soma, cell.soma, pigment, cell.radius);
    for (const { points, width } of cell.branches) {
      const weight = Math.max(0.38, Math.round((width * 1.03 + 0.03) * 3) / 3);
      for (let i = 1; i < points.length; i++)
        append(fibers, points[i - 1], points[i], pigment, weight);
    }
  }

  const corners = gl.createBuffer();
  if (!corners) {
    gl.deleteProgram(program);
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, corners);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  function upload(data: number[]) {
    const vao = gl.createVertexArray();
    const buffer = gl.createBuffer();
    if (!vao || !buffer) {
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      return null;
    }
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    for (let i = 0; i < 4; i++) {
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(i, i === 3 ? 1 : 3, gl.FLOAT, false, 40, i * 12);
      gl.vertexAttribDivisor(i, 1);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, corners);
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return { vao, buffer };
  }
  const lines = upload(fibers),
    points = upload(somas);
  function dispose() {
    gl.deleteBuffer(corners);
    for (const layer of [lines, points]) {
      if (layer) {
        gl.deleteVertexArray(layer.vao);
        gl.deleteBuffer(layer.buffer);
      }
    }
    gl.deleteProgram(program);
  }
  if (!lines || !points || gl.getError() !== gl.NO_ERROR) {
    dispose();
    return null;
  }
  const fiberCount = fibers.length / 10,
    somaCount = somas.length / 10;
  const view = gl.getUniformLocation(program, "view");
  const viewport = gl.getUniformLocation(program, "viewport");
  const rotation = gl.getUniformLocation(program, "rotation");
  const soma = gl.getUniformLocation(program, "soma");
  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 1);

  return {
    dispose,
    draw(
      yaw: number,
      pitch: number,
      scale: number,
      offsetX: number,
      offsetY: number,
      fiberScale: number,
    ) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(viewport, canvas.width, canvas.height);
      gl.uniform4f(
        rotation,
        Math.cos(yaw),
        Math.sin(yaw),
        Math.cos(pitch),
        Math.sin(pitch),
      );
      gl.uniform4f(view, scale, offsetX, offsetY, fiberScale);
      gl.bindVertexArray(lines.vao);
      gl.uniform1i(soma, 0);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, fiberCount);
      gl.bindVertexArray(points.vao);
      gl.uniform1i(soma, 1);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, somaCount);
    },
  };
}
