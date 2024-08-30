import { isometricSvgElem, isometricSvgFreeForm } from './index';

export class IsometricSvgActivateElem {
  constructor() {
    document.addEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (event) => {
    if (event.code === 'KeyB') {
      this.selectByGuid({ guid: 110 });
    }
  };

  selectByGuid({ guid }) {
    if (isometricSvgFreeForm.selectedObj.el) {
      isometricSvgFreeForm.actElem(isometricSvgFreeForm.selectedObj.el, false);
    }

    const groupObjs = isometricSvgElem.getSvgGroup({ tag: 'objs' });
    groupObjs.childNodes.forEach((svg) => {
      if (svg['userData'].freeForm && svg['userData'].guid === guid) {
        isometricSvgFreeForm.actElem(svg, true);
      }
    });
  }
}
