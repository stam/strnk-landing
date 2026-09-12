import * as THREE from "three";
import { createStrnkScene } from "./main.js";
import "./studio.css";

const canvas = document.querySelector("#studio-canvas");
const host = document.querySelector(".studio-main");
const technical = new THREE.Scene();
const topCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 100);
let layout = { width: 0, height: 0, split: 0, stacked: false };
let state;

function line(a, b, color = 0xcac8bf) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([a, b]),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity: .82 }),
  );
}

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

function addArrow(from, target, color) {
  technical.add(new THREE.ArrowHelper(target.clone().sub(from).normalize(), from, state.scale * .28, color, state.scale * .075, state.scale * .045));
}

function addLight(name, light, material, labelOffset) {
  if (!light.visible) return;
  const { center, scale } = state;
  const mount = new THREE.Group(); mount.position.copy(light.position); technical.add(mount);
  const housing = new THREE.Mesh(new THREE.BoxGeometry(scale * .24, scale * .08, scale * .18), material); housing.position.y = scale * .05; mount.add(housing);
  const face = new THREE.Mesh(new THREE.CylinderGeometry(scale * .08, scale * .08, scale * .025, 20), material); face.rotation.x = Math.PI / 2; face.position.set(0, scale * .05, -scale * .1); mount.add(face);
  const point = light.position.clone(); point.y = center.y + scale * .06;
  addArrow(point, new THREE.Vector3(center.x, point.y, center.z), material.color);
  const marker = label(name, `#${material.color.getHexString()}`); marker.position.copy(point).add(labelOffset); technical.add(marker);
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
  const eye = new THREE.Vector3(camera.position.x, center.y + scale * .05, camera.position.z);
  const planeCenter = new THREE.Vector3(center.x, eye.y, center.z - scale * .18);
  const right = new THREE.Vector3(scale * .75, 0, 0); const forward = new THREE.Vector3(0, 0, scale * .58);
  const corners = [planeCenter.clone().add(right).add(forward), planeCenter.clone().sub(right).add(forward), planeCenter.clone().sub(right).sub(forward), planeCenter.clone().add(right).sub(forward)];
  for (let index = 0; index < 4; index += 1) { technical.add(line(corners[index], corners[(index + 1) % 4])); technical.add(line(eye, corners[index])); }
  addArrow(eye, new THREE.Vector3(center.x, eye.y, center.z), 0xc8c6be);
  const cameraLabel = label("Production camera", "#d6d4cc"); cameraLabel.position.copy(eye).add(new THREE.Vector3(-scale * .8, 0, -scale * .38)); technical.add(cameraLabel);
  addLight("Key", lights.key, new THREE.MeshBasicMaterial({ color: 0xfff1df }), new THREE.Vector3(-scale * .7, 0, scale * .24));
  addLight("Fill", lights.fill, new THREE.MeshBasicMaterial({ color: 0xffddbd }), new THREE.Vector3(-scale * .7, 0, scale * .24));
  addLight("Rim A", lights.rimA, new THREE.MeshBasicMaterial({ color: 0xff7736 }), new THREE.Vector3(-scale * .55, 0, -scale * .4));
  addLight("Rim B", lights.rimB, new THREE.MeshBasicMaterial({ color: 0xff7736 }), new THREE.Vector3(scale * .22, 0, -scale * .38));
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
