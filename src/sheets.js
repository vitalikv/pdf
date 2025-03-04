import * as THREE from 'three';

import { isometricPdfToSvg, isometricSvgElem } from './index';

export class IsometricSheets {
  container;
  elemWrap;
  elemSheet;
  actInput = null;
  elInputs = [];
  formatSheet = '';
  lastKeyCode = '';

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;

    this.showHideSheet('a3');
  }

  showHideSheet(formatSheet, table1 = [], table2 = [], btn = false) {
    if (btn) {
      let txt = this.getTxtFromTables();
      table1 = txt.table1;
      table2 = txt.table2;
    }

    this.delete();
    this.createSvgSheet(formatSheet, table1, table2);
  }

  async createSvgSheet(formatSheet, table1, table2) {
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
    console.log(table1, url);
    if (url === '') return;

    const data = await this.xhrImg_1(url);

    this.delete();
    this.formatSheet = formatSheet;

    const div = document.createElement('div');
    div.style.userSelect = 'none';
    div.innerHTML = data;

    div.style.cssText = isometricPdfToSvg.canvasPdf.style.cssText;
    div.style.fontFamily = 'Gostcadkk';
    div.style.zIndex = '4';
    isometricPdfToSvg.containerPdf.append(div);

    this.elemWrap = div;
    this.elemSheet = this.elemWrap.children[0];

    this.elemSheet.style.width = '100%';
    this.elemSheet.style.height = '100%';

    const svgLine = this.elemSheet.children[0];

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.append(svgLine);
    g.setAttribute('fill', 'none');
    this.elemSheet.prepend(g);

    this.addBoxInput({ table1, table2 });
  }

  addBoxInput({ table1, table2 }) {
    const svgGRp = this.elemSheet.querySelector('[nameid="svgGRp"]');
    const svgGLp = this.elemSheet.querySelector('[nameid="svgGLp"]');

    if (!svgGRp) return;
    if (!svgGLp) return;

    const svgXmlns = isometricSvgElem.getSvgXmlns({ container: this.containerSvg });
    const rect1 = this.elemSheet.getBoundingClientRect();
    const rect2 = svgXmlns.getBoundingClientRect();

    const size = isometricSvgElem.getSizeViewBox({ container: this.containerSvg });
    const ratio = size.x / rect2.width;

    let rects = svgGRp.querySelectorAll('rect');
    if (!table1 || (table1 && table1.length === 0)) {
      table1.push({ id: 0, txt: '' });
      table1.push({ id: 1, txt: '' });
      table1.push({ id: 2, txt: '' });
      table1.push({ id: 6, txt: '' });
      table1.push({ id: 7, txt: '' });
      table1.push({ id: 8, txt: '' });
      table1.push({ id: 9, txt: '' });
      table1.push({ id: 10, txt: '' });
    }

    for (let i = 0; i < table1.length; i++) {
      const fontSize = i > 2 && i < 6 ? '15px' : '20px';
      const id = table1[i].id;
      const txt = table1[i].txt;
      this.createTxtInput({ svgRect: rects[id], txt, fontSize, rect1, rect2, ratio, tableId: 1, id });
    }

    rects = svgGLp.querySelectorAll('rect');
    if (!table2 || (table2 && table2.length === 0)) {
      table2.push({ id: 36, txt: '' });
      table2.push({ id: 40, txt: '' });
    }

    for (let i = 0; i < table2.length; i++) {
      const id = table2[i].id;
      const txt = table2[i].txt;
      this.createTxtInput({ svgRect: rects[id], txt, fontSize: '13px', rect1, rect2, ratio, tableId: 2, id });
    }
  }

  createTxtInput({ svgRect, txt, fontSize = '10px', rect1, rect2, ratio, tableId, id }) {
    if (!svgRect) return;

    const rectC = svgRect.getBoundingClientRect();

    const divSheet = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'sheetText' });

    const elem = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    elem.setAttribute('x', '' + (rectC.x + rectC.width / 2 + (rect2.x - rect1.x) - rect2.x) * ratio);
    elem.setAttribute('y', '' + (rectC.y + rectC.height / 2 + (rect2.y - rect1.y) - rect2.y) * ratio);
    elem.setAttribute('dominant-baseline', 'middle');
    elem.setAttribute('text-anchor', 'middle');
    elem.setAttribute('font-size', fontSize);
    elem.setAttribute('font-family', 'Gostcadkk');
    elem.setAttribute('color', '#000000');
    elem.textContent = txt;
    divSheet.append(elem);

    const newRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    newRect.setAttribute('x', '' + (rectC.x + (rect2.x - rect1.x) - rect2.x) * ratio);
    newRect.setAttribute('y', '' + (rectC.y + (rect2.y - rect1.y) - rect2.y) * ratio);
    newRect.setAttribute('width', '' + rectC.width * ratio);
    newRect.setAttribute('height', '' + rectC.height * ratio);
    newRect.setAttribute('fill', '#5cceee');
    newRect.setAttribute('fill-opacity', '0.5');
    newRect.style.cursor = 'pointer';
    divSheet.append(newRect);

    this.elInputs.push({ svgRect: newRect, svgText: elem, tableId, id });

    this.initEventTxtInput({ svgRect: newRect, svgText: elem });

    this.fontSvgSizeAutoAdjustToFit({ svgRect: newRect, svgText: elem });
  }

  // событие по Rect (input)
  initEventTxtInput({ svgRect, svgText }) {
    svgRect.onpointerdown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const elem2 = document.createElement('input');
      const rect = svgRect.getBoundingClientRect();
      const bound = this.containerSvg.getBoundingClientRect();

      elem2.style.position = 'absolute';

      elem2.style.top = rect.top - 1 - bound.top + 'px';
      elem2.style.left = rect.left - 2 - bound.left + 'px';

      elem2.style.zIndex = '4';

      elem2.value = svgText.textContent;
      //elem2.style.background = 'rgb(255, 255, 255)';
      elem2.style.border = 'none';
      elem2.style.outline = 'none';
      elem2.style.width = rect.width - 2 + 'px';
      elem2.style.height = rect.height - 2 + 'px';
      elem2.style.textAlign = 'center';
      elem2.style.fontSize = svgText.getAttribute('font-size');
      elem2.style.fontFamily = 'Gostcadkk';
      elem2.style.boxSizing = 'border-box';

      const scale = isometricSvgElem.getScaleViewBox();
      const svgFontSizeNumber = parseFloat(svgText.getAttribute('font-size')) / scale.x;
      elem2.style.fontSize = svgFontSizeNumber.toFixed(2) + 'px';

      this.containerSvg.append(elem2);

      elem2.focus();

      //this.fontHtmlSizeAutoAdjustToFit({ input: elem2 });

      elem2.onkeydown = (e2) => {
        //this.fontHtmlSizeAutoAdjustToFit({ input: elem2 });

        if (e2.code === 'Enter' && this.lastKeyCode !== 'ShiftLeft') {
          this.deleteInput();
          return;
        }
        this.lastKeyCode = e2.code;
      };

      elem2.onblur = (e2) => {
        this.deleteInput();
        this.lastKeyCode = '';
      };

      this.actInput = { svgText, svgRect, elem2 };

      svgText.style.display = 'none';
    };
  }

  deleteInput(target = null) {
    if (!this.actInput) return;
    const { svgText, svgRect, elem2 } = this.actInput;

    if (target === elem2) return;

    const txt = elem2.value;
    svgText.setAttribute('font-size', elem2.style.fontSize);
    svgText.textContent = txt;
    svgText.style.display = '';

    this.fontSvgSizeAutoAdjustToFit({ svgRect, svgText });

    elem2.onblur = null;
    elem2.remove();
    this.actInput = null;
  }

  // авто размер текста в input
  fontHtmlSizeAutoAdjustToFit({ input }) {
    let fontSize = 30;

    do {
      fontSize = fontSize - 1;
      input.style.fontSize = fontSize + 'px';
    } while (input.scrollWidth > input.clientWidth && fontSize > 3);

    do {
      fontSize = fontSize - 1;
      input.style.fontSize = fontSize + 'px';
    } while (input.scrollHeight > input.clientHeight && fontSize > 3);
  }

  // авто размер текста в svgRect
  fontSvgSizeAutoAdjustToFit({ svgRect, svgText }) {
    let fontSize = 30;

    svgText.setAttribute('font-size', fontSize + 'px');
    const rectBox = svgRect.getBoundingClientRect();
    let rectText = svgText.getBoundingClientRect();

    do {
      rectText = svgText.getBoundingClientRect();
      fontSize = fontSize - 1;
      svgText.setAttribute('font-size', fontSize + 'px');
    } while (rectText.width > rectBox.width && fontSize > 3);

    do {
      rectText = svgText.getBoundingClientRect();
      fontSize = fontSize - 1;
      svgText.setAttribute('font-size', fontSize + 'px');
    } while (rectText.height > rectBox.height && fontSize > 3);
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

  getTxtFromTables() {
    const txt = { table1: [], table2: [] };

    for (let i = 0; i < this.elInputs.length; i++) {
      const { tableId, id, svgText } = this.elInputs[i];
      txt['table' + tableId].push({ id, txt: svgText.textContent });
    }

    return txt;
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
