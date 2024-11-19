import { isometricPdfToSvg, isometricSvgParserFile } from './index';

export class IsometricSvgUploader {
  inputFile;

  init() {
    this.inputFile = this.createInputFile();
  }

  createInputFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf, .svg, .vsdx';
    input.style.cssText = 'position: absolute; display: none;';

    input.onchange = (e) => {
      if (e.target['files'].length > 0) {
        if (e.target['files'][0].type.indexOf('pdf') > -1) {
          const reader = new FileReader();
          reader.onload = () => {
            isometricPdfToSvg.parsePdf({ file: reader.result });
          };
          reader.readAsDataURL(e.target['files'][0]);

          input.value = '';
        } else if (e.target['files'][0].type.indexOf('svg') > -1) {
          const reader = new FileReader();
          reader.onload = () => {
            isometricSvgParserFile.parseSvg({ file: reader.result });
          };
          reader.readAsText(e.target['files'][0]);
          input.value = '';
        } else if (/\.vsdx$/.test(e.target['files'][0].name)) {
          const reader = new FileReader();
          reader.onload = () => {
            const uint8Array = new Uint8Array(reader.result);
            const array = Array.from(uint8Array);

            const svg_buffer = {
              type: 'Buffer',
              data: array,
            };

            const uint8Array2 = new Uint8Array(svg_buffer.data);

            // Преобразуем Uint8Array в Blob
            const blob = new Blob([uint8Array2], { type: 'application/octet-stream' });
            console.log(blob);
            // Создаем FileReader
            const reader2 = new FileReader();

            // Определяем обработчик события загрузки
            reader2.onload = (event) => {
              console.log('Содержимое файла:', event.target.result);

              isometricSvgParserFile.parseSvg({ file: event.target.result });
            };

            // Читаем Blob как текст
            reader2.readAsText(blob);

            return;
            const data = 'data:application/csv;charset=utf-8,' + encodeURIComponent(reader.result);
            console.log(data);

            let link = document.createElement('a');
            link.style.display = 'none';
            document.body.appendChild(link);
            link.href = data;
            link.download = 'vsdx-base64.txt';
            link.click();
            document.body.removeChild(link);
          };

          reader.readAsArrayBuffer(e.target['files'][0]);

          input.value = '';
        }
      }
    };

    return input;
  }
}
