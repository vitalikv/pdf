import { isometricSvgElem, isometricSvgLine, isometricSvgUndoRedo } from './index';

export class IsometricSvgRedo {
  redo() {
    isometricSvgUndoRedo.checkIndex({ keyCode: 'Y' });
    isometricSvgUndoRedo.increaseIndex();

    const bd = isometricSvgUndoRedo.getCurrentItemBd();
    const svg = bd.svg;
    const pos = isometricSvgElem.getPosCircle(svg);
    const offset = bd.pos.clone().sub(pos);
    console.log(bd);

    isometricSvgLine.moveSvgPoint({ svg, offset });
  }
}
