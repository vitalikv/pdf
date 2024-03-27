import * as THREE from 'three';
import { isometricSvgElem, isometricMath, isometricSvgLine } from './index';

export class IsometricSvgJoint {
  container;
  containerSvg;
  groupLines;

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
    this.groupLines = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'lines' });
  }

  createToolPoint(event = null) {
    let x = -999999;
    let y = -999999;
    if (event) {
      const pos = this.getCoord(event);
      x = pos.x;
      y = pos.y;
    }

    this.toolPoint = isometricSvgElem.createSvgCircle({ x, y, stroke: '#ff0000' });
    this.groupLines.append(this.toolPoint);

    this.toolPoint['userData'] = { jointI: true, tag: 'point', lock: false, lines: [], crossOffset: false };
  }

  getCoord(event) {
    const pos = isometricSvgElem.getCoordMouse({ event, container: this.containerSvg });

    return pos;
  }

  onmousedown = (event) => {
    if (!this.containerSvg) return;

    if (this.toolPoint) {
      console.log(event.button);
      if (event.button === 2) {
        this.deletePoint(this.toolPoint);
        this.toolPoint = null;
      } else {
        const pos = this.getCoord(event);
        this.crossLine({ svgPoint: this.toolPoint, pos, mouseDown: true });
      }
    }

    return false;
  };

  onmousemove = (event) => {
    if (this.toolPoint) {
      const pos = this.getCoord(event);

      isometricSvgElem.setPosCircle(this.toolPoint, pos.x, pos.y);
      this.crossLine({ svgPoint: this.toolPoint, pos });
    }
  };

  onmouseup = (event) => {};

  crossLine({ svgPoint, pos, mouseDown = false }) {
    const arrLines = [];

    this.groupLines.childNodes.forEach((svg, ind) => {
      if (svg['userData'] && svg['userData'].lineI && svg['userData'].tag === 'line') {
        arrLines.push(svg);
      }
    });

    const result = { dist: Infinity, obj: null, type: '', pos: new THREE.Vector2() };

    arrLines.forEach((line) => {
      const posL = isometricSvgElem.getPosLine2(line);
      const posPr = isometricMath.spPoint(posL[0], posL[1], pos);
      const onLine = isometricMath.calScal(posL[0], posL[1], pos);

      if (onLine) {
        const dist = pos.distanceTo(posPr);
        if (dist < result.dist) {
          result.dist = dist;
          result.pos = posPr;
          result.type = 'line';
          result.obj = line;
        }
      }
    });

    if (result.type === 'line' && result.dist < 10) {
      const posC = isometricSvgElem.getPosCircle(svgPoint);
      const offset = new THREE.Vector2(result.pos.x - posC.x, result.pos.y - posC.y);

      isometricSvgElem.setOffsetCircle(svgPoint, offset.x, offset.y);

      if (mouseDown) {
        console.log(result.obj['userData']);
        this.splitLine({ line: result.obj, point: svgPoint });
      }
    }
  }

  // разбиение линии
  splitLine({ line, point }) {
    const p1 = line['userData'].p1;
    const p2 = line['userData'].p2;
    const pd1 = line['userData'].pd1;
    const pd2 = line['userData'].pd2;
    const ld1 = line['userData'].ld1;
    const ld2 = line['userData'].ld2;

    const posP1 = isometricSvgElem.getPosCircle(pd1 ? pd1 : p1);
    const posP2 = isometricSvgElem.getPosCircle(pd2 ? pd2 : p2);
    const posC = isometricSvgElem.getPosCircle(point);

    const line1 = isometricSvgLine.createSvgLine({ x1: posP1.x, y1: posP1.y, x2: posC.x, y2: posC.y });
    const line2 = isometricSvgLine.createSvgLine({ x1: posC.x, y1: posC.y, x2: posP2.x, y2: posP2.y });
    const pointC = isometricSvgLine.createSvgCircle({ ind: 0, x: posC.x, y: posC.y });
    this.groupLines.append(line1);
    this.groupLines.append(line2);
    this.groupLines.append(pointC);

    line1['userData'].p1 = p1;
    line1['userData'].p2 = pointC;
    line1['userData'].pd1 = pd1;
    line1['userData'].ld1 = ld1;
    line2['userData'].p1 = pointC;
    line2['userData'].p2 = p2;
    line2['userData'].pd2 = pd2;
    line2['userData'].ld2 = ld2;

    pointC['userData'].lines.push(line1, line2);

    let index = p1['userData'].lines.indexOf(line);
    if (index > -1) p1['userData'].lines[index] = line1;

    index = p2['userData'].lines.indexOf(line);
    if (index > -1) p2['userData'].lines[index] = line2;

    this.deletePoint(point);
    line.remove();
  }

  deletePoint(point = null) {
    if (point) point.remove();
    else if (this.toolPoint) this.toolPoint.remove();
    this.toolPoint = null;
  }
}
