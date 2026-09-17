import * as THREE from "three";

export function createStarfield(count = 1200, radius = 2000): THREE.Points {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Random point roughly on a large sphere shell around the scene, so
    // stars stay visible while panning/zooming through the graph.
    const r = radius * (0.6 + Math.random() * 0.4);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 1.6,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.8,
  });

  const points = new THREE.Points(geometry, material);
  points.name = "bubbl-starfield";
  return points;
}
