import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('#mascot');
const host = document.querySelector('.scene');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

try {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  const target = new THREE.Vector3(0, 1.65, 0);
  const mascot = new THREE.Group();
  scene.add(mascot);
  const clay = new THREE.MeshStandardMaterial({ color: '#cf8153', roughness: .86, metalness: 0, flatShading: true });

  function mesh(geometry, position = [0, 0, 0], scale = [1, 1, 1], parent = mascot) {
    const object = new THREE.Mesh(geometry, clay);
    object.position.set(...position);
    object.scale.set(...scale);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  // Uneven, triangulated rings form a solid stump with a flat cut top.
  const sides = 11;
  const rings = [[.12, 1.03], [.55, .79], [1.35, .64], [2.2, .74], [2.58, .78]];
  const vertices = [];
  for (let r = 0; r < rings.length; r++) {
    for (let i = 0; i < sides; i++) {
      const angle = i / sides * Math.PI * 2;
      const variation = 1 + Math.sin(i * 4.7 + r * 1.8) * .075;
      const radius = rings[r][1] * variation;
      vertices.push(Math.cos(angle) * radius, rings[r][0], Math.sin(angle) * radius * .82);
    }
  }
  const indices = [];
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < sides; i++) {
      const a = r * sides + i, b = r * sides + (i + 1) % sides, c = a + sides, d = b + sides;
      indices.push(a, c, b, b, c, d);
    }
  }
  vertices.push(0, rings.at(-1)[0], 0);
  const top = vertices.length / 3 - 1;
  for (let i = 0; i < sides; i++) indices.push(top, 4 * sides + (i + 1) % sides, 4 * sides + i);
  const trunk = new THREE.BufferGeometry();
  trunk.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  trunk.setIndex(indices);
  const facetedTrunk = trunk.toNonIndexed();
  facetedTrunk.computeVertexNormals();
  mesh(facetedTrunk);
  trunk.dispose();

  // Tapered roots fan out in three dimensions, with broad shoulders and pointed ends.
  for (let i = 0; i < 7; i++) {
    const angle = i / 7 * Math.PI * 2 + .2;
    const length = 1.48 + (i % 3) * .13;
    const root = new THREE.BufferGeometry();
    root.setAttribute('position', new THREE.Float32BufferAttribute([
      -.34, .08, .46, .34, .08, .46, 0, .9, .55,
      -.24, .05, 1.12, .24, .05, 1.12, 0, .36, 1.06,
      .03, .035, length,
    ], 3));
    root.setIndex([0,2,3,2,5,3,2,1,5,1,4,5,3,5,6,5,4,6,0,1,2,0,3,1,1,3,4,3,6,4]);
    const geometry = root.toNonIndexed();
    geometry.computeVertexNormals();
    mesh(geometry).rotation.y = angle;
    root.dispose();
  }

  // Each arm is a continuous polygonal sweep: shoulder, bicep, elbow, forearm, wrist.
  function arm(side) {
    const points = [
      [.60, 2.04, 0, .36], [.96, 2.05, 0, .46], [1.32, 1.98, .02, .48],
      [1.69, 1.92, .02, .34], [1.94, 2.09, .015, .28], [2.03, 2.40, .01, .30],
      [1.98, 2.74, .015, .25], [1.87, 3.06, .025, .19],
    ];
    const positions = [], faces = [], segments = 7;
    points.forEach((point, j) => {
      const previous = points[Math.max(j - 1, 0)], next = points[Math.min(j + 1, points.length - 1)];
      const tangent = new THREE.Vector3((next[0] - previous[0]) * side, next[1] - previous[1], 0).normalize();
      const normal = new THREE.Vector3(-tangent.y, tangent.x, 0);
      for (let k = 0; k < segments; k++) {
        const theta = k / segments * Math.PI * 2;
        positions.push(point[0] * side + normal.x * Math.cos(theta) * point[3], point[1] + normal.y * Math.cos(theta) * point[3], point[2] + Math.sin(theta) * point[3] * .88);
        if (j < points.length - 1) {
          const a = j * segments + k, b = j * segments + (k + 1) % segments;
          faces.push(a, b, a + segments, b, b + segments, a + segments);
        }
      }
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(faces);
    const flat = geometry.toNonIndexed();
    flat.computeVertexNormals();
    mesh(flat);
    geometry.dispose();
    // Blocky fists, turned inward; a thumb gives the flex a readable silhouette.
    const fist = mesh(new THREE.DodecahedronGeometry(.34, 0), [side * 1.80, 3.19, .035], [1.08, .87, .85]);
    fist.rotation.z = side * -.27;
    mesh(new THREE.DodecahedronGeometry(.16, 0), [side * 1.61, 3.10, .23], [1, .8, .85]);
  }
  arm(-1);
  arm(1);

  scene.add(new THREE.HemisphereLight(0xffead1, 0x29372c, 2.4));
  const key = new THREE.DirectionalLight(0xffe1bc, 4.2);
  key.position.set(-3, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 6, bottom: -4 });
  key.shadow.normalBias = .035;
  key.shadow.bias = -.0001;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffba78, 2.3);
  rim.position.set(4, 4, -3);
  scene.add(rim);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .23 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.01;
  ground.receiveShadow = true;
  scene.add(ground);

  let pointerX = 0, pointerY = 0, frame;
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const distance = Math.max(8.9, 5.3 / (2 * Math.tan(THREE.MathUtils.degToRad(17)) * camera.aspect));
    camera.position.set(0, 1.65 + distance * .23, distance);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
  }
  window.addEventListener('pointermove', (event) => {
    pointerX = (event.clientX / innerWidth - .5) * 2;
    pointerY = (event.clientY / innerHeight - .5) * 2;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  function render(time = 0) {
    const motion = !reducedMotion.matches;
    const targetY = -.18 + (motion ? pointerX * .16 + Math.sin(time * .00045) * .045 : 0);
    mascot.rotation.y += (targetY - mascot.rotation.y) * .045;
    mascot.rotation.x += ((motion ? pointerY * .025 : 0) - mascot.rotation.x) * .045;
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
} catch (error) {
  console.warn('3D rendering unavailable; showing the STRNK logo.', error);
}
