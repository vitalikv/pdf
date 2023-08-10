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
    const viewport = page.getViewport({ scale: 1.5, rotation: -90 });

    const div = document.createElement('div');
    div.style.cssText =
      'display: flex; align-items: center; justify-content: center; position: absolute; top: 0; left: 0; right: 0; bottom: 0; transform-origin: center center; background: rgb(255, 255, 255); user-select: none; z-index: 2;';
    div.innerHTML = `<div style="display: flex; align-items: center; justify-content: center;"></div>`;

    this.containerPdf = div;
    this.container.prepend(div);

    this.pdfToCanvas({ div, page, viewport });
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
    div.children[0].appendChild(canvas);

    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    //canvas.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';
    canvas.style.cssText = 'width: 100%; height: 100%; object-fit: contain;';

    page.render({ canvasContext: context, viewport });

    const bound = canvas.getBoundingClientRect();
    const width = bound.width;
    const height = bound.height;

    // canvas.width = width;
    // canvas.height = height;

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    console.log(canvas);
  }

  rotateSvg({ degree }) {
    if (!this.containerPdf) return;
    this.degree += degree;
    this.containerPdf.children[0].style.transform = `rotate(${this.degree}deg)`;

    const bound = this.containerPdf.children[0].getBoundingClientRect();
    const width = bound.width;
    const height = bound.height;

    this.containerPdf.children[0].children[0].style.width = width + 'px';
    this.containerPdf.children[0].children[0].style.height = height + 'px';
  }

  deleteSvg() {
    if (!this.containerPdf) return;

    this.degree = 0;
    this.containerPdf.remove();
  }
}
