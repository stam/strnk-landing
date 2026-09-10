"""Run inside Blender via Blender Lab MCP. Builds and exports the STRNK mascot."""
import bpy
import bmesh
import math
import random
from mathutils import Vector
from pathlib import Path

root = Path(bpy.data.filepath).parent.parent
assert bpy.data.filepath.endswith('mascot.blend'), 'Open assets/mascot.blend first'
assert 'STRNK' not in bpy.data.scenes, 'STRNK scene already exists; inspect before rebuilding'
scene = bpy.data.scenes.new('STRNK')
bpy.context.window.scene = scene
collection = bpy.data.collections.new('STRNK • Sculpture')
scene.collection.children.link(collection)
rng = random.Random(73)
parts = []
surface = bpy.data.materials.new('Charcoal • solid occlusion')
surface.diffuse_color = (.018, .018, .018, 1)
surface.use_nodes = True
surface.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value = (.018, .018, .018, 1)
surface.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value = 1
edge = bpy.data.materials.new('Chalk • edges')
edge.diffuse_color = (.74, .74, .70, 1)
edge.use_nodes = True
nodes = edge.node_tree.nodes
nodes.clear()
emission = nodes.new('ShaderNodeEmission')
emission.inputs[0].default_value = (.74, .74, .70, 1)
output = nodes.new('ShaderNodeOutputMaterial')
edge.node_tree.links.new(emission.outputs[0], output.inputs['Surface'])

def make_mesh(name, vertices, faces):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    bm = bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(data)
    bm.free()
    obj = bpy.data.objects.new(name, data)
    collection.objects.link(obj)
    obj.data.materials.append(surface)
    parts.append(obj)
    return obj

# Jittered rings taper strongly upward; the top remains visibly sawn flat.
n = 12
verts = []
for j, (z, radius) in enumerate([(.16, 1.10), (.65, .97), (1.35, .82), (2.12, .73), (2.83, .67), (3.12, .65)]):
    for i in range(n):
        a = i * math.tau / n + (0 if j == 5 else rng.uniform(-.065, .065))
        r = radius * rng.uniform(.9, 1.10)
        verts.append((r * math.cos(a), r * math.sin(a) * .86, z + (rng.uniform(-.13, .13) if 0 < j < 5 else 0)))
faces = []
for j in range(5):
    for i in range(n):
        a, b = j*n+i, j*n+(i+1)%n
        if (i+j)%2:
            faces += [(a,b,b+n), (a,b+n,a+n)]
        else:
            faces += [(a,b,a+n), (b,b+n,a+n)]
faces += [tuple(reversed(range(n))), tuple(range(5*n,6*n))]
make_mesh('Trunk • tapered irregular facets', verts, faces)

def sweep(name, centers, radii, sides=7, noise=.045):
    vertices, faces = [], []
    for j, center in enumerate(centers):
        tangent = Vector(centers[min(j+1,len(centers)-1)]) - Vector(centers[max(j-1,0)])
        tangent.normalize()
        reference = Vector((0,1,0)) if abs(tangent.y) < .9 else Vector((1,0,0))
        u = tangent.cross(reference).normalized()
        v = tangent.cross(u).normalized()
        for i in range(sides):
            a = i*math.tau/sides
            radius = radii[j] * (1+rng.uniform(-noise, noise))
            point = Vector(center) + radius*(u*math.cos(a) + v*math.sin(a))
            vertices.append(tuple(point))
            if j:
                a0, b0 = (j-1)*sides+i, (j-1)*sides+(i+1)%sides
                faces += [(a0,b0,b0+sides), (a0,b0+sides,a0+sides)]
    faces += [tuple(reversed(range(sides))), tuple(range((len(centers)-1)*sides,len(centers)*sides))]
    return make_mesh(name, vertices, faces)

