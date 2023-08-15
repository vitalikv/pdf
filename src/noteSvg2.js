import * as THREE from 'three';

import { mapControlInit } from './index';

export class IsometricNoteSvg2 {
  container;
  containerSvg;
  newNote = { add: false, data: null };
  isDown = false;
  offset = new THREE.Vector2();
  selectedObj = { el: null, type: '' };

  constructor() {
    //this.addNote();
  }

  addNote(data) {
    if (!this.container) this.getContainer();
    if (!this.containerSvg) this.createContainerSvg();
    this.newNote.add = true;
    this.newNote.data = data;
  }

  getContainer() {
    this.container = document.querySelector('#labels-container-div');
  }

  createContainerSvg() {
    const containerSvg = this.container.querySelector('[nameId="svgTools"]');
    if (containerSvg) {
      this.containerSvg = containerSvg;
      return;
    }

    const div = document.createElement('div');
    div.setAttribute('nameId', 'svgTools');
    //div.style.cssText = 'position: absolute; width: 1px; user-select: none; z-index: 4;';
    div.style.cssText = 'position: absolute; width: 100%; height: 100%; user-select: none; z-index: 4;';
    div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="overflow: visible;"></svg>`;

    this.containerSvg = div;
    this.container.prepend(div);
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
    const svg3 = this.createSvgLabel({ ind: 0, x: x2, y: y2, r: 60, text: data.text });

    this.containerSvg.children[0].append(svg1);
    this.containerSvg.children[0].append(svg2);
    this.containerSvg.children[0].append(svg3);

    svg1['userData'] = { note2: true, tag: 'line', line: svg1, point: svg2, label: svg3 };
    svg2['userData'] = { note2: true, tag: 'point', line: svg1, point: svg2, label: svg3 };
    svg3['userData'] = { note2: true, tag: 'label', line: svg1, point: svg2, label: svg3, ...svg3['userData'] };
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
    elem.setAttribute('y', y);
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

    const svgLine = this.createSvgLine({ x1: -r + x, y1: 0 + y, x2: r + x, y2: 0 + y });
    const svgText1 = text[0] !== '' ? this.createSvgText({ x, y: Number(y) - 10, txt: text[0] }) : null;
    const svgText2 = text[1] !== '' ? this.createSvgText({ x, y: Number(y) + 10, txt: text[1] }) : null;

    g.append(svgLine);
    g.append(svgText1);
    g.append(svgText2);

    g['userData'] = { svgLine, svgText1, svgText2 };

    this.containerSvg.children[0].append(g);

    return g;
  }

  onmousedown = (event) => {
    if (this.newNote.add) {
      this.clearSelectedObj();

      if (event.button === 0) {
        const bound = this.container.getBoundingClientRect();
        const x = -bound.x + event.clientX;
        const y = -bound.y + event.clientY;

        this.createElement({ btn: true, x, y, data: this.newNote.data });
      }

      this.newNote.add = false;
      this.newNote.data = null;

      return;
    }

    if (!this.containerSvg) return;
    // event.preventDefault();
    // event.stopPropagation();

    this.isDown = false;
    this.clearSelectedObj();

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData'] && svg['userData'].note2 && svg.contains(event.target)) {
        this.isDown = true;
        this.selectedObj.el = svg;
        //this.selectedObj.type = 'svgCircle';
      }
    });

    if (this.isDown) {
      mapControlInit.control.enabled = false;
    }

    this.offset = new THREE.Vector2(event.clientX, event.clientY);

    return this.isDown;
  };

  // перемещение svg
  onmousemove = (event) => {
    if (!this.isDown) return;

    let svg = this.selectedObj.el;

    if (svg['userData'].tag === 'line') {
      this.moveSvgLine({ svg, event });
    }

    if (svg['userData'].tag === 'point') {
      this.moveSvgPoint({ svg, event });
    }

    if (svg['userData'].tag === 'label') {
      this.moveSvgLabel({ svg, event });
    }

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    this.isDown = false;
    mapControlInit.control.enabled = true;
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

    if (svg['userData'].point) {
      const svgPoint = svg['userData'].point;
      this.moveSvgPoint({ svg: svgPoint, event, moveLine: false });
    }

    if (svg['userData'].label) {
      const svgLabel = svg['userData'].label;
      this.moveSvgLabel({ svg: svgLabel, event, moveLine: false });
    }
  }

  moveSvgPoint({ svg, event, moveLine = true }) {
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

      svgLine.setAttribute('x1', Number(x));
      svgLine.setAttribute('y1', Number(y));
    }
  }

  moveSvgLabel({ svg, event, moveLine = true }) {
    const svgLine = svg['userData'].svgLine;
    const svgText1 = svg['userData'].svgText1;
    const svgText2 = svg['userData'].svgText2;

    const offsetX = event.clientX - this.offset.x;
    const offsetY = event.clientY - this.offset.y;

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

      const x = svgLine.getAttribute('x2');
      const y = svgLine.getAttribute('y2');
      svgLine.setAttribute('x2', Number(x) + offsetX);
      svgLine.setAttribute('y2', Number(y) + offsetY);

      this.setPosLabel({ svgLine, svgLabel: svg });
    }
  }

  setPosLabel({ svgLine, svgLabel }) {
    const x1 = svgLine.getAttribute('x1');
    const y1 = svgLine.getAttribute('y1');
    const x2 = svgLine.getAttribute('x2');
    const y2 = svgLine.getAttribute('y2');

    const dir = new THREE.Vector2(x2, y2).sub(new THREE.Vector2(x1, y1));

    const rad = Math.atan2(dir.x, dir.y);
    const offset = rad < 0 ? -1 : 1;

    const svgLine2 = svgLabel['userData'].svgLine;
    const svgText1 = svgLabel['userData'].svgText1;
    const svgText2 = svgLabel['userData'].svgText2;

    const xs1 = svgLine2.getAttribute('x1');
    const xs2 = svgLine2.getAttribute('x2');
    const offsetX = Number(xs2) - Number(xs1);

    if (svgLine2) {
      if (offset === -1) {
        svgLine2.setAttribute('x1', Number(x2) - (Number(xs2) - Number(xs1)));
        svgLine2.setAttribute('x2', Number(x2));
      } else {
        svgLine2.setAttribute('x1', Number(x2));
        svgLine2.setAttribute('x2', Number(x2) + (Number(xs2) - Number(xs1)));
      }
    }

    if (svgText1) {
      svgText1.setAttribute('x', Number(x2) + (offsetX / 2) * offset);
    }

    if (svgText2) {
      svgText2.setAttribute('x', Number(x2) + (offsetX / 2) * offset);
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

    return { line: svg['userData'].line, point: svg['userData'].point, label: svg['userData'].label };
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
}