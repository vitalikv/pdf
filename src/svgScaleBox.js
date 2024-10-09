import * as THREE from 'three';

import { isometricSvgElem, isometricMath } from './index';

export class IsometricSvgScaleBox {
  containerSvg;
  groupObjs;
  toolScale = null;
  selectedObj = { el: null, type: '' };
  isDown = false;
  isMove = false;
  offset = new THREE.Vector2();

  init({ containerSvg }) {
    this.containerSvg = containerSvg;
    this.groupObjs = isometricSvgElem.getSvgGroup({ tag: 'objs' });
  }

  initSvgScaleBox({ svg }) {
    this.toolScale = this.createSvgScaleBox({ svg });
  }

  createSvgScaleBox({ svg }) {
    const bound = svg.getBoundingClientRect();

    const gScaleBox = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gScaleBox.setAttribute('fill', 'none');
    gScaleBox['userData'] = { gScaleBox: true, svg, bound, lines: [], points: [] };
    this.groupObjs.append(gScaleBox);

    const boundContainer = this.containerSvg.getBoundingClientRect();
    const startOffset = new THREE.Vector2(boundContainer.left, boundContainer.top);

    const pLeftTop = new THREE.Vector2(bound.x - startOffset.x, bound.y - startOffset.y);
    const pRightTop = new THREE.Vector2(bound.x + bound.width - startOffset.x, bound.y - startOffset.y);
    const pLeftBottom = new THREE.Vector2(bound.x - startOffset.x, bound.y + bound.height - startOffset.y);
    const pRightBottom = new THREE.Vector2(bound.x + bound.width - startOffset.x, bound.y + bound.height - startOffset.y);

    const svgLines = [];
    svgLines[0] = isometricSvgElem.createSvgLine({ x1: pLeftTop.x, y1: pLeftTop.y, x2: pRightTop.x, y2: pLeftTop.y, stroke: '#ff0000', dasharray: '5,5' });
    svgLines[1] = isometricSvgElem.createSvgLine({ x1: pRightTop.x, y1: pRightTop.y, x2: pRightBottom.x, y2: pRightBottom.y, stroke: '#ff0000', dasharray: '5,5' });
    svgLines[2] = isometricSvgElem.createSvgLine({ x1: pRightBottom.x, y1: pRightBottom.y, x2: pLeftBottom.x, y2: pLeftBottom.y, stroke: '#ff0000', dasharray: '5,5' });
    svgLines[3] = isometricSvgElem.createSvgLine({ x1: pLeftBottom.x, y1: pLeftBottom.y, x2: pLeftTop.x, y2: pLeftTop.y, stroke: '#ff0000', dasharray: '5,5' });

    svgLines.forEach((elem) => {
      gScaleBox.append(elem);
    });

    let points = '';
    for (let i = 0; i < svgLines.length; i++) {
      const pos = isometricSvgElem.getPosLine2(svgLines[i]);
      points += pos[0].x + ',' + pos[0].y + ' ';
    }
    const svgPolygon = isometricSvgElem.createPolygon({ x: 0, y: 0, points, fill: 'rgb(0, 0, 0, 0.2)', stroke: 'none' });
    gScaleBox.append(svgPolygon);

    const svgPoints = [];
    for (let i = 0; i < svgLines.length; i++) {
      const pos = isometricSvgElem.getPosLine2(svgLines[i]);

      svgPoints[i] = isometricSvgElem.createSvgCircle({ x: pos[0].x, y: pos[0].y, stroke: '#ff0000', fill: '#ffffff' });
      svgPoints[i]['userData'] = { pointScalePlan: true, id: i };
      gScaleBox.append(svgPoints[i]);
    }

    gScaleBox['userData'].lines = svgLines;
    gScaleBox['userData'].polygon = svgPolygon;
    gScaleBox['userData'].points = svgPoints;

    return gScaleBox;
  }

  onmousedown = (event) => {
    if (!this.toolScale) return;
    this.clearMouse();

    this.toolScale['userData'].points.forEach((svg) => {
      if (svg.contains(event.target)) {
        this.isDown = true;
        this.selectedObj.el = svg;
        this.selectedObj.type = 'movePoint';
      }
    });

    if (this.toolScale['userData'].polygon.contains(event.target)) {
      this.isDown = true;
      this.selectedObj.el = this.toolScale['userData'].polygon;
      this.selectedObj.type = 'movePolygon';
    }

    this.offset = this.getCoord(event);

    return this.isDown;
  };

