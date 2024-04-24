import * as THREE from 'three';

import { isometricPdfToSvg, isometricSheets, isometricSvgLine, isometricNoteSvg, isometricNoteSvg2, isometricSvgRuler } from './index';

export class IsometricMovePdf {
  containerSvg;
  isDown = false;
  offset = new THREE.Vector2();

  init({ containerSvg }) {
    this.containerSvg = containerSvg;
  }

  onmousedown = (event) => {
    if (event.button !== 1) return;

    this.offset = new THREE.Vector2(event.clientX, event.clientY);

    this.isDown = true;

    return this.isDown;
  };

  // перемещение листа
  onmousemove = (event) => {
    if (!this.isDown) return;

    const pdf = isometricPdfToSvg.canvasPdf;
    if (pdf) {
      pdf.style.top = pdf.offsetTop + (event.clientY - this.offset.y) + 'px';
      pdf.style.left = pdf.offsetLeft + (event.clientX - this.offset.x) + 'px';

      isometricSheets.setStyle(pdf.style.cssText);

      this.containerSvg.style.cssText = pdf.style.cssText;
      this.containerSvg.style.zIndex = '4';
      this.containerSvg.style.userSelect = 'none';
    }

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    this.isDown = false;

    this.offset = new THREE.Vector2();
  };
}
