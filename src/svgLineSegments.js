import * as THREE from 'three';

import { isometricSvgElem, isometricMath, isometricSvgListObjs } from './index';

export class IsometricSvgLineSegments {
  groupLines;
  groupObjs;

  init({ container, containerSvg }) {
    this.groupLines = isometricSvgElem.getSvgGroup({ container: containerSvg, tag: 'lines' });
    this.groupObjs = isometricSvgElem.getSvgGroup({ container: containerSvg, tag: 'objs' });
  }

  createSegment({ pos1, pos2 }) {
    const color = '#' + (Math.random().toString(16) + '000000').substring(2, 8).toUpperCase();

    const svg = isometricSvgElem.createSvgLine({ x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y, stroke: color });

    svg['userData'] = { lineI: true, tag: 'segmentLine', link: null };

    this.groupLines.append(svg);

    return svg;
  }

  // при прикреклении/откреплении объекта на линии, обновляем кол-во сегментов
  addLineSegments({ line }) {
    line.setAttribute('display', '');

    line['userData'].segments.forEach((svgObj) => {
      svgObj.remove();
    });
    line['userData'].segments = [];

    line['userData'].links.sort((a, b) => {
      return a['userData'].link.dist - b['userData'].link.dist;
    });

    const arrP = [];
    line['userData'].links.forEach((svgPoint) => {
      if (isometricSvgListObjs.isObjBySvg(svgPoint)) {
        if (!svgPoint['userData'].objBracket) arrP.push(svgPoint);
      }
    });

    if (arrP.length > 0) arrP.push(arrP[arrP.length - 1]);

    arrP.forEach((svgPoint, ind, arr) => {
      if (isometricSvgListObjs.isObjBySvg(svgPoint)) {
        let pos1 = new THREE.Vector2();
        let pos2 = new THREE.Vector2();

        if (ind === 0) {
          pos1 = isometricSvgElem.getPosLine2(line)[0];
          pos2 = isometricSvgElem.getPosCircle(svgPoint);
        } else if (ind === arr.length - 1) {
          pos1 = isometricSvgElem.getPosCircle(svgPoint);
          pos2 = isometricSvgElem.getPosLine2(line)[1];
        } else {
          pos1 = isometricSvgElem.getPosCircle(arr[ind - 1]);
          pos2 = isometricSvgElem.getPosCircle(svgPoint);
        }

        const line1 = this.createSegment({ pos1, pos2 });

        line['userData'].segments.push(line1);
      }

      if (line['userData'].segments.length > 0) line.setAttribute('display', 'none');
    });
  }

  // при изменении длины линии, обновляем длину сегментов
  upLineSegments({ line }) {
    line['userData'].links.sort((a, b) => {
      return a['userData'].link.dist - b['userData'].link.dist;
    });

    line['userData'].links.forEach((svgPoint, ind, arr) => {
      const segment = line['userData'].segments[ind];
      if (segment) {
        let pos1 = new THREE.Vector2();
        let pos2 = new THREE.Vector2();
        if (ind === 0) {
          pos1 = isometricSvgElem.getPosLine2(line)[0];
          pos2 = isometricSvgElem.getPosCircle(svgPoint);
        } else {
          pos1 = isometricSvgElem.getPosCircle(arr[ind - 1]);
          pos2 = isometricSvgElem.getPosCircle(svgPoint);
        }

        isometricSvgElem.setPosLine2({ svg: segment, x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y });
      }
    });

    if (line['userData'].links.length > 0) {
      const ind = line['userData'].links.length - 1;
      const svgPoint = line['userData'].links[ind];

      const segment = line['userData'].segments[ind + 1];
      if (segment) {
        const pos1 = isometricSvgElem.getPosCircle(svgPoint);
        const pos2 = isometricSvgElem.getPosLine2(line)[1];

        isometricSvgElem.setPosLine2({ svg: segment, x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y });
      }
    }
  }

  deleteSegment({ segment }) {
    segment.remove();
  }
}
