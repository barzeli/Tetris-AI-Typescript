import { p5Sketch } from "./sketch";
import { Multipliers } from "./types";

export class Brain {
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
      maximumLineHeightMultiplier: 1 * p5Sketch.random(0, 2),
      addedShapeHeightMultiplier: 1 * p5Sketch.random(0, 2),
      pillarCountMultiplier: 4 * p5Sketch.random(0, 2),
      blocksInRightMostLaneMultiplier: 10 * p5Sketch.random(0, 2),
      nonTetrisClearPenalty: 20 * p5Sketch.random(0, 2),
      blocksAboveHolesMultiplier: 5 * p5Sketch.random(0, 2),
      bumpinessMultiplier: 5 * p5Sketch.random(0, 2),
      tetrisRewardMultiplier: -10 * p5Sketch.random(0, 2),
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

  mutate() {
    let mutationRate = 0.1;
    this.multipliers.holeCountMultiplier *=
      p5Sketch.random(1.0) < mutationRate ? p5Sketch.random(0.95, 1.05) : 1;
    this.multipliers.openHoleCountMultiplier *=
      p5Sketch.random(1.0) < mutationRate ? p5Sketch.random(0.95, 1.05) : 1;
    this.multipliers.maximumLineHeightMultiplier *=
      p5Sketch.random(1.0) < mutationRate ? p5Sketch.random(0.95, 1.05) : 1;
    this.multipliers.addedShapeHeightMultiplier *=
      p5Sketch.random(1.0) < mutationRate ? p5Sketch.random(0.95, 1.05) : 1;
    this.multipliers.pillarCountMultiplier *=
      p5Sketch.random(1.0) < mutationRate ? p5Sketch.random(0.95, 1.05) : 1;
    this.multipliers.blocksInRightMostLaneMultiplier *=
      p5Sketch.random(1.0) < mutationRate ? p5Sketch.random(0.95, 1.05) : 1;
    this.multipliers.nonTetrisClearPenalty *=
      p5Sketch.random(1.0) < mutationRate ? p5Sketch.random(0.95, 1.05) : 1;
    this.multipliers.blocksAboveHolesMultiplier *=
      p5Sketch.random(1.0) < mutationRate ? p5Sketch.random(0.95, 1.05) : 1;
    this.multipliers.bumpinessMultiplier *=
      p5Sketch.random(1.0) < mutationRate ? p5Sketch.random(0.95, 1.05) : 1;
    this.multipliers.tetrisRewardMultiplier *=
      p5Sketch.random(1.0) < mutationRate ? p5Sketch.random(0.95, 1.05) : 1;
  }

  clone() {
    let clone = new Brain();
    clone.multipliers = { ...this.multipliers };
    return clone;
  }

  getCostOfMatrix(blockMatrix: any) {
    let linesClearedWhichArentTetrises =
      blockMatrix.linesCleared > 0 && blockMatrix.linesCleared < 4 ? 1 : 0;
    let tetrises = blockMatrix.linesCleared === 4 ? 1 : 0;

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

  writeMultipliers(startingX: any, startingY: any) {
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
