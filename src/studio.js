import * as THREE from "three";
import { createStrnkScene } from "./main.js";
import { RectAreaLightHelper } from "three/addons/helpers/RectAreaLightHelper.js";
import "./studio.css";

const canvas = document.querySelector("#studio-canvas");
const host = document.querySelector(".studio-main");
const technical = new THREE.Scene();
const topCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 100);
let layout = { width: 0, height: 0, split: 0, stacked: false };
let state;

function label(text, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 320; canvas.height = 72;
  const context = canvas.getContext("2d");
  context.font = "600 32px DM Sans, Arial";
  context.fillStyle = color;
  context.fillText(text.toUpperCase(), 4, 43);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(1.1, .2475, 1);
  return sprite;
}

function updateTechnicalHelpers(nextState = state) {
  state = nextState;
  if (!state) return;
  technical.clear();
  const { camera, center, scale, lights } = state;
  const cameraMaterial = new THREE.MeshBasicMaterial({ color: 0xd6d4cc });
  const body = new THREE.Mesh(new THREE.BoxGeometry(scale * .31, scale * .13, scale * .2), cameraMaterial);
  body.position.copy(camera.position); body.position.y = center.y + scale * .04; technical.add(body);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(scale * .075, scale * .075, scale * .13, 16), cameraMaterial);
  lens.rotation.x = Math.PI / 2; lens.position.copy(camera.position); lens.position.setY(center.y + scale * .04); lens.translateZ(-scale * .15); technical.add(lens);
  // const cameraHelper = new THREE.CameraHelper(camera); cameraHelper.material.color.set(0xc8c6be); cameraHelper.update(); technical.add(cameraHelper);
  const cameraLabel = label("Production camera", "#d6d4cc"); cameraLabel.position.set(camera.position.x - scale * .8, center.y + scale * .05, camera.position.z - scale * .38); technical.add(cameraLabel);
  const addNativeLight = (name, light, offset) => {
    if (!light.visible) return;
    const helper = light.isRectAreaLight ? new RectAreaLightHelper(light) : new THREE.SpotLightHelper(light);
    if (typeof helper.update === "function") helper.update();
    technical.add(helper);
    const marker = label(name, `#${light.color.getHexString()}`);
    marker.position.copy(light.position).setY(center.y + scale * .06).add(offset); technical.add(marker);
  };
  addNativeLight("Key", lights.key, new THREE.Vector3(-scale * .7, 0, scale * .24));
  addNativeLight("Fill", lights.fill, new THREE.Vector3(-scale * .7, 0, scale * .24));
  addNativeLight("Rim A", lights.rimA, new THREE.Vector3(-scale * .55, 0, -scale * .4));
  addNativeLight("Rim B", lights.rimB, new THREE.Vector3(scale * .22, 0, -scale * .38));
}

const composition = {
  getStudioViewport({ width, height }) {
    const stacked = innerWidth <= 700;
    return stacked ? { width, height: Math.floor(height / 2) } : { width: Math.floor(width / 2), height };
  },
  resize(next) {
    state = next;
    layout = { width: next.width, height: next.height, stacked: innerWidth <= 700, split: innerWidth <= 700 ? Math.floor(next.height / 2) : Math.floor(next.width / 2) };
    const topWidth = layout.stacked ? layout.width : layout.width - layout.split;
    const topHeight = layout.stacked ? layout.height - layout.split : layout.height;
    const span = Math.max(next.size.x, next.size.z, next.scale * 2.9) * .82;
    const aspect = topWidth / topHeight;
    topCamera.left = -span * aspect; topCamera.right = span * aspect; topCamera.top = span; topCamera.bottom = -span;
    topCamera.position.set(next.center.x, next.center.y + next.scale * 5, next.center.z); topCamera.up.set(0, 0, -1); topCamera.lookAt(next.center); topCamera.updateProjectionMatrix();
    updateTechnicalHelpers(next);
  },
  onStateChange(next) { updateTechnicalHelpers(next); },
  render(next) {
    const { renderer, scene, camera } = next;
    renderer.setScissorTest(true); renderer.setScissor(0, 0, layout.width, layout.height); renderer.clear();
    if (layout.stacked) {
      renderer.setViewport(0, layout.height - layout.split, layout.width, layout.split); renderer.setScissor(0, layout.height - layout.split, layout.width, layout.split); renderer.render(scene, camera);
      renderer.setViewport(0, 0, layout.width, layout.height - layout.split); renderer.setScissor(0, 0, layout.width, layout.height - layout.split); renderer.render(scene, topCamera); renderer.render(technical, topCamera);
    } else {
      renderer.setViewport(0, 0, layout.split, layout.height); renderer.setScissor(0, 0, layout.split, layout.height); renderer.render(scene, camera);
      renderer.setViewport(layout.split, 0, layout.width - layout.split, layout.height); renderer.setScissor(layout.split, 0, layout.width - layout.split, layout.height); renderer.render(scene, topCamera); renderer.render(technical, topCamera);
    }
    renderer.setScissorTest(false);
  },
};

createStrnkScene({ canvas, host, composition }).catch((error) => console.warn("3D studio unavailable", error));
