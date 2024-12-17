import { isometricSvgElem, isometricSvgLine, isometricSvgObjs, isometricSvgListObjs, isometricSvgFreeForm } from './index';

export class IsometricSvgActivateElem {
  constructor() {
    document.addEventListener('keydown', this.onKeyDown);
  }

  onKeyDown = (event) => {
    if (event.code === 'KeyB') {
      this.selectByGuid({ guid: '592d5111-edf4-2813-689b-8c6d812bbe7e' });
    }
  };

  selectByGuid({ guid }) {
    if (isometricSvgLine.selectedObj.el) {
      isometricSvgLine.actElem(isometricSvgLine.selectedObj.el, false);
    }

    if (isometricSvgObjs.selectedObj.el) {
      isometricSvgObjs.actElem(isometricSvgObjs.selectedObj.el, false);
    }

    if (isometricSvgFreeForm.selectedObj.el) {
      isometricSvgFreeForm.actElem(isometricSvgFreeForm.selectedObj.el, false);
    }

    const groupLines = isometricSvgElem.getSvgGroup({ tag: 'lines' });
    const groupObjs = isometricSvgElem.getSvgGroup({ tag: 'objs' });

    const arr = [...groupLines.childNodes, ...groupObjs.childNodes];
    arr.forEach((svg) => {
      if (svg['userData'].lineI && svg['userData'].attributes && svg['userData'].attributes.guid === guid) {
        isometricSvgLine.actElem(svg, true);
      }
      if (svg['userData'].freeForm && svg['userData'].attributes && svg['userData'].attributes.guid === guid) {
        isometricSvgFreeForm.actElem(svg, true);
      }

      if (isometricSvgListObjs.isObjBySvg(svg) && svg['userData'].attributes && svg['userData'].attributes.guid === guid) {
        isometricSvgObjs.actElem(svg, false);
      }
    });
  }
}
