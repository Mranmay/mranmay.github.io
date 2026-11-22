import type { Cell, Point3 } from "../data/dendrites";

import { cellPigment, endpointRadii, somaAxes } from "./neuron-style";

// Each neurite segment is an instanced tapered capsule. For somas, the second
// point defines the anatomical long axis, and the second radius is its elongation.
const vertexSource = `#version 300 es
precision highp float;
layout(location=0) in vec3 startPoint;
layout(location=1) in vec3 endPoint;
layout(location=2) in vec3 pigment;
layout(location=3) in vec2 radii;
layout(location=4) in vec2 corner;
uniform vec4 rotation;
uniform vec2 viewport;
uniform vec4 view;
uniform bool soma;
uniform bool membrane;
out vec3 surfaceNormal;
out float surfaceDepth;
out vec2 local;
flat out vec2 depths;
flat out vec2 worldRadius;
flat out vec2 screenRadius;
flat out vec3 tangent;
flat out vec3 color;
flat out float span;
vec3 rotatePoint(vec3 p) {
  float depth = rotation.x*p.z - rotation.y*p.x;
  return vec3(rotation.x*p.x + rotation.y*p.z,
              rotation.z*p.y - rotation.w*depth,
              rotation.z*depth + rotation.w*p.y);
}
float projectionScale(float z) { return .98*view.x/(1.-z/800.); }
void main() {
  vec3 a = rotatePoint(startPoint);
  color = pigment;
  if (membrane) {
    vec2 pixel = a.xy*projectionScale(a.z) + vec2(320.,202.5)*view.x + view.yz;
    vec2 normalized = pixel/viewport*vec2(2.,-2.) + vec2(-1.,1.);
    float w = 1.-a.z/800.;
    gl_Position = vec4(normalized*w,-a.z*w/900.,w);
    surfaceNormal = rotatePoint(endPoint);
    surfaceDepth = a.z;
    return;
  }
  vec3 b = rotatePoint(endPoint);
  vec2 delta = b.xy*projectionScale(b.z)-a.xy*projectionScale(a.z);
  span = soma ? 0. : length(delta);
  vec2 direction = span < .0001 ? vec2(1.,0.) : delta/span;
  vec2 across = vec2(-direction.y,direction.x);
  vec3 axis = b-a;
  tangent = axis/max(length(axis),.0001);
  depths = vec2(a.z,b.z);
  worldRadius = soma ? radii : radii*view.w;
  screenRadius = worldRadius*vec2(projectionScale(a.z),projectionScale(b.z));
  if (!soma) {
    // A minimum screen footprint keeps the finest measured cables legible at
    // phone scale. Their sampled physical radii still determine surface depth.
    vec2 near = smoothstep(vec2(-165.),vec2(128.),depths);
    vec2 core = screenRadius*(1.16+.18*near);
    vec2 footprint = .31+.14*near;
    screenRadius = sqrt(core*core + footprint*footprint);
  }
  float pad = (soma ? screenRadius.x*max(1.,radii.y)*1.28 :
                      max(screenRadius.x,screenRadius.y)) + 2.0;
  local = vec2(corner.x < 0. ? -pad : span+pad, corner.y*pad);
  vec2 pixel = a.xy*projectionScale(a.z) + vec2(320.,202.5)*view.x + view.yz
               + direction*local.x + across*local.y;
  gl_Position = vec4(pixel/viewport*vec2(2.,-2.)+vec2(-1.,1.), 0., 1.);
}`;

