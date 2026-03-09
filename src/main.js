import Phaser from "phaser";
import { gameConfig } from "./game/config";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";

class WaitingGame extends Phaser.Game {
  constructor() {
    super({
      ...gameConfig,
      scene: [BootScene, PreloadScene, MenuScene, GameScene],
    });
  }
}

// Single game instance entrypoint for Vite's module runtime.
new WaitingGame();
