import * as THREE from 'three';

import { isometricSvgElem } from './index';

export class IsometricSvgListObjs {
  container;
  containerSvg;
  svgPointsScale;

  idSvg = 0;
  isDown = false;
  isMove = false;
  offset = new THREE.Vector2();
  selectedObj = null;
  pivot = { dir: new THREE.Vector2(), startPos: new THREE.Vector2() };
  scaleScreen = 1;

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
    this.groupLines = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'lines' });
    this.groupObjs = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'objs' });

    this.svgPointsScale = this.createPointsScale();

    // const size = isometricSvgElem.getSizeViewBox({ container: this.containerSvg });
    // this.scaleScreen = size.x / 1747;
  }

  createSvgLine({ x1, y1, x2, y2, stroke = '#000000' }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'line');

    const strokeWidth = 2.5 * this.scaleScreen;
    svg.setAttribute('x1', x1);
    svg.setAttribute('y1', y1);
    svg.setAttribute('x2', x2);
    svg.setAttribute('y2', y2);
    svg.setAttribute('stroke-width', strokeWidth + 'px');
    svg.setAttribute('stroke', stroke);

    return svg;
  }

  createSvgCircle({ x, y, r = 4.2, fill = '#fff', display = 'none' }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);

    r = r * this.scaleScreen;
    const strokeWidth = 2 * this.scaleScreen;
    svg.setAttribute('r', r + '');
    svg.setAttribute('stroke-width', strokeWidth + 'px');
    svg.setAttribute('stroke', 'rgb(0, 0, 0)');
    svg.setAttribute('transform-origin', 'center');

    svg.setAttribute('fill', fill);

    svg.setAttributeNS(null, 'style', 'transform: translateX(0) translateY(0);');
    svg.setAttribute('display', display);

    return svg;
  }

  createSvgObj({ data }) {
    data = {
      tag: 'objValve',
      elements: [
        {
          id: 0,
          typeSvg: 'line',
          pos: [
            [0, 0],
            [0, -20],
          ],
        },
        {
          id: 1,
          typeSvg: 'line',
          pos: [
            [-10, -20],
            [10, -20],
          ],
        },
        {
          id: 2,
          tag: 'point',
          typeSvg: 'circle',
          pos: [[0, 0]],
        },
        {
          id: 3,
          typeSvg: 'polygon',
          pos: [
            [0, 0],
            [20, 15],
            [20, -15],
          ],
          fill: 'rgb(255, 255, 255)',
        },
        {
          id: 4,
          typeSvg: 'polygon',
          pos: [
            [0, 0],
            [-20, 15],
            [-20, -15],
          ],
          fill: 'rgb(255, 255, 255)',
        },
      ],
      params: {},
    };

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g['userData'] = { tag: data.tag, objValve: true, elems: [] };

    let offset = { x: 300, y: 300 };

    for (let i = 0; i < data.elements.length; i++) {
      const element = data.elements[i];

      let svg = null;

      if (element.typeSvg === 'circle') {
        const x = element.pos[0][0] + offset.x;
        const y = element.pos[0][1] + offset.y;
        const r = '4.2';
        const fill = '#fff';

        svg = isometricSvgElem.createSvgCircle({ x, y, r, fill });
      }
      if (element.typeSvg === 'line') {
        const x1 = element.pos[0][0] + offset.x;
        const y1 = element.pos[0][1] + offset.y;
        const x2 = element.pos[1][0] + offset.x;
        const y2 = element.pos[1][1] + offset.y;

        svg = isometricSvgElem.createSvgLine({ x1, y1, x2, y2 });
      }
      if (element.typeSvg === 'polygon') {
        let points = '';

        for (let i2 = 0; i2 < element.pos.length; i2++) {
          points += element.pos[i2][0] + ',' + element.pos[i2][1] + ' ';
        }

        svg = isometricSvgElem.createPolygon({ x: offset.x, y: offset.y, points, fill: element.fill });
      }

      if (svg) {
        svg['userData'] = {};
        if (element.tag) svg['userData'].tag = element.tag;

        g.append(svg);
      }
    }

    for (let i = 0; i < g.childNodes.length; i++) {
      const svg = g.childNodes[i];
      const type = isometricSvgElem.getSvgType(svg);
      if (type !== 'circle') continue;

      g.append(svg);
    }

    const elems = [];
    for (let i = 0; i < g.childNodes.length; i++) {
      const svg = g.childNodes[i];
      elems.push(svg);
    }
    g['userData'].elems = elems;

    this.groupObjs.append(g);
  }

  createObjBracket({ id = undefined, x, y, attributes = { guid: '0' } }) {
    const dl = 10 * this.scaleScreen;
    const svg1 = this.createSvgLine({ x1: x - dl, y1: y + dl, x2: x + dl, y2: y + dl });
    const svg2 = this.createSvgLine({ x1: x - dl, y1: y - dl, x2: x + dl, y2: y - dl });
    const svg3 = this.createSvgCircle({ x, y });

    this.groupObjs.append(svg1);
    this.groupObjs.append(svg2);
    this.groupObjs.append(svg3);

    if (id === undefined) {
      id = this.idSvg;
      this.idSvg++;
    }

    svg1['userData'] = { objBracket: true, tag: 'line1', lock: false, elems: [svg1, svg2, svg3] };
    svg2['userData'] = { objBracket: true, tag: 'line2', lock: false, elems: [svg1, svg2, svg3] };
    svg3['userData'] = { id, objBracket: true, tag: 'point', lock: false, elems: [svg1, svg2, svg3], crossOffset: false, link: null, attributes };

    return { svg1, svg2, svg3 };
  }

  createObjValve({ id = undefined, x, y, scale = 1, attributes = { guid: '0' } }) {
    const dl1 = 10 * this.scaleScreen;
    const dl2 = 20 * this.scaleScreen;
    const distDef = 20 * this.scaleScreen;
    const strokeWidth = 2 * this.scaleScreen;
    let ps1 = [
      [0, 0],
      [20, 15],
      [20, -15],
    ];
    let ps2 = [
      [0, 0],
      [-20, 15],
      [-20, -15],
    ];

    ps1.forEach((pos) => {
      pos[0] *= this.scaleScreen;
      pos[1] *= this.scaleScreen;
    });

    ps2.forEach((pos) => {
      pos[0] *= this.scaleScreen;
      pos[1] *= this.scaleScreen;
    });

    const pointsStr1 = ps1.map((item) => item.join(',')).join(' ');
    const pointsStr2 = ps2.map((item) => item.join(',')).join(' ');

    const svg1 = isometricSvgElem.createPolygon({ x, y, points: pointsStr1, fill: 'rgb(255, 255, 255)', strokeWidth: strokeWidth + '' });
    const svg2 = isometricSvgElem.createPolygon({ x, y, points: pointsStr2, fill: 'rgb(255, 255, 255)', strokeWidth: strokeWidth + '' });
    const svg3 = this.createSvgCircle({ x, y });
    const svg4 = this.createSvgLine({ x1: x, y1: y, x2: x, y2: y - dl2 });
    const svg5 = this.createSvgLine({ x1: x - dl1, y1: y - dl2, x2: x + dl1, y2: y - dl2 });

    this.groupObjs.append(svg1);
    this.groupObjs.append(svg2);
    this.groupObjs.append(svg4);
    this.groupObjs.append(svg5);
    this.groupObjs.append(svg3);

    const profile = {
      svg1: { points: ps1 },
      svg2: { points: ps2 },
      svg4: { x1: 0, y1: 0, x2: 0, y2: 0 - dl2 },
      svg5: { x1: 0 - dl1, y1: 0 - dl2, x2: 0 + dl1, y2: 0 - dl2 },
      scale,
      distDef,
    };

    if (id === undefined) {
      id = this.idSvg;
      this.idSvg++;
    }

    svg1['userData'] = { objValve: true, tag: 'line1', lock: false, elems: [svg1, svg2, svg3, svg4, svg5] };
    svg2['userData'] = { objValve: true, tag: 'line2', lock: false, elems: [svg1, svg2, svg3, svg4, svg5] };
    svg3['userData'] = { id, objValve: true, tag: 'point', lock: false, elems: [svg1, svg2, svg3, svg4, svg5], crossOffset: false, link: null, profile, attributes };
    svg4['userData'] = { objValve: true, tag: 'line3', lock: false, elems: [svg1, svg2, svg3, svg4, svg5] };
    svg5['userData'] = { objValve: true, tag: 'line4', lock: false, elems: [svg1, svg2, svg3, svg4, svg5] };

    if (scale !== 1) this.scaleObj(svg1, scale);

    return { svg1, svg2, svg3 };
  }

  createObjFlap({ id = undefined, x, y, scale = 1, attributes = { guid: '0' } }) {
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
      scale,
      distDef: 20,
    };

    if (id === undefined) {
      id = this.idSvg;
      this.idSvg++;
    }

    svg1['userData'] = { objFlap: true, tag: 'line1', lock: false, elems: [svg1, svg2, svg3] };
    svg2['userData'] = { objFlap: true, tag: 'line2', lock: false, elems: [svg1, svg2, svg3] };
    svg3['userData'] = { id, objFlap: true, tag: 'point', lock: false, elems: [svg1, svg2, svg3], crossOffset: false, link: null, profile, attributes };

    if (scale !== 1) this.scaleObj(svg1, scale);

    return { svg1, svg2, svg3 };
  }

  createObjTee({ id = undefined, x, y, scale = 1, attributes = { guid: '0' } }) {
    const size = 20 * scale;
    const svg1 = this.createSvgLine({ x1: x - size, y1: y, x2: x + size, y2: y });
    const svg2 = this.createSvgLine({ x1: x, y1: y, x2: x, y2: y + size });
    const svg3 = this.createSvgCircle({ x: x, y: y });
    const svg4 = this.createSvgCircle({ x: x - size, y: y, r: '3.2', fill: '#000000', display: '' });
    const svg5 = this.createSvgCircle({ x: x + size, y: y, r: '3.2', fill: '#000000', display: '' });
    const svg6 = this.createSvgCircle({ x: x, y: y + size, r: '3.2', fill: '#000000', display: '' });

    const arr = [svg1, svg2, svg3, svg4, svg5, svg6];

    arr.forEach((svg) => {
      this.groupObjs.append(svg);
    });

    if (id === undefined) {
      id = this.idSvg;
      this.idSvg++;
    }

    svg1['userData'] = { objTee: true, tag: 'line1', lock: false, elems: arr };
    svg2['userData'] = { objTee: true, tag: 'line2', lock: false, elems: arr };
    svg3['userData'] = { id, objTee: true, tag: 'point', lock: false, elems: arr, attributes };
    svg4['userData'] = { objTee: true, tag: 'joint1', lock: false, elems: arr };
    svg5['userData'] = { objTee: true, tag: 'joint2', lock: false, elems: arr };
    svg6['userData'] = { objTee: true, tag: 'joint3', lock: false, elems: arr };

    return { svg1, svg2, svg3 };
  }

  createObjAdapter({ id = undefined, x, y, scale = 1, attributes = { guid: '0' } }) {
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
      scale,
      distDef: 20,
    };

    if (id === undefined) {
      id = this.idSvg;
      this.idSvg++;
    }

    svg1['userData'] = { objAdapter: true, tag: 'line1', lock: false, elems: [svg1, svg2] };
    svg2['userData'] = { id, objAdapter: true, tag: 'point', lock: false, elems: [svg1, svg2], crossOffset: false, link: null, profile, attributes };

    if (scale !== 1) this.scaleObj(svg1, scale);

    return { svg1, svg2 };
  }

  createObjBox({ id = undefined, x, y, scale = 1, attributes = { guid: '0' } }) {
    const svg1 = isometricSvgElem.createPolygon({ x, y, points: '-20,-20 -20,20 20,20 20,-20', fill: 'rgb(255, 255, 255)' });
    const svg2 = this.createSvgCircle({ x, y });

    this.groupObjs.append(svg1);
    this.groupObjs.append(svg2);

    const profile = {
      svg1: {
        points: [
          [-20, -20],
          [-20, 20],
          [20, 20],
          [20, -20],
        ],
      },
      scale,
      distDef: 20,
    };

    if (id === undefined) {
      id = this.idSvg;
      this.idSvg++;
    }

    svg1['userData'] = { objBox: true, tag: 'line1', lock: false, elems: [svg1, svg2] };
    svg2['userData'] = { id, objBox: true, tag: 'point', lock: false, elems: [svg1, svg2], crossOffset: false, link: null, profile, attributes };

    if (scale !== 1) this.scaleObj(svg1, scale);

    return { svg1, svg2 };
  }

  createObjSplitter({ id = undefined, x, y, attributes = { guid: '0' } }) {
    const svg1 = isometricSvgElem.createPolygon({ x, y, points: '-5,-20 -5,20 5,20 5,-20', fill: 'rgb(255, 255, 255)', stroke: 'rgb(255, 255, 255)' });
    const svg2 = this.createSvgCircle({ x, y });
    const svg3 = this.createSvgLine({ x1: x - 5, y1: y - 20, x2: x - 5, y2: y + 20 });
    const svg4 = this.createSvgLine({ x1: x + 5, y1: y - 20, x2: x + 5, y2: y + 20 });

    this.groupObjs.append(svg1);
    this.groupObjs.append(svg2);
    this.groupObjs.append(svg3);
    this.groupObjs.append(svg4);

    if (id === undefined) {
      id = this.idSvg;
      this.idSvg++;
    }

    svg1['userData'] = { objSplitter: true, tag: 'line1', lock: false, elems: [svg1, svg2, svg3, svg4], act: false };
    svg2['userData'] = { id, objSplitter: true, tag: 'point', lock: false, elems: [svg1, svg2, svg3, svg4], crossOffset: false, link: null, attributes };
    svg3['userData'] = { objSplitter: true, tag: 'line2', lock: false, elems: [svg1, svg2, svg3, svg4] };
    svg4['userData'] = { objSplitter: true, tag: 'line3', lock: false, elems: [svg1, svg2, svg3, svg4] };

    return { svg1, svg2 };
  }

  createObjUndefined({ id = undefined, pos, attributes = { guid: '0' } }) {
    const x = (pos[1].x - pos[0].x) / 2 + pos[0].x;
    const y = (pos[1].y - pos[0].y) / 2 + pos[0].y;

    const svg1 = this.createSvgLine({ x1: pos[0].x, y1: pos[0].y, x2: pos[1].x, y2: pos[1].y });
    const svg2 = isometricSvgElem.createPolygon({ x, y, points: '-10,-5 -10,5 10,5 10,-5', fill: 'rgb(255, 255, 255)' });

    this.groupObjs.append(svg1);
    this.groupObjs.append(svg2);

    svg1['userData'] = { objUndefined: true, tag: 'line1', lock: false, elems: [svg1, svg2] };
    svg2['userData'] = { objUndefined: true, tag: 'line2', lock: false, elems: [svg1, svg2], attributes };

    const dir = pos[1].sub(pos[0]);
    const rotY = Math.atan2(dir.x, dir.y);
    const rotY1 = THREE.MathUtils.radToDeg(rotY - Math.PI / 2) * -1;
    //const pos2 = isometricSvgElem.getPosCircle(elems.point);
    isometricSvgElem.setRotPolygon1(svg2, rotY1);
    //svg2.setAttribute('transform', 'rotate(' + rotY1 + ', ' + x + ',' + y + ')');

    return { svg1, svg2 };
  }

  createPointsScale() {
    const svgP1 = isometricSvgElem.createSvgCircle({ x: -999999, y: -999999, r: '4.2', fill: '#ffffff', display: 'none' });
    const svgP2 = isometricSvgElem.createSvgCircle({ x: -999999, y: -999999, r: '4.2', fill: '#ffffff', display: 'none' });
    const svgP3 = isometricSvgElem.createSvgCircle({ x: -999999, y: -999999, r: '4.2', fill: '#ffffff', display: 'none' });

    svgP1['userData'] = { pointScale: true, id: 0, elems: [svgP1, svgP2], svgObj: null };
    svgP2['userData'] = { pointScale: true, id: 1, elems: [svgP1, svgP2], svgObj: null };
    svgP3['userData'] = { pointScale: true, id: 2, elems: [svgP1, svgP2], svgObj: null };

    this.groupObjs.append(svgP1);
    this.groupObjs.append(svgP2);
    this.groupObjs.append(svgP3);

    return { p1: svgP1, p2: svgP2, p3: svgP3 };
  }

  actPointsScale({ point, p1 = false, p2 = false, offsetX }) {
    const svgP = p1 ? this.svgPointsScale.p1 : this.svgPointsScale.p2;

    this.groupObjs.append(svgP);
    const posC = isometricSvgElem.getPosCircle(point);
    const rotY1 = point['userData'].rotY1;
    if (!rotY1) return;

    isometricSvgElem.setRotCircle_1({ svg: svgP, centerPos: posC, deg: rotY1, offsetX });

    svgP.setAttribute('display', '');
    svgP['userData'].svgObj = point;

    if (point['userData'].objValve) this.actPointsScale3({ point });
  }

  actPointsScale3({ point }) {
    const svgP3 = this.svgPointsScale.p3;

    const posC = isometricSvgElem.getPosCircle(point);
    const rotY1 = point['userData'].rotY1;

    const rad = THREE.MathUtils.degToRad(rotY1 - 0);
    const cx = 0 * Math.cos(rad) + 28 * Math.sin(rad);
    const cy = 0 * Math.sin(rad) - 28 * Math.cos(rad);
    isometricSvgElem.setPosCircle(svgP3, posC.x + cx, posC.y + cy);

    svgP3.setAttribute('display', '');
    svgP3['userData'].svgObj = point;

    this.groupObjs.append(svgP3);
  }

  deActPointsScale() {
    this.svgPointsScale.p1.setAttribute('display', 'none');
    this.svgPointsScale.p2.setAttribute('display', 'none');
    this.svgPointsScale.p3.setAttribute('display', 'none');
  }

  scaleObj(svg, scale = null) {
    const elems = this.getStructureObj(svg);
    const profile = elems.point['userData'].profile;
    if (!profile) return;

    scale = scale ? scale : profile.scale;

    if (elems.point['userData'].objValve) {
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
      let points = profile.svg1.points;
      for (let i = 0; i < points.length; i++) {
        const p = elems.line1.points[i];
        p.x = points[i][0] * scale;
        p.y = points[i][1] * scale;
      }
      this.actPointsScale({ point: elems.point, p1: true, offsetX: points[1][0] * scale });
    }

    if (elems.point['userData'].objBox) {
      let points = profile.svg1.points;
      for (let i = 0; i < points.length; i++) {
        const p = elems.line1.points[i];
        p.x = points[i][0] * scale;
        p.y = points[i][1] * scale;
      }
      this.actPointsScale({ point: elems.point, p1: true, offsetX: points[1][0] * scale });
      this.actPointsScale({ point: elems.point, p2: true, offsetX: points[2][0] * scale });
    }

    profile.scale = scale;
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
        joint1: svg['userData'].elems[3],
        joint2: svg['userData'].elems[4],
        joint3: svg['userData'].elems[5],
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

  setColorElem(svg, act = false) {
    const elems = svg['userData'].elems;

    let stroke = !act ? 'rgb(0, 0, 0)' : '#ff0000';
    if (!act) {
      for (let elem in elems) {
        if (elems[elem]['userData'].tag === 'point' && elems[elem]['userData'].color) {
          stroke = elems[elem]['userData'].color;
        }
      }
    }
    const display = act ? '' : 'none';

    for (let elem in elems) {
      if (elems[elem]['userData'].tag === 'point') elems[elem].setAttribute('display', display);

      if (elems[elem]['userData'].tag === 'point') continue;
      if (elems[elem]['userData'].act !== undefined && elems[elem]['userData'].act === false) continue;

      const type = isometricSvgElem.getSvgType(elems[elem]);
      if (type === 'circle') elems[elem].setAttribute('fill', stroke);

      elems[elem].setAttribute('stroke', stroke);
    }
  }

  isObjBySvg(svg) {
    const isObj = svg['userData'].objBracket || svg['userData'].objValve || svg['userData'].objUndefined || svg['userData'].objTee || svg['userData'].objFlap || svg['userData'].objAdapter || svg['userData'].objBox || svg['userData'].objSplitter ? true : false;

    return isObj;
  }

  isObjByType(type) {
    let isObj = false;
    const listTypes = ['objBracket', 'objValve', 'objUndefined', 'objTee', 'objFlap', 'objAdapter', 'objBox', 'objSplitter'];

    for (let i = 0; i < listTypes.length; i++) {
      if (listTypes[i] === type) {
        isObj = true;
        break;
      }
    }

    return isObj;
  }

  // удаление только svg (без удаления привязок и т.д)
  removeObj(svg) {
    const elems = this.getStructureObj(svg);

    for (let key in elems) {
      elems[key].remove();
    }
  }

  onmousedown = (event) => {
    this.isDown = false;
    this.isMove = false;

    this.groupObjs.childNodes.forEach((svg, ind) => {
      if (svg['userData'] && svg['userData'].pointScale && svg.contains(event.target)) {
        const svgObj = svg['userData'].svgObj;
        if (svgObj) {
          this.scaleObj(svgObj);
          const posC = isometricSvgElem.getPosCircle(svgObj);
          const posP = isometricSvgElem.getPosCircle(svg);
          this.pivot.dir = new THREE.Vector2(posC.x, posC.y).sub(new THREE.Vector2(posP.x, posP.y)).normalize();

          this.pivot.startPos = this.getCoord(event);

          console.log(this.pivot);
          this.selectedObj = svg;
          this.isDown = true;
        }
      }
    });

    this.offset = this.getCoord(event);

    return this.isDown;
  };

  // scale и направление
  onmousemove = (event) => {
    if (!this.isDown) return;
    if (!this.isMove) {
      this.isMove = true;
    }

    let pos = this.getCoord(event);

    if (this.selectedObj === this.svgPointsScale.p3) {
      let dist = this.pivot.dir.dot(new THREE.Vector2(pos.x, pos.y).sub(this.pivot.startPos));
      pos = this.pivot.startPos.clone().add(new THREE.Vector2().addScaledVector(this.pivot.dir, dist));
      const offset = new THREE.Vector2().subVectors(pos, this.pivot.startPos);

      this.moveSvgObj({ svg: this.selectedObj, offset });

      const svgObj = this.selectedObj['userData'].svgObj;

      if (svgObj['userData'].objValve) {
        const posC = isometricSvgElem.getPosCircle(svgObj);
        const dot = this.pivot.dir.dot(new THREE.Vector2(pos.x, pos.y).sub(posC));

        let rotY1 = 0;

        if (dot > 0) rotY1 = svgObj['userData'].rotY1 + 180;
        if (dot < 0) rotY1 = svgObj['userData'].rotY1;

        const elems = this.getStructureObj(svgObj);
        const pos2 = isometricSvgElem.getPosCircle(elems.point);

        elems.line3.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
        elems.line4.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
      }
    }

    if (this.selectedObj === this.svgPointsScale.p1 || this.selectedObj === this.svgPointsScale.p2) {
      let dist = this.pivot.dir.dot(new THREE.Vector2(pos.x, pos.y).sub(this.pivot.startPos));
      pos = this.pivot.startPos.clone().add(new THREE.Vector2().addScaledVector(this.pivot.dir, dist));
      const offset = new THREE.Vector2().subVectors(pos, this.pivot.startPos);

      this.moveSvgObj({ svg: this.selectedObj, offset });

      const svgObj = this.selectedObj['userData'].svgObj;
      const profile = svgObj['userData'].profile;

      const posC = isometricSvgElem.getPosCircle(svgObj);
      const posP = isometricSvgElem.getPosCircle(this.selectedObj);
      let scale = posC.distanceTo(posP) / profile.distDef;

      if (scale < 0.1) scale = 0.1;
      const dot = this.pivot.dir.dot(new THREE.Vector2(pos.x, pos.y).sub(posC));

      if (dot > 0) scale *= -1;
      this.scaleObj(svgObj, scale);
      profile.scale = scale;
    }

    this.pivot.startPos = this.getCoord(event);
  };

  onmouseup = (event) => {
    this.isDown = false;
    this.isMove = false;
  };

  getCoord(event) {
    const pos = isometricSvgElem.getCoordMouse({ event, container: this.containerSvg });

    return pos;
  }

  moveSvgObj({ svg, offset }) {
    isometricSvgElem.setOffsetCircle(svg, offset.x, offset.y);
  }

  setColor({ svg, color }) {
    const elems = this.getStructureObj(svg);

    for (let elem in elems) {
      if (elems[elem]['userData'].tag === 'point') {
        elems[elem]['userData'].color = color;
        continue;
      }

      const type = isometricSvgElem.getSvgType(elems[elem]);
      if (type === 'circle') continue;

      elems[elem].setAttribute('stroke', color);
    }
  }
}
