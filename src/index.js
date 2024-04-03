import * as THREE from 'three';
import './style/main.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CSG } from 'three-csg-ts';

import { LoaderModel } from './loaderModel';
import { PanelUI } from './panelUI';
import { IsometricModeService } from './select-obj';
import { IsometricPdfToSvg } from './pdfToSvg';
import { IsometricExportPdf } from './exportPdf';
import { IsometricSvgManager } from './svgManager';
import { IsometricSvgElem } from './svgElem';
import { IsometricSelectBox } from './selectBox';
import { IsometricSheets } from './sheets';
import { IsometricSvgJoint } from './svgJoint';
import { IsometricSvgLine } from './svgLine';
import { IsometricSvgObjs } from './svgObjs';
import { IsometricNoteSvg } from './noteSvg';
import { IsometricNoteSvg2 } from './noteSvg2';
import { IsometricSvgRuler } from './svgRuler';
import { IsometricNoteText } from './noteText';
import { IsometricStampLogo } from './stampLogo';
import { IsometricCanvasPaint } from './canvasPaint';
import { IsometricCutBox } from './cutBox';
import { IsometricMovePdf } from './movePdf';
import { IsometricSvgSave } from './svgSave';
import { IsometricSvgLoad } from './svgLoad';
import { IsometricMath } from './math';
import { IsometricListObjs } from './svgListObjs';
import { CalcIsometrixSvg } from './back/calcIsometrixSvg';
import { Isometric3dto2d } from './isometric3dto2d';
import { IsometricSetCalcNotes } from './setCalcNotes';

import { ShowJointsAndLines } from './helper/showJointsAndLines';

let renderer, camera, labelRenderer, controls;
export let scene, mapControlInit;
export let listMeshes = [];
export let isometricModeService,
  isometricPdfToSvg,
  isometricExportPdf,
  isometricSvgManager,
  isometricSvgElem,
  isometricSelectBox,
  isometricSheets,
  isometricSvgJoint,
  isometricSvgLine,
  isometricSvgObjs,
  isometricNoteSvg,
  isometricNoteSvg2,
  isometricSvgRuler,
  isometricNoteText,
  isometricStampLogo,
  isometricCanvasPaint,
  isometricCutBox,
  isometricMovePdf,
  isometricSvgSave,
  isometricSvgLoad,
  isometricMath,
  isometricListObjs,
  isometric3dto2d,
  isometricSetCalcNotes;

init();
initServ();
//initModel();
render();

function init() {
  const div = document.createElement('div');
  div.innerHTML = `<div style="position: fixed; top: 70px; bottom:0; left: 0; right: 0;"></div>`;
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

  const gridHelper = new THREE.GridHelper(size, divisions);
  //scene.add(gridHelper);

  scene.add(light);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 0.4));

  const cameraP = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
  cameraP.position.set(10, 10, -10);
  cameraP.far = 1000;
  cameraP.updateProjectionMatrix();

  const aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
  const d = 5;
  const cameraO = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 100000);
  cameraO.position.copy(cameraP.position.clone());
  cameraO.updateMatrixWorld();
  cameraO.updateProjectionMatrix();

  camera = cameraO;

  controls = new OrbitControls(camera, container);
  mapControlInit = { control: controls };

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

function initServ() {
  const panelUI = new PanelUI();
  panelUI.init();
  isometricModeService = new IsometricModeService();
  isometricPdfToSvg = new IsometricPdfToSvg();
  isometricExportPdf = new IsometricExportPdf();
  isometricSvgManager = new IsometricSvgManager();
  isometricSvgElem = new IsometricSvgElem();
  isometricSelectBox = new IsometricSelectBox();
  isometricSheets = new IsometricSheets();
  isometricSvgJoint = new IsometricSvgJoint();
  isometricSvgLine = new IsometricSvgLine();
  isometricSvgObjs = new IsometricSvgObjs();
  isometricNoteSvg = new IsometricNoteSvg();
  isometricNoteSvg2 = new IsometricNoteSvg2();
  isometricSvgRuler = new IsometricSvgRuler();
  isometricNoteText = new IsometricNoteText();
  isometricStampLogo = new IsometricStampLogo();
  isometricCanvasPaint = new IsometricCanvasPaint();
  isometricCutBox = new IsometricCutBox();
  isometricMovePdf = new IsometricMovePdf();
  isometricSvgSave = new IsometricSvgSave();
  isometricSvgLoad = new IsometricSvgLoad();
  isometricMath = new IsometricMath();
  isometricListObjs = new IsometricListObjs();
  isometric3dto2d = new Isometric3dto2d();
  isometricSetCalcNotes = new IsometricSetCalcNotes();

  isometricSvgManager.init();
  isometricSvgLoad.load();
}

