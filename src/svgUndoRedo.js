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

  writeBd({ svg, addIndex = true }) {
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
      if (addIndex) {
        this.ind++;
        this.bd[this.ind] = { ind: this.ind, svg, type, pos };
      } else {
        this.bd[this.ind + 1] = { ind: this.ind, svg, type, pos };
      }

      console.log(this.bd);
    }
  }

  getCurrentItemBd() {
    console.log(this.ind);
    return this.bd[this.ind];
  }

  // уменьшить индекс
  decreaseIndex() {
    this.ind--;
    if (this.ind < -1) this.ind = -1;
  }

  // увеличить индекс
  increaseIndex() {
    this.ind++;
    if (this.ind > this.bd.length - 1) this.ind = this.bd.length - 1;
  }

  addLastItemBd() {
    if (this.ind !== this.bd.length - 1) return;

    const bd = this.getCurrentItemBd();
    this.writeBd({ svg: bd.svg, addIndex: false });
  }
}
