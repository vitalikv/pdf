import { mapControlInit, isometricSvgManager, isometricNoteText, isometricStampLogo } from './index';

export class IsometricModeService {
  isDown = false;
  isMove = false;

  constructor() {
    document.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
    mapControlInit.control.domElement.addEventListener('mousedown', this.onmousedown);
    mapControlInit.control.domElement.addEventListener('mousemove', this.onmousemove);
    mapControlInit.control.domElement.addEventListener('mouseup', this.onmouseup);
    //document.body.addEventListener('wheel', this.mouseWheel);

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
  }

  onKeyDown = (event) => {
    isometricSvgManager.onKeyDown(event);

    if (event.code === 'Delete') {
      isometricStampLogo.deleteDiv();
    }
  };

  onKeyUp = (event) => {
    isometricSvgManager.onKeyUp(event);
  };

  onmousedown = (event) => {
    let result = isometricStampLogo.onmousedown(event);
    if (!result) isometricNoteText.onmousedown(event);
    if (result) return;

    isometricSvgManager.onmousedown(event);

    this.isDown = false;
    this.isMove = false;

    this.isDown = true;
  };

  onmousemove = (event) => {
    isometricStampLogo.onmousemove(event);
    isometricNoteText.onmousemove(event);

    isometricSvgManager.onmousemove(event);

    if (this.isDown) this.isMove = true;
  };

  onmouseup = (event) => {
    isometricStampLogo.onmouseup(event);
    isometricNoteText.onmouseup(event);

    isometricSvgManager.onmouseup(event);

    this.isDown = false;
    this.isMove = false;
  };
}
