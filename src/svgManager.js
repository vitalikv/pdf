import * as THREE from 'three';

import {
  isometricPanelUI,
  mapControlInit,
  isometricSvgElem,
  isometricSelectBox,
  isometricPdfToSvg,
  isometricSheets,
  isometricSvgJoint,
  isometricSvgLine,
  isometricSvgObjs,
  isometricSvgListObjs,
  isometricNoteSvg,
  isometricNoteSvg2,
  isometricSvgRuler,
  isometricNoteText,
  isometricSvgBasicElements,
  isometricSvgFreeForm,
  isometricStampLogo,
  isometricCanvasPaint,
  isometricCutBox,
  isometricMovePdf,
  isometricSvgSave,
  isometricSvgLoad,
  isometricSetCalcNotes,
  isometricSvgScale,
  isometricSvgUndo,
  isometricSvgRedo,
  isometricSvgUploader,
  isometricSvgParserFile,
  isometricSvgJsonElement,
  isometricSvgScaleBox,
  isometricSvgBlockingMode,
} from './index';

export class IsometricSvgManager {
  container;
  containerSvg;
  svgXmlns;
  isDown = false;
  isMove = false;
  mode = { type: '', data: null };
  selectedObj = { el: null, type: '' };
  lastKeyCode = '';

  onKeyDown = (event) => {
    if (event.code === 'Delete') {
      this.deleteElem();
    }

    if (this.lastKeyCode === 'ControlLeft' && event.code === 'KeyZ' && !event.repeat) {
      isometricSvgUndo.undo();
      this.lastKeyCode = 'ControlLeft';
      return;
    }

    if (this.lastKeyCode === 'ControlLeft' && event.code === 'KeyY' && !event.repeat) {
      isometricSvgRedo.redo();
      this.lastKeyCode = 'ControlLeft';
      return;
    }

    if (this.lastKeyCode === 'ControlLeft' && event.code === 'KeyC' && !event.repeat) {
      isometricSvgFreeForm.cloneSave();
      this.lastKeyCode = 'ControlLeft';
      return;
    }

    if (this.lastKeyCode === 'ControlLeft' && event.code === 'KeyV' && !event.repeat) {
      isometricSvgFreeForm.clonePaste();
      this.lastKeyCode = 'ControlLeft';
      return;
    }

    isometricCutBox.onKeyDown(event);
    isometricSelectBox.onKeyDown(event);
    isometricSvgScale.onKeyDown(event);

    this.lastKeyCode = event.code;
  };

  onKeyUp = (event) => {
    isometricSelectBox.onKeyUp(event);
    isometricSvgScale.onKeyUp(event);
  };

