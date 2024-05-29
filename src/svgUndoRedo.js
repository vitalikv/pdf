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

  writeBd({ svg, lastAdd = false }) {
    let type = null;
    let pos = null;

    if (svg['userData']) {
      if (svg['userData'].lineI) {
        type = isometricSvgElem.getSvgType(svg);

        if (type === 'circle') {
          pos = isometricSvgElem.getPosCircle(svg);
        }
      }
    }

    if (type && pos) {
      if (lastAdd) {
        this.bd[this.ind + 1] = { ind: this.ind, svg, type, pos, lastAdd: true };
      } else {
        this.lastKeyCode = '';
        this.ind++;
        this.bd[this.ind] = { ind: this.ind, svg, type, pos };
      }

      console.log(this.bd);
    }
  }

  getCurrentItemBd() {
    console.log(this.lastKeyCode, this.ind);
    return this.ind > -1 ? this.bd[this.ind] : null;
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

    if (keyCode === 'Z') this.ind--;
    if (keyCode === 'Y') this.ind++;
  }

  addLastItemBd() {
    if (this.ind !== this.bd.length - 1) return;

    const bd = this.getCurrentItemBd();
    if (!bd.lastAdd) this.writeBd({ svg: bd.svg, lastAdd: true });
  }
}
