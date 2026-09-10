"""Second sculptural pass. Run in the open mascot.blend through Blender MCP."""
import bpy
import bmesh
import math
from mathutils import Vector
from pathlib import Path

root = Path(bpy.data.filepath).parent.parent
assert Path(bpy.data.filepath).name == 'mascot.blend'
assert 'STRNK v2' not in bpy.data.scenes, 'Inspect the existing v2 before rebuilding'
scene = bpy.data.scenes.new('STRNK v2')
bpy.context.window.scene = scene
forms = bpy.data.collections.new('Continuous sculpt • v2')
scene.collection.children.link(forms)
surface = bpy.data.materials.new('Graphite v2')
surface.diffuse_color = (.38,.38,.38,1)
surface.use_nodes = True
surface.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value = (.025,.025,.025,1)
surface.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value = 1

def mesh(name, vertices, faces):
    data=bpy.data.meshes.new(name)
    data.from_pydata(vertices,[],faces)
    bm=bmesh.new(); bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(data); bm.free()
    obj=bpy.data.objects.new(name,data)
    forms.objects.link(obj)
    obj.data.materials.append(surface)
    return obj

def sweep(name, points, radii, sides=12):
    # Catmull-Rom interpolation rounds the elbow along the bone axis, while
    # changing the cross section independently controls muscle and tendon volume.
    centers=[]; widths=[]
    for j in range(len(points)-1):
        p0=Vector(points[max(0,j-1)]); p1=Vector(points[j])
        p2=Vector(points[j+1]); p3=Vector(points[min(len(points)-1,j+2)])
        for step in range(4):
            t=step/4
            centers.append(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t))
            widths.append(tuple(radii[j][k]*(1-t)+radii[j+1][k]*t for k in range(2)))
    centers.append(Vector(points[-1])); widths.append(radii[-1])
    vertices=[]; faces=[]
    for j,c in enumerate(centers):
        tangent=(centers[min(j+1,len(centers)-1)]-centers[max(j-1,0)]).normalized()
        ref=Vector((0,1,0)) if abs(tangent.y)<.92 else Vector((1,0,0))
        u=tangent.cross(ref).normalized(); v=tangent.cross(u).normalized()
        for k in range(sides):
            a=k*math.tau/sides
            vertices.append(tuple(c+u*math.cos(a)*widths[j][0]+v*math.sin(a)*widths[j][1]))
            if j:
                a0=(j-1)*sides+k; b0=(j-1)*sides+(k+1)%sides
                faces.append((a0,b0,b0+sides,a0+sides))
    faces += [tuple(reversed(range(sides))),tuple(range((len(centers)-1)*sides,len(centers)*sides))]
    return mesh(name,vertices,faces)

def ellipsoid(name,center,scale):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,location=center)
    obj=bpy.context.object; obj.name=name; obj.scale=scale
    for c in list(obj.users_collection): c.objects.unlink(obj)
    forms.objects.link(obj)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    obj.data.materials.append(surface)
    return obj

def fuse(objects,name,voxel,face_target,smooth=4):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects: obj.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join()
    obj=bpy.context.object; obj.name=name
    mod=obj.modifiers.new('Fuse intersecting sculpt volumes','REMESH')
    mod.mode='VOXEL'; mod.voxel_size=voxel; mod.use_smooth_shade=False
    bpy.ops.object.modifier_apply(modifier=mod.name)
    mod=obj.modifiers.new('Blend root shoulders and elbow transitions','SMOOTH')
    mod.factor=1.1; mod.iterations=smooth
    bpy.ops.object.modifier_apply(modifier=mod.name)
    obj.data.calc_loop_triangles()
    mod=obj.modifiers.new('Deliberate broad facets','DECIMATE')
    mod.ratio=min(1,face_target/len(obj.data.loop_triangles)); mod.use_collapse_triangulate=True
    bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in obj.data.polygons: p.use_smooth=False
    return obj

# Continuous flared trunk. Mild longitudinal ridges survive as irregular bark planes.
sides=24; verts=[]; faces=[]
levels=[(-.03,1.01),(.35,1.05),(.80,.96),(1.40,.84),(2.05,.74),(2.67,.65),(3.12,.65)]
for j,(z,r) in enumerate(levels):
    for i in range(sides):
        a=i*math.tau/sides
        radius=r*(1+.055*math.sin(7*a+.25*j)+.035*math.sin(3*a-.3*j))
        verts.append((radius*math.cos(a),radius*math.sin(a)*.80,z))
        if j:
            x=(j-1)*sides+i; y=(j-1)*sides+(i+1)%sides
            faces.append((x,y,y+sides,x+sides))
faces += [tuple(reversed(range(sides))),tuple(range(6*sides,7*sides))]
body_parts=[mesh('Trunk volume',verts,faces)]
for i in range(7):
    a=i*math.tau/7+.12
    length=[2.10,1.96,2.13,1.96,2.2,2.02,2.12][i]
    def radial(r,z,bend=0): return (math.cos(a+bend)*r,math.sin(a+bend)*r*.86,z)
    body_parts.append(sweep('Root volume %d'%i,
        [radial(.57,1.04),radial(.88,.66),radial(1.20,.36,.015),radial(1.62,.12,.045),radial(length,.015,.075)],
        [(.40,.36),(.39,.34),(.31,.27),(.18,.19),(.035,.045)],sides=10))

