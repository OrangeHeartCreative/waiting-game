import Phaser from "phaser";
import { ASSET_MANIFEST } from "../assets/manifest";
import { PRELOAD_SCENE_KEY, MENU_SCENE_KEY } from "./sceneKeys";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(PRELOAD_SCENE_KEY);
  }

  preload() {
    ASSET_MANIFEST.forEach((asset) => {
      if (asset.type === "image") {
        this.load.image(asset.key, asset.path);
      }
    });
  }

  create() {
    this.scene.start(MENU_SCENE_KEY);
  }
}
