/**
 * The scene "rig": shared materials/uniforms plus refs to the objects the per-frame driver moves.
 * Built once per mount; every frame only writes numbers into these objects (no allocation).
 */
import * as THREE from "three";
import { BERGEN, GLOBE_CENTRE, R, REGION } from "./geo";
import { atmosphereShader, cloudShader, skyShader, starShader, surfaceShader, terrainShader } from "./shaders";

const lin = (hex: string) => new THREE.Color(hex);

/** Sun: afternoon light from the south-west (azimuth 215°, elevation 27°) in the local frame. */
const AZ = (215 * Math.PI) / 180;
const EL = (27 * Math.PI) / 180;
export const SUN = new THREE.Vector3(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), -Math.cos(AZ) * Math.cos(EL)).normalize();

export function makeMaterials(textures: { globe: THREE.Texture; clouds: THREE.Texture | null }) {
  const shared = {
    uSun: { value: SUN },
    uHaze: { value: lin("#9fb5c9") },
    uSunHaze: { value: lin("#3a3226") },
    uFogDensity: { value: 0 },
    uExposure: { value: 1.08 },
    uSky: { value: lin("#6f8ba3") },
  };
  const surface = new THREE.ShaderMaterial({
    vertexShader: surfaceShader.vertex,
    fragmentShader: surfaceShader.fragment,
    toneMapped: false,
    uniforms: {
      ...shared,
      uDay: { value: textures.globe },
      uRegion: { value: null },
      uBergen: { value: null },
      uRegionOn: { value: 0 },
      uBergenOn: { value: 0 },
      uRegionBox: { value: new THREE.Vector4(REGION.lonMin, REGION.latMin, REGION.lonMax - REGION.lonMin, REGION.latMax - REGION.latMin) },
      uBOrigin: { value: BERGEN.origin },
      uBRight: { value: BERGEN.right },
      uBUp: { value: BERGEN.up },
      uBSize: { value: BERGEN.size },
      uCentre: { value: GLOBE_CENTRE },
      uSpace: { value: 1 },
      uDeepWater: { value: 0 },
      uAtmo: { value: lin("#2f5d9c").multiplyScalar(0.55) },
    },
  });
  const terrain = () =>
    new THREE.ShaderMaterial({
      vertexShader: terrainShader.vertex,
      fragmentShader: terrainShader.fragment,
      toneMapped: false,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2,
      uniforms: {
        ...shared,
        uMap: { value: null },
        uOpacity: { value: 0 },
        uFeather: { value: 0.06 },
        uRelief: { value: 0.9 },
        uTime: { value: 0 },
        uHole: { value: new THREE.Vector4(0.418, 0.453, 0.554, 0.589) },
        uHoleDepth: { value: 0 },
      },
    });
  const clouds = textures.clouds
    ? new THREE.ShaderMaterial({
        vertexShader: cloudShader.vertex,
        fragmentShader: cloudShader.fragment,
        toneMapped: false,
        transparent: true,
        depthWrite: false,
        uniforms: { uClouds: { value: textures.clouds }, uSun: shared.uSun, uOpacity: { value: 1 } },
      })
    : null;
  const atmo = new THREE.ShaderMaterial({
    vertexShader: atmosphereShader.vertex,
    fragmentShader: atmosphereShader.fragment,
    toneMapped: false,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uCentre: { value: GLOBE_CENTRE },
      uR: { value: R },
      uScaleHeight: { value: 28 },
      uSun: shared.uSun,
      uColor: { value: lin("#4a7fd0") },
      uIntensity: { value: 0.9 },
    },
  });
  const sky = new THREE.ShaderMaterial({
    vertexShader: skyShader.vertex,
    fragmentShader: skyShader.fragment,
    toneMapped: false,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uInvProj: { value: new THREE.Matrix4() },
      uCamWorld: { value: new THREE.Matrix4() },
      uUp: { value: new THREE.Vector3(0, 1, 0) },
      uSun: shared.uSun,
      uZenith: { value: lin("#3f6a95") },
      uHaze: shared.uHaze,
      uSunHaze: shared.uSunHaze,
      uSpaceCol: { value: lin("#020407") },
      uSpace: { value: 1 },
      uDip: { value: 0 },
    },
  });
  const stars = new THREE.ShaderMaterial({
    vertexShader: starShader.vertex,
    fragmentShader: starShader.fragment,
    toneMapped: false,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uOpacity: { value: 1 }, uScale: { value: 1 } },
  });
  return { shared, surface, terrainBig: terrain(), terrainDetail: terrain(), clouds, atmo, sky, stars };
}

export type Mats = ReturnType<typeof makeMaterials>;

export type SoilRig = {
  group: THREE.Group;
  slabs: THREE.Group[];
};

export type Rig = {
  mats: Mats;
  globe?: THREE.Mesh;
  clouds?: THREE.Mesh;
  atmo?: THREE.Mesh;
  patch?: THREE.Mesh;
  sky?: THREE.Mesh;
  stars?: THREE.Object3D;
  terrain?: THREE.Mesh;
  detail?: THREE.Mesh;
  map?: THREE.Group;
  soil?: SoilRig;
  laksevag?: THREE.Object3D;
  /** Ground height (km, exaggerated) under a local position, once a DEM is loaded. */
  ground?: (x: number, z: number) => number;
};

export function disposeMaterials(m: Mats) {
  m.surface.dispose();
  m.terrainBig.dispose();
  m.terrainDetail.dispose();
  m.clouds?.dispose();
  m.atmo.dispose();
  m.sky.dispose();
  m.stars.dispose();
}