for side,label in [(-1,'Left'),(1,'Right')]:
    def p(x,y,z): return (side*x,y,z)
    body_parts.append(sweep(label+' shoulder to wrist',
        [p(.54,0,2.53),p(.90,0,2.62),p(1.27,-.015,2.61),p(1.68,.015,2.48),p(1.96,.03,2.45),p(2.10,.015,2.65),p(2.09,-.01,2.94),p(1.95,-.025,3.24),p(1.77,-.04,3.59)],
        [(.31,.30),(.38,.36),(.40,.35),(.29,.27),(.22,.23),(.24,.25),(.29,.28),(.24,.23),(.155,.175)],sides=14))
body=fuse(body_parts,'STRNK • continuous trunk roots and arms',.042,1050,smooth=5)

# Flat sawn top, cut after remeshing so it does not become a rounded crown.
# Restrict the cut to the central trunk so the raised arms stay intact.
bm=bmesh.new(); bm.from_mesh(body.data)
central=[v for v in bm.verts if abs(v.co.x)<.95 and abs(v.co.y)<.9]
central_set=set(central)
geom=central+[e for e in bm.edges if all(v in central_set for v in e.verts)]+[f for f in bm.faces if all(v in central_set for v in f.verts)]
cut=bmesh.ops.bisect_plane(bm,geom=geom,dist=.0001,plane_co=(0,0,3.045),plane_no=(0,0,1),clear_outer=True,clear_inner=False)
cut_edges=[e for e in cut['geom_cut'] if isinstance(e,bmesh.types.BMEdge) and e.is_boundary]
if cut_edges: bmesh.ops.holes_fill(bm,edges=cut_edges,sides=0)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(body.data); bm.free()

hands=[]
for side,label in [(-1,'Left'),(1,'Right')]:
    # Build a clenched hand in local coordinates, then turn its curled fingers
    # inward toward the trunk. Front view sees the thumb side, not four front-facing bars.
    volumes=[ellipsoid(label+' palm', (0,.015,0),(.255,.18,.285))]
    for i in range(4):
        x=-.18+i*.12
        z=.23-abs(i-1.35)*.035
        volumes.append(sweep(label+' curled finger %d'%i,
            [(x,.025,z-.01),(x,-.085,z+.035),(x,-.20,z-.025),(x,-.225,z-.17),(x,-.15,z-.245)],
            [(.083,.085),(.092,.09),(.088,.085),(.079,.078),(.065,.068)],sides=10))
    volumes.append(sweep(label+' wrapped thumb',
        [(-.21,.01,-.025),(-.27,-.10,-.09),(-.18,-.27,-.12),(.015,-.30,-.09)],
        [(.13,.12),(.12,.115),(.105,.10),(.075,.075)],sides=10))
    hand=fuse(volumes,label+' fist • inward grip',.017,260,smooth=3)
    # Mirror the local anatomy, rotate to face the center, and align to the forearm.
    for v in hand.data.vertices: v.co.x *= side
    hand.rotation_euler=(0,side*-.36,side*-math.pi/2)
    hand.location=(side*1.69,-.04,3.80)
    bpy.context.view_layer.objects.active=hand
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bm=bmesh.new(); bm.from_mesh(hand.data)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces)); bm.to_mesh(hand.data); bm.free()
    hands.append(hand)

parts=[body]+hands
stats=[]
for obj in parts:
    bm=bmesh.new(); bm.from_mesh(obj.data)
    stats.append({'name':obj.name,'faces':len(bm.faces),'open_edges':sum(not e.is_manifold for e in bm.edges)})
    bm.free()
assert all(s['open_edges']==0 for s in stats),stats

camera_data=bpy.data.cameras.new('Frog perspective v2')
camera=bpy.data.objects.new('Frog perspective v2',camera_data)
scene.collection.objects.link(camera)
camera.location=(2.6,-12,.85)
camera.rotation_euler=(Vector((0,0,1.98))-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.lens=48
scene.camera=camera
scene.world=bpy.data.worlds.new('Charcoal v2')
scene.world.color=(.025,.025,.025)
scene.render.engine='BLENDER_WORKBENCH'
scene.display.shading.light='STUDIO'
scene.display.shading.studiolight_rotate_z=.3
scene.display.shading.color_type='MATERIAL'
scene.display.shading.show_shadows=True
scene.display.shading.show_cavity=True
scene.display.shading.cavity_type='BOTH'
scene.display.shading.background_type='WORLD'
scene.render.resolution_x=1000; scene.render.resolution_y=1000; scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.view_settings.view_transform='Standard'
for area in bpy.context.screen.areas:
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_perspective='CAMERA'
        area.spaces.active.shading.type='SOLID'
        area.spaces.active.shading.color_type='MATERIAL'
bpy.ops.object.select_all(action='DESELECT')
bpy.context.view_layer.objects.active=body
bpy.ops.wm.save_as_mainfile(filepath=str(root/'assets'/'mascot.blend'))
result={'scene':scene.name,'geometry':stats,'saved':bpy.data.filepath}
