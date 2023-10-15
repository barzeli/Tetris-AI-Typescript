import { BlockMatrix } from "./BlockMatrix";
import { MoveHistory } from "./MoveHistory";
import { CheckedPositionsArray } from "./CheckedPositionsArray";
import { Shape } from "./Shape";
import { Brain } from "./Brain";
import { Game } from "./Game";
import { uniqWith } from "lodash";

export class AI {
  movementPlan = new MoveHistory();
  game: Game;
  brain: Brain;
  chosenEndPosition: Shape | null = null;

  constructor(game: Game, brain: Brain) {
    this.game = game;
    this.brain = brain;
  }

  //Main function
  //Given the state of the matrix returns a string of instructions to get the block into position.
  calculateMovementPlan() {
    //clone all the input so we dont fuck it up
    const currentShape = this.game.currentShape.clone();
    const heldShape = this.game.heldShape ? this.game.heldShape.clone() : null;
    const nextShape = this.game.nextShape.clone();

    const blockMatrix = this.game.deadBlocksMatrix.clone();

    const bestEndPositionForCurrentShape = this.getBestEndPosition(
      currentShape,
      blockMatrix
    );

    //check held piece and see if thats better

    //if there is no held shape then check the next shape instead
    const bestEndPositionForHeld = this.getBestEndPosition(
      heldShape ?? nextShape,
      blockMatrix
    );

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

    this.movementPlan = this.chosenEndPosition.moveHistory;
  }

