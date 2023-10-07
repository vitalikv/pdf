import * as THREE from 'three';

import { isometricSvgElem, isometricNoteSvg, isometricNoteSvg2, isometricSvgRuler } from './index';

export class IsometricSvgSave {
  container;
  containerSvg;

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
  }

  save() {
    const isometry = { lines: [], points: [], rulers: [], notes: [], camera: null, sheet: null };

    this.containerSvg.children[0].childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI) {
          if (svg['userData'].tag === 'line') {
            const pos = isometricSvgElem.getPosLine1(svg);
            isometry.lines.push({ pos });
          }
          if (svg['userData'].tag === 'point') {
            const pos = isometricSvgElem.getPosCircle(svg);
            isometry.points.push({ pos });
          }
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

    console.log('isometry2', isometry);
    //return;
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
