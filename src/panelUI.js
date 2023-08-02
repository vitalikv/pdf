import { pdfToSvg } from './index';

export class PanelUI {
  container$;
  elemBtnView;
  input;
  btns$ = [];

  init() {
    this.crPanel();
    this.input = this.crInputLoader();
    this.btns$[0] = this.crBtn({ txt: 'pdf' });
    this.btns$[1] = this.crBtn({ txt: '-90' });
    this.btns$[2] = this.crBtn({ txt: '90' });

    this.initEvent();
  }

  initEvent() {
    this.container$.onmousedown = (e) => {
      //e.preventDefault();
      e.stopPropagation();
    };

    this.btns$[0].onmousedown = () => {
      this.input.click();
    };

    this.btns$[1].onmousedown = () => {
      pdfToSvg.rotateSvg({ degree: -90 });
    };

    this.btns$[2].onmousedown = () => {
      pdfToSvg.rotateSvg({ degree: 90 });
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

  crInputLoader() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.style.cssText = 'position: absolute; display: none;';

    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        //if (file.type.indexOf('image') === -1) return;

        const reader = new FileReader();
        reader.onload = () => {
          pdfToSvg.parsePdf({ file: reader.result });
        };
        reader.readAsDataURL(e.target.files[0]);

        input.value = '';
      }
    };

    return input;
  }
}

export class BtnAddTexture {
  constructor({ elem, material, clDelT }) {
    this.elem = null;
    this.material = material;
    this.clDelT = clDelT;
    this.init({ elem });
  }

  init({ elem }) {
    let div = document.createElement('div');
    div.innerHTML = this.html();
    this.elem = div.children[0];
    elem.querySelector('[nameId="itemTexture"]').append(this.elem);

    this.initEvent();

    if (this.material.map && this.material.map.image) {
      this.addDivImg({ src: this.material.map.image.src });
    }
  }

  html() {
    let style = `style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 66px; height: 66px; margin-left: 10px; border: 1px solid #4A4A4A; border-radius: 4px; box-sizing: border-box; font-size: 12px; color: #4A4A4A; cursor: pointer; user-select: none; overflow: hidden;"`;

    let html = `<div nameId="addTexture" ${style} class="backgFFFFFF backgHoverD1D1D1">
			<div style="display: none; width: 100%; height: 100%;">
				<img src="" style="width: 66px; height: 66px;">
			</div>					
		</div>`;

    return html;
  }

  initEvent() {
    this.elem.onmousedown = (e) => {
      input.click();
      data = this;
    };
  }

  addTexture({ src }) {
    this.addDivImg({ src });

    loadTexture({ material: this.material, src });
    this.clDelT.show();
  }
}