for i in range(7):
    a = i*math.tau/7 + .18
    length = 1.94 + rng.uniform(-.15,.30)
    def radial(distance, z, bend=0):
        return (math.cos(a+bend)*distance, math.sin(a+bend)*distance*.87, z)
    sweep('Root %02d • closed tapered buttress' % (i+1),
          [radial(.70,.82), radial(1.07,.47), radial(1.52,.21,.06), radial(length,.10,.10)],
          [.40,.36,.21,.045], sides=5, noise=.08)

def block(name, center, scale, rotation=0, bevel=.075):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.object
    obj.name = name
    for c in list(obj.users_collection): c.objects.unlink(obj)
    collection.objects.link(obj)
    obj.scale = scale
    obj.rotation_euler.y = rotation
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    mod = obj.modifiers.new('Broad knuckle bevel', 'BEVEL')
    mod.width, mod.segments = bevel, 1
    bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.materials.append(surface)
    parts.append(obj)
    return obj

for side, label in [(-1,'Left'),(1,'Right')]:
    def p(x,y,z): return (side*x,y,z)
    sweep(label+' arm • flexed', [p(.57,0,2.51),p(1.02,0,2.54),p(1.43,-.02,2.39),p(1.86,0,2.34),p(2.15,0,2.64),p(2.18,0,3.02),p(2.04,0,3.47),p(1.94,0,3.72)], [.34,.46,.48,.33,.29,.31,.24,.20], sides=8)
    block(label+' fist • palm',p(1.92,-.015,3.88),(.55,.43,.57),side*-.22)
    for finger in range(4):
        x = 1.71 + finger*.135
        z = 4.08 - abs(finger-1.5)*.035
        block(label+' finger %d • curled knuckle' % (finger+1),p(x,-.24,z),(.145,.24,.25),side*-.15,bevel=.036)
        block(label+' finger %d • folded segment' % (finger+1),p(x,-.27,z-.20),(.14,.19,.18),side*-.15,bevel=.03)
    sweep(label+' thumb • folded across fist',[p(1.66,-.05,3.88),p(1.64,-.27,3.76),p(1.83,-.36,3.78)],[.14,.15,.115],sides=6,noise=0)

# Validate closed surfaces before exporting. Each modeled part is watertight.
invalid = []
for obj in parts:
    bm=bmesh.new(); bm.from_mesh(obj.data)
    if any(not e.is_manifold for e in bm.edges): invalid.append(obj.name)
    bm.free()
assert not invalid, 'Non-manifold parts: '+str(invalid)
bpy.ops.object.select_all(action='DESELECT')
for obj in parts: obj.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
(root/'public'/'models').mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(root/'public'/'models'/'mascot.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_apply=True)

# Keep the mesh editable, with a non-destructive edge treatment for Blender previews.
for obj in parts:
    obj.data.materials.append(edge)
    wire = obj.modifiers.new('Chalk edges • preview only', 'WIREFRAME')
    wire.thickness = .009
    wire.use_replace = False
    wire.use_even_offset = True
    wire.material_offset = 1

camera_data = bpy.data.cameras.new('Frog perspective')
camera = bpy.data.objects.new('Frog perspective',camera_data)
scene.collection.objects.link(camera)
camera.location = (3.5,-12,.85)
focus = Vector((0,0,2.05))
camera.rotation_euler = (focus-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.lens = 47
scene.camera = camera
scene.world = bpy.data.worlds.new('Charcoal background')
scene.world.use_nodes = True
scene.world.node_tree.nodes.get('Background').inputs[0].default_value = (.016,.016,.016,1)
scene.world.node_tree.nodes.get('Background').inputs[1].default_value = .7
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 1000
scene.render.resolution_y = 900
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'Standard'
scene.render.image_settings.file_format = 'PNG'
scene.render.filepath = str(root/'assets'/'mascot-preview.png')
for area in bpy.context.screen.areas:
    if area.type == 'VIEW_3D':
        area.spaces.active.region_3d.view_perspective = 'CAMERA'
        area.spaces.active.shading.type = 'MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=str(root/'assets'/'mascot.blend'))
result = {'parts':len(parts),'non_manifold_parts':invalid,'glb':str(root/'public'/'models'/'mascot.glb'),'saved':bpy.data.filepath}
