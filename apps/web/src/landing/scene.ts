/** The landing's WebGL scene: a point-cloud earth that assembles, corridors that ignite,
 *  and volumetric hotspot columns. Raw WebGL2, no framework — the whole thing is ~7 kB of
 *  shader and one draw loop per pass, so it starts instantly and never drops frames while
 *  the page is scrolling.
 */

export interface SceneData {
  /** lon, lat, weight per populated cell */
  points: Float32Array;
  /** olon, olat, dlon, dlat, volume, disagreement — model A */
  arcs: Float32Array;
  /** same corridors, model B's volume and a flag for "B says nothing here" */
  arcsB: Float32Array;
  /** lon, lat, height for volumetric hotspot columns */
  columns: Float32Array;
}

const VERT_GLOBE = `#version 300 es
precision highp float;
layout(location=0) in vec3 aLonLatW;
uniform mat4 uProj, uView;
uniform float uTime, uAssemble, uRadius;
out float vW, vDepth;
const float PI = 3.14159265359;

// Deterministic per-point scatter so the assembly reads as a swarm converging, not a fade.
float hash(float n) { return fract(sin(n) * 43758.5453123); }

vec3 sphere(float lon, float lat, float r) {
  float a = radians(lon), b = radians(lat);
  return vec3(r * cos(b) * cos(a), r * sin(b), -r * cos(b) * sin(a));
}

void main() {
  float lon = aLonLatW.x, lat = aLonLatW.y;
  vW = aLonLatW.z;
  vec3 home = sphere(lon, lat, uRadius);
  float h = hash(float(gl_VertexID) * 0.017);
  float h2 = hash(float(gl_VertexID) * 0.031 + 7.0);
  // Start scattered on a much larger shell, spiral inward.
  vec3 wild = sphere(lon + (h - 0.5) * 220.0, lat + (h2 - 0.5) * 120.0, uRadius * (2.2 + h * 3.0));
  float t = clamp(uAssemble * 1.45 - h * 0.45, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);
  vec3 p = mix(wild, home, t);
  // Gentle breathing once assembled.
  p *= 1.0 + 0.006 * sin(uTime * 0.7 + h * 6.28);
  vec4 mv = uView * vec4(p, 1.0);
  vDepth = -mv.z;
  gl_Position = uProj * mv;
  gl_PointSize = clamp((3.0 + vW * 5.0) * (620.0 / max(vDepth, 1.0)), 1.4, 11.0) * (0.35 + 0.65 * t);
}`;

const FRAG_GLOBE = `#version 300 es
precision highp float;
in float vW, vDepth;
uniform vec3 uColorLo, uColorHi;
out vec4 frag;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float r = dot(d, d);
  if (r > 0.25) discard;
  float soft = smoothstep(0.25, 0.02, r);
  vec3 c = mix(uColorLo, uColorHi, clamp(vW, 0.0, 1.0));
  // Depth cue: far points recede rather than being culled, which keeps the sphere readable.
  float fog = clamp(1.0 - (vDepth - 430.0) / 780.0, 0.16, 1.0);
  frag = vec4(c * fog * 1.35, soft * fog);
}`;

const VERT_ARC = `#version 300 es
precision highp float;
layout(location=0) in float aT;          // 0..1 along the arc
layout(location=1) in vec4 aOD;          // olon, olat, dlon, dlat
layout(location=2) in vec2 aMeta;        // volume, disagreement
uniform mat4 uProj, uView;
uniform float uTime, uReveal, uRadius, uLift;
out float vA, vDis, vT;
const float PI = 3.14159265359;

vec3 sphere(float lon, float lat, float r) {
  float a = radians(lon), b = radians(lat);
  return vec3(r * cos(b) * cos(a), r * sin(b), -r * cos(b) * sin(a));
}

void main() {
  vec3 o = sphere(aOD.x, aOD.y, 1.0);
  vec3 d = sphere(aOD.z, aOD.w, 1.0);
  float ang = acos(clamp(dot(o, d), -1.0, 1.0));
  // Slerp keeps the path ON the sphere; a chord would tunnel through it.
  vec3 p = (ang < 1e-4)
    ? o
    : (sin((1.0 - aT) * ang) * o + sin(aT * ang) * d) / sin(ang);
  float lift = 1.0 + uLift * sin(aT * PI) * (0.10 + 0.34 * ang / PI);
  vec4 mv = uView * vec4(p * uRadius * lift, 1.0);
  gl_Position = uProj * mv;

  // A travelling head so corridors read as movement, not as static wire.
  float head = fract(uTime * 0.17 + aOD.x * 0.0021 + aOD.w * 0.0013);
  float dist = abs(aT - head);
  dist = min(dist, 1.0 - dist);
  float pulse = exp(-dist * 22.0);
  vT = aT;
  vDis = aMeta.y;
  vA = (0.30 + 0.95 * pulse) * clamp(aMeta.x * 1.8, 0.14, 1.0) * uReveal;
}`;

