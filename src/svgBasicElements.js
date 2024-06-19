import * as THREE from 'three';

import { isometricSvgElem, isometricMath, isometricSvgUndoRedo } from './index';

export class IsometricSvgBasicElements {
  container;
  containerSvg;
  groupBasicElems = null;
  isDown = false;
  isMove = false;
  offset = new THREE.Vector2();
  selectedObj = { el: null, type: '' };
  handlePoints = [];

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
    this.groupBasicElems = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'basicElems' });

    this.createHandlePoints();
  }

  createHandlePoints() {
    const arrSvg = [];

    for (let i = 0; i < 4; i++) {
      const svg = isometricSvgElem.createSvgCircle({ x: -999999, y: -999999, r: '4.2', fill: '#ffffff', display: 'none' });
      arrSvg.push(svg);
    }

    arrSvg.forEach((svg, id) => {
      svg['userData'] = { handlePoint: true, id, elems: arrSvg, svgObj: null };
    });

    arrSvg.forEach((svg) => {
      this.groupBasicElems.append(svg);
    });

    this.handlePoints = arrSvg;
  }

  createArrow({ pos }) {
    const x1 = pos.x;
    const y1 = pos.y;
    const x2 = x1;
    const y2 = y1;
    const svg1 = isometricSvgElem.createSvgLine({ x1, y1, x2, y2 });
    const svg2 = isometricSvgElem.createPolygon({ x: x1, y: y1, points: '0,0 20,5 20,-5' });

    svg1['userData'] = { objBasic: true, tagObj: 'arrow', elems: [svg1, svg2] };
    svg2['userData'] = { objBasic: true, tagObj: 'arrow', elems: [svg1, svg2] };

    this.groupBasicElems.append(svg1);
    this.groupBasicElems.append(svg2);

    return svg1;
  }

  createRectangle({ pos }) {
    const arrSvg = [];
    arrSvg[0] = isometricSvgElem.createSvgLine({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
    arrSvg[1] = isometricSvgElem.createSvgLine({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
    arrSvg[2] = isometricSvgElem.createSvgLine({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
    arrSvg[3] = isometricSvgElem.createSvgLine({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });

    arrSvg.forEach((svg, ind) => {
      svg['userData'] = { objBasic: true, ind, tagObj: 'rectangle', elems: arrSvg };
    });

    arrSvg.forEach((svg) => {
      this.groupBasicElems.append(svg);
    });

    return arrSvg[0];
  }

  createEllipse({ pos }) {
    const svg1 = isometricSvgElem.createSvgEllipse({ x: pos.x, y: pos.y, rx: '0', ry: '0', strokeWidth: '2.5px', fill: 'none' });
    svg1['userData'] = { objBasic: true, tagObj: 'ellipse', elems: [svg1] };

    this.groupBasicElems.append(svg1);

    return svg1;
  }

  createTriangle({ pos }) {
    const arrSvg = [];
    arrSvg[0] = isometricSvgElem.createSvgLine({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
    arrSvg[1] = isometricSvgElem.createSvgLine({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });
    arrSvg[2] = isometricSvgElem.createSvgLine({ x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y });

    arrSvg.forEach((svg, ind) => {
      svg['userData'] = { objBasic: true, ind, tagObj: 'triangle', elems: arrSvg };
    });

    arrSvg.forEach((svg) => {
      this.groupBasicElems.append(svg);
    });

    return arrSvg[0];
  }

  getCoord(event) {
    const pos = isometricSvgElem.getCoordMouse({ event, container: this.containerSvg });

    return pos;
  }

  addShape({ event = null, pos = null, type }) {
    this.clearSelectedObj();

    if (event) pos = this.getCoord(event);
    if (!pos) return;

    let elem = null;

    if (type === 'shapeArrow') {
      elem = this.createArrow({ pos });
    }

    if (type === 'shapeRectangle') {
      elem = this.createRectangle({ pos });
    }

    if (type === 'shapeEllipse') {
      elem = this.createEllipse({ pos });
    }

    if (type === 'shapeTriangle') {
      elem = this.createTriangle({ pos });
    }

    if (event) {
      this.selectedObj.el = elem;
      this.selectedObj.type = 'create';
      this.onmousedown(event);
    }
  }

  onmousedown = (event) => {
    this.clearMouse();

    if (this.selectedObj.type === '') {
      this.groupBasicElems.childNodes.forEach((svg) => {
        if (svg.contains(event.target)) {
          this.isDown = true;

          this.actElem(svg, true);
        }
      });
    } else if (this.selectedObj.type === 'create') {
      this.isDown = true;
      let svg = this.selectedObj.el;
      this.actElem(svg, true);
      this.selectedObj.el = this.handlePoints[0];
      this.selectedObj.type = 'create';
    }

    this.offset = this.getCoord(event);

    return this.isDown;
  };

  onmousemove = (event) => {
    if (!this.isDown) return;

    if (!this.isMove) {
      this.isMove = true;
    }

    const svg = this.selectedObj.el;
    let pos = this.getCoord(event);
    const offset = pos.sub(this.offset);

    if (this.selectedObj.type === 'moveShape') {
      this.moveShape({ svg, offset });
    }
    if (this.selectedObj.type === 'movePoint' || this.selectedObj.type === 'create') {
      this.movePoint({ svg, offset });
    }

    this.offset = this.getCoord(event);
  };

  onmouseup = (event) => {
    if (!this.isMove && this.selectedObj.type === 'create') {
      this.deleteObj();
    }

    this.clearMouse();
    this.selectedObj.type = '';
  };

  moveShape({ svg, offset }) {
    svg['userData'].elems.forEach((elem) => {
      this.svgOffset({ svg: elem, offsetX: offset.x, offsetY: offset.y });
    });

    this.handlePoints.forEach((elem) => {
      if (elem.getAttribute('display') !== 'none') {
        this.svgOffset({ svg: elem, offsetX: offset.x, offsetY: offset.y });
      }
    });
  }

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
      if (svg['userData'].svgObj['userData'].tagObj === 'triangle' && svg['userData'].id === 1) {
        isometricSvgElem.setOffsetCircle(svg, 0, offsetY);
      } else {
        isometricSvgElem.setOffsetCircle(svg, offsetX, offsetY);
      }
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
    const svg = svgPoint['userData'].svgObj;

    if (svg['userData'].tagObj === 'arrow') {
      const elem = svg['userData'].elems[0];
      const pos1 = isometricSvgElem.getPosCircle(this.handlePoints[0]);
      const pos2 = isometricSvgElem.getPosCircle(this.handlePoints[1]);

      isometricSvgElem.setPosLine2({ svg: elem, x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y });

      const rotate = true;
      if (rotate) {
        const dir = pos2.sub(pos1);

        const rotY = Math.atan2(dir.x, dir.y);
        const rotY1 = THREE.MathUtils.radToDeg(rotY - Math.PI / 2) * -1;

        const elem2 = svg['userData'].elems[1];
        isometricSvgElem.setRotPolygon1(elem2, rotY1);
        isometricSvgElem.setPosPolygon1(elem2, pos1.x, pos1.y);
      }
    }

    if (svg['userData'].tagObj === 'rectangle') {
      const ind = svgPoint['userData'].id;
      const elems = this.handlePoints;

      const pos = isometricSvgElem.getPosCircle(svgPoint);

      if (ind === 0) {
        elems[1].setAttribute('cx', pos.x);
        elems[3].setAttribute('cy', pos.y);
      }

      if (ind === 1) {
        elems[0].setAttribute('cx', pos.x);
        elems[2].setAttribute('cy', pos.y);
      }

      if (ind === 2) {
        elems[1].setAttribute('cy', pos.y);
        elems[3].setAttribute('cx', pos.x);
      }

      if (ind === 3) {
        elems[2].setAttribute('cx', pos.x);
        elems[0].setAttribute('cy', pos.y);
      }

      const lines = [svg['userData'].elems[svg['userData'].elems.length - 1], ...svg['userData'].elems];
      for (let i = 0; i < lines.length - 1; i++) {
        const elem1 = lines[i];
        const elem2 = lines[i + 1];
        const svgPoint = this.handlePoints[i];

        const pos = isometricSvgElem.getPosCircle(svgPoint);

        isometricSvgElem.setPosLine2({ svg: elem1, x2: pos.x, y2: pos.y });
        isometricSvgElem.setPosLine2({ svg: elem2, x1: pos.x, y1: pos.y });
      }
    }

    if (svg['userData'].tagObj === 'triangle') {
      const ind = svgPoint['userData'].id;
      const elems = this.handlePoints;

      const pos = isometricSvgElem.getPosCircle(svgPoint);

      if (ind === 0) {
        const x1 = (pos.x - elems[2].getAttribute('cx')) / 2;
        elems[1].setAttribute('cx', pos.x - x1);
        elems[2].setAttribute('cy', pos.y);
      }

      if (ind === 2) {
        const x1 = (pos.x - elems[0].getAttribute('cx')) / 2;
        elems[1].setAttribute('cx', pos.x - x1);
        elems[0].setAttribute('cy', pos.y);
      }

      const lines = [svg['userData'].elems[svg['userData'].elems.length - 1], ...svg['userData'].elems];
      for (let i = 0; i < lines.length - 1; i++) {
        const elem1 = lines[i];
        const elem2 = lines[i + 1];
        const svgPoint = this.handlePoints[i];

        const pos = isometricSvgElem.getPosCircle(svgPoint);

        isometricSvgElem.setPosLine2({ svg: elem1, x2: pos.x, y2: pos.y });
        isometricSvgElem.setPosLine2({ svg: elem2, x1: pos.x, y1: pos.y });
      }
    }

    if (svg['userData'].tagObj === 'ellipse') {
      const ind = svgPoint['userData'].id;
      const elems = this.handlePoints;

      const pos = isometricSvgElem.getPosCircle(svgPoint);

      if (ind === 0) {
        const y1 = pos.y - elems[3].getAttribute('cy');
        elems[2].setAttribute('cy', pos.y + y1);
        elems[1].setAttribute('cy', pos.y);

        const x1 = (elems[1].getAttribute('cx') - elems[0].getAttribute('cx')) / 2 + Number(elems[0].getAttribute('cx'));
        elems[2].setAttribute('cx', x1);
        elems[3].setAttribute('cx', x1);
      }

      if (ind === 1) {
        const y1 = pos.y - elems[3].getAttribute('cy');
        elems[2].setAttribute('cy', pos.y + y1);
        elems[0].setAttribute('cy', pos.y);

        const x1 = (elems[1].getAttribute('cx') - elems[0].getAttribute('cx')) / 2 + Number(elems[0].getAttribute('cx'));
        elems[2].setAttribute('cx', x1);
        elems[3].setAttribute('cx', x1);
      }

      if (ind === 2) {
        const x1 = pos.x - elems[0].getAttribute('cx');
        elems[1].setAttribute('cx', pos.x + x1);
        elems[3].setAttribute('cx', pos.x);

        const y1 = (elems[3].getAttribute('cy') - elems[2].getAttribute('cy')) / 2 + Number(elems[2].getAttribute('cy'));
        elems[0].setAttribute('cy', y1);
        elems[1].setAttribute('cy', y1);
      }

      if (ind === 3) {
        const x1 = pos.x - elems[0].getAttribute('cx');
        elems[1].setAttribute('cx', pos.x + x1);
        elems[2].setAttribute('cx', pos.x);

        const y1 = (elems[3].getAttribute('cy') - elems[2].getAttribute('cy')) / 2 + Number(elems[2].getAttribute('cy'));
        elems[0].setAttribute('cy', y1);
        elems[1].setAttribute('cy', y1);
      }

      const arrPos = [];
      for (let i = 0; i < elems.length; i++) {
        const svgPoint = elems[i];
        const pos = isometricSvgElem.getPosCircle(svgPoint);
        arrPos.push(pos);
      }

      const width = Math.abs(arrPos[0].x - arrPos[1].x) / 2;
      const height = Math.abs(arrPos[2].y - arrPos[3].y) / 2;

      svg.setAttribute('rx', width);
      svg.setAttribute('ry', height);
      svg.setAttribute('cx', (arrPos[0].x - arrPos[1].x) / 2 + arrPos[1].x);
      svg.setAttribute('cy', (arrPos[2].y - arrPos[3].y) / 2 + arrPos[3].y);
      //this.showHandlePoints(svg);
    }
  }

  showHandlePoints(svg) {
    if (svg['userData'].tagObj === 'arrow') {
      const elem = svg['userData'].elems[0];
      const pos = isometricSvgElem.getPosLine2(elem);

      for (let i = 0; i < pos.length; i++) {
        const svgPoint = this.handlePoints[i];

        isometricSvgElem.setPosCircle(svgPoint, pos[i].x, pos[i].y);

        svgPoint.setAttribute('display', '');
        svgPoint['userData'].svgObj = svg;
        this.groupBasicElems.append(svgPoint);
      }
    }

    if (svg['userData'].tagObj === 'ellipse') {
      const pos = isometricSvgElem.getPosCircle(svg);

      const width = Number(svg.getAttribute('rx'));
      const height = Number(svg.getAttribute('ry'));

      const arrPos = [];
      arrPos.push(new THREE.Vector2(pos.x - width, pos.y));
      arrPos.push(new THREE.Vector2(pos.x + width, pos.y));
      arrPos.push(new THREE.Vector2(pos.x, pos.y + height));
      arrPos.push(new THREE.Vector2(pos.x, pos.y - height));

      for (let i = 0; i < arrPos.length; i++) {
        const svgPoint = this.handlePoints[i];

        isometricSvgElem.setPosCircle(svgPoint, arrPos[i].x, arrPos[i].y);

        svgPoint.setAttribute('display', '');
        svgPoint['userData'].svgObj = svg;
        this.groupBasicElems.append(svgPoint);
      }
    }

    if (svg['userData'].tagObj === 'rectangle' || svg['userData'].tagObj === 'triangle') {
      for (let i = 0; i < svg['userData'].elems.length; i++) {
        const elem = svg['userData'].elems[i];
        const svgPoint = this.handlePoints[i];

        const pos = isometricSvgElem.getPosLine2(elem);
        isometricSvgElem.setPosCircle(svgPoint, pos[0].x, pos[0].y);

        svgPoint.setAttribute('display', '');
        svgPoint['userData'].svgObj = svg;
        this.groupBasicElems.append(svgPoint);
      }
    }
  }

  hideHandlePoints() {
    this.handlePoints.forEach((svgPoint) => {
      svgPoint.setAttribute('display', 'none');
      //svgPoint['userData'].svgObj = null;
    });
  }

  actElem(svg, act = false) {
    if (act) {
      if (svg['userData'].objBasic) {
        this.selectedObj.el = svg;
        this.selectedObj.type = 'moveShape';
        this.showHandlePoints(this.selectedObj.el);
      }
      if (svg['userData'].handlePoint) {
        this.selectedObj.el = svg;
        this.selectedObj.type = 'movePoint';
        this.showHandlePoints(svg['userData'].svgObj);
      }
    } else {
      this.clearSelectedObj();
      this.hideHandlePoints();
    }
  }

  clearMouse() {
    this.isDown = false;
    this.isMove = false;
  }

  clearSelectedObj() {
    this.selectedObj.el = null;
    this.selectedObj.type = '';
  }

  deleteObj(svg = null) {
    let elems = [];

    if (svg) {
      elems = svg['userData'].elems;
    } else {
      if (this.selectedObj.el['userData'].handlePoint) {
        svg = this.selectedObj.el['userData'].svgObj;
      } else {
        svg = this.selectedObj.el;
      }
      elems = svg['userData'].elems;
    }

    if (elems && elems.length === 0) return;

    elems.forEach((elem) => {
      elem.remove();
    });

    this.actElem(elems[0], false);
  }
}
