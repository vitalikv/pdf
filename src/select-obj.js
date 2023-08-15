import { mapControlInit, isometricNoteSvg, isometricNoteSvg2, isometricSvgRuler, isometricCanvasPaint } from './index';

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
      isometricNoteSvg2.deleteNote();
      isometricSvgRuler.deleteNote();
    }
  };

  onmousedown = (event) => {
    let result = isometricNoteSvg.onmousedown(event);
    if (result) return;

    result = isometricNoteSvg2.onmousedown(event);
    if (result) return;

    result = isometricSvgRuler.onmousedown(event);
    if (result) return;

    result = isometricCanvasPaint.onmousedown(event);
    if (result) return;

    this.isDown = false;
    this.isMove = false;

    this.isDown = true;
  };

  onmousemove = (event) => {
    isometricNoteSvg.onmousemove(event);
    isometricNoteSvg2.onmousemove(event);
    isometricSvgRuler.onmousemove(event);
    isometricCanvasPaint.onmousemove(event);

    if (this.isDown) this.isMove = true;
  };

  onmouseup = (event) => {
    isometricNoteSvg.onmouseup(event);
    isometricNoteSvg2.onmouseup(event);
    isometricSvgRuler.onmouseup(event);
    isometricCanvasPaint.onmouseup(event);

    this.isDown = false;
    this.isMove = false;
  };
}
