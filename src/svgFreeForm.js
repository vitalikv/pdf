import * as THREE from 'three';

import { isometricSvgElem, isometricMath } from './index';

export class IsometricSvgFreeForm {
  groupObjs;
  toolPoint = null;
  isDown = false;
  isMove = false;
  offset = new THREE.Vector2();
  selectedObj = { el: null, mode: '' };

  init({ containerSvg }) {
    this.groupObjs = isometricSvgElem.getSvgGroup({ container: containerSvg, tag: 'objs' });
  }

  createToolPoint(event = null) {
    let x = -999999;
    let y = -999999;

    if (event) {
      const pos = this.getCoord(event);
      x = pos.x;
      y = pos.y;
    }

    this.toolPoint = isometricSvgElem.createSvgCircle({ x, y, stroke: '#ff0000' });
    this.groupObjs.append(this.toolPoint);
  }

  createLine({ pos, group = null }) {
    const svg = isometricSvgElem.createSvgLine({ x1: pos[0].x, y1: pos[0].y, x2: pos[1].x, y2: pos[1].y });

    if (!group) {
      group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group['userData'] = { freeForm: true, elems: [] };
    }

    group.append(svg);

    this.groupObjs.append(group);

    return svg;
  }

  onmousedown = ({ event = null, type = null }) => {
    const mode = this.detectModeDown({ event, type });

    if (mode === 'clickRight') {
      this.clickRightButton();
      return false;
    }

    if (mode === 'clickLeft') {
      this.deleteToolPoint();
      const group = this.selectedObj.el ? this.selectedObj.el.parentElement : null;
      let coord = isometricSvgElem.getCoordMouse({ event });

      if (this.selectedObj.el && this.selectedObj.mode === 'createLineMove') {
        const pos = isometricSvgElem.getPosLine2(this.selectedObj.el);
        coord = pos[1];
      }

      this.selectedObj.el = this.createLine({ pos: [coord, coord], group });
      this.selectedObj.mode = 'createLineMove';
      return true;
    }

    // if (this.selectedObj.el) this.actElem(this.selectedObj.el);

    // this.isDown = false;
    // this.isMove = false;

    // this.groupObjs.childNodes.forEach((svg, ind) => {
    //   if (svg.contains(event.target)) {
    //     isometricSvgListObjs.scaleObj(svg);
    //     this.actElem(svg, true);

    //     if (!svg['userData'].lock) {
    //       this.isDown = true;
    //     }

    //     if (svg['userData'].tag === 'point' && event.button !== 0) {
    //       this.setLockOnSvg(svg);
    //     }
    //   }
    // });

    // this.offset = this.getCoord(event);

    return this.isDown;
  };

  onmousemove = (event) => {
    const mode = this.detectModeMove();

    const pos = isometricSvgElem.getCoordMouse({ event });

    if (mode === 'moveToolPoint') {
      isometricSvgElem.setPosCircle(this.toolPoint, pos.x, pos.y);
    }

    if (mode === 'createLineMove') {
      const svg = this.selectedObj.el;
      isometricSvgElem.setPosLine2({ svg, x2: pos.x, y2: pos.y });

      const parent = this.selectedObj.el.parentElement;

      const points = [];
      parent.childNodes.forEach((child) => {
        const pos = isometricSvgElem.getPosLine2(child);
        points.push(new THREE.Vector3(pos[0].x, 0, pos[0].y));
      });
      points.push(new THREE.Vector3(pos.x, 0, pos.y));

      const newPos = this.pointAligning({ point: points[points.length - 1], points });
      isometricSvgElem.setPosLine2({ svg, x2: newPos.x, y2: newPos.y });
    }

    // if (!this.isDown) return;
    // if (!this.isMove) {
    //   this.isMove = true;
    //   isometricSvgListObjs.deActPointsScale();

    //   if (this.selectedObj.mode !== 'add' && this.selectedObj.el) {
    //     //isometricSvgUndoRedo.writeBd({ svg: this.selectedObj.el });
    //   }
    // }

    // let svg = this.selectedObj.el;

    // let pos = this.getCoord(event);
    // const offset = pos.sub(this.offset);

    // this.moveSvgObj({ svg, offset });
    // this.addLink({ svgPoint: svg, event });
    // this.setRotObj({ svg });

    this.offset = isometricSvgElem.getCoordMouse({ event });
  };

  onmouseup = (event) => {
    this.isDown = false;
    this.isMove = false;
  };

  detectModeDown({ event, type }) {
    let mode = 'clickLeft';

    if (event.button === 2) {
      mode = 'clickRight';
    }

    return mode;
  }

  detectModeMove() {
    let mode = null;

    if (!this.isDown && this.toolPoint) {
      mode = 'moveToolPoint';
    }
    if (!this.isDown && this.selectedObj.mode === 'createLineMove') {
      mode = this.selectedObj.mode;
    }

    return mode;
  }

  // выравнивание точки к направляющим X/Z
  pointAligning({ point, points }) {
    let pos = point.clone();
    const axisX = [];
    const axisZ = [];

    for (let i = 0; i < points.length; i++) {
      if (point === points[i]) continue;

      const A = points[i];
      const B1 = points[i].clone().add(new THREE.Vector3(1, 0, 0));
      const B2 = points[i].clone().add(new THREE.Vector3(0, 0, 1));
      const C = point;

      const p1 = isometricMath.mathProjectPointOnLine2D({ A, B: B1, C });
      const p2 = isometricMath.mathProjectPointOnLine2D({ A, B: B2, C });

      const x = Math.abs(points[i].x - p1.x);
      const z = Math.abs(points[i].z - p2.z);

      if (x < 6) {
        axisX.push({ dist: 0, pos: points[i] });
      }
      if (z < 6) {
        axisZ.push({ dist: 0, pos: points[i] });
      }
    }

    if (axisX.length > 0) {
      for (let i = 0; i < axisX.length; i++) axisX[i].dist = point.distanceTo(axisX[i].pos);
      axisX.sort(function (a, b) {
        return a.dist - b.dist;
      });
    }

    if (axisZ.length > 0) {
      for (let i = 0; i < axisZ.length; i++) axisZ[i].dist = point.distanceTo(axisZ[i].pos);
      axisZ.sort(function (a, b) {
        return a.dist - b.dist;
      });
    }

    if (axisX.length > 0 && axisZ.length > 0) {
      pos.x = axisX[0].pos.x;
      pos.z = axisZ[0].pos.z;
    } else if (axisX.length > 0) pos.x = axisX[0].pos.x;
    else if (axisZ.length > 0) pos.z = axisZ[0].pos.z;

    return new THREE.Vector2(pos.x, pos.z);
  }

  clickRightButton() {
    this.isDown = false;
    this.isMove = false;
    this.deleteToolPoint();

    if (this.selectedObj.el) {
      const parent = this.selectedObj.el.parentElement;

      if (parent.childNodes.length === 1) {
        parent.remove();
      } else {
        this.selectedObj.el.remove();
      }

      this.cleareSelectedObj();
    }
  }

  deleteToolPoint() {
    if (!this.toolPoint) return;

    this.toolPoint.remove();
    this.toolPoint = null;
  }

  cleareSelectedObj() {
    this.selectedObj.el = null;
    this.selectedObj.mode = '';
  }
}
