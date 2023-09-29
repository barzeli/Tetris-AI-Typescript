import { p5Sketch } from "./sketch";
import { Shape } from "./Shape";
import { ShapeType } from "./types";
import p5 from "p5";
import { Game } from "./Game";

export class ShapeGenerator {
  squareShape = {
    blockPositions: [
      p5Sketch.createVector(0, 0),
      p5Sketch.createVector(0, 1),
      p5Sketch.createVector(1, 0),
      p5Sketch.createVector(1, 1),
    ],
    rotationPoint: p5Sketch.createVector(0.5, 0.5),
    color: p5Sketch.color(255, 239, 43),
    name: "Square",
  };

  lShape = {
    blockPositions: [
      p5Sketch.createVector(0, 0),
      p5Sketch.createVector(0, 1),
      p5Sketch.createVector(0, 2),
      p5Sketch.createVector(1, 2),
    ],
    rotationPoint: p5Sketch.createVector(0, 1),
    color: p5Sketch.color(247, 167, 0),
    name: "L",
  };

  reverseLShape = {
    blockPositions: [
      p5Sketch.createVector(1, 0),
      p5Sketch.createVector(1, 1),
      p5Sketch.createVector(1, 2),
      p5Sketch.createVector(0, 2),
    ],
    rotationPoint: p5Sketch.createVector(1, 1),
    color: p5Sketch.color(0, 100, 200),
    name: "ReverseL",
  };

  lineShape = {
    blockPositions: [
      p5Sketch.createVector(0, 0),
      p5Sketch.createVector(0, 1),
      p5Sketch.createVector(0, 2),
      p5Sketch.createVector(0, 3),
    ],
    rotationPoint: p5Sketch.createVector(0.5, 1.5),
    color: p5Sketch.color(0, 201, 223),
    name: "Line",
  };

  tShape = {
    blockPositions: [
      p5Sketch.createVector(1, 0),
      p5Sketch.createVector(0, 1),
      p5Sketch.createVector(1, 1),
      p5Sketch.createVector(1, 2),
    ],
    rotationPoint: p5Sketch.createVector(1, 1),
    color: p5Sketch.color(155, 0, 190),
    name: "T",
  };

  zShape = {
    blockPositions: [
      p5Sketch.createVector(0, 0),
      p5Sketch.createVector(1, 0),
      p5Sketch.createVector(1, 1),
      p5Sketch.createVector(2, 1),
    ],
    rotationPoint: p5Sketch.createVector(1, 1),
    color: p5Sketch.color(220, 0, 0),
    name: "Z",
  };

  sShape = {
    blockPositions: [
      p5Sketch.createVector(0, 1),
      p5Sketch.createVector(1, 1),
      p5Sketch.createVector(1, 0),
      p5Sketch.createVector(2, 0),
    ],
    rotationPoint: p5Sketch.createVector(1, 1),
    color: p5Sketch.color(0, 230, 50),
    name: "S",
  };

  shapeIDs: ShapeType[] = [
    this.squareShape,
    this.lShape,
    this.reverseLShape,
    this.lineShape,
    this.tShape,
    this.zShape,
    this.sShape,
  ];

  currentBagOfShapeIDs: ShapeType[] = [
    this.squareShape,
    this.lShape,
    this.reverseLShape,
    this.lineShape,
    this.tShape,
    this.zShape,
    this.sShape,
  ];

  getNewRandomShape(position: p5.Vector, game: Game) {
    return new Shape(this.getRandomShapeID(), position, game);
  }

  getRandomShapeID(): ShapeType {
    if (this.currentBagOfShapeIDs.length > 0) {
      return this.currentBagOfShapeIDs.splice(
        Math.floor(p5Sketch.random(0, this.currentBagOfShapeIDs.length)),
        1
      )[0];
    } else {
      this.currentBagOfShapeIDs = [
        this.squareShape,
        this.lShape,
        this.reverseLShape,
        this.lineShape,
        this.tShape,
        this.zShape,
        this.sShape,
      ];
      return this.getRandomShapeID();
    }
  }
}
