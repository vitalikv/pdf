import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSG } from 'three-csg-ts';

let renderer, camera, scene;
let controls;

class Door {
  constructor(scene, position, reflection) {
    const door = new THREE.Mesh(this.createGeometry(), this.createMaterial());

    door.castShadow = true;
    door.receiveShadow = true;
    this.csg(door);
    if (reflection) this.setReflection(door.material);
    door.position.copy(position);
    scene.add(door);
  }

  createGeometry() {
    const height = 1.9;
    const arr = [new THREE.Vector2(-0.45, 0.05), new THREE.Vector2(-0.45, -0.05), new THREE.Vector2(0.45, -0.05), new THREE.Vector2(0.45, 0.05)];
    const shape = new THREE.Shape(arr);
    const geometry = new THREE.ExtrudeGeometry(shape, { bevelEnabled: false, depth: height });
    geometry.rotateX(-Math.PI / 2);

    return geometry;
  }

  csg(door) {
    const side = [0.08, -0.08];

    for (let i = 0; i < side.length; i++) {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.7, 0.1), new THREE.MeshStandardMaterial({ color: 0x0000ff }));

      box.position.y = 1.7 / 2 + 0.1;
      box.position.z = side[i];

      box.updateMatrix();
      door.updateMatrix();

      const subRes = CSG.subtract(door, box);
      door.geometry.dispose();
      door.geometry = subRes.geometry;
    }
  }

  createMaterial() {
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.createTexture(material);

    return material;
  }

  createTexture(material) {
    new THREE.TextureLoader().load('img/1.jpg', function (image) {
      const texture = image;
      material.color = new THREE.Color(0xffffff);
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.repeat.x = 1.0;
      texture.repeat.y = 1.0;
      texture.needsUpdate = true;

      material.map = texture;
      material.needsUpdate = true;
    });
  }

  setReflection(material) {
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    const cubeCamera = new THREE.CubeCamera(0.01, 10, new THREE.WebGLCubeRenderTarget(512, { encoding: THREE.sRGBEncoding }));

    cubeCamera.position.copy(new THREE.Vector3(0, 1, 0));
    cubeCamera.update(renderer, scene);

    const envMap = pmremGenerator.fromEquirectangular(cubeCamera.renderTarget.texture).texture;
    material.metalness = 0.7;
    material.roughness = 0.0;
    material.envMap = envMap;
    material.needsUpdate = true;

    envMap.dispose();
    cubeCamera.renderTarget.texture.dispose();

    pmremGenerator.dispose();
  }
}

init();
render();

function init() {
  const bgColor = 0x263238 / 2;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(bgColor, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1.5, 1).multiplyScalar(50);
  light.shadow.mapSize.setScalar(2048);
  light.shadow.bias = -1e-4;
  light.shadow.normalBias = 0.05;
  light.castShadow = true;

  const shadowCam = light.shadow.camera;
  shadowCam.bottom = shadowCam.left = -30;
  shadowCam.top = 30;
  shadowCam.right = 45;

  const size = 30;
  const divisions = 30;

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  plane.position.x = -0.001;
  plane.rotation.set(Math.PI / 2, Math.PI, 0);
  plane.castShadow = true;
  plane.receiveShadow = true;
  scene.add(plane);

  const gridHelper = new THREE.GridHelper(size, divisions);
  scene.add(gridHelper);

  scene.add(light);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 0.4));

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
  camera.position.set(5, 5, -5);
  camera.far = 1000;
  camera.updateProjectionMatrix();
  window.camera = camera;

  controls = new OrbitControls(camera, renderer.domElement);

  const box = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({ color: 0x0000ff }));
  scene.add(box);

  window.addEventListener(
    'resize',
    function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    },
    false
  );
}

function render() {
  requestAnimationFrame(render);

  controls.update();

  renderer.render(scene, camera);
}
