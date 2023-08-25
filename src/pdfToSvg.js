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
  scalePdf = 1;
  format = { size: 'a3', orientation: 'landscape' };

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

  setFormatSize(value) {
    format.size = value;
  }

  setFormatOrientation(value) {
    format.orientation = value;
  }

  parsePdf({ file }) {
    if (!this.container) this.getContainer();

    this.deletePdf();
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

    this.containerPdf = div;
    this.container.prepend(div);

    this.scalePdf = 1;
    this.canvasPdf = this.pdfToCanvas({ div: this.containerPdf, page, viewport });
    this.updateCanvasPdf();
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

    page.render({ canvasContext: context, viewport });

    canvas.style.cssText =
      'position: absolute; top: 50%; left: 50%; width: 100%; height: 100%; transform: translateX(-50%) translateY(-50%); border: 1px solid #515151;';

    return canvas;
  }

  rotateSvg = ({ degree }) => {
    if (!this.containerPdf) return;

    const angle = degree;
    const rad = (angle * Math.PI) / 180;

    const image = this.canvasPdf;
    const w = image.width;
    const h = image.height;
    const width = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad));
    const height = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const cos_Height = image.height * Math.abs(Math.cos(rad));
    const sin_Width = image.width * Math.abs(Math.sin(rad));

    let xOrigin, yOrigin;

    if (angle === 90) {
      xOrigin = width;
      yOrigin = Math.min(cos_Height, sin_Width);
    }
    if (angle === -90) {
      xOrigin = 0;
      yOrigin = Math.max(cos_Height, sin_Width);
    }

    const ctx = canvas.getContext('2d');

    ctx.save();
    ctx.translate(xOrigin, yOrigin);
    ctx.rotate(rad);
    ctx.drawImage(image, 0, 0);
    ctx.restore();

    canvas.style.top = this.canvasPdf.style.top;
    canvas.style.left = this.canvasPdf.style.left;
    this.canvasPdf = canvas;

    this.updateCanvasPdf();
  };

  updateCanvasPdf() {
    if (this.containerPdf.children[0]) this.containerPdf.children[0].remove();

    this.containerPdf.append(this.canvasPdf);

    const div = this.containerPdf;

    const canvas = this.canvasPdf;
    const width = canvas.width;
    const height = canvas.height;

    const width2 = div.clientWidth;
    const height2 = div.clientHeight;

    const aspect = width / width2 > height / height2 ? width / width2 : height / height2;

    canvas.style.position = 'absolute';
    canvas.style.width = (canvas.width / aspect) * this.scalePdf + 'px';
    canvas.style.height = (canvas.height / aspect) * this.scalePdf + 'px';
    canvas.style.transform = 'translateX(-50%) translateY(-50%)';
    canvas.style.border = '1px solid #515151';
  }

  setScale({ value }) {
    if (!this.canvasPdf) return;
    value = Number(value) / 100;

    this.scalePdf = value;

    this.updateCanvasPdf();
  }

  deletePdf() {
    if (!this.containerPdf) return;

    this.containerPdf.remove();
  }
}
