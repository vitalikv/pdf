import { isometricSvgElem, isometricSvgLine, isometricSvgObjs, isometricSvgListObjs, isometricSvgFreeForm, isometricSvgRuler, isometricNoteSvg, isometricNoteSvg2 } from '../index';

// класс для получения и передачи цвета svg элемента на фронт
export class IsometricSvgElementColor {
  getColor({ event, svg, attr }) {}

  setColor({ color }) {
    const container = isometricSvgElem.getContainerSvg();
    const elems = isometricSvgElem.getSvgElems({ container });

    elems.forEach((svg) => {
      if (svg['userData']) {
        if (isometricSvgLine.selectedObj.el && svg['userData'].lineI) {
          if (isometricSvgLine.selectedObj.el === svg) {
            isometricSvgLine.setColor({ color });
          }
        }

        if (isometricSvgObjs.selectedObj.el && isometricSvgListObjs.isObjBySvg(svg)) {
          if (isometricSvgObjs.selectedObj.el === svg) {
            isometricSvgListObjs.setColor({ svg, color });
          }
        }

        if (isometricSvgFreeForm.selectedObj.el) {
          if (isometricSvgFreeForm.selectedObj.el === svg) {
            isometricSvgFreeForm.setColor({ svg, color });
          }
        }

        if (isometricSvgRuler.selectedObj.el && svg['userData'].ruler) {
          if (isometricSvgRuler.selectedObj.el === svg) {
          }
        }

        if (isometricNoteSvg.selectedObj.el && svg['userData'].note1) {
          isometricNoteSvg.setColor({ color });
        }
        if (isometricNoteSvg2.selectedObj.el && svg['userData'].note2) {
          isometricNoteSvg2.setColor({ color });
        }
      }

      // if (isometricSvgBasicElements.selectedObj.el === svg) {
      //   isometricSvgBasicElements.actElem(svg, false);
      // }
    });
  }

  getActiveElement() {
    let svgActive = null;

    return svgActive;
  }
}
