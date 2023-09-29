import { p5Sketch } from "./sketch";
import { MovementType } from "./types";

export class MoveHistory {
  moveHistoryList: MovementType[] = [];

  addDirectionalMove(x: number, y: number) {
    if (x === -1) {
      this.moveHistoryList.push("LEFT");
    } else if (x === 1) {
      this.moveHistoryList.push("RIGHT");
    } else if (y === 1) {
      this.moveHistoryList.push("DOWN");
    } else {
      p5Sketch.print(`ERROR BRO WHAT THE FUCK IS: ${x}, ${y}`);
    }
  }

  addRotationMove() {
    this.moveHistoryList.push("ROTATE");
  }
  addHoldMove(addToTail = true) {
    if (addToTail) {
      this.moveHistoryList.push("HOLD");
    } else {
      this.moveHistoryList.unshift("HOLD");
    }
  }

  clone() {
    let clone = new MoveHistory();
    clone.moveHistoryList = [...this.moveHistoryList];
    return clone;
  }
}
