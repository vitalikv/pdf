import * as THREE from 'three';

export class IsometricSvgLine {
  container;
  containerSvg;
  arrLine = [];
  isDown = false;
  newNote = { type: '', line: null, p2: null, arr: { l: [], p: [] } };
  offset = new THREE.Vector2();
  selectedObj = { el: null, type: '' };

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
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
      this.addCorner({ line1, line2, pCenter });
    }

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  }

  // угол между линиями
  getAngleLines({ line1, line2, pCenter }) {
    const cxC = Number(pCenter.getAttribute('cx'));
    const cyC = Number(pCenter.getAttribute('cy'));

    let pos1 = new THREE.Vector2();
    let pos2 = new THREE.Vector2();

    if (line1) {
      const p1 = line1['userData'].p1;
      const p2 = line1['userData'].p2;
      const cx1 = Number(p1.getAttribute('cx'));
      const cy1 = Number(p1.getAttribute('cy'));
      const cx2 = Number(p2.getAttribute('cx'));
      const cy2 = Number(p2.getAttribute('cy'));
      const dist1 = new THREE.Vector2(cxC, cyC).distanceTo(new THREE.Vector2(cx1, cy1));
      const dist2 = new THREE.Vector2(cxC, cyC).distanceTo(new THREE.Vector2(cx2, cy2));

      pos1 = dist1 > dist2 ? new THREE.Vector2(cx1, cy1) : new THREE.Vector2(cx2, cy2);
    }

    if (line2) {
      const p1 = line2['userData'].p1;
      const p2 = line2['userData'].p2;
      const cx1 = Number(p1.getAttribute('cx'));
      const cy1 = Number(p1.getAttribute('cy'));
      const cx2 = Number(p2.getAttribute('cx'));
      const cy2 = Number(p2.getAttribute('cy'));
      const dist1 = new THREE.Vector2(cxC, cyC).distanceTo(new THREE.Vector2(cx1, cy1));
      const dist2 = new THREE.Vector2(cxC, cyC).distanceTo(new THREE.Vector2(cx2, cy2));

      pos2 = dist1 > dist2 ? new THREE.Vector2(cx1, cy1) : new THREE.Vector2(cx2, cy2);
    }

    const dir1 = new THREE.Vector2(cxC, cyC).sub(pos1).normalize();
    const dir2 = new THREE.Vector2(cxC, cyC).sub(pos2).normalize();

    const rad = this.angleTo(dir1, dir2);
    const deg = THREE.MathUtils.radToDeg(rad);

    return deg % 180;
  }

  angleTo(v1, v2) {
    const denominator = Math.sqrt(v1.lengthSq() * v2.lengthSq());
    if (denominator === 0) return Math.PI / 2;
    const theta = v1.dot(v2) / denominator;
    return Math.acos(THREE.MathUtils.clamp(theta, -1, 1));
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
  getCoordPointOnLine({ line, ind, pCenter = null }) {
    const pos = this.getCoordLine(line);

    let pos1 = pos.a;
    let pos2 = pos.b;

    if (pCenter) {
      const cx = Number(pCenter.getAttribute('cx'));
      const cy = Number(pCenter.getAttribute('cy'));
      const dist1 = new THREE.Vector2(cx, cy).distanceTo(pos1);
      const dist2 = new THREE.Vector2(cx, cy).distanceTo(pos2);

      if (dist1 < dist2) {
        pos1 = pos.a;
        pos2 = pos.b;
        ind = 1;
      } else {
        pos1 = pos.b;
        pos2 = pos.a;
        ind = 2;
      }
    } else if (ind === 1) {
      pos1 = pos.b;
      pos2 = pos.a;
    }

    const dir = pos2.clone().sub(pos1).normalize();
    const dist = pos2.distanceTo(pos1);
    const offset = new THREE.Vector2().addScaledVector(dir, 20);
    const posPoint = pos1.clone().add(offset);

    //const pos2 = new THREE.Vector3().subVectors(pos2, pos1).divideScalar(2).add(pos1);

    return { ind, pos: posPoint, dist, pos1: pos.a, pos2: pos.b };
  }

  addNextLine(event) {
    if (this.newNote.type !== 'move') return;

    const p2 = this.newNote.p2;

    const result = this.svgPointCross({ p2, event, type: 'mouseup' });
    if (result) {
      this.addCorner({ line1: result.line1, line2: result.line2, pCenter: result.pCenter });
      this.stopLine(false);
      return true;
    }

    this.addLine(event, p2);

    return false;
  }

  // создаем автоматический угол
  addCorner({ line1, line2, pCenter }) {
    const degree = this.getAngleLines({ line1, line2, pCenter });

    if (degree > 150 || degree < 10) return;

    const res1 = this.getCoordPointOnLine({ line: line1, ind: 1, pCenter });
    const res2 = this.getCoordPointOnLine({ line: line2, ind: 2, pCenter });

    if (res1.dist > 40 && res2.dist > 40) {
      // создаем 2 точки перед углом
      const pd2 = this.createSvgCircle({ ind: 0, x: res1.pos.x, y: res1.pos.y });
      const pd1 = this.createSvgCircle({ ind: 0, x: res2.pos.x, y: res2.pos.y });
      this.containerSvg.children[0].append(pd1);
      this.containerSvg.children[0].append(pd2);

      // создаем 2 линии для угла
      const x = Number(pCenter.getAttribute('cx'));
      const y = Number(pCenter.getAttribute('cy'));
      const ld2 = this.createSvgLine({ x1: res1.pos.x, y1: res1.pos.y, x2: x, y2: y, stroke: '#ff0000' });
      const ld1 = this.createSvgLine({ x1: res2.pos.x, y1: res2.pos.y, x2: x, y2: y, stroke: '#ff0000' });
      this.containerSvg.children[0].append(ld1);
      this.containerSvg.children[0].append(ld2);

      let _pd2 = pd2;
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
      ld1['userData'].pd1 = pd1;
      ld1['userData'].pd2 = pd2;

      ld2['userData'].tag = 'dline';
      ld2['userData'].pCenter = pCenter;
      ld2['userData'].ld = ld1;
      ld2['userData'].line = line1;
      ld2['userData'].pd1 = pd1;
      ld2['userData'].pd2 = pd2;

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
    const p1 = ps1 ? ps1 : this.createSvgCircle({ ind: 0, x: x1, y: y1 });
    const p2 = this.createSvgCircle({ ind: 0, x: x1, y: y1 });

    this.containerSvg.children[0].append(line);
    if (!ps1) this.containerSvg.children[0].append(p1);
    this.containerSvg.children[0].append(p2);

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

    return svg;
  }

  // создаем svg точки
  createSvgCircle({ ind, x, y, r = 3.2 }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);

    svg.setAttribute('r', r);
    svg.setAttribute('stroke-width', '2px');
    svg.setAttribute('stroke', '#ff0000');
    svg.setAttribute('transform-origin', 'center');

    svg.setAttribute('fill', '#ff0000');
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
    const bound = this.container.getBoundingClientRect();
    const x = -bound.x + event.clientX;
    const y = -bound.y + event.clientY;

    return new THREE.Vector2(x, y);
  }

  onmousedown = (event) => {
    if (!this.containerSvg) return;

    if (this.selectedObj.el) this.actElem(this.selectedObj.el);

    this.isDown = false;

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData'] && svg['userData'].lineI && svg.contains(event.target)) {
        this.isDown = true;
        this.actElem(svg, true);
      }
    });

    this.offset = new THREE.Vector2(event.clientX, event.clientY);

    return this.isDown;
  };

  // перемещение svg
  onmousemove = (event) => {
    if (this.newNote.type === 'move') {
      const svgCircle = this.newNote.p2;
      const svgLine = this.newNote.line;

      const offsetX = event.clientX - this.offset.x;
      const offsetY = event.clientY - this.offset.y;

      const cx = svgCircle.getAttribute('cx');
      const cy = svgCircle.getAttribute('cy');
      svgCircle.setAttribute('cx', Number(cx) + offsetX);
      svgCircle.setAttribute('cy', Number(cy) + offsetY);

      const cx2 = svgCircle.getAttribute('cx');
      const cy2 = svgCircle.getAttribute('cy');
      svgLine.setAttribute('x2', Number(cx2));
      svgLine.setAttribute('y2', Number(cy2));

      this.svgPointCross({ p2: svgCircle, event });

      this.offset = new THREE.Vector2(event.clientX, event.clientY);
    }

    if (!this.isDown) return;

    const svg = this.selectedObj.el;
    if (!svg) return;

    const offsetX = event.clientX - this.offset.x;
    const offsetY = event.clientY - this.offset.y;
    const offset = new THREE.Vector2(offsetX, offsetY);

    if (svg['userData'].tag === 'line') {
      this.moveSvgLine({ svg, offset });
    }

    if (svg['userData'].tag === 'point') {
      this.moveSvgPoint({ svg, offset });
      this.svgPointCross({ p2: svg, event });
    }

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    if (!this.isDown) return;
    this.isDown = false;

    const svg = this.selectedObj.el;
    if (!svg) return;

    if (svg['userData'].tag === 'point') {
      const result = this.svgPointCross({ p2: svg, event, type: 'mouseup' });

      if (result) {
        this.addCorner({ line1: result.line1, line2: result.line2, pCenter: result.pCenter });

        if (result.line1['userData'].ld1) {
          this.actElem(result.line1['userData'].ld1, false);
        } else if (result.line1['userData'].ld2) {
          this.actElem(result.line1['userData'].ld2, false);
        }
      }
    }
  };

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

    const cx = svgCircle.getAttribute('cx');
    const cy = svgCircle.getAttribute('cy');

    svgCircle.setAttribute('cx', Number(cx) + offsetX);
    svgCircle.setAttribute('cy', Number(cy) + offsetY);

    const arrPds = [];

    svg['userData'].lines.forEach((svgLine) => {
      if (stopLine !== svgLine) {
        const coord = this.getCoordLine(svgLine);
        svgLine.setAttribute('x1', coord.a.x);
        svgLine.setAttribute('y1', coord.a.y);
        svgLine.setAttribute('x2', coord.b.x);
        svgLine.setAttribute('y2', coord.b.y);
      }

      if (svgLine['userData'].pd1) {
        const svgCircle = svgLine['userData'].pd1;
        const svgLd = svgLine['userData'].ld1;
        const pos = this.getCoordPointOnLine({ line: svgLine, ind: 2 });

        svgCircle.setAttribute('cx', pos.pos.x);
        svgCircle.setAttribute('cy', pos.pos.y);

        if (svgLd) {
          svgLd.setAttribute('x1', pos.pos.x);
          svgLd.setAttribute('y1', pos.pos.y);
          svgLd.setAttribute('x2', pos.pos1.x);
          svgLd.setAttribute('y2', pos.pos1.y);
        }

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

        if (svgLd) {
          svgLd.setAttribute('x1', pos.pos.x);
          svgLd.setAttribute('y1', pos.pos.y);
          svgLd.setAttribute('x2', pos.pos2.x);
          svgLd.setAttribute('y2', pos.pos2.y);
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

        const cx = svgCircle.getAttribute('cx');
        const cy = svgCircle.getAttribute('cy');
        svgCircle.setAttribute('cx', Number(cx) + offsetX);
        svgCircle.setAttribute('cy', Number(cy) + offsetY);

        const x1 = svgLd.getAttribute('x1');
        const y1 = svgLd.getAttribute('y1');
        const x2 = svgLd.getAttribute('x2');
        const y2 = svgLd.getAttribute('y2');

        svgLd.setAttribute('x1', Number(x1) + offsetX);
        svgLd.setAttribute('y1', Number(y1) + offsetY);
        svgLd.setAttribute('x2', Number(x2) + offsetX);
        svgLd.setAttribute('y2', Number(y2) + offsetY);
      }
    });
  }

  // пересечение перетаскиваемой точки с другой точкой
  svgPointCross({ p2, event, type = '' }) {
    // у точки должна быть одна линия, то есть это точка начало/конец трубы
    if (p2['userData'].lines.length !== 1) return;

    // находим все точки на листе
    const arrPoints = [];
    this.containerSvg.children[0].childNodes.forEach((svg) => {
      if (svg['userData']) {
        if (svg['userData'].lineI && svg['userData'].tag === 'point') {
          arrPoints.push(svg);
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

      const svgLine = p2['userData'].lines[0];
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

        svgCircle['userData'].lines.push(svgLine);

        if (svgLine['userData'].p1 === svgLine['userData'].p2) {
          this.deleteLine(svgLine);
        }
      }

      resultCross = { line1: svgCircle['userData'].lines[0], line2: svgCircle['userData'].lines[1], pCenter: svgCircle };
    } else if (p2['userData'].crossOffset) {
      p2['userData'].crossOffset = false;

      p2.setAttribute('cx', Number(pos.x));
      p2.setAttribute('cy', Number(pos.y));
    }

    return resultCross;
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

    const pd1 = svg['userData'].pd1;
    const pd2 = svg['userData'].pd2;
    const pCenter = svg['userData'].pCenter;
    const ld = svg['userData'].ld;

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
    if (ld) {
      ld.setAttribute('stroke', stroke);
    }
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
  }

  moveOffset(offset) {
    const arrLines = [];
    const arrPoints = [];

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
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

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
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

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
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
  deleteObj() {
    if (!this.containerSvg) return;
    if (!this.selectedObj.el) return;

    const svg = this.selectedObj.el;

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
      this.containerSvg.children[0].append(line);

      line['userData'].p1 = p1;
      line['userData'].p2 = p2;
      p1['userData'].lines.push(line);
      p2['userData'].lines.push(line);
    }

    arrPoints.forEach((p) => {
      if (p['userData'].lines.length === 0) p.remove();
    });

    return true;
  }

  // удаляем угол
  deleteCorner(elem) {
    const elems = { l1: null, l2: null, line1: null, line2: null };

    if (elem['userData'].tag === 'dline') {
      elems.l1 = elem;
      elems.l2 = elem['userData'].ld;

      elems.line1 = elems.l1['userData'].line;
      elems.line2 = elems.l2['userData'].line;
    }

    if (elems.line1['userData'].ld1 === elems.l1) {
      elems.line1['userData'].ld1 = null;
    } else if (elems.line1['userData'].ld2 === elems.l1) {
      elems.line1['userData'].ld2 = null;
    }

    if (elems.line2['userData'].ld1 === elems.l2) {
      elems.line2['userData'].ld1 = null;
    } else if (elems.line2['userData'].ld2 === elems.l2) {
      elems.line2['userData'].ld2 = null;
    }

    elems.l1.remove();
    elems.l2.remove();
  }
}
