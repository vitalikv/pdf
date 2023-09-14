import * as THREE from 'three';

export class IsometricSvgElem {
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

  // координаты линии
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

  setPosLine1(svg, x1, y1, x2, y2) {
    svg.setAttribute('x1', Number(x1));
    svg.setAttribute('y1', Number(y1));
    svg.setAttribute('x2', Number(x2));
    svg.setAttribute('y2', Number(y2));
  }

  setPosCircle(svg, cx, cy) {
    svg.setAttribute('cx', Number(cx));
    svg.setAttribute('cy', Number(cy));
  }

  setPosText1(svg, x, y) {
    svg.setAttribute('x', Number(x));
    svg.setAttribute('y', Number(y));
  }
}
