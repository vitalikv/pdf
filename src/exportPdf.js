import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js'; // npm i svg2pdf.js
import html2canvas from 'html2canvas';

import { isometricPdfToSvg, isometricNoteSvg } from './index';

export class IsometricExportPdf {
  constructor() {
    //this.export();
  }

  export() {
    if (!isometricPdfToSvg.containerPdf) return;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: 'a4',
    });
    pdf.internal.scaleFactor = 30;

    const container = isometricPdfToSvg.containerPdf;
    const bound = container.getBoundingClientRect();
    const width = bound.width;
    const height = bound.height;
    const width2 = pdf.internal.pageSize.getWidth();
    const height2 = pdf.internal.pageSize.getHeight();

    const aspect = width / width2 > height / height2 ? width / width2 : height / height2;

    //const tasks = [isometricPdfToSvg.containerPdf, isometricNoteSvg.containerSvg].map((tab) => html2canvas(tab));
    const tasks = [document.querySelector('#labels-container-div')].map((tab) => html2canvas(tab));

    Promise.all(tasks).then((canvases) => {
      for (const canvas of canvases) {
        //console.log(canvas);
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, width / aspect, height / aspect);
      }

      pdf.save('isometry.pdf');
    });
  }

  export2() {
    if (!isometricPdfToSvg.containerPdf) return;

    const container = isometricPdfToSvg.containerPdf;
    const bound = container.children[0].getBoundingClientRect();
    const width = bound.width;
    const height = bound.height;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [width, height],
    });

    pdf.html(container, {
      callback: (pdf) => {
        pdf.save('myPDF.pdf');
      },
    });
  }

  exportSvgToPdf() {
    //this.createSvgCircle({ container: null, ind: 3, x: 100, y: 100 });

    if (!isometricPdfToSvg.containerPdf) return;

    let svg = isometricPdfToSvg.containerPdf.children[0].children[0];
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
