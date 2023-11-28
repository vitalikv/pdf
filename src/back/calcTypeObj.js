import * as THREE from 'three';

export class CalcTypeObj {
  calcTypes({ meshObjs, joints }) {
    if (joints.length === 0) return;

    const arr = [];

    for (let i = 0; i < meshObjs.length; i++) {
      const result = this.getTypeObj({ obj: meshObjs[i], joints });

      if (result.type === 'line') arr.push(result);
      if (result.type === 'curved') arr.push(result);
      if (result.type === 'undefined') arr.push(result);
    }

    return arr;
  }

  getTypeObj({ obj, joints }) {
    let arrJ = [];

    for (let i = 0; i < joints.length; i++) {
      const objsId = joints[i].ifc_joint_id;

      const result = objsId.findIndex((id) => obj.userData.geoGuids[0] === id);
      if (result < 0) continue;
      arrJ.push(joints[i]);
    }

    let type = '';

    if (arrJ.length === 0) {
      const result = this.detectObj({ obj, joints });

      if (result.length > 0) {
        arrJ.push(...result);
        type = 'undefined';
      }
    }

    // труба
    else if (arrJ.length === 2) {
      const dirA = arrJ[0].dir;
      const dirB = arrJ[1].dir;
      const dot = Math.abs(dirA.dot(dirB));

      // прямая
      if (dot > 0.98) {
        type = 'line';

        const r1 = arrJ[0].scale;
        const r2 = arrJ[1].scale;

        const r = [r1, r2].sort((a, b) => b - a);

        if (Math.abs(r[0] / r[1]) < 0.95) {
          type = 'adapter';
        }
      } else {
        // изогнутая (угол)
        type = 'curved';

        const pos1 = arrJ[0].pos;
        const dir1 = arrJ[0].dir;
        const pos2 = arrJ[1].pos;
        const dir2 = arrJ[1].dir;

        const dist = pos1.distanceTo(pos2);

        const result = this.closestPointsDet(pos1, dir1, pos2, dir2);

        if (result.cross) {
          const dist1 = result.pos.distanceTo(pos1);

          if (dist * 1 > dist1) {
            const arrJ2 = [{ ...arrJ[0] }, { ...arrJ[1] }, { ...arrJ[1] }];
            arrJ2[1].pos = result.pos;

            arrJ = arrJ2;
          }
        }
      }
    }

    // тройник
    else if (arrJ.length === 3) {
      type = 'tee';
    }

    return { type, joints: arrJ.map((item) => item.pos) };
  }

  // находим точку пересечения двух линий в 3D
  // решение по ссылке
  // https://discourse.threejs.org/t/find-intersection-between-two-line3/7119
  // https://discourse.threejs.org/t/solved-how-to-find-intersection-between-two-rays/6464/8
  // метод находит точку пересечения, даже если линии не пересеклись
  // но есть проверка на пересечение (если dpnqnDet === 0, то линии пересекаются)
  // по ссылке есть еще один метод, но я выбрал этот
  closestPointsDet(p1, dir1, p2, dir2) {
    const qp = new THREE.Vector3().subVectors(p1, p2);

    const qpDotmp = qp.dot(dir1);
    const qpDotmq = qp.dot(dir2);
    const mpDotmp = dir1.dot(dir1);
    const mqDotmq = dir2.dot(dir2);
    const mpDotmq = dir1.dot(dir2);

    const detp = qpDotmp * mqDotmq - qpDotmq * mpDotmq;
    const detq = qpDotmp * mpDotmq - qpDotmq * mpDotmp;

    const detm = mpDotmq * mpDotmq - mqDotmq * mpDotmp;

    const pnDet = p1.clone().add(dir1.clone().multiplyScalar(detp / detm));
    const qnDet = p2.clone().add(dir2.clone().multiplyScalar(detq / detm));

    const dpnqnDet = pnDet.clone().sub(qnDet).length();

    const cross = Number(dpnqnDet.toFixed(10)) < 0.0001 ? true : false;

    return { cross, pos: qnDet };
  }

