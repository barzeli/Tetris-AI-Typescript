import { Node } from "./Node";
import { Path } from "./Path";
import { game } from "./sketch";

class AStar {
  nodes: any[] = [];
  gameWidth = game.gameWidth;
  gameHeight = game.gameHeight;

  constructor() {
    this.createNodes();
    this.addEdges();
  }

  createNodes() {
    this.nodes = [];
    for (let r = 0; r < 4; r++) {
      for (let y = 0; y < this.gameHeight; y++) {
        for (let x = 0; x < this.gameWidth; x++) {
          this.nodes.push(new Node(x, y, r));
        }
      }
    }
  }

  addEdges() {
    let connectEdges = (node1: any, node2: any) => {
      node1.edges.push(node2);
      node2.edges.push(node1);
    };

    for (let r = 0; r < 4; r++) {
      for (let y = 0; y < this.gameHeight; y++) {
        for (let x = 0; x < this.gameWidth; x++) {
          //connect horizontal edges
          if (x != 0) {
            connectEdges(
              this.getNodeAtPosition(x - 1, y, r),
              this.getNodeAtPosition(x, y, r)
            );
          }
          if (x < this.gameWidth - 1) {
            connectEdges(
              this.getNodeAtPosition(x, y, r),
              this.getNodeAtPosition(x + 1, y, r)
            );
          }

          //connect vertical (y) edges
          if (y != 0) {
            connectEdges(
              this.getNodeAtPosition(x, y - 1, r),
              this.getNodeAtPosition(x, y, r)
            );
          }
          if (y < this.gameHeight - 1) {
            connectEdges(
              this.getNodeAtPosition(x, y, r),
              this.getNodeAtPosition(x, y + 1, r)
            );
          }

          //connect rotational edges
          //note one way edge
          this.getNodeAtPosition(x, y, r).edges.push(x, y, (r + 1) % 4);
        }
      }
    }
  }

  getNodeAtPosition(x: number, y: number, r: number) {
    return this.nodes[
      x + this.gameWidth * y + this.gameWidth * this.gameHeight * r
    ];
  }

  findPathsToAllEndPoints() {
    let paths = [];
    let pathToExtend = new Path();
    let winningPaths = new Path();
    let extendedPath = new Path();

    while (true) {}
  }
}
