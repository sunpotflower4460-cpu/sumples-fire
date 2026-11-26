/**
 * fireShader — a procedural flame, rendered on the GPU.
 *
 * Instead of stacking blurred gradient blobs, the flame is a field of
 * turbulent noise that is advected upward and then mapped through a
 * black-body style palette:
 *
 *   • domain-warped fbm → licking, folding tongues rather than a lava lamp
 *   • a second, faster octave → fine flicker at the edges
 *   • per-column "tongue" heights → several flames of different heights
 *   • temperature → colour: dark red edge, orange body, yellow, near-white core
 *   • a soft ground glow and an ignition flare
 *   • smoke that only appears where the flame has cooled
 *
 * WebGL1 (GLSL ES 1.00) so it runs on every iOS WKWebView we target.
 */

export type RGB = [number, number, number];

export type FirePalette = {
  /** Cool outer edge. */
  edge: RGB;
  /** Body of the flame. */
  body: RGB;
  /** Hot inner flame. */
  hot: RGB;
  /** Core, close to white. */
  core: RGB;
};

export type FireFrame = {
  /** Seconds since start (drives all motion). */
  time: number;
  intensity: number;
  flash: number;
  smoke: number;
  /** Nominal flame height as a fraction of the canvas height. */
  height: number;
  /** Where the flame sits vertically (0 = bottom edge) as a fraction of the canvas height. */
  base: number;
  /** Half width of the fuel bed as a fraction of the canvas width. */
  bedHalf: number;
};

export const NORMAL_PALETTE: FirePalette = {
  edge: [0.5, 0.06, 0.02],
  body: [0.98, 0.3, 0.05],
  hot: [1.0, 0.72, 0.16],
  core: [1.0, 0.95, 0.72],
};

const VERTEX = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export const FRAGMENT = `
precision highp float;
varying vec2 vUv;

uniform vec2  uRes;
uniform float uTime;
uniform float uIntensity;
uniform float uFlash;
uniform float uSmoke;
uniform float uHeight;
uniform float uBase;
uniform float uBedHalf;
uniform vec3  uEdge;
uniform vec3  uBody;
uniform vec3  uHot;
uniform vec3  uCore;

float hash(vec2 p) {
  p = fract(p * vec2(0.1031, 0.1030));
  p += dot(p, p.yx + 33.33);
  return fract((p.x + p.y) * p.x);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = p * 2.03 + vec2(17.1, 3.7);
    a *= 0.5;
  }
  return v;
}

void main() {
  float aspect = uRes.x / uRes.y;
  // Flame space: x centred, y measured in nominal flame heights above the base.
  vec2 s = vec2((vUv.x - 0.5) * aspect, vUv.y - uBase) / uHeight;
  float bedHalf = uBedHalf * aspect / uHeight;
  float t = uTime;

  // Different parts of the bed burn to different heights — several tongues, not one cone.
  float tongue = vnoise(vec2(s.x * 3.1 + 1.7, t * 0.9)) * 0.55
               + vnoise(vec2(s.x * 7.3 - 3.1, t * 1.9 + 9.0)) * 0.45;
  float reach = mix(0.45, 1.5, tongue) * (0.32 + 0.68 * uIntensity);
  float sy = s.y / reach;

  // The fuel bed narrows only a little; the sides are shaped by the noise below.
  float taper = bedHalf * (1.0 - 0.5 * smoothstep(0.0, 1.2, sy));
  float side = 1.0 - smoothstep(taper * 0.55, taper, abs(s.x));

  // Domain-warped turbulence, advected upward. The x frequency is much higher
  // than the y frequency, which stretches every feature into a vertical lick.
  float warp = fbm(vec2(s.x * 1.7 + 4.2, sy * 0.7 - t * 0.55));
  vec2 np = vec2(s.x * 3.4 + (warp - 0.5) * 2.4 * (0.2 + sy), sy * 1.0 - t * 1.7);
  float n1 = fbm(np);
  float n2 = fbm(np * vec2(2.3, 1.9) + vec2(8.1, -t * 1.1));
  float fire = n1 * 0.6 + n2 * 0.4;

  // The cut-off rises with height so tips break into detached wisps.
  float body = (1.08 - sy) * side;
  float field = fire * body * 2.05 - 0.14 - sy * 0.1;
  float heat = smoothstep(0.34, 0.86, field);
  heat *= smoothstep(-0.06, 0.05, s.y);

  // Temperature → colour. The interior is modulated by the turbulence itself, so
  // hot pockets swirl inside the flame; only the very base reaches the white core.
  float hot = clamp(heat * (0.45 + 0.9 * n1) * 0.95 - sy * 0.62 + 0.14 + (n2 - 0.5) * 0.42 * heat, 0.0, 1.0);
  vec3 col = mix(uEdge, uBody, smoothstep(0.0, 0.4, hot));
  col = mix(col, uHot, smoothstep(0.3, 0.72, hot));
  col = mix(col, uCore, smoothstep(0.84, 1.0, hot) * 0.6);
  // Upper flame is thinner — it lets the night through.
  float thin = mix(1.0, 0.62, smoothstep(0.25, 1.0, sy));
  float alpha = smoothstep(0.04, 0.4, heat) * thin;
  vec3 rgb = col * alpha * (0.85 + 0.35 * hot);

  // Soft ground glow around the base — light the flame throws on its surroundings.
  float spread = 1.0 - smoothstep(bedHalf * 0.4, bedHalf * 2.1, abs(s.x));
  float glow = exp(-max(s.y, 0.0) * 1.5) * spread * uIntensity;
  rgb += uBody * glow * 0.2;

  // Ignition flare hugging the base.
  float flare = uFlash * exp(-max(s.y, 0.0) * 2.1) * (1.0 - smoothstep(bedHalf * 0.5, bedHalf * 1.5, abs(s.x)));
  rgb += mix(uHot, uCore, 0.5) * flare * 0.85;

  // Smoke exists only where the flame has already given up (skipped entirely when idle).
  vec3 outRgb = rgb;
  float outA = alpha;
  if (uSmoke > 0.01) {
    float sm = fbm(vec2(s.x * 0.9 + warp * 0.6, s.y * 0.55 - t * 0.22));
    float rise = smoothstep(0.4, 1.0, s.y) * (1.0 - smoothstep(1.5, 2.8, s.y));
    float column = 1.0 - smoothstep(bedHalf * 0.8, bedHalf * 2.2, abs(s.x));
    float smokeA = smoothstep(0.38, 0.85, sm) * rise * column * uSmoke * 0.5;
    vec3 smokeRgb = (vec3(0.17, 0.15, 0.14) + uBody * 0.1) * smokeA;
    outRgb = rgb + smokeRgb * (1.0 - alpha);
    outA = alpha + smokeA * (1.0 - alpha);
  }
  outA = max(outA, max(outRgb.r, max(outRgb.g, outRgb.b)));

  // Dither to keep the dark gradients from banding.
  float dither = (hash(gl_FragCoord.xy + fract(t)) - 0.5) / 255.0;
  gl_FragColor = vec4(outRgb + dither, clamp(outA + dither, 0.0, 1.0));
}
`;

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
};

