import {
  isometricPdfToSvg,
  isometricExportPdf,
  isometricSvgManager,
  isometricSheets,
  isometricNoteSvg,
  isometricNoteSvg2,
  isometricSvgRuler,
  isometricNoteText,
  isometricCanvasPaint,
  isometricCutBox,
  isometricStampLogo,
  isometricSvgSave,
  isometricSvgLoad,
} from './index';

export class PanelUI {
  container$;
  elemBtnView;
  input;
  btns$ = [];

  init() {
    this.crPanel();

    this.btns$[0] = this.crBtn({ txt: 'pdf' });
    this.btns$[1] = this.crBtn({ txt: '-90' });
    this.btns$[2] = this.crBtn({ txt: '90' });
    this.btns$[3] = this.crBtn({ txt: 'Получить pdf' });
    this.btns$[4] = this.crBtn({ txt: 'Выноска 1' });
    this.btns$[5] = this.crBtn({ txt: 'Выноска 2' });
    this.btns$[6] = this.crBtn({ txt: 'Размер' });
    this.btns$[7] = this.crBtn({ txt: 'Ластик' });
    //this.btns$[8] = this.crList();
    this.btns$[8] = this.crInputSlider();
    this.btns$[9] = this.crBtn({ txt: 'Обрезать' });
    this.btns$[10] = this.crBtn({ txt: 'Штамп' });
    this.btns$[11] = this.crBtn({ txt: 'Линия' });
    this.btns$[12] = this.crBtn({ txt: 'Опора' });
    this.btns$[13] = this.crBtn({ txt: 'Текст' });
    this.btns$[14] = this.crBtn({ txt: 'Сохранить' });
    this.btns$[15] = this.crBtn({ txt: 'Загрузить' });
    this.btns$[16] = this.crListSheets();

    this.initEvent();
  }

  initEvent() {
    this.container$.onmousedown = (e) => {
      //e.preventDefault();
      e.stopPropagation();
    };

    let ind = 0;

    this.btns$[ind].onmousedown = () => {
      isometricPdfToSvg.inputFile.click();
    };
    ind++;

    this.btns$[ind].onmousedown = () => {
      isometricPdfToSvg.rotateSvg({ degree: -90 });
    };
    ind++;

    this.btns$[ind].onmousedown = () => {
      isometricPdfToSvg.rotateSvg({ degree: 90 });
    };
    ind++;

    this.btns$[ind].onmousedown = () => {
      isometricExportPdf.export();
    };
    ind++;

    this.btns$[ind].onmousedown = () => {
      isometricSvgManager.setMode({ type: 'addNote1', data: { text: ['1', 'ТК1-СПС'], passport: { id: 232 } } });
    };
    ind++;

    this.btns$[ind].onmousedown = () => {
      isometricSvgManager.setMode({ type: 'addNote2', data: { text: ['2', 'ТК1-СПС31.1/1-И-1-012'], passport: { id: 44 } } });
    };
    ind++;

    this.btns$[ind].onmousedown = (e) => {
      // console.log(isometricSvgManager.mode.type);
      // if (isometricSvgManager.mode.type === 'addRuler') {
      //   isometricSvgManager.cleareMode();
      // } else {
      //   isometricSvgManager.setMode({ type: 'addRuler' });
      // }

      isometricSvgManager.setMode({ type: 'addRuler' });

      const btn = e.target;
      const color = btn.style.background === 'rgb(255, 255, 255)' ? '#87ea89' : '#fff';
      btn.style.background = color;
      if (color === '#fff') {
        isometricSvgManager.cleareMode();
      }
    };
    ind++;

    this.btns$[ind].onmousedown = () => {
      isometricSvgManager.setMode({ type: 'brush' });
    };
    ind++;

    this.btns$[ind].children[0].oninput = (e) => {
      isometricPdfToSvg.setScale({ value: e.target.value });
    };
    ind++;

    this.btns$[ind].onmousedown = (e) => {
      isometricSvgManager.setMode({ type: 'cutBox' });
    };
    ind++;

    this.btns$[ind].onmousedown = (e) => {
      isometricStampLogo.addStamp('3');
    };
    ind++;

    this.btns$[ind].onmousedown = (e) => {
      isometricSvgManager.setMode({ type: 'line' });

      const btn = e.target;
      const color = btn.style.background === 'rgb(255, 255, 255)' ? '#87ea89' : '#fff';
      btn.style.background = color;
      if (color === '#fff') {
        isometricSvgManager.cleareMode();
      }
    };
    ind++;

    this.btns$[ind].onmousedown = (e) => {
      isometricSvgManager.setMode({ type: 'objBracket' });

      const btn = e.target;
      const color = btn.style.background === 'rgb(255, 255, 255)' ? '#87ea89' : '#fff';
      btn.style.background = color;
      if (color === '#fff') {
        isometricSvgManager.cleareMode();
      }
    };
    ind++;

    this.btns$[ind].onmousedown = (e) => {
      isometricSvgManager.setMode({ type: 'addText' });
    };
    ind++;

    this.btns$[ind].onmousedown = (e) => {
      isometricSvgSave.save();
    };
    ind++;

    this.btns$[ind].onmousedown = (e) => {
      isometricSvgLoad.load();
    };
    ind++;

    this.btns$[ind].onchange = (e) => {
      isometricSheets.showHideSheet(e.target.value);
    };
    ind++;
  }

