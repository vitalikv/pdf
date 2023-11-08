import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js'; // npm i svg2pdf.js
import html2canvas from 'html2canvas';
import { css } from './style/gostcadkk-normal';

import { isometricPdfToSvg, isometricSvgManager, isometricSheets, isometricStampLogo } from './index';

export class IsometricExportPdf {
  constructor() {
    //this.export();
  }

  export() {
    if (!isometricPdfToSvg.containerPdf) return;

    const format = isometricPdfToSvg.format;

    const pdf = new jsPDF({
      orientation: format.orientation, // "portrait" or "landscape"
      unit: 'px',
      format: format.size,
      compress: true,
    });
    pdf.internal.scaleFactor = 30;

    const widthPdf = pdf.internal.pageSize.getWidth();
    const heightPdf = pdf.internal.pageSize.getHeight();

    // this.getScreen({ widthPdf, heightPdf });
    // return;

    const divs = [];
    console.log(isometricSheets.elemWrap);
    if (isometricSheets.elemWrap) divs.push(isometricSheets.elemWrap);
    if (isometricSvgManager.containerSvg) divs.push(isometricSvgManager.containerSvg);

    // console.log(isometricStampLogo.arrStamp);
    // isometricStampLogo.arrStamp.forEach((stamp) => {
    //   divs.push(stamp);
    // });

    // const container = document.querySelector('#labels-container-div');
    // const divs = [container];

    let canvas = document.createElement('canvas');
    canvas.width = isometricPdfToSvg.canvasPdf.width;
    canvas.height = isometricPdfToSvg.canvasPdf.height;
    const context = canvas.getContext('2d');

    const style = document.createElement('style');
    style.innerText = css;
    isometricSvgManager.svgXmlns.appendChild(style);

    const tasks = divs.map((div) => html2canvas(div, { removeContainer: true, backgroundColor: null, scale: 2, logging: false }));

    Promise.all(tasks).then((canvases) => {
      style.remove();
      // const width = parseInt(isometricPdfToSvg.canvasPdf.style.width, 10);
      // const height = parseInt(isometricPdfToSvg.canvasPdf.style.height, 10);
      // const aspect = width / widthPdf > height / heightPdf ? width / widthPdf : height / heightPdf;
      // const w = width / aspect;
      // const h = height / aspect;

      for (const canvas2 of canvases) {
        const hRatio = canvas.width / canvas2.width;
        const vRatio = canvas.height / canvas2.height;
        const ratio = Math.max(hRatio, vRatio);
        const centerShift_x = (canvas.width - canvas2.width * ratio) / 2;
        const centerShift_y = (canvas.height - canvas2.height * ratio) / 2;

        context.drawImage(canvas2, 0, 0, canvas2.width, canvas2.height, centerShift_x, centerShift_y, canvas2.width * ratio, canvas2.height * ratio);
      }

      const strMime = 'image/png';
      const imgData = canvas.toDataURL(strMime);

      pdf.addImage(imgData, 'PNG', 0, 0, widthPdf, heightPdf, '', 'FAST');

      var base64 = pdf.output('datauristring');
      console.log(base64);
      this.openPdf2(base64);
      //pdf.save('isometry.pdf');
    });

    // Promise.all(tasks).then((canvases) => {
    //   for (const canvas of canvases) {
    //     const width = parseInt(canvas.style.width, 10);
    //     const height = parseInt(canvas.style.height, 10);
    //     const aspect = width / widthPdf > height / heightPdf ? width / widthPdf : height / heightPdf;
    //     const w = width / aspect;
    //     const h = height / aspect;

    //     const imgData = canvas.toDataURL('image/png');
    //     pdf.addImage(imgData, 'PNG', 0, 0, w, h);
    //   }
    //   pdf.save('isometry.pdf');
    // });
  }

  getScreen() {
    const scalePdf = isometricPdfToSvg.scalePdf;
    //isometricPdfToSvg.setScale({ value: 100 });

    const container = document.querySelector('#labels-container-div');
    const divs = [container];
    //if (isometricSvgManager.containerSvg) divs.push(isometricSvgManager.containerSvg);

    const scale = 2;
    const tasks = divs.map((div) => html2canvas(div, { backgroundColor: null, scale }));

    const bound = isometricPdfToSvg.canvasPdf.getBoundingClientRect();

    Promise.all(tasks).then((canvases) => {
      const canvas = document.createElement('canvas');
      canvas.width = isometricPdfToSvg.canvasPdf.width;
      canvas.height = isometricPdfToSvg.canvasPdf.height;
      const context = canvas.getContext('2d');

      for (const canvas2 of canvases) {
        const hRatio = canvas.width / canvas2.width;
        const vRatio = canvas.height / canvas2.height;
        const ratio = Math.max(hRatio, vRatio);
        const centerShift_x = (canvas.width - canvas2.width * ratio) / 2;
        const centerShift_y = (canvas.height - canvas2.height * ratio) / 2;

        context.drawImage(canvas2, 0, 0, canvas2.width, canvas2.height, centerShift_x, centerShift_y, canvas2.width * ratio, canvas2.height * ratio);
      }

      const strMime = 'image/png';
      const imgData = canvas.toDataURL(strMime);

      this.saveImg({
        data: imgData.replace(strMime, 'image/octet-stream'),
        name: 'isometry.png',
      });
    });
  }

  openPdf(data) {
    const link = document.createElement('a');
    link.target = '_blank';
    //document.body.appendChild(link);

    link.href = data;
    link.click();
  }

  openPdf2(data) {
    const iframe = "<iframe width='100%' height='100%' src='" + data + "'></iframe>";
    const x = window.open();
    x.document.open();
    x.document.write(iframe);
    x.document.close();
  }

  saveImg({ name, data }) {
    const link = document.createElement('a');

    document.body.appendChild(link);
    link.download = name;
    link.href = data;
    link.click();
    document.body.removeChild(link);
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
