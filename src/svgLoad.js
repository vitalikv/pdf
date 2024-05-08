import * as THREE from 'three';

import {
  isometricSvgElem,
  isometricSvgLine,
  isometricSvgObjs,
  isometricSvgListObjs,
  isometricNoteSvg,
  isometricNoteSvg2,
  isometricSvgRuler,
  isometricNoteText,
  isometricStampLogo,
  isometricSheets,
} from './index';

export class IsometricSvgLoad {
  container;
  containerSvg;

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
  }

  load() {
    const p = this.xhrPromise_1({ url: 'img/isometry.json' });

    p.then((data) => {
      this.setIsometry(data);
    });
  }

  xhrPromise_1({ url }) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();
      xhr.responseType = 'json';
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

      xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
          resolve(xhr.response);
        } else {
          reject(xhr.response);
        }
      };

      xhr.onprogress = (event) => {};

      xhr.onerror = () => {
        reject(xhr.response);
      };

      xhr.send();
    });
  }

  setIsometry(data) {
    const bound = data.bound;
    const lines = data.lines;
    const points = data.points;
    const objs = data.objs;
    const notes = data.notes;
    const rulers = data.rulers;
    const texts = data.texts;
    const stampslogo = data.stampslogo;
    const sheet = data.sheet;

    const svgXmlns = isometricSvgElem.getSvgXmlns({ container: this.containerSvg });
    const groupLines = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'lines' });

    if (bound) {
      const viewBox = '0 0 ' + bound.w + ' ' + bound.h;
      svgXmlns.setAttribute('viewBox', viewBox);
    }

    const arrSvgLines = [];
    const arrSvgPoints = [];

    lines.forEach((line) => {
      const { x: x1, y: y1 } = line.pos[0];
      const { x: x2, y: y2 } = line.pos[1];

      const svg = isometricSvgElem.createSvgLine({ x1, y1, x2, y2 });

      svg['userData'] = { lineI: true, tag: 'line', lock: false, p1: null, p2: null };
      svg['userData'].pd1 = null;
      svg['userData'].pd2 = null;
      svg['userData'].ld1 = null;
      svg['userData'].ld2 = null;
      svg['userData'].links = [];

      groupLines.append(svg);

      arrSvgLines.push(svg);
    });

    points.forEach((point) => {
      const { x, y } = point.pos;
      const ids = point.ids ? point.ids : [];

      const svg = isometricSvgElem.createSvgCircle({ x, y });

      svg['userData'] = { lineI: true, tag: 'point', lock: false, lines: [] };
      svg['userData'].crossOffset = false;
      svg['userData'].move = false;
      svg['userData'].pds = [];
      svg['userData'].ids = ids;
      if (point.pdDist) svg['userData'].pdDist = point.pdDist;

      groupLines.append(svg);

      arrSvgPoints.push(svg);
    });

    for (let i = 0; i < arrSvgLines.length; i++) {
      const line = arrSvgLines[i];
      const pos = isometricSvgElem.getPosLine2(line);

      for (let i2 = 0; i2 < arrSvgPoints.length; i2++) {
        const point = arrSvgPoints[i2];
        const pos2 = isometricSvgElem.getPosCircle(point);

        let ind = 0;
        if (pos[0].x === pos2.x && pos[0].y === pos2.y) {
          ind = 1;
        }
        if (pos[1].x === pos2.x && pos[1].y === pos2.y) {
          ind = 2;
        }

        if (ind > 0) {
          line['userData']['p' + ind] = point;
          point['userData'].lines.push(line);
        }
      }
    }

    for (let i = 0; i < arrSvgPoints.length; i++) {
      const point = arrSvgPoints[i];
      const lines = point['userData'].lines;

      if (lines.length === 2) {
        isometricSvgLine.addCorner({ line1: lines[0], line2: lines[1], pCenter: point });
      }
    }

    if (objs && objs.length > 0) this.setObjs(objs);

    if (rulers) this.setRulers(rulers);
    if (notes) this.setNotes(notes);
    if (texts) this.setText(texts);
    if (stampslogo) this.setStampslogo(stampslogo);
    if (sheet) this.setSheet(sheet);
  }

  setObjs(objs) {
    objs.forEach((obj) => {
      if (obj.tag === 'objBracket') {
        const pos = obj.pos;
        const { svg3 } = isometricSvgListObjs.createObjBracket({ x: pos.x, y: pos.y });
        isometricSvgObjs.addLink({ svgPoint: svg3, event: null, pos: new THREE.Vector2(pos.x, pos.y) });
        isometricSvgObjs.setRotObj({ svg: svg3 });
      }

      if (obj.tag === 'objValve') {
        const pos = obj.pos;
        const scale = obj.scale ? obj.scale : 1;
        const { svg3 } = isometricSvgListObjs.createObjValve({ x: pos.x, y: pos.y, scale });
        isometricSvgObjs.addLink({ svgPoint: svg3, event: null, pos: new THREE.Vector2(pos.x, pos.y) });
        isometricSvgObjs.setRotObj({ svg: svg3 });
      }

      if (obj.tag === 'objTee') {
        const pos = obj.pos;
        const { svg3 } = isometricSvgListObjs.createObjTee({ x: pos.x, y: pos.y });
        isometricSvgObjs.addLink({ svgPoint: svg3, event: null, pos: new THREE.Vector2(pos.x, pos.y) });
        isometricSvgObjs.setRotObj({ svg: svg3 });
      }

      if (obj.tag === 'objFlap') {
        const pos = obj.pos;
        const scale = obj.scale ? obj.scale : 1;
        const { svg3 } = isometricSvgListObjs.createObjFlap({ x: pos.x, y: pos.y, scale });
        isometricSvgObjs.addLink({ svgPoint: svg3, event: null, pos: new THREE.Vector2(pos.x, pos.y) });
        isometricSvgObjs.setRotObj({ svg: svg3 });
      }

      if (obj.tag === 'objAdapter') {
        const pos = obj.pos;
        const scale = obj.scale ? obj.scale : 1;
        const { svg2 } = isometricSvgListObjs.createObjAdapter({ x: pos.x, y: pos.y, scale });
        isometricSvgObjs.addLink({ svgPoint: svg2, event: null, pos: new THREE.Vector2(pos.x, pos.y) });
        isometricSvgObjs.setRotObj({ svg: svg2 });
      }

      if (obj.tag === 'objBox') {
        const pos = obj.pos;
        const scale = obj.scale ? obj.scale : 1;
        const { svg2 } = isometricSvgListObjs.createObjBox({ x: pos.x, y: pos.y, scale });
        isometricSvgObjs.addLink({ svgPoint: svg2, event: null, pos: new THREE.Vector2(pos.x, pos.y) });
        isometricSvgObjs.setRotObj({ svg: svg2 });
      }

      if (obj.tag === 'objSplitter') {
        const pos = obj.pos;
        const { svg2 } = isometricSvgListObjs.createObjSplitter({ x: pos.x, y: pos.y });
        isometricSvgObjs.addLink({ svgPoint: svg2, event: null, pos: new THREE.Vector2(pos.x, pos.y) });
        isometricSvgObjs.setRotObj({ svg: svg2 });
      }

      if (obj.tag === 'objUndefined') {
        const pos = obj.pos;
        isometricSvgListObjs.createObjUndefined({ pos });
      }
    });
  }

  setNotes(notes) {
    notes.forEach((note) => {
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

  setRulers(rulers) {
    rulers.forEach((ruler) => {
      const { svg1, svg2, svg3 } = isometricSvgRuler.createElement({ btn: true, x: 0, y: 0 });

      const { line, p1, p2, p1line, p2line, pd1, pd2 } = isometricSvgRuler.getStructureNote(svg1);

      isometricSvgElem.setPosLine1(line, ruler.line[0].x, ruler.line[0].y, ruler.line[1].x, ruler.line[1].y);
      isometricSvgElem.setPosPolygon1(p1, ruler.p1.x, ruler.p1.y);
      isometricSvgElem.setPosPolygon1(p2, ruler.p2.x, ruler.p2.y);
      isometricSvgElem.setPosLine1(p1line, ruler.p1line[0].x, ruler.p1line[0].y, ruler.p1line[1].x, ruler.p1line[1].y);
      isometricSvgElem.setPosLine1(p2line, ruler.p2line[0].x, ruler.p2line[0].y, ruler.p2line[1].x, ruler.p2line[1].y);
      isometricSvgElem.setPosCircle(pd1, ruler.p1line[1].x, ruler.p1line[1].y);
      isometricSvgElem.setPosCircle(pd2, ruler.p2line[1].x, ruler.p2line[1].y);

      isometricSvgRuler.setRotArrows({ svg: p2 });
      isometricSvgRuler.createDivText({ p1, p2, txt: ruler.divText.txt });

      isometricSvgRuler.addLink({ svgPoint: pd1, event: null, pos: new THREE.Vector2(ruler.p1line[1].x, ruler.p1line[1].y) });
      isometricSvgRuler.addLink({ svgPoint: pd2, event: null, pos: new THREE.Vector2(ruler.p2line[1].x, ruler.p2line[1].y) });
    });
  }

  setText(texts) {
    if (!texts) return;

    texts.forEach((txt) => {
      const { cssText, textContent } = txt;
      isometricNoteText.addText2({ cssText, textContent });
    });
  }

  setStampslogo(stampslogo) {
    if (!stampslogo) return;

    stampslogo.forEach((stamp) => {
      const { cssText, url } = stamp;
      isometricStampLogo.addStamp2({ cssText, url });
    });
  }

  setSheet(sheet) {
    if (sheet.format !== undefined) {
      const table1 = [];
      const table2 = [];

      if (!sheet.table1) sheet.table1 = [];
      if (!sheet.table2) sheet.table2 = [];

      for (let i = 0; i < sheet.table1.length; i++) {
        const { id, txt } = sheet.table1[i];
        table1.push({ id, txt });
      }

      for (let i = 0; i < sheet.table2.length; i++) {
        const { id, txt } = sheet.table2[i];
        table2.push({ id, txt });
      }

      isometricSheets.showHideSheet(sheet.format, table1, table2);
    }
  }
}
