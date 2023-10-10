import * as THREE from 'three';

import { isometricSvgElem, isometricMath, isometricSvgLine, isometricNoteSvg, isometricNoteSvg2, isometricSvgRuler } from './index';

export class IsometricSelectBox {
  activated = false;
  isDown = false;
  isMove = false;
  mode = '';
  container;
  containerSvg;
  selectedArr = { objs: [] };
  elemSelBox = null;
  cursorOffset = new THREE.Vector2();
  startOffset = new THREE.Vector2();
  startPos = new THREE.Vector2();
  endPos = new THREE.Vector2();

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
    this.elemSelBox = this.createElemSelectBox();
  }

  createElemSelectBox() {
    const div = document.createElement('div');
    div.style.cssText =
      'position: absolute; width: 0; height: 0; line-height: 0; z-index: 100; visibility: hidden; border: 2px dashed #ff0000; box-sizing: border-box;';
    this.container.prepend(div);

    return div;
  }

  onKeyDown = (event) => {
    if (event.code === 'ControlLeft' && !event.repeat) {
      this.activateCutBox();
    }

    if (event.code === 'Delete') {
      this.deleteSelected();
    }
  };

  onKeyUp = (event) => {
    if (event.code === 'ControlLeft') {
      this.deActivateCutBox();
    }
  };

  activateCutBox() {
    this.activated = true;

    const bound = this.container.getBoundingClientRect();
    this.startOffset.x = bound.left;
    this.startOffset.y = bound.top;
  }

  deActivateCutBox() {
    this.activated = false;

    if (this.isMove) {
      //this.setBoxVisibility('hidden');
    }
  }

  setBoxVisibility(value) {
    this.elemSelBox.style.visibility = value;
  }

  coords(event) {
    const x = -this.startOffset.x + event.clientX;
    const y = -this.startOffset.y + event.clientY;

    return new THREE.Vector2(x, y);
  }

  onmousedown = (event) => {
    if (this.elemSelBox.style.visibility === 'visible') {
      const clickPos = this.coords(event);
      const form = this.getFormBox();

      const result = isometricMath.checkPointInsideForm(clickPos, form);

      if (result) {
        this.isDown = true;
        this.isMove = false;
        this.mode = 'moveBox';

        this.cursorOffset = this.coords(event);

        return this.isDown;
      }
    }

    this.clearSelected();

    if (!this.activated) return;

    this.startPos = this.coords(event);
    this.endPos = this.coords(event);

    this.isDown = true;
    this.isMove = false;
    this.mode = 'createBox';

    return this.isDown;
  };

  onmousemove = (event) => {
    if (!this.isDown) return;

    if (this.mode === 'moveBox') {
      this.moveBox(event);
    }

    if (!this.activated) return;

    this.isMove = true;

    if (this.mode === 'createBox') {
      this.createBox(event);
    }
  };

  onmouseup = (event) => {
    const next = this.isDown && this.isMove ? true : false;
    this.isDown = false;
    this.isMove = false;

    if (!next) return;

    if (this.mode === 'createBox') {
      if (this.startPos.x > this.endPos.x) {
        let sx = this.startPos.x;
        let ex = this.endPos.x;
        this.startPos.x = ex;
        this.endPos.x = sx;
      }

      if (this.startPos.y > this.endPos.y) {
        let sy = this.startPos.y;
        let ey = this.endPos.y;
        this.startPos.y = ey;
        this.endPos.y = sy;
      }

      this.getObjsFromBox();
    }

    this.mode = '';
  };

  // перемещение Box
  moveBox(event) {
    const cursorPos = this.coords(event);

    const offsetX = cursorPos.x - this.cursorOffset.x;
    const offsetY = cursorPos.y - this.cursorOffset.y;

    this.elemSelBox.style.top = this.elemSelBox.offsetTop + offsetY + 'px';
    this.elemSelBox.style.left = this.elemSelBox.offsetLeft + offsetX + 'px';

    this.startPos.add(new THREE.Vector2(offsetX, offsetY));
    this.endPos.add(new THREE.Vector2(offsetX, offsetY));

    this.moveOffset(new THREE.Vector2(offsetX, offsetY));

    this.cursorOffset = cursorPos;
  }

  // создание Box
  createBox(event) {
    this.endPos = this.coords(event);

    let x1 = this.startPos.x;
    let y1 = this.startPos.y;
    let { x: x2, y: y2 } = this.coords(event);

    if (x1 === x2) {
      return;
    }
    if (y1 === y2) {
      return;
    }

    if (x1 > x2) {
      x1 = x1 + x2;
      x2 = x1 - x2;
      x1 = x1 - x2;
    }
    if (y1 > y2) {
      y1 = y1 + y2;
      y2 = y1 - y2;
      y1 = y1 - y2;
    }

    const box = this.elemSelBox;
    box.style.top = y1 + 'px';
    box.style.left = x1 + 'px';
    box.style.width = x2 - x1 + 'px';
    box.style.height = y2 - y1 + 'px';

    this.setBoxVisibility('visible');
  }

  // находим объекты, которые попали в область выделения
  getObjsFromBox() {
    const arrLines = [];
    const arrPoints = [];
    const arrDLines = [];
    const arrDPoints = [];
    const arrRulerLine = [];

    const elems = isometricSvgElem.getSvgElems({ container: this.containerSvg });

    elems.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI) {
          if (svg['userData'].tag === 'line') {
            arrLines.push(svg);
          }
          if (svg['userData'].tag === 'point') {
            arrPoints.push(svg);
          }
          if (svg['userData'].tag === 'dline') {
            arrLines.push(svg);
          }
          if (svg['userData'].tag === 'dpoint') {
            arrPoints.push(svg);
          }
        }
        if (svg['userData'].note1 || svg['userData'].note2) {
          if (svg['userData'].tag === 'line') {
            arrLines.push(svg);
          }
        }
        if (svg['userData'].ruler) {
          if (svg['userData'].tag === 'line') {
            arrLines.push(svg);
          }
        }
      }
    });

    const form = this.getFormBox(true);

    arrLines.forEach((svg) => {
      const { a, b } = this.getCoordLine(svg);
      let result = isometricMath.checkPointInsideForm(a, form);
      if (result) this.selectedArr.objs.push(svg);
      if (!result) {
        result = isometricMath.checkPointInsideForm(b, form);
        if (result) this.selectedArr.objs.push(svg);
      }

      if (!result) {
        for (let i = 0; i < form.length; i++) {
          const i2 = i + 1 > form.length - 1 ? 0 : i + 1;
          const c = form[i];
          const d = form[i2];
          result = isometricMath.crossLine(a, b, c, d);

          if (result) {
            this.selectedArr.objs.push(svg);
            break;
          }
        }
      }
    });

    arrPoints.forEach((svg) => {
      const pos = this.getCoordPoint(svg);
      const result = isometricMath.checkPointInsideForm(pos, form);
      if (result) this.selectedArr.objs.push(svg);
    });

    arrDPoints.forEach((svg) => {
      const pos = this.getCoordPoint(svg);
      const result = isometricMath.checkPointInsideForm(pos, form);
      if (result) this.selectedArr.objs.push(svg);
    });

    this.selectedArr.objs.forEach((svg) => {
      this.actElem(svg, true);
    });
  }

  // получаем выделеную область (box)
  getFormBox(modif = false) {
    let x1 = this.startPos.x;
    let y1 = this.startPos.y;
    let x2 = this.endPos.x;
    let y2 = this.endPos.y;

    if (modif) {
      const bound = this.containerSvg.getBoundingClientRect();

      const size = isometricSvgElem.getSizeViewBox({ container: this.containerSvg });
      const ratio = size.x / bound.width;

      x1 = (-bound.x + this.startOffset.x + x1) * ratio;
      y1 = (-bound.y + this.startOffset.y + y1) * ratio;
      x2 = (-bound.x + this.startOffset.x + x2) * ratio;
      y2 = (-bound.y + this.startOffset.y + y2) * ratio;
    }

    const form = [];
    form.push(new THREE.Vector2(x1, y1));
    form.push(new THREE.Vector2(x1, y2));
    form.push(new THREE.Vector2(x2, y2));
    form.push(new THREE.Vector2(x2, y1));

    return form;
  }

  getCoordPoint(svg) {
    const cx = Number(svg.getAttribute('cx'));
    const cy = Number(svg.getAttribute('cy'));

    return new THREE.Vector2(cx, cy);
  }

  getCoordLine(svg) {
    const cx1 = Number(svg.getAttribute('x1'));
    const cy1 = Number(svg.getAttribute('y1'));
    const cx2 = Number(svg.getAttribute('x2'));
    const cy2 = Number(svg.getAttribute('y2'));

    return { a: new THREE.Vector2(cx1, cy1), b: new THREE.Vector2(cx2, cy2) };
  }

  actElem(svg, act = false) {
    const stroke = !act ? 'rgb(0, 0, 0)' : '#ff0000';

    if (svg['userData'].lineI) {
      if (svg['userData'].tag === 'line') {
        svg.setAttribute('stroke', stroke);
      } else if (svg['userData'].tag === 'point') {
        svg.setAttribute('stroke', stroke);
        svg.setAttribute('fill', stroke);
      } else if (svg['userData'].tag === 'dline') {
        svg.setAttribute('stroke', stroke);
      } else if (svg['userData'].tag === 'dpoint') {
        svg.setAttribute('stroke', stroke);
        svg.setAttribute('fill', stroke);
      }
    } else if (svg['userData'].note1) {
      if (svg['userData'].tag === 'line') {
        isometricNoteSvg.setColorElem(svg, act);
      }
    } else if (svg['userData'].note2) {
      if (svg['userData'].tag === 'line') {
        isometricNoteSvg2.setColorElem(svg, act);
      }
    } else if (svg['userData'].ruler) {
      if (svg['userData'].tag === 'line') {
        isometricSvgRuler.setColorElem(svg, act);
      }
    } else {
      return;
    }
  }

  clearSelected() {
    this.selectedArr.objs.forEach((svg) => {
      this.actElem(svg, false);
    });

    this.selectedArr.objs = [];

    this.setBoxVisibility('hidden');

    this.startPos = new THREE.Vector2();
    this.endPos = new THREE.Vector2();
    this.mode = '';
  }

  moveOffset(offset) {
    const arrLines = [];
    const arrPoints = [];
    const arrNodes = [];

    this.selectedArr.objs.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI && svg['userData'].tag === 'line') {
          const p1 = svg['userData'].p1;
          const p2 = svg['userData'].p2;
          arrPoints.push(p1, p2);

          svg['userData'].links.forEach((svgPoint) => {
            arrNodes.push(svgPoint['userData'].line);
          });
        }

        if (svg['userData'].lineI && svg['userData'].tag === 'point') {
          arrPoints.push(svg);
        }
      }
    });

    arrPoints.forEach((p) => {
      p['userData'].move = false;
    });

    arrPoints.forEach((p) => {
      if (!p['userData'].move) {
        isometricSvgLine.moveSvgPoint({ svg: p, offset });
        p['userData'].move = true;
      }
    });

    arrNodes.forEach((svg) => {
      if (svg['userData'].note1 && svg['userData'].tag === 'line') {
        isometricNoteSvg.moveOffset({ svg, offset });
      }

      if (svg['userData'].note2 && svg['userData'].tag === 'line') {
        isometricNoteSvg2.moveOffset({ svg, offset });
      }
    });

    arrPoints.forEach((p) => {
      p['userData'].move = false;
    });
  }

  deleteSelected() {
    this.selectedArr.objs.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI) {
          if (svg['userData'].tag === 'line') {
            isometricSvgLine.deleteObj(svg);
          }
          if (svg['userData'].tag === 'dline') {
            isometricSvgLine.deleteObj(svg);
          }
        }
        if (svg['userData'].note1) {
          if (svg['userData'].tag === 'line') {
            isometricNoteSvg.deleteNote(svg);
          }
        }
        if (svg['userData'].note2) {
          if (svg['userData'].tag === 'line') {
            isometricNoteSvg2.deleteNote(svg);
          }
        }
        if (svg['userData'].ruler) {
          if (svg['userData'].tag === 'line') {
            isometricSvgRuler.deleteNote({ svg, type: '' });
          }
        }
      }
    });

    this.clearSelected();
  }
}
