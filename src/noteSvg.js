import * as THREE from 'three';

import { mapControlInit, isometricSvgManager } from './index';

export class IsometricNoteSvg {
  container;
  containerSvg;
  newNote = { add: false, data: null };
  isDown = false;
  offset = new THREE.Vector2();
  selectedObj = { el: null, type: '' };

  constructor() {
    //this.addNote();
  }

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
  }

  addNote(event, data) {
    this.clearSelectedObj();

    if (event.button === 0) {
      const bound = this.container.getBoundingClientRect();
      const x = -bound.x + event.clientX;
      const y = -bound.y + event.clientY;

      this.createElement({ btn: true, x, y, data });
    }
  }

  // создать выноску
  createElement({ btn = false, x, y, data }) {
    let x1 = 600;
    let y1 = 600;
    let x2 = 400;
    let y2 = 400;

    const id = data.passport.id;

    if (btn) {
      x1 = x;
      y1 = y;
      x2 = x;
      y2 = y;
    }

    const svg1 = this.createSvgLine({ x1, y1, x2, y2 });
    const svg2 = this.createSvgCircle({ ind: 0, x: x1, y: y1 });
    const svg3 = this.createSvgLabel({ ind: 0, x: x2, y: y2, r: 60, text: data.text });

    svg1.setAttribute('id', id);
    svg2.setAttribute('id', id);
    svg3.setAttribute('id', id);

    this.containerSvg.children[0].append(svg1);
    this.containerSvg.children[0].append(svg2);
    this.containerSvg.children[0].append(svg3);

    svg1['userData'] = { note1: true, tag: 'line', lock: false, line: svg1, point: svg2, label: svg3 };
    svg2['userData'] = { note1: true, tag: 'point', lock: false, line: svg1, point: svg2, label: svg3, crossOffset: false, link: null };
    svg3['userData'] = { note1: true, tag: 'label', lock: false, line: svg1, point: svg2, label: svg3, ...svg3['userData'] };

    return { svg1, svg2, svg3 };
  }

  // создаем svg точки
  createSvgCircle({ ind, x, y, r = 4.2 }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);

    svg.setAttribute('r', r);
    svg.setAttribute('stroke-width', '2px');
    svg.setAttribute('stroke', 'rgb(0, 0, 0)');
    svg.setAttribute('transform-origin', 'center');

    svg.setAttribute('fill', '#fff');
    svg.setAttribute('ind', ind);

    svg.setAttributeNS(null, 'style', 'transform: translateX(0) translateY(0);');
    //svg.setAttribute('display', 'none');

    return svg;
  }

  // создаем svg line елемент
  createSvgLine({ x1, y1, x2, y2 }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'line');

    svg.setAttribute('x1', x1);
    svg.setAttribute('y1', y1);
    svg.setAttribute('x2', x2);
    svg.setAttribute('y2', y2);
    svg.setAttribute('stroke-width', '2px');
    //svg.setAttribute('stroke', 'rgb(255, 162, 23)');
    svg.setAttribute('stroke', 'rgb(0, 0, 0)');
    //svg.setAttribute('display', 'none');

    return svg;
  }

  // добавляем text
  createSvgText({ x, y, fontSize = '16', txt = '' }) {
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    elem.setAttribute('x', x);
    elem.setAttribute('y', Number(y) - 10);
    elem.setAttribute('textLength', '110');
    //elem.setAttribute('lengthAdjust', ' spacingAndGlyphs');
    //elem.setAttribute('transform', 'rotate(' + rot + ', ' + (bbox.x + bbox.width / 2) + ',' + (bbox.y + bbox.height / 2) + ')');

    elem.setAttribute('dominant-baseline', 'middle');
    elem.setAttribute('text-anchor', 'middle');
    elem.setAttribute('font-size', fontSize);
    elem.setAttribute('font-family', 'Gostcadkk');
    elem.setAttribute('color', '#000000');
    //elem.style.cursor = 'pointer';

    elem.textContent = txt;

    return elem;
  }

  createSvgLabel({ ind, x, y, r, text }) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    //g.setAttribute('fill', 'none');

    const svgCircle = this.createSvgCircle({ ind: 0, x, y, r });
    const svgLine = this.createSvgLine({ x1: -r + x, y1: 0 + y, x2: r + x, y2: 0 + y });
    const svgText1 = text[0] !== '' ? this.createSvgText({ x, y: Number(y) - 0, txt: text[0] }) : null;
    const svgText2 = text[1] !== '' ? this.createSvgText({ x, y: Number(y) + 20, txt: text[1] }) : null;

    g.append(svgCircle);
    g.append(svgLine);
    g.append(svgText1);
    g.append(svgText2);

    g['userData'] = { svgCircle, svgLine, svgText1, svgText2 };

    this.containerSvg.children[0].append(g);

    return g;
  }

  onmousedown = (event) => {
    if (this.selectedObj.el) this.actElem(this.selectedObj.el);

    this.isDown = false;

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData'] && svg['userData'].note1 && svg.contains(event.target)) {
        if (!svg['userData'].lock) {
          this.isDown = true;
          this.actElem(svg, true);
        }

        if (svg['userData'].tag === 'point' && event.button !== 0) {
          this.setLockOnSvg(svg);
        }
      }
    });

    this.offset = new THREE.Vector2(event.clientX, event.clientY);

    return this.isDown;
  };

  // перемещение svg
  onmousemove = (event) => {
    if (!this.isDown) return;

    let svg = this.selectedObj.el;
    const offsetX = event.clientX - this.offset.x;
    const offsetY = event.clientY - this.offset.y;
    const offset = new THREE.Vector2(offsetX, offsetY);

    if (svg['userData'].tag === 'line') {
      this.moveSvgLine({ svg, offset });
    }

    if (svg['userData'].tag === 'point') {
      this.moveSvgPoint({ svg, offset });
      this.addLink({ svgPoint: svg, event });
    }

    if (svg['userData'].tag === 'label') {
      this.moveSvgLabel({ svg, offset });
    }

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    this.isDown = false;

    const svg = this.selectedObj.el;
    if (svg && svg['userData'].tag === 'point') {
      this.addLink({ svgPoint: svg, event });
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

    if (svg['userData'].point) {
      const svgPoint = svg['userData'].point;
      this.moveSvgPoint({ svg: svgPoint, offset, moveLine: false });
    }

    if (svg['userData'].label) {
      const svgLabel = svg['userData'].label;
      this.moveSvgLabel({ svg: svgLabel, offset, moveLine: false });
    }
  }

  moveSvgPoint({ svg, offset, moveLine = true }) {
    const svgCircle = svg;
    const offsetX = offset.x;
    const offsetY = offset.y;

    const cx = svgCircle.getAttribute('cx');
    const cy = svgCircle.getAttribute('cy');

    svgCircle.setAttribute('cx', Number(cx) + offsetX);
    svgCircle.setAttribute('cy', Number(cy) + offsetY);

    if (moveLine && svg['userData'].line) {
      const svgLine = svg['userData'].line;

      const x = svgCircle.getAttribute('cx');
      const y = svgCircle.getAttribute('cy');

      svgLine.setAttribute('x1', Number(x));
      svgLine.setAttribute('y1', Number(y));
    }
  }

  moveSvgLabel({ svg, offset, moveLine = true }) {
    const svgCircle = svg['userData'].svgCircle;
    const svgLine = svg['userData'].svgLine;
    const svgText1 = svg['userData'].svgText1;
    const svgText2 = svg['userData'].svgText2;

    const offsetX = offset.x;
    const offsetY = offset.y;

    const cx = svgCircle.getAttribute('cx');
    const cy = svgCircle.getAttribute('cy');

    svgCircle.setAttribute('cx', Number(cx) + offsetX);
    svgCircle.setAttribute('cy', Number(cy) + offsetY);

    if (svgLine) {
      const x1 = svgLine.getAttribute('x1');
      const y1 = svgLine.getAttribute('y1');
      const x2 = svgLine.getAttribute('x2');
      const y2 = svgLine.getAttribute('y2');

      svgLine.setAttribute('x1', Number(x1) + offsetX);
      svgLine.setAttribute('y1', Number(y1) + offsetY);
      svgLine.setAttribute('x2', Number(x2) + offsetX);
      svgLine.setAttribute('y2', Number(y2) + offsetY);
    }

    if (svgText1) {
      const x = svgText1.getAttribute('x');
      const y = svgText1.getAttribute('y');

      svgText1.setAttribute('x', Number(x) + offsetX);
      svgText1.setAttribute('y', Number(y) + offsetY);
    }

    if (svgText2) {
      const x = svgText2.getAttribute('x');
      const y = svgText2.getAttribute('y');

      svgText2.setAttribute('x', Number(x) + offsetX);
      svgText2.setAttribute('y', Number(y) + offsetY);
    }

    if (moveLine && svg['userData'].line) {
      const svgLine = svg['userData'].line;

      const x = svgCircle.getAttribute('cx');
      const y = svgCircle.getAttribute('cy');

      svgLine.setAttribute('x2', Number(x));
      svgLine.setAttribute('y2', Number(y));
    }
  }

  actElem(svg, act = false) {
    const elems = { line: svg['userData'].line, point: svg['userData'].point, label: svg['userData'].label };

    const stroke = !act ? 'rgb(0, 0, 0)' : '#ff0000';

    elems.line.setAttribute('stroke', stroke);
    elems.point.setAttribute('stroke', stroke);

    const svgCircle = elems.label.children[0];
    const svgLine = elems.label.children[1];
    svgCircle.setAttribute('stroke', stroke);
    svgLine.setAttribute('stroke', stroke);

    if (act) {
      this.selectedObj.el = svg;
    } else {
      this.clearSelectedObj();
    }
  }

  setLockOnSvg(svg, lock = null) {
    const elems = { line: svg['userData'].line, point: svg['userData'].point, label: svg['userData'].label };

    if (lock !== null) {
      elems.line['userData'].lock = lock;
      elems.point['userData'].lock = lock;
      elems.label['userData'].lock = lock;
    } else {
      elems.line['userData'].lock = !elems.line['userData'].lock;
      elems.point['userData'].lock = !elems.point['userData'].lock;
      elems.label['userData'].lock = !elems.label['userData'].lock;
    }

    const fill = elems.point['userData'].lock ? '#000' : '#fff';

    svg.setAttribute('fill', fill);
  }

  clearSelectedObj() {
    this.selectedObj.el = null;
    this.selectedObj.type = '';
  }

  getSelectedNote() {
    if (!this.containerSvg) return;
    if (!this.selectedObj.el) return;

    const svg = this.selectedObj.el;

    return this.getStructureNote(svg);
  }

  getStructureNote(svg) {
    const label = svg['userData'].label;
    const labelEls = {
      svgCircle: label['userData'].svgCircle,
      svgLine: label['userData'].svgLine,
      svgText1: label['userData'].svgText1,
      svgText2: label['userData'].svgText2,
    };

    return { line: svg['userData'].line, point: svg['userData'].point, label, labelEls };
  }

  scale(canvas, ratio, bound2) {
    const svgArr = [];

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].note1 && svg['userData'].tag === 'line') {
          svgArr.push(svg);
        }
      }
    });

    const bound = canvas.getBoundingClientRect();
    const boundC = this.container.getBoundingClientRect();

    svgArr.forEach((svg) => {
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

      if (svg['userData'].point) {
        const svgPoint = svg['userData'].point;
        this.moveSvgPoint({ svg: svgPoint, offset: offset1, moveLine: false });
      }

      if (svg['userData'].label) {
        const svgLabel = svg['userData'].label;
        this.moveSvgLabel({ svg: svgLabel, offset: offset2, moveLine: false });
      }
    });
  }

  // удаляем активную выноску
  deleteNote() {
    const elems = this.getSelectedNote();
    if (!elems) return;

    elems.line.remove();
    elems.point.remove();
    elems.label.remove();

    this.clearSelectedObj();
  }

  addLink({ svgPoint, event, pos = null }) {
    const arrLines = [];
    const arrPoints = [];

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI && svg['userData'].tag === 'line') {
          arrLines.push(svg);
        }
        if (svg['userData'].lineI && svg['userData'].tag === 'point') {
          const display = svg.getAttribute('display');
          if (display !== 'none') arrPoints.push(svg);
        }
        // if (svg['userData'].lineI && svg['userData'].tag === 'dline') {
        //   arrLines.push(svg);
        // }
        if (svg['userData'].lineI && svg['userData'].tag === 'dpoint') {
          arrPoints.push(svg);
        }
      }
    });

    if (!pos) pos = this.getCoord(event);
    let minDist = Infinity;
    const result = { obj: null, type: '', pos: new THREE.Vector2() };

    arrPoints.forEach((point) => {
      const pos2 = this.getCoordPoint(point);

      const dist = pos.distanceTo(pos2);
      if (dist < minDist) {
        minDist = dist;
        result.obj = point;
        result.pos = pos2;
        result.type = 'point';
      }
    });

    arrLines.forEach((line) => {
      const pos2 = this.getCoordLine(line);
      const posPr = this.spPoint(pos2.a, pos2.b, pos);
      const onLine = this.calScal(pos2.a, pos2.b, pos);

      if (onLine) {
        const dist = pos.distanceTo(posPr);
        if (dist < minDist) {
          minDist = dist;
          result.obj = line;
          result.pos = posPr;
          result.type = 'line';
        }
      }
    });

    let resultCross = null;

    // нашли ближайшую точку с которой есть пересечение
    if (minDist < 10) {
      if (result.type === 'point') {
        const cx2 = Number(svgPoint.getAttribute('cx'));
        const cy2 = Number(svgPoint.getAttribute('cy'));
        const offset = new THREE.Vector2(result.pos.x - cx2, result.pos.y - cy2);

        this.moveSvgPoint({ svg: svgPoint, offset });
      }
      if (result.type === 'line') {
        const cx2 = Number(svgPoint.getAttribute('cx'));
        const cy2 = Number(svgPoint.getAttribute('cy'));
        const offset = new THREE.Vector2(result.pos.x - cx2, result.pos.y - cy2);

        this.moveSvgPoint({ svg: svgPoint, offset });
      }

      if (result.type === 'line') {
        this.addLinkUp({ svgPoint, result });
      }

      svgPoint['userData'].crossOffset = true;

      resultCross = true;
    } else {
      if (svgPoint['userData'].crossOffset) {
        svgPoint['userData'].crossOffset = false;
        const cx2 = Number(svgPoint.getAttribute('cx'));
        const cy2 = Number(svgPoint.getAttribute('cy'));

        const offset = new THREE.Vector2(pos.x - cx2, pos.y - cy2);

        this.moveSvgPoint({ svg: svgPoint, offset });
      }

      this.unLink(svgPoint);
    }

    return resultCross;
  }

  // убираем привязку выноски к линии
  unLink(svgPoint) {
    const link = svgPoint['userData'].link;
    if (!link) return;

    const links = link.obj['userData'].links;

    let index = links.indexOf(svgPoint);
    if (index > -1) links.splice(index, 1);

    svgPoint['userData'].link = null;
  }

  // добавляем привязку выноски к линии
  addLinkUp({ svgPoint, result }) {
    const line = result.obj;

    const index = line['userData'].links.indexOf(svgPoint);
    if (index > -1) return;

    svgPoint['userData'].link = { obj: line, dist: 0 };

    const pos = this.getCoordLine(line);
    const fullDist = pos.a.distanceTo(pos.b);
    const distFirst = pos.a.distanceTo(result.pos);
    const dist = Math.round((distFirst / fullDist) * 100) / 100;

    svgPoint['userData'].link.dist = dist;

    line['userData'].links.push(svgPoint);
  }

  // двигаем выноску вслед за привязанным объектом
  updataPos(line) {
    line['userData'].links.forEach((svgPoint) => {
      const { dist } = svgPoint['userData'].link;

      const coord = this.getCoordLine(line);
      let pos = new THREE.Vector2().subVectors(coord.b, coord.a);
      pos = new THREE.Vector2().addScaledVector(pos, dist);
      pos.add(coord.a);

      svgPoint.setAttribute('cx', pos.x);
      svgPoint.setAttribute('cy', pos.y);
      svgPoint['userData'].line.setAttribute('x1', pos.x);
      svgPoint['userData'].line.setAttribute('y1', pos.y);
    });
  }

  getCoord(event) {
    const bound = this.container.getBoundingClientRect();
    const x = -bound.x + event.clientX;
    const y = -bound.y + event.clientY;

    return new THREE.Vector2(x, y);
  }

  getCoordPoint(svg) {
    const cx = Number(svg.getAttribute('cx'));
    const cy = Number(svg.getAttribute('cy'));

    return new THREE.Vector2(cx, cy);
  }

  getCoordLine(svg) {
    const cx1 = Number(svg.getAttribute('x1'));
    const cy1 = Number(svg.getAttribute('y1'));
    const cx2 = Number(svg.getAttribute('x2'));
    const cy2 = Number(svg.getAttribute('y2'));

    return { a: new THREE.Vector2(cx1, cy1), b: new THREE.Vector2(cx2, cy2) };
  }

  // проекция точки(С) на прямую (A,B)
  spPoint(A, B, C) {
    let x1 = A.x,
      y1 = A.y,
      x2 = B.x,
      y2 = B.y,
      x3 = C.x,
      y3 = C.y;

    let px = x2 - x1;
    let py = y2 - y1;
    let dAB = px * px + py * py;

    let u = ((x3 - x1) * px + (y3 - y1) * py) / dAB;
    let x = x1 + u * px;
    let y = y1 + u * py;

    return new THREE.Vector2(x, y);
  }

  // опредяляем, надодится точка D за пределами прямой или нет (точка D пересекает прямую АВ, идущая перпендикулярна от точки С)
  calScal(A, B, C) {
    let AB = { x: B.x - A.x, y: B.y - A.y };
    let CD = { x: C.x - A.x, y: C.y - A.y };
    const r1 = AB.x * CD.x + AB.y * CD.y; // скалярное произведение векторов

    AB = { x: A.x - B.x, y: A.y - B.y };
    CD = { x: C.x - B.x, y: C.y - B.y };
    const r2 = AB.x * CD.x + AB.y * CD.y;

    const cross = r1 < 0 || r2 < 0 ? false : true; // если true , то точка D находится на отрезке AB

    return cross;
  }

  moveOffset({ svg, offset }) {
    const offsetX = offset.x;
    const offsetY = offset.y;

    const x1 = svg.getAttribute('x1');
    const y1 = svg.getAttribute('y1');
    const x2 = svg.getAttribute('x2');
    const y2 = svg.getAttribute('y2');

    const link = svg['userData'].point['userData'].link;
    if (!link) {
      svg.setAttribute('x1', Number(x1) + offsetX);
      svg.setAttribute('y1', Number(y1) + offsetY);
    }

    svg.setAttribute('x2', Number(x2) + offsetX);
    svg.setAttribute('y2', Number(y2) + offsetY);

    if (!link && svg['userData'].point) {
      const svgPoint = svg['userData'].point;
      this.moveSvgPoint({ svg: svgPoint, offset, moveLine: false });
    }

    if (svg['userData'].label) {
      const svgLabel = svg['userData'].label;
      this.moveSvgLabel({ svg: svgLabel, offset, moveLine: false });
    }
  }
}