const fragmentSource = `#version 300 es
precision highp float;
in vec2 local;
in vec3 surfaceNormal;
in float surfaceDepth;
flat in vec2 depths;
flat in vec2 worldRadius;
flat in vec2 screenRadius;
flat in vec3 tangent;
flat in vec3 color;
flat in float span;
uniform bool soma;
uniform bool fringe;
uniform bool membrane;
out vec4 pixel;
const vec3 field = vec3(0.);
const vec3 key = vec3(-.49,-.62,.61);
void main() {
  float coverage;
  float surfaceZ;
  vec3 n;
  if (membrane) {
    coverage = 1.;
    surfaceZ = surfaceDepth;
    n = normalize(surfaceNormal);
    // A crop can expose the back of a proximal process. Both sides are visible.
    if (n.z < 0.) n = -n;
  } else if (soma) {
    vec2 p = local/max(screenRadius.x,.001);
    float longitudinal = dot(p,tangent.xy);
    // A gentle narrowing toward the main process follows each cell's own axis.
    float neck = smoothstep(-.72,.98,longitudinal);
    float lateral = dot(p,vec2(-tangent.y,tangent.x));
    float asymmetry = .045*clamp(lateral,-1.,1.) * (1.-neck);
    float minor = mix(.99,.65,neck) + asymmetry;
    float major = worldRadius.y*mix(.96,1.13,neck);
    float inverseMinor = 1./(minor*minor);
    float offset = 1./(major*major)-inverseMinor;
    // Intersect an orthographic view ray with the fitted ellipsoid. Pixels just
    // beyond the silhouette are retained only for analytic edge antialiasing.
    float A = inverseMinor+offset*tangent.z*tangent.z;
    float B = offset*longitudinal*tangent.z;
    float C = inverseMinor*dot(p,p)+offset*longitudinal*longitudinal-1.;
    float footprint = sqrt(max(0.,1.+C-B*B/A));
    float edgePixels = max(fwidth(footprint),.001);
    coverage = clamp(.5+(1.-footprint)/edgePixels,0.,1.);
    float root = (-B+sqrt(max(0.,B*B-A*C)))/A;
    vec3 samplePoint = vec3(p,root);
    n = normalize(samplePoint*inverseMinor+tangent*(offset*dot(samplePoint,tangent)));
    surfaceZ = depths.x + root*worldRadius.x;
  } else {
    float along = clamp(local.x/max(span,.0001),0.,1.);
    float radius = max(.001,mix(screenRadius.x,screenRadius.y,along));
    float world = mix(worldRadius.x,worldRadius.y,along);
    vec2 radial = vec2(local.x-clamp(local.x,0.,span),local.y);
    float dist = length(radial);
    float center = mix(depths.x,depths.y,along);
    float aperture = 1.+.62*(1.-smoothstep(-150.,72.,center));
    coverage = clamp((radius+.5*aperture-dist)/aperture,0.,1.)
             - clamp((.5*aperture-radius-dist)/aperture,0.,1.);
    float incline = length(tangent.xy);
    vec2 dir = incline < .0001 ? vec2(1.,0.) : tangent.xy/incline;
    vec3 across = vec3(-dir.y,dir.x,0.);
    float front = sqrt(max(0.,1.-dot(radial,radial)/(radius*radius)));
    if (local.x < 0. || local.x > span || span < .001) {
      n = normalize(across*radial.y/radius + vec3(dir*radial.x/radius,front));
      surfaceZ = center+world*front;
    } else {
      vec3 face = vec3(-dir*tangent.z,incline);
      n = normalize(across*clamp(radial.y/radius,-1.,1.)+face*front);
      surfaceZ = center + world*front/max(.4,incline);
    }
  }
  // Opaque surfaces populate depth first. A second pass blends the uncovered
  // footprint without letting a translucent edge erase geometry behind it.
  if (coverage < .008 || ((coverage < .88) != fringe)) discard;
  gl_FragDepth = clamp(.5-surfaceZ/1800.,0.,1.);
  float diffuse = clamp(.13+.87*dot(n,key),0.,1.);
  float rim = pow(1.-abs(n.z),2.);
  float lighting = clamp(.69+.29*diffuse+.06*rim,0.,1.);
  float transmittance = .48+.52*smoothstep(-165.,128.,surfaceZ);
  // Depth attenuates brightness while preserving each segment's false color.
  pixel = vec4(mix(field,color*lighting,transmittance),fringe ? coverage : 1.);
}`;

function softenContour(points: Point3[]): Point3[] {
  return points.map((p, index) => {
    if (index === 0 || index === points.length - 1) return p;
    const a = points[index - 1],
      b = points[index + 1];
    const da = Math.hypot(a.x - p.x, a.y - p.y, a.z - p.z);
    const db = Math.hypot(b.x - p.x, b.y - p.y, b.z - p.z);
    if (!da || !db) return p;
    const step = 0.24 * Math.min(da, db);
    const dx = step * ((a.x - p.x) / da + (b.x - p.x) / db);
    const dy = step * ((a.y - p.y) / da + (b.y - p.y) / db);
    const dz = step * ((a.z - p.z) / da + (b.z - p.z) / db);
    const ratio = Math.min(1, 0.72 / (Math.hypot(dx, dy, dz) || 1));
    return { x: p.x + dx * ratio, y: p.y + dy * ratio, z: p.z + dz * ratio };
  });
}

type Surface = NonNullable<Cell["surface"]>;

// Sum the oriented face-area vectors, then normalize once per shared vertex.
function appendSurface(
  cell: Cell,
  surface: Surface,
  pigment: number[],
  packed: number[],
  triangles: number[],
) {
  const { positions, indices } = surface;
  const normals = new Float32Array(positions.length);
  const base = packed.length / 9;
  for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i] * 3,
      b = indices[i + 1] * 3,
      c = indices[i + 2] * 3;
    const bx = positions[b] - positions[a],
      by = positions[b + 1] - positions[a + 1],
      bz = positions[b + 2] - positions[a + 2];
    const cx = positions[c] - positions[a],
      cy = positions[c + 1] - positions[a + 1],
      cz = positions[c + 2] - positions[a + 2];
    const nx = by * cz - bz * cy,
      ny = bz * cx - bx * cz,
      nz = bx * cy - by * cx;
    for (const offset of [a, b, c]) {
      normals[offset] += nx;
      normals[offset + 1] += ny;
      normals[offset + 2] += nz;
    }
    triangles.push(
      base + indices[i],
      base + indices[i + 1],
      base + indices[i + 2],
    );
  }
  for (let i = 0; i < positions.length; i += 3) {
    const magnitude =
      Math.hypot(normals[i], normals[i + 1], normals[i + 2]) || 1;
    packed.push(
      cell.soma.x + positions[i],
      cell.soma.y + positions[i + 1],
      cell.soma.z + positions[i + 2],
      normals[i] / magnitude,
      normals[i + 1] / magnitude,
      normals[i + 2] / magnitude,
      ...pigment,
    );
  }
}

