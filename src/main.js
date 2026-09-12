import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { createContour } from "./contour.js";
import "./style.css";

/**
 * The production scene factory is shared by the landing page and studio page.
 * Consumers may supply a composition that owns viewport layout only; the GLB,
 * material response, lights, floor, camera, motion, and review hooks live here.
 */
export async function createStrnkScene({
  canvas = document.querySelector("#mascot"),
  host = document.querySelector(".scene"),
  composition = null,
} = {}) {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  // Development-only views let us review lighting and the unchanged silhouette.
  const review = import.meta.env.DEV
    ? new URLSearchParams(location.search)
    : new URLSearchParams();
  const wireframe = review.get("view") === "wireframe";
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = !composition;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.65;
  RectAreaLightUniformsLib.init();
  renderer.shadowMap.enabled = !wireframe;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  const gltf = await new GLTFLoader().loadAsync(
    `${import.meta.env.BASE_URL}models/mascot.glb`,
  );
  const mascot = gltf.scene;
  const wireframeFill = new THREE.MeshBasicMaterial({
    color: "#111110",
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const line = new THREE.LineBasicMaterial({ color: "#cccac2" });
  const meshes = [];
  const contours = [];
  mascot.traverse((object) => {
    if (object.isMesh) meshes.push(object);
  });
  const charcoal = new THREE.Color("#1b1918");
  function studioMaterial(source) {
    if (!source?.isMeshStandardMaterial) return source;
    const material = source.clone();
    // The GLB uses COLOR_0 for its earlier brown/red palette.  Keep the asset
    // untouched, but disable that baked vertex tint in this studio treatment.
    material.vertexColors = false;
    material.color.copy(charcoal);
    material.roughness = Math.max(material.roughness ?? 0.8, 0.84);
    material.metalness = 0;
    material.envMapIntensity = 0.18;
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
    if (!wireframe)
      object.material = Array.isArray(object.material)
        ? object.material.map(studioMaterial)
        : studioMaterial(object.material);
    if (wireframe) {
      object.material = wireframeFill;
      const edgeAngle = object.name.toLowerCase().includes("fist") ? 22 : 10;
      object.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(object.geometry, edgeAngle),
          line,
        ),
      );
      contours.push(createContour(object, line));
    }
  }
  scene.add(mascot);
  const bounds = new THREE.Box3().setFromObject(mascot);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const scale = Math.max(size.x, size.y, size.z);
  // Key position and size are mascot-scale multiples; position is relative to the bounds center.
  const lighting = {
    exposure: renderer.toneMappingExposure,
    key: {
      enabled: true,
      color: "#ffffff",
      intensity: 19.3,
      width: 1.84,
      height: 1.37,
      position: {
        x: 0.61,
        y: 0.76,
        z: -0.04,
      },
    },
    fill: {
      enabled: true,
      color: "#ffffff",
      intensity: 3.31,
      width: 2.6,
      height: 1.7,
      position: {
        x: -1.48,
        y: -0.69,
        z: 1.63,
      },
    },
    rim: {
      right: {
        enabled: true,
        color: "#ff6d2e",
        intensity: 260,
        width: 0.94,
        height: 2.58,
        position: {
          x: -1.76,
          y: 0.36,
          z: -1.8,
        },
        target: {
          x: -1.28,
          y: 0.04,
          z: -0.42,
        },
      },
      left: {
        enabled: true,
        color: "#d97938",
        intensity: 90,
        width: 2.45,
        height: 1.02,
        position: {
          x: 1.78,
          y: -0.32,
          z: -1.54,
        },
        target: {
          x: 1.24,
          y: -0.54,
          z: -0.34,
        },
      },
    },
  };
  const stateListeners = new Set();
  const notifyState = () => {
    const state = {
      lighting,
      camera,
      lights: {
        key: keyLight,
        fill: fillLight,
        rimA: rimLight,
        rimB: secondaryRimLight,
      },
      center,
      size,
      scale,
    };
    composition?.onStateChange?.(state);
    stateListeners.forEach((listener) => listener(state));
  };
  function aim(light, x, y, z) {
    light.position.set(
      center.x + x * scale,
      center.y + y * scale,
      center.z + z * scale,
    );
    light.lookAt(center);
    scene.add(light);
    return light;
  }
  // Step three: retain the approved key and add one soft, neutral fill source.
  const keyLight = aim(
    new THREE.RectAreaLight(
      lighting.key.color,
      lighting.key.intensity,
      lighting.key.width * scale,
      lighting.key.height * scale,
    ),
    lighting.key.position.x,
    lighting.key.position.y,
    lighting.key.position.z,
  );
  const fillLight = aim(
    new THREE.RectAreaLight(
      lighting.fill.color,
      lighting.fill.intensity,
      lighting.fill.width * scale,
      lighting.fill.height * scale,
    ),
    lighting.fill.position.x,
    lighting.fill.position.y,
    lighting.fill.position.z,
  );
  // Separate rear softboxes keep each side's coverage and aim independently
  // adjustable, without adding a broad frontal source.
  const rimLight = new THREE.RectAreaLight(
    lighting.rim.right.color,
    lighting.rim.right.intensity,
    lighting.rim.right.width * scale,
    lighting.rim.right.height * scale,
  );
  const secondaryRimLight = new THREE.RectAreaLight(
    lighting.rim.left.color,
    lighting.rim.left.intensity,
    lighting.rim.left.width * scale,
    lighting.rim.left.height * scale,
  );
  scene.add(rimLight, secondaryRimLight);
  keyLight.name = "Key";
  fillLight.name = "Fill";
  rimLight.name = "Rim Right";
  secondaryRimLight.name = "Rim Left";
  function applyKey() {
    keyLight.visible = lighting.key.enabled;
    keyLight.color.set(lighting.key.color);
    keyLight.intensity = lighting.key.intensity;
    keyLight.width = lighting.key.width * scale;
    keyLight.height = lighting.key.height * scale;
    keyLight.position.set(
      center.x + lighting.key.position.x * scale,
      center.y + lighting.key.position.y * scale,
      center.z + lighting.key.position.z * scale,
    );
    keyLight.lookAt(center);
    notifyState();
  }
  function applyFill() {
    fillLight.visible = lighting.fill.enabled;
    fillLight.color.set(lighting.fill.color);
    fillLight.intensity = lighting.fill.intensity;
    fillLight.width = lighting.fill.width * scale;
    fillLight.height = lighting.fill.height * scale;
    fillLight.position.set(
      center.x + lighting.fill.position.x * scale,
      center.y + lighting.fill.position.y * scale,
      center.z + lighting.fill.position.z * scale,
    );
    fillLight.lookAt(center);
    notifyState();
  }
  function applyRim() {
    const applySoftbox = (light, settings) => {
      light.visible = settings.enabled;
      light.color.set(settings.color);
      light.intensity = settings.intensity;
      light.width = settings.width * scale;
      light.height = settings.height * scale;
      light.position.set(
        center.x + settings.position.x * scale,
        center.y + settings.position.y * scale,
        center.z + settings.position.z * scale,
      );
      light.lookAt(
        center.x + settings.target.x * scale,
        center.y + settings.target.y * scale,
        center.z + settings.target.z * scale,
      );
    };
    applySoftbox(rimLight, lighting.rim.right);
    applySoftbox(secondaryRimLight, lighting.rim.left);
    notifyState();
  }
  function applyExposure() {
    renderer.toneMappingExposure = lighting.exposure;
  }
  applyKey();
  applyFill();
  applyRim();
  applyExposure();
  const floorViewport = new THREE.Vector2();
  const floor = {
    baseColor: "#050504",
    reflectionStrength: 0.69,
    opacity: 0.49,
    radialFadeStart: scale * 0.55,
    radialFadeEnd: scale * 1.65,
    radialFadeLimit: scale * 3,
    screenEdgeFade: 0.1,
  };
  const floorReflectionShader = {
    uniforms: {
      color: { value: null },
      tDiffuse: { value: null },
      textureMatrix: { value: null },
      floorCenter: { value: new THREE.Vector2(center.x, center.z) },
      floorFadeStart: { value: floor.radialFadeStart },
      floorFadeEnd: { value: floor.radialFadeEnd },
      floorViewport: { value: floorViewport },
      floorOpacity: { value: floor.opacity },
      reflectionStrength: { value: floor.reflectionStrength },
      screenEdgeFade: { value: floor.screenEdgeFade },
      reflectionTexel: { value: new THREE.Vector2(1 / 512, 1 / 512) },
    },
    vertexShader: `
      uniform mat4 textureMatrix;
      varying vec4 vUv;
      varying vec3 floorWorldPosition;

      #include <common>
      #include <logdepthbuf_pars_vertex>

      void main() {
        vUv = textureMatrix * vec4( position, 1.0 );
        floorWorldPosition = ( modelMatrix * vec4( position, 1.0 ) ).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        #include <logdepthbuf_vertex>
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      uniform sampler2D tDiffuse;
      uniform vec2 floorCenter;
      uniform float floorFadeStart;
      uniform float floorFadeEnd;
      uniform vec2 floorViewport;
      uniform float floorOpacity;
      uniform float reflectionStrength;
      uniform float screenEdgeFade;
      uniform vec2 reflectionTexel;
      varying vec4 vUv;
      varying vec3 floorWorldPosition;

      #include <logdepthbuf_pars_fragment>

      vec4 reflectedSample( vec2 offset ) {
        return texture2DProj( tDiffuse, vUv + vec4( offset * vUv.w, 0.0, 0.0 ) );
      }

      void main() {
        #include <logdepthbuf_fragment>

        vec2 blur = reflectionTexel * 2.5;
        vec4 reflection = reflectedSample( vec2( 0.0 ) ) * 0.20;
        reflection += reflectedSample( vec2( blur.x, 0.0 ) ) * 0.12;
        reflection += reflectedSample( vec2( -blur.x, 0.0 ) ) * 0.12;
        reflection += reflectedSample( vec2( 0.0, blur.y ) ) * 0.12;
        reflection += reflectedSample( vec2( 0.0, -blur.y ) ) * 0.12;
        reflection += reflectedSample( blur ) * 0.08;
        reflection += reflectedSample( -blur ) * 0.08;
        reflection += reflectedSample( vec2( blur.x, -blur.y ) ) * 0.08;
        reflection += reflectedSample( vec2( -blur.x, blur.y ) ) * 0.08;

        float floorDistance = length( floorWorldPosition.xz - floorCenter );
        float radialFade = 1.0 - smoothstep( floorFadeStart, floorFadeEnd, floorDistance );
        vec2 floorEdgeDistance = min( gl_FragCoord.xy, floorViewport - gl_FragCoord.xy );
        vec2 floorScreenFade = smoothstep( vec2( 0.0 ), floorViewport * screenEdgeFade, floorEdgeDistance );
        float floorFade = radialFade * floorScreenFade.x * floorScreenFade.y;

        gl_FragColor = vec4( color + reflection.rgb * reflectionStrength, floorOpacity * floorFade );
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  };
  const ground = new Reflector(
    new THREE.PlaneGeometry(scale * 500, scale * 500),
    {
      color: floor.baseColor,
      textureWidth: 512,
      textureHeight: 512,
      clipBias: 0.002,
      multisample: 0,
      shader: floorReflectionShader,
    },
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(center.x, bounds.min.y - 0.015, center.z);
  ground.receiveShadow = true;
  ground.visible = !wireframe;
  ground.material.transparent = true;
  ground.material.depthWrite = false;
  function applyFloor() {
    const minimumFadeGap = Math.max(scale * 0.01, 0.01);
    floor.radialFadeStart = Math.min(
      floor.radialFadeStart,
      floor.radialFadeLimit - minimumFadeGap,
    );
    floor.radialFadeEnd = Math.max(
      floor.radialFadeEnd,
      floor.radialFadeStart + minimumFadeGap,
    );
    floor.radialFadeEnd = Math.min(floor.radialFadeEnd, floor.radialFadeLimit);
    const uniforms = ground.material.uniforms;
    uniforms.color.value.set(floor.baseColor);
    uniforms.reflectionStrength.value = floor.reflectionStrength;
    uniforms.floorOpacity.value = floor.opacity;
    uniforms.floorFadeStart.value = floor.radialFadeStart;
    uniforms.floorFadeEnd.value = floor.radialFadeEnd;
    uniforms.screenEdgeFade.value = floor.screenEdgeFade;
    notifyState();
  }
  const renderFloorReflection = ground.onBeforeRender;
  ground.onBeforeRender = (renderer, ...renderArgs) => {
    renderer.getDrawingBufferSize(ground.material.uniforms.floorViewport.value);
    renderFloorReflection.call(ground, renderer, ...renderArgs);
  };
  scene.add(ground);
  let pointerX = 0,
    pointerY = 0,
    frame;

  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    const studioViewport = composition?.getStudioViewport?.({
      width,
      height,
    }) ?? { width, height };
    const framingWidth = studioViewport.width;
    const framingPanelHeight = studioViewport.height;
    const sceneExtension =
      Number.parseFloat(
        getComputedStyle(host).getPropertyValue("--scene-extension"),
      ) || 0;
    const framingHeight = Math.max(framingPanelHeight - sceneExtension, 1);
    renderer.setSize(width, height, false);
    camera.clearViewOffset();
    camera.aspect = framingWidth / framingHeight;
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const distance =
      Math.max(
        size.y / (2 * Math.tan(halfFov)),
        size.x / (2 * Math.tan(halfFov) * camera.aspect),
      ) * 1.24;
    // Below the sculpture's midpoint, looking up from near the roots.
    camera.position.set(
      center.x,
      center.y - distance * 0.12,
      center.z + distance,
    );
    if (review.get("camera") === "front")
      camera.position.set(center.x, center.y, center.z + distance);
    if (review.get("camera") === "side")
      camera.position.set(
        center.x + distance * 0.7,
        center.y + distance * 0.35,
        center.z + distance * 0.8,
      );
    camera.lookAt(center);
    if (sceneExtension)
      camera.setViewOffset(
        framingWidth,
        framingHeight,
        0,
        0,
        framingWidth,
        framingPanelHeight,
      );
    camera.updateProjectionMatrix();
    mascot.updateMatrixWorld(true);
    contours.forEach((update) => update(camera));
    composition?.resize?.({
      width,
      height,
      studioViewport,
      renderer,
      scene,
      camera,
      mascot,
      center,
      size,
      scale,
      lighting,
      lights: {
        key: keyLight,
        fill: fillLight,
        rimA: rimLight,
        rimB: secondaryRimLight,
      },
    });
    renderScene();
  }
  function renderScene() {
    const state = {
      renderer,
      scene,
      camera,
      mascot,
      center,
      size,
      scale,
      lighting,
      lights: {
        key: keyLight,
        fill: fillLight,
        rimA: rimLight,
        rimB: secondaryRimLight,
      },
    };
    if (composition?.render) composition.render(state);
    else renderer.render(scene, camera);
  }
  window.addEventListener(
    "pointermove",
    (event) => {
      pointerX = (event.clientX / innerWidth - 0.5) * 2;
      pointerY = (event.clientY / innerHeight - 0.5) * 2;
    },
    { passive: true },
  );
  document.documentElement.addEventListener("pointerleave", () => {
    pointerX = 0;
    pointerY = 0;
  });
  function render(time = 0) {
    const motion = !reducedMotion.matches;
    const rotation =
      -0.06 +
      (motion ? pointerX * 0.055 + Math.sin(time * 0.00035) * 0.015 : 0);
    mascot.rotation.y += (rotation - mascot.rotation.y) * 0.045;
    mascot.rotation.x +=
      ((motion ? pointerY * 0.015 : 0) - mascot.rotation.x) * 0.045;
    mascot.updateMatrixWorld(true);
    contours.forEach((update) => update(camera));
    renderScene();
    if (motion && !document.hidden) frame = requestAnimationFrame(render);
  }
  function restart() {
    cancelAnimationFrame(frame);
    render();
  }
  function renderOnce() {
    mascot.updateMatrixWorld(true);
    contours.forEach((update) => update(camera));
    renderScene();
  }
  mascot.rotation.y = -0.06;
  new ResizeObserver(resize).observe(host);
  reducedMotion.addEventListener("change", restart);
  document.addEventListener("visibilitychange", restart);
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    host.classList.remove("ready");
  });
  canvas.addEventListener("webglcontextrestored", () => {
    resize();
    host.classList.add("ready");
    restart();
  });
  if (import.meta.env.DEV) {
    const [{ createSceneControls }, { default: GUI }] = await Promise.all([
      import("./scene-controls.js"),
      import("three/addons/libs/lil-gui.module.min.js"),
    ]);
    const disposeSceneControls = createSceneControls({
      GUI,
      lighting,
      floor,
      applyKey,
      applyFill,
      applyRim,
      applyExposure,
      applyFloor,
      renderOnce,
    });
    const sceneApi = {
      lighting,
      floor,
      applyKey,
      applyFill,
      applyRim,
      applyExposure,
      applyFloor,
      renderOnce,
    };
    window.__strnkScene = sceneApi;
    import.meta.hot?.dispose(() => {
      disposeSceneControls();
      if (window.__strnkScene === sceneApi) delete window.__strnkScene;
    });
  }
  resize();
  render();
  host.classList.add("ready");
  return {
    renderer,
    scene,
    camera,
    mascot,
    center,
    size,
    scale,
    lighting,
    floor,
    lights: {
      key: keyLight,
      fill: fillLight,
      rimA: rimLight,
      rimB: secondaryRimLight,
    },
    onStateChange(listener) {
      stateListeners.add(listener);
      return () => stateListeners.delete(listener);
    },
  };
}

if (document.querySelector("#mascot")) {
  createStrnkScene().catch((error) =>
    console.warn("3D rendering unavailable; showing the STRNK logo.", error),
  );
}
