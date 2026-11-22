import type { Cell, Point3 } from "../data/dendrites";

import {
  cellMaterial,
  endpointRadii,
  focalGlow,
  somaAxes,
} from "./neuron-style";

// Each neurite segment is an instanced tapered capsule. For somas, the second
// point defines the anatomical long axis, and the second radius is its elongation.
const vertexSource = `#version 300 es
precision highp float;
layout(location=0) in vec3 startPoint;
layout(location=1) in vec3 endPoint;
layout(location=2) in vec2 packedPigments;
layout(location=3) in vec2 radii;
layout(location=4) in vec2 corner;
uniform vec4 rotation;
uniform vec2 viewport;
uniform vec4 view;
uniform bool soma;
uniform bool membrane;
uniform bool glowPass;
uniform bool lightTheme;
out vec3 surfaceNormal;
out float surfaceDepth;
out vec2 local;
flat out vec2 depths;
flat out vec2 worldRadius;
flat out vec2 screenRadius;
flat out vec3 tangent;
flat out vec3 color;
flat out float focal;
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
  uint bits = uint(lightTheme ? packedPigments.y : packedPigments.x);
  color = vec3(float((bits>>14u)&127u),float((bits>>7u)&127u),float(bits&127u))/127.;
  focal = float(bits>>21u)/7.;
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
  if(!soma) {
    // Keep the smallest axonal filaments fine; make the contour of thicker
    // measured structures visible at the scale of the full volume.
    screenRadius *= 1.04 + .34*smoothstep(vec2(.23),vec2(.64),worldRadius);
  }
  float pad = (soma ? screenRadius.x*max(1.,radii.y)*1.28 :
                      max(screenRadius.x,screenRadius.y)) + 2.;
  if (glowPass) {
    if (soma) pad = 4.4*screenRadius.x+1.;
    else pad += 21.*projectionScale(max(depths.x,depths.y));
  }
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
flat in float focal;
flat in float span;
uniform bool soma;
uniform bool fringe;
uniform vec4 view;
uniform bool membrane;
uniform bool glowPass;
uniform bool lightTheme;
out vec4 pixel;
const vec3 field = vec3(0.);
const vec3 key = vec3(-.49,-.62,.61);
// Integrating the optical footprint along a projected cable avoids artificial
// beads where consecutive segments meet. Nearby physical branches still add.
float cableScatter(float sigma,float radius,float scale) {
  float along=local.x/scale;
  float lengthWorld=span/scale;
  float reach=2.2*sigma;
  float endFalloff=smoothstep(-reach,reach,along)-
                   smoothstep(-reach,reach,along-lengthWorld);
  float radial=max(0.,abs(local.y)/scale-radius)/sigma;
  return endFalloff*exp(-.5*radial*radial);
}
void main() {
  float coverage;
  float surfaceZ;
  vec3 n;
  if (glowPass) {
    float along = clamp(local.x/max(.0001,span),0.,1.);
    float z = mix(depths.x,depths.y,along);
    float scale = view.x*.98/(1.-z/800.);
    vec2 radial = vec2(local.x-clamp(local.x,0.,span),local.y);
    float d = length(radial)/scale;
    float r = mix(worldRadius.x,worldRadius.y,along);
    float atmosphere = .60+.40*smoothstep(-125.,120.,z);
    float strength;
    if (soma) {
      float q = d/max(.001,r);
      strength = atmosphere*(.44*exp(-.36*q*q)+.12*exp(-.095*q*q));
    } else {
      strength = atmosphere*(.38*cableScatter(.82,r,scale)+
                             .28*cableScatter(3.75,r,scale)+
                             .085*cableScatter(7.3,r,scale));
    }
    vec3 spill = lightTheme ? (vec3(1.)-color)*strength*.43 : color*strength*.66;
    if (max(max(spill.r,spill.g),spill.b) < .004) discard;
    gl_FragDepth = clamp(.5-(soma ? z : z+r)/1800.,0.,1.);
    pixel = vec4(lightTheme ? vec3(1.)-spill : spill,1.);
    return;
  }
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
    float defocus = 1.-smoothstep(-135.,80.,center);
    float aperture = 1.+(focal < .01 ? 2.40 : 1.38)*defocus;
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
  float lighting = .53+.55*diffuse;
  float transmittance = clamp(exp(-.0049*max(0.,110.-surfaceZ)),.25,.995);
  vec3 lit = color*lighting;
  vec3 matte = field;
  if (lightTheme) {
    matte = vec3(1.);
    lit = mix(color*.79,color+(1.-color)*.23,diffuse);
    transmittance = .33+.64*smoothstep(-130.,150.,surfaceZ);
  }
  // The material's key light affects actual membrane and thicker proximal
  // cables. The fine background arbors retain their own measured caliber.
  float wide = (soma || membrane) ? 1. : smoothstep(.32,.82,max(worldRadius.x,worldRadius.y));
  float incident = max(0.,.46*n.z+.54*dot(n,key));
  float emphasis = focal*wide*(.43+.57*incident);
  vec3 highlight = mix(color,lightTheme ? vec3(1.) : vec3(1.,.95,.85),.30);
  lit = mix(lit,highlight,emphasis*(lightTheme ? .26 : .79));
  transmittance = mix(transmittance,1.,emphasis*.68);
  if(membrane) {
    // Normal variation comes from the measured triangles. Accentuate surface
    // folds and light the exposed shoulders of a process where it tapers.
    float fold = clamp((1.-length(surfaceNormal))*.86,0.,.19);
    float shoulder = (1.-abs(n.z))*(.47+.53*diffuse);
    lit = mix(lit*(1.-fold),color+(1.-color)*.16,.19*shoulder);
  }
  if (!soma && !membrane && focal < .01) {
    transmittance *= .60+.40*smoothstep(-115.,130.,surfaceZ);
  }
  pixel = vec4(mix(matte,lit,transmittance),fringe ? coverage : 1.);
}`;

