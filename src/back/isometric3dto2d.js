import * as THREE from 'three';

import { isometricSvgElem } from '../index';

export class Isometric3dto2d {
  modelsContainerInit = { control: null };
  mapControlInit = { control: null };
  offsetSvg = new THREE.Vector2();

  constructor() {
    const container = document.querySelector('[nameId="svgTools"]');
    const svgXmlns = isometricSvgElem.getSvgXmlns({ container });
    const bound = svgXmlns.getBoundingClientRect();
    this.offsetSvg = new THREE.Vector2(-bound.x, -bound.y);
  }

  init({ scene, mapControlInit, data }) {
    this.modelsContainerInit.control = scene;
    this.mapControlInit.control = mapControlInit.control;

    this.fitCamera(data.joints);

    this.showJoints(data.joints);
    this.showLines(data.objs);

    const result = this.createSvgScheme({
      lines: data.objs.map((item) => item.joints),
    });

    return result;
  }

  showJoints(joints) {
    const newGeometry = new THREE.CylinderGeometry(1, 1, 0.01, 26);
    newGeometry.rotateZ(Math.PI / 2);
    newGeometry.rotateY(Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      depthTest: false,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });

    const material2 = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      depthTest: false,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });

    for (let i = 0; i < joints.length; i++) {
      const item = joints[i];

      const m = item.ifc_joint_id.length === 1 ? material2 : material;
      const object = new THREE.Mesh(newGeometry, m);
      const pos = item.pos;
      const rot = item.rot;
      const scale = item.scale;

      object.position.set(pos.x, pos.y, pos.z);
      object.rotation.set(rot.x, rot.y, rot.z);
      object.scale.set(scale, scale, scale);

      this.modelsContainerInit.control.add(object);
    }
  }

  showLines(lines) {
    for (let i = 0; i < lines.length; i++) {
      const line = this.createLine({ points: lines[i].joints });

      this.modelsContainerInit.control.add(line);
    }
  }

  createLine({ points }) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      depthTest: false,
      transparent: true,
    });

    const line = new THREE.Line(geometry, material);

    return line;
  }

  fitCamera(data) {
    const bound = {
      min: { x: Infinity, y: Infinity, z: Infinity },
      max: { x: -Infinity, y: -Infinity, z: -Infinity },
    };

    for (let i = 0; i < data.length; i++) {
      const v = data[i].pos;

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

  createSvgScheme({ lines }) {
    const arrData = { line: [], circle: [] };

    this.modelsContainerInit.control.updateWorldMatrix(true, false);

    const bdPoints = [];

    for (let i = 0; i < lines.length; i++) {
      const points = lines[i];
      for (let i2 = 0; i2 < points.length - 1; i2++) {
        const p1 = points[i2];
        const p2 = points[i2 + 1];

        const pos = [
          new THREE.Vector3(p1.x, p1.y, p1.z).applyMatrix4(this.modelsContainerInit.control.matrixWorld),
          new THREE.Vector3(p2.x, p2.y, p2.z).applyMatrix4(this.modelsContainerInit.control.matrixWorld),
        ];

        arrData.line.push(pos);
      }

      // let circle = {};
      // let p1 = points[0];
      // circle['point'] = new THREE.Vector3(p1.x, p1.y, p1.z).applyMatrix4(this.modelsContainerInit.control.matrixWorld);
      // this.arr.circle.push(circle);
      // circle = {};
      // p1 = points[points.length - 1];
      // circle['point'] = new THREE.Vector3(p1.x, p1.y, p1.z).applyMatrix4(this.modelsContainerInit.control.matrixWorld);
      // this.arr.circle.push(circle);

      for (let i2 = 0; i2 < points.length; i2++) {
        const p1 = points[i2];

        const ind = bdPoints.findIndex((p) => p === p1);
        if (ind > -1) continue;

        bdPoints.push(p1);

        const pos = new THREE.Vector3(p1.x, p1.y, p1.z).applyMatrix4(this.modelsContainerInit.control.matrixWorld);

        arrData.circle.push(pos);
      }
    }

    const camera = this.mapControlInit.control.object;
    const domElement = this.mapControlInit.control.domElement;

    const data = this.updateSvg({ camera, domElement, arrData });

    return data;
  }

  updateSvg({ camera, domElement, arrData }) {
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const lines = [];
    const points = [];

    for (let i = 0; i < arrData.line.length; i++) {
      const data = this.updateSvgLine(camera, domElement, arrData.line[i]);
      lines.push(data);
    }
    for (let i = 0; i < arrData.circle.length; i++) {
      const data = this.updateSvgCircle(camera, domElement, arrData.circle[i]);
      points.push(data);
    }

    return { lines, points };
  }

  updateSvgLine(camera, domElement, points) {
    const pos1 = this.getPosition2D({ camera, canvas: domElement, pos: points[0] });
    const pos2 = this.getPosition2D({ camera, canvas: domElement, pos: points[1] });

    const bound = domElement.getBoundingClientRect();
    const offset = new THREE.Vector2(-bound.x, -bound.y);
    pos1.add(this.offsetSvg);
    pos2.add(this.offsetSvg);

    return { pos: [pos1, pos2] };
  }

  updateSvgCircle(camera, domElement, point) {
    const pos = this.getPosition2D({ camera, canvas: domElement, pos: point });

    const bound = domElement.getBoundingClientRect();
    const offset = new THREE.Vector2(-bound.x, -bound.y);
    pos.add(this.offsetSvg);

    return { pos };
  }

  getPosition2D({ camera, canvas, pos }) {
    const tempV = pos.clone().project(camera);

    const x = (tempV.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (tempV.y * -0.5 + 0.5) * canvas.clientHeight;

    return new THREE.Vector2(x, y);
  }
}
