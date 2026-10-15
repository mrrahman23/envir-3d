/**
 * GLSL for the Earth story. All surfaces share one lighting model so the globe, the regional
 * map and the DEM terrain cross-fade without a visible change in exposure:
 *   colour = albedo × (direct(N·L) × sun-visibility + ambient × sky-occlusion), then aerial perspective.
 * Satellite imagery already contains some baked light, so direct light is kept gentle.
 */

const LIGHT = /* glsl */ `
uniform vec3 uSun;
uniform vec3 uHaze;
uniform vec3 uSunHaze;
uniform float uFogDensity;
uniform float uExposure;

float directLight(float nl) {
  return smoothstep(-0.1, 0.25, nl) * (0.5 + 0.62 * max(nl, 0.0));
}
// Steeper response for DEM relief (the imagery's own shading is soft and top-lit).
float reliefLight(float nl) {
  return 0.2 + 1.05 * max(nl, 0.0);
}

vec3 aerial(vec3 col, vec3 worldPos) {
  vec3 ray = worldPos - cameraPosition;
  float d = length(ray);
  float f = 1.0 - exp(-d * uFogDensity);
  float toSun = pow(max(dot(ray / d, uSun), 0.0), 6.0);
  vec3 haze = uHaze + uSunHaze * toSun;
  return mix(col, haze, f);
}

vec3 waterSurface(vec3 col, vec3 N, vec3 V, vec3 sky, float amount) {
  vec3 H = normalize(uSun + V);
  float spec = pow(max(dot(N, H), 0.0), 140.0) * 1.6 + pow(max(dot(N, H), 0.0), 24.0) * 0.05;
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  return mix(col, col + sky * fres * 0.55 + vec3(1.0, 0.96, 0.88) * spec, amount);
}
`;

const VERT_WORLD = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

/** Globe sphere and the high-res regional patch: BMNG + regional crop + Bergen square, sun-lit. */
export const surfaceShader = {
  vertex: VERT_WORLD,
  fragment: /* glsl */ `
${LIGHT}
uniform sampler2D uDay;
uniform sampler2D uRegion;
uniform sampler2D uBergen;
uniform float uRegionOn;
uniform float uBergenOn;
uniform vec4 uRegionBox; // lonMin, latMin, lonSpan, latSpan
uniform vec3 uBOrigin;
uniform vec3 uBRight;
uniform vec3 uBUp;
uniform float uBSize;
uniform vec3 uCentre;
uniform float uSpace;
uniform float uDeepWater;
uniform vec3 uAtmo;
uniform vec3 uSky;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;

float inside(vec2 uv, float f) {
  vec2 e = min(uv, 1.0 - uv);
  return smoothstep(0.0, f, min(e.x, e.y));
}

void main() {
  vec3 col = texture2D(uDay, vUv).rgb;
  float lon = vUv.x * 360.0 - 180.0;
  float lat = vUv.y * 180.0 - 90.0;
  vec2 ruv = vec2((lon - uRegionBox.x) / uRegionBox.z, (lat - uRegionBox.y) / uRegionBox.w);
  float rw = uRegionOn * inside(ruv, 0.05);
  if (rw > 0.0) col = mix(col, texture2D(uRegion, ruv).rgb, rw);

  // Bathymetry blue in Blue Marble reads too bright and saturated next to Sentinel-2 water.
  float water = smoothstep(0.012, 0.05, col.b - max(col.r, col.g));
  col = mix(col, col * vec3(0.42, 0.6, 0.72), water * 0.85);
  // Up close the open sea takes the deep tone of the Sentinel-2 water around Bergen.
  col = mix(col, vec3(0.006, 0.01, 0.016), water * uDeepWater);

  vec3 rel = vWorld - uBOrigin;
  vec2 buv = vec2(dot(rel, uBRight), dot(rel, uBUp)) / uBSize;
  float bw = uBergenOn * inside(buv, 0.12);
  if (bw > 0.0) col = mix(col, texture2D(uBergen, buv).rgb, bw);

  vec3 N = normalize(vNormal);
  vec3 up = normalize(vWorld - uCentre);
  vec3 V = normalize(cameraPosition - vWorld);
  float nl = dot(N, uSun);
  float day = smoothstep(-0.12, 0.3, dot(up, uSun));
  vec3 lit = col * (directLight(nl) + 0.2 * day) * uExposure;
  lit = waterSurface(lit, N, V, uSky * day, water * (1.0 - bw) * day);
  // Thin daylit limb from space: scattering grows towards grazing angles.
  float limb = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  lit += uAtmo * limb * day * uSpace;
  lit = aerial(lit, vWorld);
  gl_FragColor = vec4(lit, 1.0);
  #include <colorspace_fragment>
}
`,
};

