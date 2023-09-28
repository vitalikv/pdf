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
    this.btns$[12] = this.crBtn({ txt: 'Текст' });
    this.btns$[13] = this.crBtn({ txt: 'Сохранить' });
    this.btns$[14] = this.crBtn({ txt: 'Загрузить' });
    this.btns$[15] = this.crListSheets();

    this.initEvent();
  }

  initEvent() {
    this.container$.onmousedown = (e) => {
      //e.preventDefault();
      e.stopPropagation();
    };

    this.btns$[0].onmousedown = () => {
      isometricPdfToSvg.inputFile.click();
    };

    this.btns$[1].onmousedown = () => {
      isometricPdfToSvg.rotateSvg({ degree: -90 });
    };

    this.btns$[2].onmousedown = () => {
      isometricPdfToSvg.rotateSvg({ degree: 90 });
    };

    this.btns$[3].onmousedown = () => {
      isometricExportPdf.export();
    };

    this.btns$[4].onmousedown = () => {
      isometricSvgManager.setMode({ type: 'addNote1', data: { text: ['1', 'ТК1-СПС'], passport: { id: 232 } } });
    };

    this.btns$[5].onmousedown = () => {
      isometricSvgManager.setMode({ type: 'addNote2', data: { text: ['2', 'ТК1-СПС31.1/1-И-1-012'], passport: { id: 44 } } });
    };

    this.btns$[6].onmousedown = () => {
      console.log(isometricSvgManager.mode.type);
      if (isometricSvgManager.mode.type === 'addRuler') {
        isometricSvgManager.cleareMode();
      } else {
        isometricSvgManager.setMode({ type: 'addRuler' });
      }
    };

    this.btns$[7].onmousedown = () => {
      isometricSvgManager.setMode({ type: 'brush' });
    };

    this.btns$[8].children[0].oninput = (e) => {
      isometricPdfToSvg.setScale({ value: e.target.value });
    };

    this.btns$[9].onmousedown = (e) => {
      isometricSvgManager.setMode({ type: 'cutBox' });

      // if (!isometricCutBox.activated) {
      //   isometricCutBox.activateCutBox();
      // } else {
      //   isometricCutBox.deActivateCutBox();
      // }
    };

    this.btns$[10].onmousedown = (e) => {
      isometricStampLogo.addStamp('3');
    };

    this.btns$[11].onmousedown = (e) => {
      isometricSvgManager.setMode({ type: 'line' });
    };

    this.btns$[12].onmousedown = (e) => {
      isometricSvgManager.setMode({ type: 'addText' });
    };

    this.btns$[13].onmousedown = (e) => {
      isometricSvgSave.save();
    };

    this.btns$[14].onmousedown = (e) => {
      isometricSvgLoad.load();
    };

    this.btns$[15].onchange = (e) => {
      isometricSheets.showHideSheet(e.target.value);
    };
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