export function initNeuronGL(canvas: HTMLCanvasElement, cells: Cell[]) {
  let candidate: WebGL2RenderingContext | null;
  try {
    candidate = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: true,
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
  const meshVertices: number[] = [],
    triangles: number[] = [];
  function append(
    out: number[],
    a: Point3,
    b: Point3,
    pigment: number[],
    radiusA: number,
    radiusB: number,
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
      radiusA,
      radiusB,
    );
  }
  for (const cell of sorted) {
    const pigment = cellPigment(cell.color).map((component) => component / 255);
    const surface = cell.surface;
    if (surface?.indices.length) {
      appendSurface(cell, surface, pigment, meshVertices, triangles);
    } else {
      const { axis, elongation } = somaAxes(cell);
      const pivot = cell.soma;
      append(
        somas,
        pivot,
        { x: pivot.x + axis.x, y: pivot.y + axis.y, z: pivot.z + axis.z },
        pigment,
        cell.radius,
        elongation,
      );
    }
    for (const branch of cell.branches) {
      const fiberPigment = branch.axon
        ? pigment.map((component) => component * 0.91)
        : pigment;
      const samples = endpointRadii(branch),
        points = softenContour(branch.points);
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i];
        if (a.x === b.x && a.y === b.y && a.z === b.z) continue;
        append(fibers, a, b, fiberPigment, samples[i - 1], samples[i]);
      }
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
  function upload(data: number[], instanced = true) {
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
    for (let i = 0; i < (instanced ? 4 : 3); i++) {
      gl.enableVertexAttribArray(i);
      gl.vertexAttribPointer(
        i,
        i === 3 ? 2 : 3,
        gl.FLOAT,
        false,
        instanced ? 44 : 36,
        i * 12,
      );
      gl.vertexAttribDivisor(i, instanced ? 1 : 0);
    }
    if (instanced) {
      gl.bindBuffer(gl.ARRAY_BUFFER, corners);
      gl.enableVertexAttribArray(4);
      gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 0, 0);
    }
    gl.bindVertexArray(null);
    return { vao, buffer };
  }
  const lines = upload(fibers),
    points = upload(somas);
  const mesh = triangles.length ? upload(meshVertices, false) : null;
  const elementBuffer = mesh ? gl.createBuffer() : null;
  if (mesh && elementBuffer) {
    gl.bindVertexArray(mesh.vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint32Array(triangles),
      gl.STATIC_DRAW,
    );
    gl.bindVertexArray(null);
  }
  const indexCount = triangles.length;
  function dispose() {
    gl.deleteBuffer(corners);
    gl.deleteBuffer(elementBuffer);
    for (const layer of [lines, points, mesh]) {
      if (layer) {
        gl.deleteVertexArray(layer.vao);
        gl.deleteBuffer(layer.buffer);
      }
    }
    gl.deleteProgram(program);
  }
  if (
    !lines ||
    !points ||
    (indexCount && !elementBuffer) ||
    gl.getError() !== gl.NO_ERROR
  ) {
    dispose();
    return null;
  }
  const fiberCount = fibers.length / 11,
    somaCount = somas.length / 11;
  const view = gl.getUniformLocation(program, "view");
  const viewport = gl.getUniformLocation(program, "viewport");
  const rotation = gl.getUniformLocation(program, "rotation");
  const soma = gl.getUniformLocation(program, "soma");
  const fringe = gl.getUniformLocation(program, "fringe");
  const membrane = gl.getUniformLocation(program, "membrane");
  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearDepth(1);
  gl.clearColor(0, 0, 0, 1);

  function drawSurfaces() {
    gl.bindVertexArray(lines!.vao);
    gl.uniform1i(soma, 0);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, fiberCount);
    if (somaCount) {
      gl.bindVertexArray(points!.vao);
      gl.uniform1i(soma, 1);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, somaCount);
    }
  }

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
      gl.depthMask(true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform2f(viewport, canvas.width, canvas.height);
      gl.uniform4f(
        rotation,
        Math.cos(yaw),
        Math.sin(yaw),
        Math.cos(pitch),
        Math.sin(pitch),
      );
      gl.uniform4f(view, scale, offsetX, offsetY, fiberScale);
      gl.uniform1i(fringe, 0);
      if (mesh) {
        gl.uniform1i(membrane, 1);
        gl.bindVertexArray(mesh.vao);
        gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
        gl.uniform1i(membrane, 0);
      }
      drawSurfaces();
      gl.depthMask(false);
      gl.uniform1i(fringe, 1);
      drawSurfaces();
    },
  };
}
