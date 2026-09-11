"""Validate tagged meshes, export the website GLB, and save the source blend."""
import json
from pathlib import Path
import runpy

import bpy


def main():
    root = Path(__file__).resolve().parents[2]
    if Path(bpy.data.filepath).resolve() != root / 'assets/mascot.blend':
        raise RuntimeError('Open this repository\'s assets/mascot.blend first')
    if bpy.context.mode != 'OBJECT':
        raise RuntimeError('Switch to Object Mode before exporting')
    scene = bpy.context.scene
    parts = [obj for obj in scene.objects
             if obj.type == 'MESH' and obj.get('mascot_export')]
    if not parts:
        raise RuntimeError('Active scene has no meshes tagged mascot_export')
    report = runpy.run_path(str(Path(__file__).with_name('scene_report.py')))
    geometry = [report['mesh_report'](obj, bpy.context.evaluated_depsgraph_get())
                for obj in parts]
    if any(item['non_manifold_edges'] or not item['faces'] for item in geometry):
        raise RuntimeError(f'Empty or non-manifold export geometry: {geometry}')
    selected = list(bpy.context.selected_objects)
    active = bpy.context.view_layer.objects.active
    output = root / 'public/models/mascot.glb'
    output.parent.mkdir(parents=True, exist_ok=True)
    try:
        bpy.ops.object.select_all(action='DESELECT')
        for obj in parts:
            obj.select_set(True)
        if set(bpy.context.selected_objects) != set(parts):
            raise RuntimeError('Export meshes must be selectable in the active view layer')
        status = bpy.ops.export_scene.gltf(
            filepath=str(output), export_format='GLB', use_selection=True,
            use_active_scene=True, export_apply=True,
            export_cameras=False, export_lights=False)
        if 'FINISHED' not in status:
            raise RuntimeError(f'GLB export failed: {status}')
    finally:
        bpy.ops.object.select_all(action='DESELECT')
        for obj in selected:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = active
    bpy.ops.wm.save_as_mainfile(filepath=bpy.data.filepath)
    return {'scene': scene.name, 'geometry': geometry, 'exported': str(output),
            'source_saved': True}


if __name__ == '__main__':
    result = main()
    print(json.dumps(result, indent=2))
