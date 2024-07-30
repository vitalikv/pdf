import * as THREE from 'three';

import { isometricSvgElem, isometricSvgLine, isometricSvgListObjs } from './index';

export class IsometricSvgScale {
  container;
  containerSvg;
  groupLines;
  groupObjs;
  groupRulers;
  groupNotes;
  button = -1;
  activated = false;
  isDown = false;
  startCoord = new THREE.Vector2();
  offset = new THREE.Vector2();
  sumOffset = new THREE.Vector2();

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
    this.groupLines = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'lines' });
    this.groupObjs = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'objs' });
    this.groupRulers = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'rulers' });
    this.groupNotes = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'notes' });
  }

  onKeyDown = (event) => {
    if (event.code === 'ShiftLeft' && !event.repeat) {
      this.activated = true;
    }
  };

  onKeyUp = (event) => {
    if (event.code === 'ShiftLeft') {
      this.activated = false;
    }
  };

  onmousedown = (event) => {
    if (!this.activated) return;

    this.startCoord = this.getCoord(event);
    this.offset = new THREE.Vector2(event.clientX, event.clientY);
    this.sumOffset = new THREE.Vector2();

    this.button = event.button;
    this.isDown = true;

    return this.isDown;
  };

  onmousemove = (event) => {
    if (!this.isDown) return;
    if (!this.activated) {
      this.deActivate();
      return;
    }

    if (this.button === 0) {
      const offset = new THREE.Vector2(event.clientX - this.offset.x, event.clientY - this.offset.y);

      // центр листа
      //const rect = this.containerSvg.getBoundingClientRect();
      //const centerPos = new THREE.Vector2(rect.width / 2 - rect.x, rect.height / 2 - rect.y);

      const centerPos = this.startCoord;

      this.scaleLines({ centerPos, offsetY: offset.y * 0.005 });
      this.scaleNotes({ centerPos, offsetY: offset.y * 0.005 });
      this.scaleRulers({ centerPos, offsetY: offset.y * 0.005 });
      this.scaleObjs({ centerPos, offsetY: offset.y * 0.005 });

      this.groupLines.childNodes.forEach((svg) => {
        if (svg['userData']) {
          if (svg['userData'].lineI && svg['userData'].tag === 'line') {
            //isometricSvgLine.upLineSegments({ line: svg });
          }
        }
      });
    }

    if (this.button === 2) {
      const offset = new THREE.Vector2(event.clientX - this.offset.x, event.clientY - this.offset.y);
      this.sumOffset.add(offset);
      this.groupLines.setAttribute('transform', `translate(${this.sumOffset.x},${this.sumOffset.y})`);
      this.groupObjs.setAttribute('transform', `translate(${this.sumOffset.x},${this.sumOffset.y})`);
      this.groupNotes.setAttribute('transform', `translate(${this.sumOffset.x},${this.sumOffset.y})`);
      this.groupRulers.setAttribute('transform', `translate(${this.sumOffset.x},${this.sumOffset.y})`);
    }

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    if (!this.isDown) return;

    this.deActivate();
  };

  getCoord(event) {
    const pos = isometricSvgElem.getCoordMouse({ event, container: this.containerSvg });

    return pos;
  }

  deActivate() {
    this.isDown = false;
    this.activated = false;
    this.button = -1;

    this.endOffset();
    this.offset = new THREE.Vector2();
  }

  // закончили смещение svg group
  endOffset() {
    if (!this.containerSvg) return;

    const offsetX = this.sumOffset.x;
    const offsetY = this.sumOffset.y;

    this.groupLines.childNodes.forEach((svg) => {
      this.svgOffset({ svg, offsetX, offsetY });
    });

    this.groupObjs.childNodes.forEach((svg) => {
      this.svgOffset({ svg, offsetX, offsetY });
    });

    this.groupNotes.childNodes.forEach((svg) => {
      this.svgOffset({ svg, offsetX, offsetY });
    });

    this.groupRulers.childNodes.forEach((svg) => {
      this.svgOffset({ svg, offsetX, offsetY });
    });

    this.groupLines.setAttribute('transform', `translate(0,0)`);
    this.groupObjs.setAttribute('transform', `translate(0,0)`);
    this.groupNotes.setAttribute('transform', `translate(0,0)`);
    this.groupRulers.setAttribute('transform', `translate(0,0)`);
  }

  svgOffset({ svg, offsetX, offsetY }) {
    const type = isometricSvgElem.getSvgType(svg);
    if (type === 'line') {
      isometricSvgElem.setOffsetLine2(svg, offsetX, offsetY, true);
    }
    if (type === 'circle') {
      isometricSvgElem.setOffsetCircle(svg, offsetX, offsetY);
    }
    if (type === 'polygon') {
      isometricSvgElem.setOffsetPolygon1(svg, offsetX, offsetY);
    }
    if (type === 'text') {
      isometricSvgElem.setOffsetText1(svg, offsetX, offsetY);
    }
    if (type === 'g') {
      svg.childNodes.forEach((svgChild) => {
        this.svgOffset({ svg: svgChild, offsetX, offsetY });
      });
    }
  }

  scaleLines({ centerPos, offsetY }) {
    const arrPoints = [];
    const arrDPoints = [];

    this.groupLines.childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI && svg['userData'].tag === 'point') {
          arrPoints.push(svg);
        }
        if (svg['userData'].lineI && svg['userData'].tag === 'dpoint') {
          arrDPoints.push(svg);
        }
      }
    });

    arrPoints.forEach((svgCircle, ind) => {
      const pos = isometricSvgElem.getPosCircle(svgCircle);

      const dir = centerPos.clone().sub(pos);
      dir.x *= offsetY;
      dir.y *= offsetY;
      pos.add(dir);

      isometricSvgElem.setPosCircle(svgCircle, pos.x, pos.y);
    });

    arrPoints.forEach((svg) => {
      svg['userData'].lines.forEach((svgLine) => {
        const coord = isometricSvgElem.getPosLine1(svgLine);

        isometricSvgElem.setPosLine2({ svg: svgLine, x1: coord[0].x, y1: coord[0].y, x2: coord[1].x, y2: coord[1].y });

        if (svgLine['userData'].pd1) {
          const svgCircle = svgLine['userData'].pd1;
          const svgLd = svgLine['userData'].ld1;
          const pos = this.getCoordPointOnLine({ line: svgLine, ind: 2 });

          isometricSvgElem.setPosCircle(svgCircle, pos.pos.x, pos.pos.y);
          isometricSvgElem.setPosLine2({ svg: svgLd, x1: pos.pos.x, y1: pos.pos.y, x2: pos.pos1.x, y2: pos.pos1.y });
          isometricSvgElem.setPosLine2({ svg: svgLine, x1: pos.pos.x, y1: pos.pos.y });
        }

        if (svgLine['userData'].pd2) {
          const svgCircle = svgLine['userData'].pd2;
          const svgLd = svgLine['userData'].ld2;
          const pos = this.getCoordPointOnLine({ line: svgLine, ind: 1 });

          isometricSvgElem.setPosCircle(svgCircle, pos.pos.x, pos.pos.y);
          isometricSvgElem.setPosLine2({ svg: svgLd, x1: pos.pos.x, y1: pos.pos.y, x2: pos.pos2.x, y2: pos.pos2.y });
          isometricSvgElem.setPosLine2({ svg: svgLine, x2: pos.pos.x, y2: pos.pos.y });
        }
      });
    });
  }

  // координаты создаваемой точки/стыка на линии (перед углом)
  getCoordPointOnLine({ line, ind = 0, pCenter = null }) {
    const pos = isometricSvgElem.getPosLine1(line);

    let pos1 = pos[0];
    let pos2 = pos[1];

    if (pCenter) {
      const posC = isometricSvgElem.getPosCircle(pCenter);
      const dist1 = new THREE.Vector2(posC.x, posC.y).distanceTo(pos1);
      const dist2 = new THREE.Vector2(posC.x, posC.y).distanceTo(pos2);

      if (dist1 < dist2) {
        pos1 = pos[0];
        pos2 = pos[1];
        ind = 1;
      } else {
        pos1 = pos[1];
        pos2 = pos[0];
        ind = 2;
      }
    } else if (ind === 1) {
      pos1 = pos[1];
      pos2 = pos[0];
    }

    const dir = pos2.clone().sub(pos1).normalize();
    const dist = pos2.distanceTo(pos1);
    const offset = new THREE.Vector2().addScaledVector(dir, 20);
    const posPoint = pos1.clone().add(offset);

    return { ind, pos: posPoint, dist, pos1: pos[0], pos2: pos[1] };
  }

  scaleNotes({ centerPos, offsetY }) {
    const svgArr = [];

    this.groupNotes.childNodes.forEach((svg) => {
      if (svg['userData'] && (svg['userData'].note1 || svg['userData'].note2)) {
        svgArr.push(svg);
      }
    });

    svgArr.forEach((svg) => {
      this.svgScale({ svg, centerPos, offsetY });
    });
  }

  scaleRulers({ centerPos, offsetY }) {
    const svgArr = [];

    this.groupRulers.childNodes.forEach((svg) => {
      if (svg['userData'] && svg['userData'].ruler) {
        svgArr.push(svg);
      }
    });

    svgArr.forEach((svg) => {
      this.svgScale({ svg, centerPos, offsetY });
    });
  }

  scaleObjs({ centerPos, offsetY }) {
    const svgArr = [];

    this.groupObjs.childNodes.forEach((svg) => {
      if (svg['userData'] && isometricSvgListObjs.isObjBySvg(svg)) {
        svgArr.push(svg);
      }
    });

    svgArr.forEach((svg) => {
      this.svgScale({ svg, centerPos, offsetY });
    });
  }

  svgScale({ svg, centerPos, offsetY }) {
    const type = isometricSvgElem.getSvgType(svg);
    if (type === 'line') {
      const pos = isometricSvgElem.getPosLine2(svg);

      for (let i = 0; i < pos.length; i++) {
        const dir = centerPos.clone().sub(pos[i]);
        dir.x *= offsetY;
        dir.y *= offsetY;
        pos[i].add(dir);

        if (i === 0) isometricSvgElem.setPosLine2({ svg, x1: pos[i].x, y1: pos[i].y });
        else isometricSvgElem.setPosLine2({ svg, x2: pos[i].x, y2: pos[i].y });
      }
    }
    if (type === 'circle') {
      const pos = isometricSvgElem.getPosCircle(svg);

      const dir = centerPos.clone().sub(pos);
      dir.x *= offsetY;
      dir.y *= offsetY;
      pos.add(dir);

      isometricSvgElem.setPosCircle(svg, pos.x, pos.y);
    }
    if (type === 'polygon') {
      const pos = isometricSvgElem.getPosPolygon(svg);
      const dir = centerPos.clone().sub(pos);
      dir.x *= offsetY;
      dir.y *= offsetY;
      pos.add(dir);

      isometricSvgElem.setPosPolygon1(svg, pos.x, pos.y);
    }
    if (type === 'text') {
      const pos = isometricSvgElem.getPosText1(svg);

      const dir = centerPos.clone().sub(pos);
      dir.x *= offsetY;
      dir.y *= offsetY;
      pos.add(dir);

      isometricSvgElem.setPosText1(svg, pos.x, pos.y);
    }
    if (type === 'g') {
      svg.childNodes.forEach((svgChild) => {
        this.svgScale({ svg: svgChild, centerPos, offsetY });
      });
    }
  }
}
