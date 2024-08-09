import * as THREE from 'three';

import { isometricSvgElem } from './index';

export class IsometricSvgCalc {
  modelsContainerInit = { control: null };
  mapControlInit = { control: null };
  offsetSvg = new THREE.Vector2();

  init({ scene, mapControlInit }) {
    this.modelsContainerInit.control = scene;
    this.mapControlInit.control = mapControlInit.control;
  }

  fitCamera(data) {
    const arrPos = [];
    data.objs.forEach((item) => {
      const arr = item.joints.map((joint) => joint.pos);
      arrPos.push(...arr);
    });

    const bound = {
      min: { x: Infinity, y: Infinity, z: Infinity },
      max: { x: -Infinity, y: -Infinity, z: -Infinity },
    };

    for (let i = 0; i < arrPos.length; i++) {
      const v = arrPos[i];

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

    const camera = this.mapControlInit.control.object;

    let aspect = (bound.max.x - bound.min.x) / (bound.max.z - bound.min.z);

    let zoom = 1;
    if (aspect > 1.0 && camera instanceof THREE.OrthographicCamera) {
      let x = bound.max.x - bound.min.x < 0.1 ? 0.1 : bound.max.x - bound.min.x;
      zoom = camera.right / (x / 2);
    } else if (camera instanceof THREE.OrthographicCamera) {
      let z = bound.max.z - bound.min.z < 0.1 ? 0.1 : bound.max.z - bound.min.z;
      zoom = camera.top / (z / 2);
    }
    if (camera instanceof THREE.OrthographicCamera) camera.zoom = zoom / 2;

    const center2 = this.modelsContainerInit.control.localToWorld(center.clone());
    const pos = new THREE.Vector3(200, 200, -200).add(center2);
    camera.position.copy(pos);
    this.mapControlInit.control.target.copy(center2);

    camera.updateMatrixWorld();
    if (camera instanceof THREE.OrthographicCamera) camera.updateProjectionMatrix();

    this.mapControlInit.control.update();

    // визуализация boundBox изометрии
    const helpVisual = false;
    if (helpVisual) {
      const shape = new THREE.Shape(points);
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
      const geometry = new THREE.ExtrudeGeometry(shape, { bevelEnabled: false, depth: -(bound.max.y - bound.min.y) });
      geometry.rotateX(Math.PI / 2);
      const cube = new THREE.Mesh(geometry, material);
      cube.position.y = bound.min.y;
      this.modelsContainerInit.control.add(cube);

      const geometry2 = new THREE.BoxGeometry(1, 1, 1);
      const material2 = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const cube2 = new THREE.Mesh(geometry2, material2);
      cube2.position.copy(center);
      this.modelsContainerInit.control.add(cube2);
    }
  }

  createSvgScheme({ data }) {
    const lines = [];
    const objs = { tees: [], undefinedes: [] };

    data.objs.forEach((item) => {
      if (item.type === 'line' || item.type === 'curved') {
        lines.push(item.joints);
      }
      if (item.type === 'tee') {
        objs.tees.push(item.joints);
      }
      if (item.type === 'undefined') {
        objs.undefinedes.push(item.joints);
      }
    });

    const arrData = { line: [], circle: [], objs: [] };

    this.modelsContainerInit.control.updateWorldMatrix(true, false);

    const listPoints = [];

    for (let i = 0; i < lines.length; i++) {
      const joints = lines[i];
      if (joints.length === 0) continue;

      listPoints.push(...joints);

      for (let i2 = 0; i2 < joints.length - 1; i2++) {
        const p1 = joints[i2].pos;
        const p2 = joints[i2 + 1].pos;

        const ids = [joints[i2].id, joints[i2 + 1].id];

        const pos = [
          new THREE.Vector3(p1.x, p1.y, p1.z).applyMatrix4(this.modelsContainerInit.control.matrixWorld),
          new THREE.Vector3(p2.x, p2.y, p2.z).applyMatrix4(this.modelsContainerInit.control.matrixWorld),
        ];

        arrData.line.push({ pos, ids });
      }
    }

    for (let i = 0; i < objs.undefinedes.length; i++) {
      const joints = objs.undefinedes[i];
      if (joints.length === 0) continue;

      listPoints.push(...joints);

      const p1 = joints[0].pos;
      const p2 = joints[1].pos;

      const ids = [joints[0].id, joints[1].id];

      const pos = [
        new THREE.Vector3(p1.x, p1.y, p1.z).applyMatrix4(this.modelsContainerInit.control.matrixWorld),
        new THREE.Vector3(p2.x, p2.y, p2.z).applyMatrix4(this.modelsContainerInit.control.matrixWorld),
      ];

      arrData.line.push({ pos, ids });

      arrData.objs.push({ tag: 'objFlap', joints: { pos, ids } });
    }

    for (let i = 0; i < objs.tees.length; i++) {
      const joints = objs.tees[i];
      if (joints.length === 0) continue;

      const p1 = joints[0].pos;
      const p2 = joints[1].pos;
      const p3 = joints[2].pos;

      const ids = [joints[0].id, joints[1].id, joints[2].id, []];

      const pos = [
        new THREE.Vector3(p1.x, p1.y, p1.z).applyMatrix4(this.modelsContainerInit.control.matrixWorld),
        new THREE.Vector3(p2.x, p2.y, p2.z).applyMatrix4(this.modelsContainerInit.control.matrixWorld),
      ];

      arrData.line.push({ pos: [pos[0].clone(), pos[1].clone()], ids });

      const p4 = pos[1].clone().sub(pos[0]).divideScalar(2).add(pos[0]);
      pos.push(new THREE.Vector3(p3.x, p3.y, p3.z).applyMatrix4(this.modelsContainerInit.control.matrixWorld));
      pos.push(new THREE.Vector3(p4.x, p4.y, p4.z));

      arrData.objs.push({ tag: 'objTee', joints: { pos, ids } });
    }

    const bdPoints = [];

    for (let i2 = 0; i2 < listPoints.length; i2++) {
      const p1 = listPoints[i2].pos;
      const ids = [...listPoints[i2].id];

      const ind = bdPoints.findIndex((p) => p.x === p1.x && p.y === p1.y && p.z === p1.z);
      if (ind > -1) continue;

      bdPoints.push(p1);

      const pos = new THREE.Vector3(p1.x, p1.y, p1.z).applyMatrix4(this.modelsContainerInit.control.matrixWorld);

      arrData.circle.push({ pos, ids });
    }

    const camera = this.mapControlInit.control.object;
    const domElement = this.mapControlInit.control.domElement;

    const svg = this.updateSvg({ camera, domElement, arrData });

    return svg;
  }

  updateSvg({ camera, domElement, arrData }) {
    this.getOffsetSvg();
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const lines = [];
    const points = [];
    const objs = [];

    for (let i = 0; i < arrData.line.length; i++) {
      const points = arrData.line[i].pos;
      const arrPos = [];

      for (let i2 = 0; i2 < points.length; i2++) {
        const pos = this.getPosSvg(camera, domElement, points[i2]);
        arrPos.push(pos);
      }
      lines.push({ pos: arrPos, ids: arrData.line[i].ids });
    }

    for (let i = 0; i < arrData.circle.length; i++) {
      const pos = this.getPosSvg(camera, domElement, arrData.circle[i].pos);
      points.push({ pos, ids: arrData.circle[i].ids });
    }

    for (let i = 0; i < arrData.objs.length; i++) {
      const points = arrData.objs[i].joints.pos;

      let pos = points[1].clone().sub(points[0]).divideScalar(2).add(points[0]);
      pos = this.getPosSvg(camera, domElement, pos);

      const pos1 = this.getPosSvg(camera, domElement, points[0]);
      const pos2 = this.getPosSvg(camera, domElement, points[1]);

      const dist = pos1.distanceTo(pos2);
      const scale = dist / 40;

      objs.push({ tag: arrData.objs[i].tag, pos, scale });
    }

    const table = this.setTable();

    const sheet = { format: 'a3', table1: table.table1, table2: table.table2 };

    return { lines, points, objs, sheet };
  }

  getOffsetSvg() {
    const containerSvg = isometricSvgElem.getContainerSvg();
    const bound = containerSvg.getBoundingClientRect();
    this.offsetSvg = new THREE.Vector2(-bound.x, -bound.y);
  }

  getPosSvg(camera, domElement, pos) {
    const coord = this.getPosition2D({ camera, canvas: domElement, pos });
    coord.add(this.offsetSvg);

    return coord;
  }

  getPosition2D({ camera, canvas, pos }) {
    const tempV = pos.clone().project(camera);

    const x = (tempV.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (tempV.y * -0.5 + 0.5) * canvas.clientHeight;

    return new THREE.Vector2(x, y);
  }

  setTable() {
    const data = { table1: [], table2: [] };

    data.table1.push({ id: 0, txt: 'Автоматический расчет изометрии' });
    data.table1.push({ id: 1, txt: 'Проект ukpg_3-1' });
    data.table1.push({ id: 2, txt: 'Дисциплина 0019.005-TH_02' });
    data.table1.push({ id: 6, txt: 'А' });
    data.table1.push({ id: 7, txt: '1' });
    data.table1.push({ id: 8, txt: '1' });
    data.table1.push({ id: 9, txt: 'Тестовая сборка' });

    data.table2.push({ id: 36, txt: 'Иванов П.П.' });
    data.table2.push({ id: 38, txt: '10.10.23' });
    data.table2.push({ id: 40, txt: 'Петров И.И.' });
    data.table2.push({ id: 42, txt: '15.10.23' });

    return data;
  }
}
