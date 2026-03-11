import Phaser from "phaser";
import { gameConfig } from "./game/config";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";
import { ShiftCompleteScene } from "./scenes/ShiftCompleteScene";
import { DayCompleteScene } from "./scenes/DayCompleteScene";

class WaitingGame extends Phaser.Game {
  constructor() {
    super({
      ...gameConfig,
      scene: [BootScene, PreloadScene, MenuScene, GameScene, ShiftCompleteScene, DayCompleteScene],
    });
  }
}

// Single game instance entrypoint for Vite's module runtime.
new WaitingGame();
