import * as THREE from 'three';

import { mapControlInit, isometricNoteSvg, isometricNoteSvg2, isometricSvgRuler, isometricCanvasPaint, isometricCutBox } from './index';

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
  };

  init() {
    const container = this.getContainer();
    const containerSvg = this.getContainerSvg();
    isometricNoteSvg.init({ container, containerSvg });
    isometricNoteSvg2.init({ container, containerSvg });
    isometricSvgRuler.init({ container, containerSvg });
    isometricCanvasPaint.init({ container });
    isometricCutBox.init({ container });
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
    div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="overflow: visible;"></svg>`;

    this.containerSvg = div;
    const container = this.getContainer();
    container.prepend(div);
  }

  setMode({ type, data } = { type: '', data: null }) {
    const disabledType = this.cleareMode();

    this.mode.type = type;
    this.mode.data = data;

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
    let disabledType = '';

    if (this.mode.type === 'brush') {
      isometricCanvasPaint.deActivateBrush();
      disabledType = 'brush';
    }

    if (this.mode.type === 'cutBox') {
      isometricCutBox.deActivateCutBox();
      disabledType = 'cutBox';
    }

    this.mode.type = '';
    this.mode.data = null;

    return disabledType;
  }

  onmousedown = (event) => {
    this.unselectAllNotes(event);

    const actMode = this.checkMode(event);
    if (actMode) return;

    let result = this.checkClick(event);

    if (actMode || result) {
      this.isDown = true;
      mapControlInit.control.enabled = false;
    }

    return this.isDown;
  };

  onmousemove = (event) => {
    //if (!this.isDown) return;
    this.isMove = true;

    isometricCutBox.onmousemove(event);
    isometricNoteSvg.onmousemove(event);
    isometricNoteSvg2.onmousemove(event);
    isometricSvgRuler.onmousemove(event);
    isometricCanvasPaint.onmousemove(event);
  };

  onmouseup = (event) => {
    isometricCutBox.onmouseup(event);
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

    if (this.mode.type === 'addNote1') {
      isometricNoteSvg.addNote(event, this.mode.data);
      this.cleareMode();
    }

    if (this.mode.type === 'addNote2') {
      isometricNoteSvg2.addNote(event, this.mode.data);
      this.cleareMode();
    }

    if (this.mode.type === 'moveRuler') {
      isometricSvgRuler.onmousedown(event);
      this.cleareMode();
    }

    if (this.mode.type === 'nextRuler') {
      isometricSvgRuler.onmousedown(event);
      this.setMode({ type: 'moveRuler', data: null });
    }

    if (this.mode.type === 'addRuler') {
      isometricSvgRuler.addRuler(event, this.mode.data);
      this.setMode({ type: 'nextRuler', data: null });
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

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData'] && svg.contains(event.target)) {
        if (svg['userData'].note1) {
          isometricNoteSvg.onmousedown(event);
          result = true;
        }

        if (svg['userData'].note2) {
          isometricNoteSvg2.onmousedown(event);
          result = true;
        }

        if (svg['userData'].ruler) {
          isometricSvgRuler.onmousedown(event);
          result = true;
        }
      }
    });

    return result;
  }

  unselectAllNotes(event) {
    isometricSvgRuler.deleteInput(event.target);

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].note1) {
          isometricNoteSvg.actElem(svg, false);
        }
        if (svg['userData'].note2) {
          isometricNoteSvg2.actElem(svg, false);
        }
        if (svg['userData'].ruler) {
          isometricSvgRuler.actElem(svg, false);
        }
      }
    });
  }

  deleteElem() {
    isometricNoteSvg.deleteNote();
    isometricNoteSvg2.deleteNote();
    isometricSvgRuler.deleteNote();
  }
}
