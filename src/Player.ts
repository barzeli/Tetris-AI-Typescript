import { AI } from "./AI";
import { Brain } from "./Brain";
import { Game } from "./Game";
import { canvas, p5Sketch } from "./sketch";

export class Player {
  windowWidth: number;
  windowHeight: number;

  fitness = 0;
  score = 0;
  tetrisRate = 0;
  currentGame = new Game(10, 20);
  brain: Brain;
  ai: AI;
  isDead = false;

  constructor(
    windowWidth: number,
    windowHeight: number,
    firstPlayer?: boolean
  ) {
    this.windowWidth = windowWidth;
    this.windowHeight = windowHeight;
    this.brain = new Brain(firstPlayer);

    this.ai = new AI(this.currentGame, this.brain);
    this.ai.calculateMovementPlan2();
    this.windowHeight = canvas.height / 2;
    this.windowWidth = canvas.width / 2;
  }

  calculateMovementPlan() {
    this.ai.brain = this.brain; //just incase
    this.ai.calculateMovementPlan2();
  }

  calculateFitness() {
    this.fitness =
      this.currentGame.score * (1 + this.currentGame.getTetrisRate());
  }

  clone() {
    let clone = new Player(this.windowWidth, this.windowHeight);
    clone.currentGame.needsNewMovementPlan = true;
    clone.brain = this.brain.clone();
    clone.ai.brain = clone.brain;
    return clone;
  }

  show() {
    p5Sketch.push();
    // translate(this.windowPosition.x, this.windowPosition.y);
    p5Sketch.scale(
      this.windowWidth / canvas.width,
      this.windowHeight / canvas.height
    );
    this.currentGame.draw();
    this.brain.writeMultipliers(600, 300);
    p5Sketch.pop();
  }

  update() {
    if (this.isDead || this.currentGame.justTetrised) return;

    // move the shape down at a rate of (shape Fall Rate) drops per second
    if (this.currentGame.needsNewMovementPlan) {
      this.ai.calculateMovementPlan2();
      this.currentGame.needsNewMovementPlan = false;
    }

    let nextMove = this.ai.getNextMove();

    switch (nextMove) {
      case "ALL DOWN":
        let downMoveMultiplier = 5;
        // let downMoveMultiplier = 2;
        while (
          this.ai.movementPlan.moveHistoryList.length > 0 &&
          downMoveMultiplier > 0
        ) {
          this.ai.movementPlan.moveHistoryList.splice(0, 1);
          this.currentGame.moveShapeDown();
          downMoveMultiplier -= 1;
        }
        break;
      case "HOLD":
        this.currentGame.holdShape();
        break;
      case "ROTATE":
        this.currentGame.rotateShape();
        break;
      case "RIGHT":
        this.currentGame.moveShapeRight();
        break;
      case "LEFT":
        this.currentGame.moveShapeLeft();
        break;
      case "DOWN":
        this.currentGame.moveShapeDown();
        break;
    }

    this.isDead = this.currentGame.isDead;
  }
}
