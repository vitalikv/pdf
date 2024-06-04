import * as THREE from 'three';

import {
  isometricSvgElem,
  isometricSvgLine,
  isometricSvgObjs,
  isometricSvgListObjs,
  isometricNoteSvg,
  isometricNoteSvg2,
  isometricSvgRuler,
  isometricSvgUndoRedo,
} from './index';

export class IsometricSvgUndo {
  undo() {
    isometricSvgUndoRedo.addLastItemBd();
    isometricSvgUndoRedo.checkIndex({ keyCode: 'Z' });

    const bd = isometricSvgUndoRedo.getItemBd({ number: 1 });
    if (!bd) return;

    const params = bd.params;
    const svg = params.svg;

    if (bd.typeData === 'line') {
      if (params.tag === 'point') {
        const pos = isometricSvgElem.getPosCircle(svg);
        const offset = params.pos.clone().sub(pos);

        isometricSvgLine.moveSvgPoint({ svg, offset });
      }
      if (params.tag === 'line') {
        const pos = isometricSvgElem.getPosLine2(svg);
        const offset = params.pos[0].clone().sub(pos[0]);

        isometricSvgLine.moveSvgLine({ svg, offset });
      }
    } else if (bd.typeData === 'obj') {
      const pos = isometricSvgElem.getPosCircle(svg);
      const offset = params.pos.clone().sub(pos);

      isometricSvgObjs.moveSvgObj({ svg, offset });
      isometricSvgObjs.unLink(svg);
      isometricSvgObjs.addLink({ svgPoint: svg, event: null, pos: params.pos });
      isometricSvgObjs.setRotObj({ svg });
    }

    if (bd.typeData === 'note') {
      if (params.tag === 'note1') {
        const info = { text: [params.label.txt1.text, params.label.txt2.text], passport: { id: params.passportId } };
        //const { svg1, svg2, svg3 } = isometricNoteSvg.createElement({ btn: true, x: 0, y: 0, data: info });

        //const obj = isometricNoteSvg.getStructureNote(svg1);
        const obj = isometricNoteSvg.getStructureNote(params.svg);

        const circle = params.label.circle;
        const line = params.label.line;
        const txt1 = params.label.txt1;
        const txt2 = params.label.txt2;

        isometricSvgElem.setPosLine1(obj.line, params.line.pos[0].x, params.line.pos[0].y, params.line.pos[1].x, params.line.pos[1].y);
        isometricSvgElem.setPosCircle(obj.point, params.point.pos.x, params.point.pos.y);
        isometricSvgElem.setPosCircle(obj.labelEls.svgCircle, circle.pos.x, circle.pos.y);
        isometricSvgElem.setPosLine1(obj.labelEls.svgLine, line.pos[0].x, line.pos[0].y, line.pos[1].x, line.pos[1].y);

        if (obj.labelEls.svgText1 && txt1.pos) {
          isometricSvgElem.setPosText1(obj.labelEls.svgText1, txt1.pos.x, txt1.pos.y);
        }
        if (obj.labelEls.svgText2 && txt2.pos) {
          isometricSvgElem.setPosText1(obj.labelEls.svgText2, txt2.pos.x, txt2.pos.y);
        }

        isometricNoteSvg.unLink(obj.point);
        isometricNoteSvg.addLink({ svgPoint: obj.point, event: null, pos: new THREE.Vector2(params.point.pos.x, params.point.pos.y) });

        if (params.lock) {
          isometricNoteSvg.setLockOnSvg(obj.point, true);
        }
      }

      if (params.tag === 'note2') {
        const obj = isometricNoteSvg2.getStructureNote(params.svg);

        const line = params.label.line;
        const txt1 = params.label.txt1;
        const txt2 = params.label.txt2;

        isometricSvgElem.setPosLine1(obj.line, params.line.pos[0].x, params.line.pos[0].y, params.line.pos[1].x, params.line.pos[1].y);
        isometricSvgElem.setPosCircle(obj.point, params.point.pos.x, params.point.pos.y);
        isometricSvgElem.setPosLine1(obj.labelEls.svgLine, line.pos[0].x, line.pos[0].y, line.pos[1].x, line.pos[1].y);

        if (obj.labelEls.svgText1 && txt1.pos) {
          isometricSvgElem.setPosText1(obj.labelEls.svgText1, txt1.pos.x, txt1.pos.y);
        }
        if (obj.labelEls.svgText2 && txt2.pos) {
          isometricSvgElem.setPosText1(obj.labelEls.svgText2, txt2.pos.x, txt2.pos.y);
        }

        isometricNoteSvg2.addLink({ svgPoint: obj.point, event: null, pos: new THREE.Vector2(params.point.pos.x, params.point.pos.y) });

        if (params.lock) {
          isometricNoteSvg2.setLockOnSvg(obj.point, true);
        }
      }
    }

    if (bd.typeData === 'ruler') {
      const { line, p1, p2, p1line, p2line, pd1, pd2 } = isometricSvgRuler.getStructureNote(params.svg);

      isometricSvgElem.setPosLine1(line, params.line[0].x, params.line[0].y, params.line[1].x, params.line[1].y);
      isometricSvgElem.setPosPolygon1(p1, params.p1.x, params.p1.y);
      isometricSvgElem.setPosPolygon1(p2, params.p2.x, params.p2.y);
      isometricSvgElem.setPosLine1(p1line, params.p1line[0].x, params.p1line[0].y, params.p1line[1].x, params.p1line[1].y);
      isometricSvgElem.setPosLine1(p2line, params.p2line[0].x, params.p2line[0].y, params.p2line[1].x, params.p2line[1].y);
      isometricSvgElem.setPosCircle(pd1, params.p1line[1].x, params.p1line[1].y);
      isometricSvgElem.setPosCircle(pd2, params.p2line[1].x, params.p2line[1].y);

      isometricSvgRuler.setRotArrows({ svg: p2 });
      isometricSvgRuler.setPosRotDivText({ p1, p2 });
      //isometricSvgRuler.createDivText({ p1, p2, txt: params.divText.txt });

      isometricSvgRuler.addLink({ svgPoint: pd1, event: null, pos: new THREE.Vector2(params.p1line[1].x, params.p1line[1].y) });
      isometricSvgRuler.addLink({ svgPoint: pd2, event: null, pos: new THREE.Vector2(params.p2line[1].x, params.p2line[1].y) });
    }

    isometricSvgUndoRedo.decreaseIndex();
  }
}
