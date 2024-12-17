import { isometricSvgElem } from '../index';

export class IsometricSvgLineType {
  getLineThickness({ svg }) {
    let value = 0;

    const type = isometricSvgElem.getSvgType(svg);

    if (type === 'line') {
      let str = svg.getAttribute('stroke-width');

      value = parseFloat(str);
    }

    return value;
  }

  setLineThickness({ svg, value }) {
    svg.setAttribute('stroke-width', value + 'px');
  }

  getLineType({ svg }) {
    let stroke = 'stroke';

    const type = isometricSvgElem.getSvgType(svg);

    if (type === 'line') {
      stroke = svg.getAttribute('stroke');
    }

    return stroke;
  }

  setLineType({ svg, stroke }) {
    svg.setAttribute('stroke', stroke);
  }
}
