export class Path {
  nodes: any[] = [];

  addToTail(node: any) {
    this.nodes.push(node);
  }

  clone() {
    let clone = new Path();
    for (let node of this.nodes) {
      clone.addToTail(node);
    }
    return clone;
  }
}
