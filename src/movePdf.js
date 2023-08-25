import * as THREE from 'three';

import { isometricPdfToSvg } from './index';

export class IsometricMovePdf {
  isDown = false;
  offset = new THREE.Vector2();

  onmousedown = (event) => {
    if (!isometricPdfToSvg.canvasPdf) return;
    if (event.button !== 1) return;
    console.log(isometricPdfToSvg.canvasPdf);
    this.offset = new THREE.Vector2(event.clientX, event.clientY);

    this.isDown = true;

    return this.isDown;
  };

  // перемещение листа
  onmousemove = (event) => {
    if (!this.isDown) return;

    const pdf = isometricPdfToSvg.canvasPdf;
    //console.log(pdf);
    pdf.style.top = pdf.offsetTop + (event.clientY - this.offset.y) + 'px';
    pdf.style.left = pdf.offsetLeft + (event.clientX - this.offset.x) + 'px';

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    this.isDown = false;

    this.offset = new THREE.Vector2();
  };
}
