"""Render solid review angles in a temporary scene, preserving the source."""
from pathlib import Path
import json
import bpy
from mathutils import Vector

root = Path(__file__).resolve().parents[2]
out = root / '.tmp' / 'blender' / 'preview'
out.mkdir(parents=True, exist_ok=True)
source = bpy.context.scene
if not any(obj.type == 'MESH' and obj.get('mascot_export') for obj in source.objects):
    raise RuntimeError('Active scene has no meshes tagged mascot_export')
review = bpy.data.scenes.new('Temporary model review')
camera_data = bpy.data.cameras.new('Temporary review camera')
camera = bpy.data.objects.new('Temporary review camera', camera_data)
review.collection.objects.link(camera)
review.camera = camera
copies = []
try:
    for obj in source.objects:
        if obj.type == 'MESH' and obj.get('mascot_export'):
            duplicate = obj.copy()
            review.collection.objects.link(duplicate)
            copies.append(duplicate)
    review.render.engine = 'BLENDER_WORKBENCH'
    review.render.resolution_x = 1000
    review.render.resolution_y = 1000
    review.render.resolution_percentage = 100
    review.render.image_settings.file_format = 'PNG'
    review.view_settings.view_transform = 'Standard'
    shading = review.display.shading
    shading.light = 'STUDIO'
    shading.color_type = 'SINGLE'
    shading.single_color = (.48, .48, .48)
    shading.show_shadows = True
    shading.show_cavity = True
    shading.cavity_type = 'BOTH'
    shading.curvature_ridge_factor = .65
    shading.curvature_valley_factor = .8
    shading.background_type = 'WORLD'
    review.world = bpy.data.worlds.new('Temporary review world')
    review.world.color = (.065, .065, .065)
    camera_data.lens = 48
    if bpy.context.window:
        bpy.context.window.scene = review
    paths = []
    for name, position in [
        ('front', (0, -11.5, 2.05)),
        ('low-angle', (1.4, -11.5, .55)),
        ('side-elevated', (8, -8, 6)),
    ]:
        camera.location = position
        camera.rotation_euler = (Vector((0, 0, 2.02)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
        review.render.filepath = str(out / (name + '.png'))
        bpy.ops.render.render(write_still=True, scene=review.name)
        paths.append(review.render.filepath)
    result = {'source_scene': source.name, 'renders': paths, 'source_saved': False}
finally:
    if bpy.context.window:
        bpy.context.window.scene = source
    world = review.world
    bpy.data.scenes.remove(review)
    for obj in copies + [camera]:
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.cameras.remove(camera_data)
    if world:
        bpy.data.worlds.remove(world)

print(json.dumps(result, indent=2))