// Spread light from the rendered tissue itself. Both kernels track the actual
// projected membranes as the visitor rotates the reconstruction.
const opticalVertex = `#version 300 es
precision highp float;
layout(location=4) in vec2 corner;
out vec2 uv;
void main() { uv=corner*.5+.5; gl_Position=vec4(corner,0.,1.); }
`;

const opticalFragment = `#version 300 es
precision highp float;
uniform sampler2D tissue;
uniform bool lightTheme;
uniform float pixelScale;
in vec2 uv;
out vec4 pixel;
vec3 exposure(vec2 at,float lod) {
  vec3 c=textureLod(tissue,at,lod).rgb;
  return lightTheme ? vec3(1.)-c : c;
}
vec3 neighborhood(vec2 texel,float radius,float lod) {
  vec2 d=texel*radius;
  return .40*exposure(uv,lod) + .15*(
    exposure(uv+vec2(d.x,0.),lod)+exposure(uv-vec2(d.x,0.),lod)
   +exposure(uv+vec2(0.,d.y),lod)+exposure(uv-vec2(0.,d.y),lod));
}
void main(){
  vec2 texel=1./vec2(textureSize(tissue,0));
  float deviceScale=clamp(pixelScale,.8,2.7);
  float levels=log2(deviceScale);
  vec3 crisp=exposure(uv,0.);
  vec3 skin=neighborhood(texel,.70*deviceScale,.55+levels);
  vec3 near=neighborhood(texel,1.9*deviceScale,1.50+levels);
  vec3 wide=neighborhood(texel,7.5*deviceScale,3.05+levels);
  // Preserve light in total while moving it out of sharp cable cores.
  // The wider kernels scatter pigment already present in the tissue.
  vec3 weights=lightTheme ? vec3(.49,.20,.18) : vec3(.42,.24,.27);
  vec3 radiance=crisp*weights.x+skin*weights.y+near*weights.z+
                wide*(lightTheme ? .17 : .20);
  float peak=max(max(radiance.r,radiance.g),radiance.b);
  float retained=lightTheme ? .92 : mix(.747,.874,smoothstep(.055,.53,peak));
  radiance*=retained*(1.-.075*smoothstep(.62,1.,peak));
  radiance=max(vec3(0.),mix(vec3(dot(radiance,vec3(.2126,.7152,.0722))),radiance,1.065));
  pixel=vec4(lightTheme ? vec3(1.)-radiance : radiance,1.);
}`;

