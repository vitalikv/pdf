import * as THREE from 'three';

import { isometricSvgElem, isometricSvgLine, isometricSvgListObjs } from './index';

// конверитруем svg файл (из vsdx) в наш формат, убираем все группировки и т.д.
export class IsometricSvgPathConvert {
  init() {
    const containerSvg = isometricSvgElem.getContainerSvg();
    const groupObjs = isometricSvgElem.getSvgGroup({ container: containerSvg, tag: 'objs' });

    const elems = isometricSvgElem.getSvgElems({ container: containerSvg, recursion: true });

    const svgRoot = groupObjs.ownerSVGElement;
    console.log(svgRoot);

    const rect = svgRoot.getBoundingClientRect();

    const offset = {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    };

    elems.forEach((svg) => {
      if (svg) {
        const type = isometricSvgElem.getSvgType(svg);

        if (type === 'path') {
          const d = svg.getAttribute('d');
          const matrix = svg.getScreenCTM();

          svg.remove();

          const points = this.parsePathData(d);
          //console.log(d, points);
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
          g['userData'] = { freeForm: true, attributes: { guid: '0' } };
          groupObjs.append(g);

          let type = 'line';
          if (points[0][0] === points[points.length - 1][0] && points[0][1] === points[points.length - 1][1]) {
            type = 'polygon';
          }

          const arrPos = [];

          for (let i = 0; i < points.length; i++) {
            const svgP = document.querySelector('svg');

            let p1 = svgP.createSVGPoint();
            p1.x = points[i][0];
            p1.y = points[i][1];
            p1 = p1.matrixTransform(matrix);
            p1.x -= offset.left;
            p1.y -= offset.top;

            arrPos.push(p1);
          }

          if (type === 'line') {
            for (let i = 0; i < arrPos.length - 1; i++) {
              const p1 = arrPos[i];
              const p2 = arrPos[i + 1];

              const svgLine = isometricSvgElem.createSvgLine({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
              svgLine['userData'] = { freeFormObj: true };
              g.append(svgLine);
            }
          }
          if (type === 'polygon') {
            let strPoints = '';
            for (let i = 0; i < arrPos.length - 1; i++) {
              strPoints += ' ' + arrPos[i].x + ',' + arrPos[i].y;
            }

            const svgPolygo = isometricSvgElem.createPolygon({ x: 0, y: 0, points: strPoints, fill: 'none' });
            svgPolygo['userData'] = { freeFormObj: true };
            g.append(svgPolygo);
          }
        }
      }
    });
  }

  parsePathData(d) {
    const commands = d.match(/[a-zA-Z][^a-zA-Z]*/g); // Split by commands (M, L, C, etc.)
    const points = [];
    let currentPoint = [0, 0];

    commands.forEach((cmd) => {
      const type = cmd[0]; // Command letter (M, L, C, etc.)
      const coords = cmd.slice(1).trim().split(/[ ,]+/).map(Number); // Coordinates

      switch (type) {
        case 'M': // Move to (absolute)
          currentPoint = [coords[0], coords[1]];
          points.push([...currentPoint]);
          break;
        case 'L': // Line to (absolute)
          currentPoint = [coords[0], coords[1]];
          points.push([...currentPoint]);
          break;
        case 'H': // Horizontal line to (absolute)
          currentPoint[0] = coords[0];
          points.push([...currentPoint]);
          break;
        case 'V': // Vertical line to (absolute)
          currentPoint[1] = coords[0];
          points.push([...currentPoint]);
          break;
        case 'Z': // Close path (return to starting point)
          points.push(points[0]);
          break;
      }
    });

    return points;
  }
}
