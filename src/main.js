import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createContour } from './contour.js';
import './style.css';

const canvas = document.querySelector('#mascot');
const host = document.querySelector('.scene');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

async function start() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 100);
  const gltf = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/mascot.glb`);
  const mascot = gltf.scene;
  const fill = new THREE.MeshBasicMaterial({ color: '#202020', polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const line = new THREE.LineBasicMaterial({ color: '#cccac2' });
  const meshes = [];
  const contours = [];
  mascot.traverse((object) => { if (object.isMesh) meshes.push(object); });
  for (const object of meshes) {
    const oldMaterials = Array.isArray(object.material) ? object.material : [object.material];
    oldMaterials.forEach((material) => material.dispose());
    object.material = fill;
    // Show the sculptural planes while omitting nearly flat remeshing edges.
    const edgeAngle = object.name.toLowerCase().includes('fist') ? 22 : 10;
    object.add(new THREE.LineSegments(new THREE.EdgesGeometry(object.geometry, edgeAngle), line));
    contours.push(createContour(object, line));
  }
  scene.add(mascot);
  const bounds = new THREE.Box3().setFromObject(mascot);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  let pointerX = 0, pointerY = 0, frame;

  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const distance = Math.max(size.y / (2 * Math.tan(halfFov)), size.x / (2 * Math.tan(halfFov) * camera.aspect)) * 1.26;
    // Below the sculpture's midpoint, looking up from near the roots.
    camera.position.set(center.x, center.y - distance * .12, center.z + distance);
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
    const rotation = -.18 + (motion ? pointerX * .12 + Math.sin(time * .00035) * .035 : 0);
    mascot.rotation.y += (rotation - mascot.rotation.y) * .045;
    mascot.rotation.x += ((motion ? pointerY * .015 : 0) - mascot.rotation.x) * .045;
    mascot.updateMatrixWorld(true);
    contours.forEach((update) => update(camera));
    renderer.render(scene, camera);
    if (motion && !document.hidden) frame = requestAnimationFrame(render);
  }
  function restart() { cancelAnimationFrame(frame); render(); }
  mascot.rotation.y = -.18;
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
