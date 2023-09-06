import * as THREE from 'three';

export class IsometricSelectBox {
  activated = false;
  isDown = false;
  isMove = false;
  container;
  containerSvg;
  selectedArr = { objs: [] };
  elemSelBox = null;
  startOffset = new THREE.Vector2();
  startPos = new THREE.Vector2();
  endPos = new THREE.Vector2();

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
    this.elemSelBox = this.createElemSelectBox();
  }

  createElemSelectBox() {
    const div = document.createElement('div');
    div.style.cssText =
      'position: absolute; width: 0; height: 0; line-height: 0; z-index: 100; visibility: hidden; border: 2px dashed #ff0000; box-sizing: border-box;';
    this.container.prepend(div);

    return div;
  }

  onKeyDown = (event) => {
    if (event.code === 'ControlLeft' && !event.repeat) {
      this.activateCutBox();
    }
  };

  onKeyUp = (event) => {
    if (event.code === 'ControlLeft') {
      this.deActivateCutBox();
    }
  };

  activateCutBox() {
    this.activated = true;

    const bound = this.container.getBoundingClientRect();
    this.startOffset.x = bound.left;
    this.startOffset.y = bound.top;
  }

  deActivateCutBox() {
    this.activated = false;

    if (this.isMove) {
      //this.setBoxVisibility('hidden');
    }
  }

  setBoxVisibility(value) {
    this.elemSelBox.style.visibility = value;
  }

  coords(event) {
    const x = -this.startOffset.x + event.clientX;
    const y = -this.startOffset.y + event.clientY;

    return new THREE.Vector2(x, y);
  }

  onmousedown = (event) => {
    this.clearSelected();

    if (!this.activated) return;

    this.startPos = this.coords(event);
    this.endPos = this.coords(event);

    this.isDown = true;
    this.isMove = false;

    return this.isDown;
  };

  onmousemove = (event) => {
    if (!this.activated) return;
    if (!this.isDown) return;

    this.isMove = true;

    this.endPos = this.coords(event);

    let x1 = this.startPos.x;
    let y1 = this.startPos.y;
    let { x: x2, y: y2 } = this.coords(event);

    if (x1 === x2) {
      return;
    }
    if (y1 === y2) {
      return;
    }

    if (x1 > x2) {
      x1 = x1 + x2;
      x2 = x1 - x2;
      x1 = x1 - x2;
    }
    if (y1 > y2) {
      y1 = y1 + y2;
      y2 = y1 - y2;
      y1 = y1 - y2;
    }

    const box = this.elemSelBox;
    box.style.top = y1 + 'px';
    box.style.left = x1 + 'px';
    box.style.width = x2 - x1 + 'px';
    box.style.height = y2 - y1 + 'px';

    this.setBoxVisibility('visible');
  };

  onmouseup = (event) => {
    const next = this.isDown && this.isMove ? true : false;
    this.isDown = false;
    this.isMove = false;

    if (!next) return;

    if (this.startPos.x > this.endPos.x) {
      let sx = this.startPos.x;
      let ex = this.endPos.x;
      this.startPos.x = ex;
      this.endPos.x = sx;
    }

    if (this.startPos.y > this.endPos.y) {
      let sy = this.startPos.y;
      let ey = this.endPos.y;
      this.startPos.y = ey;
      this.endPos.y = sy;
    }

    //this.helperBox();

    this.getObjsFromBox();
  };

  // находим объекты, которые попали в область выделения
  getObjsFromBox() {
    const arrLines = [];
    const arrPoints = [];
    const arrDLines = [];
    const arrDPoints = [];

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI && svg['userData'].tag === 'line') {
          arrLines.push(svg);
        }
        if (svg['userData'].lineI && svg['userData'].tag === 'point') {
          arrPoints.push(svg);
        }
        if (svg['userData'].lineI && svg['userData'].tag === 'dline') {
          arrLines.push(svg);
        }
        if (svg['userData'].lineI && svg['userData'].tag === 'dpoint') {
          arrPoints.push(svg);
        }
      }
    });

    const x1 = this.startPos.x;
    const y1 = this.startPos.y;
    const x2 = this.endPos.x;
    const y2 = this.endPos.y;

    const form = [];
    form.push(new THREE.Vector2(x1, y1));
    form.push(new THREE.Vector2(x1, y2));
    form.push(new THREE.Vector2(x2, y2));
    form.push(new THREE.Vector2(x2, y1));

    arrLines.forEach((svg) => {
      const { a, b } = this.getCoordLine(svg);
      let result = this.checkPointInsideForm(a, form);
      if (result) this.selectedArr.objs.push(svg);
      if (!result) {
        result = this.checkPointInsideForm(b, form);
        if (result) this.selectedArr.objs.push(svg);
      }

      if (!result) {
        for (let i = 0; i < form.length; i++) {
          const i2 = i + 1 > form.length - 1 ? 0 : i + 1;
          const c = form[i];
          const d = form[i2];
          result = this.crossLine(a, b, c, d);

          if (result) {
            this.selectedArr.objs.push(svg);
            break;
          }
        }
      }
    });

    arrPoints.forEach((svg) => {
      const pos = this.getCoordPoint(svg);
      const result = this.checkPointInsideForm(pos, form);
      if (result) this.selectedArr.objs.push(svg);
    });

    arrDPoints.forEach((svg) => {
      const pos = this.getCoordPoint(svg);
      const result = this.checkPointInsideForm(pos, form);
      if (result) this.selectedArr.objs.push(svg);
    });

    this.selectedArr.objs.forEach((svg) => {
      this.actElem(svg, true);
    });
  }

  // точка внутри многоугольника
  checkPointInsideForm(point, p) {
    let result = false;
    let j = p.length - 1;
    for (let i = 0; i < p.length; i++) {
      if (
        ((p[i].y < point.y && p[j].y >= point.y) || (p[j].y < point.y && p[i].y >= point.y)) &&
        p[i].x + ((point.y - p[i].y) / (p[j].y - p[i].y)) * (p[j].x - p[i].x) < point.x
      )
        result = !result;
      j = i;
    }

    return result;
  }

  // Проверка двух отрезков на пересечение (ориентированная площадь треугольника)
  crossLine(a, b, c, d) {
    return (
      this.intersect_1(a.x, b.x, c.x, d.x) &&
      this.intersect_1(a.y, b.y, c.y, d.y) &&
      this.area_1(a, b, c) * this.area_1(a, b, d) <= 0 &&
      this.area_1(c, d, a) * this.area_1(c, d, b) <= 0
    );
  }

  intersect_1(a, b, c, d) {
    if (a > b) {
      const res = this.swap(a, b);
      a = res[0];
      b = res[1];
    }
    if (c > d) {
      const res = this.swap(c, d);
      c = res[0];
      d = res[1];
    }
    return Math.max(a, c) <= Math.min(b, d);
  }

  area_1(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }

  // меняем местами 2 значения
  swap(a, b) {
    let c;
    c = a;
    a = b;
    b = c;
    return [a, b];
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

  actElem(svg, act = false) {
    const stroke = !act ? 'rgb(0, 0, 0)' : '#ff0000';

    if (svg['userData'].tag === 'line') {
      svg.setAttribute('stroke', stroke);
    } else if (svg['userData'].tag === 'point') {
      svg.setAttribute('stroke', stroke);
      svg.setAttribute('fill', stroke);
    } else if (svg['userData'].tag === 'dline') {
      svg.setAttribute('stroke', stroke);
    } else if (svg['userData'].tag === 'dpoint') {
      svg.setAttribute('stroke', stroke);
      svg.setAttribute('fill', stroke);
    } else {
      return;
    }
  }

  clearSelected() {
    this.selectedArr.objs.forEach((svg) => {
      this.actElem(svg, false);
    });

    this.selectedArr.objs = [];

    this.setBoxVisibility('hidden');

    this.startPos = new THREE.Vector2();
    this.endPos = new THREE.Vector2();
  }

  // помошник для отображения Selectedbox, показывает построение линий разных цветов, чтобы видеть как строится box
  helperBox() {
    let x1 = this.startPos.x;
    let y1 = this.startPos.y;
    let x2 = this.endPos.x;
    let y2 = this.startPos.y;
    let line = this.createSvgLine({ x1, y1, x2, y2, stroke: '#ff0000' });
    this.containerSvg.children[0].append(line);

    x1 = this.startPos.x;
    y1 = this.endPos.y;
    x2 = this.endPos.x;
    y2 = this.endPos.y;
    line = this.createSvgLine({ x1, y1, x2, y2, stroke: '#0000ff' });
    this.containerSvg.children[0].append(line);

    x1 = this.startPos.x;
    y1 = this.startPos.y;
    x2 = this.startPos.x;
    y2 = this.endPos.y;
    line = this.createSvgLine({ x1, y1, x2, y2, stroke: '#222222' });
    this.containerSvg.children[0].append(line);

    x1 = this.endPos.x;
    y1 = this.startPos.y;
    x2 = this.endPos.x;
    y2 = this.endPos.y;
    line = this.createSvgLine({ x1, y1, x2, y2, stroke: '#00ff00' });
    this.containerSvg.children[0].append(line);
  }

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

    return svg;
  }
}
