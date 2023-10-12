import * as THREE from 'three';

import {
  mapControlInit,
  isometricSvgElem,
  isometricSelectBox,
  isometricPdfToSvg,
  isometricSheets,
  isometricSvgLine,
  isometricSvgObjs,
  isometricNoteSvg,
  isometricNoteSvg2,
  isometricSvgRuler,
  isometricNoteText,
  isometricStampLogo,
  isometricCanvasPaint,
  isometricCutBox,
  isometricMovePdf,
  isometricSvgSave,
  isometricSvgLoad,
} from './index';

export class IsometricSvgManager {
  container;
  containerSvg;
  isDown = false;
  isMove = false;
  mode = { type: '', data: null };
  selectedObj = { el: null, type: '' };

  onKeyDown = (event) => {
    if (event.code === 'Delete') {
      this.deleteElem();
    }

    isometricCutBox.onKeyDown(event);
    isometricSelectBox.onKeyDown(event);
  };

  onKeyUp = (event) => {
    isometricSelectBox.onKeyUp(event);
  };

  init() {
    const container = this.getContainer();
    const containerSvg = this.getContainerSvg();
    isometricSelectBox.init({ container, containerSvg });
    isometricPdfToSvg.init({ container, containerSvg });
    isometricSheets.init({ container, containerSvg });
    isometricSvgLine.init({ container, containerSvg });
    isometricSvgObjs.init({ container, containerSvg });
    isometricNoteSvg.init({ container, containerSvg });
    isometricNoteSvg2.init({ container, containerSvg });
    isometricSvgRuler.init({ container, containerSvg });
    isometricNoteText.init({ container, containerSvg });
    isometricStampLogo.init({ container, containerSvg });
    isometricCanvasPaint.init({ container });
    isometricCutBox.init({ container });
    isometricMovePdf.init({ containerSvg });
    isometricSvgSave.init({ container, containerSvg });
    isometricSvgLoad.init({ container, containerSvg });
  }

  getContainer() {
    if (!this.container) {
      this.container = document.querySelector('#labels-container-div');
    }

    return this.container;
  }

  getContainerSvg() {
    if (!this.containerSvg) this.createContainerSvg();

    return this.containerSvg;
  }

