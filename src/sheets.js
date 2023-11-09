import * as THREE from 'three';

import { isometricPdfToSvg, isometricSvgElem } from './index';

export class IsometricSheets {
  container;
  elemWrap;
  elemSheet;
  actInput = null;
  elInputs = [];
  formatSheet = '';

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
  }

  showHideSheet(formatSheet) {
    if (formatSheet === this.formatSheet) {
      this.delete();
    } else {
      this.delete();
      this.createSvgSheet(formatSheet);
    }
  }

  async createSvgSheet(formatSheet) {
    let url = '';
    if (formatSheet === 'a3') {
      //url = 'assets/gis/isometry/А3.svg';
      url = 'img/sheets/A3.svg';
    }
    if (formatSheet === 'a2') {
      //url = 'assets/gis/isometry/А2.svg';
      url = 'img/sheets/A2.svg';
    }
    if (formatSheet === 'a1') {
      //url = 'assets/gis/isometry/A1.svg';
      url = 'img/sheets/A1.svg';
    }
    console.log(formatSheet, url);
    if (url === '') return;

    this.formatSheet = formatSheet;

    const div = document.createElement('div');
    // div.innerHTML = `<div style="position: absolute; width: 420px; left: 0; top: 0; bottom: 0; background: #ccc; z-index: 2;"></div>`; // left
    // div.innerHTML += `<div style="position: absolute; height: 90px; left: 0; right: 0; bottom: 0; background: #ccc; z-index: 2;"></div>`; // bottom
    // div.innerHTML += `<div style="position: absolute; width: 365px; right: 0; top: 0; bottom: 0; background: #ccc; z-index: 2;"></div>`; // right
    // div.innerHTML += `<div style="position: absolute; height: 90px; left: 0; right: 0; top: 0; background: #ccc; z-index: 2;"></div>`; // top
    div.style.userSelect = 'none';

    const data = await this.xhrImg_1(url);

    div.innerHTML = data;

    //div.style.cssText = 'position: absolute; width: 100%; height: 100%; z-index: 2;';
    div.style.cssText = isometricPdfToSvg.canvasPdf.style.cssText;
    div.style.fontFamily = 'Gostcadkk';
    div.style.zIndex = '4';
    //this.container.append(div);
    isometricPdfToSvg.containerPdf.append(div);

    console.log(formatSheet, div);

    this.elemWrap = div;
    this.elemSheet = this.elemWrap.children[0];

    this.elemSheet.style.width = '100%';
    this.elemSheet.style.height = '100%';

    const svgLine = this.elemSheet.children[0];

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.append(svgLine);
    g.setAttribute('fill', 'none');
    this.elemSheet.prepend(g);

    this.addBoxInput();
  }

  addBoxInput() {
    const svgGRp = this.elemSheet.querySelector('[nameid="svgGRp"]');
    const svgGLp = this.elemSheet.querySelector('[nameid="svgGLp"]');

    if (!svgGRp) return;
    if (!svgGLp) return;

    let rects = svgGRp.querySelectorAll('rect');

    let list = [rects[0], rects[1], rects[2], rects[6], rects[7], rects[8], rects[9], rects[10]];
    for (let i = 0; i < list.length; i++) {
      const fontSize = i > 2 && i < 6 ? '15px' : '20px';
      this.createTxtInput({ svgRect: list[i], value: i + 1, fontSize });
    }

    rects = svgGLp.querySelectorAll('rect');

    this.createTxtInput({ svgRect: rects[36], value: 111 });
    this.createTxtInput({ svgRect: rects[40], value: 222 });
  }

  createTxtInput({ svgRect, value, fontSize = '10px' }) {
    if (!svgRect) return;

    const rectC = svgRect.getBoundingClientRect();
    const rect1 = this.elemSheet.getBoundingClientRect();
    const rect2 = this.containerSvg.getBoundingClientRect();

    const divSheet = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'sheetText' });

    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    elem.setAttribute('x', '' + (rectC.x + rectC.width / 2 + (rect1.x - rect2.x) - rect2.x));
    elem.setAttribute('y', '' + (rectC.y + rectC.height / 2 + (rect1.y - rect2.y) - rect2.y));
    elem.setAttribute('dominant-baseline', 'middle');
    elem.setAttribute('text-anchor', 'middle');
    elem.setAttribute('font-size', fontSize);
    elem.setAttribute('font-family', 'Gostcadkk');
    elem.setAttribute('color', '#000000');
    elem.textContent = value;
    divSheet.append(elem);

    const newRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    newRect.setAttribute('x', '' + (rectC.x + (rect1.x - rect2.x) - rect2.x));
    newRect.setAttribute('y', '' + (rectC.y + (rect1.y - rect2.y) - rect2.y));
    newRect.setAttribute('width', rectC.width);
    newRect.setAttribute('height', rectC.height);
    newRect.setAttribute('fill', '#5cceee');
    newRect.setAttribute('fill-opacity', '0.5');
    newRect.style.cursor = 'pointer';
    divSheet.append(newRect);

    this.elInputs.push({ svgRect: newRect, svgText: elem });

    this.initEventTxtInput({ svgRect: newRect, svgText: elem });
  }

  // событие по Rect (input)
  initEventTxtInput({ svgRect, svgText }) {
    svgRect.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const elem2 = document.createElement('input');
      const pos = isometricSvgElem.getPosText1(svgText);
      const bound = this.containerSvg.getBoundingClientRect();
      const size = isometricSvgElem.getSizeViewBox({ container: this.containerSvg });
      const ratio = size.x / bound.width;

      elem2.style.position = 'absolute';
      elem2.style.top = pos.y / ratio + 'px';
      elem2.style.left = pos.x / ratio + 'px';
      elem2.style.transform = 'translateX(-50%) translateY(-50%)';
      elem2.style.zIndex = '4';

      elem2.value = svgText.textContent;
      elem2.style.background = 'rgb(255, 255, 255)';
      elem2.style.border = '1px solid rgb(204, 204, 204)';
      elem2.style.width = '100px';
      elem2.style.textAlign = 'center';
      elem2.style.fontSize = '20px';
      elem2.style.fontFamily = 'Gostcadkk';
      elem2.style.borderRadius = '4px';
      elem2.style.padding = '10px';

      this.containerSvg.append(elem2);

      elem2.focus();

      elem2.onkeydown = (e2) => {
        if (e2.code === 'Enter') {
          this.deleteInput();
        }
      };

      elem2.onblur = (e2) => {
        this.deleteInput();
      };

      this.actInput = { svgText, elem2 };

      svgText.style.display = 'none';
    };
  }

  deleteInput(target = null) {
    if (!this.actInput) return;
    const { svgText, elem2 } = this.actInput;

    if (target === elem2) return;

    const txt = elem2.value;
    svgText.textContent = txt;
    svgText.style.display = '';

    elem2.onblur = null;
    elem2.remove();
    this.actInput = null;
  }

  xhrImg_1(url) {
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open('GET', url, true);
      request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
          const data = request.responseText;
          resolve(data);
        }
      };
      request.send();
    });
  }

  delete() {
    if (!this.elemWrap) return;

    this.formatSheet = '';
    this.elemWrap.remove();
    this.elemWrap = null;

    for (let i = 0; i < this.elInputs.length; i++) {
      this.elInputs[i].svgRect.remove();
      this.elInputs[i].svgText.remove();
    }

    this.elInputs = [];
  }

  setStyle(cssText) {
    const sheet = this.elemWrap;
    if (sheet) {
      sheet.style.cssText = cssText;
      sheet.style.zIndex = '4';
    }
  }
}
