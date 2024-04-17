import * as THREE from 'three';

import { isometricSvgElem, isometricNoteSvg, isometricNoteSvg2, isometricSvgRuler } from './index';

export class IsometricSvgScale {
  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
    this.groupLines = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'lines' });
  }

  scaleLines(canvas, ratio, bound2) {
    const arrLines = [];
    const arrPoints = [];
    const arrDPoints = [];

    this.groupLines.childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI && svg['userData'].tag === 'point') {
          arrPoints.push(svg);
        }
        if (svg['userData'].lineI && svg['userData'].tag === 'dpoint') {
          arrDPoints.push(svg);
        }
      }
    });

    const bound = canvas.getBoundingClientRect();
    const boundC = this.container.getBoundingClientRect();

    arrPoints.forEach((svgCircle) => {
      const cx = svgCircle.getAttribute('cx');
      const cy = svgCircle.getAttribute('cy');

      const nx1 = (cx - bound2.x) * ratio + bound.x;
      const ny1 = (cy - bound2.y) * ratio + bound.y + (boundC.y * ratio - boundC.y);

      svgCircle.setAttribute('cx', Number(nx1));
      svgCircle.setAttribute('cy', Number(ny1));
    });

    const arrPds = [];

    arrPoints.forEach((svg) => {
      svg['userData'].lines.forEach((svgLine) => {
        const coord = this.getCoordLine(svgLine);
        svgLine.setAttribute('x1', coord.a.x);
        svgLine.setAttribute('y1', coord.a.y);
        svgLine.setAttribute('x2', coord.b.x);
        svgLine.setAttribute('y2', coord.b.y);

        if (svgLine['userData'].pd1) {
          const svgCircle = svgLine['userData'].pd1;
          const svgLd = svgLine['userData'].ld1;
          const pos = this.getCoordPointOnLine({ line: svgLine, ind: 2 });

          svgCircle.setAttribute('cx', pos.pos.x);
          svgCircle.setAttribute('cy', pos.pos.y);

          svgLd.setAttribute('x1', pos.pos.x);
          svgLd.setAttribute('y1', pos.pos.y);
          svgLd.setAttribute('x2', pos.pos1.x);
          svgLd.setAttribute('y2', pos.pos1.y);

          svgLine.setAttribute('x1', pos.pos.x);
          svgLine.setAttribute('y1', pos.pos.y);

          arrPds.push(svgCircle);
        }

        if (svgLine['userData'].pd2) {
          const svgCircle = svgLine['userData'].pd2;
          const svgLd = svgLine['userData'].ld2;
          const pos = this.getCoordPointOnLine({ line: svgLine, ind: 1 });

          svgCircle.setAttribute('cx', pos.pos.x);
          svgCircle.setAttribute('cy', pos.pos.y);

          svgLd.setAttribute('x1', pos.pos.x);
          svgLd.setAttribute('y1', pos.pos.y);
          svgLd.setAttribute('x2', pos.pos2.x);
          svgLd.setAttribute('y2', pos.pos2.y);

          svgLine.setAttribute('x2', pos.pos.x);
          svgLine.setAttribute('y2', pos.pos.y);

          arrPds.push(svgCircle);
        }
      });
    });

    arrPoints.forEach((p) => {
      p['userData'].move = false;
    });
  }

  // координаты линии
  getCoordLine(svg) {
    const p1 = svg['userData'].p1;
    const p2 = svg['userData'].p2;

    const cx1 = Number(p1.getAttribute('cx'));
    const cy1 = Number(p1.getAttribute('cy'));
    const cx2 = Number(p2.getAttribute('cx'));
    const cy2 = Number(p2.getAttribute('cy'));

    return { a: new THREE.Vector2(cx1, cy1), b: new THREE.Vector2(cx2, cy2) };
  }

  // координаты создаваемой точки/стыка на линии (перед углом)
  getCoordPointOnLine({ line, ind = 0, pCenter = null }) {
    const pos = isometricSvgElem.getPosLine1(line);

    let pos1 = pos[0];
    let pos2 = pos[1];

    if (pCenter) {
      const posC = isometricSvgElem.getPosCircle(pCenter);
      const dist1 = new THREE.Vector2(posC.x, posC.y).distanceTo(pos1);
      const dist2 = new THREE.Vector2(posC.x, posC.y).distanceTo(pos2);

      if (dist1 < dist2) {
        pos1 = pos[0];
        pos2 = pos[1];
        ind = 1;
      } else {
        pos1 = pos[1];
        pos2 = pos[0];
        ind = 2;
      }
    } else if (ind === 1) {
      pos1 = pos[1];
      pos2 = pos[0];
    }

    const dir = pos2.clone().sub(pos1).normalize();
    const dist = pos2.distanceTo(pos1);
    const offset = new THREE.Vector2().addScaledVector(dir, 20);
    const posPoint = pos1.clone().add(offset);

    return { ind, pos: posPoint, dist, pos1: pos[0], pos2: pos[1] };
  }
}