  onmousemove = (event) => {
    if (!this.isDown) return;

    if (!this.isMove) {
    }

    const svg = this.selectedObj.el;
    const pos = this.getCoord(event);
    const offset = pos.sub(this.offset);

    if (this.selectedObj.type === 'movePoint') {
      this.movePoint({ svg, offset });
    }

    if (this.selectedObj.type === 'movePolygon') {
      this.movePolygon({ svg, offset });
    }

    this.offset = this.getCoord(event);
  };

  onmouseup = (event) => {
    this.clearMouse();
    this.clearSelectedObj();
  };

  movePoint({ svg, offset }) {
    this.svgOffset({ svg, offsetX: offset.x, offsetY: offset.y });
    this.upShape();
    this.upScale();
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

  // изменение формы при перетаскивании точки
  upShape() {
    const svgPoint = this.selectedObj.el;

    const ind = svgPoint['userData'].id;
    const elems = this.toolScale['userData'].points;

    const pos = isometricSvgElem.getPosCircle(svgPoint);

    if (ind === 0) {
      elems[1].setAttribute('cy', pos.y);
      elems[3].setAttribute('cx', pos.x);
    }

    if (ind === 1) {
      elems[2].setAttribute('cx', pos.x);
      elems[0].setAttribute('cy', pos.y);
    }

    if (ind === 2) {
      elems[1].setAttribute('cx', pos.x);
      elems[3].setAttribute('cy', pos.y);
    }

    if (ind === 3) {
      elems[0].setAttribute('cx', pos.x);
      elems[2].setAttribute('cy', pos.y);
    }

    const lines = [this.toolScale['userData'].lines[this.toolScale['userData'].lines.length - 1], ...this.toolScale['userData'].lines];
    for (let i = 0; i < lines.length - 1; i++) {
      const elem1 = lines[i];
      const elem2 = lines[i + 1];
      const svgPoint = this.toolScale['userData'].points[i];

      const pos = isometricSvgElem.getPosCircle(svgPoint);

      isometricSvgElem.setPosLine2({ svg: elem1, x2: pos.x, y2: pos.y });
      isometricSvgElem.setPosLine2({ svg: elem2, x1: pos.x, y1: pos.y });
    }

    let points = '';
    for (let i = 0; i < this.toolScale['userData'].lines.length; i++) {
      const pos = isometricSvgElem.getPosLine2(this.toolScale['userData'].lines[i]);
      points += pos[0].x + ',' + pos[0].y + ' ';
    }

    const polygon = this.toolScale['userData'].polygon;
    polygon.setAttribute('points', points);
    polygon.setAttribute('transform', `translate(0, 0) rotate(0)`);
  }

  // меняем масштаб загруженной svg
  upScale() {
    if (!this.toolScale) return;

    const svg = this.toolScale['userData'].svg;
    const boundDef = this.toolScale['userData'].bound;
    const boundAct = this.toolScale.getBoundingClientRect();

    const scaleX = boundAct.width / boundDef.width;
    const scaleY = boundAct.height / boundDef.height;

    const boundContainer = this.containerSvg.getBoundingClientRect();
    const startOffset = new THREE.Vector2(boundContainer.left, boundContainer.top);
    const offsetX = boundAct.x - startOffset.x;
    const offsetY = boundAct.y - startOffset.y;

    svg.setAttribute('transform', `matrix(${scaleX},0,0,${scaleY},${offsetX},${offsetY})`);
  }

  // перетаскиваем ScaleBox
  movePolygon({ svg, offset }) {
    const g = svg.closest('g');

    g.childNodes.forEach((svgChild) => {
      this.svgOffset({ svg: svgChild, offsetX: offset.x, offsetY: offset.y });
    });

    const boundDef = this.toolScale['userData'].bound;
    const boundAct = this.toolScale.getBoundingClientRect();
    const scaleX = boundAct.width / boundDef.width;
    const scaleY = boundAct.height / boundDef.height;

    const boundContainer = this.containerSvg.getBoundingClientRect();
    const startOffset = new THREE.Vector2(boundContainer.left, boundContainer.top);
    const offsetX = boundAct.x - startOffset.x;
    const offsetY = boundAct.y - startOffset.y;

    this.toolScale['userData'].svg.setAttribute('transform', `matrix(${scaleX},0,0,${scaleY},${offsetX + offset.x},${offsetY + offset.y})`);
  }

  getCoord(event) {
    const pos = isometricSvgElem.getCoordMouse({ event, container: this.containerSvg });

    return pos;
  }

  clearMouse() {
    this.isDown = false;
    this.isMove = false;
  }

  clearSelectedObj() {
    this.selectedObj.el = null;
    this.selectedObj.type = '';
  }
}
