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

    const offset = new THREE.Vector2(event.clientX - this.offset.x, event.clientY - this.offset.y);

    const pdf = isometricPdfToSvg.canvasPdf;
    if (pdf) {
      pdf.style.top = pdf.offsetTop + (event.clientY - this.offset.y) + 'px';
      pdf.style.left = pdf.offsetLeft + (event.clientX - this.offset.x) + 'px';

      const sheet = isometricSheets.elemWrap;
      if (sheet) {
        sheet.style.cssText = pdf.style.cssText;
      }
    }

    this.moveSvg(offset);

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    this.isDown = false;

    this.offset = new THREE.Vector2();
  };

  moveSvg(offset) {
    if (!this.containerSvg) return;

    isometricSvgLine.moveOffset(offset);

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].note1 && svg['userData'].tag === 'line') {
          isometricNoteSvg.moveSvgLine({ svg, offset });
        }

        if (svg['userData'].note2 && svg['userData'].tag === 'line') {
          isometricNoteSvg2.moveSvgLine({ svg, offset });
        }

        if (svg['userData'].ruler && svg['userData'].tag === 'line') {
          isometricSvgRuler.moveSvgLine({ svg, offset, type: 'offsetPdf' });
        }
      }
    });
  }
}
