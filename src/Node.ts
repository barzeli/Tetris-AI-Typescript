export class Node {
  x: any;
  y: any;
  r: any;
  checked = false;
  minMovesToPoint = 10000;
  edges: any[] = [];

  constructor(x: any, y: any, r: any) {
    this.x = x;
    this.y = y;
    this.r = r;
  }
}
