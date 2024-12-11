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
}
