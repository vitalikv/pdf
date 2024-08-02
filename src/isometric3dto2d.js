import * as THREE from 'three';

import { isometricSvgCalc } from './index';

export class Isometric3dto2d {
  init({ scene, mapControlInit, data }) {
    console.log('data', data);

    isometricSvgCalc.init({ scene, mapControlInit });
    isometricSvgCalc.fitCamera(data);
    const result = isometricSvgCalc.createSvgScheme({ data });

    this.showJoints(data.joints, scene);
    this.showLines(data, scene);

    return result;
  }

  // показываем стыки на 3D моделе
  showJoints(joints, scene) {
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

      scene.add(object);
    }
  }

  // показываем линии на 3D моделе
  showLines(data, scene) {
    for (let i = 0; i < data.objs.length; i++) {
      const points = data.objs[i].joints.map((joint) => joint.pos);
      const line = this.createLine({ points });

      scene.add(line);
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
}
