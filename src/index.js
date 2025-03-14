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
import { IsometricSvgText } from './svgText';
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
import { IsometricSvgLineType } from './front/svgLineType';
import { IsometricSvgBlockingMode } from './front/svgBlockingMode';
import { IsometricSvgJsonElement } from './svgJsonElement';
import { IsometricSvgScaleBox } from './svgScaleBox';
import { IsometricSvgUploader } from './svgUploader';
import { IsometricSvgParserFile } from './svgParserFile';
import { IsometricSvgPathConvert } from './svgPathConvert';
import { IsometricSvgComparison } from './svgComparison';

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
  isometricSvgText,
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
  isometricSvgLineType,
  isometricSvgBlockingMode,
  isometricSvgJsonElement,
  isometricSvgScaleBox,
  isometricSvgUploader,
  isometricSvgParserFile,
  isometricSvgPathConvert,
  isometricSvgComparison;

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
  isometricSvgText = new IsometricSvgText();
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
  isometricSvgLineType = new IsometricSvgLineType();
  isometricSvgBlockingMode = new IsometricSvgBlockingMode();
  isometricSvgJsonElement = new IsometricSvgJsonElement();
  isometricSvgScaleBox = new IsometricSvgScaleBox();
  isometricSvgUploader = new IsometricSvgUploader();
  isometricSvgParserFile = new IsometricSvgParserFile();
  isometricSvgPathConvert = new IsometricSvgPathConvert();
  isometricSvgComparison = new IsometricSvgComparison();

  isometricSvgManager.init();
  //isometricSvgLoad.load('img/test1.json');
  initModel();
}

// построение изометрии из 3д модели
export async function initModel() {
  const loaderModel = new LoaderModel({ scene });

  if (1 === 1) {
    const meshes = await loaderModel.loaderObj('0019.005-TH_02.osf');
    listMeshes = meshes;
  } else if (1 === 1) {
    const meshes = [];
    let arrMesh = await loaderModel.loaderObj('1/6e3a80a5-9408-ac22-6618-771ff0bba953');
    arrMesh = await loaderModel.loaderObj('1/278c7e02-5729-875b-583b-0e92a93faf71');
    arrMesh = await loaderModel.loaderObj('1/f5aaf88d-1b09-bd8a-1a4e-9bcd958c34e5');
    arrMesh = await loaderModel.loaderObj('1/4e267b82-01c5-891f-c0e8-b54c811880a5');
    arrMesh = await loaderModel.loaderObj('1/8370dc61-c4cf-bfd3-5877-593272847912');

    arrMesh = await loaderModel.loaderObj('1/82565674-6e5b-e307-7d05-ff7fb293e60d');
    arrMesh = await loaderModel.loaderObj('1/e38181c1-0a44-dfef-46ae-08a5be97e573');
    arrMesh = await loaderModel.loaderObj('1/e5c11088-c8d1-03cc-6706-af5a246ec55e');
    arrMesh = await loaderModel.loaderObj('1/36c1aff0-e464-bd6d-a2d3-835af5bf6c7f');
    arrMesh = await loaderModel.loaderObj('1/f798e46e-7d50-43ae-f446-e3ea364e5ead');
    arrMesh = await loaderModel.loaderObj('1/f538982e-35cd-8cf1-8bc7-3d199eb8e4ca');
    arrMesh = await loaderModel.loaderObj('1/82cbd306-a3f4-3f92-e3b5-33f1f6c985ef');

    arrMesh = await loaderModel.loaderObj('1/0cb782a2-c7f8-66da-a720-ab7e3697677b');
    arrMesh = await loaderModel.loaderObj('1/eb69daef-9c99-e228-1cb0-fc2a831c7e5b');
    arrMesh = await loaderModel.loaderObj('1/bba4da77-87ce-353a-5cfc-14f47dc0612b');
    meshes.push(...arrMesh);

    meshes.forEach((meshe) => {
      // let q_Offset = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 2));
      // meshe.position.applyQuaternion(q_Offset);
      // meshe.quaternion.premultiply(q_Offset);
      // meshe.updateMatrixWorld();
    });

    listMeshes = meshes;
  }

  //isometricPdfToSvg.containerPdf.style.display = 'none';

  const calcIsometrixSvg = new CalcIsometrixSvg();
  const data = calcIsometrixSvg.getType({ meshes: listMeshes });
  const isometrix = isometric3dto2d.getIsometry({ scene, mapControlInit, data });
  console.log('isometrix', isometrix);
  isometricSvgLoad.setIsometry(isometrix);

  //isometricSetCalcNotes.setNotes();
}

function render() {
  requestAnimationFrame(render);

  controls.update();

  renderer.render(scene, camera);
}
