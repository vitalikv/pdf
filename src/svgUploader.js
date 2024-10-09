import * as THREE from 'three';

import { isometricSvgElem, isometricMath, isometricSvgScaleBox } from './index';

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
}
