import * as THREE from 'three';

import { isometricSvgElem, isometricSvgLine, isometricNoteSvg, isometricNoteSvg2 } from './index';

export class IsometricSetCalcNotes {
  groupLines;

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
    this.groupLines = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'lines' });
  }

  setNotes() {
    const joints = this.getJoints();

    console.log(joints);

    joints.forEach((note) => {
      if (note.tag === 'note1') {
        const info = { text: [note.label.txt1.text, note.label.txt2.text], passport: { id: note.passportId } };
        const { svg1, svg2, svg3 } = isometricNoteSvg.createElement({ btn: true, x: 0, y: 0, data: info });

        const obj = isometricNoteSvg.getStructureNote(svg1);

        const circle = note.label.circle;
        const line = note.label.line;
        const txt1 = note.label.txt1;
        const txt2 = note.label.txt2;

        isometricSvgElem.setPosLine1(obj.line, note.line.pos[0].x, note.line.pos[0].y, note.line.pos[1].x, note.line.pos[1].y);
        isometricSvgElem.setPosCircle(obj.point, note.point.pos.x, note.point.pos.y);
        isometricSvgElem.setPosCircle(obj.labelEls.svgCircle, circle.pos.x, circle.pos.y);
        isometricSvgElem.setPosLine1(obj.labelEls.svgLine, line.pos[0].x, line.pos[0].y, line.pos[1].x, line.pos[1].y);

        if (obj.labelEls.svgText1 && txt1.pos) {
          isometricSvgElem.setPosText1(obj.labelEls.svgText1, txt1.pos.x, txt1.pos.y);
        }
        if (obj.labelEls.svgText2 && txt2.pos) {
          isometricSvgElem.setPosText1(obj.labelEls.svgText2, txt2.pos.x, txt2.pos.y);
        }

        isometricNoteSvg.addLink({ svgPoint: obj.point, event: null, pos: new THREE.Vector2(note.point.pos.x, note.point.pos.y) });

        if (note.lock) {
          isometricNoteSvg.setLockOnSvg(obj.point, true);
        }
      }

      if (note.tag === 'note2') {
        const info = { text: [note.label.txt1.text, note.label.txt2.text], passport: { id: note.passportId } };
        const { svg1, svg2, svg3 } = isometricNoteSvg2.createElement({ btn: true, x: 0, y: 0, data: info });

        const obj = isometricNoteSvg2.getStructureNote(svg1);

        const line = note.label.line;
        const txt1 = note.label.txt1;
        const txt2 = note.label.txt2;

        isometricSvgElem.setPosLine1(obj.line, note.line.pos[0].x, note.line.pos[0].y, note.line.pos[1].x, note.line.pos[1].y);
        isometricSvgElem.setPosCircle(obj.point, note.point.pos.x, note.point.pos.y);
        isometricSvgElem.setPosLine1(obj.labelEls.svgLine, line.pos[0].x, line.pos[0].y, line.pos[1].x, line.pos[1].y);

        if (obj.labelEls.svgText1 && txt1.pos) {
          isometricSvgElem.setPosText1(obj.labelEls.svgText1, txt1.pos.x, txt1.pos.y);
        }
        if (obj.labelEls.svgText2 && txt2.pos) {
          isometricSvgElem.setPosText1(obj.labelEls.svgText2, txt2.pos.x, txt2.pos.y);
        }

        isometricNoteSvg2.addLink({ svgPoint: obj.point, event: null, pos: new THREE.Vector2(note.point.pos.x, note.point.pos.y) });

        if (note.lock) {
          isometricNoteSvg2.setLockOnSvg(obj.point, true);
        }
      }
    });
  }

  getJoints() {
    const arrLines = [];
    const arrPoints = [];

    this.groupLines.childNodes.forEach((svg, ind) => {
      if (svg['userData']) {
        if (svg['userData'].lineI && svg['userData'].tag === 'line') {
          arrLines.push(svg);
        }
        if (svg['userData'].lineI && svg['userData'].tag === 'point') {
          const display = svg.getAttribute('display');
          if (display !== 'none') arrPoints.push(svg);
        }
        // if (svg['userData'].lineI && svg['userData'].tag === 'dline') {
        //   arrLines.push(svg);
        // }
        if (svg['userData'].lineI && svg['userData'].tag === 'dpoint') {
          arrPoints.push(svg);
        }
      }
    });

    console.log(222, arrLines);
    let joints = [];

    arrLines.forEach((line) => {
      const points = isometricSvgElem.getPosLine1(line);

      joints.push(...points);
    });

    const notes = [];

    joints.forEach((joint) => {
      const note = { tag: 'note2', line: {}, point: {}, label: {}, passportId: 0 };

      note.line['pos'] = [joint, joint];
      note.point['pos'] = joint;

      //note.label.circle = ;
      note.label['line'] = { pos: [joint, joint] };
      note.label['txt1'] = { pos: joint, text: '1' };
      note.label['txt2'] = { pos: joint, text: '2' };

      notes.push(note);
    });

    return notes;
  }
}
