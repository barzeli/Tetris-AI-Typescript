import p5 from "p5";
import { Block } from "./Block";
import { MoveHistory } from "./MoveHistory";
import { BLOCK_SIZE, p5Sketch } from "./sketch";
import { Game } from "./Game";
import { BlockMatrix } from "./BlockMatrix";
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

  moveShape(x: number, y: number, blockMatrix?: BlockMatrix) {
    if (blockMatrix) {
      if (this.canMoveInDirection(x, y, blockMatrix)) {
        this.currentPos.x += x;
        this.currentPos.y += y;
        this.moveHistory.addDirectionalMove(x, y);
      }
    } else if (this.canMoveInDirection(x, y)) {
      this.currentPos.x += x;
      this.currentPos.y += y;
      this.moveHistory.addDirectionalMove(x, y);
    }
  }

  moveDown(resetAfterDeath?: boolean) {
    if (this.canMoveDown()) {
      this.currentPos.y += 1;
    } else {
      this.killShape(resetAfterDeath);
    }
  }

  resetPosition() {
    this.currentPos = p5Sketch.createVector(
      this.startingPos.x,
      this.startingPos.y
    );
  }

  killShape(resetAfterDeath?: boolean) {
    this.isDead = true;
    if (!resetAfterDeath) {
      this.blocks.forEach((block) => {
        //the block becomes disconnected from the shape and therefore the current grid position is no longer relative to the shape
        block.currentGridPos.add(this.currentPos);
        this.game.deadBlocks.push(block);
        this.game.deadBlocksMatrix[block.currentGridPos.x][
          block.currentGridPos.y
        ] = block;
      });
    }
  }

  canMoveDown(blockMatrix?: BlockMatrix) {
    return this.blocks.every((block) => {
      let futureBlockPosition = p5.Vector.add(
        this.currentPos,
        block.currentGridPos
      );
      futureBlockPosition.y += 1;
      //if a block matrix is passed into the function then look at that instead of the game
      if (blockMatrix) {
        if (!blockMatrix.isPositionVacant(futureBlockPosition)) {
          return false;
        }
      } else {
        if (!this.game.isPositionVacant(futureBlockPosition)) {
          return false;
        }
      }
      return true;
    });
  }

  canMoveInDirection(x: number, y: number, blockMatrix?: BlockMatrix) {
    //look at the future position of each block in the shape and if all those positions are vacant then we good
    return this.blocks.every((block) => {
      let futureBlockPosition = p5.Vector.add(
        this.currentPos,
        block.currentGridPos
      );
      futureBlockPosition.y += y;
      futureBlockPosition.x += x;

      //if a block matrix is passed into the function then look at that instead of the game
      if (blockMatrix) {
        if (!blockMatrix.isPositionVacant(futureBlockPosition)) {
          return false;
        }
      } else {
        if (!this.game.isPositionVacant(futureBlockPosition)) {
          return false;
        }
      }
      return true;
    });
  }

  canRotateShape(isClockwise: boolean, blockMatrix?: BlockMatrix) {
    return this.blocks.every((block) => {
      let newPosition = this.getBlockPositionAfterShapeIsRotated(
        block,
        isClockwise
      );
      let newAbsolutePosition = p5.Vector.add(newPosition, this.currentPos);
      //if a block matrix is passed into the function then look at that instead of the game
      if (blockMatrix) {
        if (!blockMatrix.isPositionVacant(newAbsolutePosition)) {
          return false;
        }
      } else {
        if (!this.game.isPositionVacant(newAbsolutePosition)) {
          return false;
        }
      }
      return true;
    });
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

  rotateShape(isClockwise: boolean, blockMatrix?: BlockMatrix) {
    if (blockMatrix) {
      if (this.canRotateShape(isClockwise, blockMatrix)) {
        this.blocks.forEach((block) => {
          let newPosition = this.getBlockPositionAfterShapeIsRotated(
            block,
            isClockwise
          );
          block.currentGridPos = newPosition;
        });
        this.currentRotationCount += 1;
        this.moveHistory.addRotationMove();
      }
    } else {
      if (this.canRotateShape(isClockwise)) {
        this.blocks.forEach((block) => {
          let newPosition = this.getBlockPositionAfterShapeIsRotated(
            block,
            isClockwise
          );
          block.currentGridPos = newPosition;
        });
        this.currentRotationCount += 1;
        this.moveHistory.addRotationMove();
      }
    }
  }
}
