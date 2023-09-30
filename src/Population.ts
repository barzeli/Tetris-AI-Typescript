import { chunk } from "lodash";
import { Player } from "./Player";
import { canvas, p5Sketch } from "./sketch";

export class Population {
  players: Player[] = [];
  fitnessSum = 0;
  bestPlayer: Player | null = null;
  generation = 1;

  //batch stuff
  batchSize = 16;
  currentBatchNumber = 0;
  numberOfBatches: number;
  playersPerRow: number;
  playersPerColumn: number;
  playerWidth: number;
  playerHeight: number;

  constructor(size: number) {
    //batch stuff
    this.numberOfBatches = Math.ceil(size / this.batchSize);

    this.playersPerRow = Math.ceil(Math.sqrt(this.batchSize));
    this.playersPerColumn = Math.ceil(Math.sqrt(this.batchSize));

    this.playerWidth = canvas.width / this.playersPerRow;
    this.playerHeight = canvas.height / this.playersPerColumn;

    this.players = [...Array(size)].map(
      (_, index) => new Player(index === 0, this.playerWidth, this.playerHeight)
    );
  }

  getCurrentBatchOfPlayers() {
    return this.players.slice(
      this.currentBatchNumber * this.batchSize,
      (this.currentBatchNumber + 1) * this.batchSize
    );
  }

  show() {
    p5Sketch.push();
    p5Sketch.background(240);

    p5Sketch.textSize(30);
    p5Sketch.fill(100);
    p5Sketch.stroke(100);
    p5Sketch.textAlign(p5Sketch.CENTER, p5Sketch.CENTER);
    p5Sketch.text(
      `Gen: ${this.generation}\t\t Batch: ${
        this.currentBatchNumber + 1
      }\t\tAverage Fitness: ${(this.fitnessSum / this.players.length).toFixed(
        2
      )}`,
      canvas.width / 2,
      25
    );

    p5Sketch.translate(0, 50);
    p5Sketch.scale(1, (canvas.height - 50) / canvas.height);

    const currentBatch = this.getCurrentBatchOfPlayers();
    chunk(currentBatch, this.playersPerRow).forEach((row, rowIndex) => {
      row.forEach((player, columnIndex) => {
        p5Sketch.push();
        p5Sketch.translate(
          rowIndex * this.playerWidth,
          columnIndex * this.playerHeight
        );
        player.show();
        p5Sketch.pop();
      });
    });

    p5Sketch.pop();
  }

  update() {
    let currentBatch = this.getCurrentBatchOfPlayers();
    currentBatch.forEach((player) => player.update());
    if (this.areAllPlayersInBatchDead()) {
      this.currentBatchNumber++;
    }
  }

  naturalSelection() {
    let nextGen = [];
    this.calculatePlayerFitnesses();
    this.calculateFitnessSum();
    //make sure best player makes it to the next gen
    this.setBestPlayer();
    let parent = this.bestPlayer;
    let child = parent!.clone();
    child.brain.mutate();
    nextGen.push(child);

    while (nextGen.length < this.players.length) {
      parent = this.selectPlayer();
      child = parent!.clone();
      child.brain.mutate();
      nextGen.push(child);
    }

    this.players = nextGen;
    this.generation++;
    this.currentBatchNumber = 0;
  }

  setBestPlayer() {
    if (this.players.length > 0)
      this.bestPlayer = this.players.reduce((bestPlayer, currPlayer) =>
        currPlayer.fitness > bestPlayer.fitness ? currPlayer : bestPlayer
      );
  }

  //assuming that the fitness sum has been calculated
  selectPlayer() {
    let randomNumber = p5Sketch.random(this.fitnessSum);
    let runningSum = 0;
    for (let player of this.players) {
      runningSum += player.fitness;
      if (runningSum > randomNumber) {
        return player;
      }
    }

    return null; //somethings wrong
  }

  calculatePlayerFitnesses() {
    this.players.forEach((player) => player.calculateFitness());
  }

  calculateFitnessSum() {
    this.fitnessSum = this.players.reduce((sum, curr) => sum + curr.fitness, 0);
  }

  areAllPlayersDead() {
    return this.players.every((player) => player.isDead);
  }

  areAllPlayersInBatchDead() {
    return this.getCurrentBatchOfPlayers().every((player) => player.isDead);
  }
}

//todo allPlayersDead(), player.isDead, thats about it
