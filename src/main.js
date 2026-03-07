import Phaser from "phaser";
import { gameConfig } from "./game/config";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import {
  BOOT_SCENE_KEY,
  PRELOAD_SCENE_KEY,
  MENU_SCENE_KEY,
  GAME_SCENE_KEY,
} from "./scenes/sceneKeys";

class WaitingGame extends Phaser.Game {
  constructor() {
    super(gameConfig);

    this.scene.add(PRELOAD_SCENE_KEY, PreloadScene);
    this.scene.add(MENU_SCENE_KEY, MenuScene);
    this.scene.add(GAME_SCENE_KEY, GameScene);

    this.scene.remove(BOOT_SCENE_KEY);
    this.scene.add(BOOT_SCENE_KEY, BootScene, true);
  }
}

// Single game instance entrypoint for Vite's module runtime.
new WaitingGame();
