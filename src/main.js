import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
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
  for (const object of meshes) {
    object.castShadow = true;
    object.receiveShadow = true;
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
  scene.add(new THREE.HemisphereLight('#d8deed', '#24170f', .7));
  function studioLight(color, intensity, x, y, z) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(center.x + x * scale, center.y + y * scale, center.z + z * scale);
    light.target.position.copy(center);
    scene.add(light, light.target);
    return light;
  }
  const key = studioLight('#fff0db', 9, -.65, 1.2, 1);
  studioLight('#bdcbe0', 1.2, .7, .3, 1);
  studioLight('#dec4ab', 2.1, -.2, .35, 1.35);
  const rim = studioLight('#ff732d', 8, .95, .45, -.35);
  studioLight('#ffad6a', 1.6, -.8, .25, -.4);
  for (const light of [key, rim]) {
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, { left: -scale, right: scale, top: scale, bottom: -scale, near: .1, far: scale * 5 });
    light.shadow.normalBias = scale * .002;
    light.shadow.bias = -.0001;
    light.shadow.radius = 3;
  }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(scale * 20, scale * 20), new THREE.ShadowMaterial({ opacity: .14 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(center.x, bounds.min.y - .015, center.z);
  ground.receiveShadow = true;
  ground.visible = !wireframe;
  scene.add(ground);
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
