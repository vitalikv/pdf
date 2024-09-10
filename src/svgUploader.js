import * as THREE from 'three';

import { isometricSvgElem, isometricMath } from './index';

export class IsometricSvgUploader {
  containerSvg;
  groupObjs;

  constructor() {
    this.inputFile = this.createInputFile();
  }

  init({ containerSvg }) {
    this.containerSvg = containerSvg;
    this.groupObjs = isometricSvgElem.getSvgGroup({ tag: 'objs' });
  }

  createInputFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.svg';
    input.style.cssText = 'position: absolute; display: none;';

    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        if (e.target.files[0].type.indexOf('svg') === -1) return;

        const reader = new FileReader();
        reader.onload = () => {
          this.parseSvg({ file: reader.result });
        };
        //reader.readAsDataURL(e.target.files[0]);
        reader.readAsText(e.target.files[0]);

        input.value = '';
      }
    };

    return input;
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

    console.log(g);

    console.log(this.groupObjs);
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
}
