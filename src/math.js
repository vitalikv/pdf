import * as THREE from 'three';

export class IsometricMath {
  // угол между 2 dir
  angleTo({ v1, v2, type = 'rad' }) {
    const denominator = Math.sqrt(v1.lengthSq() * v2.lengthSq());
    if (denominator === 0) return Math.PI / 2;

    const theta = v1.dot(v2) / denominator;

    let angle = Math.acos(THREE.MathUtils.clamp(theta, -1, 1));

    if (type === 'deg') angle = THREE.MathUtils.radToDeg(angle);

    return angle;
  }

  // проверка находится ли точка внутри многоугольника
  checkPointInsideForm(point, p) {
    let result = false;
    let j = p.length - 1;
    for (let i = 0; i < p.length; i++) {
      if (((p[i].y < point.y && p[j].y >= point.y) || (p[j].y < point.y && p[i].y >= point.y)) && p[i].x + ((point.y - p[i].y) / (p[j].y - p[i].y)) * (p[j].x - p[i].x) < point.x) result = !result;
      j = i;
    }

    return result;
  }

  // Проверка двух отрезков на пересечение (ориентированная площадь треугольника)
  crossLine(a, b, c, d) {
    return this.intersect_1(a.x, b.x, c.x, d.x) && this.intersect_1(a.y, b.y, c.y, d.y) && this.area_1(a, b, c) * this.area_1(a, b, d) <= 0 && this.area_1(c, d, a) * this.area_1(c, d, b) <= 0;
  }

  // (нужно для ф-ции crossLine)
  intersect_1(a, b, c, d) {
    if (a > b) {
      const res = this.swap(a, b);
      a = res[0];
      b = res[1];
    }
    if (c > d) {
      const res = this.swap(c, d);
      c = res[0];
      d = res[1];
    }
    return Math.max(a, c) <= Math.min(b, d);
  }

  // (нужно для ф-ции crossLine)
  area_1(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }

  // меняем местами 2 значения (нужно для ф-ции crossLine)
  swap(a, b) {
    let c;
    c = a;
    a = b;
    b = c;
    return [a, b];
  }

  // проекция точки(С) на прямую (A,B)
  spPoint(A, B, C) {
    let x1 = A.x,
      y1 = A.y,
      x2 = B.x,
      y2 = B.y,
      x3 = C.x,
      y3 = C.y;

    let px = x2 - x1;
    let py = y2 - y1;
    let dAB = px * px + py * py;

    let u = ((x3 - x1) * px + (y3 - y1) * py) / dAB;
    let x = x1 + u * px;
    let y = y1 + u * py;

    return new THREE.Vector2(x, y);
  }

  // опредяляем, надодится точка D за пределами прямой или нет (точка D пересекает прямую АВ, идущая перпендикулярна от точки С)
  calScal(A, B, C) {
    let AB = { x: B.x - A.x, y: B.y - A.y };
    let CD = { x: C.x - A.x, y: C.y - A.y };
    const r1 = AB.x * CD.x + AB.y * CD.y; // скалярное произведение векторов

    AB = { x: A.x - B.x, y: A.y - B.y };
    CD = { x: C.x - B.x, y: C.y - B.y };
    const r2 = AB.x * CD.x + AB.y * CD.y;

    const cross = r1 < 0 || r2 < 0 ? false : true; // если true , то точка D находится на отрезке AB

    return cross;
  }

  // проекция точки(С) на прямую (A,B) (2D) используется Vector3
  mathProjectPointOnLine2D({ A, B, C }) {
    const x1 = A.x;
    const y1 = A.z;
    const x2 = B.x;
    const y2 = B.z;
    const x3 = C.x;
    const y3 = C.z;

    const px = x2 - x1;
    const py = y2 - y1;
    const dAB = px * px + py * py;

    const u = ((x3 - x1) * px + (y3 - y1) * py) / dAB;
    const x = x1 + u * px;
    const z = y1 + u * py;

    return new THREE.Vector3(x, 0, z);
  }
}
