import * as THREE from 'three';

export class IsometricSvgElem {
  container = null;
  containerSvg = null;

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
  }

  getContainerSvg() {
    return this.containerSvg;
  }

  // получаем svg, где находтся все элементы изометрии
  getSvgXmlns({ container }) {
    const svgXmlns = container.children[0];

    return svgXmlns;
  }

  // получаем все svg изометрии
  getSvgElems({ container, recursion = false }) {
    const elems = [];

    const svgXmlns = this.getSvgXmlns({ container });

    const recursionElems = ({ svg, elems = [] }) => {
      svg.childNodes.forEach((svgChild) => {
        elems.push(svgChild);
      });

      svg.childNodes.forEach((svgChild) => {
        recursionElems({ svg: svgChild, elems });
      });

      return elems;
    };

    svgXmlns.childNodes.forEach((svg) => {
      if (recursion) {
        elems.push(...recursionElems({ svg }));
      } else {
        if (svg.tagName === 'g' && svg.getAttribute('nameid')) {
          elems.push(...svg.childNodes);
        } else {
          elems.push(svg);
        }
      }
    });

    return elems;
  }

  // получаем группу
  getSvgGroup({ container = this.containerSvg, tag }) {
    let group = null;

    const svgXmlns = this.getSvgXmlns({ container });

    svgXmlns.childNodes.forEach((svg) => {
      if (svg.tagName === 'g') {
        const result = svg.getAttribute('nameid');
        if (result && result === tag) group = svg;
      }
    });

    return group ? group : svgXmlns;
  }

  // получаем объект из группы
  getSvgByGroupById({ tag = 'objs', id }) {
    const elems = this.getSvgGroup({ container: this.containerSvg, tag });

    let svgElem = null;

    elems.childNodes.forEach((svg) => {
      if (svg['userData'] && svg['userData'].id && svg['userData'].id === id) {
        svgElem = svg;
      }
    });

    return svgElem;
  }

  // получаем значения viewBox
  getSizeViewBox({ container }) {
    const svgXmlns = this.getSvgXmlns({ container });
    const w = svgXmlns.viewBox.baseVal.width;
    const h = svgXmlns.viewBox.baseVal.height;

    return new THREE.Vector2(w, h);
  }

  // получаем координаты курсора
  getCoordMouse({ event, container = this.containerSvg }) {
    const bound = container.getBoundingClientRect();
    const x = -bound.x + event.clientX;
    const y = -bound.y + event.clientY;

    const size = this.getSizeViewBox({ container });
    const ratio = size.x / bound.width;

    return new THREE.Vector2(x * ratio, y * ratio);
  }

  getSvgType(svg) {
    return svg.tagName;
  }

  // создаем svg line елемент
  createSvgLine({ x1, y1, x2, y2, stroke = '#000000', dasharray = null }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'line');

    svg.setAttribute('x1', x1);
    svg.setAttribute('y1', y1);
    svg.setAttribute('x2', x2);
    svg.setAttribute('y2', y2);
    svg.setAttribute('stroke-width', '2.5px');
    svg.setAttribute('stroke', stroke);

    if (dasharray) svg.setAttribute('stroke-dasharray', dasharray);

    return svg;
  }

  // создаем svg точки
  createSvgCircle({ ind = 0, x, y, r = '3.2', stroke = '#000000', fill = '#000000', display = '' }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);
    svg.setAttribute('r', r);
    svg.setAttribute('stroke-width', '2px');
    svg.setAttribute('stroke', stroke);
    svg.setAttribute('transform-origin', 'center');
    svg.setAttribute('fill', fill);
    svg.setAttribute('ind', ind);
    svg.setAttributeNS(null, 'style', 'transform: translateX(0) translateY(0);');
    svg.setAttribute('display', display);

    return svg;
  }

  createSvgEllipse({ ind = 0, x, y, rx = '10', ry = '10', strokeWidth = '2px', stroke = '#000000', fill = '#000000', display = '' }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');

    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);
    svg.setAttribute('rx', rx);
    svg.setAttribute('ry', ry);
    svg.setAttribute('stroke-width', strokeWidth);
    svg.setAttribute('stroke', stroke);
    svg.setAttribute('transform-origin', 'center');
    svg.setAttribute('fill', fill);
    svg.setAttribute('ind', ind);
    //svg.setAttributeNS(null, 'style', 'transform: translateX(0) translateY(0);');
    svg.setAttribute('display', display);

    return svg;
  }

  createPolygon({ x, y, points, fill = 'rgb(0, 0, 0)', stroke = 'rgb(0, 0, 0)' }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');

    svg.setAttribute('points', points);
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke', stroke);
    svg.setAttribute('fill', fill);
    svg.setAttribute('transform', `translate(${x}, ${y}) rotate(0)`);

    return svg;
  }

  // координаты линии через 2 точки привязанные к линии
  getPosLine1(svg) {
    const p1 = this.getPosCircle(svg['userData'].p1);
    const p2 = this.getPosCircle(svg['userData'].p2);

    return [p1, p2];
  }

  getPosLine2(svg) {
    const x1 = Number(svg.getAttribute('x1'));
    const y1 = Number(svg.getAttribute('y1'));
    const x2 = Number(svg.getAttribute('x2'));
    const y2 = Number(svg.getAttribute('y2'));

    return [new THREE.Vector2(x1, y1), new THREE.Vector2(x2, y2)];
  }

  getPosCircle(svg) {
    const cx = Number(svg.getAttribute('cx'));
    const cy = Number(svg.getAttribute('cy'));

    return new THREE.Vector2(cx, cy);
  }

  getPosText1(svg) {
    const x = Number(svg.getAttribute('x'));
    const y = Number(svg.getAttribute('y'));

    return new THREE.Vector2(x, y);
  }

  getPosPolygon(svg) {
    return new THREE.Vector2(svg.transform.baseVal[0].matrix.e, svg.transform.baseVal[0].matrix.f);
  }

  setPosLine1(svg, x1, y1, x2, y2) {
    svg.setAttribute('x1', Number(x1));
    svg.setAttribute('y1', Number(y1));
    svg.setAttribute('x2', Number(x2));
    svg.setAttribute('y2', Number(y2));
  }

  // меняем положение линии, более продвинутая версия (где можно обновлять любую позицию)
  setPosLine2({ svg, x1 = null, y1 = null, x2 = null, y2 = null }) {
    if (x1) svg.setAttribute('x1', Number(x1));
    if (y1) svg.setAttribute('y1', Number(y1));
    if (x2) svg.setAttribute('x2', Number(x2));
    if (y2) svg.setAttribute('y2', Number(y2));
  }

  setPosCircle(svg, cx, cy) {
    svg.setAttribute('cx', Number(cx));
    svg.setAttribute('cy', Number(cy));
  }

  setPosText1(svg, x, y) {
    svg.setAttribute('x', Number(x));
    svg.setAttribute('y', Number(y));

    if (svg.transform.baseVal.length > 0) {
      const rotY = svg.transform.baseVal[0].angle;
      svg.setAttribute('transform', 'rotate(' + rotY + ', ' + Number(x) + ',' + Number(y) + ')');
    }
  }

  // позиция полигона
  setPosPolygon1(svg, x, y) {
    const rot = svg.transform.baseVal[1].angle;

    svg.setAttribute('transform', `translate(${x}, ${y}) rotate(${rot})`);
  }

  // поворот точки
  setRotCircle_1({ svg, centerPos, deg, offsetX = 0, offsetY = 0 }) {
    const rad = THREE.MathUtils.degToRad(deg - 90);
    const cx = offsetY * Math.cos(rad) - offsetX * Math.sin(rad);
    const cy = offsetY * Math.sin(rad) + offsetX * Math.cos(rad);

    this.setPosCircle(svg, centerPos.x + cx, centerPos.y + cy);
  }

  // поворот точки относительно другой точки
  setRotCircle_2({ point, centerPoint, deg = 0 }) {
    const pos1 = this.getPosCircle(centerPoint);
    const pos2 = this.getPosCircle(point);

    const offset = pos1.clone().sub(pos2);

    const rad = THREE.MathUtils.degToRad(deg - 90);
    const cx = offset.y * Math.cos(rad) - offset.x * Math.sin(rad);
    const cy = offset.y * Math.sin(rad) + offset.x * Math.cos(rad);

    this.setPosCircle(point, pos1.x + cx, pos1.y + cy);
  }

  // поворот полигона
  setRotPolygon1(svg, rot) {
    const x = svg.transform.baseVal[0].matrix.e;
    const y = svg.transform.baseVal[0].matrix.f;

    svg.setAttribute('transform', `translate(${x}, ${y}) rotate(${rot})`);
  }

  // смещение точки
  setOffsetCircle(svg, offsetX, offsetY) {
    const pos = this.getPosCircle(svg);

    svg.setAttribute('cx', pos.x + offsetX);
    svg.setAttribute('cy', pos.y + offsetY);
  }

  setOffsetEllipse(svg, offsetX, offsetY) {
    const pos = this.getPosCircle(svg);

    svg.setAttribute('cx', pos.x + offsetX);
    svg.setAttribute('cy', pos.y + offsetY);
  }

  // смещение линии
  setOffsetLine2(svg, offsetX, offsetY, scale = false) {
    const pos = this.getPosLine2(svg);

    const x1 = pos[0].x + offsetX;
    const y1 = pos[0].y + offsetY;
    const x2 = pos[1].x + offsetX;
    const y2 = pos[1].y + offsetY;

    this.setPosLine2({ svg, x1, y1, x2, y2 });

    if (scale) {
      const transform = svg.getAttribute('transform');
      if (transform) {
        const result = transform.split(',');
        if (result.length > 2) {
          const x = Number(result[1]);
          const y = Number(result[2].slice(0, -1));
          const rotY = svg.transform.baseVal[0].angle;
          svg.setAttribute('transform', 'rotate(' + rotY + ', ' + (x + offsetX) + ',' + (y + offsetY) + ')');
        }
      }
    }
  }

  // смещение полигона
  setOffsetPolygon1(svg, offsetX, offsetY) {
    const x = svg.transform.baseVal[0].matrix.e + offsetX;
    const y = svg.transform.baseVal[0].matrix.f + offsetY;
    const rot = svg.transform.baseVal[1].angle;

    svg.setAttribute('transform', `translate(${x}, ${y}) rotate(${rot})`);
  }

  // смещение текста
  setOffsetText1(svg, offsetX, offsetY) {
    const pos = this.getPosText1(svg);

    svg.setAttribute('x', pos.x + offsetX);
    svg.setAttribute('y', pos.y + offsetY);

    if (svg.transform.baseVal.length > 0) {
      const rotY = svg.transform.baseVal[0].angle;
      svg.setAttribute('transform', 'rotate(' + rotY + ', ' + (pos.x + offsetX) + ',' + (pos.y + offsetY) + ')');
    }
  }

  // обновляем положения линии через 2 точки привязанные к линии
  upPosLine1(svg) {
    const pos = this.getPosLine1(svg);

    this.setPosLine1(svg, pos[0].x, pos[0].y, pos[1].x, pos[1].y);
  }

  // парсер svg (вытаскиваем все элементы в группе и строим дерево)
  parserSvg({ svg, data = [] }) {
    const isSvg = this.isSvg({ elem: svg });

    if (isSvg) {
      const type = this.getSvgType(svg);

      //console.log(svg, type);

      const transform = svg.getAttribute('transform');

      if (type === 'line') {
        const pos = this.getPosLine2(svg);

        data.push({ type, pos });
      }
      if (type === 'circle') {
        data.push({ type });
      }
      if (type === 'ellipse') {
        data.push({ type });
      }
      if (type === 'polygon') {
        const points = svg.getAttribute('points');
        const x = svg.transform.baseVal[0].matrix.e;
        const y = svg.transform.baseVal[0].matrix.f;
        data.push({ type, pos: new THREE.Vector2(x, y), points });
      }
      if (type === 'path') {
        const d = svg.getAttribute('d');
        const stroke = svg.getAttribute('stroke');
        const strokeWidth = svg.getAttribute('stroke-width');
        const strokeLinecap = svg.getAttribute('stroke-linecap');
        const fillRule = svg.getAttribute('fill-rule');
        const fill = svg.getAttribute('fill');

        data.push({ type, transform, d, stroke, strokeWidth, strokeLinecap, fill, fillRule });
      }
      if (type === 'text') {
        const pos = this.getPosText1(svg);
        const textContent = svg.textContent;

        const className = svg.getAttribute('class');

        const classCss = document.querySelector(`.${className}`);
        const style = getComputedStyle(classCss);

        data.push({ type, pos, textContent, cssText: style.font, transform });
      }
      if (type === 'g') {
        const fill = svg.getAttribute('fill');

        data.push({ type, elems: [], fill, transform });

        svg.childNodes.forEach((svgChild) => {
          this.parserSvg({ svg: svgChild, data: data[data.length - 1].elems });
        });
      }
    }

    return data;
  }

  isSvg({ elem }) {
    let isSvg = false;

    const type = this.getSvgType(elem);
    const types = ['g', 'line', 'circle', 'ellipse', 'polygon', 'path', 'text', 'rect', 'defs'];

    for (let i = 0; i < types.length; i++) {
      if (type === types[i]) {
        isSvg = true;
        break;
      }
    }

    return isSvg;
  }
}
