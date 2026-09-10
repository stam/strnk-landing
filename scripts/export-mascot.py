"""Export only the active mascot scene; retain prior versions in the .blend."""
import bpy
import bmesh
from pathlib import Path

root=Path(bpy.data.filepath).parent.parent
scene=bpy.context.scene
assert scene.name.startswith('STRNK')
parts=[o for o in scene.objects if o.type=='MESH']
stats=[]
depsgraph=bpy.context.evaluated_depsgraph_get()
for obj in parts:
    evaluated=obj.evaluated_get(depsgraph)
    data=evaluated.to_mesh()
    bm=bmesh.new(); bm.from_mesh(data)
    stats.append({'name':obj.name,'faces':len(bm.faces),'non_manifold':sum(not e.is_manifold for e in bm.edges)})
    bm.free(); evaluated.to_mesh_clear()
assert all(s['non_manifold']==0 for s in stats),stats
bpy.ops.object.select_all(action='DESELECT')
for obj in parts: obj.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(root/'public'/'models'/'mascot.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True)
bpy.ops.object.select_all(action='DESELECT')
bpy.ops.wm.save_as_mainfile(filepath=str(root/'assets'/'mascot.blend'))
result={'scene':scene.name,'geometry':stats,'exported':str(root/'public'/'models'/'mascot.glb')}
