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

export class IsometricSvgUndoRedo {
  bd = [];
  ind = -1;
  lastKeyCode = '';

  writeBd({ svg, event = 'move', lastAdd = false, checkNewSvg = true }) {
    const data = this.getStructureData(svg);
    if (!data) return;

    this.offsetIndBd();

    if (checkNewSvg && !lastAdd) this.checkAddNewSvg({ svg: data.params.svg });

    if (lastAdd) {
      this.bd[this.ind + 1] = { ind: this.ind + 1, event, ...data, lastAdd: true };
    } else {
      this.lastKeyCode = '';
      this.ind++;
      this.bd[this.ind] = { ind: this.ind, event, ...data };
    }

    console.log(lastAdd, this.ind, this.bd);
  }

  // очистака бд до текущего индекса (когда мы откатились ctrlZ, а спереди есть ctrlY)
  offsetIndBd() {
    if (this.ind < this.bd.length - 1) {
      const upBd = [];
      for (let i = 0; i < this.ind; i++) {
        const item = this.bd[i];
        item.ind = i;
        upBd.push(item);
      }
      this.bd = upBd;
      console.log(222, this.ind, [...this.bd]);
      this.ind--;
      if (this.ind < 0) this.ind = 0;
    }
  }

  // если новый svg не равен последенему svg из bd, то заносим текущее состояние последнего svg в bd
  checkAddNewSvg({ svg }) {
    const bd = this.getCurrentItemBd();
    if (!bd) return;
    if (bd.params.svg === svg) return;
    if (bd.event !== 'move') return;

    this.writeBd({ svg: bd.params.svg, checkNewSvg: false });
  }

  getCurrentItemBd() {
    let itemBd = null;
    if (this.ind > -1 && this.ind < this.bd.length) itemBd = this.bd[this.ind];

    return itemBd;
  }

  getItemBd({ number }) {
    let itemBd = this.getCurrentItemBd();

    let itemBd2 = null;
    const ind = this.ind + number;
    if (itemBd && ind > -1 && ind < this.bd.length) itemBd2 = this.bd[ind];

    if (itemBd && itemBd2) {
      if (itemBd.params.svg !== itemBd2.params.svg) {
        number > 0 ? this.ind-- : this.ind++;
        itemBd = this.getCurrentItemBd();
      }
    }

    return itemBd;
  }

  // уменьшить индекс
  decreaseIndex() {
    this.ind--;
    if (this.ind < -1) this.ind = -1;
  }

  // увеличить индекс
  increaseIndex() {
    this.ind++;
    if (this.ind > this.bd.length - 1) this.ind = this.bd.length;
  }

  checkIndex({ keyCode }) {
    if (this.lastKeyCode === keyCode) return;

    if (keyCode === 'Z' && this.lastKeyCode === 'Y') this.ind--;
    if (keyCode === 'Y' && this.lastKeyCode === 'Z') this.ind++;

    this.lastKeyCode = keyCode;
  }

  addLastItemBd() {
    if (this.ind !== this.bd.length - 1) return;

    const bd = this.getCurrentItemBd();
    if (bd && !bd.lastAdd && bd.event === 'move') {
      this.writeBd({ svg: bd.params.svg, lastAdd: true });
    }
  }

