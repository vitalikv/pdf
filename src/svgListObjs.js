import { isometricSvgElem } from './index';

export class IsometricListObjs {
  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
    this.groupLines = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'lines' });
    this.groupObjs = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'objs' });
  }

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

  createSvgCircle({ x, y, r = 4.2 }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);

    svg.setAttribute('r', r);
    svg.setAttribute('stroke-width', '2px');
    svg.setAttribute('stroke', 'rgb(0, 0, 0)');
    svg.setAttribute('transform-origin', 'center');

    svg.setAttribute('fill', '#fff');

    svg.setAttributeNS(null, 'style', 'transform: translateX(0) translateY(0);');
    svg.setAttribute('display', 'none');

    return svg;
  }

  createObjBracket({ x, y }) {
    const svg1 = this.createSvgLine({ x1: x - 10, y1: y + 10, x2: x + 10, y2: y + 10 });
    const svg2 = this.createSvgLine({ x1: x - 10, y1: y - 10, x2: x + 10, y2: y - 10 });
    const svg3 = this.createSvgCircle({ x, y });

    this.groupObjs.append(svg1);
    this.groupObjs.append(svg2);
    this.groupObjs.append(svg3);

    svg1['userData'] = { objBracket: true, tag: 'line1', lock: false, elems: [svg1, svg2, svg3] };
    svg2['userData'] = { objBracket: true, tag: 'line2', lock: false, elems: [svg1, svg2, svg3] };
    svg3['userData'] = { objBracket: true, tag: 'point', lock: false, elems: [svg1, svg2, svg3], crossOffset: false, link: null };

    return { svg1, svg2, svg3 };
  }

  createObjValve({ x, y }) {
    const svg1 = isometricSvgElem.createPolygon({ x, y, points: '0,0 20,15 20,-15', fill: 'rgb(255, 255, 255)' });
    const svg2 = isometricSvgElem.createPolygon({ x, y, points: '0,0 -20,15 -20,-15', fill: 'rgb(255, 255, 255)' });
    const svg3 = this.createSvgCircle({ x, y });
    const svg4 = this.createSvgLine({ x1: x, y1: y, x2: x, y2: y - 20 });
    const svg5 = this.createSvgLine({ x1: x - 10, y1: y - 20, x2: x + 10, y2: y - 20 });

    this.groupObjs.append(svg1);
    this.groupObjs.append(svg2);
    this.groupObjs.append(svg3);
    this.groupObjs.append(svg4);
    this.groupObjs.append(svg5);

    svg1['userData'] = { objValve: true, tag: 'line1', lock: false, elems: [svg1, svg2, svg3, svg4, svg5] };
    svg2['userData'] = { objValve: true, tag: 'line2', lock: false, elems: [svg1, svg2, svg3, svg4, svg5] };
    svg3['userData'] = { objValve: true, tag: 'point', lock: false, elems: [svg1, svg2, svg3, svg4, svg5], crossOffset: false, link: null };
    svg4['userData'] = { objValve: true, tag: 'line3', lock: false, elems: [svg1, svg2, svg3, svg4, svg5] };
    svg5['userData'] = { objValve: true, tag: 'line4', lock: false, elems: [svg1, svg2, svg3, svg4, svg5] };

    return { svg1, svg2, svg3 };
  }

  createObjFlap({ x, y }) {
    const svg1 = isometricSvgElem.createPolygon({ x, y, points: '0,0 20,15 20,-15', fill: 'rgb(255, 255, 255)' });
    const svg2 = isometricSvgElem.createPolygon({ x, y, points: '0,0 -20,15 -20,-15', fill: 'rgb(0, 0, 0)' });
    const svg3 = this.createSvgCircle({ x, y });

    this.groupObjs.append(svg1);
    this.groupObjs.append(svg2);
    this.groupObjs.append(svg3);

    svg1['userData'] = { objFlap: true, tag: 'line1', lock: false, elems: [svg1, svg2, svg3] };
    svg2['userData'] = { objFlap: true, tag: 'line2', lock: false, elems: [svg1, svg2, svg3] };
    svg3['userData'] = { objFlap: true, tag: 'point', lock: false, elems: [svg1, svg2, svg3], crossOffset: false, link: null };

    return { svg1, svg2, svg3 };
  }

  createObjTee({ pos }) {
    const svg1 = this.createSvgLine({ x1: pos[0].x, y1: pos[0].y, x2: pos[1].x, y2: pos[1].y });
    const svg2 = this.createSvgLine({ x1: pos[2].x, y1: pos[2].y, x2: pos[3].x, y2: pos[3].y });
    const svg3 = this.createSvgCircle({ x: pos[2].x, y: pos[2].y });

    this.groupObjs.append(svg1);
    this.groupObjs.append(svg2);
    this.groupObjs.append(svg3);

    svg1['userData'] = { objTee: true, tag: 'line1', lock: false, elems: [svg1, svg2, svg3] };
    svg2['userData'] = { objTee: true, tag: 'line2', lock: false, elems: [svg1, svg2, svg3] };
    svg3['userData'] = { objTee: true, tag: 'point', lock: false, elems: [svg1, svg2, svg3] };

    return { svg1, svg2, svg3 };
  }

  createObjAdapter({ x, y }) {
    const svg1 = isometricSvgElem.createPolygon({ x, y, points: '0,0 20,15 20,-15', fill: 'rgb(255, 255, 255)' });
    const svg2 = this.createSvgCircle({ x, y });

    this.groupObjs.append(svg1);
    this.groupObjs.append(svg2);

    svg1['userData'] = { objAdapter: true, tag: 'line1', lock: false, elems: [svg1, svg2] };
    svg2['userData'] = { objAdapter: true, tag: 'point', lock: false, elems: [svg1, svg2], crossOffset: false, link: null };

    return { svg1, svg2 };
  }

  createObjBox({ x, y }) {
    const svg1 = isometricSvgElem.createPolygon({ x, y, points: '-20,-20 -20,20 20,20 20,-20', fill: 'rgb(255, 255, 255)' });
    const svg2 = this.createSvgCircle({ x, y });

    this.groupObjs.append(svg1);
    this.groupObjs.append(svg2);

    svg1['userData'] = { objBox: true, tag: 'line1', lock: false, elems: [svg1, svg2] };
    svg2['userData'] = { objBox: true, tag: 'point', lock: false, elems: [svg1, svg2], crossOffset: false, link: null };

    return { svg1, svg2 };
  }

  createObjSplitter({ x, y }) {
    const svg1 = isometricSvgElem.createPolygon({ x, y, points: '-5,-20 -5,20 5,20 5,-20', fill: 'rgb(255, 255, 255)', stroke: 'rgb(255, 255, 255)' });
    const svg2 = this.createSvgCircle({ x, y });
    const svg3 = this.createSvgLine({ x1: x - 5, y1: y - 20, x2: x - 5, y2: y + 20 });
    const svg4 = this.createSvgLine({ x1: x + 5, y1: y - 20, x2: x + 5, y2: y + 20 });

    this.groupObjs.append(svg1);
    this.groupObjs.append(svg2);
    this.groupObjs.append(svg3);
    this.groupObjs.append(svg4);

    svg1['userData'] = { objSplitter: true, tag: 'line1', lock: false, elems: [svg1, svg2, svg3, svg4] };
    svg2['userData'] = { objSplitter: true, tag: 'point', lock: false, elems: [svg1, svg2, svg3, svg4], crossOffset: false, link: null };
    svg3['userData'] = { objSplitter: true, tag: 'line2', lock: false, elems: [svg1, svg2, svg3, svg4] };
    svg4['userData'] = { objSplitter: true, tag: 'line3', lock: false, elems: [svg1, svg2, svg3, svg4] };

    return { svg1, svg2 };
  }

  createObjUndefined({ pos }) {
    const x = (pos[1].x - pos[0].x) / 2 + pos[0].x;
    const y = (pos[1].y - pos[0].y) / 2 + pos[0].y;

    const svg1 = this.createSvgLine({ x1: pos[0].x, y1: pos[0].y, x2: pos[1].x, y2: pos[1].y });
    const svg2 = isometricSvgElem.createPolygon({ x, y, points: '-10,-5 -10,5 10,5 10,-5', fill: 'rgb(255, 255, 255)' });

    this.groupObjs.append(svg1);
    this.groupObjs.append(svg2);

    svg1['userData'] = { objUndefined: true, tag: 'line1', lock: false, elems: [svg1, svg2] };
    svg2['userData'] = { objUndefined: true, tag: 'line2', lock: false, elems: [svg1, svg2] };

    const dir = pos[1].sub(pos[0]);
    const rotY = Math.atan2(dir.x, dir.y);
    const rotY1 = THREE.MathUtils.radToDeg(rotY - Math.PI / 2) * -1;
    //const pos2 = isometricSvgElem.getPosCircle(elems.point);
    isometricSvgElem.setRotPolygon1(svg2, rotY1);
    //svg2.setAttribute('transform', 'rotate(' + rotY1 + ', ' + x + ',' + y + ')');

    return { svg1, svg2 };
  }
}
