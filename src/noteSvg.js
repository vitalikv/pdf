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

    svg1['userData'] = { note1: true, tag: 'line', lock: false, line: svg1, point: svg2, label: svg3 };
    svg2['userData'] = { note1: true, tag: 'point', lock: false, line: svg1, point: svg2, label: svg3 };
    svg3['userData'] = { note1: true, tag: 'label', lock: false, line: svg1, point: svg2, label: svg3 };
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
    const svgText = this.createSvgText({ x, y, txt: text[0] });

    g.append(svgCircle);
    g.append(svgLine);
    g.append(svgText);

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
    }

    if (svg['userData'].tag === 'label') {
      this.moveSvgLabel({ svg, offset });
    }

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    this.isDown = false;
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
    const svgCircle = svg.children[0];
    const svgLine = svg.children[1];
    const svgText1 = svg.children[2];

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

  setLockOnSvg(svg) {
    const elems = { line: svg['userData'].line, point: svg['userData'].point, label: svg['userData'].label };

    elems.line['userData'].lock = !elems.line['userData'].lock;
    elems.point['userData'].lock = !elems.point['userData'].lock;
    elems.label['userData'].lock = !elems.label['userData'].lock;

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

    return { line: svg['userData'].line, point: svg['userData'].point, label: svg['userData'].label };
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
}
