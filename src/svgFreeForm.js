import * as THREE from 'three';

import { isometricSvgElem, isometricMath } from './index';

export class IsometricSvgFreeForm {
  groupObjs;
  toolPoint = null;
  isDown = false;
  isMove = false;
  offset = new THREE.Vector2();
  selectedObj = { el: null, mode: '' };
  handlePoints = [];
  cloneSvg = null;
  divModal = null;

  init({ containerSvg }) {
    this.groupObjs = isometricSvgElem.getSvgGroup({ container: containerSvg, tag: 'objs' });
  }

  createToolPoint() {
    let x = -999999;
    let y = -999999;

    this.toolPoint = isometricSvgElem.createSvgCircle({ x, y, stroke: '#ff0000' });
    this.groupObjs.append(this.toolPoint);
  }

  createGroup({ tag = '', guid = 0 }) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g['userData'] = { freeForm: true, tag, guid };

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

        this.createHandlePoints(svg);

        if (mode === 'clickRight') {
          this.divModal = this.createModalDiv({ event, svg });
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

      if (this.selectedObj.mode === 'clickPoint') {
        //this.moveSvgHandlePoint({ svg, offset });
        const svg = this.selectedObj.el;
        this.svgOffset({ svg, offsetX: offset.x, offsetY: offset.y });
      } else {
        const svg = this.selectedObj.el;
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

  // создание меню, при клики правой кнопкой
  createModalDiv({ event, svg }) {
    const containerSvg = isometricSvgElem.getContainerSvg();
    const bound = containerSvg.getBoundingClientRect();
    const x = -bound.x + event.clientX;
    const y = -bound.y + event.clientY;

    let div = document.createElement('div');
    div.innerHTML = `
    <div style="position: absolute; left: 30px; font-family: Gostcadkk; font-size: 18px; z-index: 5; box-sizing: border-box; background: #F0F0F0; border: 1px solid #D1D1D1;">
      <div nameId="content" style="display: flex; flex-direction: column;">
        <div style="margin: 10px auto;">Свойства</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px;">
          <div style="margin-right: 10px;">Tag</div>
          <input type="text" nameId="inputTag" style="width: 100px; height: 25px; border: 1px solid #D1D1D1; outline: none;">
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px;">
          <div style="margin-right: 10px;">Guid</div>
          <input type="text" nameId="inputGuid" style="width: 100px; height: 25px; border: 1px solid #D1D1D1; outline: none;">
        </div>
        
        <div nameId="btnSave" style="display: flex; justify-content: center; align-items: center; padding: 5px 0; margin: 10px; font-size: 18px; color: #666; background: #fff; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; user-select: none;">
          <div>сохранить</div>
        </div>
      </div>
    </div>`;

    let divModal = div.children[0];

    const containerTexts = containerSvg.querySelector('[nameId="notesText"]');
    containerTexts.append(divModal);

    const inputTag = divModal.querySelector('[nameId="inputTag"]');
    const inputGuid = divModal.querySelector('[nameId="inputGuid"]');
    const btnSave = divModal.querySelector('[nameId="btnSave"]');

    const bound2 = divModal.getBoundingClientRect();
    divModal['style'].left = x + 'px';
    divModal['style'].top = y + 'px';

    inputTag['value'] = svg['userData'].tag;
    inputGuid['value'] = svg['userData'].guid;

    btnSave['onmousedown'] = (e) => {
      svg['userData'].tag = inputTag['value'];
      svg['userData'].guid = inputGuid['value'];
      this.deleteModalDiv();
    };

    divModal['onmousedown'] = (e) => {
      e.stopPropagation();
    };

    return divModal;
  }

  deleteModalDiv() {
    if (!this.divModal) return;

    this.divModal.remove();
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
    const points = this.getPointsFromAllGroups({ svg });

    for (let i = 0; i < points.length; i++) {
      const svgP = isometricSvgElem.createSvgCircle({ x: points[i].x, y: points[i].y, r: '3.2', fill: '#ffffff', display: '' });
      svgP['userData'] = { freeFormPoint: true, svgObj: null };

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

  cloneSave() {
    if (!this.selectedObj.el) return;
    const svg = this.selectedObj.el;
    if (!svg['userData'].freeForm) return;

    this.cloneSvg = svg.cloneNode(true);
  }

  clonePaste() {
    if (!this.cloneSvg) return;

    this.groupObjs.append(this.cloneSvg);
    this.cloneSvg['userData'] = { freeForm: true, tag: '', guid: 0 };

    this.cloneSvg = null;
  }
}
