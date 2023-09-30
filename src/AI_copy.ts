import p5 from "p5";
import { BLOCK_SIZE, canvas, p5Sketch } from "./sketch";
import { Shape } from "./Shape";
import { BlockMatrix } from "./BlockMatrix";
import { MoveHistory } from "./MoveHistory";
import { CheckedPositionsArray } from "./CheckedPositionsArray";
import { uniqWith } from "lodash";
import { Game } from "./Game";

class AI {
  checkedPositionsArray: CheckedPositionsArray;
  game: Game;
  possibleEndPositions: Shape[] = [];
  chosenEndPosition: Shape | null = null;
  movementPlan = new MoveHistory();
  //this shit is for showing all the current moves
  endPosCounter = 0;

  constructor(game: Game) {
    this.game = game;
    this.checkedPositionsArray = new CheckedPositionsArray(
      new BlockMatrix(game.gameWidth, game.gameHeight)
    );
  }

  resetCheckedPositions() {
    this.checkedPositionsArray.setAllPositionsToFalse();
  }

  showPossibleMoveNo(moveNo: number) {
    if (moveNo >= this.possibleEndPositions.length) {
      return;
    }
    p5Sketch.push();
    {
      //translate so that the game is in the center of the canvas
      let gameWidthInPixels = this.game.gameWidth * BLOCK_SIZE;
      let gameHeightInPixels = this.game.gameHeight * BLOCK_SIZE;
      p5Sketch.translate(
        (canvas.width - gameWidthInPixels) / 2,
        (canvas.height - gameHeightInPixels) / 2
      );
      for (let block of this.possibleEndPositions[moveNo].blocks) {
        block.color = p5Sketch.color(0, 0, 0, 0);
      }
      this.possibleEndPositions[moveNo].draw();
      p5Sketch.pop();
    }
  }

  //probs get rid of this
  showAllEndPositionPaths() {
    this.endPosCounter = 0;
  }

  showBestMove() {
    if (this.chosenEndPosition != null) {
      p5Sketch.push();
      {
        //translate so that the game is in the center of the canvas
        let gameWidthInPixels = this.game.gameWidth * BLOCK_SIZE;
        let gameHeightInPixels = this.game.gameHeight * BLOCK_SIZE;
        p5Sketch.translate(
          (canvas.width - gameWidthInPixels) / 2,
          (canvas.height - gameHeightInPixels) / 2
        );
        for (let block of this.chosenEndPosition.blocks) {
          block.color = p5Sketch.color(0, 0, 0, 0);
        }
        this.chosenEndPosition.draw();
        p5Sketch.pop();
      }
    }
  }

  calculateTotalWorldHoles(shape: Shape, blockMatrix: BlockMatrix) {
    //clone the block matrix
    const clonedBlockMatrix = blockMatrix.clone();

    //add the shape to the block matrix
    clonedBlockMatrix.addShapeToMatrix(shape);

    //clear required lines
    clonedBlockMatrix.clearFullRows();

    //count holes
    //holes are blank spaces with a block above it.
    let holeCount = clonedBlockMatrix.countHoles();

    return holeCount;
  }

  calculateHoles(shape: Shape) {
    let blockPositions = [];
    let holeCounter = 0;
    for (let block of shape.blocks) {
      blockPositions.push(p5.Vector.add(shape.currentPos, block.gridPos));
    }

    for (let pos of blockPositions) {
      let posBelow = p5Sketch.createVector(
        p5Sketch.round(pos.x),
        p5Sketch.round(pos.y + 1)
      );
      if (this.game.isPositionVacant(posBelow)) {
        let isInCurrentShape = false;
        for (let pos2 of blockPositions) {
          if (pos2.equals(posBelow)) {
            isInCurrentShape = true;
            break;
          }
        }
        if (!isInCurrentShape) {
          holeCounter++;
        }
      }
    }
    return holeCounter;
  }

