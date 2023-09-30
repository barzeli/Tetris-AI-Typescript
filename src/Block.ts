import p5 from "p5";
import { BLOCK_SIZE, p5Sketch } from "./sketch";

export class Block {
  isDead = false;
  startingGridPos: p5.Vector;
  currentGridPos: p5.Vector;
  color: p5.Color;

  constructor(startingGridPos: p5.Vector, color: p5.Color) {
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

  draw(tetrised = false, linesToBeCleared: number[] = []) {
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
