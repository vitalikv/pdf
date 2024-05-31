import { isometricSvgElem, isometricSvgLine, isometricSvgObjs, isometricSvgListObjs, isometricSvgUndoRedo } from './index';

export class IsometricSvgRedo {
  redo() {
    isometricSvgUndoRedo.checkIndex({ keyCode: 'Y' });
    isometricSvgUndoRedo.increaseIndex();

    const bd = isometricSvgUndoRedo.getItemBd({ number: -1 });
    if (!bd) return;

    const svg = bd.svg;
    const type = bd.type;

    if (svg['userData'].lineI) {
      if (type === 'circle') {
        const pos = isometricSvgElem.getPosCircle(svg);
        const offset = bd.pos.clone().sub(pos);

        isometricSvgLine.moveSvgPoint({ svg, offset });
      }
      if (type === 'line') {
        const pos = isometricSvgElem.getPosLine2(svg);
        const offset = bd.pos[0].clone().sub(pos[0]);

        isometricSvgLine.moveSvgLine({ svg, offset });
      }
    } else if (isometricSvgListObjs.isObjBySvg(svg)) {
      const pos = isometricSvgElem.getPosCircle(svg);
      const offset = bd.pos.clone().sub(pos);

      isometricSvgObjs.moveSvgObj({ svg, offset });
      isometricSvgObjs.unLink(svg);
      isometricSvgObjs.addLink({ svgPoint: svg, event: null, pos: bd.pos });
      isometricSvgObjs.setRotObj({ svg });
    }
  }
}
