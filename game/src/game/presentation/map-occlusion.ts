import type Phaser from "phaser";
// Original backgrounds require their own foreground masks; the community house mask is incompatible.
export function createMapOcclusion(_scene: Phaser.Scene): Phaser.GameObjects.Image[] { return []; }
