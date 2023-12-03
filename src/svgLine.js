import * as THREE from 'three';

import { isometricSvgObjs, isometricNoteSvg, isometricNoteSvg2, isometricSvgRuler, isometricSvgElem, isometricMath } from './index';

export class IsometricSvgLine {
  container;
  containerSvg;
  groupLines;
  arrLine = [];
  isDown = false;
  newNote = { type: '', line: null, p2: null, arr: { l: [], p: [] } };
  offset = new THREE.Vector2();
  selectedObj = { el: null, type: '' };
  toolPoint;

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

    this.toolPoint['userData'] = { tag: 'toolsPoint', lines: [], crossOffset: false };
  }

  deleteToolPoint() {
    if (!this.toolPoint) return;
    this.toolPoint.remove();
    this.toolPoint = null;
  }

  addLine(event, ps1 = null) {
    this.clearSelectedObj();

    if (event.button !== 0) return;

    const pos = this.getCoord(event);

    const { line, p1, p2 } = this.createElement({ x: pos.x, y: pos.y, ps1 });

    this.newNote.type = 'move';
    this.newNote.line = line;
    this.newNote.p2 = p2;
    this.newNote.arr.l.push(line);
    this.newNote.arr.p.push(p1, p2);

    if (this.newNote.arr.l.length > 2) {
      const ind = this.newNote.arr.l.length - 3;
      const line1 = this.newNote.arr.l[ind];
      const line2 = this.newNote.arr.l[ind + 1];
      const pCenter = line2['userData'].p1;
      this.addCorner({ line1, line2, pCenter, type: 'newline' });
    } else {
      if (this.newNote.arr.l.length === 1) {
        const result = this.svgPointCross({ p2: p1, event, ignoreP: [p2], type: 'mouseup' });
        if (result) {
          // const lines = result.point['userData'].lines;
          // console.log({ line1: lines[0], line2: lines[1], pCenter: result.point, type: 'newline' });
          // this.addCorner({ line1: lines[0], line2: lines[1], pCenter: result.point, type: 'newline' });
        }
      }
    }

    this.offset = this.getCoord(event);
  }

  // угол между линиями
  getAngleLines({ line1, line2, pCenter }) {
    const posC = isometricSvgElem.getPosCircle(pCenter);

    let pos1 = new THREE.Vector2();
    let pos2 = new THREE.Vector2();

    if (line1) {
      const pos = isometricSvgElem.getPosLine1(line1);
      const dist1 = new THREE.Vector2(posC.x, posC.y).distanceTo(new THREE.Vector2(pos[0].x, pos[0].y));
      const dist2 = new THREE.Vector2(posC.x, posC.y).distanceTo(new THREE.Vector2(pos[1].x, pos[1].y));

      pos1 = dist1 > dist2 ? new THREE.Vector2(pos[0].x, pos[0].y) : new THREE.Vector2(pos[1].x, pos[1].y);
    }

    if (line2) {
      const pos = isometricSvgElem.getPosLine1(line2);
      const dist1 = new THREE.Vector2(posC.x, posC.y).distanceTo(new THREE.Vector2(pos[0].x, pos[0].y));
      const dist2 = new THREE.Vector2(posC.x, posC.y).distanceTo(new THREE.Vector2(pos[1].x, pos[1].y));

      pos2 = dist1 > dist2 ? new THREE.Vector2(pos[0].x, pos[0].y) : new THREE.Vector2(pos[1].x, pos[1].y);
    }

    const dir1 = new THREE.Vector2(posC.x, posC.y).sub(pos1).normalize();
    const dir2 = new THREE.Vector2(posC.x, posC.y).sub(pos2).normalize();

    const deg = isometricMath.angleTo({ v1: dir1, v2: dir2, type: 'deg' });

    return deg % 180;
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

  addNextLine(event) {
    if (this.newNote.type !== 'move') return;

    const p2 = this.newNote.p2;

    const result = this.endMovePoint({ svg: p2, event });
    if (result) {
      this.stopLine(false);
      return true;
    }

    this.addLine(event, p2);

    return false;
  }

  // создаем автоматический угол
  addCorner({ line1, line2, pCenter, type = '' }) {
    const degree = this.getAngleLines({ line1, line2, pCenter });

    if (degree > 150) return;

    const res1 = this.getCoordPointOnLine({ line: line1, ind: 1, pCenter });
    const res2 = this.getCoordPointOnLine({ line: line2, ind: 2, pCenter });

    let pd1 = res1.ind === 1 ? line1['userData'].pd1 : line1['userData'].pd2;
    let pd2 = res2.ind === 1 ? line2['userData'].pd1 : line2['userData'].pd2;
    if (pd1 && pd2) return;

    if (res1.dist > 20 && res2.dist > 20) {
      const stroke = type === 'newline' ? '#ff0000' : '#000000';

      // создаем 2 точки перед углом
      const pd2 = this.createSvgCircle({ ind: 0, x: res1.pos.x, y: res1.pos.y, stroke });
      const pd1 = this.createSvgCircle({ ind: 0, x: res2.pos.x, y: res2.pos.y, stroke });
      this.groupLines.append(pd1);
      this.groupLines.append(pd2);

      // создаем 2 линии для угла
      const x = Number(pCenter.getAttribute('cx'));
      const y = Number(pCenter.getAttribute('cy'));
      const ld2 = this.createSvgLine({ x1: res1.pos.x, y1: res1.pos.y, x2: x, y2: y, stroke });
      const ld1 = this.createSvgLine({ x1: res2.pos.x, y1: res2.pos.y, x2: x, y2: y, stroke });
      this.groupLines.append(ld1);
      this.groupLines.append(ld2);

      if (res1.ind === 2) {
        line1['userData'].pd2 = pd2;
        line1['userData'].ld2 = ld2;
      } else {
        line1['userData'].pd1 = pd2;
        line1['userData'].ld1 = ld2;
      }

      if (res2.ind === 2) {
        line2['userData'].pd2 = pd1;
        line2['userData'].ld2 = ld1;
      } else {
        line2['userData'].pd1 = pd1;
        line2['userData'].ld1 = ld1;
      }

      pd1['userData'].tag = 'dpoint';
      pd1['userData'].ld = ld1;
      pd2['userData'].tag = 'dpoint';
      pd2['userData'].ld = ld2;

      ld1['userData'].tag = 'dline';
      ld1['userData'].pCenter = pCenter;
      ld1['userData'].ld = ld2;
      ld1['userData'].line = line2;
      ld1['userData'].pd = pd1;

      ld2['userData'].tag = 'dline';
      ld2['userData'].pCenter = pCenter;
      ld2['userData'].ld = ld1;
      ld2['userData'].line = line1;
      ld2['userData'].pd = pd2;

      pCenter['userData'].pds.push(pd1, pd2);

      line1.setAttribute('x' + res1.ind, res1.pos.x);
      line1.setAttribute('y' + res1.ind, res1.pos.y);
      line2.setAttribute('x' + res2.ind, res2.pos.x);
      line2.setAttribute('y' + res2.ind, res2.pos.y);

      pCenter.setAttribute('display', 'none');
    }
  }

  // создать линию
  createElement({ x, y, ps1 }) {
    const x1 = x;
    const y1 = y;
    const x2 = x;
    const y2 = y;

    const line = this.createSvgLine({ x1, y1, x2, y2, stroke: '#ff0000' });
    const p1 = ps1 ? ps1 : this.createSvgCircle({ ind: 0, x: x1, y: y1, stroke: '#ff0000' });
    const p2 = this.createSvgCircle({ ind: 0, x: x1, y: y1, stroke: '#ff0000' });

    this.groupLines.append(line);
    if (!ps1) this.groupLines.append(p1);
    this.groupLines.append(p2);

    line['userData'].p1 = p1;
    line['userData'].p2 = p2;
    p1['userData'].lines.push(line);
    p2['userData'].lines.push(line);

    return { line, p1, p2 };
  }

  // создаем svg line елемент
  createSvgLine({ x1, y1, x2, y2, stroke = '#000000' }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'line');

    svg.setAttribute('x1', x1);
    svg.setAttribute('y1', y1);
    svg.setAttribute('x2', x2);
    svg.setAttribute('y2', y2);
    svg.setAttribute('stroke-width', '2.5px');
    //svg.setAttribute('stroke', 'rgb(255, 162, 23)');
    svg.setAttribute('stroke', stroke);
    //svg.setAttribute('display', 'none');

    svg['userData'] = { lineI: true, tag: 'line', lock: false, p1: null, p2: null };
    svg['userData'].pd1 = null;
    svg['userData'].pd2 = null;
    svg['userData'].ld1 = null;
    svg['userData'].ld2 = null;
    svg['userData'].links = [];

    return svg;
  }

  // создаем svg точки
  createSvgCircle({ ind, x, y, r = '3.2', stroke = '#000000' }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);

    svg.setAttribute('r', r);
    svg.setAttribute('stroke-width', '2px');
    svg.setAttribute('stroke', stroke);
    svg.setAttribute('transform-origin', 'center');

    svg.setAttribute('fill', stroke);
    svg.setAttribute('ind', ind);

    svg.setAttributeNS(null, 'style', 'transform: translateX(0) translateY(0);');
    //svg.setAttribute('display', 'none');

    svg['userData'] = { lineI: true, tag: 'point', lock: false, lines: [] };
    svg['userData'].crossOffset = false;
    svg['userData'].move = false;
    svg['userData'].pds = [];

    return svg;
  }

  getCoord(event) {
    const pos = isometricSvgElem.getCoordMouse({ event, container: this.containerSvg });

    return pos;
  }

  onmousedown = (event) => {
    if (!this.containerSvg) return;

    if (this.selectedObj.el) this.actElem(this.selectedObj.el);

    this.isDown = false;

    this.groupLines.childNodes.forEach((svg, ind) => {
      if (svg['userData'] && svg['userData'].lineI && svg.contains(event.target)) {
        this.isDown = true;
        this.actElem(svg, true);
      }
    });

    this.offset = this.getCoord(event);

    return this.isDown;
  };

  // перемещение svg
  onmousemove = (event) => {
    if (this.toolPoint) {
      const pos = this.getCoord(event);

      isometricSvgElem.setPosCircle(this.toolPoint, pos.x, pos.y);
      this.svgPointCross({ p2: this.toolPoint, event });
    }

    if (this.newNote.type === 'move') {
      const svgCircle = this.newNote.p2;
      const svgLine = this.newNote.line;

      const pos = this.getCoord(event);
      const offsetX = pos.x - this.offset.x;
      const offsetY = pos.y - this.offset.y;

      const cx = svgCircle.getAttribute('cx');
      const cy = svgCircle.getAttribute('cy');
      svgCircle.setAttribute('cx', Number(cx) + offsetX);
      svgCircle.setAttribute('cy', Number(cy) + offsetY);

      const cx2 = svgCircle.getAttribute('cx');
      const cy2 = svgCircle.getAttribute('cy');
      svgLine.setAttribute('x2', Number(cx2));
      svgLine.setAttribute('y2', Number(cy2));

      this.svgPointCross({ p2: svgCircle, event });

      this.offset = this.getCoord(event);
    }

    if (!this.isDown) return;

    const svg = this.selectedObj.el;
    if (!svg) return;

    const pos = this.getCoord(event);
    const offsetX = pos.x - this.offset.x;
    const offsetY = pos.y - this.offset.y;
    const offset = new THREE.Vector2(offsetX, offsetY);

    if (svg['userData'].tag === 'line') {
      this.moveSvgLine({ svg, offset });
    }

    if (svg['userData'].tag === 'point') {
      this.moveSvgPoint({ svg, offset });
      this.svgPointCross({ p2: svg, event });
    }

    this.offset = this.getCoord(event);
  };

  onmouseup = (event) => {
    if (!this.isDown) return;
    this.isDown = false;

    const svg = this.selectedObj.el;
    if (!svg) return;

    if (svg['userData'].tag === 'point') {
      this.endMovePoint({ svg, event });
    }
  };

  // заканчиваем перетаскивание точки на другой точке
  endMovePoint({ svg, event }) {
    const result = this.svgPointCross({ p2: svg, event, type: 'mouseup' });

    if (result) {
      const point = result.point;

      if (result.tag === 'point') {
        const lines = point['userData'].lines;

        if (lines.length === 2) {
          this.addCorner({ line1: lines[0], line2: lines[1], pCenter: point });

          if (lines[0]['userData'].ld1) {
            this.actElem(lines[0]['userData'].ld1, false);
          } else if (lines[0]['userData'].ld2) {
            this.actElem(lines[0]['userData'].ld2, false);
          }
        }
      }
      // перетащили на точку с углом, создаем связь с углом и обновляем угол
      if (result.tag === 'dpoint') {
        const { pCenter, pd1, ld1 } = this.getElemsCorner(point);

        const line = result.line;

        const res1 = this.getCoordPointOnLine({ line, pCenter });
        const ind1 = res1.ind;

        line['userData']['ld' + ind1] = ld1;
        line['userData']['pd' + ind1] = pd1;
        line['userData']['p' + ind1] = pCenter;
        pCenter['userData'].lines.push(line);

        this.moveSvgPoint({ svg: pCenter, offset: new THREE.Vector2() });
      }
    }

    return result ? true : false;
  }

  moveSvgLine({ svg, offset }) {
    const offsetX = offset.x;
    const offsetY = offset.y;

    const p1 = svg['userData'].p1;
    const p2 = svg['userData'].p2;

    const x1 = p1.getAttribute('cx');
    const y1 = p1.getAttribute('cy');
    const x2 = p2.getAttribute('cx');
    const y2 = p2.getAttribute('cy');

    svg.setAttribute('x1', Number(x1) + offsetX);
    svg.setAttribute('y1', Number(y1) + offsetY);
    svg.setAttribute('x2', Number(x2) + offsetX);
    svg.setAttribute('y2', Number(y2) + offsetY);

    this.moveSvgPoint({ svg: svg['userData'].p1, offset, stopLine: svg });
    this.moveSvgPoint({ svg: svg['userData'].p2, offset, stopLine: svg });
  }

  moveSvgPoint({ svg, offset, stopLine = null }) {
    const svgCircle = svg;
    const offsetX = offset.x;
    const offsetY = offset.y;

    const posC = isometricSvgElem.getPosCircle(svgCircle);
    isometricSvgElem.setPosCircle(svgCircle, posC.x + offsetX, posC.y + offsetY);

    const arrPds = [];

    svg['userData'].lines.forEach((svgLine) => {
      if (stopLine !== svgLine) {
        isometricSvgElem.upPosLine1(svgLine);
      }

      if (svgLine['userData'].pd1) {
        const svgCircle = svgLine['userData'].pd1;
        const svgLd = svgLine['userData'].ld1;
        const pos = this.getCoordPointOnLine({ line: svgLine, ind: 2 });

        isometricSvgElem.setPosCircle(svgCircle, pos.pos.x, pos.pos.y);

        if (svgLd) {
          isometricSvgElem.setPosLine1(svgLd, pos.pos.x, pos.pos.y, pos.pos1.x, pos.pos1.y);
        }

        svgLine.setAttribute('x1', pos.pos.x);
        svgLine.setAttribute('y1', pos.pos.y);

        arrPds.push(svgCircle);
      }

      if (svgLine['userData'].pd2) {
        const svgCircle = svgLine['userData'].pd2;
        const svgLd = svgLine['userData'].ld2;
        const pos = this.getCoordPointOnLine({ line: svgLine, ind: 1 });

        isometricSvgElem.setPosCircle(svgCircle, pos.pos.x, pos.pos.y);

        if (svgLd) {
          isometricSvgElem.setPosLine1(svgLd, pos.pos.x, pos.pos.y, pos.pos2.x, pos.pos2.y);
        }

        svgLine.setAttribute('x2', pos.pos.x);
        svgLine.setAttribute('y2', pos.pos.y);

        arrPds.push(svgCircle);
      }
    });

    svg['userData'].pds.forEach((pd) => {
      const ind = arrPds.indexOf(pd);

      if (ind === -1) {
        const svgCircle = pd;
        const svgLd = pd['userData'].ld;

        const posC = isometricSvgElem.getPosCircle(svgCircle);
        isometricSvgElem.setPosCircle(svgCircle, posC.x + offsetX, posC.y + offsetY);

        const pos = isometricSvgElem.getPosLine2(svgLd);
        isometricSvgElem.setPosLine1(svgLd, pos[0].x + offsetX, pos[0].y + offsetY, pos[1].x + offsetX, pos[1].y + offsetY);
      }
    });

    this.updateCorner({ point: svg });

    svg['userData'].lines.forEach((svgLine) => {
      isometricNoteSvg.updataPos(svgLine);
      isometricSvgObjs.updataPos(svgLine);
      isometricNoteSvg2.updataPos(svgLine);
      isometricSvgRuler.updataPos(svgLine);
    });
  }

  // пересечение перетаскиваемой точки с другой точкой
  svgPointCross({ p2, event, type = '', ignoreP = [] }) {
    // у точки должна быть одна линия, то есть это точка начало/конец трубы
    if (p2['userData'].tag === 'toolsPoint') {
    } else if (p2['userData'].lines.length !== 1) return;

    // находим все точки на листе
    const arrPoints = [];
    this.groupLines.childNodes.forEach((svg) => {
      if (svg['userData'] && ignoreP.indexOf(svg) === -1) {
        if (svg['userData'].lineI && svg['userData'].tag === 'point') {
          const display = svg.getAttribute('display');
          if (display !== 'none') arrPoints.push(svg);
        }
        if (svg['userData'].lineI && svg['userData'].tag === 'dpoint') {
          const { line1 } = this.getElemsCorner(svg);
          if (!line1) arrPoints.push(svg);
        }
      }
    });
    if (arrPoints.length === 0) return;

    // ищем по массиву точек, с которой может быть пересечние
    const pos = this.getCoord(event);
    let minDist = Infinity;
    let svgCross = null;
    arrPoints.forEach((point) => {
      if (p2 !== point) {
        const cx = point.getAttribute('cx');
        const cy = point.getAttribute('cy');

        const dist = pos.distanceTo(new THREE.Vector2(cx, cy));
        if (dist < minDist) {
          minDist = dist;
          svgCross = point;
        }
      }
    });

    let resultCross = null;
    const svgCircle = svgCross;

    // нашли ближайшую точку с которой есть пересечение
    if (minDist < 10) {
      const cx = svgCircle.getAttribute('cx');
      const cy = svgCircle.getAttribute('cy');
      p2.setAttribute('cx', Number(cx));
      p2.setAttribute('cy', Number(cy));

      p2['userData'].crossOffset = true;

      const tag = svgCross['userData'].tag;
      let svgLine = null;

      if (p2['userData'].lines.length > 0) {
        svgLine = p2['userData'].lines[0];
        const ind = svgLine['userData'].p1 === p2 ? 1 : 2;
        svgLine.setAttribute('x' + ind, Number(cx));
        svgLine.setAttribute('y' + ind, Number(cy));

        if (type === 'mouseup') {
          let index = p2['userData'].lines.indexOf(svgLine);
          if (index > -1) p2['userData'].lines.splice(index, 1);
          p2.remove();

          if (ind === 1) {
            svgLine['userData'].p1 = svgCircle;
          } else {
            svgLine['userData'].p2 = svgCircle;
          }

          if (tag === 'point') svgCircle['userData'].lines.push(svgLine);

          if (svgLine['userData'].p1 === svgLine['userData'].p2) {
            this.deleteLine(svgLine);
          }
        }
      }

      resultCross = { tag, point: svgCircle, line: svgLine };
    } else if (p2['userData'].crossOffset) {
      p2['userData'].crossOffset = false;

      p2.setAttribute('cx', Number(pos.x));
      p2.setAttribute('cy', Number(pos.y));
    }

    return resultCross;
  }

  // перемещения угла
  updateCorner({ point }) {
    const arrPs = [];

    if (point['userData'].lines.length === 2) {
      const pCenter = point;
      const lines2 = pCenter['userData'].lines;
      if (lines2.length !== 2) return;

      const line1 = lines2[0];
      const line2 = lines2[1];

      this.addCorner({ line1, line2, pCenter });
      this.delCorner({ line1, line2, pCenter });
    }

    point['userData'].lines.forEach((line) => {
      const p1 = line['userData'].p1;
      const p2 = line['userData'].p2;

      const pCenter = point !== p1 ? p1 : p2;
      const lines2 = pCenter['userData'].lines;
      if (lines2.length !== 2) return;

      const line1 = lines2[0];
      const line2 = lines2[1];

      this.addCorner({ line1, line2, pCenter });
      this.delCorner({ line1, line2, pCenter });
    });
  }

  delCorner({ line1, line2, pCenter }) {
    const degree = this.getAngleLines({ line1, line2, pCenter });
    const res1 = this.getCoordPointOnLine({ line: line1, pCenter });
    const res2 = this.getCoordPointOnLine({ line: line2, pCenter });

    let stop = true;
    if (degree > 150 || res1.dist < 40 || res2.dist < 40) stop = false;
    if (stop) return;

    let ind1 = res1.ind;
    let ind2 = res2.ind;
    const cx = Number(pCenter.getAttribute('cx'));
    const cy = Number(pCenter.getAttribute('cy'));

    let pd1 = ind1 === 1 ? line1['userData'].pd1 : line1['userData'].pd2;
    let pd2 = ind2 === 1 ? line2['userData'].pd1 : line2['userData'].pd2;

    let ld1 = ind1 === 1 ? line1['userData'].ld1 : line1['userData'].ld2;
    let ld2 = ind2 === 1 ? line2['userData'].ld1 : line2['userData'].ld2;

    if (!pd1 && !pd2) return;

    if (pd1) {
      pd1.remove();
      ld1.remove();
      line1['userData']['ld' + ind1] = null;
      line1['userData']['pd' + ind1] = null;
    }

    if (pd2) {
      pd2.remove();
      ld2.remove();
      line2['userData']['ld' + ind2] = null;
      line2['userData']['pd' + ind2] = null;
    }

    let index = pCenter['userData'].pds.indexOf(pd1);
    if (index > -1) pCenter['userData'].pds.splice(index, 1);

    index = pCenter['userData'].pds.indexOf(pd2);
    if (index > -1) pCenter['userData'].pds.splice(index, 1);

    line1.setAttribute('x' + ind1, cx);
    line1.setAttribute('y' + ind1, cy);
    line2.setAttribute('x' + ind2, cx);
    line2.setAttribute('y' + ind2, cy);

    pCenter.setAttribute('display', '');
  }

  clearSelectedObj() {
    this.selectedObj.el = null;
    this.selectedObj.type = '';
  }

  actElem(svg, act = false) {
    const stroke = !act ? 'rgb(0, 0, 0)' : '#ff0000';

    if (svg['userData'].tag === 'line') {
      svg.setAttribute('stroke', stroke);
    } else if (svg['userData'].tag === 'point') {
      svg.setAttribute('stroke', stroke);
      svg.setAttribute('fill', stroke);
    } else if (svg['userData'].tag === 'dline') {
      this.actCorner(svg, act);
    } else if (svg['userData'].tag === 'dpoint') {
      this.actCorner(svg, act);
    } else {
      return;
    }

    if (act) {
      this.selectedObj.el = svg;
    } else {
      this.clearSelectedObj();
    }
  }

  actCorner(svg, act = false) {
    const stroke = !act ? 'rgb(0, 0, 0)' : '#ff0000';

    const { ld1, ld2, pd1, pd2, pCenter } = this.getElemsCorner(svg);

    svg.setAttribute('stroke', stroke);

    if (pd1) {
      pd1.setAttribute('stroke', stroke);
      pd1.setAttribute('fill', stroke);
    }
    if (pd2) {
      pd2.setAttribute('stroke', stroke);
      pd2.setAttribute('fill', stroke);
    }
    if (pCenter) {
      const display = act ? '' : 'none';
      pCenter.setAttribute('display', display);
      pCenter.setAttribute('stroke', stroke);
      pCenter.setAttribute('fill', stroke);
    }
    if (ld1) {
      ld1.setAttribute('stroke', stroke);
    }
    if (ld2) {
      ld2.setAttribute('stroke', stroke);
    }
  }

  // получаем элементы угла
  getElemsCorner(svg) {
    let pd = null;
    let ld = null;
    let po = null;

    const elems = { ld1: null, ld2: null, pd1: null, pd2: null, pCenter: null, line1: null, line2: null };

    if (svg['userData'].tag === 'dpoint') {
      pd = svg;
    }
    if (svg['userData'].tag === 'dline') {
      ld = svg;
    }
    if (svg['userData'].tag === 'point') {
      po = svg;
    }

    if (pd) {
      elems.pd1 = pd;
      elems.ld1 = elems.pd1['userData'].ld;
      elems.line1 = elems.ld1['userData'].line;
      elems.pCenter = elems.ld1['userData'].pCenter;
      elems.pd2 = elems.pCenter['userData'].pds[0] === elems.pd1 ? elems.pCenter['userData'].pds[1] : elems.pCenter['userData'].pds[0];
      elems.ld2 = elems.pd2['userData'].ld;
      elems.line2 = elems.ld2['userData'].line;
    }
    if (ld) {
      elems.ld1 = ld;
      elems.pd1 = elems.ld1['userData'].pd;
      elems.pCenter = elems.ld1['userData'].pCenter;
      elems.line1 = elems.ld1['userData'].line;
      elems.pd2 = elems.pCenter['userData'].pds[0] === elems.pd1 ? elems.pCenter['userData'].pds[1] : elems.pCenter['userData'].pds[0];
      elems.ld2 = elems.pd2['userData'].ld;
      elems.line2 = elems.ld2['userData'].line;
    }
    if (po) {
      elems.pCenter = po;
      elems.pd1 = po['userData'].pds[0];
      if (elems.pd1) {
        elems.ld1 = elems.pd1['userData'].ld;
        elems.line1 = elems.ld1['userData'].line;
      }
      elems.pd2 = po['userData'].pds[1];
      if (elems.pd1) {
        elems.ld2 = elems.pd2['userData'].ld;
        elems.line2 = elems.ld2['userData'].line;
      }
    }

    return elems;
  }

  stopLine(del = true) {
    if (this.newNote.type !== 'move') return;
    if (!this.newNote.line) return;

    this.newNote.arr.l.forEach((line) => {
      line.setAttribute('stroke', 'rgb(0, 0, 0)');

      const ld1 = line['userData'].ld1;
      const ld2 = line['userData'].ld2;

      if (ld1) {
        this.actCorner(ld1, false);
      }
      if (ld2) {
        this.actCorner(ld2, false);
      }
    });

    this.newNote.arr.p.forEach((item) => {
      item.setAttribute('stroke', 'rgb(0, 0, 0)');
      item.setAttribute('fill', 'rgb(0, 0, 0)');
    });

    const line = this.newNote.line;

    this.newNote.type = '';
    this.newNote.line = null;
    this.newNote.p2 = null;
    this.newNote.arr.l = [];
    this.newNote.arr.p = [];

    if (!del) return;

    const p1 = line['userData'].p1;
    const p2 = line['userData'].p2;

    let index = p1['userData'].lines.indexOf(line);
    if (index > -1) p1['userData'].lines.splice(index, 1);

    line.remove();
    if (p2) p2.remove();
    if (p1 && p1['userData'].lines.length === 0) p1.remove();
  }

  moveOffset(offset) {
    const arrLines = [];
    const arrPoints = [];

    this.groupLines.childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI && svg['userData'].tag === 'line') {
          arrLines.push(svg);
        }
      }
    });

    arrLines.forEach((svg) => {
      const offsetX = offset.x;
      const offsetY = offset.y;

      const x1 = svg.getAttribute('x1');
      const y1 = svg.getAttribute('y1');
      const x2 = svg.getAttribute('x2');
      const y2 = svg.getAttribute('y2');

      svg.setAttribute('x1', Number(x1) + offsetX);
      svg.setAttribute('y1', Number(y1) + offsetY);
      svg.setAttribute('x2', Number(x2) + offsetX);
      svg.setAttribute('y2', Number(y2) + offsetY);

      const p1 = svg['userData'].p1;
      const p2 = svg['userData'].p2;

      if (!p1['userData'].move) this.moveSvgPoint({ svg: p1, offset, stopLine: svg });
      if (!p2['userData'].move) this.moveSvgPoint({ svg: p2, offset, stopLine: svg });

      p1['userData'].move = true;
      p2['userData'].move = true;

      arrPoints.push(p1, p2);
    });

    arrPoints.forEach((p) => {
      p['userData'].move = false;
    });
  }

  scale(canvas, ratio, bound2) {
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

  // старый метод, оставил как шпаргалку
  scale2(canvas, ratio, bound2) {
    const arrLines = [];
    const arrPoints = [];

    this.groupLines.childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI && svg['userData'].tag === 'line') {
          arrLines.push(svg);
        }
      }
    });

    const bound = canvas.getBoundingClientRect();
    const boundC = this.container.getBoundingClientRect();

    arrLines.forEach((svg) => {
      const x1 = svg.getAttribute('x1');
      const y1 = svg.getAttribute('y1');
      const x2 = svg.getAttribute('x2');
      const y2 = svg.getAttribute('y2');

      const nx1 = (x1 - bound2.x) * ratio + bound.x;
      const ny1 = (y1 - bound2.y) * ratio + bound.y + (boundC.y * ratio - boundC.y);
      const nx2 = (x2 - bound2.x) * ratio + bound.x;
      const ny2 = (y2 - bound2.y) * ratio + bound.y + (boundC.y * ratio - boundC.y);

      svg.setAttribute('x1', Number(nx1));
      svg.setAttribute('y1', Number(ny1));
      svg.setAttribute('x2', Number(nx2));
      svg.setAttribute('y2', Number(ny2));

      const offset1 = new THREE.Vector2(nx1 - x1, ny1 - y1);
      const offset2 = new THREE.Vector2(nx2 - x2, ny2 - y2);

      const p1 = svg['userData'].p1;
      const p2 = svg['userData'].p2;

      if (p1 && !p1['userData'].move) {
        const svgCircle = p1;
        const offsetX = offset1.x;
        const offsetY = offset1.y;

        const cx = svgCircle.getAttribute('cx');
        const cy = svgCircle.getAttribute('cy');

        svgCircle.setAttribute('cx', Number(cx) + offsetX);
        svgCircle.setAttribute('cy', Number(cy) + offsetY);
      }

      if (p2 && !p2['userData'].move) {
        const svgCircle = p2;
        const offsetX = offset2.x;
        const offsetY = offset2.y;

        const cx = svgCircle.getAttribute('cx');
        const cy = svgCircle.getAttribute('cy');

        svgCircle.setAttribute('cx', Number(cx) + offsetX);
        svgCircle.setAttribute('cy', Number(cy) + offsetY);
      }

      p1['userData'].move = true;
      p2['userData'].move = true;

      arrPoints.push(p1, p2);
    });

    arrPoints.forEach((p) => {
      p['userData'].move = false;
    });
  }

  // удаляем активную выноску
  deleteObj(svg = null) {
    if (!svg) {
      if (!this.containerSvg) return;
      if (!this.selectedObj.el) return;

      svg = this.selectedObj.el;
    }

    if (svg['userData'].tag === 'line') {
      this.deleteLine(svg);
    }

    if (svg['userData'].tag === 'point') {
      const result = this.deletePoint(svg);
      if (!result) return;
    }

    if (svg['userData'].tag === 'dline') {
      this.actElem(svg);
      this.deleteCorner(svg);
    }

    this.clearSelectedObj();
  }

  deleteLine(line) {
    const p1 = line['userData'].p1;
    const p2 = line['userData'].p2;
    const ld1 = line['userData'].ld1;
    const ld2 = line['userData'].ld2;

    if (ld1) ld1['userData'].line = null;
    if (ld2) ld2['userData'].line = null;

    let index = p1['userData'].lines.indexOf(line);
    if (index > -1) p1['userData'].lines.splice(index, 1);

    index = p2['userData'].lines.indexOf(line);
    if (index > -1) p2['userData'].lines.splice(index, 1);

    line.remove();
    if (p1['userData'].lines.length === 0) p1.remove();
    if (p2['userData'].lines.length === 0) p2.remove();
  }

  // удаляем точку и линии к ней относящиеся
  deletePoint(point) {
    const lines = point['userData'].lines;

    if (lines.length > 2) return;

    const arrPoints = [];

    // находим у линии соседние точки, которые не удаляются
    lines.forEach((line) => {
      let p = null;

      if (line['userData'].p1 === point) {
        line['userData'].p1 = null;
        p = line['userData'].p2;
      }
      if (line['userData'].p2 === point) {
        line['userData'].p2 = null;
        p = line['userData'].p1;
      }

      // удаляем у соседней точки инфорамацию, об удаляемой линии
      if (p) {
        let index = p['userData'].lines.indexOf(line);
        if (index > -1) p['userData'].lines.splice(index, 1);
        arrPoints.push(p);
      }

      const ld1 = line['userData'].ld1;
      const ld2 = line['userData'].ld2;

      if (ld1) ld1['userData'].line = null;
      if (ld2) ld2['userData'].line = null;

      // удаляем линию
      line.remove();
    });

    point.remove();

    // создаем линию между 2 точками
    if (arrPoints.length === 2) {
      const p1 = arrPoints[0];
      const p2 = arrPoints[1];
      const x1 = p1.getAttribute('cx');
      const y1 = p1.getAttribute('cy');
      const x2 = p2.getAttribute('cx');
      const y2 = p2.getAttribute('cy');

      const line = this.createSvgLine({ x1, y1, x2, y2 });
      this.groupLines.append(line);

      line['userData'].p1 = p1;
      line['userData'].p2 = p2;
      p1['userData'].lines.push(line);
      p2['userData'].lines.push(line);

      //--------

      [p1, p2].forEach((pCenter, i) => {
        const { pd1, ld1, pd2, ld2 } = this.getElemsCorner(pCenter);

        const res1 = this.getCoordPointOnLine({ line, pCenter });
        const ind1 = res1.ind;

        let pd = null;
        let ld = null;

        if (ind1 === 1) {
          pd = pd1;
          ld = ld1;
        }
        if (ind1 === 2) {
          pd = pd2;
          ld = ld2;
        }

        if (pd && ld) {
          line['userData']['ld' + ind1] = ld;
          line['userData']['pd' + ind1] = pd;

          this.moveSvgPoint({ svg: pCenter, offset: new THREE.Vector2() });
        }
      });
    }

    arrPoints.forEach((p) => {
      if (p['userData'].lines.length === 0) p.remove();
    });

    return true;
  }

  // удаляем угол
  deleteCorner(elem) {
    let ld1 = null;
    let ld2 = null;
    let pd1 = null;
    let pd2 = null;
    let pCenter = null;
    let line1 = null;
    let line2 = null;

    if (elem['userData'].tag === 'dline') {
      ld1 = elem;
      ld2 = elem['userData'].ld;
      pd1 = ld1['userData'].pd;
      pd2 = ld2['userData'].pd;
      pCenter = elem['userData'].pCenter;

      line1 = ld1['userData'].line;
      line2 = ld2['userData'].line;
    }

    if (line1) {
      const ind1 = line1['userData'].pd1 === pd1 ? 1 : 2;

      line1['userData']['ld' + ind1] = null;
      line1['userData']['pd' + ind1] = null;

      const cx1 = Number(pd1.getAttribute('cx'));
      const cy1 = Number(pd1.getAttribute('cy'));
      const newP1 = this.createSvgCircle({ ind: 0, x: cx1, y: cy1 });
      this.groupLines.append(newP1);
      newP1['userData'].lines.push(line1);

      if (ind1 === 1) {
        line1['userData'].p1 = newP1;
      } else {
        line1['userData'].p2 = newP1;
      }
    }

    if (line2) {
      const ind2 = line2['userData'].pd1 === pd2 ? 1 : 2;

      line2['userData']['ld' + ind2] = null;
      line2['userData']['pd' + ind2] = null;

      const cx2 = Number(pd2.getAttribute('cx'));
      const cy2 = Number(pd2.getAttribute('cy'));
      const newP2 = this.createSvgCircle({ ind: 0, x: cx2, y: cy2 });
      this.groupLines.append(newP2);
      newP2['userData'].lines.push(line2);

      if (ind2 === 1) {
        line2['userData'].p1 = newP2;
      } else {
        line2['userData'].p2 = newP2;
      }
    }

    pCenter.remove();
    pd1.remove();
    pd2.remove();
    ld1.remove();
    ld2.remove();
  }
}