  getStructureData(svg) {
    let data = null;

    if (svg['userData'].jointI) {
    }

    if (svg['userData'].lineI) {
      const typeData = 'line';
      if (svg['userData'].tag === 'line') {
        const pos = isometricSvgElem.getPosLine2(svg);

        const params = { svg, tag: svg['userData'].tag, pos };
        data = { typeData, params };
      }
      if (svg['userData'].tag === 'point') {
        const pos = isometricSvgElem.getPosCircle(svg);

        const params = { svg, tag: svg['userData'].tag, pos };
        data = { typeData, params };
      }
    }

    if (svg['userData'].pointScale) {
    }

    if (isometricSvgListObjs.isObjBySvg(svg)) {
      const typeData = 'obj';

      const elems = isometricSvgListObjs.getStructureObj(svg);
      svg = elems.point;

      const pos = isometricSvgElem.getPosCircle(svg);

      const params = { svg, pos };
      data = { typeData, params };
    }

    if (svg['userData'].note1) {
      const typeData = 'note';

      const obj = this.getStructureNote(svg);

      svg = obj.line;

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

      const params = { svg, tag: 'note1', line: { pos: pos1 }, point: { pos: pos2 }, label, passportId, lock };
      data = { typeData, params };
    }

    if (svg['userData'].note2) {
      const typeData = 'note';

      const obj = this.getStructureNote(svg);

      svg = obj.line;

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

      const params = { svg, tag: 'note2', line: { pos: pos1 }, point: { pos: pos2 }, label, passportId, lock };
      data = { typeData, params };
    }

    if (svg['userData'].ruler) {
      const typeData = 'ruler';

      const obj = this.getStructureRuler(svg);
      svg = obj.line;
      const pos1 = isometricSvgElem.getPosLine2(obj.line);
      const pos2 = isometricSvgElem.getPosPolygon(obj.p1);
      const pos3 = isometricSvgElem.getPosPolygon(obj.p2);
      const pos4 = isometricSvgElem.getPosLine2(obj.p1line);
      const pos5 = isometricSvgElem.getPosLine2(obj.p2line);
      const txt = obj.divText.textContent;

      const params = { svg, line: pos1, p1: pos2, p2: pos3, p1line: pos4, p2line: pos5, divText: { txt } };
      data = { typeData, params };
    }

    if (svg['userData'].objBasic) {
      const typeData = 'objBasic';
      const params = { svg, tag: '', pos: [] };
      const tagObj = svg['userData'].tagObj;

      if (tagObj === 'arrow') {
        params.tag = 'shapeArrow';
        const pos = isometricSvgElem.getPosLine2(svg);
        params.pos.push(...pos);
      }

      if (tagObj === 'ellipse') {
        params.tag = 'shapeEllipse';
        const pos = isometricSvgElem.getPosCircle(svg);
        params.pos.push(pos);
        params['params'] = { rx: svg.getAttribute('rx'), ry: svg.getAttribute('ry') };
      }

      if (tagObj === 'rectangle' || tagObj === 'triangle') {
        params.tag = tagObj === 'rectangle' ? 'shapeRectangle' : 'shapeTriangle';
        const elems = svg['userData'].elems;

        for (let i = 0; i < elems.length; i++) {
          const line = elems[i];
          const pos = isometricSvgElem.getPosLine2(line)[0];
          params.pos.push(pos);
        }
      }

      data = { typeData, params };
    }

    return data;
  }

  getStructureNote(svg) {
    const label = svg['userData'].label;
    const labelEls = {
      svgCircle: label['userData'].svgCircle ? label['userData'].svgCircle : null,
      svgLine: label['userData'].svgLine,
      svgText1: label['userData'].svgText1,
      svgText2: label['userData'].svgText2,
    };

    return {
      line: svg['userData'].line,
      point: svg['userData'].point,
      label,
      labelEls,
    };
  }

  getStructureRuler(svg) {
    if (svg['userData'].tag === 'line') {
    }
    if (svg['userData'].tag === 'dpoint') {
      svg = svg['userData'].line;
    }

    const line = svg['userData'].line;
    const p1 = svg['userData'].p1;
    const p2 = svg['userData'].p2;
    const p1line = p1['userData'].line2;
    const p2line = p2['userData'].line2;
    const pd1 = p1line['userData'].p;
    const pd2 = p2line['userData'].p;

    return {
      line,
      p1,
      p2,
      p1line,
      p2line,
      pd1,
      pd2,
      divText: svg['userData'].p2['userData'].divText,
    };
  }
}