function tissueOptics(
  gl: WebGL2RenderingContext,
  corners: WebGLBuffer,
  program: WebGLProgram,
) {
  const framebuffer = gl.createFramebuffer(),
    depth = gl.createRenderbuffer();
  const texture = gl.createTexture(),
    quad = gl.createVertexArray();
  function dispose() {
    gl.deleteFramebuffer(framebuffer);
    gl.deleteRenderbuffer(depth);
    gl.deleteTexture(texture);
    gl.deleteVertexArray(quad);
    gl.deleteProgram(program);
  }
  if (!texture || !depth || !framebuffer || !quad) {
    dispose();
    return null;
  }
  gl.bindVertexArray(quad);
  gl.bindBuffer(gl.ARRAY_BUFFER, corners);
  gl.enableVertexAttribArray(4);
  gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);
  const themed = gl.getUniformLocation(program, "lightTheme");
  const pixelScale = gl.getUniformLocation(program, "pixelScale");
  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program, "tissue"), 0);
  let width = 0,
    height = 0,
    ready = false;
  return {
    dispose,
    begin(w: number, h: number) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      if (w !== width || h !== height) {
        width = w;
        height = h;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA8,
          w,
          h,
          0,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          null,
        );
        gl.texParameteri(
          gl.TEXTURE_2D,
          gl.TEXTURE_MIN_FILTER,
          gl.LINEAR_MIPMAP_LINEAR,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          texture,
          0,
        );
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
        gl.framebufferRenderbuffer(
          gl.FRAMEBUFFER,
          gl.DEPTH_ATTACHMENT,
          gl.RENDERBUFFER,
          depth,
        );
        ready =
          gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      }
      if (!ready) gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    },
    present(light: boolean, scale: number) {
      if (!ready) return;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.useProgram(program);
      gl.uniform1i(themed, light ? 1 : 0);
      gl.uniform1f(pixelScale, scale);
      gl.bindVertexArray(quad);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
  };
}

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

type Pigments = readonly [number, number];

// Each palette entry is packed into a 24-bit integer: seven bits per
// color channel and three bits of focal material strength. Both palettes
// share one copy of the geometry.
function packPigments(
  dark: number[],
  light: number[],
  amount = 1,
  focal = 0,
): Pigments {
  function pack(rgb: number[], matte: number) {
    const channel = (i: number) =>
      Math.max(
        0,
        Math.min(
          127,
          Math.round(((matte + (rgb[i] - matte) * amount) * 127) / 255),
        ),
      );
    const emphasis = Math.round(Math.max(0, Math.min(1, focal)) * 7);
    return (
      (emphasis << 21) | (channel(0) << 14) | (channel(1) << 7) | channel(2)
    );
  }
  return [pack(dark, 0), pack(light, 255)];
}

type Surface = NonNullable<Cell["surface"]>;

