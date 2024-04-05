import { isometricSvgElem } from './index';

export class IsometricSvgListObjs {
  container;
  containerSvg;
  svgPointsScale;

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
    this.groupLines = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'lines' });
    this.groupObjs = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'objs' });

    this.svgPointsScale = this.createPointsScale();
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

  createSvgCircle({ x, y, r = 4.2, fill = '#fff' }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);

    svg.setAttribute('r', r);
    svg.setAttribute('stroke-width', '2px');
    svg.setAttribute('stroke', 'rgb(0, 0, 0)');
    svg.setAttribute('transform-origin', 'center');

    svg.setAttribute('fill', fill);

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
    this.groupObjs.append(svg4);
    this.groupObjs.append(svg5);
    this.groupObjs.append(svg3);

    const profile = {
      svg1: {
        points: [
          [0, 0],
          [20, 15],
          [20, -15],
        ],
      },
      svg2: {
        points: [
          [0, 0],
          [-20, 15],
          [-20, -15],
        ],
      },
      svg4: { x1: 0, y1: 0, x2: 0, y2: 0 - 20 },
      svg5: { x1: 0 - 10, y1: 0 - 20, x2: 0 + 10, y2: 0 - 20 },
      scale: 1,
    };

    svg1['userData'] = { objValve: true, tag: 'line1', lock: false, elems: [svg1, svg2, svg3, svg4, svg5] };
    svg2['userData'] = { objValve: true, tag: 'line2', lock: false, elems: [svg1, svg2, svg3, svg4, svg5] };
    svg3['userData'] = { objValve: true, tag: 'point', lock: false, elems: [svg1, svg2, svg3, svg4, svg5], crossOffset: false, link: null, profile };
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

    const profile = {
      svg1: {
        points: [
          [0, 0],
          [20, 15],
          [20, -15],
        ],
      },
      svg2: {
        points: [
          [0, 0],
          [-20, 15],
          [-20, -15],
        ],
      },
      scale: 1,
    };

    svg1['userData'] = { objFlap: true, tag: 'line1', lock: false, elems: [svg1, svg2, svg3] };
    svg2['userData'] = { objFlap: true, tag: 'line2', lock: false, elems: [svg1, svg2, svg3] };
    svg3['userData'] = { objFlap: true, tag: 'point', lock: false, elems: [svg1, svg2, svg3], crossOffset: false, link: null, profile };

    return { svg1, svg2, svg3 };
  }

  createObjTee({ x, y }) {
    const svg1 = this.createSvgLine({ x1: x - 20, y1: y, x2: x + 20, y2: y });
    const svg2 = this.createSvgLine({ x1: x, y1: y, x2: x, y2: y + 20 });
    const svg3 = this.createSvgCircle({ x: x, y: y });

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

    const profile = {
      svg1: {
        points: [
          [0, 0],
          [20, 15],
          [20, -15],
        ],
      },
      scale: 1,
    };

    svg1['userData'] = { objAdapter: true, tag: 'line1', lock: false, elems: [svg1, svg2] };
    svg2['userData'] = { objAdapter: true, tag: 'point', lock: false, elems: [svg1, svg2], crossOffset: false, link: null, profile };

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

  createPointsScale() {
    const svgP1 = this.createSvgCircle({ x: -999999, y: -999999, fill: '#000' });
    const svgP2 = this.createSvgCircle({ x: -999999, y: -999999, fill: '#000' });

    svgP1['userData'] = { pointScale: true, id: 0, elems: [svgP1, svgP2] };
    svgP2['userData'] = { pointScale: true, id: 1, elems: [svgP1, svgP2] };

    this.groupObjs.append(svgP1);
    this.groupObjs.append(svgP2);

    return { p1: svgP1, p2: svgP2 };
  }

  actPointsScale({ point, p1 = false, p2 = false, offsetX }) {
    const svgP = p1 ? this.svgPointsScale.p1 : this.svgPointsScale.p2;

    this.groupObjs.append(svgP);
    const posC = isometricSvgElem.getPosCircle(point);
    const rotY1 = point['userData'].rotY1;

    isometricSvgElem.setPosCircle(svgP, posC.x + offsetX, posC.y);
    svgP.setAttribute('transform', 'rotate(' + rotY1 + ', ' + posC.x + ',' + posC.y + ')');
    svgP.setAttribute('display', '');
  }

  deActPointsScale() {
    this.svgPointsScale.p1.setAttribute('display', 'none');
    this.svgPointsScale.p2.setAttribute('display', 'none');
  }

  scaleObj(svg) {
    const elems = this.getStructureObj(svg);
    const profile = elems.point['userData'].profile;
    if (!profile) return;

    if (elems.point['userData'].objValve) {
      const scale = 1.0;

      let points = profile.svg1.points;
      for (let i = 0; i < points.length; i++) {
        const p = elems.line1.points[i];
        p.x = points[i][0] * scale;
        p.y = points[i][1] * scale;
      }
      this.actPointsScale({ point: elems.point, p1: true, offsetX: points[1][0] * scale });

      points = profile.svg2.points;
      for (let i = 0; i < points.length; i++) {
        const p = elems.line2.points[i];
        p.x = points[i][0] * scale;
        p.y = points[i][1] * scale;
      }
      this.actPointsScale({ point: elems.point, p2: true, offsetX: points[1][0] * scale });

      //setPosLine1(svg, x1, y1, x2, y2)
    }

    if (elems.point['userData'].objFlap) {
      const scale = 1.0;

      let points = profile.svg1.points;
      for (let i = 0; i < points.length; i++) {
        const p = elems.line1.points[i];
        p.x = points[i][0] * scale;
        p.y = points[i][1] * scale;
      }
      this.actPointsScale({ point: elems.point, p1: true, offsetX: points[1][0] * scale });

      points = profile.svg2.points;
      for (let i = 0; i < points.length; i++) {
        const p = elems.line2.points[i];
        p.x = points[i][0] * scale;
        p.y = points[i][1] * scale;
      }
      this.actPointsScale({ point: elems.point, p2: true, offsetX: points[1][0] * scale });
    }

    if (elems.point['userData'].objAdapter) {
      const scale = 1.0;

      let points = profile.svg1.points;
      for (let i = 0; i < points.length; i++) {
        const p = elems.line1.points[i];
        p.x = points[i][0] * scale;
        p.y = points[i][1] * scale;
      }
      this.actPointsScale({ point: elems.point, p1: true, offsetX: points[1][0] * scale });
    }
  }

  getStructureObj(svg) {
    let elems = {};

    if (svg['userData'].objBracket) {
      elems = {
        line1: svg['userData'].elems[0],
        line2: svg['userData'].elems[1],
        point: svg['userData'].elems[2],
      };
    }

    if (svg['userData'].objValve) {
      elems = {
        line1: svg['userData'].elems[0],
        line2: svg['userData'].elems[1],
        point: svg['userData'].elems[2],
        line3: svg['userData'].elems[3],
        line4: svg['userData'].elems[4],
      };
    }

    if (svg['userData'].objTee) {
      elems = {
        line1: svg['userData'].elems[0],
        line2: svg['userData'].elems[1],
        point: svg['userData'].elems[2],
      };
    }

    if (svg['userData'].objUndefined) {
      elems = {
        line1: svg['userData'].elems[0],
        line2: svg['userData'].elems[1],
      };
    }

    if (svg['userData'].objFlap) {
      elems = {
        line1: svg['userData'].elems[0],
        line2: svg['userData'].elems[1],
        point: svg['userData'].elems[2],
      };
    }

    if (svg['userData'].objAdapter) {
      elems = {
        line1: svg['userData'].elems[0],
        point: svg['userData'].elems[1],
      };
    }

    if (svg['userData'].objBox) {
      elems = {
        line1: svg['userData'].elems[0],
        point: svg['userData'].elems[1],
      };
    }

    if (svg['userData'].objSplitter) {
      elems = {
        line1: svg['userData'].elems[0],
        point: svg['userData'].elems[1],
        line2: svg['userData'].elems[2],
        line3: svg['userData'].elems[3],
      };
    }

    return elems;
  }

  isObjBySvg(svg) {
    const isObj =
      svg['userData'].objBracket ||
      svg['userData'].objValve ||
      svg['userData'].objUndefined ||
      svg['userData'].objTee ||
      svg['userData'].objFlap ||
      svg['userData'].objAdapter ||
      svg['userData'].objBox ||
      svg['userData'].objSplitter
        ? true
        : false;

    return isObj;
  }
}
