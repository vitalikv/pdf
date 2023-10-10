import * as THREE from 'three';

export class IsometricSvgElem {
  // получаем все svg изометрии
  getSvgElems({ container }) {
    const elems = [];

    const svgXmlns = container.children[0];

    svgXmlns.childNodes.forEach((svg) => {
      if (svg.tagName === 'g' && svg.getAttribute('nameid')) elems.push(...svg.childNodes);
      else elems.push(svg);
    });

    return elems;
  }

  // получаем группу
  getSvgGroup({ container, tag }) {
    let group = null;

    const svgXmlns = container.children[0];

    svgXmlns.childNodes.forEach((svg) => {
      if (svg.tagName === 'g') {
        const result = svg.getAttribute('nameid');
        if (result && result === tag) group = svg;
      }
    });

    return group ? group : svgXmlns;
  }

  // получаем координаты курсора
  getCoordMouse({ event, container }) {
    const bound = container.getBoundingClientRect();
    const x = -bound.x + event.clientX;
    const y = -bound.y + event.clientY;

    const svgL = container.children[0];
    const w2 = svgL.viewBox.baseVal.width;
    const h2 = svgL.viewBox.baseVal.height;
    const ratio = w2 / bound.width;

    return new THREE.Vector2(x * ratio, y * ratio);
  }

  // создаем svg line елемент
  createSvgLine({ x1, y1, x2, y2, stroke = '#000000' }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'line');

    svg.setAttribute('x1', x1);
    svg.setAttribute('y1', y1);
    svg.setAttribute('x2', x2);
    svg.setAttribute('y2', y2);
    svg.setAttribute('stroke-width', '2.5px');
    svg.setAttribute('stroke', stroke);

    return svg;
  }

  // создаем svg точки
  createSvgCircle({ ind = 0, x, y, r = '3.2', stroke = '#000000' }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);
    svg.setAttribute('r', r);
    svg.setAttribute('stroke-width', '2px');
    svg.setAttribute('stroke', stroke);
    svg.setAttribute('transform-origin', 'center');
    svg.setAttribute('fill', stroke);
    svg.setAttribute('ind', ind);
    svg.setAttributeNS(null, 'style', 'transform: translateX(0) translateY(0);');

    return svg;
  }

  createPolygon({ ind = 0, x, y, points }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');

    svg.setAttribute('points', points);
    svg.setAttribute('stroke-width', '1');
    svg.setAttribute('stroke', 'rgb(0, 0, 0)');
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
  }

  // смещение полигона
  setPosPolygon1(svg, x, y) {
    const rot = svg.transform.baseVal[1].angle;

    svg.setAttribute('transform', `translate(${x}, ${y}) rotate(${rot})`);
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

  // смещение линии
  setOffsetLine2(svg, offsetX, offsetY) {
    const pos = this.getPosLine2(svg);

    const x1 = pos[0].x + offsetX;
    const y1 = pos[0].y + offsetY;
    const x2 = pos[1].x + offsetX;
    const y2 = pos[1].y + offsetY;

    this.setPosLine2({ svg, x1, y1, x2, y2 });
  }

  // смещение полигона
  setOffsetPolygon1(svg, offsetX, offsetY) {
    const x = svg.transform.baseVal[0].matrix.e + offsetX;
    const y = svg.transform.baseVal[0].matrix.f + offsetY;
    const rot = svg.transform.baseVal[1].angle;

    svg.setAttribute('transform', `translate(${x}, ${y}) rotate(${rot})`);
  }

  // обновляем положения линии через 2 точки привязанные к линии
  upPosLine1(svg) {
    const pos = this.getPosLine1(svg);

    this.setPosLine1(svg, pos[0].x, pos[0].y, pos[1].x, pos[1].y);
  }
}
