import * as THREE from 'three';

import { mapControlInit } from './index';

export class IsometricSvgRuler {
  container;
  containerSvg;
  newNote = { type: '', data: null, p2: null };
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

  addRuler(data) {
    this.newNote.type = 'add';
    this.newNote.data = data;
  }

  // создать выноску
  createElement({ btn = false, x, y, data }) {
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

    this.containerSvg.children[0].append(svg1);
    this.containerSvg.children[0].append(svg2);
    this.containerSvg.children[0].append(svg3);
    this.containerSvg.children[0].append(svg4);
    this.containerSvg.children[0].append(svg5);

    svg1['userData'] = { ruler: true, tag: 'line', line: svg1, p1: svg2, p2: svg3 };
    svg2['userData'] = { ruler: true, tag: 'p1', line: svg1, p1: svg2, p2: svg3, line2: svg4 };
    svg3['userData'] = { ruler: true, tag: 'p2', line: svg1, p1: svg2, p2: svg3, line2: svg5 };

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

  createDivText({ p1, p2 }) {
    const container = document.createElement('div');

    const elem = document.createElement('div');
    elem.textContent = 'размер';
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

    this.containerSvg.append(container);
    this.initEventLabel(container);

    this.setPosRotDivText({ container, p1, p2 });

    return container;
  }

  initEventLabel(container) {
    const elem = container.children[0];

    elem.onpointerdown = (e) => {
      //e.preventDefault();
      //e.stopPropagation();

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
          const txt = elem2.value;
          container.children[1].remove();

          if (txt !== '') elem.textContent = txt;
          elem.style.display = '';
        }
      };

      elem.style.display = 'none';
    };
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
    if (this.newNote.type === 'add') {
      this.clearSelectedObj();

      this.newNote.type = '';
      this.newNote.data = null;

      if (event.button === 0) {
        const bound = this.container.getBoundingClientRect();
        const x = -bound.x + event.clientX;
        const y = -bound.y + event.clientY;

        const { svg1, svg2, svg3 } = this.createElement({ btn: true, x, y, data: this.newNote.data });

        this.newNote.type = 'move';
        this.newNote.p2 = svg3;

        this.offset = new THREE.Vector2(event.clientX, event.clientY);
      }

      return;
    }

    if (this.newNote.type === 'move' && this.newNote.p2) {
      const divText = this.createDivText({ p1: this.newNote.p2['userData'].p1, p2: this.newNote.p2 });

      this.newNote.p2['userData'].divText = divText;

      this.newNote.type = '';
      this.newNote.p2 = null;

      return;
    }

    if (!this.containerSvg) return;
    event.preventDefault();
    event.stopPropagation();

    this.isDown = false;
    this.clearSelectedObj();

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData'] && svg['userData'].ruler && svg.contains(event.target)) {
        this.isDown = true;
        this.selectedObj.el = svg;
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

      this.moveSvgPoint({ svg: this.newNote.p2, event, type: 'p2' });
      this.offset = new THREE.Vector2(event.clientX, event.clientY);
    }

    if (!this.isDown) return;

    const svg = this.selectedObj.el;
    let change = false;

    if (svg['userData'].tag === 'line') {
      this.moveSvgLine({ svg, event });
      change = true;
    }

    if (svg['userData'].tag === 'p1') {
      this.moveSvgPoint({ svg, event, type: 'p1' });
      change = true;
    }

    if (svg['userData'].tag === 'p2') {
      this.moveSvgPoint({ svg, event, type: 'p2' });
      change = true;
    }

    if (change) {
      this.setPosRotDivText({ container: svg['userData'].p2['userData'].divText, p1: svg['userData'].p1, p2: svg['userData'].p2 });
    }

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    this.isDown = false;
  };

  moveSvgLine({ svg, event }) {
    const offsetX = event.clientX - this.offset.x;
    const offsetY = event.clientY - this.offset.y;

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
      this.moveSvgPoint({ svg: svgPoint, event, type: 'p1', moveLine: false });
    }

    if (svg['userData'].p2) {
      const svgLabel = svg['userData'].p2;
      this.moveSvgPoint({ svg: svgLabel, event, type: 'p2', moveLine: false });
    }
  }

  moveSvgPoint({ svg, event, type, moveLine = true }) {
    const svgCircle = svg;
    const x = event.clientX;
    const y = event.clientY;
    const offsetX = x - this.offset.x;
    const offsetY = y - this.offset.y;

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

  clearSelectedObj() {
    this.selectedObj.el = null;
    this.selectedObj.type = '';
  }

  getSelectedNote() {
    if (!this.containerSvg) return;
    if (!this.selectedObj.el) return;

    const svg = this.selectedObj.el;

    return {
      line: svg['userData'].line,
      p1: svg['userData'].p1,
      p2: svg['userData'].p2,
      p1line: svg['userData'].p1['userData'].line2,
      p2line: svg['userData'].p2['userData'].line2,
      divText: svg['userData'].p2['userData'].divText,
    };
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
    elems.divText.remove();

    this.clearSelectedObj();
  }
}
