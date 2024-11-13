import { isometricSvgElem, isometricSvgElementColor, isometricPdfToSvg, isometricSheets } from '../index';

// класс для разрешения/блокировки изменения чертежа
export class IsometricSvgBlockingMode {
  actLock = false;

  init() {
    document.addEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (event) => {
    if (event.code === 'KeyL' && !event.repeat) {
      this.actLock = !this.actLock;
      console.log(this.actLock);
    }
  };

  getActLock() {
    return this.actLock;
  }
}
