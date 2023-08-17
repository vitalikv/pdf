import * as pdfjsLib from 'pdfjs-dist/webpack';

// сбоник примеров
// https://snyk.io/advisor/npm-package/pdfjs-dist/functions/pdfjs-dist.SVGGraphics
// https://snyk.io/advisor/npm-package/pdfjs-dist/example

// установка
// https://www.npmjs.com/package/pdfjs-dist  pdf to svg  установка npm i pdfjs-dist
// npm install pdfjs-dist @types/pdfjs-dist  установка @types
// https://github.com/mozilla/pdf.js/tree/master/examples/webpack  установка pdf.js для webpack (import * as pdfjsLib from 'pdfjs-dist/webpack';)

// конвертация pdf в svg и добавление на страницу
export class IsometricPdfToSvg {
  container;
  inputFile;
  containerPdf;
  canvasPdf;
  degree = 0;

  constructor() {
    this.inputFile = this.createInputFile();
  }

  getContainer() {
    this.container = document.querySelector('#labels-container-div');
  }

  createInputFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf';
    input.style.cssText = 'position: absolute; display: none;';

    input.onchange = (e) => {
      if (e.target.files.length > 0) {
        if (e.target.files[0].type.indexOf('pdf') === -1) return;

        const reader = new FileReader();
        reader.onload = () => {
          this.parsePdf({ file: reader.result });
        };
        reader.readAsDataURL(e.target.files[0]);

        input.value = '';
      }
    };

    return input;
  }

  parsePdf({ file }) {
    if (!this.container) this.getContainer();

    this.deleteSvg();
    //const pdf = new pdfjsLib.getDocument('./img/1.pdf');
    const pdf = new pdfjsLib.getDocument(file);

    pdf.promise.then(
      (pdf) => {
        const totalPages = pdf.numPages;

        for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
          pdf.getPage(pageNumber).then((page) => {
            this.addSvgPage(page);
          });
        }
      },
      (reason) => {
        console.error(reason);
      }
    );
  }

  addSvgPage(page) {
    const viewport = page.getViewport({ scale: 4.5, rotation: -90 });

    const div = document.createElement('div');
    div.style.cssText =
      'display: flex; align-items: center; justify-content: center; position: absolute; top: 0; left: 0; right: 0; bottom: 0; transform-origin: center center; background: rgb(255, 255, 255); user-select: none; z-index: 2;';
    div.innerHTML = `<div style="position: relative; width: 100%; height: 100%;"></div>`;

    this.containerPdf = div;
    this.container.prepend(div);

    this.canvasPdf = this.pdfToCanvas({ div: this.containerPdf.children[0], page, viewport });
    //this.pdfToSvg({ div, page, viewport });
  }

  async pdfToSvg({ div, page, viewport }) {
    const opList = await page.getOperatorList();
    const svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs);
    //svgGfx.embedFonts = true;
    const svg = await svgGfx.getSVG(opList, viewport);
    div.children[0].prepend(svg);

    svg.setAttribute('pdf', true);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    //svg.removeAttribute('viewBox')

    div.innerHTML = div.innerHTML
      .replace('svg:svg', 'svg') // strip :svg to allow skipping namespace
      .replace(/&lt;(\/|)svg:/g, '&lt;$1');

    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.removeAttribute('version');
  }

  pdfToCanvas({ div, page, viewport }) {
    const canvas = document.createElement('canvas');
    div.appendChild(canvas);

    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    //canvas.style.cssText = 'position: absolute; inset: 0px; width: 100%; height: 100%; object-fit: contain;';

    page.render({ canvasContext: context, viewport });

    canvas.style.cssText = 'position: absolute; top: 50%; left: 50%; width: 100%; height: 100%; transform: translateX(-50%) translateY(-50%);';

    const bound = div.getBoundingClientRect();
    const width = bound.width;
    const height = bound.height;

    div.style.width = width + 'px';
    div.style.height = height + 'px';

    div['userData'] = { width, height };

    this.updateSizePdf();

    return canvas;
  }

  rotateSvg({ degree }) {
    if (!this.containerPdf) return;
    this.degree += degree;

    const w = this.containerPdf.children[0].style.width;
    const h = this.containerPdf.children[0].style.height;

    this.containerPdf.children[0].style.transform = `rotate(${this.degree}deg)`;

    const div = this.containerPdf.children[0];
    div.style.width = h;
    div.style.height = w;
    const uW = div['userData'].width;
    const uH = div['userData'].height;
    div['userData'].width = uH;
    div['userData'].height = uW;
    //console.log(this.containerPdf.children[0].style.width);

    this.updateSizePdf();
  }

  updateSizePdf() {
    const div = this.containerPdf.children[0];
    const canvas = div.children[0];

    const width = canvas.width;
    const height = canvas.height;

    // const width2 = div.clientWidth;
    // const height2 = div.clientHeight;
    const width2 = parseInt(div.style.width, 10);
    const height2 = parseInt(div.style.height, 10);

    const aspect = width / width2 > height / height2 ? width / width2 : height / height2;

    canvas.style.width = canvas.width / aspect + 'px';
    canvas.style.height = canvas.height / aspect + 'px';
  }

  setScale({ value }) {
    if (!this.containerPdf) return;
    value = Number(value) / 100;

    const div = this.containerPdf.children[0];
    const w = div['userData'].width * value;
    const h = div['userData'].height * value;

    div.style.width = Math.round(w * 100) / 100 + 'px';
    div.style.height = Math.round(h * 100) / 100 + 'px';

    console.log(div, w, h, div.clientWidth, div.clientHeight, div.style.width, div.style.height);

    this.updateSizePdf();
  }

  deleteSvg() {
    if (!this.containerPdf) return;

    this.degree = 0;
    this.containerPdf.remove();
  }
}
