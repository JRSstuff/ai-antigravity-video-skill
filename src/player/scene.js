// 3D Scene, Renderer, and Cinematic Studio Lighting Setup
// Configures pure Three.js scene with shadow maps, tone mapping, and 3-point lighting.
import * as THREE from 'three';

export function createScene(canvas) {
  // 1. Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0B0F19'); // Deep cinematic slate
  scene.fog = new THREE.FogExp2('#0B0F19', 0.045);

  // 2. Camera (Cinematic 42° FOV to prevent wide-angle distortion)
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0.0, 1.45, 2.8);

  // Upper chest / shoulder target (y = 1.38m), avoiding head penetration
  const defaultTarget = new THREE.Vector3(0.0, 1.38, 0.0);
  camera.lookAt(defaultTarget);

  // 3. Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // 4. Cinematic 3-Point Studio Lighting
  // Ambient / Environment fill
  const ambientLight = new THREE.AmbientLight('#A5B4FC', 0.45);
  scene.add(ambientLight);

  // Key Light (Warm golden direct sun/studio softbox)
  const keyLight = new THREE.DirectionalLight('#FFFBEB', 2.2);
  keyLight.position.set(3.5, 4.5, 3.2);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 15;
  keyLight.shadow.camera.left = -3;
  keyLight.shadow.camera.right = 3;
  keyLight.shadow.camera.top = 3;
  keyLight.shadow.camera.bottom = -1;
  keyLight.shadow.bias = -0.00015;
  keyLight.shadow.radius = 2.5; // Soft shadows
  scene.add(keyLight);

  // Fill Light (Cool sky blue soft bounce)
  const fillLight = new THREE.DirectionalLight('#93C5FD', 0.85);
  fillLight.position.set(-3.2, 2.8, 1.5);
  scene.add(fillLight);

  // Rim / Hair Light (Separates character from dark room background)
  const rimLight = new THREE.DirectionalLight('#E0E7FF', 1.8);
  rimLight.position.set(0.5, 3.2, -2.8);
  scene.add(rimLight);

  // Subtle interior floor ground contact shadow catcher
  const shadowGroundGeo = new THREE.PlaneGeometry(10, 10);
  const shadowGroundMat = new THREE.ShadowMaterial({ opacity: 0.35 });
  const shadowGround = new THREE.Mesh(shadowGroundGeo, shadowGroundMat);
  shadowGround.rotation.x = -Math.PI / 2;
  shadowGround.position.y = 0.001; // Just above room floor
  shadowGround.receiveShadow = true;
  scene.add(shadowGround);

  return {
    scene,
    camera,
    renderer,
    defaultTarget,
    keyLight,
    fillLight,
    rimLight,
  };
}