const FRAG_ARC = `#version 300 es
precision highp float;
in float vA, vDis, vT;
uniform vec3 uArcLo, uArcHi;
out vec4 frag;
void main() {
  // Colour carries disagreement: corroborated corridors stay cold, contested ones burn amber.
  vec3 c = mix(uArcLo, uArcHi, clamp(vDis, 0.0, 1.0));
  frag = vec4(c * 1.25, vA);
}`;

const VERT_COL = `#version 300 es
precision highp float;
layout(location=0) in vec2 aEnd;         // 0 = base, 1 = top
layout(location=1) in vec3 aLonLatH;
uniform mat4 uProj, uView;
uniform float uRadius, uGrow, uTime;
out float vH, vEnd;
vec3 sphere(float lon, float lat, float r) {
  float a = radians(lon), b = radians(lat);
  return vec3(r * cos(b) * cos(a), r * sin(b), -r * cos(b) * sin(a));
}
void main() {
  float h = aLonLatH.z * uGrow * (0.92 + 0.08 * sin(uTime * 1.3 + aLonLatH.x));
  float r = uRadius * (1.0 + aEnd.x * h * 0.55);
  gl_Position = uProj * uView * vec4(sphere(aLonLatH.x, aLonLatH.y, r), 1.0);
  vH = aLonLatH.z; vEnd = aEnd.x;
}`;

const FRAG_COL = `#version 300 es
precision highp float;
in float vH, vEnd;
uniform vec3 uColLo, uColHi;
uniform float uReveal;
out vec4 frag;
void main() {
  vec3 c = mix(uColLo, uColHi, clamp(vH, 0.0, 1.0));
  // Fade along the column so it reads as volume rising, not as a stick.
  frag = vec4(c * 1.3, (1.0 - vEnd * 0.7) * uReveal);
}`;

const VERT_QUAD = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  // Fullscreen triangle: no vertex buffer needed.
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG_BRIGHT = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform float uThreshold;
out vec4 frag;
void main() {
  vec3 c = texture(uTex, vUv).rgb;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  // Soft knee so the bloom grows with brightness instead of switching on.
  float k = smoothstep(uThreshold, uThreshold + 0.28, l);
  frag = vec4(c * k, 1.0);
}`;

const FRAG_BLUR = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uDir;          // texel-sized step, horizontal or vertical
out vec4 frag;
void main() {
  // 9-tap separable gaussian.
  float w[5]; w[0]=0.227027; w[1]=0.1945946; w[2]=0.1216216; w[3]=0.054054; w[4]=0.016216;
  vec3 sum = texture(uTex, vUv).rgb * w[0];
  for (int i = 1; i < 5; i++) {
    sum += texture(uTex, vUv + uDir * float(i)).rgb * w[i];
    sum += texture(uTex, vUv - uDir * float(i)).rgb * w[i];
  }
  frag = vec4(sum, 1.0);
}`;

const FRAG_COMPOSITE = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uScene, uBloom;
uniform float uBloomAmount, uVignette;
out vec4 frag;
void main() {
  vec3 scene = texture(uScene, vUv).rgb;
  vec3 bloom = texture(uBloom, vUv).rgb;
  vec3 c = scene + bloom * uBloomAmount;
  // Filmic-ish shoulder: keeps the hot cores from clipping to flat white.
  c = c / (c + vec3(0.72)) * 1.38;
  vec2 d = vUv - 0.5;
  c *= 1.0 - uVignette * dot(d, d) * 1.5;
  frag = vec4(c, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, vs: string, fs: string): WebGLProgram {
  const mk = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(`shader: ${gl.getShaderInfoLog(s)}`);
    }
    return s;
  };
  const p = gl.createProgram()!;
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`link: ${gl.getProgramInfoLog(p)}`);
  return p;
}

