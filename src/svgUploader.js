import * as THREE from 'three';

import { isometricSvgElem, isometricMath } from './index';

export class IsometricSvgUploader {
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

  parseSvg({ file }) {
    const oDOM = new DOMParser().parseFromString(file, 'image/svg+xml');
    const svg = oDOM.documentElement;

    const elems = this.getElemsFromGroup({ svg });
    const g = this.createGroup({ tag: '', guid: 0 });

    elems.forEach((elem) => {
      g.append(elem);
      elem.setAttribute('transform', `translate(0, 0) rotate(0)`);
    });

    this.groupObjs.append(g);

    this.toolScale = this.getBoundSvg({ svg: g });
  }

  createGroup({ tag = '', guid = 0 }) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('fill', 'none');
    g['userData'] = { freeForm: true, tag, guid };

    return g;
  }

  getElemsFromGroup({ svg }) {
    const elems = [];

    svg.childNodes.forEach((elem) => {
      if (this.isSvg({ elem })) elems.push(elem);
      //if (elem.tagName) elems.push(elem);
    });

    return elems;
  }

  isSvg({ elem }) {
    let isSvg = false;

    const type = isometricSvgElem.getSvgType(elem);
    const types = ['g', 'line', 'circle', 'ellipse', 'polygon', 'path', 'text', 'rect', 'defs'];

    for (let i = 0; i < types.length; i++) {
      if (type === types[i]) {
        isSvg = true;
        break;
      }
    }

    return isSvg;
  }

  getBoundSvg({ svg }) {
    const boundContainer = this.containerSvg.getBoundingClientRect();
    const startOffset = new THREE.Vector2(boundContainer.left, boundContainer.top);

    const bound = svg.getBoundingClientRect();

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
      this.groupObjs.append(elem);
    });

    const svgPoints = [];
    for (let i = 0; i < svgLines.length; i++) {
      const pos = isometricSvgElem.getPosLine2(svgLines[i]);

      svgPoints[i] = isometricSvgElem.createSvgCircle({ x: pos[0].x, y: pos[0].y, stroke: '#ff0000', fill: '#ffffff' });
      svgPoints[i]['userData'] = { pointScalePlan: true, id: i };
      this.groupObjs.append(svgPoints[i]);
    }

    return { svgLines, svgPoints };
  }

  onmousedown = (event) => {
    if (!this.toolScale) return;
    this.clearMouse();

    this.toolScale.svgPoints.forEach((svg) => {
      if (svg.contains(event.target)) {
        this.isDown = true;
        this.selectedObj.el = svg;
        this.selectedObj.type = 'movePoint';
      }
    });

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

    this.offset = this.getCoord(event);
  };

  onmouseup = (event) => {
    if (!this.isMove && this.selectedObj.type === 'create') {
      //this.deleteObj();
    }

    this.clearMouse();
    this.clearSelectedObj();
  };

  movePoint({ svg, offset }) {
    this.svgOffset({ svg, offsetX: offset.x, offsetY: offset.y });
    this.upShape();
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
    const elems = this.toolScale.svgPoints;

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

    const lines = [this.toolScale.svgLines[this.toolScale.svgLines.length - 1], ...this.toolScale.svgLines];
    for (let i = 0; i < lines.length - 1; i++) {
      const elem1 = lines[i];
      const elem2 = lines[i + 1];
      const svgPoint = this.toolScale.svgPoints[i];

      const pos = isometricSvgElem.getPosCircle(svgPoint);

      isometricSvgElem.setPosLine2({ svg: elem1, x2: pos.x, y2: pos.y });
      isometricSvgElem.setPosLine2({ svg: elem2, x1: pos.x, y1: pos.y });
    }
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
    this.selectedObj.mode = '';
  }
}
