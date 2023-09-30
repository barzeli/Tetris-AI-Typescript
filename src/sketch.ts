import p5 from "p5";
import { Population } from "./Population";
import { BlockMatrix } from "./BlockMatrix";
import { Game } from "./Game";
import { AI } from "./AI";
import { Brain } from "./Brain";
import { Mode } from "./types";

let shapeFallRate = 30; //number of falls per second

let horizontalMoveEveryXFrames = 2; // the speed the blocks move when the left or right key is down
let horizontalMoveCounter = 0;
let verticalMoveEveryXFrames = 1; // the speed the blocks move when the left or right key is down
let verticalMoveCounter = 0;
let game: Game;
export const BLOCK_SIZE = 35;
let gameWidthBlocks = 10;
let gameHeightBlocks = 20;

let font: p5.Font;
let ai: AI;
let paused = false;

// let possibleAIMoveCounter = 0;

//------------------------------------------------------------- ai learning stuff
let population: Population;
let populationSize = 16;

export let canvas: p5.Renderer;

export let mode: Mode = "GAME";

const sketch = (p5: p5) => {
  p5.preload = function preload() {
    font = p5.loadFont("Square.ttf");
  };

  p5.setup = function setup() {
    canvas = p5.createCanvas(800, 800);
    canvas.parent("canvas");

    if (mode === "POPULATION") population = new Population(populationSize);
    else {
      game = new Game(gameWidthBlocks, gameHeightBlocks);
      if (mode === "AI") {
        ai = new AI(game, new Brain());
        ai.calculateMovementPlan2();
      }
    }
    p5.frameRate(10);
    p5.textFont(font);
  };

  p5.draw = function draw() {
    p5.push();

    if (mode === "POPULATION") {
      if (!population.areAllPlayersDead()) {
        population.show();
        if (!paused) population.update();
      } else {
        population.naturalSelection();
        population.show();
        population.update();
      }
    } else {
      game.draw();

      if (mode === "AI") {
        writeCurrentOptimisations();
        writeCurrentMatrixStats(ai.brain);

        // ai.showPossibleMoveNo(possibleAIMoveCounter);
        // if (ai.possibleEndPositions.length > 0 && frameCount % 5 === 0) {
        //   possibleAIMoveCounter =
        //     (possibleAIMoveCounter + 1) % ai.possibleEndPositions.length;
        // }
        // ai.showBestMove();
      }
      checkInput();

      // if (game.justTetrised) {
      //   return;
      // }
      // move the shape down at a rate of (shape Fall Rate) drops per second
      if (!paused && p5.frameCount % p5.int(30 / shapeFallRate) === 0) {
        if (mode === "AI") {
          if (ai.movementPlan === null) {
            ai.calculateMovementPlan2();
          }

          let nextMove = ai.getNextMove();

          switch (nextMove) {
            case "ALL DOWN":
              let downMoveMultiplier = 2;
              // let downMoveMultiplier = 2;
              while (
                ai.movementPlan.moveHistoryList.length > 0 &&
                downMoveMultiplier > 0
              ) {
                ai.movementPlan.moveHistoryList.splice(0, 1);
                game.moveShapeDown();
                downMoveMultiplier -= 1;
              }
              break;
            case "HOLD":
              game.holdShape();
              break;
            case "ROTATE":
              game.rotateShape();
              break;
            case "RIGHT":
              game.moveShapeRight();
              break;
            case "LEFT":
              game.moveShapeLeft();
              break;
            case "DOWN":
              game.moveShapeDown();
              break;
          }
        }
      }
    }
    p5.pop();
  };

  function writeCurrentMatrixStats(brain: Brain) {
    let currentMatrix = new BlockMatrix(game.gameWidth, game.gameHeight);

    currentMatrix.copyFromMatrix(game.deadBlocksMatrix.matrix);
    currentMatrix.clearFullRows();
    currentMatrix.countHoles();
    currentMatrix.countPillars();
    currentMatrix.calculateMaximumLineHeight();
    currentMatrix.countNumberOfBlocksInRightmostLane();
    currentMatrix.calculateBumpiness();
    currentMatrix.calculateCost(brain);

    let matrixStats = [
      `Hole Count: ${currentMatrix.holeCount}`,
      `Open Hole Count: ${currentMatrix.openHoleCount}`,
      `Pillar Count: ${currentMatrix.pillarCount}`,
      `Max Height: ${currentMatrix.maximumLineHeight}`,
      `Blocks in Right Lane: ${currentMatrix.blocksInRightLane}`,
      `Blocks above Holes: ${currentMatrix.blocksAboveHoles}`,
      `Bumpiness: ${currentMatrix.bumpiness}`,
      `Total cost: ${currentMatrix.cost}`,
    ];

    p5.textAlign(p5.LEFT, p5.CENTER);
    p5.fill(100);
    p5.stroke(0);
    p5.strokeWeight(1);

    let startingY = 400;
    let startingX = 720;
    let textGap = 30;

    p5.textSize(20);
    p5.noStroke();

    p5.text("Current Stats", startingX, startingY);
    p5.textSize(15);
    p5.noStroke();
    matrixStats.forEach((matrixStat, index) =>
      p5.text("---" + matrixStat, startingX, startingY + (index + 1) * textGap)
    );
  }

  function writeCurrentOptimisations() {
    let implementedOptimisations = [
      "Minimise Global Holes",
      "Minimise Height",
      "Check Held Piece",
      "Minimise Empty Pillars",
    ];

    p5.textAlign(p5.LEFT, p5.CENTER);
    p5.fill(100);
    p5.stroke(0);
    p5.strokeWeight(1);

    let startingY = 400;
    let startingX = 30;
    let textGap = 30;

    p5.textSize(20);
    p5.noStroke();

    p5.text("Implemented Optimisations", startingX, startingY);
    p5.textSize(15);
    p5.noStroke();
    implementedOptimisations.forEach((implementedOptimisation, index) =>
      p5.text(
        "---" + implementedOptimisation,
        startingX,
        startingY + (index + 1) * textGap
      )
    );
  }

  let leftKeyIsDown = false;
  let rightKeyIsDown = false;
  let downKeyIsDown = false;

  let replayingMove = false;

  function checkInput() {
    if (leftKeyIsDown || rightKeyIsDown) {
      if (horizontalMoveCounter >= horizontalMoveEveryXFrames) {
        leftKeyIsDown ? game.moveShapeLeft() : game.moveShapeRight();
        horizontalMoveCounter = 0;
      }
      horizontalMoveCounter++;
    }

    if (downKeyIsDown) {
      if (verticalMoveCounter >= verticalMoveEveryXFrames) {
        game.moveShapeDown(replayingMove);
        verticalMoveCounter = 0;
      }
      verticalMoveCounter++;
    }
  }

  p5.keyPressed = function keyPressed() {
    if (p5.keyCode === p5.UP_ARROW) {
      game.rotateShape();
    } else if (p5.keyCode === p5.DOWN_ARROW) {
      downKeyIsDown = true;
    }
    if (p5.keyCode === p5.LEFT_ARROW) {
      game.moveShapeLeft();
      leftKeyIsDown = true;
      horizontalMoveCounter = 0;
    } else if (p5.keyCode === p5.RIGHT_ARROW) {
      game.moveShapeRight();
      rightKeyIsDown = true;
      horizontalMoveCounter = 0;
    }
    if (p5.key === "C") {
      game.holdShape();
    }
    if (p5.key === " ") {
      paused = !paused;
    }
    if (p5.key === "A") {
      // ai.getMove(
      //   game.currentShape,
      //   game.heldShape,
      //   game.nextShape,
      //   game.deadBlocksMatrix
      // );
    }
    if (p5.key == "R") {
      replayingMove = !replayingMove;
    }
  };

  p5.keyReleased = function keyReleased() {
    if (p5.keyCode === p5.DOWN_ARROW) {
      downKeyIsDown = false;
    }
    if (p5.keyCode === p5.LEFT_ARROW) {
      leftKeyIsDown = false;
    } else if (p5.keyCode === p5.RIGHT_ARROW) {
      rightKeyIsDown = false;
    }
  };
};

export const p5Sketch = new p5(sketch);
