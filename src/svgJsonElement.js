import * as THREE from 'three';

import { isometricSvgElem, isometricMath, isometricSvgLineSegments, isometricSvgListObjs, isometricSvgUndoRedo, isometricSvgElementAttributes } from './index';

export class IsometricSvgJsonElement {
  groupObjs;
  startOffset = new THREE.Vector2();
  isDown = false;
  isMove = false;
  offset = new THREE.Vector2();
  selectedObj = { el: null, mode: '' };

  init({ containerSvg }) {
    const bound = containerSvg.getBoundingClientRect();
    this.startOffset.x = bound.left;
    this.startOffset.y = bound.top;

    this.groupObjs = isometricSvgElem.getSvgGroup({ container: containerSvg, tag: 'objs' });
  }

  getJson() {
    let json = {
      tag: '',
      type: 'g',
      elems: [
        {
          type: 'polygon',
          pos: {
            x: 0,
            y: 0,
          },
          points:
            ' 628.0147841513897,563.6872285180795 551.3790656416322,488.0467790798772 635.9769367238321,420.36848221411725 737.4943820224719,420.36848221411725 737.4943820224719,327.808458559475 798.2057953873448,307.9030771283692 852.9455943228859,327.808458559475 852.9455943228859,420.36848221411725 965.410999408634,420.36848221411725 1035.0798344175046,488.0467790798772 965.410999408634,563.6872285180795',
        },
      ],
      guid: 0,
    };

    return json;
  }

  createObj({ data = this.getJson() }) {
    const attributes = data['attributes'] ? data['attributes'] : undefined;
    const svg = this.createGroup({ attributes });

    data.elems.forEach((elem) => {
      if (elem.type === 'line') {
        this.createLine({ pos: elem.pos, group: svg });
      }
      if (elem.type === 'polygon') {
        const data = { pos: elem.pos ? elem.pos : new THREE.Vector2(), points: elem.points };
        this.createPolygon({ data, group: svg });
      }
    });

    this.isDown = true;
    this.isMove = false;
    this.selectedObj.el = svg;
    this.setColorElem(svg, true);

    this.offset = this.getCenterSvg({ svg });
    svg.setAttribute('display', 'none');
  }

  getCenterSvg({ svg }) {
    const bound = svg.getBoundingClientRect();
    const x = bound.x + bound.width / 2 - this.startOffset.x;
    const y = bound.y + bound.height / 2 - this.startOffset.y;

    return new THREE.Vector2(x, y);
  }

  createGroup({ attributes = { guid: '0' } }) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g['userData'] = { freeForm: true, attributes };
    this.groupObjs.append(g);

    return g;
  }

  createLine({ pos, group = null }) {
    const svg = isometricSvgElem.createSvgLine({ x1: pos[0].x, y1: pos[0].y, x2: pos[1].x, y2: pos[1].y });
    group.append(svg);

    return svg;
  }

  createPolygon({ data, group = null }) {
    const pos = data.pos;
    const points = data.points;

    const svg = isometricSvgElem.createPolygon({ x: pos.x, y: pos.y, points, fill: 'none' });
    group.append(svg);

    return svg;
  }

  // вставка скопрированного элемента
  clonePaste({ svg }) {
    const cloneSvg = svg.cloneNode(true);

    this.groupObjs.append(cloneSvg);
    cloneSvg['userData'] = svg['userData'];

    return cloneSvg;
  }

  onmousedown = ({ event = null }) => {
    if (event.button === 2) {
      this.clickRightButton();
    }

    // заканчиваем перетаскивание созданного элемента и создаем новый
    if (event.button === 0) {
      this.setColorElem(this.selectedObj.el, false);

      const svg = this.clonePaste({ svg: this.selectedObj.el });
      this.cleareMouse();
      this.cleareSelectedObj();

      this.selectedObj.el = svg;
      this.selectedObj.mode = 'cloneSvg';
      this.offset = this.getCenterSvg({ svg });
      this.setColorElem(svg, true);
    }

    this.isDown = true;
    this.isMove = false;

    return true;
  };

  onmousemove = (event) => {
    if (!this.isDown) return;
    if (!this.selectedObj.el) return;

    if (!this.isMove) {
      this.isMove = true;
      this.selectedObj.el.setAttribute('display', '');
    }

    // перетаскиваем готовый элемент
    const pos = isometricSvgElem.getCoordMouse({ event });
    const offset = pos.sub(this.offset);
    const svg = this.selectedObj.el;

    this.moveSvgObj({ svg, offset });

    this.offset = isometricSvgElem.getCoordMouse({ event });
  };

  onmouseup = (event) => {
    if (this.selectedObj.mode === 'cloneSvg') return;
    this.isDown = false;
    this.isMove = false;
  };

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

  // получаем все объекты в group
  getElemsFromGroup({ svg }) {
    const elems = [];

    svg.childNodes.forEach((elem) => {
      elems.push(elem);
    });

    return elems;
  }

  clickRightButton() {
    this.cleareMouse();

    if (this.selectedObj.el) {
      this.selectedObj.el.remove();

      this.cleareSelectedObj();
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
}
