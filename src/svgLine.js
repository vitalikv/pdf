import * as THREE from 'three';

export class IsometricSvgLine {
  container;
  containerSvg;
  isDown = false;
  newNote = { type: '', line: null, p2: null, arr: { l: [], p: [] } };
  offset = new THREE.Vector2();
  selectedObj = { el: null, type: '' };

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
  }

  addLine(event) {
    this.clearSelectedObj();

    if (event.button === 0) {
      const bound = this.container.getBoundingClientRect();
      const x = -bound.x + event.clientX;
      const y = -bound.y + event.clientY;

      const { svg1, svg2, svg3 } = this.createElement({ x, y });

      this.newNote.type = 'move';
      this.newNote.line = svg2;
      this.newNote.p2 = svg3;
      this.newNote.arr.l.push(svg2);
      this.newNote.arr.p.push(svg1, svg3);

      this.offset = new THREE.Vector2(event.clientX, event.clientY);
    }
  }

  // создать линию
  createElement({ x, y }) {
    const x1 = x;
    const y1 = y;
    const x2 = x;
    const y2 = y;

    const svg1 = this.createSvgCircle({ ind: 0, x: x1, y: y1 });
    const svg2 = this.createSvgLine({ x1, y1, x2, y2 });
    const svg3 = this.createSvgCircle({ ind: 0, x: x1, y: y1 });

    this.containerSvg.children[0].append(svg2);
    this.containerSvg.children[0].append(svg1);
    this.containerSvg.children[0].append(svg3);

    svg1['userData'] = { lineI: true, tag: 'point', lock: false, line: svg2, p1: svg1, p2: svg3 };
    svg2['userData'] = { lineI: true, tag: 'line', lock: false, line: svg2, p1: svg1, p2: svg3 };
    svg3['userData'] = { lineI: true, tag: 'point', lock: false, line: svg2, p1: svg1, p2: svg3 };

    return { svg1, svg2, svg3 };
  }

  // создаем svg точки
  createSvgCircle({ ind, x, y, r = 2.2 }) {
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
    svg.setAttribute('stroke', '#ff0000');
    //svg.setAttribute('display', 'none');

    return svg;
  }

  onmousedown = (event) => {
    if (!this.containerSvg) return;

    if (this.selectedObj.el) this.actElem(this.selectedObj.el);

    if (this.newNote.type === 'move') {
      this.addLine(event);
      return;
    }

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

      this.offset = new THREE.Vector2(event.clientX, event.clientY);
    }
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

    if (svg['userData'].p1) {
      const svgCircle = svg['userData'].p1;

      const cx = svgCircle.getAttribute('cx');
      const cy = svgCircle.getAttribute('cy');

      svgCircle.setAttribute('cx', Number(cx) + offsetX);
      svgCircle.setAttribute('cy', Number(cy) + offsetY);
    }

    if (svg['userData'].p2) {
      const svgCircle = svg['userData'].p2;

      const cx = svgCircle.getAttribute('cx');
      const cy = svgCircle.getAttribute('cy');

      svgCircle.setAttribute('cx', Number(cx) + offsetX);
      svgCircle.setAttribute('cy', Number(cy) + offsetY);
    }
  }

  clearSelectedObj() {
    this.selectedObj.el = null;
    this.selectedObj.type = '';
  }

  actElem(svg, act = false) {
    const elems = { line: svg['userData'].line, p1: svg['userData'].p1, p2: svg['userData'].p2 };

    const stroke = !act ? 'rgb(0, 0, 0)' : '#ff0000';

    elems.line.setAttribute('stroke', stroke);

    if (act) {
      this.selectedObj.el = svg;
    } else {
      this.clearSelectedObj();
    }
  }

  stopLine() {
    if (this.newNote.type !== 'move') return;
    if (!this.newNote.line) return;

    this.newNote.arr.l.forEach((item) => {
      item.setAttribute('stroke', 'rgb(0, 0, 0)');
    });

    this.newNote.arr.p.forEach((item) => {
      item.setAttribute('stroke', 'rgb(0, 0, 0)');
      item.setAttribute('fill', 'rgb(0, 0, 0)');
    });

    const p1 = this.newNote.line['userData'].p1;
    const p2 = this.newNote.line['userData'].p2;

    this.newNote.line.remove();
    p1.remove();
    p2.remove();

    this.newNote.type = '';
    this.newNote.line = null;
    this.newNote.p2 = null;
    this.newNote.arr.l = [];
    this.newNote.arr.p = [];
  }

  getSelectedNote() {
    if (!this.containerSvg) return;
    if (!this.selectedObj.el) return;

    const svg = this.selectedObj.el;

    return { line: svg['userData'].line, p1: svg['userData'].p1, p2: svg['userData'].p2 };
  }

  scale(canvas, ratio, bound2) {
    const svgArr = [];

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI && svg['userData'].tag === 'line') {
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
        const svgCircle = svg['userData'].p1;
        const offsetX = offset1.x;
        const offsetY = offset1.y;

        const cx = svgCircle.getAttribute('cx');
        const cy = svgCircle.getAttribute('cy');

        svgCircle.setAttribute('cx', Number(cx) + offsetX);
        svgCircle.setAttribute('cy', Number(cy) + offsetY);
      }

      if (svg['userData'].p2) {
        const svgCircle = svg['userData'].p2;
        const offsetX = offset2.x;
        const offsetY = offset2.y;

        const cx = svgCircle.getAttribute('cx');
        const cy = svgCircle.getAttribute('cy');

        svgCircle.setAttribute('cx', Number(cx) + offsetX);
        svgCircle.setAttribute('cy', Number(cy) + offsetY);
      }
    });
  }

  // удаляем активную выноску
  deleteLine() {
    const elems = this.getSelectedNote();
    if (!elems) return;

    elems.line.remove();
    elems.p1.remove();
    elems.p2.remove();

    this.clearSelectedObj();
  }
}
