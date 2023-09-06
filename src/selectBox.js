import * as THREE from 'three';

export class IsometricSelectBox {
  activated = false;
  isDown = false;
  isMove = false;
  container;
  elemSelBox = null;
  startOffset = new THREE.Vector2();
  startPos = new THREE.Vector2();
  endPos = new THREE.Vector2();

  init({ container }) {
    this.container = container;
    this.elemSelBox = this.createElemSelectBox();
  }

  createElemSelectBox() {
    const div = document.createElement('div');
    div.style.cssText =
      'position: absolute; width: 0; height: 0; line-height: 0; z-index: 100; visibility: hidden; border: 2px dashed #ff0000; box-sizing: border-box;';
    this.container.prepend(div);

    return div;
  }

  onKeyDown = (event) => {
    if (event.code === 'ControlLeft' && !event.repeat) {
      console.log(event.code);
      this.activateCutBox();
    }
  };

  onKeyUp = (event) => {
    if (event.code === 'ControlLeft') {
      this.deActivateCutBox();
    }
  };

  activateCutBox() {
    this.activated = true;

    const bound = this.container.getBoundingClientRect();
    this.startOffset.x = bound.left;
    this.startOffset.y = bound.top;
  }

  deActivateCutBox() {
    this.activated = false;
    //this.cutBoxVisibility('hidden');
  }

  cutBoxVisibility(value) {
    this.elemSelBox.style.visibility = value;
  }

  coords(event) {
    const x = -this.startOffset.x + event.clientX;
    const y = -this.startOffset.y + event.clientY;

    return new THREE.Vector2(x, y);
  }

  onmousedown = (event) => {
    if (!this.activated) return;

    this.cutBoxVisibility('hidden');

    this.startPos = this.coords(event);
    this.endPos = this.coords(event);

    this.isDown = true;

    return true;
  };

  onmousemove = (event) => {
    if (!this.isDown) return;

    this.isMove = true;

    this.endPos = this.coords(event);

    let x1 = this.startPos.x;
    let y1 = this.startPos.y;
    let { x: x2, y: y2 } = this.coords(event);

    if (x1 === x2) {
      return;
    }
    if (y1 === y2) {
      return;
    }

    if (x1 > x2) {
      x1 = x1 + x2;
      x2 = x1 - x2;
      x1 = x1 - x2;
    }
    if (y1 > y2) {
      y1 = y1 + y2;
      y2 = y1 - y2;
      y1 = y1 - y2;
    }

    const box = this.elemSelBox;
    box.style.top = y1 + 'px';
    box.style.left = x1 + 'px';
    box.style.width = x2 - x1 + 'px';
    box.style.height = y2 - y1 + 'px';

    this.cutBoxVisibility('visible');
  };

  onmouseup = (event) => {
    this.isDown = false;
    this.isMove = false;
  };
}
