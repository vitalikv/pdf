import * as THREE from 'three';

import { isometricSvgElem, isometricMath } from './index';

export class IsometricSvgObjs {
  container;
  containerSvg;
  isDown = false;
  offset = new THREE.Vector2();
  selectedObj = { el: null, type: '' };

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
  }

  addObj({ event, type }) {
    if (event.button !== 0) return;

    const pos = this.getCoord(event);

    if (type === 'objBracket') {
      this.createObjBracket({ x: pos.x, y: pos.y });
    }
  }

  createObjBracket({ x, y }) {
    const svg1 = this.createSvgLine({ x, y: y + 10 });
    const svg2 = this.createSvgLine({ x, y: y - 10 });
    const svg3 = this.createSvgCircle({ x, y });

    this.containerSvg.children[0].append(svg1);
    this.containerSvg.children[0].append(svg2);
    this.containerSvg.children[0].append(svg3);

    svg1['userData'] = { objBracket: true, tag: 'line1', lock: false, elems: [svg1, svg2, svg3] };
    svg2['userData'] = { objBracket: true, tag: 'line2', lock: false, elems: [svg1, svg2, svg3] };
    svg3['userData'] = { objBracket: true, tag: 'point', lock: false, elems: [svg1, svg2, svg3], crossOffset: false, link: null };

    return { svg1, svg2, svg3 };
  }

  createSvgLine({ x, y, stroke = '#000000' }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'line');

    const x1 = x - 10;
    const y1 = y;
    const x2 = x + 10;
    const y2 = y;

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

  getCoord(event) {
    const pos = isometricSvgElem.getCoordMouse({ event, container: this.containerSvg });

    return pos;
  }

  onmousedown = (event) => {
    if (this.selectedObj.el) this.actElem(this.selectedObj.el);

    this.isDown = false;

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData'] && svg['userData'].objBracket && svg.contains(event.target)) {
        this.actElem(svg, true);

        if (!svg['userData'].lock) {
          this.isDown = true;
        }

        if (svg['userData'].tag === 'point' && event.button !== 0) {
          this.setLockOnSvg(svg);
        }
      }
    });

    this.offset = this.getCoord(event);

    return this.isDown;
  };

  onmousemove = (event) => {
    if (!this.isDown) return;

    let svg = this.selectedObj.el;
    if (svg['userData'].lock) return;

    let pos = this.getCoord(event);
    const offset = pos.sub(this.offset);

    this.moveSvgObj({ svg, offset });
    const elems = this.getStructureObj(svg);
    this.addLink({ svgPoint: elems.point, event });

    this.setRotObj({ svg: elems.point });

    this.offset = this.getCoord(event);
  };

  onmouseup = (event) => {
    this.isDown = false;

    const svg = this.selectedObj.el;
    if (svg) {
      //this.addLink({ svgPoint: svg, event });
    }
  };

  moveSvgObj({ svg, offset }) {
    const elems = this.getStructureObj(svg);

    isometricSvgElem.setOffsetLine2(elems.line1, offset.x, offset.y);
    isometricSvgElem.setOffsetLine2(elems.line2, offset.x, offset.y);
    isometricSvgElem.setOffsetCircle(elems.point, offset.x, offset.y);
  }

  addLink({ svgPoint, event, pos = null }) {
    const arrLines = [];

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI && svg['userData'].tag === 'line') {
          arrLines.push(svg);
        }
      }
    });

    if (!pos) pos = this.getCoord(event);
    let minDist = Infinity;
    const result = { obj: null, type: '', pos: new THREE.Vector2() };

    arrLines.forEach((line) => {
      const posL = isometricSvgElem.getPosLine2(line);
      const posPr = isometricMath.spPoint(posL[0], posL[1], pos);
      const onLine = isometricMath.calScal(posL[0], posL[1], pos);

      if (onLine) {
        const dist = pos.distanceTo(posPr);
        if (dist < minDist) {
          minDist = dist;
          result.obj = line;
          result.pos = posPr;
          result.type = 'line';
        }
      }
    });

    let resultCross = null;

    if (result.type === 'line') {
      if (minDist < 10) {
        const posC = isometricSvgElem.getPosCircle(svgPoint);
        const offset = new THREE.Vector2(result.pos.x - posC.x, result.pos.y - posC.y);

        this.moveSvgObj({ svg: svgPoint, offset });

        this.addLinkUp({ svgPoint, result });

        svgPoint['userData'].crossOffset = true;

        resultCross = true;
      } else {
        if (svgPoint['userData'].crossOffset) {
          svgPoint['userData'].crossOffset = false;
          const posC = isometricSvgElem.getPosCircle(svgPoint);
          const offset = new THREE.Vector2(pos.x - posC.x, pos.y - posC.y);

          this.moveSvgObj({ svg: svgPoint, offset });
        }

        this.unLink(svgPoint);
      }
    }

    return resultCross;
  }

  unLink(svgPoint) {
    const link = svgPoint['userData'].link;
    if (!link) return;

    const links = link.obj['userData'].links;

    let index = links.indexOf(svgPoint);
    if (index > -1) links.splice(index, 1);

    svgPoint['userData'].link = null;
  }

  addLinkUp({ svgPoint, result }) {
    const line = result.obj;

    const index = line['userData'].links.indexOf(svgPoint);
    if (index > -1) return;

    svgPoint['userData'].link = { obj: line, dist: 0 };

    const pos = isometricSvgElem.getPosLine2(line);
    const fullDist = pos[0].distanceTo(pos[1]);
    const distFirst = pos[0].distanceTo(result.pos);
    const dist = Math.round((distFirst / fullDist) * 100) / 100;

    svgPoint['userData'].link.dist = dist;

    line['userData'].links.push(svgPoint);
  }

  setRotObj({ svg }) {
    const elems = this.getStructureObj(svg);

    if (elems.point['userData'].link) {
      const link = elems.point['userData'].link;

      const pos = isometricSvgElem.getPosLine2(link.obj);

      const dir = pos[1].sub(pos[0]);

      const rotY = Math.atan2(dir.x, dir.y);
      const rotY1 = THREE.MathUtils.radToDeg(rotY - Math.PI / 2) * -1;

      const pos2 = isometricSvgElem.getPosCircle(elems.point);

      elems.line1.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
      elems.line2.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
    } else {
      elems.line1.setAttribute('transform', 'rotate(0)');
      elems.line2.setAttribute('transform', 'rotate(0)');
    }
  }

  updataPos(line) {
    line['userData'].links.forEach((svg) => {
      if (svg['userData'].objBracket && svg['userData'].tag === 'point') {
        const { dist } = svg['userData'].link;

        const coord = isometricSvgElem.getPosLine2(line);
        let pos = new THREE.Vector2().subVectors(coord[1], coord[0]);
        pos = new THREE.Vector2().addScaledVector(pos, dist);
        pos.add(coord[0]);

        const posP = isometricSvgElem.getPosCircle(svg);
        const offset = new THREE.Vector2(pos.x - posP.x, pos.y - posP.y);

        this.moveSvgObj({ svg, offset });
        this.setRotObj({ svg });

        // svg.setAttribute('cx', pos.x);
        // svg.setAttribute('cy', pos.y);
        // svg['userData'].line.setAttribute('x1', pos.x);
        // svg['userData'].line.setAttribute('y1', pos.y);
      }
    });
  }

  actElem(svg, act = false) {
    this.setColorElem(svg, act);

    console.log(svg, act);

    if (act) {
      this.selectedObj.el = svg;
    } else {
      this.clearSelectedObj();
    }
  }

  setColorElem(svg, act = false) {
    const elems = this.getStructureObj(svg);

    const stroke = !act ? 'rgb(0, 0, 0)' : '#ff0000';
    const display = act ? '' : 'none';

    elems.line1.setAttribute('stroke', stroke);
    elems.line2.setAttribute('stroke', stroke);
    elems.point.setAttribute('stroke', stroke);

    elems.point.setAttribute('display', display);
  }

  setLockOnSvg(svg, lock = null) {
    const elems = this.getStructureObj(svg);

    if (lock !== null) {
      elems.line1['userData'].lock = lock;
      elems.line2['userData'].lock = lock;
      elems.point['userData'].lock = lock;
    } else {
      elems.line1['userData'].lock = !elems.line1['userData'].lock;
      elems.line2['userData'].lock = !elems.line2['userData'].lock;
      elems.point['userData'].lock = !elems.point['userData'].lock;
    }

    const fill = elems.point['userData'].lock ? '#000' : '#fff';

    elems.point.setAttribute('fill', fill);
  }

  clearSelectedObj() {
    this.selectedObj.el = null;
    this.selectedObj.type = '';
  }

  getSelectedObj() {
    if (!this.containerSvg) return;
    if (!this.selectedObj.el) return;

    const svg = this.selectedObj.el;

    return this.getStructureObj(svg);
  }

  getStructureObj(svg) {
    const elems = {
      line1: svg['userData'].elems[0],
      line2: svg['userData'].elems[1],
      point: svg['userData'].elems[2],
    };

    return elems;
  }

  deleteObj(svg = null) {
    let elems = null;

    if (svg) {
      elems = this.getStructureObj(svg);
    } else {
      elems = this.getSelectedObj();
    }

    if (!elems) return;

    this.unLink(elems.point);

    elems.line1.remove();
    elems.line2.remove();
    elems.point.remove();

    this.clearSelectedObj();
  }
}
