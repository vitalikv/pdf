import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js'; // npm i svg2pdf.js

import { isometricPdfToSvg } from './index';

export class IsometricExportPdf {
  constructor() {
    //this.export();
  }

  export2() {
    const table = document.querySelector('#labels-container-div');
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [table.clientWidth, table.clientHeight],
    });
    console.log(pdf);
    pdf.html(table, {
      callback: (pdf) => {
        // pdf.addFileToVFS('Roboto-normal.ttf', font);
        // pdf.addFont('Roboto-normal.ttf', 'Roboto', 'normal');
        // pdf.setFont('Roboto');
        pdf.save('CollisionsReport.pdf');
      },
    });
  }

  export() {
    //this.createSvgCircle({ container: null, ind: 3, x: 100, y: 100 });

    if (!isometricPdfToSvg.containerSvg) return;

    let svg = isometricPdfToSvg.containerSvg.children[0];
    if (!svg) return;

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [svg.clientWidth, svg.clientHeight],
    });
    console.log(doc, svg, svg.clientWidth, svg.clientHeight);

    doc
      .svg(svg, {
        x: 0,
        y: 0,
        width: svg.clientWidth,
        height: svg.clientHeight,
      })
      .then(() => {
        // save the created pdf
        doc.save('myPDF.pdf');
      });
  }

  createSvgCircle({ container, ind, x, y }) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    svg.setAttribute('cx', x);
    svg.setAttribute('cy', y);

    svg.setAttribute('r', '34.2');
    svg.setAttribute('stroke-width', '7px');
    svg.setAttribute('stroke', 'rgb(0, 0, 0)');
    svg.setAttribute('transform-origin', 'center');

    svg.setAttribute('fill', '#fff');
    svg.setAttribute('ind', ind);

    svg.setAttributeNS(null, 'style', 'transform: translateX(0) translateY(0);');
    //svg.setAttribute('display', 'none');

    const div = document.createElement('div');
    div.style.cssText = 'position: absolute; transform-origin: center center; background: rgb(255, 255, 255); user-select: none; z-index: 4;';
    div.style.transform = 'rotate(0deg)';
    div.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" style="overflow: visible;"></svg>`;

    div.children[0].append(svg);

    document.querySelector('#labels-container-div').append(div);
  }
}
