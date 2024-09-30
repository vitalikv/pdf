import * as THREE from 'three';

import { isometricSvgElem, isometricMath, isometricActiveElement, isometricSvgElementAttributes } from './index';

export class IsometricSvgFreeForm {
  groupObjs;
  toolPoint = null;
  isDown = false;
  isMove = false;
  offset = new THREE.Vector2();
  selectedObj = { el: null, mode: '' };
  handlePoints = [];
  cloneSvg = null;

  init({ containerSvg }) {
    this.groupObjs = isometricSvgElem.getSvgGroup({ container: containerSvg, tag: 'objs' });
  }

  createToolPoint() {
    let x = -999999;
    let y = -999999;

    this.toolPoint = isometricSvgElem.createSvgCircle({ x, y, stroke: '#ff0000' });
    this.groupObjs.append(this.toolPoint);
  }

  createGroup({ attributes = { guid: '0' } }) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g['userData'] = { freeForm: true, attributes };

    return g;
  }

  createLine({ pos, group = null }) {
    const svg = isometricSvgElem.createSvgLine({ x1: pos[0].x, y1: pos[0].y, x2: pos[1].x, y2: pos[1].y });

    if (!group) group = this.createGroup({});

    group.append(svg);

    this.groupObjs.append(group);

    return svg;
  }

  createPolygon({ data, group = null }) {
    const pos = data.pos;
    const points = data.points;

    const svg = isometricSvgElem.createPolygon({ x: pos.x, y: pos.y, points, fill: 'none' });

    if (!group) group = this.createGroup({});

    group.append(svg);

    this.groupObjs.append(group);

    return svg;
  }

  onmousedown = ({ event = null, svg = null }) => {
    const mode = this.detectModeDown({ event });

    if (!svg) {
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

    // кликнули на уже существующий
    if (svg) {
      if (svg['userData'].freeFormPoint) {
        this.selectedObj.mode = 'clickPoint';
        this.selectedObj.el = svg;
      } else {
        if (this.selectedObj.el) this.actElem(this.selectedObj.el, false);
        this.actElem(svg, true);

        const guid = this.getGuidFromElement(svg);
        isometricActiveElement.selectElementByGuid(guid);

        this.createHandlePoints(svg);

        if (mode === 'clickRight') {
          const attr = this.getAttributes(svg);
          isometricSvgElementAttributes.getAttributes({ event, svg, attr });

          this.cleareMouse();
          return false;
        }

        this.selectedObj.mode = 'clickForm';

        this.offset = isometricSvgElem.getCoordMouse({ event });
      }

      this.isDown = true;
      this.isMove = false;
    }

    return this.isDown;
  };

  onmousemove = (event) => {
    if (!this.toolPoint && !this.selectedObj.el) return;

    if (this.isDown && !this.isMove) {
      this.isMove = true;
      if (this.selectedObj.mode !== 'clickPoint') this.deleteHandlePoints();
    }

    // создаем новый элемент
    if (!this.isDown) {
      const mode = this.detectModeMove();

      const pos = isometricSvgElem.getCoordMouse({ event });

      if (mode === 'moveToolPoint') {
        isometricSvgElem.setPosCircle(this.toolPoint, pos.x, pos.y);
      }

      if (mode === 'createLineMove') {
        const svg = this.selectedObj.el;
        isometricSvgElem.setPosLine2({ svg, x2: pos.x, y2: pos.y });

        let points = this.getPointsFromAllGroups({ svg: this.groupObjs });
        for (let i = 0; i < points.length; i++) {
          points[i] = new THREE.Vector3(points[i].x, 0, points[i].y);
        }

        const newPos = this.pointAligning({ point: points[points.length - 1], points });
        isometricSvgElem.setPosLine2({ svg, x2: newPos.x, y2: newPos.y });
      }
    }

    // перетаскиваем готовый элемент
    if (this.isDown) {
      const pos = isometricSvgElem.getCoordMouse({ event });
      const offset = pos.sub(this.offset);
      const svg = this.selectedObj.el;

      // перетаскиваем точку
      if (this.selectedObj.mode === 'clickPoint') {
        this.moveSvgHandlePoint({ svg, offset });
      } else {
        // перетаскиваем объект
        this.moveSvgObj({ svg, offset });
      }
    }

    this.offset = isometricSvgElem.getCoordMouse({ event });
  };

  onmouseup = (event) => {
    if (this.isMove && this.selectedObj.mode === 'clickForm' && this.selectedObj.el) {
      this.createHandlePoints(this.selectedObj.el);
    }

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

  deleteModalDiv() {
    const containerSvg = isometricSvgElem.getContainerSvg();
    const containerTexts = containerSvg.querySelector('[nameId="notesText"]');
    const divModal = containerTexts.querySelector('[nameId="modalWindAttr"]');

    if (!divModal) return;

    divModal.remove();
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

  // получем массив всех точек (line, polygon)
  getPointsFromAllGroups({ svg, points = [] }) {
    const type = isometricSvgElem.getSvgType(svg);

    if (type === 'line') {
      const pos = isometricSvgElem.getPosLine2(svg);
      points.push(...pos);
    }
    if (type === 'polygon') {
      const str = svg.getAttribute('points');
      const strPos = str.split(' ');

      const x = svg.transform.baseVal[0].matrix.e;
      const y = svg.transform.baseVal[0].matrix.f;

      strPos.forEach((item) => {
        if (item !== '') {
          const pos = item.split(',');
          points.push(new THREE.Vector2(Number(pos[0]) + x, Number(pos[1]) + y));
        }
      });
    }
    if (type === 'g') {
      svg.childNodes.forEach((svgChild) => {
        this.getPointsFromAllGroups({ svg: svgChild, points });
      });
    }

    return points;
  }

  // получем массив уникальных точек точек (line, polygon), с привязкой к объекту
  getUniquePointsFromObj({ svg, points = [], uniquePos = true }) {
    const type = isometricSvgElem.getSvgType(svg);

    if (type === 'line') {
      const pos = isometricSvgElem.getPosLine2(svg);
      points.push({ data: { svg, id: 0 }, pos: pos[0] });
      points.push({ data: { svg, id: 1 }, pos: pos[1] });
    }
    if (type === 'polygon') {
      const str = svg.getAttribute('points');
      const strPos = str.split(' ');

      const x = svg.transform.baseVal[0].matrix.e;
      const y = svg.transform.baseVal[0].matrix.f;

      let num = 0;
      strPos.forEach((item) => {
        if (item !== '') {
          const pos = item.split(',');
          points.push({ data: { svg, id: num }, pos: new THREE.Vector2(Number(pos[0]) + x, Number(pos[1]) + y) });
          num++;
        }
      });
    }
    if (type === 'g') {
      svg.childNodes.forEach((svgChild) => {
        this.getUniquePointsFromObj({ svg: svgChild, points, uniquePos: false });
      });
    }

    if (uniquePos) {
      let arr = [];

      for (let i = 0; i < points.length; i++) {
        let ind = -1;
        const point = points[i];

        for (let i2 = 0; i2 < arr.length; i2++) {
          if (point.pos.length() === arr[i2].pos.length()) {
            ind = i2;
            break;
          }
        }

        if (ind === -1) {
          arr.push({ data: [point.data], pos: point.pos });
        } else {
          arr[ind].data.push(point.data);
        }
      }

      points = arr;
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

  moveSvgHandlePoint({ svg, offset }) {
    this.svgOffset({ svg, offsetX: offset.x, offsetY: offset.y });

    let pos = isometricSvgElem.getPosCircle(svg);

    // let points = this.getPointsFromAllGroups({ svg: this.groupObjs });
    // for (let i = 0; i < points.length; i++) {
    //   points[i] = new THREE.Vector3(points[i].x, 0, points[i].y);
    // }
    // pos = this.pointAligning({ point: new THREE.Vector3(pos.x, 0, pos.y), points });
    // isometricSvgElem.setPosCircle(svg, pos.x, pos.y);

    // меняем форму элемента после смещение точки
    svg['userData'].data.forEach((item) => {
      const type = isometricSvgElem.getSvgType(item.svg);

      if (type === 'line') {
        if (item.id === 0) isometricSvgElem.setPosLine2({ svg: item.svg, x1: pos.x, y1: pos.y });
        if (item.id === 1) isometricSvgElem.setPosLine2({ svg: item.svg, x2: pos.x, y2: pos.y });
      }

      if (type === 'polygon') {
        const str = item.svg.getAttribute('points');
        const strPos = str.split(' ');

        const points = [];

        strPos.forEach((item) => {
          if (item !== '') {
            const pos = item.split(',');
            points.push(new THREE.Vector2(Number(pos[0]), Number(pos[1])));
          }
        });

        let strPoints = '';
        points[item.id] = pos;
        for (let i = 0; i < points.length; i++) {
          strPoints += points[i].x + ',' + points[i].y;
          if (i < points.length - 1) strPoints += ' ';
        }

        item.svg.setAttribute('points', strPoints);
      }
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
    if (type === 'path') {
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

  getSelectedSvg() {
    if (!this.selectedObj.el) return null;

    return this.selectedObj.el;
  }

  // получаем все объекты в group
  getElemsFromGroup({ svg }) {
    const elems = [];

    svg.childNodes.forEach((elem) => {
      elems.push(elem);
    });

    return elems;
  }

  // создание точек для редактирование формы
  createHandlePoints(svg) {
    const points = this.getUniquePointsFromObj({ svg });

    for (let i = 0; i < points.length; i++) {
      const svgP = isometricSvgElem.createSvgCircle({ x: points[i].pos.x, y: points[i].pos.y, r: '3.2', fill: '#ffffff', display: '' });
      svgP['userData'] = { freeFormPoint: true, data: points[i].data };

      this.groupObjs.append(svgP);

      this.handlePoints.push(svgP);
    }
  }

  deleteHandlePoints() {
    this.handlePoints.forEach((elem) => {
      elem.remove();
    });

    this.handlePoints = [];
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
      this.deleteHandlePoints();
    }
  }

  // назначаем цвет svg
  setColorElem(svg, act = false) {
    if (svg['userData'].freeFormPoint) {
      if (svg['userData'].data.length > 0) {
        svg = svg['userData'].data[0].svg.parentNode;
      }
    }
    const elems = this.getElemsFromGroup({ svg });

    const stroke = !act ? 'rgb(0, 0, 0)' : '#ff0000';

    elems.forEach((elem) => {
      elem.setAttribute('stroke', stroke);
    });
  }

  // получение guid по клику на объект
  getGuidFromElement(svg) {
    let guid = '';

    const type = isometricSvgElem.getSvgType(svg);
    if (type === 'g') {
      const attr = this.getAttributes(svg);
      if (attr['guid']) guid = attr['guid'];
    }

    return guid;
  }

  // получение attr по клику на объект
  getAttributes(svg) {
    let attr = {};

    const type = isometricSvgElem.getSvgType(svg);
    if (type === 'g') {
      attr = svg['userData'].attributes;
    }

    return attr;
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

    this.actElem(svg, false);

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

    const g = this.createGroup({});
    this.groupObjs.append(g);

    elems.forEach((elem) => {
      g.append(elem);
    });

    arrFreeForm.forEach((group) => {
      group.remove();
    });
  }

  // копирование в память элемента
  cloneSave() {
    if (!this.selectedObj.el) return;
    const svg = this.selectedObj.el;
    if (!svg['userData'].freeForm) return;

    this.cloneSvg = svg.cloneNode(true);

    this.cloneSvg['userData'] = svg['userData'];
  }

  // вставка скопрированного элемента из памяти
  clonePaste() {
    if (!this.cloneSvg) return;

    this.groupObjs.append(this.cloneSvg);

    this.cloneSvg = null;
  }
}
