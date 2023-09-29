import { Shape } from "./Shape";
import { ShapeGenerator } from "./ShapeGenerator";
import { BLOCK_SIZE, canvas, p5Sketch } from "./sketch";

export class Game {
  gameWidth: any;
  gameHeight: any;

  justTetrised: any;

  shapeGenerator = new ShapeGenerator();
  deadBlocks: any[] = [];
  deadBlocksMatrix: any[][] = [];

  heldShape: any = null;
  hasHeldThisShape = false;
  score = 0;

  //calculate the tetris rate
  totalLineClears = 0;
  totalTetrises = 0;
  timeSinceTetris = 10;
  needsNewMovementPlan = false;

  isDead = false;

  linesToBeCleared: any[] = [];
  currentShape: Shape;
  nextShape: Shape;

  constructor(gameWidth: any, gameHeight: any) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;

    this.currentShape = this.shapeGenerator.getNewRandomShape(
      p5Sketch.createVector(p5Sketch.int(this.gameWidth / 2), 0),
      this
    );
    this.resetBlocksMatrix();
    this.nextShape = this.shapeGenerator.getNewRandomShape(
      p5Sketch.createVector(p5Sketch.int(this.gameWidth / 2), 0),
      this
    );
  }

  resetBlocksMatrix() {
    this.deadBlocksMatrix = [];
    for (let i = 0; i < this.gameWidth; i++) {
      let column = [];
      for (let j = 0; j < this.gameHeight; j++) {
        column.push(null);
      }
      this.deadBlocksMatrix.push(column);
    }
  }

  moveShapeDown(resetAfterShapeDeath?: any) {
    this.currentShape.moveDown(resetAfterShapeDeath);

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
        p5Sketch.createVector(p5Sketch.int(this.gameWidth / 2), 0),
        this
      );
      this.needsNewMovementPlan = true;

      //if the new block is stuck then the game resets
      if (!this.currentShape.canMoveInDirection(0, 0) || this.score > 500) {
        this.isDead = true;
        // this.resetGame();
      }
    }
  }

  getTetrisRate() {
    return (this.totalTetrises / Math.max(1, this.totalLineClears)) * 100;
  }

  resetGame() {
    this.resetBlocksMatrix();
    this.deadBlocks = [];
    this.currentShape = this.shapeGenerator.getNewRandomShape(
      p5Sketch.createVector(p5Sketch.int(this.gameWidth / 2), 0),
      this
    );
    this.nextShape = this.shapeGenerator.getNewRandomShape(
      p5Sketch.createVector(p5Sketch.int(this.gameWidth / 2), 0),
      this
    );
    this.heldShape = null;
    this.score = 0;
  }

  checkForTetris() {
    let linesClearedThisShape = 0;
    for (let j = 0; j < this.gameHeight; j++) {
      let rowCleared = true;
      for (let i = 0; i < this.gameWidth; i++) {
        if (this.deadBlocksMatrix[i][j] == null) {
          rowCleared = false;
          break;
        }
      }
      if (rowCleared) {
        this.linesToBeCleared.push(j);
        linesClearedThisShape++;
      }
    }
    if (linesClearedThisShape === 4) {
      this.justTetrised = true;
      this.timeSinceTetris = 0;
    }
  }

  checkForClearedLines() {
    let linesClearedThisShape = 0;
    for (let j = 0; j < this.gameHeight; j++) {
      let rowCleared = true;
      for (let i = 0; i < this.gameWidth; i++) {
        if (this.deadBlocksMatrix[i][j] == null) {
          rowCleared = false;
          break;
        }
      }
      if (rowCleared) {
        this.score += 1;
        linesClearedThisShape++;
        //deactivate row
        for (let i = 0; i < this.gameWidth; i++) {
          this.deadBlocksMatrix[i][j].isDead = true;
        }

        //for each row above the cleared row move them down
        for (
          let rowIndexToMoveDown = j - 1;
          rowIndexToMoveDown >= 0;
          rowIndexToMoveDown--
        ) {
          for (let i = 0; i < this.gameWidth; i++) {
            if (this.deadBlocksMatrix[i][rowIndexToMoveDown] !== null) {
              this.deadBlocksMatrix[i][
                rowIndexToMoveDown
              ].currentGridPos.y += 1;
            }
            this.deadBlocksMatrix[i][rowIndexToMoveDown + 1] =
              this.deadBlocksMatrix[i][rowIndexToMoveDown];
            this.deadBlocksMatrix[i][rowIndexToMoveDown] = null;
          }
        }
      }
    }
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
    this.currentShape.moveShape(-1, 0);
  }

  moveShapeRight() {
    this.currentShape.moveShape(1, 0);
  }

  rotateShape() {
    this.currentShape.rotateShape(true);
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
      for (let block of this.deadBlocks) {
        block.draw(this.justTetrised, this.linesToBeCleared);
      }

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
        p5Sketch.createVector(p5Sketch.int(this.gameWidth / 2), 0),
        this
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
    for (let i = 0; i < this.gameWidth; i++) {
      p5Sketch.line(
        i * BLOCK_SIZE,
        0,
        i * BLOCK_SIZE,
        this.gameHeight * BLOCK_SIZE
      );
    }
    for (let j = 0; j < this.gameHeight; j++) {
      p5Sketch.line(
        0,
        j * BLOCK_SIZE,
        this.gameWidth * BLOCK_SIZE,
        j * BLOCK_SIZE
      );
    }
    p5Sketch.pop();
  }

  isPositionVacant(position: any) {
    //if the position is within the grid of the game
    if (
      position.y >= -2 &&
      position.y < this.gameHeight &&
      position.x >= 0 &&
      position.x < this.gameWidth
    ) {
      //if the position is not null in the matrix
      if (this.deadBlocksMatrix[position.x][position.y] != null) {
        return false;
      }
    } else {
      return false;
    }
    return true;
  }
}
