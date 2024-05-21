import * as THREE from 'three';

import { isometricSvgElem, isometricMath } from './index';

export class IsometricSvgLineSegments {
  groupLines;
  groupObjs;

  init({ container, containerSvg }) {
    this.groupLines = isometricSvgElem.getSvgGroup({ container: containerSvg, tag: 'lines' });
    this.groupObjs = isometricSvgElem.getSvgGroup({ container: containerSvg, tag: 'objs' });
  }

  // при прикреклении/откреплении объекта на линии, обновляем кол-во сегментов
  addLineSegments({ line }) {
    line['userData'].segments.forEach((svgObj) => {
      svgObj.remove();
    });
    line['userData'].segments = [];

    line['userData'].links.sort((a, b) => {
      return a['userData'].link.dist - b['userData'].link.dist;
    });

    line['userData'].links.forEach((svgPoint, ind, arr) => {
      const color = '#' + (Math.random().toString(16) + '000000').substring(2, 8).toUpperCase();

      let pos1 = new THREE.Vector2();
      let pos2 = new THREE.Vector2();
      if (ind === 0) {
        pos1 = isometricSvgElem.getPosLine2(line)[0];
        pos2 = isometricSvgElem.getPosCircle(svgPoint);
      } else {
        pos1 = isometricSvgElem.getPosCircle(arr[ind - 1]);
        pos2 = isometricSvgElem.getPosCircle(svgPoint);
      }

      const line1 = isometricSvgElem.createSvgLine({ x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y, stroke: color });
      this.groupLines.append(line1);

      line['userData'].segments.push(line1);
    });

    if (line['userData'].links.length > 0) {
      const color = '#' + (Math.random().toString(16) + '000000').substring(2, 8).toUpperCase();

      const svgPoint = line['userData'].links[line['userData'].links.length - 1];
      const pos1 = isometricSvgElem.getPosCircle(svgPoint);
      const pos2 = isometricSvgElem.getPosLine2(line)[1];

      const line1 = isometricSvgElem.createSvgLine({ x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y, stroke: color });
      this.groupLines.append(line1);

      line['userData'].segments.push(line1);
    }

    console.log(line['userData'].links);
    console.log(line['userData'].segments);
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
}
