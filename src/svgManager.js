import * as THREE from 'three';

import { mapControlInit, isometricNoteSvg, isometricNoteSvg2, isometricSvgRuler, isometricCanvasPaint, isometricCutBox } from './index';

export class IsometricSvgManager {
  container;
  containerSvg;
  isDown = false;
  isMove = false;
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

  onmousedown = (event) => {
    let result = null;
    result = isometricCutBox.onmousedown(event);
    if (!result) result = isometricNoteSvg.onmousedown(event);
    if (!result) result = isometricNoteSvg2.onmousedown(event);
    if (!result) result = isometricSvgRuler.onmousedown(event);
    if (!result) result = isometricCanvasPaint.onmousedown(event);

    if (result) {
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

  deleteElem() {
    isometricNoteSvg.deleteNote();
    isometricNoteSvg2.deleteNote();
    isometricSvgRuler.deleteNote();
  }
}