  // определяем что за неопознанный объект
  detectObj({ obj, joints }) {
    let arrJ = [];

    const arrP = this.getBox({ obj });

    const listJ = [];

    for (let i = 0; i < joints.length; i++) {
      if (joints[i].ifc_joint_id.length !== 1) continue;

      const pos = joints[i].pos;
      let dist = Infinity;

      for (let i2 = 0; i2 < arrP.length; i2++) {
        const newDist = arrP[i2].distanceTo(pos);
        if (dist > newDist) dist = newDist;
      }

      listJ.push({ dist: Math.abs(dist), joint: joints[i] });
    }

    if (listJ.length > 1) {
      listJ.sort((a, b) => a.dist - b.dist);

      if (listJ[1].dist - listJ[0].dist < 0.1) {
        arrJ = [listJ[0].joint, listJ[1].joint];
      }
    }

    return arrJ;
  }

  getBox({ obj }) {
    const v = [];

    obj.updateMatrixWorld();
    obj.geometry.computeBoundingBox();

    let bound = obj.geometry.boundingBox;

    v[v.length] = new THREE.Vector3(bound.min.x, bound.min.y, bound.max.z).applyMatrix4(obj.matrixWorld);
    v[v.length] = new THREE.Vector3(bound.max.x, bound.min.y, bound.max.z).applyMatrix4(obj.matrixWorld);
    v[v.length] = new THREE.Vector3(bound.min.x, bound.min.y, bound.min.z).applyMatrix4(obj.matrixWorld);
    v[v.length] = new THREE.Vector3(bound.max.x, bound.min.y, bound.min.z).applyMatrix4(obj.matrixWorld);

    v[v.length] = new THREE.Vector3(bound.min.x, bound.max.y, bound.max.z).applyMatrix4(obj.matrixWorld);
    v[v.length] = new THREE.Vector3(bound.max.x, bound.max.y, bound.max.z).applyMatrix4(obj.matrixWorld);
    v[v.length] = new THREE.Vector3(bound.min.x, bound.max.y, bound.min.z).applyMatrix4(obj.matrixWorld);
    v[v.length] = new THREE.Vector3(bound.max.x, bound.max.y, bound.min.z).applyMatrix4(obj.matrixWorld);

    bound = { min: { x: Infinity, y: Infinity, z: Infinity }, max: { x: -Infinity, y: -Infinity, z: -Infinity } };

    for (let i = 0; i < v.length; i++) {
      if (v[i].x < bound.min.x) {
        bound.min.x = v[i].x;
      }
      if (v[i].x > bound.max.x) {
        bound.max.x = v[i].x;
      }
      if (v[i].y < bound.min.y) {
        bound.min.y = v[i].y;
      }
      if (v[i].y > bound.max.y) {
        bound.max.y = v[i].y;
      }
      if (v[i].z < bound.min.z) {
        bound.min.z = v[i].z;
      }
      if (v[i].z > bound.max.z) {
        bound.max.z = v[i].z;
      }
    }

    const arrP = [];
    arrP.push(new THREE.Vector3(bound.min.x, (bound.max.y - bound.min.y) / 2 + bound.min.y, (bound.max.z - bound.min.z) / 2 + bound.min.z));
    arrP.push(new THREE.Vector3(bound.max.x, (bound.max.y - bound.min.y) / 2 + bound.min.y, (bound.max.z - bound.min.z) / 2 + bound.min.z));
    arrP.push(new THREE.Vector3((bound.max.x - bound.min.x) / 2 + bound.min.x, bound.min.y, (bound.max.z - bound.min.z) / 2 + bound.min.z));
    arrP.push(new THREE.Vector3((bound.max.x - bound.min.x) / 2 + bound.min.x, bound.max.y, (bound.max.z - bound.min.z) / 2 + bound.min.z));
    arrP.push(new THREE.Vector3((bound.max.x - bound.min.x) / 2 + bound.min.x, (bound.max.y - bound.min.y) / 2 + bound.min.y, bound.min.z));
    arrP.push(new THREE.Vector3((bound.max.x - bound.min.x) / 2 + bound.min.x, (bound.max.y - bound.min.y) / 2 + bound.min.y, bound.max.z));

    return arrP;
  }

  helperArrow({ dir, pos, length = 1, color = 0xff0000, scene }) {
    const pos1 = pos.clone();

    //pos1.add(new THREE.Vector3().addScaledVector(dir, 0.3));
    //pos1.add(new THREE.Vector3(0, 1, 0));
    const helper = new THREE.ArrowHelper(dir, pos1, length, color);
    helper.line.material = new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true });
    helper.cone.material = new THREE.MeshStandardMaterial({ color, depthTest: false, transparent: true });
    scene.add(helper);
  }
}