export async function initModel() {
  const loaderModel = new LoaderModel({ scene });
  const meshes = await loaderModel.loaderObj('0019.005-TH_02.osf');
  listMeshes = meshes;
  //fitCamera(meshes);

  //isometricPdfToSvg.containerPdf.style.display = 'none';

  const calcIsometrixSvg = new CalcIsometrixSvg();
  const data = calcIsometrixSvg.getType({ meshes, scene, mapControlInit });

  const showJointsAndLines = new ShowJointsAndLines();
  showJointsAndLines.init({ scene, mapControlInit, data });
  const isometrix = isometric3dto2d.init({ scene, mapControlInit, data });

  isometricSvgLoad.setIsometry(isometrix);

  isometricSetCalcNotes.setNotes();
}

function fitCamera(meshes) {
  const bound = { min: { x: Infinity, y: Infinity, z: Infinity }, max: { x: -Infinity, y: -Infinity, z: -Infinity } };

  for (let i = 0; i < meshes.length; i++) {
    meshes[i].updateMatrixWorld();
    const v = meshes[i].getWorldPosition(new THREE.Vector3());
    if (v.x < bound.min.x) {
      bound.min.x = v.x;
    }
    if (v.x > bound.max.x) {
      bound.max.x = v.x;
    }
    if (v.y < bound.min.y) {
      bound.min.y = v.y;
    }
    if (v.y > bound.max.y) {
      bound.max.y = v.y;
    }
    if (v.z < bound.min.z) {
      bound.min.z = v.z;
    }
    if (v.z > bound.max.z) {
      bound.max.z = v.z;
    }
  }

  const center = new THREE.Vector3(
    (bound.max.x - bound.min.x) / 2 + bound.min.x,
    (bound.max.y - bound.min.y) / 2 + bound.min.y,
    (bound.max.z - bound.min.z) / 2 + bound.min.z
  );

  const points = [];
  points.push(new THREE.Vector2(bound.min.x, bound.min.z));
  points.push(new THREE.Vector2(bound.max.x, bound.min.z));
  points.push(new THREE.Vector2(bound.max.x, bound.max.z));
  points.push(new THREE.Vector2(bound.min.x, bound.max.z));

  const camera = mapControlInit.control.object;
  let aspect = (bound.max.x - bound.min.x) / (bound.max.z - bound.min.z);

  if (aspect > 1.0) {
    // определяем что больше ширина или высота
    let x = bound.max.x - bound.min.x < 0.1 ? 0.1 : bound.max.x - bound.min.x;
    camera.zoom = camera.right / (x / 2);
  } else {
    let z = bound.max.z - bound.min.z < 0.1 ? 0.1 : bound.max.z - bound.min.z;
    camera.zoom = camera.top / (z / 2);
  }
  console.log(camera, camera.rotation.x, camera.rotation.y, camera.rotation.z);

  const pos = new THREE.Vector3(20, 20, -20);
  camera.position.copy(pos);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  mapControlInit.control.target.copy(center);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  mapControlInit.control.update();

  // визуализация boundBox изометрии
  const helpVisual = true;
  if (helpVisual) {
    const shape = new THREE.Shape(points);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
    const geometry = new THREE.ExtrudeGeometry(shape, { bevelEnabled: false, depth: -(bound.max.y - bound.min.y) });
    geometry.rotateX(Math.PI / 2);
    const cube = new THREE.Mesh(geometry, material);
    cube.position.y = bound.min.y;
    scene.add(cube);

    const geometry2 = new THREE.BoxGeometry(1, 1, 1);
    const material2 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const cube2 = new THREE.Mesh(geometry2, material2);
    cube2.position.copy(center);
    scene.add(cube2);
  }
}

function render() {
  requestAnimationFrame(render);

  controls.update();

  renderer.render(scene, camera);
}
