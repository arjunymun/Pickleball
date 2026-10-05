import * as THREE from "three";

export const COURT_CENTERS = [
  [-4.7, 8.4],
  [4.7, 8.4],
  [-4.7, -8.4],
  [4.7, -8.4],
] as const;

function courtTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Court artwork is unavailable");
  context.fillStyle = "#146bb0";
  context.fillRect(0, 0, 512, 1024);
  context.fillStyle = "#3297b0";
  context.fillRect(0, 350, 512, 324);
  // A deterministic fine grain gives the acrylic surface a material finish.
  for (let i = 0; i < 16000; i++) {
    context.fillStyle = i % 2 ? "#ffffff0b" : "#0000000c";
    context.fillRect((i * 127.13) % 512, (i * 311.71) % 1024, 1, 1);
  }
  context.strokeStyle = "#f5faf6";
  context.lineWidth = 5;
  context.strokeRect(8, 8, 496, 1008);
  for (const y of [350, 674]) {
    context.beginPath();
    context.moveTo(8, y);
    context.lineTo(504, y);
    context.stroke();
  }
  for (const [from, to] of [
    [8, 350],
    [674, 1016],
  ]) {
    context.beginPath();
    context.moveTo(256, from);
    context.lineTo(256, to);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function buildCourtWorld(scene: THREE.Scene) {
  const surfaceTexture = courtTexture();
  const acrylic = new THREE.MeshStandardMaterial({
    map: surfaceTexture,
    roughness: 0.82,
  });
  const concrete = new THREE.MeshStandardMaterial({
    color: "#1c393a",
    roughness: 0.94,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: "#20343c",
    roughness: 0.4,
    metalness: 0.7,
  });
  const white = new THREE.MeshStandardMaterial({
    color: "#e7ede7",
    roughness: 0.7,
  });
  const netMaterial = new THREE.LineBasicMaterial({
    color: "#b7c9c9",
    transparent: true,
    opacity: 0.45,
  });
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshStandardMaterial({
      color: "#090e16",
      roughness: 0.5,
      metalness: 0.15,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.32;
  ground.receiveShadow = true;
  scene.add(ground);
  const slab = new THREE.Mesh(new THREE.BoxGeometry(21, 0.3, 34), concrete);
  slab.position.y = -0.15;
  slab.receiveShadow = true;
  slab.castShadow = true;
  scene.add(slab);

  const outlines: THREE.MeshBasicMaterial[] = [];
  const surfaces: THREE.MeshStandardMaterial[] = [];
  const fixtures: THREE.MeshBasicMaterial[] = [];
  const floodlights: THREE.SpotLight[] = [];
  const flares: THREE.Sprite[] = [];
  const glowCanvas = document.createElement("canvas");
  glowCanvas.width = 128;
  glowCanvas.height = 128;
  const glowContext = glowCanvas.getContext("2d");
  if (!glowContext) throw new Error("Court lighting is unavailable");
  const glow = glowContext.createRadialGradient(64, 64, 0, 64, 64, 64);
  glow.addColorStop(0, "#ffffffdd");
  glow.addColorStop(0.12, "#daecff66");
  glow.addColorStop(0.5, "#93c5ff10");
  glow.addColorStop(1, "#93c5ff00");
  glowContext.fillStyle = glow;
  glowContext.fillRect(0, 0, 128, 128);
  const glowTexture = new THREE.CanvasTexture(glowCanvas);
  const glowMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity: 0.7,
  });
  function box(
    width: number,
    height: number,
    depth: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
  ) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      material,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }
  function lineSegments(points: number[], material: THREE.LineBasicMaterial) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3),
    );
    scene.add(new THREE.LineSegments(geometry, material));
  }
  COURT_CENTERS.forEach(([x, z], index) => {
    const surface = acrylic.clone();
    surfaces.push(surface);
    const court = new THREE.Mesh(new THREE.PlaneGeometry(6.1, 13.4), surface);
    court.rotation.x = -Math.PI / 2;
    court.position.set(x, 0.015, z);
    court.receiveShadow = true;
    scene.add(court);
    const outline = new THREE.MeshBasicMaterial({
      color: "#dcf45e",
      transparent: true,
      opacity: index === 0 ? 0.95 : 0.09,
    });
    outlines.push(outline);
    for (const side of [-1, 1]) {
      box(0.045, 0.018, 15.2, x + side * 3.6, 0.023, z, outline);
      box(7.2, 0.018, 0.045, x, 0.023, z + side * 7.6, outline);
      box(0.08, 1, 0.08, x + side * 3.35, 0.5, z, metal);
    }
    const net: number[] = [];
    for (let nx = -3.3; nx <= 3.3; nx += 0.12)
      net.push(x + nx, 0.06, z, x + nx, 0.9, z);
    for (let ny = 0.06; ny <= 0.9; ny += 0.09)
      net.push(x - 3.3, ny, z, x + 3.3, ny, z);
    lineSegments(net, netMaterial);
    box(6.7, 0.045, 0.035, x, 0.93, z, white);
    const labelCanvas = document.createElement("canvas");
    labelCanvas.width = 256;
    labelCanvas.height = 128;
    const labelContext = labelCanvas.getContext("2d");
    if (!labelContext) throw new Error("Court labels are unavailable");
    labelContext.fillStyle = "#c4d5d5";
    labelContext.font = "600 66px sans-serif";
    labelContext.textAlign = "center";
    labelContext.fillText(`0${index + 1}`, 128, 89);
    const labelTexture = new THREE.CanvasTexture(labelCanvas);
    labelTexture.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(1.8, 0.9),
      new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      }),
    );
    label.rotation.x = -Math.PI / 2;
    label.position.set(x, 0.025, z + 7.1);
    scene.add(label);
  });

  const fence: number[] = [];
  for (const x of [-10.3, 10.3]) {
    for (let z = -16.7; z <= 16.7; z += 2.4)
      box(0.06, 2.5, 0.06, x, 1.25, z, metal);
    for (let y = 0.2; y < 2.5; y += 0.25) fence.push(x, y, -16.7, x, y, 16.7);
    for (let z = -16.7; z < 16.7; z += 0.3) fence.push(x, 0, z, x, 2.5, z);
  }
  lineSegments(
    fence,
    new THREE.LineBasicMaterial({
      color: "#467073",
      transparent: true,
      opacity: 0.2,
    }),
  );
  for (const x of [-10.1, 10.1]) {
    for (const z of [-12, 0, 12]) {
      box(0.09, 6.7, 0.09, x, 3.35, z, metal);
      const fixture = new THREE.MeshBasicMaterial({ color: "#f4f7eb" });
      fixtures.push(fixture);
      box(0.75, 0.1, 0.45, x, 6.75, z, fixture);
      const flare = new THREE.Sprite(glowMaterial);
      flare.position.set(x, 6.75, z);
      flare.scale.set(2.2, 2.2, 1);
      scene.add(flare);
      flares.push(flare);
      const light = new THREE.SpotLight(
        "#d4e7ff",
        420,
        40,
        Math.PI / 3.2,
        0.65,
        2,
      );
      light.position.set(x, 6.8, z);
      light.target.position.set(x * 0.25, 0, z);
      light.castShadow = z === 0;
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.bias = -0.001;
      scene.add(light, light.target);
      floodlights.push(light);
    }
  }
  const sky = new THREE.HemisphereLight("#88b3ef", "#172029", 1.2);
  const sun = new THREE.DirectionalLight("#dbe9ff", 1.4);
  sun.position.set(-15, 25, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -24,
    right: 24,
    top: 24,
    bottom: -24,
    far: 80,
  });
  sun.shadow.bias = -0.002;
  scene.add(sky, sun);
  return {
    update(night: boolean, selected: number) {
      sky.intensity = night ? 0.85 : 2.5;
      sun.intensity = night ? 0.5 : 3;
      floodlights.forEach((light) => {
        light.intensity = night ? 620 : 0;
      });
      flares.forEach((flare) => {
        flare.visible = night;
      });
      fixtures.forEach((material) => {
        material.color.set(night ? "#f7ffc9" : "#a5b5bb");
      });
      outlines.forEach((material, index) => {
        material.opacity = index === selected ? 0.95 : 0.08;
      });
      surfaces.forEach((material, index) => {
        material.color.set(index === selected ? "#ffffff" : "#b0c0ce");
      });
      scene.fog = new THREE.FogExp2(night ? "#070d17" : "#16252c", 0.012);
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>();
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.LineSegments
        ) {
          geometries.add(object.geometry);
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material]) {
            materials.add(material);
            if (
              material instanceof THREE.MeshStandardMaterial ||
              material instanceof THREE.MeshBasicMaterial
            ) {
              if (material.map) textures.add(material.map);
            }
          }
        }
        if (
          object instanceof THREE.SpotLight ||
          object instanceof THREE.DirectionalLight
        )
          object.dispose();
      });
      geometries.forEach((geometry) => geometry.dispose());
      textures.forEach((texture) => texture.dispose());
      materials.forEach((material) => material.dispose());
      glowTexture.dispose();
      glowMaterial.dispose();
      acrylic.dispose();
    },
  };
}
