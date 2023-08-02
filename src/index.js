import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CSG } from 'three-csg-ts';

import { PanelUI } from './panelUI';
import { IsometricPdfToSvg } from './pdfToSvg';

let renderer, camera, scene, labelRenderer, controls;
export let isometricPdfToSvg;

init();
render();

function init() {
  const div = document.createElement('div');
  div.innerHTML = `<div style="position: fixed; top: 0px; bottom:0; left: 0; right: 0;"></div>`;
  const container = div.children[0];
  document.body.append(container);

  const bgColor = 0x263238 / 2;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(bgColor, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.id = 'labels-container-div';
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0px';
  labelRenderer.domElement.style.left = '0px';
  labelRenderer.domElement.style.width = '100%';
  labelRenderer.domElement.style.height = '100%';
  container.prepend(labelRenderer.domElement);

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

  controls = new OrbitControls(camera, container);

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

  const panelUI = new PanelUI();
  panelUI.init();
  isometricPdfToSvg = new IsometricPdfToSvg();
}

function render() {
  requestAnimationFrame(render);

  controls.update();

  renderer.render(scene, camera);
}
