import {
  isometricPdfToSvg,
  isometricExportPdf,
  isometricSvgManager,
  isometricSheets,
  isometricSvgLine,
  isometricSvgObjs,
  isometricNoteSvg,
  isometricNoteSvg2,
  isometricSvgRuler,
  isometricNoteText,
  isometricCanvasPaint,
  isometricCutBox,
  isometricSvgListObjs,
  isometricStampLogo,
  isometricSvgSave,
  isometricSvgLoad,
  isometricSvgUploader,
  isometricSvgElementColor,
  initModel,
} from './index';

export class IsometricPanelUI {
  container$;
  elemBtnView;
  input;
  btns$ = [];
  actType = '';
  actBtn = null;

  init() {
    this.crPanel();

    this.btns$[0] = this.crBtn({ txt: 'загрузить файл' });
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
    this.btns$[11] = this.crBtn({ txt: 'Стык' });
    this.btns$[12] = this.crBtn({ txt: 'Труба' });
    this.btns$[13] = this.crBtn({ txt: 'Опора' });
    this.btns$[14] = this.crBtn({ txt: 'Вентиль' });
    this.btns$[15] = this.crBtn({ txt: 'Тройник' });
    this.btns$[16] = this.crBtn({ txt: 'Клапан' });
    this.btns$[17] = this.crBtn({ txt: 'Переходник' });
    this.btns$[18] = this.crBtn({ txt: 'РО' });
    this.btns$[19] = this.crBtn({ txt: 'Разделитель' });
    this.btns$[20] = this.crBtn({ txt: 'Текст' });

    this.btns$[21] = this.crBtn({ txt: 'Линия' });
    this.btns$[22] = this.crBtn({ txt: 'Стрелка' });
    this.btns$[23] = this.crBtn({ txt: 'Прямоугольник' });
    this.btns$[24] = this.crBtn({ txt: 'Круг' });
    this.btns$[25] = this.crBtn({ txt: 'Треугольник' });

    this.btns$[26] = this.crBtn({ txt: 'Цвет' });

    this.btns$[27] = this.crBtn({ txt: 'Сохранить' });
    this.btns$[28] = this.crBtn({ txt: 'Загрузить' });
    this.btns$[29] = this.crListSheets();
    this.btns$[30] = this.crBtn({ txt: 'из 3D в 2D' });
    this.btns$[31] = this.crBtn({ txt: 'json svg' });

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

    this.btns$[6].onmousedown = (e) => {
      isometricSvgManager.setMode({ type: 'addRuler' });

      const btn = e.target;
      const color = btn.style.background === 'rgb(255, 255, 255)' ? '#87ea89' : '#fff';
      btn.style.background = color;
      if (color === '#fff') {
        isometricSvgManager.cleareMode();
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
    };

    this.btns$[10].onmousedown = (e) => {
      isometricStampLogo.addStamp('3');
    };

    this.btns$[11].onmousedown = (e) => {
      this.activateType({ type: 'joint', e });
    };

    this.btns$[12].onmousedown = (e) => {
      this.activateType({ type: 'line', e });
    };

    this.btns$[13].onmousedown = (e) => {
      this.activateType({ type: 'objBracket', e });
    };

    this.btns$[14].onmousedown = (e) => {
      this.activateType({ type: 'objValve', e });
      //isometricSvgListObjs.createSvgObj({ data: null });
    };

    this.btns$[15].onmousedown = (e) => {
      this.activateType({ type: 'objTee', e });
    };

    this.btns$[16].onmousedown = (e) => {
      this.activateType({ type: 'objFlap', e });
    };

    this.btns$[17].onmousedown = (e) => {
      this.activateType({ type: 'objAdapter', e });
    };

    this.btns$[18].onmousedown = (e) => {
      this.activateType({ type: 'objBox', e });
    };

    this.btns$[19].onmousedown = (e) => {
      this.activateType({ type: 'objSplitter', e });
    };

    this.btns$[20].onmousedown = (e) => {
      this.activateType({ type: 'addText', e });
    };

    this.btns$[21].onmousedown = (e) => {
      this.activateType({ type: 'shapeLine', e });
    };

    this.btns$[22].onmousedown = (e) => {
      this.activateType({ type: 'shapeArrow', e });
    };

    this.btns$[23].onmousedown = (e) => {
      this.activateType({ type: 'shapeRectangle', e });
    };

    this.btns$[24].onmousedown = (e) => {
      this.activateType({ type: 'shapeEllipse', e });
    };

    this.btns$[25].onmousedown = (e) => {
      this.activateType({ type: 'shapeTriangle', e });
    };

    this.btns$[26].onmousedown = (e) => {
      isometricSvgElementColor.setColor({ color: '#0000ff' });
    };

    this.btns$[27].onmousedown = (e) => {
      isometricSvgSave.save();
    };

    this.btns$[28].onmousedown = (e) => {
      isometricSvgLoad.load();
    };

    this.btns$[29].onchange = (e) => {
      isometricSheets.showHideSheet(e.target.value, undefined, undefined, true);
    };

    this.btns$[30].onmousedown = (e) => {
      initModel();
    };

    this.btns$[31].onmousedown = (e) => {
      this.activateType({ type: 'shapeJson', e });
    };
  }

  crPanel() {
    const css = `position: absolute; top: 0; right: 0; bottom: 0; width: 248px; background: #F0F0F0; border: 1px solid #D1D1D1; border-radius: 4px; font-family: arial,sans-serif; z-index: 4;`;

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
    const css = `width: 100%; height: 20px; margin-top: 10px; font-size: 14px; text-align: center; color: #666; background: #fff; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; user-select: none;`;

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

  upColorBtn({ btn, act }) {
    const color = act ? '#87ea89' : '#fff';
    btn.style.background = color;

    this.actBtn = act ? btn : null;
  }

  activateType({ type, e }) {
    const btn = e.target;
    let act = true;

    if (this.actType === type) act = false;

    if (type === 'joint') isometricSvgManager.setMode({ type });
    else if (type === 'line') isometricSvgManager.setMode({ type });
    else if (type === 'objBracket') isometricSvgManager.setMode({ type });
    else if (type === 'objValve') isometricSvgManager.setMode({ type });
    else if (type === 'objTee') isometricSvgManager.setMode({ type });
    else if (type === 'objFlap') isometricSvgManager.setMode({ type });
    else if (type === 'objAdapter') isometricSvgManager.setMode({ type });
    else if (type === 'objBox') isometricSvgManager.setMode({ type });
    else if (type === 'objSplitter') isometricSvgManager.setMode({ type });
    else if (type === 'addText') isometricSvgManager.setMode({ type });
    else if (type === 'shapeLine') isometricSvgManager.setMode({ type });
    else if (type === 'shapeArrow') isometricSvgManager.setMode({ type });
    else if (type === 'shapeRectangle') isometricSvgManager.setMode({ type });
    else if (type === 'shapeEllipse') isometricSvgManager.setMode({ type });
    else if (type === 'shapeTriangle') isometricSvgManager.setMode({ type });
    else if (type === 'shapeJson') isometricSvgManager.setMode({ type });
    else act = false;

    this.actType = act ? type : '';

    this.upColorBtn({ btn, act });
  }

  deActivateType() {
    if (!this.actBtn) return;

    this.actType = '';

    this.upColorBtn({ btn: this.actBtn, act: false });
  }
}
