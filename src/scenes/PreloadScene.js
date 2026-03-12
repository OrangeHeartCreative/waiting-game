import Phaser from "phaser";
import { ASSET_MANIFEST } from "../assets/manifest";
import { PRELOAD_SCENE_KEY, MENU_SCENE_KEY } from "./sceneKeys";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(PRELOAD_SCENE_KEY);
  }

  create() {
    // Show the menu background colour immediately so there is no black flash.
    this.cameras.main.setBackgroundColor("#0f1a2b");

    ASSET_MANIFEST.forEach((asset) => {
      if (asset.type === "image") {
        this.load.image(asset.key, asset.path);
      }
    });

    this.load.once("complete", () => {
      this.scene.start(MENU_SCENE_KEY);
    });

    this.load.start();

    // If there is nothing to load, the complete event never fires — start immediately.
    if (!this.load.isLoading()) {
      this.scene.start(MENU_SCENE_KEY);
    }
  }
}
