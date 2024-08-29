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

  createToolPoint() {
    let x = -999999;
    let y = -999999;

    this.toolPoint = isometricSvgElem.createSvgCircle({ x, y, stroke: '#ff0000' });
    this.groupObjs.append(this.toolPoint);
  }

  createGroup() {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g['userData'] = { freeForm: true, elems: [] };

    return g;
  }

  createLine({ pos, group = null }) {
    const svg = isometricSvgElem.createSvgLine({ x1: pos[0].x, y1: pos[0].y, x2: pos[1].x, y2: pos[1].y });

    if (!group) group = this.createGroup();

    group.append(svg);

    this.groupObjs.append(group);

    return svg;
  }

  createPolygon({ data, group = null }) {
    const pos = data.pos;
    const points = data.points;

    const svg = isometricSvgElem.createPolygon({ x: pos.x, y: pos.y, points, fill: 'none' });

    if (!group) group = this.createGroup();

    group.append(svg);

    this.groupObjs.append(group);

    return svg;
  }

  onmousedown = ({ event = null, svg = null }) => {
    if (!svg) {
      const mode = this.detectModeDown({ event });

      if (mode === 'clickRight') {
        this.clickRightButton();
        return false;
      }

      // создаем новую линию или продолжаем ее создавать
      if (mode === 'clickLeft') {
        this.deleteToolPoint();

        let coord = isometricSvgElem.getCoordMouse({ event });

        // одна или несколько линий уже созданы, продолжаем создавать
        if (this.selectedObj.el && this.selectedObj.mode === 'createLineMove') {
          const pos = isometricSvgElem.getPosLine2(this.selectedObj.el);
          coord = pos[1];
        }

        // если уже созданно больше 2-х линий, проверяем пересечение перетаскиваемой точки с первой точкой первой линии
        const group = this.selectedObj.el && this.selectedObj.mode === 'createLineMove' ? this.selectedObj.el.parentElement : null;
        if (group && group.childNodes.length > 2) {
          const linePos = isometricSvgElem.getPosLine2(group.childNodes[0]);

          const joint = coord.distanceTo(linePos[0]) < 6 ? true : false;

          if (joint) {
            const points = this.getPointsFromLines({ group, format: 'v2' });

            this.deleteElemsFromGroup({ group });

            let strPoints = '';
            for (let i = 0; i < points.length - 1; i++) {
              strPoints += ' ' + points[i].x + ',' + points[i].y;
            }

            const data = { pos: new THREE.Vector2(), points: strPoints };

            this.createPolygon({ data, group });

            this.clickFinishForm();
            return false;
          }
        }

        this.selectedObj.el = this.createLine({ pos: [coord, coord], group });
        this.selectedObj.mode = 'createLineMove';
        return true;
      }
    }

    if (svg) {
      if (this.selectedObj.el) this.actElem(this.selectedObj.el, false);
      this.actElem(svg, true);

      this.isDown = true;
      this.isMove = false;

      this.offset = isometricSvgElem.getCoordMouse({ event });
    }

    return this.isDown;
  };

  onmousemove = (event) => {
    if (!this.isDown) {
      const mode = this.detectModeMove();

      const pos = isometricSvgElem.getCoordMouse({ event });

      if (mode === 'moveToolPoint') {
        isometricSvgElem.setPosCircle(this.toolPoint, pos.x, pos.y);
      }

      if (mode === 'createLineMove') {
        const svg = this.selectedObj.el;
        isometricSvgElem.setPosLine2({ svg, x2: pos.x, y2: pos.y });

        const group = this.selectedObj.el.parentElement;

        const points = this.getPointsFromLines({ group, format: 'v3' });

        const newPos = this.pointAligning({ point: points[points.length - 1], points });
        isometricSvgElem.setPosLine2({ svg, x2: newPos.x, y2: newPos.y });
      }
    }

    if (this.isDown) {
      const svg = this.selectedObj.el;

      const pos = isometricSvgElem.getCoordMouse({ event });
      const offset = pos.sub(this.offset);

      this.moveSvgObj({ svg, offset });
    }

    this.offset = isometricSvgElem.getCoordMouse({ event });
  };

  onmouseup = (event) => {
    this.isDown = false;
    this.isMove = false;
  };

  detectModeDown({ event }) {
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

  // получем массив координат точек у линий принадлежащие одной group
  getPointsFromLines({ group, format = 'v2' }) {
    const points = [];

    group.childNodes.forEach((child) => {
      const pos = isometricSvgElem.getPosLine2(child);

      if (format === 'v2') {
        points.push(pos[0]);
      } else {
        points.push(new THREE.Vector3(pos[0].x, 0, pos[0].y));
      }
    });

    const svgLine = group.childNodes[group.childNodes.length - 1];
    const pos = isometricSvgElem.getPosLine2(svgLine);

    if (format === 'v2') {
      points.push(pos[1]);
    } else {
      points.push(new THREE.Vector3(pos[1].x, 0, pos[1].y));
    }

    return points;
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

  moveSvgObj({ svg, offset }) {
    const elems = this.getElemsFromGroup({ svg });

    elems.forEach((elem) => {
      this.svgOffset({ svg: elem, offsetX: offset.x, offsetY: offset.y });
    });
  }

  svgOffset({ svg, offsetX, offsetY }) {
    const type = isometricSvgElem.getSvgType(svg);
    if (type === 'line') {
      isometricSvgElem.setOffsetLine2(svg, offsetX, offsetY, true);
    }
    if (type === 'circle') {
      isometricSvgElem.setOffsetCircle(svg, offsetX, offsetY);
    }
    if (type === 'ellipse') {
      isometricSvgElem.setOffsetEllipse(svg, offsetX, offsetY);
    }
    if (type === 'polygon') {
      isometricSvgElem.setOffsetPolygon1(svg, offsetX, offsetY);
    }
    if (type === 'text') {
      isometricSvgElem.setOffsetText1(svg, offsetX, offsetY);
    }
    if (type === 'g') {
      svg.childNodes.forEach((svgChild) => {
        this.svgOffset({ svg: svgChild, offsetX, offsetY });
      });
    }
  }

  // получаем все объекты в group
  getElemsFromGroup({ svg }) {
    const elems = [];

    svg.childNodes.forEach((elem) => {
      elems.push(elem);
    });

    return elems;
  }

  // выделяем и активируем svg
  actElem(svg, act = false) {
    this.setColorElem(svg, act);

    if (act) {
      this.selectedObj.el = svg;
      this.selectedObj.mode = 'clickSelect';
    } else {
      this.cleareSelectedObj();
      this.cleareMouse();
    }
  }

  // назначаем цвет svg
  setColorElem(svg, act = false) {
    const elems = this.getElemsFromGroup({ svg });

    const stroke = !act ? 'rgb(0, 0, 0)' : '#ff0000';

    elems.forEach((elem) => {
      elem.setAttribute('stroke', stroke);
    });
  }

  clickFinishForm() {
    this.cleareMouse();
    this.cleareSelectedObj();
  }

  clickRightButton() {
    this.cleareMouse();
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

  // удялем group из все элементы
  deleteElemsFromGroup({ group }) {
    for (let i = group.childNodes.length - 1; i >= 0; i--) {
      group.childNodes[i].remove();
    }
  }

  cleareMouse() {
    this.isDown = false;
    this.isMove = false;
  }

  cleareSelectedObj() {
    this.selectedObj.el = null;
    this.selectedObj.mode = '';
  }

  // удаляем по клавише delete
  deleteObj(svg = null) {
    if (!svg) {
      if (!this.selectedObj.el) return;
      svg = this.selectedObj.el;
    }

    svg.remove();

    this.cleareSelectedObj();
    this.cleareMouse();
  }

  // обединить objs freeForm в одну группу (через SelectBox)
  appendGroup(arrFreeForm) {
    const elems = [];
    arrFreeForm.forEach((group) => {
      group.childNodes.forEach((elem) => {
        elems.push(elem);
      });
    });

    const g = this.createGroup();
    this.groupObjs.append(g);

    elems.forEach((elem) => {
      g.append(elem);
    });

    arrFreeForm.forEach((group) => {
      group.remove();
    });
  }
}
