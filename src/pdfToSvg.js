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
  inputFile;
  сontainerSvg;
  degree = 0;

  constructor() {
    this.inputFile = this.createInputFile();
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

  async addSvgPage(page) {
    const viewport = page.getViewport({ scale: 1.5 });
    const opList = await page.getOperatorList();
    const svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs);
    //svgGfx.embedFonts = true;
    const svg = await svgGfx.getSVG(opList, viewport);

    const div = document.createElement('div');
    div.style.cssText = 'position: absolute; z-index: 3; transform-origin: center center;';
    div.style.transform = 'rotate(0deg)';
    div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="overflow: visible;"></svg>`;

    this.сontainerSvg = div;
    document.body.prepend(div);
    div.prepend(svg);

    console.log(svg);
  }

  rotateSvg({ degree }) {
    this.degree += degree;
    this.сontainerSvg.style.transform = `rotate(${this.degree}deg)`;
  }

  deleteSvg() {
    if (!this.сontainerSvg) return;

    this.degree = 0;
    this.сontainerSvg.remove();
  }
}
