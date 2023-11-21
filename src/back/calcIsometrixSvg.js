import * as THREE from 'three';

import { AttributesUtil } from './attributesUtil';
import { CalcJointsForType } from './calcJointsForType';
import { CalcTypeObj } from './calcTypeObj';
import { Isometric3dto2d } from './isometric3dto2d';
import { MocksIsometry } from './mocks';

export class CalcIsometrixSvg {
  attributesUtil;
  isometric3dto2d;
  mocksIsometry;

  constructor() {
    this.attributesUtil = new AttributesUtil();
    this.isometric3dto2d = new Isometric3dto2d();
    this.mocksIsometry = new MocksIsometry();
  }

  getType({ meshes, scene, mapControlInit, guids = [] }) {
    this.setId(meshes);

    guids = this.mocksIsometry.listLine(); // в ручную добавленые id
    if (guids.length > 0) {
      meshes = this.getSelectedMeshes({ meshes, guids });
    }

    const calcJointsForType = new CalcJointsForType();
    const joints = calcJointsForType.getJoints(meshes);

    const calcTypeObj = new CalcTypeObj();
    const objs = calcTypeObj.calcTypes({ meshObjs: meshes, joints });

    const isometrix = this.isometric3dto2d.init({ scene, mapControlInit, data: { objs, joints } });

    return { objs, joints, isometrix };
  }

  // получаем и устанавливаем globalId
  setId(meshes) {
    meshes.forEach((mesh) => {
      if (mesh instanceof THREE.Mesh) {
        if (mesh.geometry instanceof THREE.BufferGeometry) {
          const geoGuids = this.attributesUtil.getGuidByBufferGeometry(mesh.geometry);

          if (geoGuids && geoGuids.length > 0) {
            mesh.userData.geoGuids = geoGuids;
          }
        }
      }
    });
  }

  // получаем только те объекты в дисциплине, которые выбрали
  getSelectedMeshes({ meshes, guids }) {
    const newMeshes = [];

    meshes.forEach((mesh) => {
      let add = true;
      const ind = guids.findIndex((item) => item === mesh.userData.geoGuids[0]);
      if (ind === -1) add = false;

      if (add) newMeshes.push(mesh);
    });

    return newMeshes;
  }
}