/** DEM-displaced Sentinel-2 terrain with baked sun visibility / sky occlusion. */
export const terrainShader = {
  vertex: /* glsl */ `
attribute vec2 aShade;
attribute float aH;
uniform vec4 uHole;
uniform float uHoleDepth;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
varying vec2 vShade;
varying float vH;
void main() {
  vUv = uv;
  vShade = aShade;
  vH = aH;
  // A finer terrain patch can sit on top: sink this surface inside its footprint.
  vec2 hin = min(uv - uHole.xy, uHole.zw - uv);
  vec3 p = position;
  p.y -= uHoleDepth * clamp(min(hin.x, hin.y) * 60.0, 0.0, 1.0);
  vec4 w = modelMatrix * vec4(p, 1.0);
  vWorld = w.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}
`,
  fragment: /* glsl */ `
${LIGHT}
uniform sampler2D uMap;
uniform float uOpacity;
uniform float uFeather;
uniform float uRelief;
uniform vec3 uSky;
uniform float uTime;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
varying vec2 vShade;
varying float vH;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

void main() {
  vec2 e = min(vUv, 1.0 - vUv);
  float a = uOpacity * smoothstep(0.0, uFeather, min(e.x, e.y));
  if (a < 0.002) discard;
  vec3 col = texture2D(uMap, vUv).rgb;
  vec3 N = normalize(vNormal);
  vec3 V = normalize(cameraPosition - vWorld);
  float water = 1.0 - smoothstep(0.4, 1.6, vH);

  // Normalised so flat ground matches the regional map exactly; slopes and shadows deviate from it.
  float flat_ = directLight(uSun.y);
  float rel = reliefLight(dot(N, uSun)) * vShade.x / reliefLight(uSun.y);
  float direct = flat_ * mix(1.0, rel, uRelief);
  vec3 lit = col * (direct + 0.2 * mix(1.0, vShade.y, uRelief)) * uExposure;

  // Gentle wind ripples on the water: perturbed normal for sun glints, fresnel sky reflection.
  vec2 wp = vWorld.xz * 2.2;
  float n1 = vnoise(wp + uTime * 0.05) - vnoise(wp * 2.3 - uTime * 0.04);
  float n2 = vnoise(wp.yx * 1.7 + 3.1) - vnoise(wp * 3.1 + uTime * 0.03);
  vec3 Nw = normalize(vec3(n1 * 0.05, 1.0, n2 * 0.05));
  lit = waterSurface(lit, Nw, V, uSky, water);

  lit = aerial(lit, vWorld);
  gl_FragColor = vec4(lit, a);
  #include <colorspace_fragment>
}
`,
};

/** Cloud layer: Blue Marble cloud composite with a smoothstep threshold (no haze veil). */
export const cloudShader = {
  vertex: VERT_WORLD,
  fragment: /* glsl */ `
uniform sampler2D uClouds;
uniform vec3 uSun;
uniform float uOpacity;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  float c = texture2D(uClouds, vUv).r;
  float a = smoothstep(0.28, 0.78, c) * uOpacity;
  float nl = dot(normalize(vNormal), uSun);
  float day = smoothstep(-0.12, 0.3, nl);
  vec3 col = vec3(0.92, 0.94, 0.96) * (0.25 + 0.8 * max(nl, 0.0)) * day;
  gl_FragColor = vec4(col, a * (0.15 + 0.85 * day));
  #include <colorspace_fragment>
}
`,
};

/** Thin atmosphere shell (BackSide, additive): density from the ray's closest approach height. */
export const atmosphereShader = {
  vertex: VERT_WORLD,
  fragment: /* glsl */ `
uniform vec3 uCentre;
uniform float uR;
uniform float uScaleHeight;
uniform vec3 uSun;
uniform vec3 uColor;
uniform float uIntensity;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  vec3 d = normalize(vWorld - cameraPosition);
  vec3 oc = cameraPosition - uCentre;
  float tca = max(-dot(oc, d), 0.0);
  vec3 cp = oc + d * tca;
  float h = length(cp) - uR;
  float dens = h >= 0.0 ? exp(-h / uScaleHeight) : exp(h / (uScaleHeight * 0.35));
  float lit = smoothstep(-0.3, 0.35, dot(normalize(cp), uSun));
  vec3 col = uColor * dens * lit * uIntensity;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`,
};

/** Full-screen sky: deep space blending into a daylight gradient as the camera descends. */
export const skyShader = {
  vertex: /* glsl */ `
varying vec2 vNdc;
void main() {
  vNdc = position.xy;
  gl_Position = vec4(position.xy, 1.0, 1.0);
}
`,
  fragment: /* glsl */ `
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform vec3 uUp;
uniform vec3 uSun;
uniform vec3 uZenith;
uniform vec3 uHaze;
uniform vec3 uSunHaze;
uniform vec3 uSpaceCol;
uniform float uSpace;
uniform float uDip;
varying vec2 vNdc;
void main() {
  vec4 v = uInvProj * vec4(vNdc, 1.0, 1.0);
  vec3 dir = normalize((uCamWorld * vec4(v.xyz / v.w, 0.0)).xyz);
  float e = dot(dir, uUp) + uDip;
  vec3 sky = mix(uHaze, uZenith, pow(clamp(e, 0.0, 1.0), 0.5));
  sky += uSunHaze * pow(max(dot(dir, uSun), 0.0), 6.0) * (1.0 - clamp(e, 0.0, 1.0));
  vec3 col = mix(sky, uSpaceCol, uSpace);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`,
};

/** Faint starfield at infinity. */
export const starShader = {
  vertex: /* glsl */ `
attribute float aMag;
uniform float uScale;
varying float vMag;
void main() {
  vMag = aMag;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 0.0);
  gl_Position = vec4(p.xy, p.w * 0.99999, p.w);
  gl_PointSize = mix(1.0, 2.0, aMag) * uScale;
}
`,
  fragment: /* glsl */ `
uniform float uOpacity;
varying float vMag;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float a = smoothstep(0.5, 0.1, length(c)) * uOpacity * mix(0.25, 0.9, vMag);
  gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * a, 1.0);
  #include <colorspace_fragment>
}
`,
};
