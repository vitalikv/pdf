import * as THREE from 'three';

import { scene, mapControlInit, isometricPdfToSvg } from './index';

export class IsometricCanvasPaint {
  isDown = false;
  lineWidth = 20;
  context;
  elemBrush;
  offset = new THREE.Vector2();

  constructor() {
    //this.init();
  }

  init() {
    if (!this.container) this.getContainer();

    // const { canvas, context } = this.crCanvas({ width: this.container.clientWidth, height: this.container.clientHeight });
    // this.container.prepend(canvas);
    this.canvas = isometricPdfToSvg.containerPdf.children[0].children[0];
    const context = this.canvas.getContext('2d');
    this.context = context;

    this.elemBrush = this.createCircle();
  }

  getContainer() {
    this.container = document.querySelector('#labels-container-div');
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

  onmousedown = (event) => {
    if (!this.context) return;
    event.preventDefault();
    event.stopPropagation();

    this.isDown = true;
    mapControlInit.control.enabled = false;

    this.elemBrush.style.display = '';
    this.elemBrush.style.top = event.clientY + 'px';
    this.elemBrush.style.left = event.clientX + 'px';

    this.offset = new THREE.Vector2(event.clientX, event.clientY);

    return this.isDown;
  };

  // перемещение svg
  onmousemove = (event) => {
    if (!this.isDown) return;

    this.activateBrush(event);

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    if (!this.isDown) return;
    this.isDown = false;
    mapControlInit.control.enabled = true;
    this.elemBrush.style.display = 'none';
  };

  activateBrush(event) {
    const context = this.context;

    const bound = this.canvas.getBoundingClientRect();
    const x = -bound.x + event.clientX;
    const y = -bound.y + event.clientY;

    context.strokeStyle = '#fff';
    context.globalCompositeOperation = 'source-over';
    context.lineJoin = context.lineCap = 'round';

    context.globalAlpha = '1';
    context.lineWidth = this.lineWidth;
    context.beginPath();
    context.moveTo(this.offset.x, this.offset.y);
    context.lineTo(x, y);
    context.closePath();
    context.stroke();

    this.elemBrush.style.top = event.clientY + 'px';
    this.elemBrush.style.left = event.clientX + 'px';
  }
}
