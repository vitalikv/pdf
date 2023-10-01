import * as THREE from 'three';

import { mapControlInit } from './index';

export class IsometricNoteText {
  isDown = false;
  container;
  containerSvg;
  containerPointsSvg;
  arrText = [];
  selectedObj = { el: null, type: '' };
  offset = new THREE.Vector2();

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
  }

  // создаем текст
  addText(event) {
    if (event.button !== 0) return;

    const bound = this.containerSvg.getBoundingClientRect();
    const x = -bound.x + event.clientX;
    const y = -bound.y + event.clientY;

    const div = document.createElement('div');
    div.innerHTML = `
    <div style="position: absolute; left: 30px; min-width: 100px; min-height: 45px; font-family: Gostcadkk; font-size: 22px; z-index: 5; box-sizing: border-box;">
      <div nameId="content" style="position: absolute; top: 10px; left: 10px; right: 10px; bottom: 10px; padding: 3px; overflow: hidden;">
        Текст
      </div>
    </div>`;

    const elem = div.children[0];

    const containerTexts = this.containerSvg.querySelector('[nameId="notesText"]');
    containerTexts.append(elem);

    this.arrText.push(elem);

    if (!this.containerPointsSvg) this.containerPointsSvg = this.createContainerPointsSvg({ container: containerTexts });

    const bound2 = elem.getBoundingClientRect();
    elem.style.left = x - bound2.width / 2 + 'px';
    elem.style.top = y - bound2.height / 2 + 'px';

    elem.children[0]['oninput'] = () => {
      this.setPosArrSvgCircle();
    };

    elem.children[0]['onmousedown'] = (e) => {
      //e.stopPropagation();
      elem.children[0].setAttribute('spellcheck', 'false');
      elem.children[0].setAttribute('contenteditable', 'true');
    };
  }

  createContainerPointsSvg({ container }) {
    const div = document.createElement('div');
    div.style.cssText = 'position: absolute; width: 1px; z-index: 6;';
    div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="overflow: visible;"></svg>`;
    container.prepend(div);

    this.createSvgCircle({ container: div, ind: 0, x: 0, y: 0 });
    this.createSvgCircle({ container: div, ind: 1, x: 0, y: 0 });
    this.createSvgCircle({ container: div, ind: 2, x: 0, y: 0 });
    this.createSvgCircle({ container: div, ind: 3, x: 0, y: 0 });

    return div;
  }

  // создаем svg точки
  createSvgCircle({ container, ind, x, y }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);

    svg.setAttribute('r', '4.2');
    svg.setAttribute('stroke-width', '2px');
    svg.setAttribute('stroke', 'rgb(0, 0, 0)');
    svg.setAttribute('transform-origin', 'center');

    svg.setAttribute('fill', '#fff');
    svg.setAttribute('ind', ind);
    svg['userData'] = { divStamp: null };

    svg.setAttributeNS(null, 'style', 'transform: translateX(0) translateY(0);');
    svg.setAttribute('display', 'none');

    container.children[0].append(svg);
  }

  getSelectedDiv() {
    if (!this.containerPointsSvg) return;
    if (!this.selectedObj.el) return;

    let elem = null;
    const type = this.selectedObj.type;

    if (type === 'div') {
      elem = this.selectedObj.el;
    }

    if (type === 'svgCircle') {
      elem = this.selectedObj.el['userData'].divStamp;
    }

    return elem;
  }

  setPosArrSvgCircle() {
    if (!this.containerPointsSvg) return;
    if (!this.selectedObj.el) return;
    if (this.selectedObj.type !== 'div') return;

    const childNodes = this.containerPointsSvg.children[0].childNodes;
    const boundMain = this.containerSvg.getBoundingClientRect();
    const bound = this.selectedObj.el.getBoundingClientRect();
    const divStamp = this.selectedObj.el;
    const r = 4.2 / 2;

    this.setPosSvgCircle({ svg: childNodes[0], x: bound.left - boundMain.x - r, y: bound.top - boundMain.top - r, divStamp });
    this.setPosSvgCircle({ svg: childNodes[1], x: bound.left - boundMain.x - r, y: bound.bottom - boundMain.top - r, divStamp });
    this.setPosSvgCircle({ svg: childNodes[2], x: bound.right - boundMain.x - r, y: bound.top - boundMain.top - r, divStamp });
    this.setPosSvgCircle({ svg: childNodes[3], x: bound.right - boundMain.x - r, y: bound.bottom - boundMain.top - r, divStamp });

    this.containerPointsSvg.children[0].childNodes.forEach((svg, ind) => {
      svg.setAttribute('display', '');
    });
  }

  setPosSvgCircle({ svg, x, y, divStamp }) {
    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);
    svg['userData'].divStamp = divStamp;
  }

  onmousedown = (event) => {
    if (!this.containerPointsSvg) return;
    // event.preventDefault();
    // event.stopPropagation();

    this.isDown = false;

    if (this.selectedObj.el && this.selectedObj.type === 'div' && this.selectedObj.el.contains(event.target)) {
      const elemContent = this.selectedObj.el.querySelector('[nameId="content"]');

      if (elemContent && elemContent.contains(event.target)) {
        mapControlInit.control.enabled = false;
        this.activateNote();
        this.setPosArrSvgCircle();

        return;
      }
    }

    this.clearSelectedObj();

    this.containerPointsSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg.contains(event.target)) {
        this.isDown = true;
        this.selectedObj.el = svg;
        this.selectedObj.type = 'svgCircle';

        this.activateNote();
      }
    });

    this.arrText.forEach((el) => {
      if (el.contains(event.target)) {
        this.isDown = true;
        this.selectedObj.el = el;
        this.selectedObj.type = 'div';

        this.activateNote();
        this.setPosArrSvgCircle();
      }
    });

    if (this.isDown) {
      mapControlInit.control.enabled = false;
    } else {
      this.hideSvgCircle();
    }

    this.offset = new THREE.Vector2(event.clientX, event.clientY);

    return this.isDown;
  };

  // перемещение листа
  onmousemove = (event) => {
    if (!this.isDown) return;

    const elem = this.selectedObj.el;
    const type = this.selectedObj.type;

    if (type === 'div') {
      this.moveDiv({ elem, event });
    }

    if (type === 'svgCircle') {
      this.moveSvgCircle({ elem, event });
    }

    this.offset = new THREE.Vector2(event.clientX, event.clientY);
  };

  onmouseup = (event) => {
    this.isDown = false;
    mapControlInit.control.enabled = true;
  };

  // перемещение штампа
  moveDiv({ elem, event }) {
    elem.style.top = elem.offsetTop + (event.clientY - this.offset.y) + 'px';
    elem.style.left = elem.offsetLeft + (event.clientX - this.offset.x) + 'px';
    elem.style.bottom = '';

    this.setPosArrSvgCircle();
  }

  // перемещение svg точки, изменяем размер штампа
  moveSvgCircle({ elem, event }) {
    const cx = elem.getAttribute('cx');
    const cy = elem.getAttribute('cy');

    //console.log(event.clientX - this.offset.x);
    const x = Number(cx) + (event.clientX - this.offset.x);
    const y = Number(cy) + (event.clientY - this.offset.y);
    elem.setAttribute('cx', x);
    elem.setAttribute('cy', y);

    const ind = elem.getAttribute('ind');

    const elems = this.containerPointsSvg.children[0].childNodes;

    if (ind === '0') {
      elems[1].setAttribute('cx', x);
      elems[2].setAttribute('cy', y);
    }

    if (ind === '1') {
      elems[0].setAttribute('cx', x);
      elems[3].setAttribute('cy', y);
    }

    if (ind === '2') {
      elems[0].setAttribute('cy', y);
      elems[3].setAttribute('cx', x);
    }

    if (ind === '3') {
      elems[2].setAttribute('cx', x);
      elems[1].setAttribute('cy', y);
    }

    const divStamp = elem['userData'].divStamp;

    const boundMain = this.containerSvg.getBoundingClientRect();
    const bound0 = elems[0].getBoundingClientRect();
    const bound1 = elems[1].getBoundingClientRect();
    const bound2 = elems[2].getBoundingClientRect();
    const r = 0;
    divStamp.style.top = bound0.top - boundMain.top + r + 'px';
    divStamp.style.left = bound0.left - boundMain.left + r + 'px';

    divStamp.style.width = bound2.left - bound0.left + 'px';
    divStamp.style.height = bound1.top - bound0.top + 'px';
  }

  activateNote() {
    if (!this.selectedObj.el) return;

    let el = null;

    if (this.selectedObj.type === 'div') {
      el = this.selectedObj.el;
    }

    if (this.selectedObj.type === 'svgCircle') {
      el = this.selectedObj.el['userData'].divStamp;
    }

    if (el) {
      el.style.border = '1px solid #D1D1D1';
    }
  }

  deActivateNote() {
    if (!this.selectedObj.el) return;

    let el = null;

    if (this.selectedObj.type === 'div') {
      el = this.selectedObj.el;
    }

    if (this.selectedObj.type === 'svgCircle') {
      el = this.selectedObj.el['userData'].divStamp;
    }

    if (el) {
      mapControlInit.control.enabled = true;

      el.children[0].removeAttribute('spellcheck');
      el.children[0].removeAttribute('contenteditable');

      el.style.border = 'none';
    }
  }

  clearSelectedObj() {
    this.deActivateNote();

    this.selectedObj.el = null;
    this.selectedObj.type = '';
  }

  hideSvgCircle() {
    if (!this.containerPointsSvg) return;

    this.containerPointsSvg.children[0].childNodes.forEach((svg, ind) => {
      svg.setAttribute('display', 'none');
    });
  }

  deleteNote() {
    const div = this.getSelectedDiv();
    if (!div) return;

    div.remove();

    this.clearSelectedObj();
    this.hideSvgCircle();
  }

  // удаляем все штампы
  delete() {
    this.arrText.forEach((el) => {
      el.remove();
    });

    this.arrText = [];

    this.clearSelectedObj();
    this.hideSvgCircle();

    if (this.containerPointsSvg) this.containerPointsSvg.remove();
    this.containerPointsSvg = null;
    //this.container = null;
  }
}
