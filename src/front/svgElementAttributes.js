import * as THREE from 'three';

import { isometricSvgElem, isometricSvgElementColor, isometricPdfToSvg, isometricSheets, isometricSvgLineType } from '../index';

// класс для получения и передачи атрибутов на фронт
export class IsometricSvgElementAttributes {
  getAttributes({ event, svg, attr }) {
    this.createModalDiv({ event, svg, attr });

    //this.zoom({ svg });
  }

  setAttributes({ svg, attr }) {
    svg['userData'].attributes = attr;
  }

  // создание меню, при клики правой кнопкой
  createModalDiv({ event, svg, attr }) {
    const containerSvg = isometricSvgElem.getContainerSvg();
    const bound = containerSvg.getBoundingClientRect();
    const x = -bound.x + event.clientX;
    const y = -bound.y + event.clientY;

    let div = document.createElement('div');
    div.innerHTML = `
      <div nameId="modalWindAttr" style="position: absolute; left: 30px; font-family: Gostcadkk; font-size: 18px; z-index: 5; box-sizing: border-box; background: #F0F0F0; border: 1px solid #D1D1D1;">
        <div nameId="content" style="display: flex; flex-direction: column;">
          <div style="margin: 10px auto;">Свойства</div>
          <div nameId="container"></div>
          
          <div nameId="btnAddItem" style="display: flex; justify-content: center; align-items: center; width: 30px; padding: 5px 0; margin: 10px  auto; font-size: 18px; color: #666; background: #fff; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; user-select: none;">+</div>
  
          <div nameId="btnSave" style="display: flex; justify-content: center; align-items: center; padding: 5px 0; margin: 10px; font-size: 18px; color: #666; background: #fff; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; user-select: none;">
            <div>сохранить</div>
          </div>

          <div style="display: flex; margin: 20px auto;">
            <div nameId="btnColor1" style="width: 20px; height: 20px; margin: 0px 20px; background: #00ff00; cursor: pointer;"></div>
            <div nameId="btnColor2" style="width: 20px; height: 20px; margin: 0px 20px; background: #0000ff; cursor: pointer;"></div>
          </div>

          <div nameId="lineThickness" style="display: flex; justify-content: center; align-items: center; margin: 20px;">
            <div style="width: 100px; font-size: 14px;">толщина линии</div>
            <input type="text" value="0" nameId="inputValue" style="width: 50px; height: 25px; border: 1px solid #D1D1D1; outline: none;">
          </div>
        </div>
      </div>`;

    let divModal = div.children[0];

    const containerTexts = containerSvg.querySelector('[nameId="notesText"]');
    containerTexts.append(divModal);

    const divContainer = divModal.querySelector('[nameId="container"]');
    const btnAddItem = divModal.querySelector('[nameId="btnAddItem"]');
    const btnSave = divModal.querySelector('[nameId="btnSave"]');

    const divLineThickness = divModal.querySelector('[nameId="lineThickness"]');
    const inputLineThickness = divLineThickness.querySelector('[nameId="inputValue"]');

    if (inputLineThickness) {
      const value = isometricSvgLineType.getLineThickness({ svg });

      inputLineThickness['value'] = value;

      inputLineThickness.onkeydown = (e) => {
        if (e.code === 'Enter') {
          isometricSvgLineType.setLineThickness({ svg, value: inputLineThickness['value'] });
        }
      };
    }

    const bound2 = divModal.getBoundingClientRect();
    divModal['style'].left = x + 'px';
    divModal['style'].top = y + 'px';

    const divAttrs = [];
    const createDivItem = ({ key, value }) => {
      let div = document.createElement('div');

      div.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px;">
          <input type="text" value="${key}" nameId="inputKey" style="width: 70px; height: 25px; margin-right: 10px; border: 1px solid #D1D1D1; outline: none;">
          <input type="text" value="${value}" nameId="inputValue" style="width: 100px; height: 25px; border: 1px solid #D1D1D1; outline: none;">
        </div>`;

      let divItem = div.children[0];
      divContainer.append(divItem);

      divAttrs.push({ inputKey: divItem.querySelector('[nameId="inputKey"]'), inputValue: divItem.querySelector('[nameId="inputValue"]') });
    };

    const deleteModalDiv = () => {
      divModal.remove();
    };

    for (let key in attr) {
      createDivItem({ key, value: attr[key] });
    }

    btnAddItem['onmousedown'] = (e) => {
      createDivItem({ key: '', value: '' });
    };

    btnSave['onmousedown'] = (e) => {
      const attr = {};
      divAttrs.forEach((item) => {
        if (item.inputKey['value'].length > 0) {
          attr[item.inputKey['value']] = item.inputValue['value'];
        }
      });
      this.setAttributes({ svg, attr });

      deleteModalDiv();
    };

    const btnColor1 = divModal.querySelector('[nameId="btnColor1"]');
    const btnColor2 = divModal.querySelector('[nameId="btnColor2"]');

    btnColor1.onmousedown = (e) => {
      isometricSvgElementColor.setColor({ color: btnColor1.style.background });
      console.log(btnColor1.style.background);
    };
    btnColor2.onmousedown = (e) => {
      isometricSvgElementColor.setColor({ color: btnColor2.style.background });
      console.log(btnColor2.style.background);
    };

    divModal['onmousedown'] = (e) => {
      e.stopPropagation();
    };

    return divModal;
  }

  //---

  zoom({ svg }) {
    console.log(svg);
    const box = this.createSvgScaleBox({ svg });

    const bound1 = box.getBoundingClientRect();

    const containerSvg = isometricSvgElem.getContainerSvg();
    const bound2 = containerSvg.getBoundingClientRect();

    const scaleX = 1 / ((bound1.width + 100) / bound2.width);
    const scaleY = 1 / ((bound1.height + 100) / bound2.height);

    const scale = scaleX < scaleY ? scaleX : scaleY;

    //isometricPdfToSvg.setScale({ value: scale * 100 });

    this.moveCanvas({ svg, containerSvg, bound1, bound2 });
  }

  createSvgScaleBox({ svg }) {
    const containerSvg = isometricSvgElem.getContainerSvg();
    const groupObjs = isometricSvgElem.getSvgGroup({ tag: 'objs' });

    const bound = svg.getBoundingClientRect();

    const gScaleBox = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gScaleBox.setAttribute('fill', 'none');
    gScaleBox['userData'] = { gScaleBox: true, svg, bound, lines: [], points: [] };
    groupObjs.append(gScaleBox);

    const boundContainer = containerSvg.getBoundingClientRect();
    const startOffset = new THREE.Vector2(boundContainer.left, boundContainer.top);

    const pLeftTop = new THREE.Vector2(bound.x - startOffset.x, bound.y - startOffset.y);
    const pRightTop = new THREE.Vector2(bound.x + bound.width - startOffset.x, bound.y - startOffset.y);
    const pLeftBottom = new THREE.Vector2(bound.x - startOffset.x, bound.y + bound.height - startOffset.y);
    const pRightBottom = new THREE.Vector2(bound.x + bound.width - startOffset.x, bound.y + bound.height - startOffset.y);

    const svgLines = [];
    svgLines[0] = isometricSvgElem.createSvgLine({ x1: pLeftTop.x, y1: pLeftTop.y, x2: pRightTop.x, y2: pLeftTop.y, stroke: '#ff0000', dasharray: '5,5' });
    svgLines[1] = isometricSvgElem.createSvgLine({ x1: pRightTop.x, y1: pRightTop.y, x2: pRightBottom.x, y2: pRightBottom.y, stroke: '#ff0000', dasharray: '5,5' });
    svgLines[2] = isometricSvgElem.createSvgLine({ x1: pRightBottom.x, y1: pRightBottom.y, x2: pLeftBottom.x, y2: pLeftBottom.y, stroke: '#ff0000', dasharray: '5,5' });
    svgLines[3] = isometricSvgElem.createSvgLine({ x1: pLeftBottom.x, y1: pLeftBottom.y, x2: pLeftTop.x, y2: pLeftTop.y, stroke: '#ff0000', dasharray: '5,5' });

    svgLines.forEach((elem) => {
      gScaleBox.append(elem);
    });

    let points = '';
    for (let i = 0; i < svgLines.length; i++) {
      const pos = isometricSvgElem.getPosLine2(svgLines[i]);
      points += pos[0].x + ',' + pos[0].y + ' ';
    }
    const svgPolygon = isometricSvgElem.createPolygon({ x: 0, y: 0, points, fill: 'rgb(0, 0, 0, 0.2)', stroke: 'none' });
    gScaleBox.append(svgPolygon);

    const svgPoints = [];
    for (let i = 0; i < svgLines.length; i++) {
      const pos = isometricSvgElem.getPosLine2(svgLines[i]);

      svgPoints[i] = isometricSvgElem.createSvgCircle({ x: pos[0].x, y: pos[0].y, stroke: '#ff0000', fill: '#ffffff' });
      svgPoints[i]['userData'] = { pointScalePlan: true, id: i };
      gScaleBox.append(svgPoints[i]);
    }

    gScaleBox['userData'].lines = svgLines;
    gScaleBox['userData'].polygon = svgPolygon;
    gScaleBox['userData'].points = svgPoints;

    return gScaleBox;
  }

  moveCanvas({ svg, containerSvg, bound1, bound2 }) {
    const groupObjs = isometricSvgElem.getSvgGroup({ tag: 'objs' });
    const svgRoot = groupObjs.ownerSVGElement;
    console.log(svgRoot);

    const rect = svgRoot.getBoundingClientRect();

    const offset = {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    };

    const canvas = isometricPdfToSvg.canvasPdf;

    const centerSvg = new THREE.Vector2(bound1.x + bound1.width / 2 + window.scrollX, bound1.y + bound1.height / 2 + window.scrollY);
    const centerCanvas = new THREE.Vector2(bound2.x + bound2.width / 2, bound2.y + bound2.height / 2);

    if (1 === 1) {
      const matrix = svg.getCTM();
      const svgP = document.querySelector('svg');
      const point = svgP.createSVGPoint();
      point.x = centerSvg.x; // координата X дочернего элемента
      point.y = centerSvg.y; // координата Y дочернего элемента
      // Преобразуем точку в экранные координаты
      const pos = point.matrixTransform(matrix);

      const svgHelp = isometricSvgElem.createSvgCircle({ x: centerSvg.x - offset.left, y: centerSvg.y - offset.top, stroke: '#ff0000', fill: '#ffffff' });
      groupObjs.append(svgHelp);
    }

    if (1 === 1) {
      const svgHelp = isometricSvgElem.createSvgCircle({ x: centerCanvas.x - offset.left, y: centerCanvas.y - offset.top, stroke: '#00ff00', fill: '#ffffff' });
      groupObjs.append(svgHelp);

      console.log(svgHelp);
    }

    if (canvas) {
      const bound3 = canvas.getBoundingClientRect();
      console.log(canvas.style.top, centerCanvas.x - centerSvg.x, centerCanvas.y - centerSvg.y);
      canvas.style.left = centerCanvas.x - offset.left + (centerCanvas.x - centerSvg.x) + 'px';
      canvas.style.top = centerCanvas.y - offset.top + (centerCanvas.y - centerSvg.y) + 'px';

      console.log(canvas.style.top);

      isometricSheets.setStyle(canvas.style.cssText);

      containerSvg.style.cssText = canvas.style.cssText;
      containerSvg.style.zIndex = '4';
      containerSvg.style.userSelect = 'none';
    }
  }
}