  //ok so this ones going to look at the next shape to see what were working with
  calculateMovementPlan2() {
    //clone all the input so we dont fuck it up
    const currentShape = this.game.currentShape.clone();
    const heldShape = this.game.heldShape ? this.game.heldShape.clone() : null;
    const nextShape = this.game.nextShape.clone();
    const blockMatrix = this.game.deadBlocksMatrix.clone();

    //first we get all the possible end positions for the current and held pieces

    const endPositionsForCurrentShape = this.getAllEndPositions(
      currentShape,
      blockMatrix
    );
    const possibleEndBlockMatricesForCurrentShape =
      this.convertEndPositionsToMatrices(
        endPositionsForCurrentShape,
        blockMatrix,
        false
      );

    const endPositionsForHeldShape = this.getAllEndPositions(
      heldShape ?? nextShape,
      blockMatrix
    );

    const possibleEndBlockMatricesForHeldShape =
      this.convertEndPositionsToMatrices(
        endPositionsForHeldShape,
        blockMatrix,
        true
      );

    const allPossibleEndBlockMatrices = [
      ...possibleEndBlockMatricesForCurrentShape,
      ...possibleEndBlockMatricesForHeldShape,
    ];

    //so heres what im thinking, we remove all end positions apart from those which have the minimum number of holes,
    //so if there are 3 positions with only 1 hole and thats the minimum we remove all but those 3.
    //after that we take each resulting block matrix and generate all the posible end positions of the next shape on each matrix,
    //the one with the smallest cost is chosen.

    //this will do for now but there is the possibility of checking all combinations of next piece, current piece, and held piece.
    //e.g. we could do: current -> held, current -> next, held -> next, held ->current. and we check all of these for the best possible outcome then we chill
    //this will double the processing time because we are currently only doing current -> next and held -> next

    //get the minimum number of holes in the matrices

    const minNumberOfHoles = Math.min(
      ...allPossibleEndBlockMatrices.map(
        (endBlockMatrix) => endBlockMatrix.holeCount
      )
    );

    //now add all matrices which  have the min number of holes to a new list
    const minHoleMatrices = allPossibleEndBlockMatrices.filter(
      (endBlockMatrix) => endBlockMatrix.holeCount === minNumberOfHoles
    );
    // minHoleMatrices.forEach(() => {
    //   p5.print(`matrix no: ${index}`);
    //   endBlockMatrix.printMatrix();
    // });

    //ok now we run the next piece over each of these and then get the cost and the winner is chosen

    //actually heres the plan, all we want to do is remove all matrices which force the next piece to produce a hole

    const matricesAfterHoleRemoval = minHoleMatrices.map((minHoleMatrix) => {
      const bestEndPositionData = this.getBestEndPosition(
        nextShape,
        minHoleMatrix
      );
      const tempMatrix = minHoleMatrix.clone();
      tempMatrix.addShapeToMatrix(bestEndPositionData.bestShape);
      tempMatrix.clearFullRows();
      tempMatrix.countHoles();
      return tempMatrix;
    });

    const minNumberOfHolesAfterHoleRemoval = Math.min(
      ...matricesAfterHoleRemoval.map(
        (endBlockMatrix) => endBlockMatrix.holeCount
      )
    );

    const minNextPieceHoleMatrices = matricesAfterHoleRemoval.filter(
      (endBlockMatrix) =>
        endBlockMatrix.holeCount === minNumberOfHolesAfterHoleRemoval
    );
    // minHoleMatricesAfterHoleRemoval.forEach(() => {
    //   p5.print(`matrix no: ${index}`);
    //   endBlockMatrix.printMatrix();
    // });

    //ok now we have a list of the matrices which we get from the current and hold pieces which produce the minimal number of holes for itself and the next piece
    //so now lets just get the lowest cost matrix and choose it.

    const minMatrixCost = Math.min(...minHoleMatrices.map(({ cost }) => cost));

    const matrixWithMinCost = minHoleMatrices.find(
      ({ cost }) => cost === minMatrixCost
    )!;

    // let minCost = 10000000;
    // let minCostMatrix = null;
    // for (let i = 0; i < minHoleMatrices.length; i++) {
    //   let bestEndPositionData = this.getBestEndPosition(
    //     nextShape,
    //     minHoleMatrices[i]
    //   );
    //   let tempMatrix = minHoleMatrices[i].clone();
    //   tempMatrix.addShapeToMatrix(bestEndPositionData.bestShape);
    //   tempMatrix.clearFullRows();
    //   tempMatrix.countHoles();
    //   tempMatrix.countPillars();
    //   tempMatrix.calculateMaximumLineHeight();
    //   tempMatrix.calculateCost(this.brain);
    //   // print("-------------------------------------------");
    //   // print(`matrix no ${i} first shape`);
    //   // minHoleMatrices[i].printMatrix();
    //   // print(`matrix no ${i} second shape`);
    //   // tempMatrix.printMatrix();
    //   // print(tempMatrix);
    //   let matrixCost = bestEndPositionData.shapeCost;
    //   if (minCost > matrixCost) {
    //     minCost = matrixCost;
    //     minCostMatrix = minHoleMatrices[i];
    //   }
    // }

    // if (minCost >= 100) {
    //   paused = true;
    // }
    // minCostMatrix.printMatrix();
    // print(minCostMatrix);
    // paused = true;
    if (matrixWithMinCost)
      this.movementPlan = matrixWithMinCost.movementHistory;
    // print(this.movementPlan.moveHistoryList);
  }

  calculateShapeCost(shape: Shape, blockMatrix: BlockMatrix) {
    const clonedBlockMatrix = blockMatrix.clone();
    clonedBlockMatrix.addShapeToMatrix(shape);
    clonedBlockMatrix.clearFullRows();
    clonedBlockMatrix.countHoles();
    clonedBlockMatrix.countPillars();
    clonedBlockMatrix.calculateMaximumLineHeight();
    clonedBlockMatrix.countNumberOfBlocksInRightmostLane();
    clonedBlockMatrix.calculateBumpiness();
    clonedBlockMatrix.calculateCost(this.brain);
    return clonedBlockMatrix.cost;
  }

  getAllEndPositions(startingShape: Shape, blockMatrix: BlockMatrix) {
    //so now we need to run a loop to hit all the possible positions
    let endPositions = this.getShortestPathsToAllEndPositions(
      startingShape,
      blockMatrix
    );
    //since some shape can look the same when rotated we need to remove repeats
    endPositions = uniqWith(endPositions, (firstShape, secondShape) =>
      firstShape.isOverlapping(secondShape)
    );
    return endPositions;
  }

