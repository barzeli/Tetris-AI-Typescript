import { BlockMatrix } from "./BlockMatrix";
import { Shape } from "./Shape";

export class CheckedPositionsArray {
  //an array which stores whether each position and rotation of a shape has already been checked for this matrix.
  blockMatrix: BlockMatrix;
  checkedPositions: boolean[] = [];
  checkedPositionShapes: (Shape | null)[] = [];

  constructor(blockMatrix: BlockMatrix) {
    this.blockMatrix = blockMatrix;
    this.setAllPositionsToFalse();
  }

  getIndexOfCoordinates(x: number, y: number, r: number) {
    return (
      x +
      this.blockMatrix.width * y +
      this.blockMatrix.width * this.blockMatrix.height * r
    );
  }

  setAllPositionsToFalse() {
    const length = this.blockMatrix.width * this.blockMatrix.height * 4;
    this.checkedPositions = [...Array(length).fill(false)];
    this.checkedPositionShapes = [...Array(length).fill(null)];
  }

  resetCheckedPositions() {
    const length = this.blockMatrix.width * this.blockMatrix.height * 4;
    this.checkedPositions = [...Array(length).fill(false)];
  }

  hasPositionBeenChecked(x: number, y: number, r: number) {
    return this.checkedPositions[this.getIndexOfCoordinates(x, y, r)];
  }

  setCheckedPositionsArrayValue(
    x: number,
    y: number,
    r: number,
    value: boolean
  ) {
    this.checkedPositions[this.getIndexOfCoordinates(x, y, r)] = value;
  }

  hasShapesPositionBeenChecked(shape: Shape) {
    return this.checkedPositions[
      this.getIndexOfCoordinates(
        shape.currentPos.x,
        shape.currentPos.y,
        shape.currentRotationCount % 4
      )
    ];
  }

  getShapeFromPosition(shape: Shape) {
    return this.checkedPositionShapes[
      this.getIndexOfCoordinates(
        shape.currentPos.x,
        shape.currentPos.y,
        shape.currentRotationCount % 4
      )
    ];
  }
  setCheckedPositionsArrayValueAtShapesPosition(shape: Shape, value: boolean) {
    this.checkedPositions[
      this.getIndexOfCoordinates(
        shape.currentPos.x,
        shape.currentPos.y,
        shape.currentRotationCount % 4
      )
    ] = value;
    // this.checkedPositionShapes[this.getIndexOfCoordinates(shape.currentPos.x, shape.currentPos.y, shape.currentRotationCount % 4)] = shape;
  }
}
