import { mapControlInit, isometricNoteSvg, isometricCanvasPaint } from './index';

export class IsometricModeService {
  isDown = false;
  isMove = false;

  constructor() {
    mapControlInit.control.domElement.addEventListener('mousedown', this.onmousedown);
    mapControlInit.control.domElement.addEventListener('mousemove', this.onmousemove);
    mapControlInit.control.domElement.addEventListener('mouseup', this.onmouseup);
    //document.body.addEventListener('wheel', this.mouseWheel);

    document.addEventListener('keydown', this.onKeyDown);
    //document.addEventListener('keyup', this.onKeyUp);
  }

  onKeyDown = (event) => {
    if (event.code === 'Delete') {
      isometricNoteSvg.deleteNote();
    }
  };

  onmousedown = (event) => {
    let result = isometricNoteSvg.onmousedown(event);
    if (result) return;

    result = isometricCanvasPaint.onmousedown(event);
    if (result) return;

    this.isDown = false;
    this.isMove = false;

    this.isDown = true;
  };

  onmousemove = (event) => {
    isometricNoteSvg.onmousemove(event);
    isometricCanvasPaint.onmousemove(event);

    if (this.isDown) this.isMove = true;
  };

  onmouseup = (event) => {
    isometricNoteSvg.onmouseup(event);
    isometricCanvasPaint.onmouseup(event);

    this.isDown = false;
    this.isMove = false;
  };
}
