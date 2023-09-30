import p5 from "p5";
import { Block } from "./Block";
import { MoveHistory } from "./MoveHistory";
import { BLOCK_SIZE, p5Sketch } from "./sketch";
import { Game } from "./Game";
import { ShapeType } from "./types";

export class Shape {
  game: Game;
  shapeID: ShapeType;
  currentPos: p5.Vector;
  startingPos: p5.Vector;
  blocks: Block[];
  isDead = false;
  currentRotationCount = 0;
  //vectors which control this piece into the best position
  moveHistory = new MoveHistory();

  constructor(shapeID: ShapeType, startingPos: p5.Vector, game: Game) {
    this.game = game;
    this.shapeID = shapeID;
    this.currentPos = p5Sketch.createVector(startingPos.x, startingPos.y);
    this.startingPos = p5Sketch.createVector(startingPos.x, startingPos.y);
    this.blocks = shapeID.blockPositions.map(
      (blockPosition) =>
        new Block(
          p5Sketch.createVector(blockPosition.x, blockPosition.y),
          shapeID.color
        )
    );
  }

  clone() {
    let clone = new Shape(this.shapeID, this.startingPos, this.game);
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
    const sumX = this.blocks.reduce(
      (sum, block) => sum + block.currentGridPos.x + 0.5,
      0
    );
    const sumY = this.blocks.reduce(
      (sum, block) => sum + block.currentGridPos.y + 0.5,
      0
    );
    let midpoint = p5Sketch.createVector(
      sumX / this.blocks.length,
      sumY / this.blocks.length
    );
    p5Sketch.push();

    //translate so that the midpoint is at 0,0
    p5Sketch.translate(-midpoint.x * BLOCK_SIZE, -midpoint.y * BLOCK_SIZE);

    this.blocks.forEach((block) => block.draw());
    p5Sketch.pop();
  }

  resetPosition() {
    this.currentPos = p5Sketch.createVector(
      this.startingPos.x,
      this.startingPos.y
    );
  }

  getBlockPositionAfterShapeIsRotated(block: Block, isClockwise: boolean) {
    let startingPos = block.currentGridPos;
    let rotationPoint = this.shapeID.rotationPoint;
    let startingPosRelativeToRotationPoint = p5.Vector.sub(
      startingPos,
      rotationPoint
    );
    let rotatedRelativePoint = startingPosRelativeToRotationPoint.rotate(
      isClockwise ? Math.PI / 2 : -Math.PI / 2
    );
    let newPosition = p5.Vector.add(rotationPoint, rotatedRelativePoint);
    newPosition.x = Math.round(newPosition.x);
    newPosition.y = Math.round(newPosition.y);
    return newPosition;
  }
}
