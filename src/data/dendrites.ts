// Simplified dendrite skeletons, expressed in common display coordinates.
export interface Point3 {
  x: number;
  y: number;
  z: number;
}
export interface Branch {
  points: Point3[];
  width: number;
}
export interface Cell {
  soma: Point3;
  radius: number;
  color: string;
  branches: Branch[];
  signals: Point3[][];
}
