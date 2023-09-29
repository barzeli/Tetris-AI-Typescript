import { Color, Vector } from "p5";

export interface ShapeType {
  blockPositions: Vector[];
  rotationPoint: Vector;
  color: Color;
  name: string;
}
