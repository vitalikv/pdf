import * as THREE from 'three';

import { isometricSvgElem, isometricMath, isometricSvgPathConvert } from './index';

export class IsometricSvgComparison {
  constructor() {}

  init({ elems }) {
    const containerSvg = isometricSvgElem.getContainerSvg();
    const elemsDef = isometricSvgElem.getSvgElems({ container: containerSvg, recursion: true });
    const elems2 = [];

    elemsDef.forEach((svg) => {
      if (svg && this.isSvg({ elem: svg })) {
        const ind = elems.findIndex((elem) => elem === svg);
        if (ind === -1) elems2.push(svg);
      }
    });

    for (let i1 = 0; i1 < elems.length; i1++) {
      const elem1 = elems[i1];

      let equally = false;

      for (let i2 = 0; i2 < elems2.length; i2++) {
        const elem2 = elems2[i2];

        equally = this.compare({ elem1, elem2 });

        if (equally) break;
      }

      if (!equally) {
        elem1.setAttribute('stroke', '#ff0000');
      }
    }
  }

  compare({ elem1, elem2 }) {
    const type1 = isometricSvgElem.getSvgType(elem1);
    const type2 = isometricSvgElem.getSvgType(elem2);

    if (type1 !== type2) return false;

    let equally = false;

    if (type1 === 'line') {
      const pos1 = isometricSvgElem.getPosLine2(elem1);
      const pos2 = isometricSvgElem.getPosLine2(elem2);

      if (pos1[0].length() === pos2[0].length() && pos1[1].length() === pos2[1].length()) {
        equally = true;
      }
    }

    if (type1 === 'polygon') {
      const points1 = elem1.getAttribute('points');
      const x1 = elem1.transform.baseVal[0].matrix.e;
      const y1 = elem1.transform.baseVal[0].matrix.f;
      const pos1 = new THREE.Vector2(x1, y1);

      const points2 = elem1.getAttribute('points');
      const x2 = elem1.transform.baseVal[0].matrix.e;
      const y2 = elem1.transform.baseVal[0].matrix.f;
      const pos2 = new THREE.Vector2(x2, y2);

      if (pos1.length() === pos2.length() && points1 === points2) {
        equally = true;
      }
    }

    return equally;
  }

  isSvg({ elem }) {
    let isSvg = false;

    const types = ['g', 'line', 'circle', 'ellipse', 'polygon', 'path'];

    for (let i = 0; i < types.length; i++) {
      if (elem.tagName === types[i]) {
        isSvg = true;
        break;
      }
    }

    return isSvg;
  }
}