  createContainerSvg() {
    const div = document.createElement('div');
    div.setAttribute('nameId', 'svgTools');
    div.style.cssText = 'position: absolute; width: 100%; height: 100%; user-select: none; z-index: 4;';
    div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 409 293" style="overflow: visible;">
    <g nameid="lines"></g>
    <g nameid="objs"></g>
    <g nameid="rulers"></g>
    <g nameid="notes"></g>
    </svg>`;
    div.innerHTML += `<div nameId="notesText" style="position: absolute; top: 0; left: 0;"></div>`;
    div.innerHTML += `<div nameId="stampsLogo" style="position: absolute; top: 0; left: 0;"></div>`;

    this.containerSvg = div;
    const container = this.getContainer();
    container.prepend(div);
  }

  setMode({ type = '', data = null }) {
    const disabledType = this.cleareMode(type);

    this.mode.type = type;
    this.mode.data = data;

    if (this.mode.type === 'objBracket' || this.mode.type === 'objValve') {
      if (this.mode.type !== disabledType) {
        isometricSvgObjs.addObj2({ event: null, type: this.mode.type });
      } else {
        this.mode.type = '';
      }
    }

    if (this.mode.type === 'brush') {
      if (this.mode.type !== disabledType) {
        isometricCanvasPaint.activateBrush();
      } else {
        this.mode.type = '';
      }
    }

    if (this.mode.type === 'cutBox') {
      if (this.mode.type !== disabledType) {
        isometricCutBox.activateCutBox();
      } else {
        this.mode.type = '';
      }
    }
  }

  cleareMode(type = null) {
    let disabledType = '';

    if (type && this.mode.type === type) {
      disabledType = this.mode.type;
    } else if (this.mode.type === 'objBracket' || this.mode.type === 'objValve') {
      disabledType = this.mode.type;
    } else if (this.mode.type === 'brush') {
      disabledType = this.mode.type;
    } else if (this.mode.type === 'cutBox') {
      disabledType = this.mode.type;
    }

    if (disabledType === 'objBracket' || disabledType === 'objValve') {
      isometricSvgObjs.deleteAddObj();
    }
    if (disabledType === 'brush') {
      isometricCanvasPaint.deActivateBrush();
    }
    if (disabledType === 'cutBox') {
      isometricCutBox.deActivateCutBox();
    }

    this.mode.type = '';
    this.mode.data = null;

    return disabledType;
  }

  onmousedown = (event) => {
    this.unselectAllNotes(event);

    let result = isometricSelectBox.onmousedown(event);

    if (!result) result = isometricMovePdf.onmousedown(event);

    if (!result) {
      const actMode = this.checkMode(event);
      if (actMode) return;
    }

    if (!result) result = this.checkClick(event);

    if (result) {
      this.isDown = true;
      mapControlInit.control.enabled = false;
    }

    return this.isDown;
  };

  onmousemove = (event) => {
    //if (!this.isDown) return;
    this.isMove = true;

    isometricMovePdf.onmousemove(event);
    isometricSelectBox.onmousemove(event);
    isometricCutBox.onmousemove(event);
    isometricSvgLine.onmousemove(event);
    isometricSvgObjs.onmousemove(event);
    isometricNoteSvg.onmousemove(event);
    isometricNoteSvg2.onmousemove(event);
    isometricSvgRuler.onmousemove(event);
    isometricCanvasPaint.onmousemove(event);
  };

  onmouseup = (event) => {
    isometricMovePdf.onmouseup(event);
    isometricSelectBox.onmouseup(event);
    isometricCutBox.onmouseup(event);
    isometricSvgLine.onmouseup(event);
    isometricSvgObjs.onmouseup(event);
    isometricNoteSvg.onmouseup(event);
    isometricNoteSvg2.onmouseup(event);
    isometricSvgRuler.onmouseup(event);
    isometricCanvasPaint.onmouseup(event);

    this.isDown = false;
    this.isMove = false;
    mapControlInit.control.enabled = true;
  };

  checkMode(event) {
    if (this.mode.type === '') return false;

    if (this.mode.type === 'line') {
      if (event.button !== 2) {
        isometricSvgLine.addLine(event);
        this.setMode({ type: 'nextLine' });
      }
    } else if (this.mode.type === 'nextLine') {
      if (event.button === 2) {
        isometricSvgLine.stopLine();
        //this.cleareMode();
        this.setMode({ type: 'line' });
      } else {
        const result = isometricSvgLine.addNextLine(event);
        if (result) {
          //this.cleareMode();
          this.setMode({ type: 'line' });
        } else {
          this.setMode({ type: 'nextLine' });
        }
      }
    }

    if (this.mode.type === 'objBracket' || this.mode.type === 'objValve') {
      //isometricSvgObjs.addObj({ event, type: this.mode.type });
      if (event.button === 0) isometricSvgObjs.addObj2({ event, type: this.mode.type });
      //this.cleareMode();
    }

    if (this.mode.type === 'addNote1') {
      isometricNoteSvg.addNote(event, this.mode.data);
      this.cleareMode();
    }

    if (this.mode.type === 'addNote2') {
      isometricNoteSvg2.addNote(event, this.mode.data);
      this.cleareMode();
    }

    if (this.mode.type === 'addRuler') {
      isometricSvgRuler.addRuler(event, this.mode.data);
      this.setMode({ type: 'nextRuler' });
    } else if (this.mode.type === 'nextRuler') {
      if (event.button === 2) {
        isometricSvgRuler.deleteNote({ type: 'stopAddRuler' });
        this.setMode({ type: 'addRuler' });
      } else {
        const lastPoint = isometricSvgRuler.onmousedown(event);
        if (lastPoint) {
          isometricSvgRuler.addRuler(event, this.mode.data, lastPoint);
          this.setMode({ type: 'nextRuler' });
        } else {
          this.setMode({ type: 'moveRuler' });
        }
      }
    } else if (this.mode.type === 'moveRuler') {
      if (event.button === 2) {
        isometricSvgRuler.deleteNote({ type: 'stopAddRuler' });
        this.setMode({ type: 'addRuler' });
      } else {
        const lastPoint = isometricSvgRuler.onmousedown(event);
        //this.cleareMode();
        isometricSvgRuler.addRuler(event, this.mode.data, lastPoint);
        this.setMode({ type: 'nextRuler' });
      }
    }

    if (this.mode.type === 'addText') {
      isometricNoteText.addText(event);
      this.cleareMode();
    }

    if (this.mode.type === 'brush') {
      isometricCanvasPaint.onmousedown(event);
    }

    if (this.mode.type === 'cutBox') {
      isometricCutBox.onmousedown(event);
    }

    return true;
  }

  checkClick(event) {
    let result = null;

    const elems = isometricSvgElem.getSvgElems({ container: this.containerSvg });

    elems.forEach((svg, ind) => {
      if (svg['userData'] && svg.contains(event.target)) {
        if (svg['userData'].lineI) {
          result = isometricSvgLine.onmousedown(event);
        }

        if (svg['userData'].objBracket || svg['userData'].objValve) {
          result = isometricSvgObjs.onmousedown(event);
        }

        if (svg['userData'].note1) {
          result = isometricNoteSvg.onmousedown(event);
        }

        if (svg['userData'].note2) {
          result = isometricNoteSvg2.onmousedown(event);
        }

        if (svg['userData'].ruler) {
          result = isometricSvgRuler.onmousedown(event);
        }
      }
    });

    return result;
  }

  unselectAllNotes(event) {
    isometricSvgRuler.deleteInput(event.target);

    const elems = isometricSvgElem.getSvgElems({ container: this.containerSvg });

    elems.forEach((svg, ind) => {
      if (svg['userData']) {
        if (isometricSvgLine.selectedObj.el && svg['userData'].lineI) {
          if (isometricSvgLine.selectedObj.el === svg) {
            isometricSvgLine.actElem(svg, false);
          }
        }

        if (isometricSvgObjs.selectedObj.el && (svg['userData'].objBracket || svg['userData'].objValve)) {
          if (isometricSvgObjs.selectedObj.el === svg) {
            isometricSvgObjs.actElem(svg, false);
          }
        }

        if (svg['userData'].note1) {
          isometricNoteSvg.actElem(svg, false);
        }
        if (svg['userData'].note2) {
          isometricNoteSvg2.actElem(svg, false);
        }
        if (isometricSvgRuler.selectedObj.el && svg['userData'].ruler) {
          if (isometricSvgRuler.selectedObj.el === svg) {
            isometricSvgRuler.actElem(svg, false);
          }
        }
      }
    });
  }

  deleteElem() {
    isometricSvgLine.deleteObj();
    isometricSvgObjs.deleteObj();
    isometricNoteSvg.deleteNote();
    isometricNoteSvg2.deleteNote();
    isometricSvgRuler.deleteNote({});
    isometricNoteText.deleteNote();
  }
}
