import Phaser from "phaser";
import { BOOT_SCENE_KEY } from "../scenes/sceneKeys";
import { BASE_WIDTH, BASE_HEIGHT } from "./constants";

export const gameConfig = {
  type: Phaser.AUTO,
  width: BASE_WIDTH,
  height: BASE_HEIGHT,
  parent: "app",
  backgroundColor: "#0f1a2b",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BOOT_SCENE_KEY],
};