// Sum the oriented face-area vectors, then normalize once per shared vertex.
function appendSurface(
  cell: Cell,
  surface: Surface,
  pigment: Pigments,
  packed: number[],
  triangles: number[],
) {
  const { positions, indices } = surface;
  const normals = new Float32Array(positions.length);
  const base = packed.length / 8;
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
  function link(vertex: string, fragment: string) {
    const vert = compile(gl.VERTEX_SHADER, vertex),
      frag = compile(gl.FRAGMENT_SHADER, fragment);
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
    return program;
  }
  const program = link(vertexSource, fragmentSource);
  if (!program) return null;

  const sorted = cells.slice().sort((a, b) => a.soma.z - b.soma.z);
  const fibers: number[] = [];
  const somas: number[] = [];
  const luminousFibers: number[] = [];
  const glowSites: number[] = [];
  const meshVertices: number[] = [],
    triangles: number[] = [];
  function append(
    out: number[],
    a: Point3,
    b: Point3,
    pigment: Pigments,
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
      radiusA,
      radiusB,
    );
  }
  for (const cell of sorted) {
    const material = cellMaterial(cell);
    const pigment = packPigments(
      material.pigment,
      material.lightPigment,
      1,
      0.68 + 0.32 * material.emission,
    );
    const distalPigment = packPigments(
      material.pigment,
      material.lightPigment,
      0.91,
      0.25,
    );
    const intermediatePigment = packPigments(
      material.pigment,
      material.lightPigment,
      0.98,
      0.5 + 0.16 * material.emission,
    );
    const axonPigment = packPigments(
      material.pigment,
      material.lightPigment,
      0.46,
    );
    // Localize the strongest emission to the soma neighborhood and a second
    // point along a contiguous traced path. Nothing is drawn in empty space.
    const glowRegion = material.emission > 0 ? focalGlow(cell) : null;
    const distal = glowRegion?.distal ?? cell.soma;
    if (glowRegion) {
      for (const [point, radius, intensity] of glowRegion.sites) {
        const glowColor = packPigments(
          material.pigment,
          material.lightPigment,
          material.emission * intensity,
        );
        append(glowSites, point, point, glowColor, radius, 1);
      }
    }
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
      const samples = endpointRadii(branch),
        points = softenContour(branch.points);
      for (let i = 1; i < points.length; i++) {
        const a = points[i - 1],
          b = points[i];
        if (a.x === b.x && a.y === b.y && a.z === b.z) continue;

        const x = (a.x + b.x) * 0.5,
          y = (a.y + b.y) * 0.5,
          z = (a.z + b.z) * 0.5;
        const ds =
          (x - cell.soma.x) ** 2 +
          (y - cell.soma.y) ** 2 +
          (z - cell.soma.z) ** 2;
        const fiberPigment = branch.axon
          ? axonPigment
          : ds < 22 ** 2
            ? pigment
            : ds < 69 ** 2
              ? intermediatePigment
              : distalPigment;
        append(fibers, a, b, fiberPigment, samples[i - 1], samples[i]);
        if (material.emission <= 0 || branch.axon) continue;
        const dd =
          (x - distal.x) ** 2 + (y - distal.y) ** 2 + (z - distal.z) ** 2;
        const concentration = Math.max(
          0.86 * Math.exp(-ds / 2600),
          Math.exp(-dd / 1350),
        );
        const weight = Math.min(
          1,
          0.52 + 0.6 * Math.max(samples[i - 1], samples[i]),
        );
        const emission = material.emission * concentration * weight;
        if (emission > 0.045) {
          const lit = packPigments(
            material.pigment,
            material.lightPigment,
            emission,
          );
          append(luminousFibers, a, b, lit, samples[i - 1], samples[i]);
        }
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
        i >= 2 ? 2 : 3,
        gl.FLOAT,
        false,
        instanced ? 40 : 32,
        i === 3 ? 32 : i * 12,
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
  const lightLayer = luminousFibers.length ? upload(luminousFibers) : null;
  const lightCount = luminousFibers.length / 10;
  const clouds = glowSites.length ? upload(glowSites) : null;
  const cloudCount = glowSites.length / 10;
  const opticalProgram = link(opticalVertex, opticalFragment);
  const optics = opticalProgram
    ? tissueOptics(gl, corners, opticalProgram)
    : null;
  function dispose() {
    optics?.dispose();
    gl.deleteBuffer(corners);
    gl.deleteBuffer(elementBuffer);
    for (const layer of [lines, points, mesh, lightLayer, clouds]) {
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
    (lightCount && !lightLayer) ||
    (cloudCount && !clouds) ||
    gl.getError() !== gl.NO_ERROR
  ) {
    dispose();
    return null;
  }
  const fiberCount = fibers.length / 10,
    somaCount = somas.length / 10;
  const view = gl.getUniformLocation(program, "view");
  const viewport = gl.getUniformLocation(program, "viewport");
  const rotation = gl.getUniformLocation(program, "rotation");
  const soma = gl.getUniformLocation(program, "soma");
  const fringe = gl.getUniformLocation(program, "fringe");
  const membrane = gl.getUniformLocation(program, "membrane");
  const glow = gl.getUniformLocation(program, "glowPass");
  const lightTheme = gl.getUniformLocation(program, "lightTheme");
  gl.useProgram(program);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearDepth(1);

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
      light = false,
    ) {
      const matte = light ? 1 : 0;
      optics?.begin(canvas.width, canvas.height);
      gl.useProgram(program);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.uniform1i(lightTheme, matte);
      gl.clearColor(matte, matte, matte, 1);
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
      if (clouds || lightLayer) {
        // Independent nearby sources accumulate without clipping. On white,
        // their complementary pigment attenuates the light through the field.
        gl.blendFunc(
          light ? gl.ZERO : gl.ONE,
          light ? gl.SRC_COLOR : gl.ONE_MINUS_SRC_COLOR,
        );
        gl.uniform1i(glow, 1);
        if (clouds) {
          gl.uniform1i(soma, 1);
          gl.bindVertexArray(clouds.vao);
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, cloudCount);
        }
        if (lightLayer) {
          gl.uniform1i(soma, 0);
          gl.bindVertexArray(lightLayer.vao);
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, lightCount);
        }
        gl.uniform1i(glow, 0);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      }
      optics?.present(light, scale);
    },
  };
}
