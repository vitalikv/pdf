import * as THREE from 'three';

import { isometricSvgElem, isometricNoteSvg, isometricNoteSvg2, isometricSvgRuler, isometricSheets, isometricNoteText, isometricStampLogo, isometricPdfToSvg } from './index';

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
            const pos = isometricSvgElem.getPosLine1(svg);
            const attributes = svg['userData'].attributes ? svg['userData'].attributes : {};
            isometry.lines.push({ pos, attributes });
          }
          if (svg['userData'].tag === 'point') {
            const data = {};
            data['pos'] = isometricSvgElem.getPosCircle(svg);
            if (svg['userData'].pdDist) data['pdDist'] = svg['userData'].pdDist;

            isometry.points.push(data);
          }
        }

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
      const cssText = div.style.cssText;
      const textContent = div.children[0].textContent;
      isometry.texts.push({ cssText, textContent });
    });

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
      if (svg['userData'].freeForm) {
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

    const str = JSON.stringify(isometry);

    const data = 'data:application/csv;charset=utf-8,' + encodeURIComponent(str);

    let link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.href = data;
    link.download = 'isometry.json';
    link.click();
    document.body.removeChild(link);
  }
}