  calculateShapeCost(shape: Shape, blockMatrix: BlockMatrix) {
    // let holeCountMultiplier = 100;
    let holeCountMultiplier = 100;
    let shapeHeightMultiplier = 1;
    // let shapeHeightMultiplier = 0;
    let pillarCountMultiplier = 2;
    // let pillarCountMultiplier = 0;
    //let gridHeightMultiplier = 1;

    let noneLineShapeInRightMostLaneMultiplier = 1;

    let holeCount = this.calculateTotalWorldHoles(shape, blockMatrix);
    let shapeHeight = this.game.gameHeight - shape.currentPos.y;

    let pillarCount = this.countNumberAndHeightOfPillars(shape, blockMatrix);
    // let noneLineBlocksInRightmostLaneCount = shape.shapeID.name === "Line" ? 0 : this.countNumberOfBlocksInRightmostLane(shape);

    let costOfShape =
      holeCount * holeCountMultiplier +
      shapeHeight * shapeHeightMultiplier +
      pillarCount * pillarCountMultiplier;
    // noneLineBlocksInRightmostLaneCount + noneLineShapeInRightMostLaneMultiplier;
    return costOfShape;
  }

  //Given the state of the matrix returns a string of instructions to get the block into position.
  calculateMovementPlan() {
    //clone all the input so we dont fuck it up
    let currentShape = this.game.currentShape.clone();
    let heldShape = this.game.heldShape ? this.game.heldShape.clone() : null;
    let nextShape = this.game.nextShape.clone();
    let blockMatrix = this.game.deadBlocksMatrix.clone();

    let bestEndPositionForCurrentShape = this.getBestEndPosition(
      currentShape,
      blockMatrix
    );

    //check held piece and see if thats better

    //if there is no held shape then check the next shape instead
    let bestEndPositionForHeld = heldShape
      ? this.getBestEndPosition(heldShape, blockMatrix)
      : this.getBestEndPosition(nextShape, blockMatrix);

    //choose the piece with the best shape cost
    if (
      bestEndPositionForCurrentShape.shapeCost <=
      bestEndPositionForHeld.shapeCost
    ) {
      this.chosenEndPosition = bestEndPositionForCurrentShape.bestShape;
    } else {
      this.chosenEndPosition = bestEndPositionForHeld.bestShape;
      this.chosenEndPosition.moveHistory.addHoldMove();
    }

    this.movementPlan = this.chosenEndPosition.moveHistory.clone();
  }
  //Given the state of the matrix returns a string of instructions to get the block into position.
  calculateMovementPlanByConsideringNextShape() {
    //clone all the input so we dont fuck it up
    let currentShape = this.game.currentShape.clone();
    let heldShape = this.game.heldShape ? this.game.heldShape.clone() : null;
    let nextShape = this.game.nextShape.clone();
    let blockMatrix = this.game.deadBlocksMatrix.clone();

    //populate the array with falses since we haven't found any yet
    this.resetCheckedPositions();
    this.resetPossibleEndPositions();

    // this.calculateShortestPathsToAllEndPositions(startingShape);

    //since some shape can look the same when rotated we need to remove repeats
    this.possibleEndPositions = uniqWith(
      this.possibleEndPositions,
      (firstShape, secondShape) => firstShape.isOverlapping(secondShape)
    );

    //now lets count all the holes for each shape option and pick the lowest hole count
    let minShapeCost = 100000;
    let minShapeCostIndex = 0;
    for (let i = 0; i < this.possibleEndPositions.length; i++) {
      let shapeCost = this.calculateShapeCost(
        this.possibleEndPositions[i],
        blockMatrix
      );
      if (shapeCost < minShapeCost) {
        minShapeCost = shapeCost;
        minShapeCostIndex = i;
      }
    }

    return {
      bestShape: this.possibleEndPositions[minShapeCostIndex],
      shapeCost: minShapeCost,
    };

    //---------------------
    // old shit

    let bestEndPositionForCurrentShape = this.getBestEndPosition(
      currentShape,
      blockMatrix
    );

    //check held piece and see if thats better

    //if there is no held shape then check the next shape instead
    let bestEndPositionForHeld = heldShape
      ? this.getBestEndPosition(heldShape!, blockMatrix)
      : this.getBestEndPosition(nextShape, blockMatrix);

    //choose the piece with the best shape cost
    if (
      bestEndPositionForCurrentShape.shapeCost <=
      bestEndPositionForHeld.shapeCost
    ) {
      this.chosenEndPosition = bestEndPositionForCurrentShape.bestShape;
    } else {
      this.chosenEndPosition = bestEndPositionForHeld.bestShape;
      this.chosenEndPosition!.moveHistory.addHoldMove();
    }

    this.movementPlan = this.chosenEndPosition!.moveHistory.clone();
  }

