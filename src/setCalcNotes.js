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
        const { svg1, svg2, svg3 } = isometricNoteSvg2.createElement({ btn: true, x: note.point.pos.x, y: note.point.pos.y, data: info });

        const obj = isometricNoteSvg2.getStructureNote(svg1);

        const line = note.label.line;
        const txt1 = note.label.txt1;
        const txt2 = note.label.txt2;

        // isometricSvgElem.setPosLine1(obj.line, note.line.pos[0].x, note.line.pos[0].y, note.line.pos[1].x, note.line.pos[1].y);
        // isometricSvgElem.setPosCircle(obj.point, note.point.pos.x, note.point.pos.y);
        // isometricSvgElem.setPosLine1(obj.labelEls.svgLine, line.pos[0].x, line.pos[0].y, line.pos[1].x, line.pos[1].y);

        isometricNoteSvg2.moveSvgLabel({ svg: svg3, offset: note.offset });

        console.log(note.offset);

        // if (obj.labelEls.svgText1 && txt1.pos) {
        //   isometricSvgElem.setPosText1(obj.labelEls.svgText1, txt1.pos.x, txt1.pos.y);
        // }
        // if (obj.labelEls.svgText2 && txt2.pos) {
        //   isometricSvgElem.setPosText1(obj.labelEls.svgText2, txt2.pos.x, txt2.pos.y);
        // }

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
        if (svg['userData'].lineI && svg['userData'].tag === 'dpoint') {
          //arrPoints.push(svg);
        }
      }
    });

    const lines = [];
    arrLines.forEach((line) => {
      const points = isometricSvgElem.getPosLine1(line);
      lines.push(points);
    });

    const joints = [];

    arrPoints.forEach((p) => {
      joints.push(isometricSvgElem.getPosCircle(p));
    });

    const notes = [];

    joints.forEach((joint) => {
      const note = { tag: 'note2', line: {}, point: {}, label: {}, passportId: 0 };

      const pos = joint;
      let dir = new THREE.Vector2();

      lines.forEach((ps) => {
        const p1 = ps[0];
        const p2 = ps[1];
        let equals = false;
        if (pos.x === p1.x && pos.y === p1.y) equals = true;
        if (pos.x === p2.x && pos.y === p2.y) equals = true;

        if (equals) {
          dir = new THREE.Vector2(p2.y - p1.y, p1.x - p2.x).normalize();
          return;
        }
      });

      note.point['pos'] = pos;
      note.offset = new THREE.Vector2(dir.x * 40, dir.y * 40);

      note.label['txt1'] = { text: '1' };
      note.label['txt2'] = { text: '2' };

      notes.push(note);
    });

    return notes;
  }
}
