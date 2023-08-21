import * as THREE from 'three';

import { isometricPdfToSvg } from './index';

export class IsometricCutBox {
  activated = false;
  isDown = false;
  isMove = false;
  container;
  elemCutBox = null;
  startOffset = new THREE.Vector2();
  startPos = new THREE.Vector2();
  endPos = new THREE.Vector2();

  init({ container }) {
    this.container = container;
    this.elemCutBox = this.createElemCutBox();
  }

  createElemCutBox() {
    const div = document.createElement('div');
    div.style.cssText =
      'position: absolute; width: 0; height: 0; line-height: 0; z-index: 100; visibility: hidden; border: 2px dashed #ff0000; box-sizing: border-box;';
    this.container.prepend(div);

    return div;
  }

  onKeyDown = (event) => {
    if (!this.activated) return;

    if (event.code === 'Enter') {
      this.cutPdfImage();
      this.cutBoxVisibility('hidden');
    }
  };

  activateCutBox() {
    if (!isometricPdfToSvg.canvasPdf) return;
    this.activated = true;

    const bound = this.container.getBoundingClientRect();
    this.startOffset.x = bound.left;
    this.startOffset.y = bound.top;
  }

  deActivateCutBox() {
    this.activated = false;
    this.cutBoxVisibility('hidden');
  }

  cutBoxVisibility(value) {
    this.elemCutBox.style.visibility = value;
  }

  coords(event) {
    const x = -this.startOffset.x + event.clientX;
    const y = -this.startOffset.y + event.clientY;

    return new THREE.Vector2(x, y);
  }

  onmousedown = (event) => {
    if (!this.activated) return;

    this.cutBoxVisibility('hidden');

    this.startPos = this.coords(event);
    this.endPos = this.coords(event);

    this.isDown = true;

    return true;
  };

  onmousemove = (event) => {
    if (!this.isDown) return;

    this.isMove = true;

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

    const box = this.elemCutBox;
    box.style.top = y1 + 'px';
    box.style.left = x1 + 'px';
    box.style.width = x2 - x1 + 'px';
    box.style.height = y2 - y1 + 'px';

    this.cutBoxVisibility('visible');
  };

  onmouseup = (event) => {
    this.isDown = false;
    this.isMove = false;
  };

  cutPdfImage() {
    const x = Math.min(this.startPos.x, this.endPos.x);
    const y = Math.min(this.startPos.y, this.endPos.y);
    const w = Math.abs(this.startPos.x - this.endPos.x);
    const h = Math.abs(this.startPos.y - this.endPos.y);

    if (w < 30 || h < 30) return;

    this.getFragment(x, y, w, h);
  }

  getFragment(offsetX, offsetY, width, height) {
    const canvas = isometricPdfToSvg.canvasPdf;

    const canvas2 = document.createElement('canvas');
    const context = canvas2.getContext('2d');
    const bound = canvas.getBoundingClientRect();
    const ratio = this.getRatioPdf();
    offsetX = (-bound.x + this.startOffset.x + offsetX) * ratio;
    offsetY = (-bound.y + this.startOffset.y + offsetY) * ratio;

    //console.log(bound.x, bound.y, offsetX, offsetY, ' | ', width * ratio, height * ratio);

    canvas2.width = canvas.width;
    canvas2.height = canvas.height;
    canvas2.style.cssText = canvas.style.cssText;

    context.drawImage(canvas, offsetX, offsetY, width * ratio, height * ratio, offsetX, offsetY, width * ratio, height * ratio);

    isometricPdfToSvg.canvasPdf = canvas2;
    isometricPdfToSvg.updateCanvasPdf();
  }

  getRatioPdf() {
    const div = isometricPdfToSvg.containerPdf;
    const canvas = isometricPdfToSvg.canvasPdf;

    const scalePdf = isometricPdfToSvg.scalePdf;
    const width = canvas.width / scalePdf;
    const height = canvas.height / scalePdf;

    const width2 = div.clientWidth;
    const height2 = div.clientHeight;

    const ratio = width / width2 > height / height2 ? width / width2 : height / height2;

    return ratio;
  }
}
