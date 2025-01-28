import * as THREE from 'three';

import { isometricSvgElem, isometricMath, isometricSvgLineSegments, isometricSvgListObjs, isometricSvgUndoRedo, isometricSvgElementAttributes, isometricActiveElement } from './index';

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

  onmousedown = (event, svg = null) => {
    if (this.selectedObj.el) this.actElem(this.selectedObj.el);

    this.isDown = false;
    this.isMove = false;

    if (svg) {
      isometricSvgListObjs.scaleObj(svg);
      this.actElem(svg, true);

      if (!svg['userData'].lock) {
        this.isDown = true;
      }

      if (svg['userData'].tag === 'point' && event.button !== 0) {
        this.setLockOnSvg(svg);
      }

      if (event.button === 2) {
        const { svgPoint, attr } = this.getAttributes(svg);
        isometricSvgElementAttributes.getAttributes({ event, svg: svgPoint, attr });
      } else {
        const guid = this.getGuidFromElement(svg);
        isometricActiveElement.selectElementByGuid(guid);
      }
    }

    this.offset = this.getCoord(event);

    return this.isDown;
  };

  onmousemove = (event) => {
    if (!this.isDown) return;
    if (!this.isMove) {
      this.isMove = true;
      isometricSvgListObjs.deActPointsScale();

      if (this.selectedObj.mode !== 'add' && this.selectedObj.el) {
        //isometricSvgUndoRedo.writeBd({ svg: this.selectedObj.el });
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
    this.addLink({ svgPoint: svg, event });
    this.setRotObj({ svg });

    this.offset = this.getCoord(event);
  };

  onmouseup = (event) => {
    if (this.selectedObj.el && this.selectedObj.mode === 'add') return;
    this.isDown = false;
    this.isMove = false;
  };

  moveSvgObj({ svg, offset }) {
    const parentElement = svg.parentElement;
    if (parentElement['userData'] && parentElement['userData'].tag === 'objElem' && 1 === 2) {
      const ctm = parentElement.getCTM();
      const translateX = ctm.e + offset.x;
      const translateY = ctm.f + offset.y;
      //console.log(`translate(${translateX}, ${translateY})`, offset);
      const rot = isometricSvgElem.getAngleSvg({ svg: parentElement });

      parentElement.setAttribute('transform', `translate(${translateX}, ${translateY}) rotate(${rot})`);
      return;
    }

    const elems = svg['userData'].elems;

    for (let item in elems) {
      const type = isometricSvgElem.getSvgType(elems[item]);

      if (type === 'circle') {
        isometricSvgElem.setOffsetCircle(elems[item], offset.x, offset.y);
      }
      if (type === 'line') {
        isometricSvgElem.setOffsetLine2(elems[item], offset.x, offset.y);
      }
      if (type === 'ellipse') {
        isometricSvgElem.setOffsetEllipse(elems[item], offset.x, offset.y);
      }
      if (type === 'polygon') {
        isometricSvgElem.setOffsetPolygon1(elems[item], offset.x, offset.y);
      }
    }
  }

  // привязка/отвязка объекта к трубе
  addLink({ svgPoint, event, pos = null }) {
    const svg = svgPoint;

    for (let item in svg['userData'].elems) {
      if (svg['userData'].elems[item]['userData'].tag === 'point') {
        svgPoint = svg['userData'].elems[item];
        break;
      }
    }

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

        this.moveSvgObj({ svg, offset });
        this.unLink(svgPoint);
        this.addLinkUp({ svgPoint, result });

        svgPoint['userData'].crossOffset = true;

        resultCross = true;
      } else {
        if (svgPoint['userData'].crossOffset) {
          svgPoint['userData'].crossOffset = false;
          const posC = isometricSvgElem.getPosCircle(svgPoint);
          const offset = new THREE.Vector2(pos.x - posC.x, pos.y - posC.y);

          this.moveSvgObj({ svg, offset });
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
    } else if (svgPoint['userData'].link && svgPoint['userData'].link.dist !== dist) {
      isometricSvgLineSegments.upLineSegments({ line });
      svgPoint['userData'].link.dist = dist;
    }
  }

  setRotObj({ svg }) {
    let point = null;

    for (let item in svg['userData'].elems) {
      if (svg['userData'].elems[item]['userData'].tag === 'point') {
        point = svg['userData'].elems[item];
        break;
      }
    }

    if (point['userData'].link) {
      const elems = svg['userData'].elems;
      const link = point['userData'].link;

      const pos = isometricSvgElem.getPosLine2(link.obj);
      const dir = pos[1].sub(pos[0]);
      const rotY = Math.atan2(dir.x, dir.y);
      const rotY1 = THREE.MathUtils.radToDeg(rotY - Math.PI / 2) * -1;
      const pos2 = isometricSvgElem.getPosCircle(point);

      for (let item in elems) {
        if (elems[item]['userData'].tag === 'point') {
          continue;
        }

        const type = isometricSvgElem.getSvgType(elems[item]);

        if (type === 'circle') {
          isometricSvgElem.setRotCircle_2({ point: elems[item], centerPoint: point, deg: 0 });
          isometricSvgElem.setRotCircle_2({ point: elems[item], centerPoint: point, deg: rotY1 - point['userData'].rotY1 });
        }
        if (type === 'line') {
          elems[item].setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
        }
        if (type === 'ellipse') {
          //isometricSvgElem.setOffsetEllipse(elems[item], offset.x, offset.y);
        }
        if (type === 'polygon') {
          isometricSvgElem.setRotPolygon1(elems[item], rotY1);
        }
      }

      point['userData'].rotY1 = rotY1;

      // if (svg['userData'].objTee) {
      //   elems.line1.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
      //   //elems.line2.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
      //   const pos = isometricSvgElem.getPosLine2(elems.line1);
      //   const dist = pos[0].distanceTo(pos[1]) / 2;
      //   isometricSvgElem.setRotCircle_1({ svg: elems.joint1, centerPos: pos2, deg: rotY1, offsetX: -dist });
      //   isometricSvgElem.setRotCircle_1({ svg: elems.joint2, centerPos: pos2, deg: rotY1, offsetX: dist });
      //   isometricSvgElem.setRotCircle_1({ svg: elems.joint3, centerPos: pos2, deg: rotY1, offsetY: -dist });

      //   let pos1 = isometricSvgElem.getPosCircle(elems.joint3);
      //   isometricSvgElem.setPosLine2({ svg: elems.line2, x2: pos1.x, y2: pos1.y });
      // }
    } else {
      const elems = svg['userData'].elems;

      for (let item in elems) {
        if (elems[item]['userData'].tag === 'point') {
          continue;
        }

        const type = isometricSvgElem.getSvgType(elems[item]);

        if (type === 'circle') {
          isometricSvgElem.setRotCircle_2({ point: elems[item], centerPoint: point, deg: point['userData'].rotY1 });
        }
        if (type === 'line') {
          elems[item].setAttribute('transform', 'rotate(0)');
        }
        if (type === 'ellipse') {
          //isometricSvgElem.setOffsetEllipse(elems[item], offset.x, offset.y);
        }
        if (type === 'polygon') {
          isometricSvgElem.setRotPolygon1(elems[item], 0);
        }
      }

      point['userData'].rotY1 = 0;

      // if (svg['userData'].objTee) {
      //   elems.line1.setAttribute('transform', 'rotate(0)');
      //   elems.line2.setAttribute('transform', 'rotate(0)');
      //   const pos2 = isometricSvgElem.getPosCircle(elems.point);
      //   const pos = isometricSvgElem.getPosLine2(elems.line1);
      //   const dist = pos[0].distanceTo(pos[1]) / 2;

      //   isometricSvgElem.setRotCircle_1({ svg: elems.joint1, centerPos: pos2, deg: 0, offsetX: -dist });
      //   isometricSvgElem.setRotCircle_1({ svg: elems.joint2, centerPos: pos2, deg: 0, offsetX: dist });
      //   isometricSvgElem.setRotCircle_1({ svg: elems.joint3, centerPos: pos2, deg: 0, offsetY: -dist });

      //   let pos1 = isometricSvgElem.getPosCircle(elems.joint3);
      //   isometricSvgElem.setPosLine2({ svg: elems.line2, x2: pos1.x, y2: pos1.y });
      // }
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
      //this.setToolRot({ svg });
    } else {
      isometricSvgListObjs.deActPointsScale();
      this.clearSelectedObj();
    }
  }

  // показываем инструмент для поворота svg
  setToolRot({ svg }) {
    const elems = svg['userData'].elems;
    let svgPoint = null;

    for (let elem in elems) {
      if (elems[elem]['userData'].tag === 'point') {
        svgPoint = elems[elem];
      }
    }

    if (!svgPoint) return;

    const parentElement = svgPoint.parentElement;
    if (parentElement['userData'] && parentElement['userData'].tag === 'objElem') {
    } else {
      return;
    }

    if (1 === 2) {
      this.setRotObj2({ svg: svgPoint });
    } else {
      // const ctm = parentElement.getCTM();
      // const pos2 = new THREE.Vector2(ctm.e, ctm.f);
      const pos2 = isometricSvgElem.getPosCircle(svgPoint);
      parentElement.setAttribute('transform', `rotate(45 ${pos2.x} ${pos2.y})`);
    }

    const arrPos = isometricSvgElem.getRelativeBBox({ svg: parentElement });

    if (1 === 2) {
      let v = [];

      for (let i = 0; i < elems.length; i++) {
        const bbox = svg.getBBox();

        v.push(new THREE.Vector2(bbox.x, bbox.y)); // верхний левый угол
        v.push(new THREE.Vector2(bbox.x, bbox.y + bbox.height)); // нижний левый угол
        v.push(new THREE.Vector2(bbox.x + bbox.width, bbox.y + bbox.height)); // нижний правый угол
        v.push(new THREE.Vector2(bbox.x + bbox.width, bbox.y)); // верхний правый угол
      }

      const bound = { min: { x: Infinity, y: Infinity }, max: { x: -Infinity, y: -Infinity } };

      for (let i = 0; i < v.length; i++) {
        if (v[i].x < bound.min.x) {
          bound.min.x = v[i].x;
        }
        if (v[i].x > bound.max.x) {
          bound.max.x = v[i].x;
        }
        if (v[i].y < bound.min.y) {
          bound.min.y = v[i].y;
        }
        if (v[i].y > bound.max.y) {
          bound.max.y = v[i].y;
        }
      }

      let arrPos = [];
      arrPos.push(new THREE.Vector2(bound.min.x, bound.max.y)); // верхний левый угол
      arrPos.push(new THREE.Vector2(bound.min.x, bound.min.y)); // нижний левый угол
      arrPos.push(new THREE.Vector2(bound.max.x, bound.min.y)); // нижний правый угол
      arrPos.push(new THREE.Vector2(bound.max.x, bound.max.y)); // верхний правый угол

      const matrix = svgPoint.getCTM();

      const arrPosBox = [];
      for (let i = 0; i < arrPos.length; i++) {
        const { x, y } = arrPos[i];

        const svgP = document.querySelector('svg');
        const point = svgP.createSVGPoint();
        point.x = x;
        point.y = y;
        const pos = point.matrixTransform(matrix);

        arrPosBox.push(new THREE.Vector2(pos.x, pos.y));
      }

      arrPos = arrPosBox;
    }

    // точки для box
    for (let i = 0; i < arrPos.length; i++) {
      const pos = arrPos[i];
      const elem = isometricSvgElem.createSvgCircle({ x: pos.x, y: pos.y });
      this.groupObjs.append(elem);
    }

    // линии для box
    for (let i = 0; i < arrPos.length; i++) {
      const p1 = arrPos[i];
      const p2 = i + 1 < arrPos.length ? arrPos[i + 1] : arrPos[0];

      const elem = isometricSvgElem.createSvgLine({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#222222', strokeWidth: '1.5px', dasharray: '5,3' });
      this.groupObjs.append(elem);
      console.log(elem);
    }

    // создаем svg инструмент для поворота
    const pos = arrPos[2].clone().sub(arrPos[1]).divideScalar(2).add(arrPos[1]);
    const normal = new THREE.Vector3(arrPos[1].y - arrPos[2].y, arrPos[2].x - arrPos[1].x).normalize();
    normal.x *= 15;
    normal.y *= 15;
    pos.add(normal);

    const svgRot = isometricSvgElem.createPolygon({ x: pos.x, y: pos.y, points: '-10,-5 -10,5 10,5 10,-5', fill: '#000000' });
    svgRot['userData'] = { toolRot: true };
    this.groupObjs.append(svgRot);

    // получаем угол на который повернут объект
    const angle = isometricSvgElem.getAngleSvg({ svg: parentElement });

    // устанавливаем на svg инструмент для поворота, такой же угол как у объекта
    isometricSvgElem.setRotPolygon2({ svg: svgRot, rot: angle });

    console.log(parentElement, 'Угол поворота элемента:', angle);
  }

  setRotObj2({ svg }) {
    let point = null;

    for (let item in svg['userData'].elems) {
      if (svg['userData'].elems[item]['userData'].tag === 'point') {
        point = svg['userData'].elems[item];
        break;
      }
    }

    if (1 === 1) {
      const elems = svg['userData'].elems;

      const rotY1 = 45;
      const pos2 = isometricSvgElem.getPosCircle(point);

      for (let item in elems) {
        if (elems[item]['userData'].tag === 'point') {
          continue;
        }

        const type = isometricSvgElem.getSvgType(elems[item]);

        if (type === 'circle') {
          isometricSvgElem.setRotCircle_2({ point: elems[item], centerPoint: point, deg: 0 });
          isometricSvgElem.setRotCircle_2({ point: elems[item], centerPoint: point, deg: rotY1 - point['userData'].rotY1 });
        }
        if (type === 'line') {
          elems[item].setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
        }
        if (type === 'ellipse') {
          //isometricSvgElem.setOffsetEllipse(elems[item], offset.x, offset.y);
        }
        if (type === 'polygon') {
          isometricSvgElem.setRotPolygon1(elems[item], rotY1);
        }
      }

      point['userData'].rotY1 = rotY1;

      // if (svg['userData'].objTee) {
      //   elems.line1.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
      //   //elems.line2.setAttribute('transform', 'rotate(' + rotY1 + ', ' + pos2.x + ',' + pos2.y + ')');
      //   const pos = isometricSvgElem.getPosLine2(elems.line1);
      //   const dist = pos[0].distanceTo(pos[1]) / 2;
      //   isometricSvgElem.setRotCircle_1({ svg: elems.joint1, centerPos: pos2, deg: rotY1, offsetX: -dist });
      //   isometricSvgElem.setRotCircle_1({ svg: elems.joint2, centerPos: pos2, deg: rotY1, offsetX: dist });
      //   isometricSvgElem.setRotCircle_1({ svg: elems.joint3, centerPos: pos2, deg: rotY1, offsetY: -dist });

      //   let pos1 = isometricSvgElem.getPosCircle(elems.joint3);
      //   isometricSvgElem.setPosLine2({ svg: elems.line2, x2: pos1.x, y2: pos1.y });
      // }
    } else {
      const elems = svg['userData'].elems;

      for (let item in elems) {
        if (elems[item]['userData'].tag === 'point') {
          continue;
        }

        const type = isometricSvgElem.getSvgType(elems[item]);

        if (type === 'circle') {
          isometricSvgElem.setRotCircle_2({ point: elems[item], centerPoint: point, deg: point['userData'].rotY1 });
        }
        if (type === 'line') {
          elems[item].setAttribute('transform', 'rotate(0)');
        }
        if (type === 'ellipse') {
          //isometricSvgElem.setOffsetEllipse(elems[item], offset.x, offset.y);
        }
        if (type === 'polygon') {
          isometricSvgElem.setRotPolygon1(elems[item], 0);
        }
      }

      point['userData'].rotY1 = 0;

      // if (svg['userData'].objTee) {
      //   elems.line1.setAttribute('transform', 'rotate(0)');
      //   elems.line2.setAttribute('transform', 'rotate(0)');
      //   const pos2 = isometricSvgElem.getPosCircle(elems.point);
      //   const pos = isometricSvgElem.getPosLine2(elems.line1);
      //   const dist = pos[0].distanceTo(pos[1]) / 2;

      //   isometricSvgElem.setRotCircle_1({ svg: elems.joint1, centerPos: pos2, deg: 0, offsetX: -dist });
      //   isometricSvgElem.setRotCircle_1({ svg: elems.joint2, centerPos: pos2, deg: 0, offsetX: dist });
      //   isometricSvgElem.setRotCircle_1({ svg: elems.joint3, centerPos: pos2, deg: 0, offsetY: -dist });

      //   let pos1 = isometricSvgElem.getPosCircle(elems.joint3);
      //   isometricSvgElem.setPosLine2({ svg: elems.line2, x2: pos1.x, y2: pos1.y });
      // }
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

  // получение attr по клику на объект
  getAttributes(svg) {
    let attr = {};
    const { point } = isometricSvgListObjs.getStructureObj(svg);

    if (point['userData'].attributes) {
      attr = point['userData'].attributes;
    }

    return { svgPoint: point, attr };
  }

  // получение guid по клику на объект
  getGuidFromElement(svg) {
    let guid = '';

    const { attr } = this.getAttributes(svg);
    if (attr['guid']) guid = attr['guid'];

    return guid;
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
      if (!elems) return;
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