  init() {
    const container = this.getContainer();
    const containerSvg = this.getContainerSvg();
    isometricSvgElem.init({ container, containerSvg });
    isometricSelectBox.init({ container, containerSvg });
    isometricPdfToSvg.init({ container, containerSvg });
    isometricSheets.init({ container, containerSvg });
    isometricSvgJoint.init({ container, containerSvg });
    isometricSvgLine.init({ container, containerSvg });
    isometricSvgObjs.init({ container, containerSvg });
    isometricNoteSvg.init({ container, containerSvg });
    isometricNoteSvg2.init({ container, containerSvg });
    isometricSvgRuler.init({ container, containerSvg });
    isometricNoteText.init({ container, containerSvg });
    isometricSvgBasicElements.init({ container, containerSvg });
    isometricSvgFreeForm.init({ containerSvg });
    isometricSvgJsonElement.init({ containerSvg });
    isometricStampLogo.init({ container, containerSvg });
    isometricCanvasPaint.init({ container });
    isometricCutBox.init({ container });
    isometricMovePdf.init({ containerSvg });
    isometricSvgSave.init({ container, containerSvg });
    isometricSvgLoad.init({ container, containerSvg });
    isometricSetCalcNotes.init({ container, containerSvg });
    isometricSvgScale.init({ container, containerSvg });

    isometricSvgUndo.init({ isometricSvgManager: this });
    isometricSvgRedo.init({ isometricSvgManager: this });
    isometricSvgUploader.init();
    isometricSvgParserFile.init();
    isometricSvgScaleBox.init({ containerSvg });
    isometricSvgBlockingMode.init();
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

    <defs>
    <clipPath id="cut-off-bottom">
    <rect x="0" y="0" width="100%" height="100%" />
    </clipPath>
    </defs>

    <g nameid="lines" clip-path="url(#cut-off-bottom)"></g>
    <g nameid="objs" clip-path="url(#cut-off-bottom)"></g>
    <g nameid="rulers" clip-path="url(#cut-off-bottom)"></g>
    <g nameid="notes" clip-path="url(#cut-off-bottom)"></g>
    <g nameid="basicElems" clip-path="url(#cut-off-bottom)"></g>
    <g nameid="sheetText" clip-path="url(#cut-off-bottom)"></g>
    </svg>`;
    div.innerHTML += `<div nameId="notesText" style="position: absolute; top: 0; left: 0;"></div>`;
    div.innerHTML += `<div nameId="stampsLogo" style="position: absolute; top: 0; left: 0;"></div>`;

    this.containerSvg = div;
    this.svgXmlns = div.children[0];
    const container = this.getContainer();
    container.prepend(div);
    console.log(this.svgXmlns);
  }

  // нажали на кнопку в панели (вкл/выкл выбранный режим + если нужно для крусора создаем инструмент)
  setMode({ type = '', data = null }) {
    const disabledType = this.cleareMode();

    this.mode.type = type;
    this.mode.data = data;

    if (this.mode.type === 'joint') {
      if (this.mode.type !== disabledType) {
        isometricSvgJoint.createToolPoint();
      } else {
        this.mode.type = '';
      }
    }

    if (this.mode.type === 'line') {
      if (this.mode.type !== disabledType) {
        isometricSvgLine.createToolPoint();
      } else {
        this.mode.type = '';
      }
    }

    if (isometricSvgListObjs.isObjByType(this.mode.type)) {
      if (this.mode.type !== disabledType) {
        isometricSvgObjs.addObj2({ event: null, type: this.mode.type });
      } else {
        this.mode.type = '';
      }
    }

    if (this.mode.type === 'shapeJson') {
      if (this.mode.type !== disabledType) {
        isometricSvgJsonElement.createObj({ data: undefined });
      } else {
        this.mode.type = '';
      }
    }

    if (this.mode.type === 'shapeLine') {
      if (this.mode.type !== disabledType) {
        isometricSvgFreeForm.createToolPoint();
      } else {
        this.mode.type = '';
      }
    }

    if (this.mode.type === 'addNote1') {
      if (this.mode.type !== disabledType) {
        isometricNoteSvg.createToolPoint();
      } else {
        this.mode.type = '';
      }
    }

    if (this.mode.type === 'addNote2') {
      if (this.mode.type !== disabledType) {
        isometricNoteSvg2.createToolPoint();
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

  cleareMode() {
    const disabledType = this.mode.type;

    if (this.mode.type === 'joint') {
      isometricSvgJoint.deletePoint();
    }
    if (this.mode.type === 'line') {
      isometricSvgLine.deleteToolPoint();
    }
    if (this.mode.type === 'nextLine') {
      isometricSvgLine.stopLine();
      isometricSvgLine.deleteToolPoint();
    }
    if (isometricSvgListObjs.isObjByType(this.mode.type)) {
      isometricSvgObjs.deleteAddObj();
    }
    if (this.mode.type === 'brush') {
      isometricCanvasPaint.deActivateBrush();
    }
    if (this.mode.type === 'cutBox') {
      isometricCutBox.deActivateCutBox();
    }

    this.mode.type = '';
    this.mode.data = null;

    return disabledType;
  }

  onmousedown = (event) => {
    this.unselectAllNotes(event);

    let result = isometricSelectBox.onmousedown(event);
    if (!result) result = isometricSvgScale.onmousedown(event);
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
    if (isometricSvgBlockingMode.getActLock()) return;
    //if (!this.isDown) return;
    this.isMove = true;

    isometricMovePdf.onmousemove(event);
    isometricSelectBox.onmousemove(event);
    isometricSvgScale.onmousemove(event);
    isometricCutBox.onmousemove(event);
    isometricSvgJoint.onmousemove(event);
    isometricSvgLine.onmousemove(event);
    isometricSvgObjs.onmousemove(event);
    isometricSvgListObjs.onmousemove(event);
    isometricNoteSvg.onmousemove(event);
    isometricNoteSvg2.onmousemove(event);
    isometricSvgRuler.onmousemove(event);
    isometricSvgBasicElements.onmousemove(event);
    isometricSvgFreeForm.onmousemove(event);
    isometricSvgJsonElement.onmousemove(event);
    isometricCanvasPaint.onmousemove(event);
    isometricSvgScaleBox.onmousemove(event);
  };

  onmouseup = (event) => {
    isometricMovePdf.onmouseup(event);
    isometricSelectBox.onmouseup(event);
    isometricSvgScale.onmouseup(event);
    isometricCutBox.onmouseup(event);
    isometricSvgJoint.onmouseup(event);
    isometricSvgLine.onmouseup(event);
    isometricSvgObjs.onmouseup(event);
    isometricSvgListObjs.onmouseup(event);
    isometricNoteSvg.onmouseup(event);
    isometricNoteSvg2.onmouseup(event);
    isometricSvgRuler.onmouseup(event);
    isometricSvgBasicElements.onmouseup(event);
    isometricSvgFreeForm.onmouseup(event);
    isometricSvgJsonElement.onmouseup(event);
    isometricCanvasPaint.onmouseup(event);
    isometricSvgScaleBox.onmouseup(event);

    this.isDown = false;
    this.isMove = false;
    mapControlInit.control.enabled = true;
  };

  // когда кликнули на сцену и если активирован какой то режим (например добавление линии, объекта), то выполняем действие
  checkMode(event) {
    if (this.mode.type === '') return false;
    if (this.mode.type === 'joint') {
      if (event.button === 2) {
        isometricSvgJoint.deletePoint();
        this.cleareMode();
      } else {
        isometricSvgJoint.onmousedown(event);
        isometricSvgJoint.deletePoint();
        isometricSvgJoint.createToolPoint();
      }
    }

    if (this.mode.type === 'line') {
      if (event.button === 2) {
        isometricSvgLine.deleteToolPoint();
        this.cleareMode();
      } else {
        isometricSvgLine.addLine(event);
        isometricSvgLine.deleteToolPoint();
        this.mode.type = 'nextLine';
      }
    } else if (this.mode.type === 'nextLine') {
      if (event.button === 2) {
        isometricSvgLine.stopLine();
        this.cleareMode();
      } else {
        const result = isometricSvgLine.addNextLine(event);
        if (result) {
          this.mode.type = 'line';
          isometricSvgLine.createToolPoint(event);
        } else {
          this.mode.type = 'nextLine';
        }
      }
    }

    if (isometricSvgListObjs.isObjByType(this.mode.type)) {
      if (event.button === 0) isometricSvgObjs.addObj2({ event, type: this.mode.type });
      if (event.button === 2) {
        isometricPanelUI.deActivateType();
        this.cleareMode();
      }
    }

    if (this.mode.type === 'shapeJson') {
      isometricSvgJsonElement.onmousedown({ event });

      if (event.button === 2) {
        isometricPanelUI.deActivateType();
        this.cleareMode();
      }
    }

    if (this.mode.type === 'addNote1') {
      if (event.button === 2) {
        isometricNoteSvg.deleteToolPoint();
      } else {
        isometricNoteSvg.addNote(event, this.mode.data);
        isometricNoteSvg.deleteToolPoint();
      }
      this.cleareMode();
    }

    if (this.mode.type === 'addNote2') {
      if (event.button === 2) {
        isometricNoteSvg2.deleteToolPoint();
      } else {
        isometricNoteSvg2.addNote(event, this.mode.data);
        isometricNoteSvg2.deleteToolPoint();
      }
      this.cleareMode();
    }

    if (this.mode.type === 'addRuler') {
      isometricSvgRuler.addRuler(event, this.mode.data);
      this.setMode({ type: 'nextRuler' });
    } else if (this.mode.type === 'nextRuler') {
      if (event.button === 2) {
        isometricSvgRuler.deleteNote({ type: 'stopAddRuler' });
        this.cleareMode();
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

    if (this.mode.type === 'shapeLine') {
      const result = isometricSvgFreeForm.onmousedown({ event });

      if (!result) {
        isometricPanelUI.deActivateType();
        this.cleareMode();
      }
    }

    if (this.mode.type === 'shapeArrow') {
      isometricSvgBasicElements.addShape({ event, type: this.mode.type });
      this.cleareMode();
    }
    if (this.mode.type === 'shapeRectangle') {
      isometricSvgBasicElements.addShape({ event, type: this.mode.type });
      this.cleareMode();
    }
    if (this.mode.type === 'shapeEllipse') {
      isometricSvgBasicElements.addShape({ event, type: this.mode.type });
      this.cleareMode();
    }
    if (this.mode.type === 'shapeTriangle') {
      isometricSvgBasicElements.addShape({ event, type: this.mode.type });
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

  // проверяем кликнули на какой то объект или нет
  checkClick(event) {
    let result = null;

    const elems = isometricSvgElem.getSvgElems({ container: this.containerSvg, recursion: true });

    elems.forEach((svg) => {
      if (svg['userData'] && svg.contains(event.target)) {
        if (svg['userData'].lineI) {
          result = isometricSvgLine.onmousedown(event, svg);
        }

        if (isometricSvgListObjs.isObjBySvg(svg)) {
          result = isometricSvgObjs.onmousedown(event, svg);
        } else if (svg['userData'].freeFormObj) {
          const g = svg.parentNode;
          isometricSvgFreeForm.onmousedown({ event, svg: g });
          result = true;
        } else if (svg['userData'].freeFormPoint) {
          isometricSvgFreeForm.onmousedown({ event, svg });
          result = true;
        }

        if (svg['userData'].handlePoint) {
          result = isometricSvgBasicElements.onmousedown(event);
        } else if (svg['userData'].objBasic) {
          result = isometricSvgBasicElements.onmousedown(event);
        }

        if (svg['userData'].jointI) {
          result = isometricSvgJoint.onmousedown(event);
        }
        if (svg['userData'].pointScale) {
          isometricSvgListObjs.onmousedown(event);
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

        if (svg['userData'].gScaleBox) {
          result = isometricSvgScaleBox.onmousedown(event);
        }
      }
    });

    if (!result) {
      const nearestShape = isometricSvgElem.findClosestElem({ event, elems });

      if (nearestShape) {
        const svg = nearestShape;

        if (svg['userData'].lineI) {
          result = isometricSvgLine.onmousedown(event, svg);
        }

        if (isometricSvgListObjs.isObjBySvg(svg)) {
          result = isometricSvgObjs.onmousedown(event, svg);
        } else if (svg['userData'].freeFormObj) {
          const g = svg.parentNode;
          isometricSvgFreeForm.onmousedown({ event, svg: g });
          result = true;
        } else if (svg['userData'].freeFormPoint) {
          isometricSvgFreeForm.onmousedown({ event, svg });
          result = true;
        }

        if (svg['userData'].handlePoint) {
          result = isometricSvgBasicElements.onmousedown(event);
        } else if (svg['userData'].objBasic) {
          result = isometricSvgBasicElements.onmousedown(event);
        }
      }
    }

    return result;
  }

  // снимаем выделение с объекта (если он выдилен)
  unselectAllNotes(event = null) {
    if (event) isometricSvgRuler.deleteInput(event.target);

    const elems = isometricSvgElem.getSvgElems({ container: this.containerSvg });

    elems.forEach((svg, ind) => {
      if (svg['userData']) {
        if (isometricSvgLine.selectedObj.el && svg['userData'].lineI) {
          if (isometricSvgLine.selectedObj.el === svg) {
            isometricSvgLine.actElem(svg, false);
            isometricSvgFreeForm.deleteModalDiv();
          }
        }

        if (isometricSvgObjs.selectedObj.el && isometricSvgListObjs.isObjBySvg(svg)) {
          if (isometricSvgObjs.selectedObj.el === svg) {
            if (event && event.button === 0) isometricSvgObjs.addObjUR();
            if (event && event.button === 2) isometricSvgObjs.deleteAddObj();
            isometricSvgObjs.actElem(svg, false);
            isometricSvgFreeForm.deleteModalDiv();
          }
        } else if (isometricSvgFreeForm.selectedObj.el && svg['userData'].freeForm) {
          if (isometricSvgFreeForm.selectedObj.el === svg) {
            if (event && event.target['userData'] && event.target['userData'].freeFormPoint) return;
            isometricSvgFreeForm.actElem(svg, false);
            isometricSvgFreeForm.deleteModalDiv();
          }
        } else if (isometricSvgFreeForm.selectedObj.el && svg['userData'].freeFormPoint) {
          if (isometricSvgFreeForm.selectedObj.el === svg) {
            if (event && event.target['userData'] && event.target['userData'].freeFormPoint) return;
            isometricSvgFreeForm.actElem(svg, false);
            isometricSvgFreeForm.deleteModalDiv();
          }
        }

        if (isometricSvgListObjs.selectedObj && svg['userData'].pointScale) {
          isometricSvgListObjs.deActPointsScale();
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

      if (isometricSvgBasicElements.selectedObj.el === svg) {
        isometricSvgBasicElements.actElem(svg, false);
      }
    });
  }

  deleteElem() {
    if (isometricSvgBlockingMode.getActLock()) return;
    isometricSvgLine.deleteObj();
    isometricSvgObjs.deleteObj();
    isometricNoteSvg.deleteNote();
    isometricNoteSvg2.deleteNote();
    isometricSvgRuler.deleteNote({});
    isometricNoteText.deleteNote();
    isometricSvgBasicElements.deleteObj();
    isometricSvgFreeForm.deleteObj();
  }
}