  getBestEndPosition(startingShape: Shape, blockMatrix: BlockMatrix) {
    const endPositions = this.getAllEndPositions(startingShape, blockMatrix);
    //now lets count all the holes for each shape option and pick the lowest hole count
    const endPositionsWithCosts = endPositions.map((endPosition) => ({
      endPosition,
      cost: this.calculateShapeCost(endPosition, blockMatrix),
    }));

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

  checkInDirection(
    blockMatrix: BlockMatrix,
    queue: Shape[],
    shape: Shape,
    x: number,
    y: number,
    r?: number
  ) {
    const checkedPositions = new CheckedPositionsArray(blockMatrix);
    if (r) {
      if (this.game.canRotateShape(shape, blockMatrix)) {
        const rotatedShape = shape.clone();
        this.game.rotateCurrentShape(rotatedShape, blockMatrix);

        if (!checkedPositions.hasShapesPositionBeenChecked(rotatedShape)) {
          checkedPositions.setCheckedPositionsArrayValueAtShapesPosition(
            rotatedShape,
            true
          );
          queue.push(rotatedShape);
        }
      }
    } else {
      if (blockMatrix.canMoveShapeInDirection(shape, x, y)) {
        const movedShape = shape.clone();
        this.game.moveShape(movedShape, x, y, blockMatrix);

        if (!checkedPositions.hasShapesPositionBeenChecked(movedShape)) {
          checkedPositions.setCheckedPositionsArrayValueAtShapesPosition(
            movedShape,
            true
          );
          queue.push(movedShape);
        }
        // else{
        //     if(y == 1){
        //
        //         print("ok");
        //         print(movedShape);
        //         print(checkedPositions.getIndexOfCoordinates(movedShape.currentPos.x,movedShape.currentPos.y,movedShape.currentRotationCount));
        //         print(checkedPositions.getShapeFromPosition(movedShape));
        //     }
        // }
      }
    }
  }

  //returns a list of all the possible end positions from this starting shape
  getShortestPathsToAllEndPositions(
    startingShape: Shape,
    blockMatrix: BlockMatrix
  ) {
    let counter = 0;
    const endPositions = [];

    const queue = [startingShape];
    while (queue.length > 0) {
      counter++;
      //grab a shape off the front of the queue
      const shape = queue.splice(0, 1)[0];

      //if the shape cannot move down then it is a possible end position
      if (!blockMatrix.canMoveShapeDown(shape)) {
        endPositions.push(shape.clone());
      }

      //check if you can move this shape in each way, if you can move it then add it to the back of the queue

      this.checkInDirection(blockMatrix, queue, shape, -1, 0); //check left
      this.checkInDirection(blockMatrix, queue, shape, 1, 0); //check right
      this.checkInDirection(blockMatrix, queue, shape, 0, 0, 1); //check rotation
      this.checkInDirection(blockMatrix, queue, shape, 0, 1); //check down
    }

    return endPositions;
  }

  convertEndPositionsToMatrices(
    endPositions: Shape[],
    currentMatrix: BlockMatrix,
    hasHeld: boolean
  ) {
    return endPositions.map((shape) => {
      const newMatrix = currentMatrix.clone();
      newMatrix.addShapeToMatrix(shape);
      newMatrix.clearFullRows();
      newMatrix.countHoles();
      newMatrix.countPillars();
      newMatrix.calculateMaximumLineHeight();
      newMatrix.countNumberOfBlocksInRightmostLane();
      newMatrix.calculateBumpiness();
      newMatrix.calculateCost(this.brain);

      //add the shapes movement history to the matrix so we know how to reach this matrix
      newMatrix.addMovementHistory(shape.moveHistory);
      //if the shape is from the held spot then add the hold move to the start of the move history
      if (hasHeld) {
        newMatrix.movementHistory.addHoldMove();
      }

      return newMatrix;
    });
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
