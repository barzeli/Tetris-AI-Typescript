class CheckedPositionsArray {
  //an array which stores whether each position and rotation of a shape has already been checked for this matrix.
  blockMatrix: any;
  checkedPositions: boolean[] = [];
  checkedPositionShapes: any[] = [];

  constructor(blockMatrix: any) {
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
    this.checkedPositions = [];
    for (
      let i = 0;
      i < this.blockMatrix.width * this.blockMatrix.height * 4;
      i++
    ) {
      this.checkedPositions.push(false);
      this.checkedPositionShapes.push(null);
    }
  }

  resetCheckedPositions() {
    this.checkedPositions = [];
    for (
      let i = 0;
      i < this.blockMatrix.width * this.blockMatrix.height * 4;
      i++
    ) {
      this.checkedPositions.push(false);
    }
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

  hasShapesPositionBeenChecked(shape: any) {
    return this.checkedPositions[
      this.getIndexOfCoordinates(
        shape.currentPos.x,
        shape.currentPos.y,
        shape.currentRotationCount % 4
      )
    ];
  }
  getShapeFromPosition(shape: any) {
    return this.checkedPositionShapes[
      this.getIndexOfCoordinates(
        shape.currentPos.x,
        shape.currentPos.y,
        shape.currentRotationCount % 4
      )
    ];
  }
  setCheckedPositionsArrayValueAtShapesPosition(shape: any, value: boolean) {
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
