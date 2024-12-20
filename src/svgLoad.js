import * as THREE from 'three';

import {
  isometricSvgElem,
  isometricSvgLine,
  isometricSvgObjs,
  isometricSvgListObjs,
  isometricNoteSvg,
  isometricNoteSvg2,
  isometricSvgRuler,
  isometricSvgBasicElements,
  isometricSvgFreeForm,
  isometricNoteText,
  isometricStampLogo,
  isometricSheets,
  isometricSvgPathConvert,
  isometricPdfToSvg,
} from './index';

export class IsometricSvgLoad {
  container;
  containerSvg;
  viewBox = new THREE.Vector2(1, 1);
  viewSize = new THREE.Vector2(1, 1);

  init({ container, containerSvg }) {
    this.container = container;
    this.containerSvg = containerSvg;
  }

  load(url = 'img/isometry.json') {
    const p = this.xhrPromise_1({ url });

    p.then((data) => {
      this.setIsometry(data);

      //isometricSvgPathConvert.init();
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
    this.clearIsometric();

    const bound = data.bound;
    const lines = data.lines;
    const points = data.points;
    const objs = data.objs;
    const notes = data.notes;
    const rulers = data.rulers;
    const objsBasic = data.objsBasic;
    const scheme = data.scheme;
    const texts = data.texts;
    const stampslogo = data.stampslogo;
    const sheet = data.sheet;
    const substratePdf = data.substratePdf;

    const svgXmlns = isometricSvgElem.getSvgXmlns({ container: this.containerSvg });
    const groupLines = isometricSvgElem.getSvgGroup({ container: this.containerSvg, tag: 'lines' });

    if (bound) {
      let size = isometricSvgElem.getSizeViewBox({ container: this.containerSvg });
      this.viewSize.x = size.x / bound.w;
      this.viewSize.y = size.y / bound.h;

      const viewBox = '0 0 ' + bound.w + ' ' + bound.h;
      svgXmlns.setAttribute('viewBox', viewBox);

      // let viewBoxString = 'viewBox="0 0 1747 1232.9833984375"';
      // let numbers = viewBoxString.match(/[\d.-]+/g).map(Number);
      // console.log();

      size = isometricSvgElem.getSizeViewBox({ container: this.containerSvg });

      this.viewBox.x = size.x / bound.w;
      this.viewBox.y = size.y / bound.h;
    }

    const arrSvgLines = [];
    const arrSvgPoints = [];

    lines.forEach((line) => {
      let { x: x1, y: y1 } = line.pos[0];
      let { x: x2, y: y2 } = line.pos[1];
      x1 *= this.viewBox.x;
      y1 *= this.viewBox.y;
      x2 *= this.viewBox.x;
      y2 *= this.viewBox.y;

      const params = { x1, y1, x2, y2 };
      if (line.strokeWidth) params['strokeWidth'] = line.strokeWidth;
      if (line.dasharray) params['dasharray'] = line.dasharray;

      const svg = isometricSvgElem.createSvgLine(params);

      svg['userData'] = { lineI: true, tag: 'line', lock: false, p1: null, p2: null };
      svg['userData'].pd1 = null;
      svg['userData'].pd2 = null;
      svg['userData'].ld1 = null;
      svg['userData'].ld2 = null;
      svg['userData'].links = [];
      svg['userData'].segments = [];
      svg['userData'].attributes = line.attributes ? line.attributes : { guid: 0 };

      groupLines.append(svg);

      arrSvgLines.push(svg);
    });

    points.forEach((point) => {
      let { x, y } = point.pos;
      x *= this.viewBox.x;
      y *= this.viewBox.y;
      const ids = point.ids ? point.ids : [];

      const svg = isometricSvgElem.createSvgCircle({ x, y });

      svg['userData'] = { lineI: true, tag: 'point', lock: false, lines: [] };
      svg['userData'].crossOffset = false;
      svg['userData'].move = false;
      svg['userData'].pds = [];
      svg['userData'].ids = ids;
      svg['userData'].attributes = point.attributes ? point.attributes : { guid: 0 };
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
    if (objsBasic) this.setObjsBasic(objsBasic);
    if (scheme) this.setScheme(scheme);
    if (notes) this.setNotes(notes);
    if (texts) this.setText(texts);
    if (stampslogo) this.setStampslogo(stampslogo);
    if (sheet) this.setSheet(sheet);
    if (substratePdf) this.setSubstratePdf(substratePdf);
  }

  setObjs(objs) {
    objs.forEach((obj) => {
      const attributes = obj.attributes ? obj.attributes : undefined;

      if (obj.tag === 'objBracket') {
        const pos = obj.pos;
        pos.x *= this.viewBox.x;
        pos.y *= this.viewBox.y;
        const { svg3 } = isometricSvgListObjs.createObjBracket({ x: pos.x, y: pos.y, attributes });
        isometricSvgObjs.addLink({ svgPoint: svg3, event: null, pos: new THREE.Vector2(pos.x, pos.y) });
        isometricSvgObjs.setRotObj({ svg: svg3 });
      }

      if (obj.tag === 'objValve') {
        const pos = obj.pos;
        pos.x *= this.viewBox.x;
        pos.y *= this.viewBox.y;
        const scale = obj.scale ? obj.scale : 1;
        const { svg3 } = isometricSvgListObjs.createObjValve({ x: pos.x, y: pos.y, scale, attributes });
        isometricSvgObjs.addLink({ svgPoint: svg3, event: null, pos: new THREE.Vector2(pos.x, pos.y) });
        isometricSvgObjs.setRotObj({ svg: svg3 });
      }

      if (obj.tag === 'objTee') {
        const pos = obj.pos;
        pos.x *= this.viewBox.x;
        pos.y *= this.viewBox.y;
        const scale = obj.scale ? obj.scale : 1;
        const { svg3 } = isometricSvgListObjs.createObjTee({ x: pos.x, y: pos.y, scale, attributes });
        isometricSvgObjs.addLink({ svgPoint: svg3, event: null, pos: new THREE.Vector2(pos.x, pos.y) });
        isometricSvgObjs.setRotObj({ svg: svg3 });
      }

      if (obj.tag === 'objFlap') {
        const pos = obj.pos;
        pos.x *= this.viewBox.x;
        pos.y *= this.viewBox.y;
        const scale = obj.scale ? obj.scale : 1;
        const { svg3 } = isometricSvgListObjs.createObjFlap({ x: pos.x, y: pos.y, scale, attributes });
        isometricSvgObjs.addLink({ svgPoint: svg3, event: null, pos: new THREE.Vector2(pos.x, pos.y) });
        isometricSvgObjs.setRotObj({ svg: svg3 });
      }

      if (obj.tag === 'objAdapter') {
        const pos = obj.pos;
        pos.x *= this.viewBox.x;
        pos.y *= this.viewBox.y;
        const scale = obj.scale ? obj.scale : 1;
        const { svg2 } = isometricSvgListObjs.createObjAdapter({ x: pos.x, y: pos.y, scale, attributes });
        isometricSvgObjs.addLink({ svgPoint: svg2, event: null, pos: new THREE.Vector2(pos.x, pos.y) });
        isometricSvgObjs.setRotObj({ svg: svg2 });
      }

      if (obj.tag === 'objBox') {
        const pos = obj.pos;
        pos.x *= this.viewBox.x;
        pos.y *= this.viewBox.y;
        const scale = obj.scale ? obj.scale : 1;
        const { svg2 } = isometricSvgListObjs.createObjBox({ x: pos.x, y: pos.y, scale, attributes });
        isometricSvgObjs.addLink({ svgPoint: svg2, event: null, pos: new THREE.Vector2(pos.x, pos.y) });
        isometricSvgObjs.setRotObj({ svg: svg2 });
      }

      if (obj.tag === 'objSplitter') {
        const pos = obj.pos;
        pos.x *= this.viewBox.x;
        pos.y *= this.viewBox.y;
        const { svg2 } = isometricSvgListObjs.createObjSplitter({ x: pos.x, y: pos.y, attributes });
        isometricSvgObjs.addLink({ svgPoint: svg2, event: null, pos: new THREE.Vector2(pos.x, pos.y) });
        isometricSvgObjs.setRotObj({ svg: svg2 });
      }

      if (obj.tag === 'objUndefined') {
        const pos = obj.pos;
        pos.x *= this.viewBox.x;
        pos.y *= this.viewBox.y;
        isometricSvgListObjs.createObjUndefined({ pos, attributes });
      }
    });
  }

  setObjsBasic(objs) {
    objs.forEach((obj) => {
      const params = obj.params ? obj.params : null;

      obj.pos.forEach((pos) => {
        pos.x *= this.viewBox.x;
        pos.y *= this.viewBox.y;
      });
      if (params && params.rx && params.ry) {
        params.rx *= this.viewBox.x;
        params.ry *= this.viewBox.y;
      }

      isometricSvgBasicElements.addShape({ type: obj.tag, pos: obj.pos, params });
    });
  }

  setScheme(scheme) {
    if (scheme.length === 123123) {
      isometricSvgFreeForm.crScheme({ elem: scheme[0] });
    } else {
      scheme.forEach((itemGroup) => {
        let attributes = itemGroup.attributes ? itemGroup.attributes : undefined;

        if (!attributes) {
          attributes = { guid: itemGroup.guid };
        }
        const group = isometricSvgFreeForm.createGroup({ attributes });

        itemGroup.elems.forEach((elem) => {
          if (elem.type === 'line') {
            elem.pos.forEach((pos) => {
              pos.x *= this.viewBox.x;
              pos.y *= this.viewBox.y;
            });

            isometricSvgFreeForm.createLine({ pos: elem.pos, group });
          }
          if (elem.type === 'polygon') {
            const pairs = elem.points.split(' ');
            let arr = pairs.map((pair) => pair.split(',').map(Number));
            if (arr.length > 0 && arr[0].length === 1) {
              arr.shift();
            }

            arr.forEach((pos) => {
              pos[0] *= this.viewBox.x;
              pos[1] *= this.viewBox.y;
            });

            const strPoints = arr.map((item) => item.join(',')).join(' ');

            const data = { pos: elem.pos ? elem.pos : new THREE.Vector2(), points: strPoints };
            isometricSvgFreeForm.createPolygon({ data, group });
          }
        });
      });
    }
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

        note.line.pos[0].x *= this.viewBox.x;
        note.line.pos[0].y *= this.viewBox.y;
        note.line.pos[1].x *= this.viewBox.x;
        note.line.pos[1].y *= this.viewBox.y;
        note.point.pos.x *= this.viewBox.x;
        note.point.pos.y *= this.viewBox.y;
        circle.pos.x *= this.viewBox.x;
        circle.pos.y *= this.viewBox.y;
        line.pos[0].x *= this.viewBox.x;
        line.pos[0].y *= this.viewBox.y;
        line.pos[1].x *= this.viewBox.x;
        line.pos[1].y *= this.viewBox.y;

        isometricSvgElem.setPosLine1(obj.line, note.line.pos[0].x, note.line.pos[0].y, note.line.pos[1].x, note.line.pos[1].y);
        isometricSvgElem.setPosCircle(obj.point, note.point.pos.x, note.point.pos.y);
        isometricSvgElem.setPosCircle(obj.labelEls.svgCircle, circle.pos.x, circle.pos.y);
        isometricSvgElem.setPosLine1(obj.labelEls.svgLine, line.pos[0].x, line.pos[0].y, line.pos[1].x, line.pos[1].y);

        if (obj.labelEls.svgText1 && txt1.pos) {
          txt1.pos.x *= this.viewBox.x;
          txt1.pos.y *= this.viewBox.y;
          isometricSvgElem.setPosText1(obj.labelEls.svgText1, txt1.pos.x, txt1.pos.y);
        }
        if (obj.labelEls.svgText2 && txt2.pos) {
          txt2.pos.x *= this.viewBox.x;
          txt2.pos.y *= this.viewBox.y;
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

        note.line.pos[0].x *= this.viewBox.x;
        note.line.pos[0].y *= this.viewBox.y;
        note.line.pos[1].x *= this.viewBox.x;
        note.line.pos[1].y *= this.viewBox.y;
        note.point.pos.x *= this.viewBox.x;
        note.point.pos.y *= this.viewBox.y;
        line.pos[0].x *= this.viewBox.x;
        line.pos[0].y *= this.viewBox.y;
        line.pos[1].x *= this.viewBox.x;
        line.pos[1].y *= this.viewBox.y;

        isometricSvgElem.setPosLine1(obj.line, note.line.pos[0].x, note.line.pos[0].y, note.line.pos[1].x, note.line.pos[1].y);
        isometricSvgElem.setPosCircle(obj.point, note.point.pos.x, note.point.pos.y);
        isometricSvgElem.setPosLine1(obj.labelEls.svgLine, line.pos[0].x, line.pos[0].y, line.pos[1].x, line.pos[1].y);

        if (obj.labelEls.svgText1 && txt1.pos) {
          txt1.pos.x *= this.viewBox.x;
          txt1.pos.y *= this.viewBox.y;
          isometricSvgElem.setPosText1(obj.labelEls.svgText1, txt1.pos.x, txt1.pos.y);
        }
        if (obj.labelEls.svgText2 && txt2.pos) {
          txt2.pos.x *= this.viewBox.x;
          txt2.pos.y *= this.viewBox.y;
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

      ruler.line[0].x *= this.viewBox.x;
      ruler.line[0].y *= this.viewBox.y;
      ruler.line[1].x *= this.viewBox.x;
      ruler.line[1].y *= this.viewBox.y;
      ruler.p1.x *= this.viewBox.x;
      ruler.p1.y *= this.viewBox.y;
      ruler.p2.x *= this.viewBox.x;
      ruler.p2.y *= this.viewBox.y;
      ruler.p1line[0].x *= this.viewBox.x;
      ruler.p1line[0].y *= this.viewBox.y;
      ruler.p1line[1].x *= this.viewBox.x;
      ruler.p1line[1].y *= this.viewBox.y;
      ruler.p2line[0].x *= this.viewBox.x;
      ruler.p2line[0].y *= this.viewBox.y;
      ruler.p2line[1].x *= this.viewBox.x;
      ruler.p2line[1].y *= this.viewBox.y;

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
      let { cssText, textContent } = txt;

      const match1 = cssText.match(/top:\s*(-?\d+(\.\d+)?)px/);
      const match2 = cssText.match(/left:\s*(-?\d+(\.\d+)?)px/);
      const match3 = cssText.match(/ width:\s*(-?\d+(\.\d+)?)px/);
      const match4 = cssText.match(/ height:\s*(-?\d+(\.\d+)?)px/);
      const match5 = cssText.match(/font-size:\s*(-?\d+(\.\d+)?)px/);

      if (match1) {
        let value = parseFloat(match1[1]);
        value *= this.viewSize.y;
        cssText = cssText.replace(/top:\s*(-?\d+(\.\d+)?)px;/, 'top: ' + value + 'px;');
      }
      if (match2) {
        let value = parseFloat(match2[1]);
        value *= this.viewSize.x;
        cssText = cssText.replace(/left:\s*(-?\d+(\.\d+)?)px;/, 'left: ' + value + 'px;');
      }
      if (match3) {
        let value = parseFloat(match3[1]);
        value *= this.viewSize.x;
        cssText = cssText.replace(/ width:\s*(-?\d+(\.\d+)?)px;/, ' width: ' + value + 'px;');
      }
      if (match4) {
        let value = parseFloat(match4[1]);
        value *= this.viewSize.y;
        cssText = cssText.replace(/ height:\s*(-?\d+(\.\d+)?)px;/, ' height: ' + value + 'px;');
      }
      if (match5) {
        let value = parseFloat(match5[1]);
        value *= this.viewSize.y;
        cssText = cssText.replace(/font-size:\s*(-?\d+(\.\d+)?)px;/, 'font-size: ' + value + 'px;');
      }

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

  setSubstratePdf(substratePdf) {
    const context = isometricPdfToSvg.canvasPdf.getContext('2d');
    const img = new Image();
    img.onload = () => {
      context.drawImage(img, 0, 0);
    };
    img.src = substratePdf;
  }

  clearIsometric() {
    const groupLines = isometricSvgElem.getSvgGroup({ tag: 'lines' });
    const groupObjs = isometricSvgElem.getSvgGroup({ tag: 'objs' });
    const groupRulers = isometricSvgElem.getSvgGroup({ tag: 'rulers' });
    const groupNotes = isometricSvgElem.getSvgGroup({ tag: 'notes' });
    const groupBasicElems = isometricSvgElem.getSvgGroup({ tag: 'basicElems' });
    const groupSheetText = isometricSvgElem.getSvgGroup({ tag: 'sheetText' });

    const stampsLogo = this.containerSvg.querySelector('[nameId="stampsLogo"]');
    const containerTexts = this.containerSvg.querySelector('[nameId="notesText"]');

    const groups = [groupLines, groupObjs, groupRulers, groupNotes, groupBasicElems, groupSheetText, stampsLogo, containerTexts];

    groups.forEach((group) => {
      for (let i = group.childNodes.length - 1; i >= 0; i--) {
        const child = group.childNodes[i];
        child.remove();
      }
    });
  }
}
