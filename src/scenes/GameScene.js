import Phaser from "phaser";
import { COLORS, SPACING } from "../ui/tokens";
import { GAME_SCENE_KEY, MENU_SCENE_KEY } from "./sceneKeys";

export class GameScene extends Phaser.Scene {
  constructor() {
    super(GAME_SCENE_KEY);
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add.rectangle(width / 2, SPACING.lg, width - SPACING.lg, 70, COLORS.panel).setOrigin(0.5, 0);

    this.add.text(SPACING.md, SPACING.lg, "SCORE: --", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "24px",
      color: "#f1f5ff",
    });

    this.add.text(width / 2, SPACING.lg, "TIMER: --:--", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "24px",
      color: "#f1f5ff",
    }).setOrigin(0.5, 0);

    this.add.text(width - SPACING.md, SPACING.lg, "STATUS: IDLE", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "24px",
      color: "#f1f5ff",
    }).setOrigin(1, 0);

    this.add.rectangle(width / 2, height / 2 + 20, width - SPACING.lg, height - 170, COLORS.panelAlt);

    this.add
      .text(width / 2, height / 2 + 20, "Gameplay Area Placeholder", {
        fontFamily: "Georgia, serif",
        fontSize: "40px",
        color: "#f6c453",
      })
      .setOrigin(0.5);

    this.add
      .text(SPACING.md, height - SPACING.md, "Press ESC to return", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "18px",
        color: "#b9c6dd",
      })
      .setOrigin(0, 1);

    this.input.keyboard?.on("keydown-ESC", () => {
      this.scene.start(MENU_SCENE_KEY);
    });

    this.scale.on("resize", () => {
      this.scene.restart();
    });
  }
}