  crPanel() {
    const css = `position: absolute; top: 0; right: 0; width: 248px; height: 1200px; background: #F0F0F0; border: 1px solid #D1D1D1; border-radius: 4px; font-family: arial,sans-serif; z-index: 4;`;

    const html = `
    <div style="${css}">
      <div nameId="btns" style="margin: 15px;"></div>
    </div>`;

    let div = document.createElement('div');
    div.innerHTML = html;
    this.container$ = div.children[0];
    document.body.append(this.container$);
  }

  crBtn({ txt }) {
    const css = `width: 100%; height: 30px; margin-top: 15px; font-size: 16px; text-align: center; color: #666; background: #fff; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; user-select: none;`;

    const html = `
    <div style="${css}">
      ${txt}
    </div>`;

    let div = document.createElement('div');
    div.innerHTML = html;
    div = div.children[0];

    this.container$.querySelector('[nameId="btns"]').append(div);

    return div;
  }

  crInputSlider() {
    const html = `<input type="range" min="20" max="300" value="100"/>`;

    let div = document.createElement('div');
    div.innerHTML = html;
    div.style.cssText = 'width: 100%; height: 30px; margin-top: 15px; font-size: 16px; text-align: center;';

    this.container$.querySelector('[nameId="btns"]').append(div);

    return div;
  }

  crList() {
    const html = `
    <select style="box-sizing: border-box; width: 100%; height: 30px; margin-top: 15px; font-size: 16px; text-align: center; color: #666; border-radius: 4px; border: 1px solid #ccc; background: #fff;">											
      <option value="25">25</option>
      <option value="50">50</option>
      <option value="100" selected="">100</option>
      <option value="150">150</option>
      <option value="200">200</option>
    </select>`;

    let div = document.createElement('div');
    div.innerHTML = html;
    div = div.children[0];

    this.container$.querySelector('[nameId="btns"]').append(div);

    return div;
  }

  crListSheets() {
    const html = `
    <select style="box-sizing: border-box; width: 100%; height: 30px; margin-top: 15px; font-size: 16px; text-align: center; color: #666; border-radius: 4px; border: 1px solid #ccc; background: #fff;">											
      <option value="a1">A1</option>
      <option value="a2">A2</option>
      <option value="a3" selected="">A3</option>
      <option value="a4">A4</option>
    </select>`;

    let div = document.createElement('div');
    div.innerHTML = html;
    div = div.children[0];

    this.container$.querySelector('[nameId="btns"]').append(div);

    return div;
  }
}
