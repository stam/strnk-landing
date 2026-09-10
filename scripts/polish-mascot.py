"""Align the grip to the forearm and soften the root shoulders in STRNK v2."""
import bpy
import bmesh
import math
from mathutils import Quaternion
from pathlib import Path

root=Path(bpy.data.filepath).parent.parent
scene=bpy.context.scene
assert scene.name=='STRNK v2'
body=next(o for o in scene.objects if o.name.startswith('STRNK • continuous'))
assert 'Root shoulder transition' not in body.modifiers
weights=body.vertex_groups.new(name='Root shoulder blend')
for v in body.data.vertices:
    x,y,z=v.co
    weight=math.exp(-((z-.9)/.42)**2)
    if weight>.01 and z<1.8:
        weights.add([v.index],weight,'REPLACE')
mod=body.modifiers.new('Root shoulder transition','SMOOTH')
mod.vertex_group=weights.name; mod.factor=.72; mod.iterations=3
for side,label in [(-1,'Left'),(1,'Right')]:
    hand=next(o for o in scene.objects if o.name.startswith(label+' fist • inward grip'))
    # The build leaves hand rotation unapplied, so replace the object rotation.
    hand.rotation_mode='QUATERNION'
    hand.rotation_quaternion=Quaternion((0,1,0),side*-.40) @ Quaternion((0,0,1),side*-math.pi/2)
    hand.location=(side*1.66,-.04,3.79)

bpy.ops.object.select_all(action='DESELECT')
parts=[o for o in scene.objects if o.type=='MESH']
for obj in parts: obj.select_set(True)
bpy.context.view_layer.objects.active=body
bpy.ops.export_scene.gltf(filepath=str(root/'public'/'models'/'mascot.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True)
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(root/'assets'/'mascot.blend'))
result={'saved':bpy.data.filepath,'exported':str(root/'public'/'models'/'mascot.glb')}
