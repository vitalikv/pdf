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

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  }

  addNextLine(event) {
    if (this.newNote.type !== 'move') return;

    const p2 = this.newNote.p2;

    const cross = this.svgPointCross({ p2, event, type: 'mouseup' });
    if (cross) {
      this.stopLine(false);
      return true;
    }

    this.addLine(event, p2);

    return false;
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

    if (svg['userData'].tag === 'point') {
      this.svgPointCross({ p2: svg, event, type: 'mouseup' });
    }
  };

  moveSvgLine({ svg, offset }) {
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

    this.moveSvgPoint({ svg: svg['userData'].p1, offset, stopLine: svg });
    this.moveSvgPoint({ svg: svg['userData'].p2, offset, stopLine: svg });
  }

  moveSvgPoint({ svg, offset, stopLine = null, type = 'def' }) {
    const svgCircle = svg;
    const offsetX = offset.x;
    const offsetY = offset.y;

    const cx = svgCircle.getAttribute('cx');
    const cy = svgCircle.getAttribute('cy');

    svgCircle.setAttribute('cx', Number(cx) + offsetX);
    svgCircle.setAttribute('cy', Number(cy) + offsetY);

    if (type === 'def') {
      const x = svgCircle.getAttribute('cx');
      const y = svgCircle.getAttribute('cy');

      svg['userData'].lines.forEach((svgLine) => {
        if (stopLine !== svgLine) {
          const ind = svgLine['userData'].p1 === svgCircle ? 1 : 2;

          svgLine.setAttribute('x' + ind, Number(x));
          svgLine.setAttribute('y' + ind, Number(y));
        }
      });
    }
  }

  // пересечение перетаскиваемой точки с другой точкой
  svgPointCross({ p2, event, type }) {
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

    let resultCross = false;
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

      resultCross = true;
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
    } else {
      return;
    }

    if (act) {
      this.selectedObj.el = svg;
    } else {
      this.clearSelectedObj();
    }
  }

  stopLine(del = true) {
    if (this.newNote.type !== 'move') return;
    if (!this.newNote.line) return;

    this.newNote.arr.l.forEach((item) => {
      item.setAttribute('stroke', 'rgb(0, 0, 0)');
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

      if (!p1['userData'].move) this.moveSvgPoint({ svg: p1, offset, stopLine: svg, type: 'offsetPdf' });
      if (!p2['userData'].move) this.moveSvgPoint({ svg: p2, offset, stopLine: svg, type: 'offsetPdf' });

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
}
