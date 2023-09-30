import { BlockMatrix } from "./BlockMatrix";
import { p5Sketch } from "./sketch";
import { Multipliers } from "./types";

export class Brain {
  mutationRate = 0.1;
  multipliers: Multipliers = {
    holeCountMultiplier: 0,
    openHoleCountMultiplier: 0,
    maximumLineHeightMultiplier: 0,
    addedShapeHeightMultiplier: 0,
    pillarCountMultiplier: 0,
    blocksInRightMostLaneMultiplier: 0,
    nonTetrisClearPenalty: 0,
    blocksAboveHolesMultiplier: 0,
    bumpinessMultiplier: 0,
    tetrisRewardMultiplier: 0,
  };

  constructor(isFirst?: boolean) {
    if (isFirst) {
      this.setAsMyMultipliers();
    } else {
      this.randomizeMultipliers();
    }
  }

  randomizeMultipliers() {
    this.multipliers = {
      holeCountMultiplier: 100 * p5Sketch.random(0, 2),
      openHoleCountMultiplier: 70 * p5Sketch.random(0, 2),
      maximumLineHeightMultiplier: 1 * p5Sketch.random(0, 2), // 0 in Block matrix
      addedShapeHeightMultiplier: 1 * p5Sketch.random(0, 2),
      pillarCountMultiplier: 4 * p5Sketch.random(0, 2),
      blocksInRightMostLaneMultiplier: 10 * p5Sketch.random(0, 2),
      nonTetrisClearPenalty: 20 * p5Sketch.random(0, 2),
      blocksAboveHolesMultiplier: 5 * p5Sketch.random(0, 2),
      bumpinessMultiplier: 5 * p5Sketch.random(0, 2),
      tetrisRewardMultiplier: -10 * p5Sketch.random(0, 2), // negative because it reduces cost
    };
  }

  setAsMyMultipliers() {
    this.multipliers = {
      holeCountMultiplier: 100, // * random(0, 2),
      openHoleCountMultiplier: 70, // * random(0, 2),
      maximumLineHeightMultiplier: 1, // * random(0, 2),
      addedShapeHeightMultiplier: 1, // * random(0, 2),
      pillarCountMultiplier: 4, // * random(0, 2),
      blocksInRightMostLaneMultiplier: 10, // * random(0, 2),
      nonTetrisClearPenalty: 20, // * random(0, 2),
      blocksAboveHolesMultiplier: 5, // * random(0, 2),
      bumpinessMultiplier: 5, // * random(0, 2),
      tetrisRewardMultiplier: -10, // * random(0, 2)
    };
  }

  getMutationMultiplier() {
    return p5Sketch.random(1.0) < this.mutationRate
      ? p5Sketch.random(0.95, 1.05)
      : 1;
  }

  mutate() {
    this.multipliers.holeCountMultiplier *= this.getMutationMultiplier();
    this.multipliers.openHoleCountMultiplier *= this.getMutationMultiplier();
    this.multipliers.maximumLineHeightMultiplier *=
      this.getMutationMultiplier();
    this.multipliers.addedShapeHeightMultiplier *= this.getMutationMultiplier();
    this.multipliers.pillarCountMultiplier *= this.getMutationMultiplier();
    this.multipliers.blocksInRightMostLaneMultiplier *=
      this.getMutationMultiplier();
    this.multipliers.nonTetrisClearPenalty *= this.getMutationMultiplier();
    this.multipliers.blocksAboveHolesMultiplier *= this.getMutationMultiplier();
    this.multipliers.bumpinessMultiplier *= this.getMutationMultiplier();
    this.multipliers.tetrisRewardMultiplier *= this.getMutationMultiplier();
  }

  clone() {
    let clone = new Brain();
    clone.multipliers = { ...this.multipliers };
    return clone;
  }

  getCostOfMatrix(blockMatrix: BlockMatrix) {
    let linesClearedWhichArentTetrises =
      blockMatrix.linesCleared > 0 && blockMatrix.linesCleared < 4 ? 1 : 0;
    let tetrises = blockMatrix.linesCleared === 4 ? 1 : 0;

    // from block matrix
    // //if shit aint going great then stop trying to tetris shit
    // if (
    //   this.maximumLineHeight > 10 ||
    //   this.holeCount > 0 ||
    //   this.pillarCount > 10
    // ) {
    //   nonTetrisClearPenalty = 0;
    //   maximumLineHeightMultiplier = 1;
    // }

    blockMatrix.cost =
      blockMatrix.holeCount * this.multipliers.holeCountMultiplier +
      blockMatrix.openHoleCount * this.multipliers.openHoleCountMultiplier +
      blockMatrix.blocksAboveHoles *
        this.multipliers.blocksAboveHolesMultiplier +
      linesClearedWhichArentTetrises * this.multipliers.nonTetrisClearPenalty +
      tetrises * this.multipliers.tetrisRewardMultiplier +
      blockMatrix.maximumLineHeight *
        this.multipliers.maximumLineHeightMultiplier +
      blockMatrix.addedShapeHeight *
        this.multipliers.addedShapeHeightMultiplier +
      blockMatrix.pillarCount * this.multipliers.pillarCountMultiplier +
      blockMatrix.blocksInRightLane *
        this.multipliers.blocksInRightMostLaneMultiplier +
      blockMatrix.bumpiness * this.multipliers.bumpinessMultiplier;

    return blockMatrix.cost;
  }

  writeMultipliers(startingX: number, startingY: number) {
    p5Sketch.push();

    let multiplierStats = [
      `Hole Count: ${this.multipliers.holeCountMultiplier.toFixed(2)}`,
      `Open Hole Count: ${this.multipliers.openHoleCountMultiplier.toFixed(2)}`,
      `Blocks above Holes: ${this.multipliers.blocksAboveHolesMultiplier.toFixed(
        2
      )}`,
      `Non tetris clear: ${this.multipliers.nonTetrisClearPenalty.toFixed(2)}`,
      `Tetris clear: ${this.multipliers.tetrisRewardMultiplier.toFixed(2)}`,
      `Maximum line height: ${this.multipliers.maximumLineHeightMultiplier.toFixed(
        2
      )}`,
      `Added Shape Height: ${this.multipliers.addedShapeHeightMultiplier.toFixed(
        2
      )}`,
      `Pillar Count: ${this.multipliers.pillarCountMultiplier.toFixed(2)}`,
      `Blocks in right lane: ${this.multipliers.blocksInRightMostLaneMultiplier.toFixed(
        2
      )}`,
      `Bumpiness: ${this.multipliers.bumpinessMultiplier.toFixed(2)}`,
    ];

    p5Sketch.textAlign(p5Sketch.LEFT, p5Sketch.CENTER);
    p5Sketch.fill(100);
    p5Sketch.stroke(0);
    p5Sketch.strokeWeight(1);

    let textGap = 30;

    p5Sketch.textSize(20);
    p5Sketch.noStroke();

    p5Sketch.text("Multipliers", startingX, startingY);
    p5Sketch.textSize(15);
    p5Sketch.noStroke();
    multiplierStats.forEach((multiplierStat, index) =>
      p5Sketch.text(
        multiplierStat,
        startingX,
        startingY + (index + 1) * textGap
      )
    );

    p5Sketch.pop();
  }
}
