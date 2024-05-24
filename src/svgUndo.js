import { isometricSvgElem, isometricSvgLine, isometricSvgUndoRedo } from './index';

export class IsometricSvgUndo {
  undo() {
    isometricSvgUndoRedo.addLastItemBd();

    const bd = isometricSvgUndoRedo.getCurrentItemBd();
    const svg = bd.svg;
    const pos = isometricSvgElem.getPosCircle(svg);
    const offset = bd.pos.clone().sub(pos);
    console.log(svg, offset);

    isometricSvgLine.moveSvgPoint({ svg, offset });

    isometricSvgUndoRedo.decreaseIndex();
  }
}
