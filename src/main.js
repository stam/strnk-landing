import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { createContour } from './contour.js';
import './style.css';

const canvas = document.querySelector('#mascot');
const host = document.querySelector('.scene');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
// Development-only views let us review lighting and the unchanged silhouette.
const review = import.meta.env.DEV ? new URLSearchParams(location.search) : new URLSearchParams();
const wireframe = review.get('view') === 'wireframe';

async function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.65;
  RectAreaLightUniformsLib.init();
  renderer.shadowMap.enabled = !wireframe;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  const gltf = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/mascot.glb`);
  const mascot = gltf.scene;
  const fill = new THREE.MeshBasicMaterial({ color: '#111110', polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const line = new THREE.LineBasicMaterial({ color: '#cccac2' });
  const meshes = [];
  const contours = [];
  mascot.traverse((object) => { if (object.isMesh) meshes.push(object); });
  const charcoal = new THREE.Color('#1b1918');
  function studioMaterial(source) {
    if (!source?.isMeshStandardMaterial) return source;
    const material = source.clone();
    // The GLB uses COLOR_0 for its earlier brown/red palette.  Keep the asset
    // untouched, but disable that baked vertex tint in this studio treatment.
    material.vertexColors = false;
    material.color.copy(charcoal);
    material.roughness = Math.max(material.roughness ?? .8, .84);
    material.metalness = 0;
    material.envMapIntensity = .18;
    if (material.emissive) material.emissive.set(0x000000);
    material.emissiveIntensity = 0;
    material.needsUpdate = true;
    return material;
  }
  for (const object of meshes) {
    object.castShadow = true;
    object.receiveShadow = true;
    // The exported palettes remain intact; this only gives their rough wood a
    // common charcoal studio response under the site lights.
    if (!wireframe) object.material = Array.isArray(object.material)
      ? object.material.map(studioMaterial)
      : studioMaterial(object.material);
    if (wireframe) {
      object.material = fill;
      const edgeAngle = object.name.toLowerCase().includes('fist') ? 22 : 10;
      object.add(new THREE.LineSegments(new THREE.EdgesGeometry(object.geometry, edgeAngle), line));
      contours.push(createContour(object, line));
    }
  }
  scene.add(mascot);
  const bounds = new THREE.Box3().setFromObject(mascot);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const scale = Math.max(size.x, size.y, size.z);
  const ambient = new THREE.HemisphereLight('#d6d5d0', '#151412', .56);
  ambient.visible = false;
  scene.add(ambient);
  function aim(light, x, y, z) {
    light.position.set(center.x + x * scale, center.y + y * scale, center.z + z * scale);
    light.lookAt(center);
    scene.add(light);
    return light;
  }
  function studioSpot(color, intensity, x, y, z, angle, penumbra) {
    const light = new THREE.SpotLight(color, intensity, scale * 6, angle, penumbra, 2);
    light.position.set(center.x + x * scale, center.y + y * scale, center.z + z * scale);
    light.target.position.copy(center);
    scene.add(light, light.target);
    light.visible = false;
    return light;
  }
  // Step-one baseline: one neutral key only. Fill, rim, ambient and AO stay off.
  aim(new THREE.RectAreaLight('#ffffff', 28, scale * 1.6, scale * 1.3), -1.25, 1.42, .62);
  studioSpot('#fff1df', 480, -.72, 1.18, 1.25, .72, .9);
  studioSpot('#ddd9d2', 155, .2, .55, 1.7, .72, .9);
  studioSpot('#ff6d2e', 650, 1.08, .9, -1.6, .74, .9);
  studioSpot('#ff6d2e', 210, .95, -.2, -1.25, .62, .92);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(scale * 200, scale * 200),
    new THREE.MeshPhysicalMaterial({ color: '#070605', roughness: .94, metalness: 0, clearcoat: .04, clearcoatRoughness: 1, reflectivity: .12, envMapIntensity: .055 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(center.x, bounds.min.y - .015, center.z);
  ground.receiveShadow = true;
  ground.visible = !wireframe;
  scene.add(ground);
  // A one-time local PMREM probe gives the rough floor only a muted, blurred
  // reflection of the sculpture; it avoids inventing an HDR studio backdrop.
  if (!wireframe) {
    const reflectionTarget = new THREE.WebGLCubeRenderTarget(128);
    const reflectionProbe = new THREE.CubeCamera(.1, scale * 8, reflectionTarget);
    reflectionProbe.position.set(center.x, bounds.min.y + .04, center.z + scale * .08);
    ground.visible = false;
    reflectionProbe.update(renderer, scene);
    ground.visible = true;
    const pmrem = new THREE.PMREMGenerator(renderer);
    ground.material.envMap = pmrem.fromCubemap(reflectionTarget.texture).texture;
    ground.material.needsUpdate = true;
  }
  let pointerX = 0, pointerY = 0, frame;

  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const distance = Math.max(size.y / (2 * Math.tan(halfFov)), size.x / (2 * Math.tan(halfFov) * camera.aspect)) * 1.24;
    // Below the sculpture's midpoint, looking up from near the roots.
    camera.position.set(center.x, center.y - distance * .12, center.z + distance);
    if (review.get('camera') === 'front') camera.position.set(center.x, center.y, center.z + distance);
    if (review.get('camera') === 'side') camera.position.set(center.x + distance * .7, center.y + distance * .35, center.z + distance * .8);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
    mascot.updateMatrixWorld(true);
    contours.forEach((update) => update(camera));
    renderer.render(scene, camera);
  }
  window.addEventListener('pointermove', (event) => {
    pointerX = (event.clientX / innerWidth - .5) * 2;
    pointerY = (event.clientY / innerHeight - .5) * 2;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  function render(time = 0) {
    const motion = !reducedMotion.matches;
    const rotation = -.06 + (motion ? pointerX * .055 + Math.sin(time * .00035) * .015 : 0);
    mascot.rotation.y += (rotation - mascot.rotation.y) * .045;
    mascot.rotation.x += ((motion ? pointerY * .015 : 0) - mascot.rotation.x) * .045;
    mascot.updateMatrixWorld(true);
    contours.forEach((update) => update(camera));
    renderer.render(scene, camera);
    if (motion && !document.hidden) frame = requestAnimationFrame(render);
  }
  function restart() { cancelAnimationFrame(frame); render(); }
  mascot.rotation.y = -.06;
  new ResizeObserver(resize).observe(host);
  reducedMotion.addEventListener('change', restart);
  document.addEventListener('visibilitychange', restart);
  canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); cancelAnimationFrame(frame); host.classList.remove('ready'); });
  canvas.addEventListener('webglcontextrestored', () => { resize(); host.classList.add('ready'); restart(); });
  resize();
  render();
  host.classList.add('ready');
}

start().catch((error) => console.warn('3D rendering unavailable; showing the STRNK logo.', error));
