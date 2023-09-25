import * as THREE from 'three';

import { isometricSvgElem, isometricMath } from './index';

export class IsometricSvgRuler {
  container;
  containerSvg;
  newNote = { type: '', data: null, p2: null };
  isDown = false;
  offset = new THREE.Vector2();
  actInput = null;
  selectedObj = { el: null, type: '' };

  constructor() {
    //this.addNote();
  }

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
  }

  addRuler(event, data) {
    this.clearSelectedObj();

    this.newNote.type = '';
    this.newNote.data = null;

    if (event.button === 0) {
      const bound = this.container.getBoundingClientRect();
      const x = -bound.x + event.clientX;
      const y = -bound.y + event.clientY;

      const { svg1, svg2, svg3 } = this.createElement({ btn: true, x, y, data });

      this.newNote.type = 'move';
      this.newNote.p2 = svg3;

      this.offset = new THREE.Vector2(event.clientX, event.clientY);
    }
  }

  // создать выноску
  createElement({ btn = false, x, y, data = null }) {
    let x1 = 600;
    let y1 = 600;
    let x2 = 400;
    let y2 = 400;

    if (btn) {
      x1 = x;
      y1 = y;
      x2 = x;
      y2 = y;
    }

    const svg1 = this.createSvgLine({ x1, y1, x2, y2 });
    const svg2 = this.createSvgCircle({ ind: 0, x: x1, y: y1 });
    const svg3 = this.createSvgCircle({ ind: 0, x: x1, y: y1 });
    const svg4 = this.createSvgLine({ x1, y1, x2, y2 });
    const svg5 = this.createSvgLine({ x1, y1, x2, y2 });
    const svg6 = this.createSvgCircle({ ind: 0, x: x1, y: y1 });
    const svg7 = this.createSvgCircle({ ind: 0, x: x1, y: y1 });

    this.containerSvg.children[0].append(svg1);
    this.containerSvg.children[0].append(svg2);
    this.containerSvg.children[0].append(svg3);
    this.containerSvg.children[0].append(svg4);
    this.containerSvg.children[0].append(svg5);
    this.containerSvg.children[0].append(svg6);
    this.containerSvg.children[0].append(svg7);

    svg1['userData'] = { ruler: true, tag: 'line', line: svg1, p1: svg2, p2: svg3 };
    svg2['userData'] = { ruler: true, tag: 'p1', line: svg1, p1: svg2, p2: svg3, line2: svg4 };
    svg3['userData'] = { ruler: true, tag: 'p2', line: svg1, p1: svg2, p2: svg3, line2: svg5 };
    svg4['userData'] = { p: svg6 };
    svg5['userData'] = { p: svg7 };
    svg6['userData'] = { ruler: true, tag: 'dpoint', line: svg1, dline: svg4, crossOffset: false, link: null };
    svg7['userData'] = { ruler: true, tag: 'dpoint', line: svg1, dline: svg5, crossOffset: false, link: null };

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

    svg.setAttribute('fill', '#000');
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

  createDivText({ p1, p2, txt = 'размер' }) {
    const container = document.createElement('div');

    const elem = document.createElement('div');
    elem.textContent = txt;
    elem.style.fontSize = '20px';
    //elem.style.fontFamily = 'arial,sans-serif';
    elem.style.fontFamily = 'Gostcadkk';
    elem.style.cursor = 'pointer';
    elem.style.padding = '10px';
    container.append(elem);

    container.style.position = 'absolute';
    container.style.top = '-99999px';
    container.style.left = '-99999px';
    container.style.transform = 'translateX(-50%) translateY(-50%)';
    container.style.zIndex = '4';

    p2['userData'].divText = container;

    this.containerSvg.append(container);
    this.initEventLabel(container);

    this.setPosRotDivText({ container, p1, p2 });

    return container;
  }

  initEventLabel(container) {
    const elem = container.children[0];

    elem.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const elem2 = document.createElement('input');
      elem2.textContent = '';
      elem2.style.background = 'rgb(255, 255, 255)';
      elem2.style.border = '1px solid rgb(204, 204, 204)';
      elem2.style.width = '100px';
      elem2.style.fontSize = '20px';
      elem2.style.fontFamily = 'Gostcadkk';
      elem2.style.borderRadius = '4px';
      elem2.style.padding = '10px';
      container.append(elem2);

      elem2.focus();

      elem2.onkeydown = (e2) => {
        if (e2.code === 'Enter') {
          this.deleteInput();
        }
      };

      elem2.onblur = (e2) => {
        this.deleteInput();
      };

      this.actInput = { elem, elem2 };

      elem.style.display = 'none';
    };
  }

  deleteInput(target = null) {
    if (!this.actInput) return;
    const { elem, elem2 } = this.actInput;

    if (target === elem2) return;

    const txt = elem2.value;
    if (txt !== '') elem.textContent = txt;
    elem.style.display = '';

    elem2.onblur = null;
    elem2.remove();
    this.actInput = null;
  }

  setPosRotDivText({ container, p1, p2 }) {
    const cx1 = Number(p1.getAttribute('cx'));
    const cy1 = Number(p1.getAttribute('cy'));
    const cx2 = Number(p2.getAttribute('cx'));
    const cy2 = Number(p2.getAttribute('cy'));

    const dir = new THREE.Vector2(cx2, cy2).sub(new THREE.Vector2(cx1, cy1));
    const pos = dir.clone().divideScalar(2).add(new THREE.Vector2(cx1, cy1));

    const rad = Math.atan2(dir.x, dir.y);
    const offset = rad < 0 ? -30 : 30;
    const dir2 = new THREE.Vector2(cy1 - cy2, cx2 - cx1).normalize();
    pos.sub(new THREE.Vector2(dir2.x * offset, dir2.y * offset));

    container.style.top = pos.y + 'px';
    container.style.left = pos.x + 'px';

    //----
    let rotY = Math.atan2(dir.x, dir.y);
    rotY += rotY <= 0.001 ? Math.PI / 2 : -Math.PI / 2;
    rotY = THREE.MathUtils.radToDeg(rotY);

    const elem = container.children[0];
    elem.style.transform = 'rotate(' + -rotY + 'deg)';
  }

  onmousedown = (event) => {
    if (this.newNote.type === 'move' && this.newNote.p2) {
      this.createDivText({ p1: this.newNote.p2['userData'].p1, p2: this.newNote.p2 });

      const elems = this.getStructureNote(this.newNote.p2);
      const pos1 = isometricSvgElem.getPosLine2(elems.p1line);
      const pos2 = isometricSvgElem.getPosLine2(elems.p2line);

      isometricSvgElem.setPosCircle(elems.pd1, pos1[1].x, pos1[1].y);
      isometricSvgElem.setPosCircle(elems.pd2, pos2[1].x, pos2[1].y);

      this.newNote.type = 'move2';

      return;
    }

    if (this.newNote.type === 'move2' && this.newNote.p2) {
      this.newNote.type = '';
      this.newNote.p2 = null;
      return;
    }

    if (!this.containerSvg) return;

    if (this.selectedObj.el) this.actElem(this.selectedObj.el);
    this.isDown = false;

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData'] && svg['userData'].ruler && svg.contains(event.target)) {
        this.isDown = true;
        this.actElem(svg, true);
      }
    });

    this.offset = new THREE.Vector2(event.clientX, event.clientY);

    return this.isDown;
  };

  // перемещение svg
  onmousemove = (event) => {
    if (this.newNote.type === 'move' && this.newNote.p2) {
      const svgCircle = this.newNote.p2;
      const svgLine = this.newNote.p2['userData'].line2;

      const x = svgCircle.getAttribute('cx');
      const y = svgCircle.getAttribute('cy');

      svgLine.setAttribute('x2', Number(x));
      svgLine.setAttribute('y2', Number(y));

      const offsetX = event.clientX - this.offset.x;
      const offsetY = event.clientY - this.offset.y;
      const offset = new THREE.Vector2(offsetX, offsetY);

      this.moveSvgPoint({ svg: this.newNote.p2, offset, type: 'p2' });
      this.offset = new THREE.Vector2(event.clientX, event.clientY);
    }

    if (this.newNote.type === 'move2' && this.newNote.p2) {
      const svg = this.newNote.p2['userData'].line;

      const offsetX = event.clientX - this.offset.x;
      const offsetY = event.clientY - this.offset.y;
      const offset = new THREE.Vector2(offsetX, offsetY);

      this.moveSvgLine({ svg, offset });
      this.setPosRotDivText({ container: svg['userData'].p2['userData'].divText, p1: svg['userData'].p1, p2: svg['userData'].p2 });

      this.offset = new THREE.Vector2(event.clientX, event.clientY);
    }

    if (!this.isDown) return;

    const svg = this.selectedObj.el;
    const offsetX = event.clientX - this.offset.x;
    const offsetY = event.clientY - this.offset.y;
    const offset = new THREE.Vector2(offsetX, offsetY);
    let change = false;

    if (svg['userData'].tag === 'line') {
      this.moveSvgLine({ svg, offset });
      change = true;
    }

    if (svg['userData'].tag === 'p1') {
      this.moveSvgPoint({ svg, offset, type: 'p1' });
      change = true;
    }

    if (svg['userData'].tag === 'p2') {
      this.moveSvgPoint({ svg, offset, type: 'p2' });
      change = true;
    }

    if (svg['userData'].tag === 'dpoint') {
      this.moveSvgPoint2({ svg, offset });
      this.addLink({ svgPoint: svg, event });
    }

    if (change) {
      this.setPosRotDivText({ container: svg['userData'].p2['userData'].divText, p1: svg['userData'].p1, p2: svg['userData'].p2 });
    }

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    this.isDown = false;
  };

  moveSvgLine({ svg, offset, type = 'def' }) {
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

    if (svg['userData'].p1) {
      const svgPoint = svg['userData'].p1;
      this.moveSvgPoint({ svg: svgPoint, offset, type: 'p1', moveLine: false });
    }

    if (svg['userData'].p2) {
      const svgLabel = svg['userData'].p2;
      this.moveSvgPoint({ svg: svgLabel, offset, type: 'p2', moveLine: false });
    }

    if (type === 'offsetPdf') {
      this.setPosRotDivText({ container: svg['userData'].p2['userData'].divText, p1: svg['userData'].p1, p2: svg['userData'].p2 });

      const svgP1 = svg['userData'].p1;
      const svgP2 = svg['userData'].p2;

      if (svgP1) {
        const svgLine = svgP1['userData'].line2;

        const x2 = svgLine.getAttribute('x2');
        const y2 = svgLine.getAttribute('y2');

        svgLine.setAttribute('x2', Number(x2) + offsetX);
        svgLine.setAttribute('y2', Number(y2) + offsetY);

        const pd = svgLine['userData'].p;
        isometricSvgElem.setPosCircle(pd, Number(x2) + offsetX, Number(y2) + offsetY);
      }

      if (svgP2) {
        const svgLine = svgP2['userData'].line2;

        const x2 = svgLine.getAttribute('x2');
        const y2 = svgLine.getAttribute('y2');

        svgLine.setAttribute('x2', Number(x2) + offsetX);
        svgLine.setAttribute('y2', Number(y2) + offsetY);

        const pd = svgLine['userData'].p;
        isometricSvgElem.setPosCircle(pd, Number(x2) + offsetX, Number(y2) + offsetY);
      }
    }
  }

  moveSvgPoint({ svg, offset, type, moveLine = true }) {
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

      if (type === 'p1') {
        svgLine.setAttribute('x1', Number(x));
        svgLine.setAttribute('y1', Number(y));
      }
      if (type === 'p2') {
        svgLine.setAttribute('x2', Number(x));
        svgLine.setAttribute('y2', Number(y));
      }
    }

    if (type === 'p1') {
      const svgLine = svg['userData'].line2;

      const x = svgCircle.getAttribute('cx');
      const y = svgCircle.getAttribute('cy');

      svgLine.setAttribute('x1', Number(x));
      svgLine.setAttribute('y1', Number(y));
    }

    if (type === 'p2') {
      const svgLine = svg['userData'].line2;

      const x = svgCircle.getAttribute('cx');
      const y = svgCircle.getAttribute('cy');

      svgLine.setAttribute('x1', Number(x));
      svgLine.setAttribute('y1', Number(y));
    }
  }

  moveSvgPoint2({ svg, offset }) {
    isometricSvgElem.setOffsetCircle(svg, offset.x, offset.y);

    const pos = isometricSvgElem.getPosCircle(svg);
    isometricSvgElem.setPosLine2({ svg: svg['userData'].dline, x2: pos.x, y2: pos.y });
  }

  addLink({ svgPoint, event, pos = null }) {
    const arrLines = [];

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI && svg['userData'].tag === 'line') {
          arrLines.push(svg);
        }
      }
    });

    if (!pos) pos = isometricSvgElem.getCoordMouse({ event, container: this.container });
    let minDist = Infinity;
    const result = { obj: null, type: '', pos: new THREE.Vector2() };

    arrLines.forEach((line) => {
      const posL = isometricSvgElem.getPosLine2(line);
      const posPr = isometricMath.spPoint(posL[0], posL[1], pos);
      const onLine = isometricMath.calScal(posL[0], posL[1], pos);

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
    if (result.type === 'line') {
      if (minDist < 10) {
        const posC = isometricSvgElem.getPosCircle(svgPoint);
        const offset = new THREE.Vector2(result.pos.x - posC.x, result.pos.y - posC.y);

        this.moveSvgPoint2({ svg: svgPoint, offset });

        this.addLinkUp({ svgPoint, result });

        svgPoint['userData'].crossOffset = true;

        resultCross = true;
      } else {
        if (svgPoint['userData'].crossOffset) {
          svgPoint['userData'].crossOffset = false;
          const posC = isometricSvgElem.getPosCircle(svgPoint);
          const offset = new THREE.Vector2(pos.x - posC.x, pos.y - posC.y);

          this.moveSvgPoint2({ svg: svgPoint, offset });
        }

        this.unLink(svgPoint);
      }
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

    const pos = isometricSvgElem.getPosLine2(line);
    const fullDist = pos[0].distanceTo(pos[1]);
    const distFirst = pos[0].distanceTo(result.pos);
    const dist = Math.round((distFirst / fullDist) * 100) / 100;

    svgPoint['userData'].link.dist = dist;

    line['userData'].links.push(svgPoint);
  }

  // двигаем выноску вслед за привязанным объектом
  updataPos(line) {
    const arrObj = [];

    line['userData'].links.forEach((svg) => {
      if (svg['userData'].ruler && svg['userData'].tag === 'dpoint') {
        const elems = this.getStructureNote(svg);

        let repeat = false;
        arrObj.forEach((item) => {
          if (item.elems.line === elems.line) {
            repeat = true;
            item.count += 1;
          }
        });

        if (!repeat) arrObj.push({ svg, line, elems, count: 0 });
      }
    });

    if (arrObj.length > 0) {
      arrObj.forEach((item) => {
        const svg = item.svg;
        const line = item.line;
        const elems = item.elems;
        const count = item.count;

        const { dist } = svg['userData'].link;

        const coord = isometricSvgElem.getPosLine2(line);
        let pos = new THREE.Vector2().subVectors(coord[1], coord[0]);
        pos = new THREE.Vector2().addScaledVector(pos, dist);
        pos.add(coord[0]);

        const posP = isometricSvgElem.getPosCircle(svg);
        const offset = new THREE.Vector2(pos.x - posP.x, pos.y - posP.y);

        if (count === 0) {
          isometricSvgElem.setOffsetCircle(svg, offset.x, offset.y);
          const pos = isometricSvgElem.getPosCircle(svg);
          const dline = svg === elems.pd1 ? elems.p1line : elems.p2line;
          isometricSvgElem.setPosLine2({ svg: dline, x2: pos.x, y2: pos.y });
        } else {
          isometricSvgElem.setOffsetLine2(elems.line, offset.x, offset.y);
          isometricSvgElem.setOffsetCircle(elems.p1, offset.x, offset.y);
          isometricSvgElem.setOffsetCircle(elems.p2, offset.x, offset.y);
          isometricSvgElem.setOffsetLine2(elems.p1line, offset.x, offset.y);
          isometricSvgElem.setOffsetLine2(elems.p2line, offset.x, offset.y);
          isometricSvgElem.setOffsetCircle(elems.pd1, offset.x, offset.y);
          isometricSvgElem.setOffsetCircle(elems.pd2, offset.x, offset.y);

          this.setPosRotDivText({ container: elems.p2['userData'].divText, p1: elems.p1, p2: elems.p2 });
        }
      });
    }
  }

  actElem(svg, act = false) {
    const elems = this.getStructureNote(svg);

    const stroke = !act ? 'rgb(0, 0, 0)' : '#ff0000';

    elems.line.setAttribute('stroke', stroke);
    elems.p1.setAttribute('stroke', stroke);
    elems.p2.setAttribute('stroke', stroke);
    elems.p1line.setAttribute('stroke', stroke);
    elems.p2line.setAttribute('stroke', stroke);
    elems.pd1.setAttribute('stroke', stroke);
    elems.pd1.setAttribute('fill', stroke);
    elems.pd2.setAttribute('stroke', stroke);
    elems.pd2.setAttribute('fill', stroke);

    if (act) {
      this.selectedObj.el = svg;
    } else {
      this.clearSelectedObj();
    }
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
    if (svg['userData'].tag === 'line') {
    }
    if (svg['userData'].tag === 'dpoint') {
      svg = svg['userData'].line;
    }

    const line = svg['userData'].line;
    const p1 = svg['userData'].p1;
    const p2 = svg['userData'].p2;
    const p1line = p1['userData'].line2;
    const p2line = p2['userData'].line2;
    const pd1 = p1line['userData'].p;
    const pd2 = p2line['userData'].p;

    return {
      line,
      p1,
      p2,
      p1line,
      p2line,
      pd1,
      pd2,
      divText: svg['userData'].p2['userData'].divText,
    };
  }

  scale(canvas, ratio, bound2) {
    const svgArr = [];

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].ruler && svg['userData'].tag === 'line') {
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

      if (svg['userData'].p1) {
        const svgPoint = svg['userData'].p1;
        this.moveSvgPoint({ svg: svgPoint, offset: offset1, type: 'p1', moveLine: false });
      }

      if (svg['userData'].p2) {
        const svgLabel = svg['userData'].p2;
        this.moveSvgPoint({ svg: svgLabel, offset: offset2, type: 'p2', moveLine: false });
      }

      this.setPosRotDivText({ container: svg['userData'].p2['userData'].divText, p1: svg['userData'].p1, p2: svg['userData'].p2 });

      const svgP1 = svg['userData'].p1;
      const svgP2 = svg['userData'].p2;

      if (svgP1) {
        const svgLine = svgP1['userData'].line2;

        const x2 = svgLine.getAttribute('x2');
        const y2 = svgLine.getAttribute('y2');

        const nx2 = (x2 - bound2.x) * ratio + bound.x;
        const ny2 = (y2 - bound2.y) * ratio + bound.y + (boundC.y * ratio - boundC.y);

        svgLine.setAttribute('x2', Number(nx2));
        svgLine.setAttribute('y2', Number(ny2));

        const pd = svgLine['userData'].p;
        isometricSvgElem.setPosCircle(pd, Number(nx2), Number(ny2));
      }

      if (svgP2) {
        const svgLine = svgP2['userData'].line2;

        const x2 = svgLine.getAttribute('x2');
        const y2 = svgLine.getAttribute('y2');

        const nx2 = (x2 - bound2.x) * ratio + bound.x;
        const ny2 = (y2 - bound2.y) * ratio + bound.y + (boundC.y * ratio - boundC.y);

        svgLine.setAttribute('x2', Number(nx2));
        svgLine.setAttribute('y2', Number(ny2));

        const pd = svgLine['userData'].p;
        isometricSvgElem.setPosCircle(pd, Number(nx2), Number(ny2));
      }
    });
  }

  // удаляем активную выноску
  deleteNote() {
    const elems = this.getSelectedNote();
    if (!elems) return;

    elems.line.remove();
    elems.p1.remove();
    elems.p2.remove();
    elems.p1line.remove();
    elems.p2line.remove();
    elems.pd1.remove();
    elems.pd2.remove();
    elems.divText.remove();

    this.clearSelectedObj();
  }
}
