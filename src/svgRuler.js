import * as THREE from 'three';

import { isometricSvgElem, isometricMath } from './index';

export class IsometricSvgRuler {
  container;
  containerSvg;
  groupLines;
  groupRulers;
  newNote = { type: '', data: null, p2: null, r2: { dir: new THREE.Vector2(), startPos: new THREE.Vector2() } };
  isDown = false;
  offset = new THREE.Vector2();
  actInput = null;
  selectedObj = { el: null, type: '' };

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
    this.groupLines = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'lines' });
    this.groupRulers = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'rulers' });
  }

  addRuler(event, data, lastPoint = null) {
    this.clearSelectedObj();

    let elPos = null;
    if (lastPoint) {
      const elems = this.getStructureNote(lastPoint);
      elPos = isometricSvgElem.getPosLine2(elems.p2line);

      const pos1 = isometricSvgElem.getPosPolygon(elems.p1);
      const pos2 = isometricSvgElem.getPosPolygon(elems.p2);
      const dir = new THREE.Vector2().subVectors(pos2, pos1).normalize();

      this.newNote.r2.dir = dir;
      this.newNote.r2.startPos = pos2.clone();
    }

    this.clearNewNote();

    if (event.button === 0) {
      const pos = this.getCoord(event);
      let x = pos.x;
      let y = pos.y;

      if (elPos) {
        x = elPos[0].x;
        y = elPos[0].y;
      }

      const { svg1, svg2, svg3 } = this.createElement({ btn: true, x, y, data });

      this.newNote.type = 'nextRuler';
      this.newNote.p2 = svg3;

      // создаем 2-ой размер
      if (elPos) {
        const elems = this.getStructureNote(this.newNote.p2);

        isometricSvgElem.setPosPolygon1(elems.p1, elPos[0].x, elPos[0].y);
        isometricSvgElem.setPosLine2({ svg: elems.p1line, x1: elPos[0].x, y1: elPos[0].y, x2: elPos[1].x, y2: elPos[1].y });
        isometricSvgElem.setPosCircle(elems.pd1, elPos[1].x, elPos[1].y);

        isometricSvgElem.setPosPolygon1(elems.p2, elPos[0].x, elPos[0].y);
        isometricSvgElem.setPosLine2({ svg: elems.p2line, x1: elPos[0].x, y1: elPos[0].y, x2: elPos[1].x, y2: elPos[1].y });
        isometricSvgElem.setPosCircle(elems.pd2, elPos[1].x, elPos[1].y);

        this.newNote.type = 'move3';
      }

      this.offset = this.getCoord(event);
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
    const svg2 = isometricSvgElem.createPolygon({ x: x1, y: y1, points: '0,0 20,5 20,-5' });
    const svg3 = isometricSvgElem.createPolygon({ x: x1, y: y1, points: '0,0 20,5 20,-5' });
    const svg4 = this.createSvgLine({ x1, y1, x2, y2 });
    const svg5 = this.createSvgLine({ x1, y1, x2, y2 });
    const svg6 = this.createSvgCircle({ ind: 0, x: x1, y: y1 });
    const svg7 = this.createSvgCircle({ ind: 0, x: x1, y: y1 });

    this.groupRulers.append(svg1);
    this.groupRulers.append(svg2);
    this.groupRulers.append(svg3);
    this.groupRulers.append(svg4);
    this.groupRulers.append(svg5);
    this.groupRulers.append(svg6);
    this.groupRulers.append(svg7);

    svg1['userData'] = { ruler: true, tag: 'line', line: svg1, p1: svg2, p2: svg3 };
    svg2['userData'] = { ruler: true, tag: 'p1', line: svg1, p1: svg2, p2: svg3, line2: svg4 };
    svg3['userData'] = { ruler: true, tag: 'p2', line: svg1, p1: svg2, p2: svg3, line2: svg5 };
    svg4['userData'] = { p: svg6 };
    svg5['userData'] = { p: svg7 };
    svg6['userData'] = { ruler: true, tag: 'dpoint', line: svg1, dline: svg4, crossOffset: false, link: null };
    svg7['userData'] = { ruler: true, tag: 'dpoint', line: svg1, dline: svg5, crossOffset: false, link: null };

    svg6.setAttribute('display', 'none');
    svg7.setAttribute('display', 'none');

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
    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    elem.setAttribute('dominant-baseline', 'middle');
    elem.setAttribute('text-anchor', 'middle');
    elem.setAttribute('font-size', '20px');
    elem.setAttribute('font-family', 'Gostcadkk');
    elem.setAttribute('color', '#000000');
    elem.style.cursor = 'pointer';
    elem.style.zIndex = '4';

    elem.textContent = txt;
    this.groupRulers.append(elem);

    p2['userData'].divText = elem;

    this.initEventLabel({ elem });

    this.setPosRotDivText({ p1, p2 });
  }

  initEventLabel({ elem }) {
    elem.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const elem2 = document.createElement('input');
      const pos = isometricSvgElem.getPosText1(elem);
      const bound = this.containerSvg.getBoundingClientRect();
      const size = isometricSvgElem.getSizeViewBox({ container: this.containerSvg });
      const ratio = size.x / bound.width;

      elem2.style.position = 'absolute';
      elem2.style.top = pos.y / ratio + 'px';
      elem2.style.left = pos.x / ratio + 'px';
      elem2.style.transform = 'translateX(-50%) translateY(-50%)';
      elem2.style.zIndex = '4';

      elem2.textContent = '';
      elem2.style.background = 'rgb(255, 255, 255)';
      elem2.style.border = '1px solid rgb(204, 204, 204)';
      elem2.style.width = '100px';
      elem2.style.fontSize = '20px';
      elem2.style.fontFamily = 'Gostcadkk';
      elem2.style.borderRadius = '4px';
      elem2.style.padding = '10px';

      this.containerSvg.append(elem2);

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

  setPosRotDivText({ p1, p2 }) {
    const pos1 = isometricSvgElem.getPosPolygon(p1);
    const pos2 = isometricSvgElem.getPosPolygon(p2);

    const dir = pos2.clone().sub(pos1);
    const pos = dir.clone().divideScalar(2).add(pos1);

    const rad = Math.atan2(dir.x, dir.y);
    const offset = rad < 0 ? -15 : 15;
    const dir2 = new THREE.Vector2(pos1.y - pos2.y, pos2.x - pos1.x).normalize();
    pos.sub(new THREE.Vector2(dir2.x * offset, dir2.y * offset));

    const elem = p2['userData'].divText;

    //----
    let rotY = Math.atan2(dir.x, dir.y);
    rotY += rotY <= 0.001 ? Math.PI / 2 : -Math.PI / 2;
    rotY = THREE.MathUtils.radToDeg(rotY) * -1;

    elem.setAttribute('x', pos.x);
    elem.setAttribute('y', pos.y);

    const bbox = elem.getBBox();
    elem.setAttribute('transform', 'rotate(' + rotY + ', ' + (bbox.x + bbox.width / 2) + ',' + (bbox.y + bbox.height / 2) + ')');
  }

  // поворот стрелок у линейки
  setRotArrows({ svg }) {
    const { p1, p2 } = this.getStructureNote(svg);

    const pos1 = isometricSvgElem.getPosPolygon(p1);
    const pos2 = isometricSvgElem.getPosPolygon(p2);

    const dir = pos2.sub(pos1);

    const rotY = Math.atan2(dir.x, dir.y);
    const rotY1 = THREE.MathUtils.radToDeg(rotY - Math.PI / 2) * -1;
    const rotY2 = THREE.MathUtils.radToDeg(rotY + Math.PI / 2) * -1;

    isometricSvgElem.setRotPolygon1(p1, rotY1);
    isometricSvgElem.setRotPolygon1(p2, rotY2);
  }

  getCoord(event) {
    const pos = isometricSvgElem.getCoordMouse({ event, container: this.containerSvg });

    return pos;
  }

  onmousedown = (event) => {
    if (this.newNote.type === 'nextRuler' && this.newNote.p2) {
      this.createDivText({ p1: this.newNote.p2['userData'].p1, p2: this.newNote.p2 });

      const elems = this.getStructureNote(this.newNote.p2);
      const pos1 = isometricSvgElem.getPosLine2(elems.p1line);
      const pos2 = isometricSvgElem.getPosLine2(elems.p2line);

      isometricSvgElem.setPosCircle(elems.pd1, pos1[1].x, pos1[1].y);
      isometricSvgElem.setPosCircle(elems.pd2, pos2[1].x, pos2[1].y);

      const posd1 = isometricSvgElem.getPosCircle(elems.pd1);
      const posd2 = isometricSvgElem.getPosCircle(elems.pd2);
      this.addLink({ svgPoint: elems.pd1, event: null, pos: posd1 });
      this.addLink({ svgPoint: elems.pd2, event: null, pos: posd2 });

      this.newNote.type = 'moveRuler';

      return;
    }

    if (this.newNote.type === 'moveRuler' && this.newNote.p2) {
      const p2 = this.newNote.p2;
      this.clearNewNote();
      return p2;
    }

    // закончили создани 2-ого размеры
    if (this.newNote.type === 'move3' && this.newNote.p2) {
      this.createDivText({ p1: this.newNote.p2['userData'].p1, p2: this.newNote.p2 });

      const elems = this.getStructureNote(this.newNote.p2);
      const pos1 = isometricSvgElem.getPosLine2(elems.p1line);
      const pos2 = isometricSvgElem.getPosLine2(elems.p2line);

      isometricSvgElem.setPosCircle(elems.pd1, pos1[1].x, pos1[1].y);
      isometricSvgElem.setPosCircle(elems.pd2, pos2[1].x, pos2[1].y);

      const posd1 = isometricSvgElem.getPosCircle(elems.pd1);
      const posd2 = isometricSvgElem.getPosCircle(elems.pd2);
      this.addLink({ svgPoint: elems.pd1, event: null, pos: posd1 });
      this.addLink({ svgPoint: elems.pd2, event: null, pos: posd2 });

      const p2 = this.newNote.p2;
      this.clearNewNote();
      return p2;
    }

    if (!this.containerSvg) return;

    if (this.selectedObj.el) this.actElem(this.selectedObj.el);
    this.isDown = false;

    this.groupRulers.childNodes.forEach((svg, ind) => {
      if (svg['userData'] && svg['userData'].ruler && svg.contains(event.target)) {
        this.isDown = true;
        this.actElem(svg, true);
      }
    });

    this.offset = this.getCoord(event);

    return this.isDown;
  };

  // перемещение svg
  onmousemove = (event) => {
    if (this.newNote.type === 'nextRuler' && this.newNote.p2) {
      const svgCircle = this.newNote.p2;
      const svgLine = this.newNote.p2['userData'].line2;

      const { x, y } = isometricSvgElem.getPosPolygon(svgCircle);

      svgLine.setAttribute('x2', Number(x));
      svgLine.setAttribute('y2', Number(y));

      let pos = this.getCoord(event);
      const offset = pos.sub(this.offset);

      this.moveSvgPoint({ svg: this.newNote.p2, offset, type: 'p2' });

      this.offset = this.getCoord(event);
    }

    if (this.newNote.type === 'moveRuler' && this.newNote.p2) {
      const svg = this.newNote.p2['userData'].line;

      let pos = this.getCoord(event);
      const offset = pos.sub(this.offset);

      this.moveSvgLine({ svg, offset });
      this.setPosRotDivText({ container: svg['userData'].p2['userData'].divText, p1: svg['userData'].p1, p2: svg['userData'].p2 });

      this.offset = this.getCoord(event);
    }

    // полсе создание одного размера , перемещаем 2-ой размер
    if (this.newNote.type === 'move3' && this.newNote.p2) {
      const svgCircle = this.newNote.p2;
      const svgLine = this.newNote.p2['userData'].line2;

      const { x, y } = isometricSvgElem.getPosPolygon(svgCircle);

      svgLine.setAttribute('x2', Number(x));
      svgLine.setAttribute('y2', Number(y));

      // let pos = this.getCoord(event);
      // const offset = pos.sub(this.offset);
      const offset = this.moveDirRuler({ event });

      this.moveSvgPoint({ svg: this.newNote.p2, offset, type: 'p2' });

      const elems = this.getStructureNote(this.newNote.p2);

      this.moveSvgPoint2({ svg: elems.pd2, offset });

      this.offset = this.getCoord(event);
    }

    if (!this.isDown) return;

    const svg = this.selectedObj.el;
    let pos = this.getCoord(event);
    const offset = pos.sub(this.offset);
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

    this.offset = this.getCoord(event);
  };

  onmouseup = (event) => {
    this.isDown = false;
  };

  // перетаскивание линейки по заданному направлению
  moveDirRuler({ event }) {
    let { x, y } = this.getCoord(event);

    const pos = isometricSvgElem.getPosPolygon(this.newNote.p2);
    const pos1 = new THREE.Vector2(x, y);

    const dist = this.newNote.r2.dir.dot(new THREE.Vector2().subVectors(pos1, this.newNote.r2.startPos));

    let posNew = this.newNote.r2.startPos.clone();

    if (dist > 0) {
      posNew = this.newNote.r2.startPos.clone().add(new THREE.Vector2().addScaledVector(this.newNote.r2.dir, dist));
    }

    return posNew.sub(pos);
  }

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
    const svgP = svg;

    isometricSvgElem.setOffsetPolygon1(svgP, offset.x, offset.y);

    const { x, y } = isometricSvgElem.getPosPolygon(svgP);

    if (moveLine && svg['userData'].line) {
      const svgLine = svg['userData'].line;

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

      svgLine.setAttribute('x1', Number(x));
      svgLine.setAttribute('y1', Number(y));
    }

    if (type === 'p2') {
      const svgLine = svg['userData'].line2;

      svgLine.setAttribute('x1', Number(x));
      svgLine.setAttribute('y1', Number(y));
    }

    this.setRotArrows({ svg: svgP });
  }

  moveSvgPoint2({ svg, offset }) {
    isometricSvgElem.setOffsetCircle(svg, offset.x, offset.y);

    const pos = isometricSvgElem.getPosCircle(svg);
    isometricSvgElem.setPosLine2({ svg: svg['userData'].dline, x2: pos.x, y2: pos.y });
  }

  addLink({ svgPoint, event, pos = null }) {
    const arrLines = [];
    const arrDPoints = [];

    this.groupLines.childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI && svg['userData'].tag === 'line') {
          arrLines.push(svg);
        }
        if (svg['userData'].ruler && svg['userData'].tag === 'dpoint') {
          if (svg !== svgPoint) arrDPoints.push(svg);
        }
      }
    });

    if (!pos) pos = this.getCoord(event);
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

    // ищем ближайший размер на линии
    if (result.type === 'line') {
      arrDPoints.forEach((point) => {
        const pos2 = isometricSvgElem.getPosCircle(point);

        const dist = pos.distanceTo(pos2);
        if (dist < minDist + 10) {
          minDist = dist;
          result.pos = pos2;
        }
      });
    }

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

        arrObj.push({ svg, line, elems });
      }
    });

    if (arrObj.length > 0) {
      arrObj.forEach((item) => {
        const svg = item.svg;
        const line = item.line;
        const elems = item.elems;

        const { dist } = svg['userData'].link;

        const coord = isometricSvgElem.getPosLine2(line);
        let pos = new THREE.Vector2().subVectors(coord[1], coord[0]);
        pos = new THREE.Vector2().addScaledVector(pos, dist);
        pos.add(coord[0]);

        const posP = isometricSvgElem.getPosCircle(svg);
        const offset = new THREE.Vector2(pos.x - posP.x, pos.y - posP.y);

        if (elems.pd1 === svg) {
          isometricSvgElem.setOffsetPolygon1(elems.p1, offset.x, offset.y);
          isometricSvgElem.setOffsetLine2(elems.p1line, offset.x, offset.y);
          isometricSvgElem.setOffsetCircle(elems.pd1, offset.x, offset.y);
        } else {
          isometricSvgElem.setOffsetPolygon1(elems.p2, offset.x, offset.y);
          isometricSvgElem.setOffsetLine2(elems.p2line, offset.x, offset.y);
          isometricSvgElem.setOffsetCircle(elems.pd2, offset.x, offset.y);
        }

        const pos1 = isometricSvgElem.getPosPolygon(elems.p1);
        const pos2 = isometricSvgElem.getPosPolygon(elems.p2);

        isometricSvgElem.setPosLine1(elems.line, pos1.x, pos1.y, pos2.x, pos2.y);

        this.setRotArrows({ svg: elems.p2 });
        this.setPosRotDivText({ p1: elems.p1, p2: elems.p2 });
      });
    }
  }

  actElem(svg, act = false) {
    this.setColorElem(svg, act);

    if (act) {
      this.selectedObj.el = svg;
    } else {
      this.clearSelectedObj();
    }
  }

  setColorElem(svg, act = false) {
    const elems = this.getStructureNote(svg);

    const stroke = !act ? 'rgb(0, 0, 0)' : '#ff0000';
    const display = act ? '' : 'none';

    elems.line.setAttribute('stroke', stroke);
    elems.p1.setAttribute('stroke', stroke);
    elems.p1.setAttribute('fill', stroke);
    elems.p2.setAttribute('stroke', stroke);
    elems.p2.setAttribute('fill', stroke);
    elems.p1line.setAttribute('stroke', stroke);
    elems.p2line.setAttribute('stroke', stroke);
    elems.pd1.setAttribute('stroke', stroke);
    elems.pd1.setAttribute('fill', stroke);
    elems.pd2.setAttribute('stroke', stroke);
    elems.pd2.setAttribute('fill', stroke);

    elems.pd1.setAttribute('display', display);
    elems.pd2.setAttribute('display', display);
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

    this.groupRulers.childNodes.forEach((svg, ind) => {
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

  clearNewNote() {
    this.newNote.type = '';
    this.newNote.p2 = null;
    // this.newNote.r2.dir = new THREE.Vector2();
    // this.newNote.r2.startPos = new THREE.Vector2();
  }

  // удаляем активную выноску
  deleteNote({ type = '', svg = null }) {
    let elems = null;
    if (type === 'stopAddRuler') {
      elems = this.getStructureNote(this.newNote.p2);
      this.clearNewNote();
    } else if (svg) {
      elems = this.getStructureNote(svg);
    } else {
      elems = this.getSelectedNote();
    }

    if (!elems) return;

    this.unLink(elems.pd1);
    this.unLink(elems.pd2);

    elems.line.remove();
    elems.p1.remove();
    elems.p2.remove();
    elems.p1line.remove();
    elems.p2line.remove();
    elems.pd1.remove();
    elems.pd2.remove();
    if (elems.divText) elems.divText.remove();

    this.clearSelectedObj();
  }
}
