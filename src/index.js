import * as THREE from 'three';
import './style/main.css';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CSG } from 'three-csg-ts';

import { LoaderModel } from './loaderModel';
import { IsometricPanelUI } from './panelUI';
import { IsometricModeService } from './select-obj';
import { IsometricPdfToSvg } from './pdfToSvg';
import { IsometricExportPdf } from './exportPdf';
import { IsometricSvgManager } from './svgManager';
import { IsometricSvgCalc } from './isometricSvgCalc';
import { IsometricSvgElem } from './svgElem';
import { IsometricSelectBox } from './selectBox';
import { IsometricSheets } from './sheets';
import { IsometricSvgJoint } from './svgJoint';
import { IsometricSvgLine } from './svgLine';
import { IsometricSvgLineSegments } from './svgLineSegments';
import { IsometricSvgObjs } from './svgObjs';
import { IsometricNoteSvg } from './noteSvg';
import { IsometricNoteSvg2 } from './noteSvg2';
import { IsometricSvgRuler } from './svgRuler';
import { IsometricNoteText } from './noteText';
import { IsometricSvgBasicElements } from './svgBasicElements';
import { IsometricSvgFreeForm } from './svgFreeForm';
import { IsometricStampLogo } from './stampLogo';
import { IsometricCanvasPaint } from './canvasPaint';
import { IsometricCutBox } from './cutBox';
import { IsometricMovePdf } from './movePdf';
import { IsometricSvgSave } from './svgSave';
import { IsometricSvgLoad } from './svgLoad';
import { IsometricMath } from './math';
import { IsometricSvgListObjs } from './svgListObjs';
import { IsometricSvgScale } from './svgScale';
import { CalcIsometrixSvg } from './back/calcIsometrixSvg';
import { Isometric3dto2d } from './isometric3dto2d';
import { IsometricSetCalcNotes } from './setCalcNotes';
import { IsometricSvgUndoRedo } from './svgUndoRedo';
import { IsometricSvgUndo } from './svgUndo';
import { IsometricSvgRedo } from './svgRedo';
import { IsometricSvgActivateElem } from './svgActivateElem';
import { IsometricActiveElement } from './koActivateElem';
import { IsometricSvgElementAttributes } from './front/svgElementAttributes';
import { IsometricSvgElementColor } from './front/svgElementColor';
import { IsometricSvgJsonElement } from './svgJsonElement';
import { IsometricSvgScaleBox } from './svgScaleBox';
import { IsometricSvgUploader } from './svgUploader';
import { IsometricSvgPathConvert } from './svgPathConvert';

let renderer, camera, labelRenderer, controls;
export let scene, mapControlInit;
export let listMeshes = [];
export let isometricPanelUI,
  isometricModeService,
  isometricPdfToSvg,
  isometricExportPdf,
  isometricSvgManager,
  isometricSvgCalc,
  isometricSvgElem,
  isometricSelectBox,
  isometricSheets,
  isometricSvgJoint,
  isometricSvgLine,
  isometricSvgLineSegments,
  isometricSvgObjs,
  isometricNoteSvg,
  isometricNoteSvg2,
  isometricSvgRuler,
  isometricNoteText,
  isometricSvgBasicElements,
  isometricSvgFreeForm,
  isometricStampLogo,
  isometricCanvasPaint,
  isometricCutBox,
  isometricMovePdf,
  isometricSvgSave,
  isometricSvgLoad,
  isometricMath,
  isometricSvgListObjs,
  isometricSvgScale,
  isometric3dto2d,
  isometricSetCalcNotes,
  isometricSvgUndoRedo,
  isometricSvgUndo,
  isometricSvgRedo,
  isometricSvgActivateElem,
  isometricActiveElement,
  isometricSvgElementAttributes,
  isometricSvgElementColor,
  isometricSvgJsonElement,
  isometricSvgScaleBox,
  isometricSvgUploader,
  isometricSvgPathConvert;

