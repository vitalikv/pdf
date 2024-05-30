import { isometricSvgElem, isometricSvgLine, isometricSvgUndoRedo } from './index';

export class IsometricSvgUndo {
  undo() {
    isometricSvgUndoRedo.addLastItemBd();
    isometricSvgUndoRedo.checkIndex({ keyCode: 'Z' });

    const bd = isometricSvgUndoRedo.getItemBd({ number: 1 });
    if (!bd) return;

    const svg = bd.svg;
    const type = bd.type;

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

    isometricSvgUndoRedo.decreaseIndex();
  }
}