  getBestEndPosition(startingShape: Shape, blockMatrix: BlockMatrix) {
    //populate the array with falses since we haven't found any yet
    this.resetCheckedPositions();
    this.resetPossibleEndPositions();

    //so now we need to run a loop to hit all the possible positions
    // this.checkAllPositionsReachableFrom(currentShape);
    this.calculateShortestPathsToAllEndPositions(startingShape);

    //since some shape can look the same when rotated we need to remove repeats
    this.possibleEndPositions = uniqWith(
      this.possibleEndPositions,
      (firstShape, secondShape) => firstShape.isOverlapping(secondShape)
    );

    //now lets count all the holes for each shape option and pick the lowest hole count
    const endPositionsWithCosts = this.possibleEndPositions.map(
      (endPosition) => ({
        endPosition,
        cost: this.calculateShapeCost(endPosition, blockMatrix),
      })
    );

    const minShapeCost = Math.min(
      ...endPositionsWithCosts.map(({ cost }) => cost)
    );

    const shapeWithMinCost = endPositionsWithCosts.find(
      ({ cost }) => cost === minShapeCost
    )!.endPosition;

    return {
      bestShape: shapeWithMinCost,
      shapeCost: minShapeCost,
    };
  }

  getNextMove() {
    if (this.movementPlan.moveHistoryList.length > 0) {
      //if all the remaining moves are downs then snap it down

      if (
        this.movementPlan.moveHistoryList.every(
          (movement) => movement === "DOWN"
        )
      ) {
        return "ALL DOWN";
      }
      return this.movementPlan.moveHistoryList.shift()!;
    } else {
      return "DOWN";
    }
  }

  getShapeIndexFields(shape: Shape) {
    return [
      shape.currentPos.x,
      shape.currentPos.y,
      shape.currentRotationCount % 4,
    ];
  }

  hasShapesPositionBeenChecked(shape: Shape) {
    const [x, y, r] = this.getShapeIndexFields(shape);
    return this.checkedPositionsArray.hasPositionBeenChecked(x, y, r);
  }

  setCheckedPositionsArrayValueAtShapesPosition(shape: Shape, value: boolean) {
    const [x, y, r] = this.getShapeIndexFields(shape);
    this.checkedPositionsArray.setCheckedPositionsArrayValue(x, y, r, value);
  }

  checkInDirection(
    queue: Shape[],
    shape: Shape,
    x: number,
    y: number,
    r?: number
  ) {
    if (r && this.game.canRotateShape(shape)) {
      let rotatedShape = shape.clone();
      this.game.rotateCurrentShape(rotatedShape);

      if (!this.hasShapesPositionBeenChecked(rotatedShape)) {
        this.setCheckedPositionsArrayValueAtShapesPosition(rotatedShape, true);
        queue.push(rotatedShape);
      }
    } else {
      if (this.game.canMoveShapeInDirection(shape, x, y)) {
        let movedShape = shape.clone();
        this.game.moveShape(movedShape, x, y);

        if (!this.hasShapesPositionBeenChecked(movedShape)) {
          this.setCheckedPositionsArrayValueAtShapesPosition(movedShape, true);
          queue.push(movedShape);
        }
      }
    }
  }