/** Parse "rgba(160,35,10,0.98)" / "#ffaa30" into 0..1 rgb. */
export const parseColor = (value: string): RGB | null => {
  const rgba = value.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
  if (rgba) return [Number(rgba[1]) / 255, Number(rgba[2]) / 255, Number(rgba[3]) / 255];
  const hex = value.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  return null;
};

const mix = (a: RGB, b: RGB, k: number): RGB => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];

/**
 * Build a flame palette from a spectacle's three CSS colours so every special
 * fire (blue ghost, golden, void…) gets the same physical flame in its own colour.
 */
export const paletteFromColors = (a: string, b: string, c: string): FirePalette => {
  const edge = parseColor(a);
  const body = parseColor(b);
  const hot = parseColor(c);
  if (!edge || !body || !hot) return NORMAL_PALETTE;
  return {
    edge: mix(edge, [0, 0, 0], 0.18),
    body,
    hot: mix(hot, [1, 1, 1], 0.12),
    core: mix(hot, [1, 1, 1], 0.72),
  };
};

export class FireRenderer {
  private readonly program: WebGLProgram;
  private readonly buffer: WebGLBuffer;
  private readonly uniforms: Record<string, WebGLUniformLocation | null> = {};
  private lost = false;

  private constructor(
    private readonly gl: WebGLRenderingContext,
    program: WebGLProgram,
    buffer: WebGLBuffer,
  ) {
    this.program = program;
    this.buffer = buffer;
    [
      'uRes', 'uTime', 'uIntensity', 'uFlash', 'uSmoke', 'uHeight', 'uBase', 'uBedHalf',
      'uEdge', 'uBody', 'uHot', 'uCore',
    ].forEach((name) => {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    });
  }

  /** Returns null when WebGL (or highp floats) is unavailable. */
  static create(canvas: HTMLCanvasElement): FireRenderer | null {
    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: 'low-power',
      }) as WebGLRenderingContext | null;
    } catch {
      gl = null;
    }
    if (!gl) return null;

    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    if (!precision || precision.precision === 0) return null;

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    if (!program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;

    const buffer = gl.createBuffer();
    if (!buffer) return null;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // One oversized triangle covers the whole viewport.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const renderer = new FireRenderer(gl, program, buffer);
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      renderer.lost = true;
    });
    canvas.addEventListener('webglcontextrestored', () => {
      renderer.lost = true; // the component re-creates the renderer
    });
    return renderer;
  }

  get isLost() {
    return this.lost || this.gl.isContextLost();
  }

  resize(width: number, height: number) {
    const canvas = this.gl.canvas as HTMLCanvasElement;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    this.gl.viewport(0, 0, width, height);
  }

  draw(frame: FireFrame, palette: FirePalette) {
    const { gl, uniforms: u } = this;
    if (this.isLost) return;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    const loc = gl.getAttribLocation(this.program, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const canvas = gl.canvas as HTMLCanvasElement;
    gl.uniform2f(u.uRes, canvas.width, canvas.height);
    gl.uniform1f(u.uTime, frame.time);
    gl.uniform1f(u.uIntensity, frame.intensity);
    gl.uniform1f(u.uFlash, frame.flash);
    gl.uniform1f(u.uSmoke, frame.smoke);
    gl.uniform1f(u.uHeight, frame.height);
    gl.uniform1f(u.uBase, frame.base);
    gl.uniform1f(u.uBedHalf, frame.bedHalf);
    gl.uniform3fv(u.uEdge, palette.edge);
    gl.uniform3fv(u.uBody, palette.body);
    gl.uniform3fv(u.uHot, palette.hot);
    gl.uniform3fv(u.uCore, palette.core);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Release the GPU context immediately — browsers cap live contexts. */
  dispose() {
    const { gl } = this;
    try {
      gl.deleteProgram(this.program);
      gl.deleteBuffer(this.buffer);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      // already gone
    }
  }
}
