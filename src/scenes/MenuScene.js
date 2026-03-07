import Phaser from "phaser";
import { COLORS, SPACING } from "../ui/tokens";
import { MENU_SCENE_KEY, GAME_SCENE_KEY } from "./sceneKeys";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(MENU_SCENE_KEY);
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(width / 2, height * 0.35, "WAITING GAME", {
        fontFamily: "Georgia, serif",
        fontSize: "64px",
        color: "#f1f5ff",
      })
      .setOrigin(0.5);

    const cta = this.add.rectangle(width / 2, height * 0.6, 280, 72, COLORS.accent);
    cta.setStrokeStyle(3, COLORS.text);
    cta.setInteractive({ useHandCursor: true });

    this.add
      .text(width / 2, height * 0.6, "ENTER", {
        fontFamily: "Georgia, serif",
        fontSize: "32px",
        color: "#101522",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.72, "No mechanics yet: visual scaffold only", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "18px",
        color: "#b9c6dd",
      })
      .setOrigin(0.5);

    cta.on("pointerup", () => {
      this.scene.start(GAME_SCENE_KEY);
    });

    this.scale.on("resize", () => {
      this.scene.restart();
    });

    this.add.rectangle(width / 2, height * 0.9, width - SPACING.lg * 2, 2, COLORS.panelAlt);
  }
}
