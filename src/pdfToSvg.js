import * as pdfjsLib from 'pdfjs-dist/webpack';

// сбоник примеров
// https://snyk.io/advisor/npm-package/pdfjs-dist/functions/pdfjs-dist.SVGGraphics
// https://snyk.io/advisor/npm-package/pdfjs-dist/example

// установка
// https://www.npmjs.com/package/pdfjs-dist  pdf to svg  установка npm i pdfjs-dist
// npm install pdfjs-dist @types/pdfjs-dist  установка @types
// https://github.com/mozilla/pdf.js/tree/master/examples/webpack  установка pdf.js для webpack (import * as pdfjsLib from 'pdfjs-dist/webpack';)

// конвертация pdf в svg и добавление на страницу
export class PdfToSvg {
  сontainerSvg;

  constructor() {
    //this.parsePdf();
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
    div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="overflow: visible;"></svg>`;

    this.сontainerSvg = div;
    document.body.prepend(div);
    div.prepend(svg);

    console.log(svg);
  }

  deleteSvg() {
    if (!this.сontainerSvg) return;

    this.сontainerSvg.remove();
  }
}
