export function createSceneControls({
  GUI,
  lighting,
  floor,
  applyKey,
  applyFill,
  applyRim,
  applyExposure,
  applyFloor,
  renderOnce,
}) {
  const initial = JSON.parse(JSON.stringify({ lighting, floor }));
  const gui = new GUI({ title: 'Scene', width: 248, closeFolders: true });
  gui.domElement.dataset.sceneControls = 'true';
  const controllers = [];
  const add = (controller, name) => {
    controllers.push(controller);
    controller.domElement.dataset.sceneControl = name;
    return controller;
  };
  const refresh = () => { controllers.forEach((controller) => controller.updateDisplay()); renderOnce(); };
  const updateKey = () => { applyKey(); renderOnce(); };
  const updateFill = () => { applyFill(); renderOnce(); };
  const updateRim = () => { applyRim(); renderOnce(); };
  const updateExposure = () => { applyExposure(); renderOnce(); };
  const updateFloor = () => { applyFloor(); refresh(); };

  add(gui.add(lighting, 'exposure', .1, 2, .01).name('Exposure').onChange(updateExposure), 'exposure');
  const key = gui.addFolder('Key');
  add(key.add(lighting.key, 'enabled').name('Enabled').onChange(updateKey), 'key-enabled');
  add(key.add(lighting.key, 'intensity', 0, 100, .1).name('Intensity').onChange(updateKey), 'key-intensity');
  add(key.addColor(lighting.key, 'color').name('Color').onChange(updateKey), 'key-color');
  add(key.add(lighting.key.position, 'x', -3, 3, .01).name('X scale').onChange(updateKey), 'key-x');
  add(key.add(lighting.key.position, 'y', -3, 3, .01).name('Y scale').onChange(updateKey), 'key-y');
  add(key.add(lighting.key.position, 'z', -3, 3, .01).name('Z scale').onChange(updateKey), 'key-z');
  add(key.add(lighting.key, 'width', .1, 4, .01).name('Width scale').onChange(updateKey), 'key-width');
  add(key.add(lighting.key, 'height', .1, 4, .01).name('Height scale').onChange(updateKey), 'key-height');
  key.close();

  const fill = gui.addFolder('Fill');
  add(fill.add(lighting.fill, 'enabled').name('Enabled').onChange(updateFill), 'fill-enabled');
  add(fill.add(lighting.fill, 'intensity', 0, 25, .01).name('Intensity').onChange(updateFill), 'fill-intensity');
  add(fill.addColor(lighting.fill, 'color').name('Color').onChange(updateFill), 'fill-color');
  add(fill.add(lighting.fill.position, 'x', -3, 3, .01).name('X scale').onChange(updateFill), 'fill-x');
  add(fill.add(lighting.fill.position, 'y', -3, 3, .01).name('Y scale').onChange(updateFill), 'fill-y');
  add(fill.add(lighting.fill.position, 'z', -3, 3, .01).name('Z scale').onChange(updateFill), 'fill-z');
  add(fill.add(lighting.fill, 'width', .1, 4, .01).name('Width scale').onChange(updateFill), 'fill-width');
  add(fill.add(lighting.fill, 'height', .1, 4, .01).name('Height scale').onChange(updateFill), 'fill-height');
  fill.close();

  const rim = gui.addFolder('Rim');
  const addSoftboxControls = (name, settings, controlPrefix) => {
    const folder = rim.addFolder(name);
    add(folder.add(settings, 'enabled').name('Enabled').onChange(updateRim), `${controlPrefix}-enabled`);
    add(folder.add(settings, 'intensity', 0, 200, 1).name('Intensity').onChange(updateRim), `${controlPrefix}-intensity`);
    add(folder.addColor(settings, 'color').name('Color').onChange(updateRim), `${controlPrefix}-color`);
    add(folder.add(settings, 'width', .1, 4, .01).name('Width scale').onChange(updateRim), `${controlPrefix}-width`);
    add(folder.add(settings, 'height', .1, 4, .01).name('Height scale').onChange(updateRim), `${controlPrefix}-height`);
    add(folder.add(settings.position, 'x', -3, 3, .01).name('Position X').onChange(updateRim), `${controlPrefix}-position-x`);
    add(folder.add(settings.position, 'y', -3, 3, .01).name('Position Y').onChange(updateRim), `${controlPrefix}-position-y`);
    add(folder.add(settings.position, 'z', -3, 3, .01).name('Position Z').onChange(updateRim), `${controlPrefix}-position-z`);
    add(folder.add(settings.target, 'x', -3, 3, .01).name('Target X').onChange(updateRim), `${controlPrefix}-target-x`);
    add(folder.add(settings.target, 'y', -3, 3, .01).name('Target Y').onChange(updateRim), `${controlPrefix}-target-y`);
    add(folder.add(settings.target, 'z', -3, 3, .01).name('Target Z').onChange(updateRim), `${controlPrefix}-target-z`);
    folder.close();
  };
  addSoftboxControls('Viewer right', lighting.rim.right, 'rim-right');
  addSoftboxControls('Viewer left', lighting.rim.left, 'rim-left');
  rim.close();

  const floorFolder = gui.addFolder('Floor');
  add(floorFolder.addColor(floor, 'baseColor').name('Base color').onChange(updateFloor), 'floor-base-color');
  add(floorFolder.add(floor, 'reflectionStrength', 0, 1, .01).name('Reflection strength').onChange(updateFloor), 'floor-reflection-strength');
  add(floorFolder.add(floor, 'opacity', 0, 1, .01).name('Opacity').onChange(updateFloor), 'floor-opacity');
  add(floorFolder.add(floor, 'radialFadeStart', 0, floor.radialFadeLimit, .01).name('Radial fade start').onChange(updateFloor), 'floor-radial-fade-start');
  add(floorFolder.add(floor, 'radialFadeEnd', 0, floor.radialFadeLimit, .01).name('Radial fade end').onChange(updateFloor), 'floor-radial-fade-end');
  add(floorFolder.add(floor, 'screenEdgeFade', .001, .35, .001).name('Screen edge fade').onChange(updateFloor), 'floor-screen-edge-fade');
  floorFolder.close();

  const actions = {
    reset() {
      lighting.exposure = initial.lighting.exposure;
      const { position, ...keyDefaults } = initial.lighting.key;
      Object.assign(lighting.key, keyDefaults);
      Object.assign(lighting.key.position, position);
      const { position: fillPosition, ...fillDefaults } = initial.lighting.fill;
      Object.assign(lighting.fill, fillDefaults);
      Object.assign(lighting.fill.position, fillPosition);
      for (const side of ['right', 'left']) {
        const { position, target, ...rimDefaults } = initial.lighting.rim[side];
        Object.assign(lighting.rim[side], rimDefaults);
        Object.assign(lighting.rim[side].position, position);
        Object.assign(lighting.rim[side].target, target);
      }
      Object.assign(floor, initial.floor);
      applyKey();
      applyFill();
      applyRim();
      applyExposure();
      applyFloor();
      refresh();
    },
    logSettings() {
      console.log(JSON.stringify({ lighting, floor }, null, 2));
    },
  };
  add(gui.add(actions, 'reset').name('Reset'), 'reset');
  add(gui.add(actions, 'logSettings').name('Log settings'), 'log-settings');

  for (const event of ['pointerdown', 'pointermove', 'pointerup', 'pointerleave']) {
    gui.domElement.addEventListener(event, (pointerEvent) => pointerEvent.stopPropagation());
  }

  return () => gui.destroy();
}
