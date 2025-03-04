import * as THREE from 'three';

import { isometricSvgElem } from './index';

export class IsometricSvgText {
  container;
  containerSvg;
  groupNotes;
  isDown = false;
  isMove = false;
  offset = { x: 0, y: 0 };
  selectedObj = { el: null, type: '' };

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
    this.groupNotes = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'notes' });
  }

  createSvgText({ pos, fontSize = '20px', txt = 'Текст' }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    svg.setAttribute('x', '' + pos.x);
    svg.setAttribute('y', '' + pos.y);
    svg.setAttribute('dominant-baseline', 'hanging');
    //svg.setAttribute('text-anchor', 'middle');
    svg.setAttribute('font-size', fontSize);
    svg.setAttribute('font-family', 'Gostcadkk');
    svg.setAttribute('color', '#000000');
    //svg.setAttribute('boxSizing', 'border-box');
    //svg.textContent = txt;
    svg.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');

    // Разбиваем текст на строки
    const lines = txt.split('\n');
    //const offsetY = parseFloat(fontSize);
    // Добавляем каждую строку как <tspan>
    lines.forEach((line, index) => {
      const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
      tspan.setAttribute('x', '' + pos.x);
      tspan.setAttribute('dy', index === 0 ? '0' : '1.2em'); // Смещение для новых строк
      tspan.textContent = line;
      svg.appendChild(tspan);
    });

    return svg;
  }

  createText({ event = null, params = null }) {
    let pos = event ? this.getCoord(event) : { x: 0, y: 0 };
    let txt = 'Текст';
    let rectBox = null;

    if (params) {
      pos = params.pos;
      txt = params.txt;
      rectBox = params.rectBox;
    }

    const svgTxt = this.createSvgText({ pos, txt });

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g['userData'] = { svgText: true };
    this.groupNotes.append(g);

    const gText = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gText['userData'] = { svgListText: true };
    g.append(gText);

    gText.append(svgTxt);

    if (!rectBox) rectBox = g.getBBox();

    const svgRect = isometricSvgElem.createRect({ x: pos.x, y: pos.y, width: rectBox.width + 10, height: rectBox.height + 10, fill: 'rgb(0, 0, 0, 0)', stroke: 'rgb(0, 0, 0, 0)', strokeWidth: '1' });
    svgRect['userData'] = { svgRectText: true };
    g.prepend(svgRect);

    this.offsetSvgText({ svgG: g, svgTxt });

    this.setColorElem({ svg: g, act: false });
  }

  offsetSvgText({ svgG, svgTxt }) {
    const elems = this.getStructure({ svg: svgG });

    const gBBox = svgG.getBBox();
    const textBBox = svgTxt.getBBox();
    const offsetY = gBBox.y - textBBox.y; // Разница между ожидаемой и фактической позицией
    const kofY = 5;
    svgTxt.setAttribute('y', '' + (gBBox.y + offsetY + kofY));
    const x = svgTxt.getAttribute('x');
    svgTxt.setAttribute('x', Number(x) + kofY);

    elems.txts.forEach((svg) => {
      const x = svg.getAttribute('x');
      const y = svg.getAttribute('y');

      svg.setAttribute('x', Number(x) + kofY);
      svg.setAttribute('y', Number(y) + kofY);

      svg.childNodes.forEach((svgLine) => {
        const x = svgLine.getAttribute('x');
        svgLine.setAttribute('x', Number(x) + kofY);
      });
    });
  }

  getCoord(event) {
    const pos = isometricSvgElem.getCoordMouse({ event, container: this.containerSvg });

    return pos;
  }

  onmousedown = ({ event, svg }) => {
    //if (this.selectedObj.el) this.actElem(this.selectedObj.el);

    this.isDown = false;
    this.isMove = false;

    if (svg['userData'].svgListText) {
      this.isDown = true;
      this.actElem(svg, true);

      this.crInputHtml({ svg });
    }
    if (svg['userData'].svgRectText) {
      this.isDown = true;
      this.actElem(svg, true);
    }

    this.offset = this.getCoord(event);

    return this.isDown;
  };

  // перемещение
  onmousemove = (event) => {
    if (!this.isDown) return;

    const elem = this.selectedObj.el;

    if (elem['userData'].svgRectText) {
      const pos = this.getCoord(event);
      const offset = pos.sub(this.offset);

      this.moveGroup({ svg: elem, offset });
    }

    this.offset = this.getCoord(event);
  };

  onmouseup = (event) => {
    this.isDown = false;
  };

  moveGroup({ svg, offset }) {
    const elems = this.getStructure({ svg });

    if (elems.rect) {
      const svgRect = elems.rect;

      const x = svgRect.getAttribute('x');
      const y = svgRect.getAttribute('y');

      svgRect.setAttribute('x', Number(x) + offset.x);
      svgRect.setAttribute('y', Number(y) + offset.y);
    }

    if (elems.txts) {
      elems.txts.forEach((svg) => {
        const x = svg.getAttribute('x');
        const y = svg.getAttribute('y');

        svg.setAttribute('x', Number(x) + offset.x);
        svg.setAttribute('y', Number(y) + offset.y);

        svg.childNodes.forEach((svgLine) => {
          const x = svgLine.getAttribute('x');
          svgLine.setAttribute('x', Number(x) + offset.x);
        });
      });
    }
  }

  actElem(svg, act = false) {
    this.setColorElem({ svg, act });

    if (act) {
      this.selectedObj.el = svg;
    } else {
      this.clearSelectedObj();
    }
  }

  clearSelectedObj() {
    this.selectedObj.el = null;
    this.selectedObj.type = '';
  }

  setColorElem({ svg, act }) {
    const elems = this.getStructure({ svg });

    let stroke = !act ? 'rgb(0, 0, 0, 0)' : '#ff0000';

    const textContent = this.getTextContent({ svg });
    const trimmedInput = textContent.trim();
    if (trimmedInput.length === 0) stroke = !act ? 'rgb(0, 0, 0, 1)' : '#ff0000';

    elems.rect.setAttribute('stroke', stroke);
  }

  crInputHtml({ svg }) {
    const elems = this.getStructure({ svg });
    const svgG = elems.parent;

    const rectC = svgG.getBoundingClientRect();

    const scale = isometricSvgElem.getScaleViewBox();
    // const x = rectC.x;
    // const y = rectC.y;
    const gBBox = svgG.getBBox();
    const x = gBBox.x / scale.x;
    const y = gBBox.y / scale.y;
    const inputSize = { x: rectC.width, y: rectC.height };

    const svgFontSize = window.getComputedStyle(elems.txts[0]).fontSize;

    const textarea = document.createElement('textarea');
    textarea.style.position = 'absolute';
    textarea.value = this.getTextContent({ svg });
    //textarea.style.background = 'rgb(255, 255, 255)';
    //textarea.style.border = 'none';
    textarea.style.outline = 'none';
    textarea.style.width = inputSize.x + 'px';
    textarea.style.height = inputSize.y + 'px';
    //textarea.style.textAlign = 'center';
    textarea.style.fontFamily = 'Gostcadkk';
    textarea.style.fontSize = svgFontSize;
    //textarea.style.boxSizing = 'border-box';
    textarea.style.overflow = 'hidden'; // прячем scroll
    textarea.style.top = y + 'px';
    textarea.style.left = x + 'px';

    const containerTexts = this.containerSvg.querySelector('[nameId="notesText"]');
    containerTexts.append(textarea);

    const svgFontSizeNumber = parseFloat(svgFontSize) / scale.x;

    textarea.style.fontSize = svgFontSizeNumber.toFixed(2) + 'px';

    setTimeout(() => {
      textarea.focus();

      textarea.onkeydown = (e) => {
        if (e.code === 'Enter' && !e.shiftKey) {
          e.preventDefault(); // Отменяем стандартное поведение

          this.changeText({ svgG, text: textarea.value });
          this.updateSize({ div: textarea, svgG });
          this.deleteTextarea({ textarea });
        }
      };

      textarea.onblur = (e) => {
        this.deleteTextarea({ textarea });
      };
    }, 0);

    // Отслеживаем изменение размера
    this.addEvent({ div: textarea, svgG });
  }

  // Отслеживаем изменение размера
  addEvent({ div, svgG }) {
    let isResizing = false;

    // Начало перетаскивания
    div.onmousedown = (e) => {
      e.stopPropagation();

      // Проверяем, что курсор находится в области изменения размера (правый нижний угол)
      const rect = div.getBoundingClientRect();
      const cornerSize = 16; // Размер области перетаскивания (примерно 16x16 пикселей)
      if (e.clientX > rect.right - cornerSize && e.clientY > rect.bottom - cornerSize) {
        isResizing = true;
      }
    };

    // Перетаскивание
    div.onmousemove = (e) => {
      e.stopPropagation();

      if (isResizing) {
        this.updateSize({ div, svgG });
      }
    };

    // Завершение перетаскивания
    div.onmouseup = (e) => {
      e.stopPropagation();

      isResizing = false;
    };
  }

  // Функция для обновления размеров
  updateSize = ({ div, svgG }) => {
    const width = div.offsetWidth;
    const height = div.offsetHeight;

    const elems = this.getStructure({ svg: svgG });

    const scale = isometricSvgElem.getScaleViewBox();

    elems.rect.setAttribute('width', width * scale.x);
    elems.rect.setAttribute('height', height * scale.y);
  };

  // получаем текст и svg
  getTextContent({ svg }) {
    const elems = this.getStructure({ svg });

    let textContent = '';
    const tspans = elems.gTxt.querySelectorAll('tspan');
    tspans.forEach((tspan, index) => {
      textContent += tspan.textContent;
      if (index < tspans.length - 1) {
        textContent += '\n'; // Добавляем перенос строки
      }
    });

    return textContent;
  }

  // меняем текст
  changeText({ svgG, text }) {
    const gBBox = svgG.getBBox(); // Получаем bounding box текста в локальной системе координат

    const elems = this.getStructure({ svg: svgG });

    elems.txts.forEach((svgTxt) => {
      svgTxt.remove();
    });

    const svgTxt = this.createSvgText({ pos: { x: gBBox.x, y: gBBox.y }, txt: text });
    elems.gTxt.append(svgTxt);

    this.offsetSvgText({ svgG, svgTxt });

    this.setColorElem({ svg: svgG, act: true });
  }

  getStructure({ svg }) {
    let svgParent = null;
    let elems = null;

    if (svg['userData'].svgText) {
      svgParent = svg;
    } else {
      svgParent = this.findTopParent(svg);
    }

    if (svgParent) {
      elems = { parent: null, rect: null, txts: [], gTxt: null };

      elems.parent = svgParent;

      svgParent.childNodes.forEach((svg) => {
        if (svg['userData'].svgRectText) {
          elems.rect = svg;
        }
        if (svg['userData'].svgListText) {
          elems.gTxt = svg;
          elems.txts.push(...svg.childNodes);
        }
      });
    }

    return elems;
  }

  findTopParent(element) {
    let currentElement = element;

    while (!currentElement['userData'].svgText) {
      currentElement = currentElement.parentElement;
    }

    return currentElement;
  }

  // для сохранения
  getListTexts() {
    const list = [];

    this.groupNotes.childNodes.forEach((svg) => {
      if (svg['userData'] && svg['userData'].svgText) {
        const elems = this.getStructure({ svg });

        const pos = { x: 0, y: 0 };
        pos.x = elems.txts[0].getAttribute('x');
        pos.y = elems.txts[0].getAttribute('y');
        const txt = this.getTextContent({ svg });

        const gBBox = elems.parent.getBBox();
        const rectBox = { width: 0, height: 0 };
        // rectBox.x = elems.rect.getAttribute('x');
        // rectBox.y = elems.rect.getAttribute('y');
        rectBox.width = gBBox.width;
        rectBox.height = gBBox.height;

        const params = { tag: 'svgTxt', pos, txt, rectBox };

        list.push(params);
      }
    });

    return list;
  }

  // удаляем textarea
  deleteTextarea({ textarea }) {
    if (textarea && textarea.parentNode) textarea.remove();
  }

  deleteNote(svg = null) {
    let elems = null;

    if (svg) {
      elems = this.getStructure({ svg });
    } else if (this.selectedObj.el) {
      elems = this.getStructure({ svg: this.selectedObj.el });
    }

    if (!elems) return;

    elems.parent.remove();

    this.clearSelectedObj();
  }
}
