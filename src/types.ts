import { Color, Vector } from "p5";

export interface ShapeType {
  blockPositions: Vector[];
  rotationPoint: Vector;
  color: Color;
  name: string;
}

export interface Multipliers {
  holeCountMultiplier: number;
  openHoleCountMultiplier: number;
  maximumLineHeightMultiplier: number;
  addedShapeHeightMultiplier: number;
  pillarCountMultiplier: number;
  blocksInRightMostLaneMultiplier: number;
  nonTetrisClearPenalty: number;
  blocksAboveHolesMultiplier: number;
  bumpinessMultiplier: number;
  tetrisRewardMultiplier: number;
}

export type MovementType = "DOWN" | "LEFT" | "RIGHT" | "ROTATE" | "HOLD";
