import * as THREE from 'three';

import { scene, mapControlInit, isometricPdfToSvg } from './index';

export class IsometricCanvasPaint {
  activated = false;
  container;
  isDown = false;
  lineWidth = 20;
  ratio = 1;
  canvas;
  context;
  elemBrush;
  offset = new THREE.Vector2();

  init({ container }) {
    this.container = container;
  }

  activateBrush() {
    if (!isometricPdfToSvg.canvasPdf) return;

    // const { canvas, context } = this.crCanvas({ width: this.container.clientWidth, height: this.container.clientHeight });
    // this.container.prepend(canvas);
    this.canvas = isometricPdfToSvg.canvasPdf;

    const context = this.canvas.getContext('2d');
    this.context = context;
    console.log(this.context);

    const bound = isometricPdfToSvg.canvasPdf.getBoundingClientRect();
    this.x = this.canvas.width / bound.width;
    this.y = this.canvas.height / bound.height;

    if (!this.elemBrush) this.elemBrush = this.createCircle();
    this.getRatioPdf();
    this.elemBrush.style.display = '';
    this.activated = true;
  }

  deActivateBrush() {
    if (!this.elemBrush) return;

    this.activated = false;
    this.elemBrush.style.display = 'none';
    this.elemBrush.style.top = '-99999px';
    this.elemBrush.style.left = '-99999px';
  }

  crCanvas({ width, height }) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.src = './img/3.png';
    img.onload = () => {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(img, 0, 0, width, height);
    };

    return { canvas, context };
  }

  createCircle() {
    if (this.elemBrush) {
      this.elemBrush.remove();
    }

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const radius = this.lineWidth / 2;
    canvas.width = radius * 2;
    canvas.height = radius * 2;

    const centerX = radius;
    const centerY = radius;

    context.beginPath();
    context.arc(centerX, centerY, radius - 1, 0, 2 * Math.PI, false);
    context.fillStyle = 'rgba(255,255,255,1)';
    context.fill();
    context.lineWidth = 1;
    context.strokeStyle = 'rgba(0, 0, 0,1)';
    context.stroke();

    const div = document.createElement('div');
    div.style.cssText = 'display: none; position: absolute; transform: translateX(-50%) translateY(-50%); user-select: none; z-index: 4;';
    div.prepend(canvas);

    this.container.prepend(div);

    return div;
  }

  setSize(value) {
    this.lineWidth = Number(value);

    this.elemBrush = this.createCircle();
  }

  coords(event) {
    const bound = isometricPdfToSvg.canvasPdf.getBoundingClientRect();
    const x = (-bound.x + event.clientX) * this.x;
    const y = (-bound.y + event.clientY) * this.y;

    return new THREE.Vector2(x, y);
  }

  setOffset(event) {
    this.offset = this.coords(event);
  }

  onmousedown = (event) => {
    if (!this.activated) return;

    this.isDown = true;
    mapControlInit.control.enabled = false;

    this.elemBrush.style.display = '';
    this.setPosElemBrush(event);

    this.setOffset(event);

    return this.isDown;
  };

  // перемещение svg
  onmousemove = (event) => {
    if (!this.activated) return;
    this.setPosElemBrush(event);

    if (!this.isDown) return;

    this.showBrush(event);

    this.setOffset(event);
  };

  onmouseup = (event) => {
    if (!this.isDown) return;
    this.isDown = false;
    mapControlInit.control.enabled = true;
  };

  showBrush(event) {
    const context = this.context;

    const { x, y } = this.coords(event);

    context.strokeStyle = '#ff0000';
    context.globalCompositeOperation = 'source-over';
    context.lineJoin = context.lineCap = 'round';

    context.globalAlpha = '1';
    context.lineWidth = this.lineWidth * this.ratio;
    context.beginPath();
    context.moveTo(this.offset.x, this.offset.y);
    context.lineTo(x, y);
    context.closePath();
    context.stroke();
  }

  setPosElemBrush(event) {
    const bound2 = this.elemBrush.parentElement.getBoundingClientRect();
    const x2 = -bound2.x + event.clientX;
    const y2 = -bound2.y + event.clientY;

    this.elemBrush.style.top = y2 + 'px';
    this.elemBrush.style.left = x2 + 'px';
  }

  getRatioPdf() {
    const div = isometricPdfToSvg.containerPdf;
    const canvas = isometricPdfToSvg.canvasPdf;

    const scalePdf = isometricPdfToSvg.scalePdf;
    const width = canvas.width / scalePdf;
    const height = canvas.height / scalePdf;

    const width2 = div.clientWidth;
    const height2 = div.clientHeight;

    this.ratio = width / width2 > height / height2 ? width / width2 : height / height2;
  }
}
