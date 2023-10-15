import p5 from "p5";
import { Block } from "./Block";
import { Shape } from "./Shape";
import { ShapeGenerator } from "./ShapeGenerator";
import { BLOCK_SIZE, canvas, p5Sketch } from "./sketch";
import { zip } from "lodash";
import { BlockMatrix } from "./BlockMatrix";

export class Game {
  gameWidth: number;
  gameHeight: number;

  justTetrised = false;

  shapeGenerator = new ShapeGenerator();
  deadBlocks: Block[] = [];
  deadBlocksMatrix: BlockMatrix;

  heldShape: Shape | null = null;
  hasHeldThisShape = false;
  score = 0;

  //calculate the tetris rate
  totalLineClears = 0;
  totalTetrises = 0;
  timeSinceTetris = 10;
  needsNewMovementPlan = false;

  isDead = false;

  linesToBeCleared: number[] = [];
  currentShape: Shape;
  nextShape: Shape;

  constructor(gameWidth: number, gameHeight: number) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.deadBlocksMatrix = new BlockMatrix(gameWidth, gameHeight);

    this.currentShape = this.shapeGenerator.getNewRandomShape(
      p5Sketch.createVector(p5Sketch.int(this.gameWidth / 2), 0)
    );
    this.resetBlocksMatrix();
    this.nextShape = this.shapeGenerator.getNewRandomShape(
      p5Sketch.createVector(p5Sketch.int(this.gameWidth / 2), 0)
    );
  }

  resetBlocksMatrix() {
    this.deadBlocksMatrix.matrix = [...Array(this.gameWidth)].map((_) =>
      [...Array(this.gameHeight)].map((_) => null)
    );
  }

  moveShapeDown(resetAfterShapeDeath?: boolean) {
    if (this.deadBlocksMatrix.canMoveShapeDown(this.currentShape)) {
      this.currentShape.currentPos.y += 1;
    } else {
      this.killShape(this.currentShape, resetAfterShapeDeath);
    }

    if (this.currentShape.isDead && resetAfterShapeDeath) {
      this.currentShape.isDead = false;
      this.currentShape.resetPosition();
    } else if (this.currentShape.isDead) {
      this.hasHeldThisShape = false;
      this.checkForTetris();
      if (this.justTetrised) {
      } else {
        this.checkForClearedLines();
      }

      this.currentShape = this.nextShape;
      this.nextShape = this.shapeGenerator.getNewRandomShape(
        p5Sketch.createVector(p5Sketch.int(this.gameWidth / 2), 0)
      );
      this.needsNewMovementPlan = true;

      //if the new block is stuck then the game resets
      if (
        !this.canMoveShapeInDirection(this.currentShape, 0, 0) ||
        this.score > 500
      ) {
        this.isDead = true;
        // this.resetGame();
      }
    }
  }

  killShape(shape: Shape, resetAfterDeath?: boolean) {
    shape.isDead = true;
    if (!resetAfterDeath) {
      shape.blocks.forEach((block) => {
        //the block becomes disconnected from the shape and therefore the current grid position is no longer relative to the shape
        block.gridPos.add(shape.currentPos);
        this.deadBlocks.push(block);
        this.deadBlocksMatrix.matrix[block.gridPos.x][block.gridPos.y] = block;
      });
    }
  }

  moveShape(shape: Shape, x: number, y: number, blockMatrix?: BlockMatrix) {
    if (blockMatrix) {
      if (this.canMoveShapeInDirection(shape, x, y, blockMatrix)) {
        shape.currentPos.x += x;
        shape.currentPos.y += y;
        shape.moveHistory.addDirectionalMove(x, y);
      }
    } else if (this.canMoveShapeInDirection(shape, x, y)) {
      shape.currentPos.x += x;
      shape.currentPos.y += y;
      shape.moveHistory.addDirectionalMove(x, y);
    }
  }

  canMoveShapeInDirection(
    shape: Shape,
    x: number,
    y: number,
    blockMatrix?: BlockMatrix
  ) {
    //look at the future position of each block in the shape and if all those positions are vacant then we good
    return shape.blocks.every((block) => {
      let futureBlockPosition = p5.Vector.add(shape.currentPos, block.gridPos);
      futureBlockPosition.y += y;
      futureBlockPosition.x += x;

      //if a block matrix is passed into the function then look at that instead of the game
      if (blockMatrix) {
        if (!blockMatrix.isPositionVacant(futureBlockPosition)) {
          return false;
        }
      } else {
        if (!this.deadBlocksMatrix.isPositionVacant(futureBlockPosition)) {
          return false;
        }
      }
      return true;
    });
  }

  rotateCurrentShape(shape: Shape, blockMatrix?: BlockMatrix) {
    if (blockMatrix) {
      if (this.canRotateShape(shape, blockMatrix)) {
        shape.blocks.forEach((block) => {
          let newPosition = shape.getBlockPositionAfterShapeIsRotated(block);
          block.gridPos = newPosition;
        });
        shape.currentRotationCount += 1;
        shape.currentRotationCount %= 4;
        shape.moveHistory.addRotationMove();
      }
    } else {
      if (this.canRotateShape(shape)) {
        shape.blocks.forEach((block) => {
          let newPosition = shape.getBlockPositionAfterShapeIsRotated(block);
          block.gridPos = newPosition;
        });
        shape.currentRotationCount += 1;
        shape.currentRotationCount %= 4;
        shape.moveHistory.addRotationMove();
      }
    }
  }

  canRotateShape(shape: Shape, blockMatrix?: BlockMatrix) {
    return shape.blocks.every((block) => {
      let newPosition = shape.getBlockPositionAfterShapeIsRotated(block);
      let newAbsolutePosition = p5.Vector.add(newPosition, shape.currentPos);
      //if a block matrix is passed into the function then look at that instead of the game
      if (blockMatrix) {
        if (!blockMatrix.isPositionVacant(newAbsolutePosition)) {
          return false;
        }
      } else {
        if (!this.deadBlocksMatrix.isPositionVacant(newAbsolutePosition)) {
          return false;
        }
      }
      return true;
    });
  }

  getTetrisRate() {
    return (this.totalTetrises / Math.max(1, this.totalLineClears)) * 100;
  }

  resetGame() {
    this.resetBlocksMatrix();
    this.deadBlocks = [];
    this.currentShape = this.shapeGenerator.getNewRandomShape(
      p5Sketch.createVector(p5Sketch.int(this.gameWidth / 2), 0)
    );
    this.nextShape = this.shapeGenerator.getNewRandomShape(
      p5Sketch.createVector(p5Sketch.int(this.gameWidth / 2), 0)
    );
    this.heldShape = null;
    this.score = 0;
  }

  checkForTetris() {
    const fullLineIndexes = zip(...this.deadBlocksMatrix.matrix)
      .map((row, rowIndex) => ({ row, rowIndex }))
      .filter(({ row }) => row.every((block) => block))
      .map(({ rowIndex }) => rowIndex);
    this.linesToBeCleared.push(...fullLineIndexes);
    if (fullLineIndexes.length === 4) {
      this.justTetrised = true;
      this.timeSinceTetris = 0;
    }
  }

  checkForClearedLines() {
    const linesClearedThisShape = zip(...this.deadBlocksMatrix.matrix).filter(
      (row) => row.every((block) => block)
    ).length;
    zip(...this.deadBlocksMatrix.matrix).forEach((row, rowIndex) => {
      if (row.every((block) => block)) {
        this.score += 1;
        //deactivate row
        row.forEach((block) => block && (block.isDead = true));

        //for each row above the cleared row move them down
        for (
          let rowIndexToMoveDown = rowIndex - 1;
          rowIndexToMoveDown >= 0;
          rowIndexToMoveDown--
        ) {
          for (let i = 0; i < this.gameWidth; i++) {
            if (this.deadBlocksMatrix.matrix[i][rowIndexToMoveDown]) {
              this.deadBlocksMatrix.matrix[i][
                rowIndexToMoveDown
              ]!.gridPos.y += 1;
            }
            this.deadBlocksMatrix.matrix[i][rowIndexToMoveDown + 1] =
              this.deadBlocksMatrix.matrix[i][rowIndexToMoveDown];
            this.deadBlocksMatrix.matrix[i][rowIndexToMoveDown] = null;
          }
        }
      }
    });
    if (linesClearedThisShape > 0) {
      this.totalLineClears++;
    }
    if (linesClearedThisShape === 4) {
      this.totalTetrises++;
      this.justTetrised = true;
      this.timeSinceTetris = 0;
    }
  }

  moveShapeLeft() {
    this.moveShape(this.currentShape, -1, 0);
  }

  moveShapeRight() {
    this.moveShape(this.currentShape, 1, 0);
  }

  rotateShape() {
    this.rotateCurrentShape(this.currentShape);
  }

  draw() {
    // fill(0);

    // background(240);

    //draw a rectangle boarder around the whole thing
    p5Sketch.push();
    {
      p5Sketch.fill(240);
      p5Sketch.stroke(200);
      p5Sketch.strokeWeight(4);
      p5Sketch.rect(2, 2, canvas.width - 4, canvas.height - 4);
    }
    p5Sketch.pop();

    p5Sketch.push();
    {
      //translate so that the game is in the center of the canvas
      let gameWidthInPixels = this.gameWidth * BLOCK_SIZE;
      let gameHeightInPixels = this.gameHeight * BLOCK_SIZE;
      p5Sketch.translate(
        (canvas.width - gameWidthInPixels) / 2,
        (canvas.height - gameHeightInPixels) / 2
      );

      if (this.timeSinceTetris >= 2) {
        this.checkForClearedLines();
        this.justTetrised = false;
      } else {
        this.timeSinceTetris++;
      }

      //draw the grid
      this.drawGrid();
      //draw the blocks which have already been placed
      this.deadBlocks.forEach((block) =>
        block.draw(this.justTetrised, this.linesToBeCleared)
      );

      //draw Tetris font
      p5Sketch.textSize(30);
      p5Sketch.textAlign(p5Sketch.CENTER, p5Sketch.CENTER);
      p5Sketch.fill(100);
      p5Sketch.stroke(0);
      p5Sketch.strokeWeight(1);
      p5Sketch.text(
        `Score: ${this.score}\t\t Tetris Rate: ${(
          (this.totalTetrises / Math.max(1, this.totalLineClears)) *
          100
        ).toFixed(2)}%`,
        gameWidthInPixels / 2,
        -25
      );

      //draw the current shape
      this.currentShape.draw();

      //draw a rectangle boarder around the grid
      p5Sketch.push();
      {
        p5Sketch.noFill();
        p5Sketch.stroke(0);
        // if(this.justTetrised)
        //     stroke(255,0,0);
        p5Sketch.strokeWeight(4);
        p5Sketch.rect(
          0,
          0,
          this.gameWidth * BLOCK_SIZE,
          this.gameHeight * BLOCK_SIZE
        );
      }
      p5Sketch.pop();
    }
    p5Sketch.pop();

    this.drawNextShape();
    this.drawHeldShape();

    if (this.justTetrised) {
      p5Sketch.push();
      //draw Tetris
      p5Sketch.textSize(100);
      p5Sketch.textAlign(p5Sketch.CENTER, p5Sketch.CENTER);
      p5Sketch.fill(0, 0, 0);
      p5Sketch.stroke(255);
      p5Sketch.strokeWeight(10);
      // text("TETRIS", canvas.width/2, canvas.height/2);
      p5Sketch.pop();
    }
  }

  holdShape() {
    if (this.hasHeldThisShape) return;
    if (this.heldShape) {
      this.hasHeldThisShape = true;
      let temp = this.heldShape;
      this.heldShape = this.currentShape;
      this.heldShape.resetPosition();
      this.currentShape = temp;
      this.currentShape.resetPosition();
    } else {
      this.heldShape = this.currentShape;
      this.heldShape.resetPosition();
      this.currentShape = this.nextShape;
      this.nextShape = this.shapeGenerator.getNewRandomShape(
        p5Sketch.createVector(p5Sketch.int(this.gameWidth / 2), 0)
      );
    }
  }

  drawNextShape() {
    let gameWidthInPixels = this.gameWidth * BLOCK_SIZE;
    let gameHeightInPixels = this.gameHeight * BLOCK_SIZE;
    let gamePositionTopLeft = p5Sketch.createVector(
      (canvas.width - gameWidthInPixels) / 2,
      (canvas.height - gameHeightInPixels) / 2
    );

    let nextShapeWidthInPixels = 4 * BLOCK_SIZE;
    p5Sketch.push();
    {
      p5Sketch.translate(
        gamePositionTopLeft.x +
          gameWidthInPixels +
          gamePositionTopLeft.x / 2 -
          nextShapeWidthInPixels / 2,
        gamePositionTopLeft.y + 1 * BLOCK_SIZE
      );
      p5Sketch.fill(255);
      p5Sketch.stroke(0);
      p5Sketch.strokeWeight(4);
      p5Sketch.rect(0, 0, nextShapeWidthInPixels, nextShapeWidthInPixels);
      //Text
      p5Sketch.textSize(30);
      p5Sketch.textAlign(p5Sketch.CENTER, p5Sketch.CENTER);
      p5Sketch.fill(100);
      p5Sketch.stroke(0);
      p5Sketch.strokeWeight(1);
      p5Sketch.text("NEXT", nextShapeWidthInPixels / 2, -20);

      p5Sketch.translate(2 * BLOCK_SIZE, 2 * BLOCK_SIZE);
      p5Sketch.ellipse(0, 0, 10);
      this.nextShape.drawAtOrigin();

      p5Sketch.pop();
    }
  }

  drawHeldShape() {
    let gameWidthInPixels = this.gameWidth * BLOCK_SIZE;
    let gameHeightInPixels = this.gameHeight * BLOCK_SIZE;
    let gamePositionTopLeft = p5Sketch.createVector(
      (canvas.width - gameWidthInPixels) / 2,
      (canvas.height - gameHeightInPixels) / 2
    );

    let nextShapeWidthInPixels = 4 * BLOCK_SIZE;
    p5Sketch.push();
    {
      p5Sketch.translate(
        gamePositionTopLeft.x / 2 - nextShapeWidthInPixels / 2,
        gamePositionTopLeft.y + 1 * BLOCK_SIZE
      );
      p5Sketch.fill(255);
      p5Sketch.stroke(0);
      p5Sketch.strokeWeight(4);
      p5Sketch.rect(0, 0, nextShapeWidthInPixels, nextShapeWidthInPixels);
      //Text
      p5Sketch.textSize(30);
      p5Sketch.textAlign(p5Sketch.CENTER, p5Sketch.CENTER);
      p5Sketch.fill(100);
      p5Sketch.stroke(0);
      p5Sketch.strokeWeight(1);
      p5Sketch.text("HELD", nextShapeWidthInPixels / 2, -20);

      p5Sketch.translate(2 * BLOCK_SIZE, 2 * BLOCK_SIZE);
      if (this.heldShape) {
        this.heldShape.drawAtOrigin();
      }
      p5Sketch.pop();
    }
  }

  drawGrid() {
    p5Sketch.push();
    p5Sketch.noStroke();

    p5Sketch.fill(255);
    p5Sketch.rect(
      0,
      0,
      this.gameWidth * BLOCK_SIZE,
      this.gameHeight * BLOCK_SIZE
    );
    p5Sketch.stroke(200);
    // if(this.justTetrised){
    //     stroke(255,0,0);
    // }
    p5Sketch.strokeWeight(1);
    [...Array(this.gameWidth)].forEach((_, index) =>
      p5Sketch.line(
        index * BLOCK_SIZE,
        0,
        index * BLOCK_SIZE,
        this.gameHeight * BLOCK_SIZE
      )
    );
    [...Array(this.gameHeight)].forEach((_, index) =>
      p5Sketch.line(
        0,
        index * BLOCK_SIZE,
        this.gameWidth * BLOCK_SIZE,
        index * BLOCK_SIZE
      )
    );

    p5Sketch.pop();
  }
}
