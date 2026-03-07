import Phaser from "phaser";
import { PRELOAD_SCENE_KEY, BOOT_SCENE_KEY } from "./sceneKeys";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(BOOT_SCENE_KEY);
  }

  create() {
    this.scene.start(PRELOAD_SCENE_KEY);
  }
}
