import * as THREE from 'three';

import { isometricSvgElem, isometricSvgScaleBox } from './index';

export class IsometricSvgParserFile {
  groupObjs;

  init() {
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

    const svgXmlns = isometricSvgElem.getSvgXmlns({});
    const boundSvgXmlns = svgXmlns.getBoundingClientRect();
    const bound = g.getBoundingClientRect();

    let x = boundSvgXmlns.x + boundSvgXmlns.width / 2 - (bound.x + bound.width / 2);
    let y = boundSvgXmlns.y + boundSvgXmlns.height / 2 - (bound.y + bound.height / 2);

    const size = isometricSvgElem.getSizeViewBox({});
    const ratioX = boundSvgXmlns.width / size.x;
    const ratioY = boundSvgXmlns.height / size.y;
    x /= ratioX;
    y /= ratioY;
    g.setAttribute('transform', `matrix(1,0,0,1,${x},${y})`);

    isometricSvgScaleBox.initSvgScaleBox({ svg: g });
  }

  createGroup({ tag = '', guid = 0 }) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('fill', 'none');
    g.setAttribute('transform', 'matrix(1,0,0,1,0,0)');
    g['userData'] = { freeForm: true, tag, guid };

    return g;
  }

  getElemsFromGroup({ svg }) {
    const elems = [];

    svg.childNodes.forEach((elem) => {
      if (this.isSvg({ elem })) elems.push(elem);
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
}
