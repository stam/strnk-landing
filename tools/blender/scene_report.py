"""Read-only scene and evaluated mesh report. Run inside Blender."""
import json

import bmesh
import bpy


def mesh_report(obj, depsgraph):
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    bm = bmesh.new()
    try:
        bm.from_mesh(mesh)
        return {
            'name': obj.name,
            'vertices': len(bm.verts),
            'faces': len(bm.faces),
            'non_manifold_edges': sum(not edge.is_manifold for edge in bm.edges),
        }
    finally:
        bm.free()
        evaluated.to_mesh_clear()


def main():
    scene = bpy.context.scene
    depsgraph = bpy.context.evaluated_depsgraph_get()
    return {
        'file': bpy.data.filepath,
        'active_scene': scene.name,
        'scenes': [item.name for item in bpy.data.scenes],
        'camera': scene.camera.name if scene.camera else None,
        'objects': [
            dict(name=obj.name, type=obj.type,
                 mascot_export=bool(obj.get('mascot_export')),
                 dimensions=list(obj.dimensions))
            for obj in scene.objects
        ],
        'geometry': [mesh_report(obj, depsgraph) for obj in scene.objects
                     if obj.type == 'MESH' and obj.get('mascot_export')],
    }


if __name__ == '__main__':
    result = main()
    print(json.dumps(result, indent=2))