function perspective(fovy: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fovy / 2);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0,
  ]);
}

function lookAt(eye: number[], tgt: number[], up: number[]): Float32Array {
  const sub = (a: number[], b: number[]) => [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
  const norm = (v: number[]) => { const l = Math.hypot(...v) || 1; return [v[0]! / l, v[1]! / l, v[2]! / l]; };
  const cross = (a: number[], b: number[]) => [
    a[1]! * b[2]! - a[2]! * b[1]!, a[2]! * b[0]! - a[0]! * b[2]!, a[0]! * b[1]! - a[1]! * b[0]!];
  const dot = (a: number[], b: number[]) => a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
  const z = norm(sub(eye, tgt)), x = norm(cross(up, z)), y = cross(z, x);
  return new Float32Array([
    x[0]!, y[0]!, z[0]!, 0,
    x[1]!, y[1]!, z[1]!, 0,
    x[2]!, y[2]!, z[2]!, 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ]);
}

export interface SceneHandle {
  /** 0..1 over the whole narrative. */
  setProgress(p: number): void;
  destroy(): void;
}

const ARC_SEGMENTS = 40;

export function createScene(canvas: HTMLCanvasElement, data: SceneData): SceneHandle {
  const ctx = canvas.getContext('webgl2', { antialias: true, alpha: false, powerPreference: 'high-performance' });
  if (!ctx) throw new Error('WebGL2 unavailable');
  const gl: WebGL2RenderingContext = ctx;

  const pGlobe = compile(gl, VERT_GLOBE, FRAG_GLOBE);
  const pArc = compile(gl, VERT_ARC, FRAG_ARC);
  const pCol = compile(gl, VERT_COL, FRAG_COL);
  const pBright = compile(gl, VERT_QUAD, FRAG_BRIGHT);
  const pBlur = compile(gl, VERT_QUAD, FRAG_BLUR);
  const pComp = compile(gl, VERT_QUAD, FRAG_COMPOSITE);
  gl.getExtension('EXT_color_buffer_float');

  // --- offscreen targets: scene at full res, bloom chain at half ---
  const mkTarget = () => {
    const fb = gl.createFramebuffer()!;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { fb, tex, w: 0, h: 0 };
  };
  const tScene = mkTarget(), tBrightA = mkTarget(), tBrightB = mkTarget();
  const sizeTarget = (t: { fb: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number }, w: number, h: number) => {
    if (t.w === w && t.h === h) return;
    t.w = w; t.h = h;
    gl.bindTexture(gl.TEXTURE_2D, t.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  };
  const vaoQuad = gl.createVertexArray()!;

  // --- globe points ---
  const vaoG = gl.createVertexArray()!;
  gl.bindVertexArray(vaoG);
  const bufG = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, bufG);
  gl.bufferData(gl.ARRAY_BUFFER, data.points, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
  const nPoints = data.points.length / 3;

  // --- arcs: one instanced strip ---
  const vaoA = gl.createVertexArray()!;
  gl.bindVertexArray(vaoA);
  const tBuf = gl.createBuffer()!;
  const ts = new Float32Array(ARC_SEGMENTS + 1);
  for (let i = 0; i <= ARC_SEGMENTS; i++) ts[i] = i / ARC_SEGMENTS;
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuf);
  gl.bufferData(gl.ARRAY_BUFFER, ts, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 4, 0);
  const odBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, odBuf);
  gl.bufferData(gl.ARRAY_BUFFER, data.arcs, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 24, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 24, 16);
  gl.vertexAttribDivisor(2, 1);
  const nArcs = data.arcs.length / 6;

  // Model B, same corridors, drawn simultaneously in the divergence act.
  const vaoB = gl.createVertexArray()!;
  gl.bindVertexArray(vaoB);
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuf);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 4, 0);
  const odBufB = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, odBufB);
  gl.bufferData(gl.ARRAY_BUFFER, data.arcsB, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 24, 0);
  gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2);
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 24, 16);
  gl.vertexAttribDivisor(2, 1);
  const nArcsB = data.arcsB.length / 6;

  // --- volumetric columns ---
  const vaoC = gl.createVertexArray()!;
  gl.bindVertexArray(vaoC);
  const endBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, endBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
  const colBuf = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, colBuf);
  gl.bufferData(gl.ARRAY_BUFFER, data.columns, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 12, 0);
  gl.vertexAttribDivisor(1, 1);
  const nCols = data.columns.length / 3;
  gl.bindVertexArray(null);

  const u = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
  const U = {
    g: { proj: u(pGlobe, 'uProj'), view: u(pGlobe, 'uView'), time: u(pGlobe, 'uTime'), asm: u(pGlobe, 'uAssemble'), rad: u(pGlobe, 'uRadius'), lo: u(pGlobe, 'uColorLo'), hi: u(pGlobe, 'uColorHi') },
    a: { proj: u(pArc, 'uProj'), view: u(pArc, 'uView'), time: u(pArc, 'uTime'), rev: u(pArc, 'uReveal'), rad: u(pArc, 'uRadius'), lift: u(pArc, 'uLift'), lo: u(pArc, 'uArcLo'), hi: u(pArc, 'uArcHi') },
    c: { proj: u(pCol, 'uProj'), view: u(pCol, 'uView'), time: u(pCol, 'uTime'), rad: u(pCol, 'uRadius'), grow: u(pCol, 'uGrow'), rev: u(pCol, 'uReveal'), lo: u(pCol, 'uColLo'), hi: u(pCol, 'uColHi') },
  };

  const Upost = {
    bright: { tex: u(pBright, 'uTex'), thr: u(pBright, 'uThreshold') },
    blur: { tex: u(pBlur, 'uTex'), dir: u(pBlur, 'uDir') },
    comp: { scene: u(pComp, 'uScene'), bloom: u(pComp, 'uBloom'), amt: u(pComp, 'uBloomAmount'), vig: u(pComp, 'uVignette') },
  };

  let progress = 0, raf = 0, t0 = 0;
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.floor(canvas.clientWidth * dpr), h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  const ease = (x: number) => x * x * (3 - 2 * x);
  const seg = (p: number, a: number, b: number) => ease(Math.min(1, Math.max(0, (p - a) / (b - a))));

  function frame(now: number) {
    if (!t0) t0 = now;
    const time = reduced ? 0 : (now - t0) / 1000;
    resize();
    const W = canvas.width, H = canvas.height;
    const bw = Math.max(1, W >> 1), bh = Math.max(1, H >> 1);
    sizeTarget(tScene, W, H);
    sizeTarget(tBrightA, bw, bh);
    sizeTarget(tBrightB, bw, bh);

    const p = progress;
    const assemble = seg(p, 0.00, 0.17);
    const arcsIn = seg(p, 0.22, 0.38);
    const diverge = seg(p, 0.40, 0.54);        // model B fades in beside model A
    const cols = seg(p, 0.58, 0.72);
    const wall = seg(p, 0.74, 0.86);           // the 2019 evidence wall
    const dive = seg(p, 0.88, 1.00);

    const R = 100;
    const dist = 640 - 150 * seg(p, 0.0, 0.72) - 430 * dive;
    const yaw = 0.35 + p * 2.3 + (reduced ? 0 : time * 0.035);
    const pitch = 0.30 - 0.36 * dive;
    const eye = [
      Math.cos(yaw) * Math.cos(pitch) * dist,
      Math.sin(pitch) * dist,
      Math.sin(yaw) * Math.cos(pitch) * dist,
    ];
    const proj = perspective((38 + 26 * dive) * Math.PI / 180, W / H, 1, 4000);
    const view = lookAt(eye, [0, 0, 0], [0, 1, 0]);

    // ---------- pass 1: the scene, into a float target ----------
    gl.bindFramebuffer(gl.FRAMEBUFFER, tScene.fb);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0.016, 0.024, 0.035, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.disable(gl.DEPTH_TEST);

    gl.useProgram(pGlobe);
    gl.uniformMatrix4fv(U.g.proj, false, proj);
    gl.uniformMatrix4fv(U.g.view, false, view);
    gl.uniform1f(U.g.time, time);
    gl.uniform1f(U.g.asm, assemble);
    gl.uniform1f(U.g.rad, R);
    gl.uniform3f(U.g.lo, 0.20, 0.36, 0.48);
    gl.uniform3f(U.g.hi, 0.42, 0.86, 0.80);
    gl.bindVertexArray(vaoG);
    gl.drawArrays(gl.POINTS, 0, nPoints);

    if (arcsIn > 0.001) {
      gl.useProgram(pArc);
      gl.uniformMatrix4fv(U.a.proj, false, proj);
      gl.uniformMatrix4fv(U.a.view, false, view);
      gl.uniform1f(U.a.time, time);
      gl.uniform1f(U.a.rad, R);
      gl.uniform1f(U.a.lift, 1.0);

      // Model A, the spine. Cool.
      gl.uniform1f(U.a.rev, arcsIn * (1.0 - 0.18 * wall));
      gl.uniform3f(U.a.lo, 0.38, 0.78, 0.92);
      gl.uniform3f(U.a.hi, 0.42, 0.86, 0.96);
      gl.bindVertexArray(vaoA);
      gl.drawArraysInstanced(gl.LINE_STRIP, 0, ARC_SEGMENTS + 1, nArcs);

      // Model B, the second opinion, lifted onto a different altitude so the two are
      // visibly separate objects. Where they disagree the gap is the picture.
      if (diverge > 0.001) {
        gl.uniform1f(U.a.rev, diverge);
        gl.uniform1f(U.a.lift, 1.0 + 0.62 * diverge);
        gl.uniform3f(U.a.lo, 0.98, 0.58, 0.16);
        gl.uniform3f(U.a.hi, 0.99, 0.36, 0.30);
        gl.bindVertexArray(vaoB);
        gl.drawArraysInstanced(gl.LINE_STRIP, 0, ARC_SEGMENTS + 1, nArcsB);
      }
    }

    if (cols > 0.001) {
      gl.useProgram(pCol);
      gl.uniformMatrix4fv(U.c.proj, false, proj);
      gl.uniformMatrix4fv(U.c.view, false, view);
      gl.uniform1f(U.c.time, time);
      gl.uniform1f(U.c.rad, R);
      gl.uniform1f(U.c.grow, cols);
      gl.uniform1f(U.c.rev, cols);
      gl.uniform3f(U.c.lo, 0.30, 0.70, 0.66);
      gl.uniform3f(U.c.hi, 0.98, 0.45, 0.35);
      gl.bindVertexArray(vaoC);
      gl.drawArraysInstanced(gl.LINES, 0, 2, nCols);
    }

    // ---------- pass 2: bright extract ----------
    gl.disable(gl.BLEND);
    gl.bindVertexArray(vaoQuad);
    gl.bindFramebuffer(gl.FRAMEBUFFER, tBrightA.fb);
    gl.viewport(0, 0, bw, bh);
    gl.useProgram(pBright);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tScene.tex);
    gl.uniform1i(Upost.bright.tex, 0);
    gl.uniform1f(Upost.bright.thr, 0.30);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // ---------- pass 3: separable blur, two ping-pong rounds ----------
    gl.useProgram(pBlur);
    gl.uniform1i(Upost.blur.tex, 0);
    for (let i = 0; i < 2; i++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, tBrightB.fb);
      gl.bindTexture(gl.TEXTURE_2D, tBrightA.tex);
      gl.uniform2f(Upost.blur.dir, (1.6 + i * 2.2) / bw, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, tBrightA.fb);
      gl.bindTexture(gl.TEXTURE_2D, tBrightB.tex);
      gl.uniform2f(Upost.blur.dir, 0, (1.6 + i * 2.2) / bh);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // ---------- pass 4: composite to screen ----------
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(pComp);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tScene.tex);
    gl.uniform1i(Upost.comp.scene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, tBrightA.tex);
    gl.uniform1i(Upost.comp.bloom, 1);
    gl.uniform1f(Upost.comp.amt, 1.15 + 0.7 * diverge);
    gl.uniform1f(Upost.comp.vig, 0.55);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindVertexArray(null);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    setProgress(v) { progress = Math.max(0, Math.min(1, v)); },
    destroy() {
      cancelAnimationFrame(raf);
      [pGlobe, pArc, pCol, pBright, pBlur, pComp].forEach((x) => gl.deleteProgram(x));
      [bufG, tBuf, odBuf, odBufB, endBuf, colBuf].forEach((b) => gl.deleteBuffer(b));
      [vaoG, vaoA, vaoB, vaoC, vaoQuad].forEach((v) => gl.deleteVertexArray(v));
      [tScene, tBrightA, tBrightB].forEach((t) => { gl.deleteFramebuffer(t.fb); gl.deleteTexture(t.tex); });
    },
  };
}
