import { isometricSvgElem, isometricSvgLine, isometricSvgUndoRedo } from './index';

export class IsometricSvgUndo {
  undo() {
    isometricSvgUndoRedo.addLastItemBd();
    isometricSvgUndoRedo.checkIndex({ keyCode: 'Z' });

    const bd = isometricSvgUndoRedo.getCurrentItemBd();
    if (!bd) return;

    const svg = bd.svg;
    const pos = isometricSvgElem.getPosCircle(svg);
    const offset = bd.pos.clone().sub(pos);

    isometricSvgLine.moveSvgPoint({ svg, offset });

    isometricSvgUndoRedo.decreaseIndex();
  }
}