init();
initServ();
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
  isometricPanelUI = new IsometricPanelUI();
  isometricPanelUI.init();
  isometricModeService = new IsometricModeService();
  isometricPdfToSvg = new IsometricPdfToSvg();
  isometricExportPdf = new IsometricExportPdf();
  isometricSvgManager = new IsometricSvgManager();
  isometricSvgCalc = new IsometricSvgCalc();
  isometricSvgElem = new IsometricSvgElem();
  isometricSelectBox = new IsometricSelectBox();
  isometricSheets = new IsometricSheets();
  isometricSvgJoint = new IsometricSvgJoint();
  isometricSvgLine = new IsometricSvgLine();
  isometricSvgLineSegments = new IsometricSvgLineSegments();
  isometricSvgObjs = new IsometricSvgObjs();
  isometricNoteSvg = new IsometricNoteSvg();
  isometricNoteSvg2 = new IsometricNoteSvg2();
  isometricSvgRuler = new IsometricSvgRuler();
  isometricNoteText = new IsometricNoteText();
  isometricSvgBasicElements = new IsometricSvgBasicElements();
  isometricSvgFreeForm = new IsometricSvgFreeForm();
  isometricStampLogo = new IsometricStampLogo();
  isometricCanvasPaint = new IsometricCanvasPaint();
  isometricCutBox = new IsometricCutBox();
  isometricMovePdf = new IsometricMovePdf();
  isometricSvgSave = new IsometricSvgSave();
  isometricSvgLoad = new IsometricSvgLoad();
  isometricMath = new IsometricMath();
  isometricSvgListObjs = new IsometricSvgListObjs();
  isometric3dto2d = new Isometric3dto2d();
  isometricSetCalcNotes = new IsometricSetCalcNotes();
  isometricSvgScale = new IsometricSvgScale();
  isometricSvgUndoRedo = new IsometricSvgUndoRedo();
  isometricSvgUndo = new IsometricSvgUndo();
  isometricSvgRedo = new IsometricSvgRedo();
  isometricSvgActivateElem = new IsometricSvgActivateElem();
  isometricActiveElement = new IsometricActiveElement();
  isometricSvgElementAttributes = new IsometricSvgElementAttributes();
  isometricSvgElementColor = new IsometricSvgElementColor();
  isometricSvgJsonElement = new IsometricSvgJsonElement();
  isometricSvgScaleBox = new IsometricSvgScaleBox();
  isometricSvgUploader = new IsometricSvgUploader();
  isometricSvgPathConvert = new IsometricSvgPathConvert();

  isometricSvgManager.init();
  //isometricSvgLoad.load('img/isometry-vsdx.json');
  initModel();
}

// построение изометрии из 3д модели
export async function initModel() {
  const loaderModel = new LoaderModel({ scene });

  if (1 === 1) {
    const meshes = await loaderModel.loaderObj('0019.005-TH_02.osf');
    listMeshes = meshes;
  } else {
    const meshes = [];
    let arrMesh = await loaderModel.loaderObj('f2fcc115-f889-e4b9-da3b-855c51ea5c1c');
    meshes.push(...arrMesh);
    arrMesh = await loaderModel.loaderObj('dc8877bb-15a3-3aa8-5f24-d1176b63cd13');
    meshes.push(...arrMesh);
    arrMesh = await loaderModel.loaderObj('e8b92397-a3bb-5536-a39f-248124c68b47');
    meshes.push(...arrMesh);
    arrMesh = await loaderModel.loaderObj('10d5ac9f-72f8-1066-9593-7730e67c3ca1');
    meshes.push(...arrMesh);
    arrMesh = await loaderModel.loaderObj('fa769376-eb4a-7bde-3589-94470ec40a83');
    meshes.push(...arrMesh);

    listMeshes = meshes;
  }
  //fitCamera(meshes);

  //isometricPdfToSvg.containerPdf.style.display = 'none';

  const calcIsometrixSvg = new CalcIsometrixSvg();
  const data = calcIsometrixSvg.getType({ meshes: listMeshes, scene, mapControlInit });

  const isometrix = isometric3dto2d.init({ scene, mapControlInit, data });
  console.log('isometrix', isometrix);
  isometricSvgLoad.setIsometry(isometrix);

  //isometricSetCalcNotes.setNotes();
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

  const center = new THREE.Vector3((bound.max.x - bound.min.x) / 2 + bound.min.x, (bound.max.y - bound.min.y) / 2 + bound.min.y, (bound.max.z - bound.min.z) / 2 + bound.min.z);

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
