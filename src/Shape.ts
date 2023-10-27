import p5 from "p5";
import { Block } from "./Block";
import { MoveHistory } from "./MoveHistory";
import { BLOCK_SIZE, p5Sketch } from "./sketch";
import { ShapeType } from "./types";

export class Shape {
  shapeID: ShapeType;
  currentPos: p5.Vector;
  startingPos: p5.Vector;
  blocks: Block[];
  isDead = false;
  currentRotationCount = 0;
  //vectors which control this piece into the best position
  moveHistory = new MoveHistory();

  constructor(shapeID: ShapeType, startingPos: p5.Vector) {
    this.shapeID = shapeID;
    this.currentPos = startingPos.copy();
    this.startingPos = startingPos.copy();
    this.blocks = shapeID.blockPositions.map(
      (blockPosition) => new Block(blockPosition.copy(), shapeID.color)
    );
  }

  clone() {
    let clone = new Shape(this.shapeID, this.startingPos);
    clone.currentPos = this.currentPos.copy();
    clone.blocks = this.blocks.map((block) => block.clone());
    clone.isDead = this.isDead;
    clone.currentRotationCount = this.currentRotationCount;
    clone.moveHistory = this.moveHistory.clone();
    return clone;
  }

  draw() {
    p5Sketch.push();
    p5Sketch.translate(
      this.currentPos.x * BLOCK_SIZE,
      this.currentPos.y * BLOCK_SIZE
    );
    this.blocks.forEach((block) => block.draw());
    p5Sketch.pop();
  }

  //draws the shape with its CENTER at 0,0
  drawAtOrigin() {
    //get the midpoint of the shape
    const midpoint = p5Sketch.createVector(
      (Math.max(...this.blocks.map((block) => block.gridPos.x)) + 1) / 2,
      (Math.max(...this.blocks.map((block) => block.gridPos.y)) + 1) / 2
    );
    p5Sketch.push();

    //translate so that the midpoint is at 0,0
    p5Sketch.translate(-midpoint.x * BLOCK_SIZE, -midpoint.y * BLOCK_SIZE);

    this.blocks.forEach((block) => block.draw());
    p5Sketch.pop();
  }

  resetPosition() {
    this.currentPos = this.startingPos.copy();
  }

  getBlockPositionAfterShapeIsRotated(block: Block) {
    const startingPos = block.gridPos;
    const rotationPoint = this.shapeID.rotationPoint;
    const startingPosRelativeToRotationPoint = p5.Vector.sub(
      startingPos,
      rotationPoint
    );
    const rotatedRelativePoint = startingPosRelativeToRotationPoint.rotate(
      Math.PI / 2
    );
    const newPosition = p5.Vector.add(rotationPoint, rotatedRelativePoint);
    newPosition.x = Math.round(newPosition.x);
    newPosition.y = Math.round(newPosition.y);
    return newPosition;
  }

  isOverlapping(other: Shape) {
    return this.blocks
      .map((block) => p5.Vector.add(this.currentPos, block.gridPos))
      .every((firstBlockPosition) =>
        other.blocks
          .map((block) => p5.Vector.add(other.currentPos, block.gridPos))
          .find(
            (secondBlockPosition) =>
              p5.Vector.dist(firstBlockPosition, secondBlockPosition) < 0.1
          )
      );
  }
}
