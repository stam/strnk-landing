import * as THREE from 'three';

// Crease filtering alone can remove the silhouette on shallow curved surfaces.
// Keep the view-dependent outer contour even when those small creases are hidden.
export function createContour(mesh, material) {
  const positions = mesh.geometry.attributes.position;
  const indices = mesh.geometry.index;
  const edgeMap = new Map();
  const count = indices ? indices.count : positions.count;
  const get = (i) => new THREE.Vector3().fromBufferAttribute(positions, indices ? indices.getX(i) : i);
  const key = (v) => `${Math.round(v.x * 100000)},${Math.round(v.y * 100000)},${Math.round(v.z * 100000)}`;
  for (let i = 0; i < count; i += 3) {
    const vertices = [get(i), get(i + 1), get(i + 2)];
    const normal = vertices[1].clone().sub(vertices[0]).cross(vertices[2].clone().sub(vertices[0])).normalize();
    for (let j = 0; j < 3; j++) {
      const a = vertices[j], b = vertices[(j + 1) % 3];
      const ka = key(a), kb = key(b);
      const id = ka < kb ? `${ka}/${kb}` : `${kb}/${ka}`;
      if (edgeMap.has(id)) edgeMap.get(id).normals.push(normal);
      else edgeMap.set(id, { a, b, normals: [normal] });
    }
  }
  const edges = [...edgeMap.values()];
  const buffer = new Float32Array(edges.length * 6);
  const attribute = new THREE.BufferAttribute(buffer, 3).setUsage(THREE.DynamicDrawUsage);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', attribute);
  const lines = new THREE.LineSegments(geometry, material);
  lines.frustumCulled = false;
  mesh.add(lines);
  const localCamera = new THREE.Vector3();
  const toCamera = new THREE.Vector3();
  return (camera) => {
    mesh.worldToLocal(localCamera.copy(camera.position));
    let offset = 0;
    for (const edge of edges) {
      toCamera.copy(localCamera).sub(edge.a);
      const facing = edge.normals[0].dot(toCamera);
      if (edge.normals.length > 1 && facing * edge.normals[1].dot(toCamera) > 0) continue;
      edge.a.toArray(buffer, offset);
      edge.b.toArray(buffer, offset + 3);
      offset += 6;
    }
    geometry.setDrawRange(0, offset / 3);
    attribute.needsUpdate = true;
  };
}
