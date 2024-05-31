import * as THREE from 'three';

import { isometricSvgElem, isometricMath, isometricSvgListObjs } from './index';

export class IsometricSvgLineSegments {
  groupLines;
  groupObjs;

  init({ container, containerSvg }) {
    this.groupLines = isometricSvgElem.getSvgGroup({ container: containerSvg, tag: 'lines' });
    this.groupObjs = isometricSvgElem.getSvgGroup({ container: containerSvg, tag: 'objs' });
  }

  createSegment({ pos1, pos2, linkLine, linksObj }) {
    const color = '#' + (Math.random().toString(16) + '000000').substring(2, 8).toUpperCase();

    const svg = isometricSvgElem.createSvgLine({ x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y, stroke: color });

    svg['userData'] = { lineI: true, tag: 'segmentLine', linkLine, linksObj };

    this.groupLines.append(svg);

    return svg;
  }

  // при прикреклении/откреплении объекта на линии, обновляем кол-во сегментов
  addLineSegments({ line }) {
    return;
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
        const linksObj = [];

        if (ind === 0) {
          pos1 = isometricSvgElem.getPosLine2(line)[0];
          pos2 = isometricSvgElem.getPosCircle(svgPoint);

          linksObj.push(1, svgPoint);
        } else if (ind === arr.length - 1) {
          pos1 = isometricSvgElem.getPosCircle(svgPoint);
          pos2 = isometricSvgElem.getPosLine2(line)[1];

          linksObj.push(svgPoint, 2);
        } else {
          pos1 = isometricSvgElem.getPosCircle(arr[ind - 1]);
          pos2 = isometricSvgElem.getPosCircle(svgPoint);

          linksObj.push(arr[ind - 1], svgPoint);
        }

        const segment = this.createSegment({ pos1, pos2, linkLine: line, linksObj });

        line['userData'].segments.push(segment);
      }

      if (line['userData'].segments.length > 0) line.setAttribute('display', 'none');
    });
  }

  // при изменении длины линии, обновляем длину сегментов
  upLineSegments({ line }) {
    line['userData'].segments.forEach((segment) => {
      const linksObj = segment['userData'].linksObj;

      if (linksObj.length === 2) {
        let svg1 = linksObj[0];
        let svg2 = linksObj[1];

        if (typeof linksObj[0] === 'number') {
          if (linksObj[0] === 1) svg1 = line['userData'].pd1 ? line['userData'].pd1 : line['userData'].p1;
          if (linksObj[0] === 2) svg1 = line['userData'].pd2 ? line['userData'].pd2 : line['userData'].p2;
        }
        if (typeof linksObj[1] === 'number') {
          if (linksObj[1] === 1) svg2 = line['userData'].pd1 ? line['userData'].pd1 : line['userData'].p1;
          if (linksObj[1] === 2) svg2 = line['userData'].pd2 ? line['userData'].pd2 : line['userData'].p2;
        }

        const pos1 = isometricSvgElem.getPosCircle(svg1);
        const pos2 = isometricSvgElem.getPosCircle(svg2);

        isometricSvgElem.setPosLine2({ svg: segment, x1: pos1.x, y1: pos1.y, x2: pos2.x, y2: pos2.y });
      }
    });
  }

  deleteSegment({ segment }) {
    segment.remove();
  }
}
