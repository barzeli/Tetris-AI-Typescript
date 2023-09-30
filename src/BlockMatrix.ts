import p5 from "p5";
import { MoveHistory } from "./MoveHistory";
import { p5Sketch } from "./sketch";
import { Block } from "./Block";
import { Shape } from "./Shape";
import { Brain } from "./Brain";
import { zip } from "lodash";

export class BlockMatrix {
  width: number;
  height: number;

  matrix: (Block | null)[][] = [];

  holeCount = 0;
  openHoleCount = 0;
  blocksAboveHoles = 0;
  pillarCount = 0;
  addedShapeHeight = 0;
  maximumLineHeight = 0;
  bumpiness = 0;

  linesCleared = 0;

  cost = 0; //the cost of this matrix essentially how bad it is, determined by the number of holes and added shape height,
  movementHistory = new MoveHistory(); //the movements required to reach this block matrix, usually is empty

  blocksInRightLane: number = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;

    this.resetMatrix();
  }

  addMovementHistory(movementHistory: MoveHistory) {
    this.movementHistory = movementHistory.clone();
  }

  //returns a copy of the block matrix
  clone() {
    let clone = new BlockMatrix(this.width, this.height);

    //clone the matrix
    clone.matrix = this.matrix.map((column) =>
      column.map((block) => (block ? block.clone() : null))
    );

    clone.holeCount = this.holeCount;
    clone.pillarCount = this.pillarCount;

    return clone;
  }

  //returns a copy of the block matrix
  copyFromMatrix(matrixToCopyFrom: (Block | null)[][]) {
    //clone the matrix
    this.matrix = matrixToCopyFrom.map((column) =>
      column.map((block) => (block ? block.clone() : null))
    );
  }

  //resets the matrix to all nulls and creates the matrix from scratch
  resetMatrix() {
    this.matrix = [...Array(this.width)].map((_) =>
      [...Array(this.height)].map((_) => null)
    );
  }

  //adds the parameter shape to the matrix
  //DOES NOT CLEAR LINES
  addShapeToMatrix(shape: Shape) {
    //add the shape to the block matrix
    shape.blocks.forEach((block) => {
      //the block becomes disconnected from the shape and therefore the current grid position is no longer relative to the shape
      let newPosition = p5.Vector.add(block.currentGridPos, shape.currentPos);
      this.matrix[newPosition.x][newPosition.y] = block.clone();
    });

    this.addedShapeHeight = this.height - shape.currentPos.y;
  }

  calculateMaximumLineHeight() {
    //going down each column look for a block and then add its height to the total
    this.maximumLineHeight = Math.max(
      ...this.matrix.map((column) => this.getLineHeight(column))
    );
  }

  isPositionVacant(position: p5.Vector) {
    //check the position is within the matrix, for example -1,4 is not in the matrix and therefore is not vacant
    if (
      position.y >= 0 &&
      position.y < this.height &&
      position.x >= 0 &&
      position.x < this.width
    ) {
      //if the position is null then its vacant
      if (this.matrix[position.x][position.y] === null) {
        return true;
      }
    }

    //if the position is out of bounds or has a block in its place then return false
    return false;
  }

  //Checks for cleared rows and removes them
  clearFullRows() {
    this.linesCleared = 0;
    for (let j = 0; j < this.height; j++) {
      //check if this row has been cleared
      let rowCleared = true;
      for (let i = 0; i < this.width; i++) {
        if (this.matrix[i][j] == null) {
          rowCleared = false;
          break;
        }
      }

      //if it has them remove it and move all layers above it down.
      if (rowCleared) {
        this.linesCleared++;
        //for each row above the cleared row move them down
        for (
          let rowIndexToMoveDown = j - 1;
          rowIndexToMoveDown >= 0;
          rowIndexToMoveDown--
        ) {
          //for each row above the to be removed row
          for (let i = 0; i < this.width; i++) {
            //for each block in that row

            //if its not null then change the position of the block
            if (this.matrix[i][rowIndexToMoveDown]) {
              this.matrix[i][rowIndexToMoveDown]!.currentGridPos.y += 1;
            }

            //move this block into the lower row and set the blocks previous row position to null
            this.matrix[i][rowIndexToMoveDown + 1] =
              this.matrix[i][rowIndexToMoveDown];
            this.matrix[i][rowIndexToMoveDown] = null;
          }
        }
      }
    }
  }

  printMatrix() {
    const printString = zip(...this.matrix)
      .map((row) => row.map((block) => (block ? "X" : " ")).join(""))
      .join("\n");
    p5Sketch.print(printString);
  }

  //counts the number of holes in the matrix
  countHoles() {
    this.blocksAboveHoles = this.matrix.reduce(
      (sum, column) =>
        sum +
        column
          .slice(
            column.findIndex((block) => block) >= 0
              ? column.findIndex((block) => block)
              : column.length
          )
          .filter(
            (block, index, blocksBelow) =>
              block && blocksBelow.findIndex((block) => !block) > index
          ).length,
      0
    );

    this.holeCount = 0;
    this.openHoleCount = 0;
    //an open hole is one which isnt fully covered, like there isnt a block to the left or right,
    //open holes are less bad than normal holes because you can slip a piece in there.
    //actually an open hole needs 2 spots to a side to be able to be filled.

    // this.blocksAboveHoles = 0;

    for (let i = 0; i < this.width; i++) {
      //going down each column look for a block and once found each block below is a hole
      let blockFound = false;
      // let numberOfBlocksFound = 0;
      for (let j = 0; j < this.height; j++) {
        if (this.matrix[i][j] != null) {
          blockFound = true;
          // numberOfBlocksFound++;
        } else if (blockFound) {
          // this.blocksAboveHoles += numberOfBlocksFound;

          if (i < this.width - 2) {
            //check if there is 2 spaces to the right
            if (
              this.matrix[i + 1][j] === null &&
              this.matrix[i + 2][j] === null
            ) {
              // this is not a full hole this is an open hole
              // wait not yet, if the hole has a free block next to it and a free block below that, then it is a proper hole because you cannot fill this hole without creating a proper hole
              if (j === this.height - 1 || this.matrix[i + 1][j + 1] != null) {
                //if were on the bottom layer or the block 1 to the right and 1 down is a block, then we chill
                this.openHoleCount++;
                continue;
              }
            }
          }

          if (i >= 2) {
            //check to the left
            if (
              this.matrix[i - 1][j] === null &&
              this.matrix[i - 2][j] === null
            ) {
              // this is not a full hole this is an open hole
              // wait not yet, if the hole has a free block next to it and a free block below that, then it is a proper hole because you cannot fill this hole without creating a proper hole
              if (j === this.height - 1 || this.matrix[i - 1][j + 1] != null) {
                //if were on the bottom layer or the block 1 to the left and 1 down is a block, then we chill
                this.openHoleCount++;
                continue;
              }
            }
          }

          //if reached this point then the hole is a full hole
          //sad
          this.holeCount++;
        }
      }
    }
  }

  //count the number and height of each pillar, a pillar of 3 is worth 1, a pillar of 4 is worth 2, 5 si 3 etc.
  countPillars() {
    //count pillars
    this.pillarCount = 0;

    for (let i = 0; i < this.width; i++) {
      //going up each column look for 3 blocks in a row with nothing to the left or the right
      let currentPillarHeightL = 0;
      let currentPillarHeightR = 0;
      for (let j = this.height - 1; j >= 0; j--) {
        //First we look to the left

        //if this positions has a block and there is no block to the left then this is potentially part of a pillar
        if (
          i > 0 &&
          this.matrix[i][j] != null &&
          this.matrix[i - 1][j] === null
        ) {
          currentPillarHeightL++;
        } else {
          //if the current pillar height is >=3 then we have found a pillar, yay
          if (currentPillarHeightL >= 3) {
            //pillar count is 1 for a 3 height pillar 2 for a 4 height pillar ect.

            this.pillarCount += currentPillarHeightL;
          }
          currentPillarHeightL = 0;
        }

        //check to the right
        //note dont check the spot 2 spots back from the right because we want them tetrises
        if (
          i < this.width - 2 &&
          this.matrix[i][j] != null &&
          this.matrix[i + 1][j] === null
        ) {
          currentPillarHeightR++;
        } else {
          //if the current pillar height is >=3 then we have found a pillar, yay
          if (currentPillarHeightR >= 3) {
            this.pillarCount += currentPillarHeightR;
          }
          currentPillarHeightR = 0;
        }
      }
      if (currentPillarHeightL >= 3) {
        this.pillarCount += currentPillarHeightL;
      }
      if (currentPillarHeightR >= 3) {
        this.pillarCount += currentPillarHeightR;
      }
    }
  }

  countNumberOfBlocksInRightmostLane() {
    //going down each column look for a block and once found each block below is a hole
    this.blocksInRightLane = this.matrix[this.width - 1].filter(
      (block) => block
    ).length;
  }

  getLineHeight(line: (Block | null)[]) {
    const firstBlockIndex = line.findIndex((block) => block);
    return firstBlockIndex >= 0 ? this.height - firstBlockIndex : 0;
  }

  calculateBumpiness() {
    //bumpiness is defined as the total difference between column heights
    //note dont care about final row
    this.bumpiness = this.matrix.reduce(
      (sum, column, index, matrix) =>
        sum +
        (index === 0
          ? 0
          : Math.abs(
              this.getLineHeight(column) - this.getLineHeight(matrix[index - 1])
            )),
      0
    );
  }

  //assumes a shape has been added, the lines have been cleared, the holes are counted and the pillars are counted
  calculateCost(brain?: Brain) {
    if (brain) {
      this.cost = brain.getCostOfMatrix(this);
      return;
    }

    let holeCountMultiplier = 100;
    let openHoleCountMultiplier = 70;

    let maximumLineHeightMultiplier = 0;
    let addedShapeHeightMultiplier = 1;
    let pillarCountMultiplier = 4;
    let blocksInRightMostLaneMultiplier = 10;
    let nonTetrisClearPenalty = 20;
    let blocksAboveHolesMultiplier = 5;
    let bumpinessMultiplier = 5;
    let tetrisRewardMultiplier = -10; //negative because it reduces cost

    let linesClearedWhichArentTetrises =
      this.linesCleared > 0 && this.linesCleared < 4 ? 1 : 0;
    let tetrises = this.linesCleared === 4 ? 1 : 0;

    //if shit aint going great then stop trying to tetris shit
    if (
      this.maximumLineHeight > 10 ||
      this.holeCount > 0 ||
      this.pillarCount > 10
    ) {
      nonTetrisClearPenalty = 0;
      maximumLineHeightMultiplier = 1;
    }
    this.cost =
      this.holeCount * holeCountMultiplier +
      this.openHoleCount * openHoleCountMultiplier +
      this.blocksAboveHoles * blocksAboveHolesMultiplier +
      linesClearedWhichArentTetrises * nonTetrisClearPenalty +
      tetrises * tetrisRewardMultiplier +
      this.maximumLineHeight * maximumLineHeightMultiplier +
      this.addedShapeHeight * addedShapeHeightMultiplier +
      this.pillarCount * pillarCountMultiplier +
      this.blocksInRightLane * blocksInRightMostLaneMultiplier +
      this.bumpiness * bumpinessMultiplier;
  }
}

//ok so whats the plan for today, lets go like ummmmm fuck what am i doing lets think,
// 1. make the different hole types worth different amounts for example a hole with an opening is better than a hole which is enclosed.
// 2. punish pieces which bury holes deeper, so add a thing to calculate cost which is like pieces over hole.
// ok lets go
