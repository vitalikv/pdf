import * as THREE from 'three';

import { isometricSvgElem, isometricNoteSvg, isometricNoteSvg2, isometricSvgRuler, isometricSheets, isometricNoteText, isometricSvgText, isometricStampLogo, isometricPdfToSvg } from './index';

export class IsometricSvgSave {
  container;
  containerSvg;

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
  }

  save() {
    const isometry = {
      bound: { w: 0, h: 0 },
      lines: [],
      points: [],
      objs: [],
      rulers: [],
      notes: [],
      objsBasic: [],
      scheme: [],
      texts: [],
      stampslogo: [],
      camera: null,
      sheet: null,
      substratePdf: null,
    };

    const size = isometricSvgElem.getSizeViewBox({ container: this.containerSvg });
    isometry.bound.w = size.x;
    isometry.bound.h = size.y;

    const elems = isometricSvgElem.getSvgElems({ container: this.containerSvg });

    elems.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI) {
          if (svg['userData'].tag === 'line') {
            const data = {};
            data['pos'] = isometricSvgElem.getPosLine1(svg);
            data['strokeWidth'] = svg.getAttribute('stroke-width');
            data['dasharray'] = svg.getAttribute('stroke-dasharray');
            if (svg['userData'].attributes) data['attributes'] = svg['userData'].attributes;
            isometry.lines.push(data);
          }
          if (svg['userData'].tag === 'point') {
            const data = {};
            data['pos'] = isometricSvgElem.getPosCircle(svg);
            if (svg['userData'].attributes) data['attributes'] = svg['userData'].attributes;
            if (svg['userData'].pdDist) data['pdDist'] = svg['userData'].pdDist;

            isometry.points.push(data);
          }
        }

        if (svg['userData'].tag === 'objElem') {
          svg.childNodes.forEach((child) => {
            this.addListObjs({ svg: child, isometry });
          });
        }

        if (svg['userData'].note1 && svg['userData'].tag === 'line') {
          const obj = isometricNoteSvg.getStructureNote(svg);

          const lock = svg['userData'].lock;
          const passportId = svg.getAttribute('id');

          const pos1 = isometricSvgElem.getPosLine2(obj.line);
          const pos2 = isometricSvgElem.getPosCircle(obj.point);

          let label = null;

          if (obj.labelEls) {
            label = { circle: null, line: null, txt1: null, txt2: null };

            label.circle = {};
            label.circle.pos = isometricSvgElem.getPosCircle(obj.labelEls.svgCircle);

            label.line = {};
            label.line.pos = isometricSvgElem.getPosLine2(obj.labelEls.svgLine);

            label.txt1 = { text: '' };
            if (obj.labelEls.svgText1) {
              label.txt1.text = obj.labelEls.svgText1.textContent;
              label.txt1.pos = isometricSvgElem.getPosText1(obj.labelEls.svgText1);
            }

            label.txt2 = { text: '' };
            if (obj.labelEls.svgText2) {
              label.txt2.text = obj.labelEls.svgText2.textContent;
              label.txt2.pos = isometricSvgElem.getPosText1(obj.labelEls.svgText2);
            }
          }

          isometry.notes.push({ tag: 'note1', line: { pos: pos1 }, point: { pos: pos2 }, label, passportId, lock });
        }

        if (svg['userData'].note2 && svg['userData'].tag === 'line') {
          const obj = isometricNoteSvg2.getStructureNote(svg);

          const lock = svg['userData'].lock;
          const passportId = svg.getAttribute('id');

          const pos1 = isometricSvgElem.getPosLine2(obj.line);
          const pos2 = isometricSvgElem.getPosCircle(obj.point);

          let label = null;

          if (obj.labelEls) {
            label = { line: null, txt1: null, txt2: null };

            label.line = {};
            label.line.pos = isometricSvgElem.getPosLine2(obj.labelEls.svgLine);

            label.txt1 = { text: '' };
            if (obj.labelEls.svgText1) {
              label.txt1.text = obj.labelEls.svgText1.textContent;
              label.txt1.pos = isometricSvgElem.getPosText1(obj.labelEls.svgText1);
            }

            label.txt2 = { text: '' };
            if (obj.labelEls.svgText2) {
              label.txt2.text = obj.labelEls.svgText2.textContent;
              label.txt2.pos = isometricSvgElem.getPosText1(obj.labelEls.svgText2);
            }
          }

          isometry.notes.push({ tag: 'note2', line: { pos: pos1 }, point: { pos: pos2 }, label, passportId, lock });
        }

        if (svg['userData'].ruler && svg['userData'].tag === 'line') {
          const obj = isometricSvgRuler.getStructureNote(svg);
          const pos1 = isometricSvgElem.getPosLine2(obj.line);
          const pos2 = isometricSvgElem.getPosPolygon(obj.p1);
          const pos3 = isometricSvgElem.getPosPolygon(obj.p2);
          const pos4 = isometricSvgElem.getPosLine2(obj.p1line);
          const pos5 = isometricSvgElem.getPosLine2(obj.p2line);
          const txt = obj.divText.textContent;

          isometry.rulers.push({ line: pos1, p1: pos2, p2: pos3, p1line: pos4, p2line: pos5, divText: { txt } });
        }
      }
    });

    isometricNoteText.arrText.forEach((div) => {
      const svgXmlns = isometricSvgElem.getSvgXmlns({ container: this.containerSvg });
      const bound = svgXmlns.getBoundingClientRect();
      const viewBox = new THREE.Vector2(bound.width, bound.height);
      const aspect = new THREE.Vector2(isometry.bound.w / viewBox.x, isometry.bound.h / viewBox.y);

      let cssText = div.style.cssText;

      const match1 = cssText.match(/top:\s*(-?\d+(\.\d+)?)px/);
      const match2 = cssText.match(/left:\s*(-?\d+(\.\d+)?)px/);
      const match3 = cssText.match(/ width:\s*(-?\d+(\.\d+)?)px/);
      const match4 = cssText.match(/ height:\s*(-?\d+(\.\d+)?)px/);
      const match5 = cssText.match(/font-size:\s*(-?\d+(\.\d+)?)px/);

      if (match1) {
        let value = parseFloat(match1[1]);
        value *= aspect.y;
        cssText = cssText.replace(/top:\s*(-?\d+(\.\d+)?)px;/, 'top: ' + value + 'px;');
      }
      if (match2) {
        let value = parseFloat(match2[1]);
        value *= aspect.x;
        cssText = cssText.replace(/left:\s*(-?\d+(\.\d+)?)px;/, 'left: ' + value + 'px;');
      }
      if (match3) {
        let value = parseFloat(match3[1]);
        value *= aspect.x;
        cssText = cssText.replace(/ width:\s*(-?\d+(\.\d+)?)px;/, ' width: ' + value + 'px;');
      }
      if (match4) {
        let value = parseFloat(match4[1]);
        console.log(value);
        value *= aspect.y;

        cssText = cssText.replace(/ height:\s*(-?\d+(\.\d+)?)px;/, ' height: ' + value + 'px;');
      }
      if (match5) {
        let value = parseFloat(match5[1]);
        value *= aspect.y;
        cssText = cssText.replace(/font-size:\s*(-?\d+(\.\d+)?)px;/, 'font-size: ' + value + 'px;');
      }

      const textContent = div.children[0].textContent;
      isometry.texts.push({ cssText, textContent });
    });

    this.addListTexts({ isometry });

    isometricStampLogo.arrStamp.forEach((div) => {
      const cssText = div.style.cssText;
      const url = div['userData'].url;
      isometry.stampslogo.push({ cssText, url });
    });

    const groupBasicElems = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'basicElems' });
    groupBasicElems.childNodes.forEach((svg) => {
      if (svg['userData'].objBasic && svg['userData'].ind === 0) {
        const data = { tag: '', pos: [] };
        const tagObj = svg['userData'].tagObj;

        if (tagObj === 'arrow') {
          data.tag = 'shapeArrow';
          const pos = isometricSvgElem.getPosLine2(svg);
          data.pos.push(...pos);
        }

        if (tagObj === 'ellipse') {
          data.tag = 'shapeEllipse';
          const pos = isometricSvgElem.getPosCircle(svg);
          data.pos.push(pos);
          data['params'] = { rx: svg.getAttribute('rx'), ry: svg.getAttribute('ry') };
        }

        if (tagObj === 'rectangle' || tagObj === 'triangle') {
          data.tag = tagObj === 'rectangle' ? 'shapeRectangle' : 'shapeTriangle';
          const elems = svg['userData'].elems;

          for (let i = 0; i < elems.length; i++) {
            const line = elems[i];
            const pos = isometricSvgElem.getPosLine2(line)[0];
            data.pos.push(pos);
          }
        }

        isometry.objsBasic.push(data);
      }
    });

    const groupObjs = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'objs' });
    groupObjs.childNodes.forEach((svg) => {
      if (svg['userData'] && svg['userData'].freeForm) {
        const data = isometricSvgElem.parserSvg({ svg });
        const attributes = svg['userData'].attributes ? svg['userData'].attributes : {};
        isometry.scheme.push({ ...data[0], attributes });
      }
    });

    if (isometricPdfToSvg.canvasPdf) {
      const base64String = isometricPdfToSvg.canvasPdf.toDataURL('image/png');
      isometry.substratePdf = base64String;
    }

    isometry.sheet = { format: '', table1: [], table2: [] };
    isometry.sheet.format = isometricSheets.formatSheet;

    const txt = isometricSheets.getTxtFromTables();
    isometry.sheet.table1 = txt.table1;
    isometry.sheet.table2 = txt.table2;

    console.log('isometry2', isometry);

    //this.saveFileInTxt({ file: isometry });
    this.saveFileInDir({ file: isometry });
  }

  addListObjs({ svg, isometry }) {
    if (svg['userData'].objBracket && svg['userData'].tag === 'point') {
      const pos = isometricSvgElem.getPosCircle(svg);
      const attributes = svg['userData'].attributes ? svg['userData'].attributes : {};
      isometry.objs.push({ tag: 'objBracket', pos, attributes });
    }

    if (svg['userData'].objValve && svg['userData'].tag === 'point') {
      const pos = isometricSvgElem.getPosCircle(svg);
      const scale = svg['userData'].profile.scale;
      const attributes = svg['userData'].attributes ? svg['userData'].attributes : {};
      isometry.objs.push({ tag: 'objValve', pos, scale, attributes });
    }

    if (svg['userData'].objTee && svg['userData'].tag === 'point') {
      const pos = isometricSvgElem.getPosCircle(svg);
      const attributes = svg['userData'].attributes ? svg['userData'].attributes : {};
      isometry.objs.push({ tag: 'objTee', pos, attributes });
    }

    if (svg['userData'].objFlap && svg['userData'].tag === 'point') {
      const pos = isometricSvgElem.getPosCircle(svg);
      const scale = svg['userData'].profile.scale;
      const attributes = svg['userData'].attributes ? svg['userData'].attributes : {};
      isometry.objs.push({ tag: 'objFlap', pos, scale, attributes });
    }

    if (svg['userData'].objAdapter && svg['userData'].tag === 'point') {
      const pos = isometricSvgElem.getPosCircle(svg);
      const scale = svg['userData'].profile.scale;
      const attributes = svg['userData'].attributes ? svg['userData'].attributes : {};
      isometry.objs.push({ tag: 'objAdapter', pos, scale, attributes });
    }

    if (svg['userData'].objBox && svg['userData'].tag === 'point') {
      const pos = isometricSvgElem.getPosCircle(svg);
      const scale = svg['userData'].profile.scale;
      const attributes = svg['userData'].attributes ? svg['userData'].attributes : {};
      isometry.objs.push({ tag: 'objBox', pos, scale, attributes });
    }

    if (svg['userData'].objSplitter && svg['userData'].tag === 'point') {
      const pos = isometricSvgElem.getPosCircle(svg);
      const attributes = svg['userData'].attributes ? svg['userData'].attributes : {};
      isometry.objs.push({ tag: 'objSplitter', pos, attributes });
    }
  }

  addListTexts({ isometry }) {
    const result = isometricSvgText.getListTexts();

    if (result.length > 0) isometry.texts.push(...result);
  }

  // сохранение файла на комп через браузер
  saveFileInTxt({ file }) {
    const str = JSON.stringify({ file });

    const data = 'data:application/csv;charset=utf-8,' + encodeURIComponent(str);

    let link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.href = data;
    link.download = 'isometry.json';
    link.click();
    document.body.removeChild(link);
  }

  // сохранение в папку через php
  async saveFileInDir({ file }) {
    const url = '/php/saveJson.php';
    const body = new URLSearchParams();
    body.append('myarray', JSON.stringify(file));
    body.append('nameFile', 'test1.json');

    const response = await fetch(url, {
      method: 'POST',
      body: body,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    });
    const data = await response.json();
    console.log(data);
  }
}
