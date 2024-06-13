import * as THREE from 'three';

import { isometricSvgElem, isometricMath, isometricSvgLineSegments, isometricSvgListObjs, isometricSvgUndoRedo } from './index';

export class IsometricSvgObjs {
  container;
  containerSvg;
  groupLines;
  groupObjs;
  isDown = false;
  isMove = false;
  offset = new THREE.Vector2();
  selectedObj = { el: null, type: '', mode: '' };

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
    this.groupLines = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'lines' });
    this.groupObjs = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'objs' });

    isometricSvgListObjs.init({ container, containerSvg });
  }

  addObj({ event, type }) {
    if (event.button !== 0) return;

    const pos = this.getCoord(event);

    if (type === 'objBracket') {
      this.createObjBracket({ x: pos.x, y: pos.y });
    }
  }

  // undo/redo при добавлении нового объекта
  addObjUR() {
    if (!this.selectedObj.el) return;
    if (this.selectedObj.mode !== 'add') return;

    isometricSvgUndoRedo.writeBd({ svg: this.selectedObj.el, event: 'delZ' });
    isometricSvgUndoRedo.writeBd({ svg: this.selectedObj.el, event: 'addR' });
  }

  addObj2({ event, type }) {
    const pos = event ? this.getCoord(event) : new THREE.Vector2(-99999, -99999);

    if (type === 'objBracket') {
      const { svg1, svg2, svg3 } = isometricSvgListObjs.createObjBracket({ x: pos.x, y: pos.y });
      this.actElem(svg3, true);
    }

    if (type === 'objValve') {
      const { svg1, svg2, svg3 } = isometricSvgListObjs.createObjValve({ x: pos.x, y: pos.y });
      this.actElem(svg3, true);
    }

    if (type === 'objTee') {
      const { svg3 } = isometricSvgListObjs.createObjTee({ x: pos.x, y: pos.y });
      this.actElem(svg3, true);
    }

    if (type === 'objFlap') {
      const { svg1, svg2, svg3 } = isometricSvgListObjs.createObjFlap({ x: pos.x, y: pos.y });
      this.actElem(svg3, true);
    }

    if (type === 'objAdapter') {
      const { svg1, svg2 } = isometricSvgListObjs.createObjAdapter({ x: pos.x, y: pos.y });
      this.actElem(svg2, true);
    }

    if (type === 'objBox') {
      const { svg1, svg2 } = isometricSvgListObjs.createObjBox({ x: pos.x, y: pos.y });
      this.actElem(svg2, true);
    }

    if (type === 'objSplitter') {
      const { svg1, svg2 } = isometricSvgListObjs.createObjSplitter({ x: pos.x, y: pos.y });
      this.actElem(svg2, true);
    }

    this.isDown = true;
    this.offset = event ? this.getCoord(event) : new THREE.Vector2(-99999, -99999);
    this.selectedObj.mode = 'add';
  }

  getCoord(event) {
    const pos = isometricSvgElem.getCoordMouse({ event, container: this.containerSvg });

    return pos;
  }

  onmousedown = (event) => {
    if (this.selectedObj.el) this.actElem(this.selectedObj.el);

    this.isDown = false;
    this.isMove = false;

    this.groupObjs.childNodes.forEach((svg, ind) => {
      if (svg['userData'] && isometricSvgListObjs.isObjBySvg(svg) && svg.contains(event.target)) {
        isometricSvgListObjs.scaleObj(svg);
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
    if (!this.isMove) {
      this.isMove = true;
      isometricSvgListObjs.deActPointsScale();

      if (this.selectedObj.mode !== 'add' && this.selectedObj.el) {
        isometricSvgUndoRedo.writeBd({ svg: this.selectedObj.el });
      }
    }

    let svg = this.selectedObj.el;

    // перетаскивание у тройника точки, чтобы изменить длину/направление линии
    if (svg['userData'].objTee && svg['userData'].tag === 'joint3') {
      let pos = this.getCoord(event);
      const offset = pos.sub(this.offset);
      const elems = isometricSvgListObjs.getStructureObj(svg);

      isometricSvgElem.setOffsetCircle(svg, offset.x, offset.y);

      let pos1 = isometricSvgElem.getPosCircle(svg);
      elems.line2.setAttribute('transform', 'rotate(0)');
      isometricSvgElem.setPosLine2({ svg: elems.line2, x2: pos1.x, y2: pos1.y });

      this.offset = this.getCoord(event);
      return;
    }

    if (svg['userData'].lock) return;

    let pos = this.getCoord(event);
    const offset = pos.sub(this.offset);

    this.moveSvgObj({ svg, offset });
    const elems = isometricSvgListObjs.getStructureObj(svg);
    if (elems.point) this.addLink({ svgPoint: elems.point, event });

    if (elems.point) this.setRotObj({ svg: elems.point });

    this.offset = this.getCoord(event);
  };

  onmouseup = (event) => {
    if (this.selectedObj.el && this.selectedObj.mode === 'add') return;
    this.isDown = false;
    this.isMove = false;
  };

  moveSvgObj({ svg, offset }) {
    const elems = isometricSvgListObjs.getStructureObj(svg);

    if (svg['userData'].objBracket) {
      isometricSvgElem.setOffsetLine2(elems.line1, offset.x, offset.y);
      isometricSvgElem.setOffsetLine2(elems.line2, offset.x, offset.y);
      isometricSvgElem.setOffsetCircle(elems.point, offset.x, offset.y);
    }

    if (svg['userData'].objValve) {
      isometricSvgElem.setOffsetPolygon1(elems.line1, offset.x, offset.y);
      isometricSvgElem.setOffsetPolygon1(elems.line2, offset.x, offset.y);
      isometricSvgElem.setOffsetCircle(elems.point, offset.x, offset.y);
      isometricSvgElem.setOffsetLine2(elems.line3, offset.x, offset.y);
      isometricSvgElem.setOffsetLine2(elems.line4, offset.x, offset.y);
    }

    if (svg['userData'].objTee) {
      isometricSvgElem.setOffsetLine2(elems.line1, offset.x, offset.y);
      isometricSvgElem.setOffsetLine2(elems.line2, offset.x, offset.y);
      isometricSvgElem.setOffsetCircle(elems.point, offset.x, offset.y);
      isometricSvgElem.setOffsetCircle(elems.joint1, offset.x, offset.y);
      isometricSvgElem.setOffsetCircle(elems.joint2, offset.x, offset.y);
      isometricSvgElem.setOffsetCircle(elems.joint3, offset.x, offset.y);
    }

    if (svg['userData'].objUndefined) {
      isometricSvgElem.setOffsetLine2(elems.line1, offset.x, offset.y);
      isometricSvgElem.setOffsetPolygon1(elems.line2, offset.x, offset.y);
    }

    if (svg['userData'].objFlap) {
      isometricSvgElem.setOffsetPolygon1(elems.line1, offset.x, offset.y);
      isometricSvgElem.setOffsetPolygon1(elems.line2, offset.x, offset.y);
      isometricSvgElem.setOffsetCircle(elems.point, offset.x, offset.y);
    }

    if (svg['userData'].objAdapter) {
      isometricSvgElem.setOffsetPolygon1(elems.line1, offset.x, offset.y);
      isometricSvgElem.setOffsetCircle(elems.point, offset.x, offset.y);
    }

    if (svg['userData'].objBox) {
      isometricSvgElem.setOffsetPolygon1(elems.line1, offset.x, offset.y);
      isometricSvgElem.setOffsetCircle(elems.point, offset.x, offset.y);
    }

    if (svg['userData'].objSplitter) {
      isometricSvgElem.setOffsetPolygon1(elems.line1, offset.x, offset.y);
      isometricSvgElem.setOffsetCircle(elems.point, offset.x, offset.y);
      isometricSvgElem.setOffsetLine2(elems.line2, offset.x, offset.y);
      isometricSvgElem.setOffsetLine2(elems.line3, offset.x, offset.y);
    }
  }

  // привязка/отвязка объекта к трубе
  addLink({ svgPoint, event, pos = null }) {
    const arrLines = [];

    this.groupLines.childNodes.forEach((svg, ind) => {
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

    const line = link.obj;
    const links = link.obj['userData'].links;

    let index = links.indexOf(svgPoint);
    if (index > -1) links.splice(index, 1);

    svgPoint['userData'].link = null;

    isometricSvgLineSegments.addLineSegments({ line });
  }

  addLinkUp({ svgPoint, result }) {
    const line = result.obj;

    const index = line['userData'].links.indexOf(svgPoint);

    const pos = isometricSvgElem.getPosLine2(line);
    const fullDist = pos[0].distanceTo(pos[1]);
    const distFirst = pos[0].distanceTo(result.pos);
    const dist = Math.round((distFirst / fullDist) * 100) / 100;

    if (index === -1) {
      svgPoint['userData'].link = { obj: line, dist };

      line['userData'].links.push(svgPoint);
      isometricSvgLineSegments.addLineSegments({ line });
    } else if (svgPoint['userData'].link.dist !== dist) {
      isometricSvgLineSegments.upLineSegments({ line });
    }

    svgPoint['userData'].link.dist = dist;
  }

  setRotObj({ svg }) {
    const elems = isometricSvgListObjs.getStructureObj(svg);

    if (elems.point['userData'].link) {
      const link = elems.point['userData'].link;

      const pos = isometricSvgElem.getPosLine2(link.obj);

      const dir = pos[1].sub(pos[0]);

      const rotY = Math.atan2(dir.x, dir.y);
      const rotY1 = THREE.MathUtils.radToDeg(rotY - Math.PI / 2) * -1;

      const pos2 = isometricSvgElem.getPosCircle(elems.point);

      if (svg['userData'].objBracket) {
        elems.line1.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
        elems.line2.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
      }
      if (svg['userData'].objValve) {
        isometricSvgElem.setRotPolygon1(elems.line1, rotY1);
        isometricSvgElem.setRotPolygon1(elems.line2, rotY1);
        elems.line3.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
        elems.line4.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
      }
      if (svg['userData'].objTee) {
        elems.line1.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
        //elems.line2.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
        isometricSvgElem.setRotCircle_1({ svg: elems.joint1, centerPos: pos2, deg: rotY1, offsetX: -20 });
        isometricSvgElem.setRotCircle_1({ svg: elems.joint2, centerPos: pos2, deg: rotY1, offsetX: 20 });
        isometricSvgElem.setRotCircle_1({ svg: elems.joint3, centerPos: pos2, deg: rotY1, offsetY: -20 });

        let pos1 = isometricSvgElem.getPosCircle(elems.joint3);
        isometricSvgElem.setPosLine2({ svg: elems.line2, x2: pos1.x, y2: pos1.y });
      }
      if (svg['userData'].objFlap) {
        isometricSvgElem.setRotPolygon1(elems.line1, rotY1);
        isometricSvgElem.setRotPolygon1(elems.line2, rotY1);
      }
      if (svg['userData'].objAdapter) {
        isometricSvgElem.setRotPolygon1(elems.line1, rotY1);
      }
      if (svg['userData'].objBox) {
        isometricSvgElem.setRotPolygon1(elems.line1, rotY1);
      }
      if (svg['userData'].objSplitter) {
        isometricSvgElem.setRotPolygon1(elems.line1, rotY1);
        elems.line2.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
        elems.line3.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
      }
      elems.point['userData'].rotY1 = rotY1;
    } else {
      if (svg['userData'].objBracket) {
        elems.line1.setAttribute('transform', 'rotate(0)');
        elems.line2.setAttribute('transform', 'rotate(0)');
      }

      if (svg['userData'].objValve) {
        isometricSvgElem.setRotPolygon1(elems.line1, 0);
        isometricSvgElem.setRotPolygon1(elems.line2, 0);
        elems.line3.setAttribute('transform', 'rotate(0)');
        elems.line4.setAttribute('transform', 'rotate(0)');
      }

      if (svg['userData'].objTee) {
        elems.line1.setAttribute('transform', 'rotate(0)');
        elems.line2.setAttribute('transform', 'rotate(0)');
        const pos2 = isometricSvgElem.getPosCircle(elems.point);
        isometricSvgElem.setRotCircle_1({ svg: elems.joint1, centerPos: pos2, deg: 0, offsetX: -20 });
        isometricSvgElem.setRotCircle_1({ svg: elems.joint2, centerPos: pos2, deg: 0, offsetX: 20 });
        isometricSvgElem.setRotCircle_1({ svg: elems.joint3, centerPos: pos2, deg: 0, offsetY: -20 });

        let pos1 = isometricSvgElem.getPosCircle(elems.joint3);
        isometricSvgElem.setPosLine2({ svg: elems.line2, x2: pos1.x, y2: pos1.y });
      }

      if (svg['userData'].objFlap) {
        isometricSvgElem.setRotPolygon1(elems.line1, 0);
        isometricSvgElem.setRotPolygon1(elems.line2, 0);
      }

      if (svg['userData'].objAdapter) {
        isometricSvgElem.setRotPolygon1(elems.line1, 0);
      }

      if (svg['userData'].objBox) {
        isometricSvgElem.setRotPolygon1(elems.line1, 0);
      }

      if (svg['userData'].objSplitter) {
        isometricSvgElem.setRotPolygon1(elems.line1, 0);
        elems.line2.setAttribute('transform', 'rotate(0)');
        elems.line3.setAttribute('transform', 'rotate(0)');
      }

      elems.point['userData'].rotY1 = 0;
    }
  }

  updataPos(line) {
    line['userData'].links.forEach((svg) => {
      if (isometricSvgListObjs.isObjBySvg(svg) && svg['userData'].tag === 'point') {
        const { dist } = svg['userData'].link;

        const coord = isometricSvgElem.getPosLine2(line);
        let pos = new THREE.Vector2().subVectors(coord[1], coord[0]);
        pos = new THREE.Vector2().addScaledVector(pos, dist);
        pos.add(coord[0]);

        const posP = isometricSvgElem.getPosCircle(svg);
        const offset = new THREE.Vector2(pos.x - posP.x, pos.y - posP.y);

        this.moveSvgObj({ svg, offset });
        this.setRotObj({ svg });
      }
    });
  }

  actElem(svg, act = false) {
    isometricSvgListObjs.setColorElem(svg, act);

    if (act) {
      this.selectedObj.el = svg;
    } else {
      isometricSvgListObjs.deActPointsScale();
      this.clearSelectedObj();
    }
  }

  setLockOnSvg(svg, lock = null) {
    const elems = isometricSvgListObjs.getStructureObj(svg);

    if (lock !== null) {
      elems.line1['userData'].lock = lock;
      if (elems.line2) elems.line2['userData'].lock = lock;
      elems.point['userData'].lock = lock;
    } else {
      elems.line1['userData'].lock = !elems.line1['userData'].lock;
      if (elems.line2) elems.line2['userData'].lock = !elems.line2['userData'].lock;
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

    return isometricSvgListObjs.getStructureObj(svg);
  }

  deleteObj(svg = null) {
    let elems = null;

    if (svg) {
      elems = isometricSvgListObjs.getStructureObj(svg);
    } else {
      elems = this.getSelectedObj();

      isometricSvgUndoRedo.writeBd({ svg: elems.point, event: 'addZ' });
      isometricSvgUndoRedo.writeBd({ svg: elems.point, event: 'delR' });
    }

    if (!elems) return;

    if (elems.point) this.unLink(elems.point);

    isometricSvgListObjs.removeObj(elems.point);

    this.clearSelectedObj();

    isometricSvgListObjs.deActPointsScale();
  }

  deleteAddObj() {
    if (!this.selectedObj.el) return;
    if (this.selectedObj.mode !== 'add') return;

    this.selectedObj.mode = '';
    this.isDown = false;

    const elems = this.getSelectedObj();

    if (!elems) return;

    this.unLink(elems.point);

    isometricSvgListObjs.removeObj(elems.point);

    this.clearSelectedObj();
  }
}
