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

  writeBd({ svg, lastAdd = false, checkNewSvg = true }) {
    let type = null;
    let pos = null;

    this.offsetIndBd();

    if (svg['userData']) {
      type = isometricSvgElem.getSvgType(svg);

      if (checkNewSvg) this.checkAddNewSvg({ svg });

      if (svg['userData'].lineI) {
        if (type === 'circle') {
          pos = isometricSvgElem.getPosCircle(svg);
        }
        if (type === 'line') {
          pos = isometricSvgElem.getPosLine2(svg);
        }
      } else if (isometricSvgListObjs.isObjBySvg(svg)) {
        if (type === 'circle') {
          pos = isometricSvgElem.getPosCircle(svg);
        }
      }
    }

    if (type && pos) {
      if (lastAdd) {
        //this.ind++;
        this.bd[this.ind + 1] = { ind: this.ind + 1, svg, type, pos, lastAdd: true };
      } else {
        this.lastKeyCode = '';
        this.ind++;
        this.bd[this.ind] = { ind: this.ind, svg, type, pos };
      }

      console.log(this.bd);
    }
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
    if (bd.svg === svg) return;

    this.writeBd({ svg: bd.svg, checkNewSvg: false });
  }

  getCurrentItemBd() {
    return this.ind > -1 ? this.bd[this.ind] : null;
  }

  getItemBd({ number }) {
    let bd = null;
    bd = this.getCurrentItemBd();

    const ind = this.ind + number;
    let bd2 = null;
    if (ind > 0 && ind < this.bd.length) bd2 = this.bd[ind];

    if (bd && bd2) {
      if (bd.svg !== bd2.svg) {
        number > 0 ? this.ind-- : this.ind++;
        bd = this.getCurrentItemBd();
      }
    }

    return bd;
  }

  // уменьшить индекс
  decreaseIndex() {
    this.lastKeyCode = 'Z';
    this.ind--;
    if (this.ind < -1) this.ind = -1;
  }

  // увеличить индекс
  increaseIndex() {
    this.lastKeyCode = 'Y';
    this.ind++;
    if (this.ind > this.bd.length - 1) this.ind = this.bd.length - 1;
  }

  checkIndex({ keyCode }) {
    if (this.lastKeyCode === keyCode) return;

    if (keyCode === 'Z' && this.lastKeyCode === 'Y') this.ind--;
    if (keyCode === 'Y' && this.lastKeyCode === 'Z') this.ind++;
  }

  addLastItemBd() {
    if (this.ind !== this.bd.length - 1) return;

    const bd = this.getCurrentItemBd();
    if (bd && !bd.lastAdd) this.writeBd({ svg: bd.svg, lastAdd: true });
  }
}
