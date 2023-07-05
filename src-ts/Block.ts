import { BLOCK_SIZE, p5Sketch } from "./sketch";

export class Block {
  isDead = false;
  startingGridPos: any;
  currentGridPos: any;
  color: any;

  constructor(startingGridPos: any, color: any) {
    this.startingGridPos = startingGridPos;
    this.currentGridPos = startingGridPos;
    this.color = color;
  }

  clone() {
    let clone = new Block(this.startingGridPos.copy(), this.color);
    clone.isDead = this.isDead;
    clone.currentGridPos = this.currentGridPos.copy();
    return clone;
  }

  draw(tetrised = false, linesToBeCleared: any[] = []) {
    if (this.isDead) return;
    p5Sketch.push();
    let pos = this.currentGridPos;
    if (tetrised && linesToBeCleared.includes(this.currentGridPos.y)) {
      p5Sketch.stroke(0);
      p5Sketch.fill(255);
    } else {
      p5Sketch.fill(this.color);
      p5Sketch.stroke(0);
    }
    p5Sketch.strokeWeight(3);
    p5Sketch.rect(
      pos.x * BLOCK_SIZE,
      pos.y * BLOCK_SIZE,
      BLOCK_SIZE,
      BLOCK_SIZE
    );
    p5Sketch.pop();
  }
}
