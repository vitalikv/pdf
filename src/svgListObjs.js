import * as THREE from 'three';

import { isometricSvgElem } from './index';

export class IsometricSvgListObjs {
  container;
  containerSvg;
  svgPointsScale;

  isDown = false;
  isMove = false;
  offset = new THREE.Vector2();
  selectedObj = null;
  pivot = { dir: new THREE.Vector2(), startPos: new THREE.Vector2() };

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

  createSvgCircle({ x, y, r = '4.2', fill = '#fff', display = 'none' }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);

    svg.setAttribute('r', r);
    svg.setAttribute('stroke-width', '2px');
    svg.setAttribute('stroke', 'rgb(0, 0, 0)');
    svg.setAttribute('transform-origin', 'center');

    svg.setAttribute('fill', fill);

    svg.setAttributeNS(null, 'style', 'transform: translateX(0) translateY(0);');
    svg.setAttribute('display', display);

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

  createObjValve({ x, y, scale = 1 }) {
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
      scale,
      distDef: 20,
    };

    svg1['userData'] = { objValve: true, tag: 'line1', lock: false, elems: [svg1, svg2, svg3, svg4, svg5] };
    svg2['userData'] = { objValve: true, tag: 'line2', lock: false, elems: [svg1, svg2, svg3, svg4, svg5] };
    svg3['userData'] = { objValve: true, tag: 'point', lock: false, elems: [svg1, svg2, svg3, svg4, svg5], crossOffset: false, link: null, profile };
    svg4['userData'] = { objValve: true, tag: 'line3', lock: false, elems: [svg1, svg2, svg3, svg4, svg5] };
    svg5['userData'] = { objValve: true, tag: 'line4', lock: false, elems: [svg1, svg2, svg3, svg4, svg5] };

    if (scale !== 1) this.scaleObj(svg1, scale);

    return { svg1, svg2, svg3 };
  }

  createObjFlap({ x, y, scale = 1 }) {
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

    svg1['userData'] = { objFlap: true, tag: 'line1', lock: false, elems: [svg1, svg2, svg3] };
    svg2['userData'] = { objFlap: true, tag: 'line2', lock: false, elems: [svg1, svg2, svg3] };
    svg3['userData'] = { objFlap: true, tag: 'point', lock: false, elems: [svg1, svg2, svg3], crossOffset: false, link: null, profile };

    if (scale !== 1) this.scaleObj(svg1, scale);

    return { svg1, svg2, svg3 };
  }

  createObjTee({ x, y }) {
    const svg1 = this.createSvgLine({ x1: x - 20, y1: y, x2: x + 20, y2: y });
    const svg2 = this.createSvgLine({ x1: x, y1: y, x2: x, y2: y + 20 });
    const svg3 = this.createSvgCircle({ x: x, y: y });
    const svg4 = this.createSvgCircle({ x: x - 20, y: y, r: '3.2', fill: '#000000', display: '' });
    const svg5 = this.createSvgCircle({ x: x + 20, y: y, r: '3.2', fill: '#000000', display: '' });
    const svg6 = this.createSvgCircle({ x: x, y: y + 20, r: '3.2', fill: '#000000', display: '' });

    const arr = [svg1, svg2, svg3, svg4, svg5, svg6];

    arr.forEach((svg) => {
      this.groupObjs.append(svg);
    });

    svg1['userData'] = { objTee: true, tag: 'line1', lock: false, elems: arr };
    svg2['userData'] = { objTee: true, tag: 'line2', lock: false, elems: arr };
    svg3['userData'] = { objTee: true, tag: 'point', lock: false, elems: arr };
    svg4['userData'] = { objTee: true, tag: 'joint1', lock: false, elems: arr };
    svg5['userData'] = { objTee: true, tag: 'joint2', lock: false, elems: arr };
    svg6['userData'] = { objTee: true, tag: 'joint3', lock: false, elems: arr };

    return { svg1, svg2, svg3 };
  }

  createObjAdapter({ x, y, scale = 1 }) {
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

    svg1['userData'] = { objAdapter: true, tag: 'line1', lock: false, elems: [svg1, svg2] };
    svg2['userData'] = { objAdapter: true, tag: 'point', lock: false, elems: [svg1, svg2], crossOffset: false, link: null, profile };

    if (scale !== 1) this.scaleObj(svg1, scale);

    return { svg1, svg2 };
  }

  createObjBox({ x, y, scale = 1 }) {
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

    svg1['userData'] = { objBox: true, tag: 'line1', lock: false, elems: [svg1, svg2] };
    svg2['userData'] = { objBox: true, tag: 'point', lock: false, elems: [svg1, svg2], crossOffset: false, link: null, profile };

    if (scale !== 1) this.scaleObj(svg1, scale);

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
    const svgP1 = this.createSvgCircle({ x: -999999, y: -999999, fill: '#ffffff' });
    const svgP2 = this.createSvgCircle({ x: -999999, y: -999999, fill: '#ffffff' });
    const svgP3 = this.createSvgCircle({ x: -999999, y: -999999, fill: '#ffffff' });

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
    const elems = this.getStructureObj(svg);

    const stroke = !act ? 'rgb(0, 0, 0)' : '#ff0000';
    const display = act ? '' : 'none';

    let stroke2 = stroke;
    if (svg['userData'].objSplitter) {
      stroke2 = 'rgb(255, 255, 255)';
      elems.line1.setAttribute('stroke', stroke2);
    } else {
      for (let elem in elems) {
        if (elem === 'point') continue;

        const type = isometricSvgElem.getSvgType(elems[elem]);
        if (type === 'circle') elems[elem].setAttribute('fill', stroke);

        elems[elem].setAttribute('stroke', stroke);
      }
    }

    if (elems.point) elems.point.setAttribute('display', display);
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
}
