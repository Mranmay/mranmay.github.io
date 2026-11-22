// Simplified neuron skeletons, expressed in common display coordinates.
export interface Point3 {
  x: number;
  y: number;
  z: number;
}
export interface Branch {
  points: Point3[];
  width: number;
  radii?: number[];
  axon?: boolean;
}
export interface Cell {
  id: string;
  soma: Point3;
  surface?: { positions: number[]; indices: number[] };
  radius: number;
  color: string;
  branches: Branch[];
  signals: Point3[][];
}