  calculateShortestPathsToAllEndPositions(startingShape: Shape) {
    let counter = 0;

    let queue = [];
    queue.push(startingShape);
    while (queue.length > 0) {
      counter++;
      //grab a shape off the front of the queue
      let shape = queue.splice(0, 1)[0];

      //if the shape cannot move down then it is a possible end position
      if (!this.game.canMoveShapeDown(shape)) {
        this.possibleEndPositions.push(shape.clone());
      }

      //check if you can move this shape in each way, if you can move it then add it to the back of the queue

      this.checkInDirection(queue, shape, -1, 0); //check left
      this.checkInDirection(queue, shape, 1, 0); //check right
      this.checkInDirection(queue, shape, 0, 0, 1); //check rotation
      this.checkInDirection(queue, shape, 0, 1); //check down
    }

    p5Sketch.print("counter is " + counter);
  }

  checkInDirection2(startingShape: Shape, x: number, y: number, r?: number) {
    if (r && this.game.canRotateShape(startingShape)) {
      let rotatedShape = startingShape.clone();
      this.game.rotateCurrentShape(rotatedShape);
      if (!this.hasShapesPositionBeenChecked(rotatedShape)) {
        this.setCheckedPositionsArrayValueAtShapesPosition(rotatedShape, true);
        this.checkAllPositionsReachableFrom(rotatedShape);
      }
    } else {
      if (this.game.canMoveShapeInDirection(startingShape, x, y)) {
        let movedShape = startingShape.clone();
        this.game.moveShape(movedShape, x, y);

        if (!this.hasShapesPositionBeenChecked(movedShape)) {
          this.setCheckedPositionsArrayValueAtShapesPosition(movedShape, true);
          this.checkAllPositionsReachableFrom(movedShape);
        }
      }
    }
  }

  checkAllPositionsReachableFrom(startingShape: Shape) {
    if (!this.game.canMoveShapeDown(startingShape)) {
      this.possibleEndPositions.push(startingShape.clone());
    }

    this.checkInDirection2(startingShape, 0, 1);
    this.checkInDirection2(startingShape, -1, 0);
    this.checkInDirection2(startingShape, 1, 0);
    this.checkInDirection2(startingShape, 0, 0, 1);
  }

  resetPossibleEndPositions() {
    this.possibleEndPositions = [];
  }

  //a pillar is an area which is reliant on a line piece, i.e. a formation of 3 or more blocks high with and empty space next to each
  //note will probably allow it for pillars on the right side so you can get some sweet tetrises
  countNumberAndHeightOfPillars(shape: Shape, blockMatrix: BlockMatrix) {
    let clonedBlockMatrix = blockMatrix.clone();

    clonedBlockMatrix.addShapeToMatrix(shape);

    //clear required lines
    clonedBlockMatrix.clearFullRows();

    //count pillars
    clonedBlockMatrix.countPillars();

    return clonedBlockMatrix.pillarCount;
  }

  countNumberOfBlocksInRightmostLane(shape: Shape) {
    return shape.blocks
      .map((block) => p5.Vector.add(shape.currentPos, block.gridPos))
      .filter((blockPosition) => blockPosition.x === this.game.gameWidth - 1)
      .length;
  }
}

//todo: optimise to reduce the number of bubbles in the whole map instead of just directly below
//todo: if the next piece is the same as the held piece and you can add the held piece then fuckin do it
//todo: potential look ahead (gonna be very brute forcy) to see where the next position goes
//todo: reduce the number of large pillars of blank space
//todo: kinda stop the pieces from being put ontop of holes, so you have to spend less time digging them out
//todo: optimise for how many pieces the map can accomidate for.
//todo: optimise for minimising the average height of shit i guess
//todo: kinda hard code strategy
