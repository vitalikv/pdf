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
      if (
        ((p[i].y < point.y && p[j].y >= point.y) || (p[j].y < point.y && p[i].y >= point.y)) &&
        p[i].x + ((point.y - p[i].y) / (p[j].y - p[i].y)) * (p[j].x - p[i].x) < point.x
      )
        result = !result;
      j = i;
    }

    return result;
  }

  // Проверка двух отрезков на пересечение (ориентированная площадь треугольника)
  crossLine(a, b, c, d) {
    return (
      this.intersect_1(a.x, b.x, c.x, d.x) &&
      this.intersect_1(a.y, b.y, c.y, d.y) &&
      this.area_1(a, b, c) * this.area_1(a, b, d) <= 0 &&
      this.area_1(c, d, a) * this.area_1(c, d, b) <= 0
    );
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
}
