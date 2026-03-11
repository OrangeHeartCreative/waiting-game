import Phaser from "phaser";
import { COLORS, SPACING } from "../ui/tokens";
import { MENU_SCENE_KEY, GAME_SCENE_KEY } from "./sceneKeys";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(MENU_SCENE_KEY);
    this.transitioningToGame = false;
    this.onEnterKeyDown = null;
    this.onSpaceKeyDown = null;
    this.onScaleResize = null;
  }

  init() {
    this.transitioningToGame = false;
  }

  create() {
    const { width, height } = this.scale;
    const startHint = "Press ENTER or SPACE to start";

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a1526, 1);
    this.add.rectangle(width / 2, height / 2, width * 0.96, height * 0.9, 0x10243e, 1).setStrokeStyle(4, 0xc8a030);
    this.add.rectangle(width / 2, 22, width * 0.94, 18, 0x2a0b10, 1).setStrokeStyle(2, 0xc8a030);
    this.add.rectangle(width / 2, height - 22, width * 0.94, 18, 0x2a0b10, 1).setStrokeStyle(2, 0xc8a030);

    for (let y = 42; y < height - 42; y += 16) {
      this.add.rectangle(width / 2, y, width * 0.92, 2, 0x183050, 0.5);
    }

    const titlePanelY = height * 0.28;
    const titlePanelWidth = Math.min(width * 0.8, 920);
    this.add.rectangle(width / 2, titlePanelY, titlePanelWidth + 16, 116, 0x07101d, 1);
    this.add.rectangle(width / 2, titlePanelY, titlePanelWidth, 102, 0x1a2f4f, 1).setStrokeStyle(4, 0xf6c453);
    this.add.rectangle(width / 2 - titlePanelWidth / 2 + 24, titlePanelY, 14, 64, 0xc8a030, 1);
    this.add.rectangle(width / 2 + titlePanelWidth / 2 - 24, titlePanelY, 14, 64, 0xc8a030, 1);

    this.add
      .text(width / 2, height * 0.28, "WAITING GAME", {
        fontFamily: "Courier New, monospace",
        fontSize: "66px",
        color: "#f6c453",
        stroke: "#23080a",
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    const controlsPanelY = height * 0.56;
    this.add.rectangle(width / 2, controlsPanelY, Math.min(width * 0.64, 760), 122, 0x152843, 1).setStrokeStyle(3, 0xc8a030);

    this.add
      .text(
        width / 2,
        controlsPanelY,
        "HOW TO MOVE\nWASD or Arrow Keys",
        {
          fontFamily: "Courier New, monospace",
          fontSize: "22px",
          color: "#f1f5ff",
          stroke: "#0f1a2b",
          strokeThickness: 3,
          align: "center",
          lineSpacing: 8,
          wordWrap: {
            width: width - SPACING.lg * 4,
            useAdvancedWrap: true,
          },
        }
      )
      .setOrigin(0.5);

    const startPanelY = height * 0.78;
    this.add.rectangle(width / 2, startPanelY, Math.min(width * 0.7, 820), 58, 0x2a0b10, 1).setStrokeStyle(3, 0xf6c453);
    this.add
      .text(width / 2, startPanelY, startHint, {
        fontFamily: "Courier New, monospace",
        fontSize: "18px",
        color: "#fff0c7",
        stroke: "#190509",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    const lightY = height * 0.88;
    const lightGap = 34;
    [-1, 0, 1].forEach((offset, index) => {
      const palette = [0xc8a030, 0x59b9ff, 0xe45454][index];
      this.add.rectangle(width / 2 + offset * lightGap, lightY, 14, 14, palette, 1).setStrokeStyle(2, 0x091422);
      this.add.rectangle(width / 2 + offset * lightGap, lightY, 6, 6, 0xffffff, 0.28);
    });

    this.onEnterKeyDown = this.onEnterKeyDown ?? this.handleStartInput.bind(this);
    this.onSpaceKeyDown = this.onSpaceKeyDown ?? this.handleStartInput.bind(this);
    this.onScaleResize = this.onScaleResize ?? this.handleScaleResize.bind(this);

    this.input?.keyboard?.off?.("keydown-ENTER", this.onEnterKeyDown, this);
    this.input?.keyboard?.off?.("keydown-SPACE", this.onSpaceKeyDown, this);
    this.scale?.off?.("resize", this.onScaleResize, this);

    this.input?.keyboard?.on?.("keydown-ENTER", this.onEnterKeyDown, this);
    this.input?.keyboard?.on?.("keydown-SPACE", this.onSpaceKeyDown, this);
    this.scale?.on?.("resize", this.onScaleResize, this);

    this.events?.once?.("shutdown", this.cleanupSceneSubscriptions, this);
  }

  handleStartInput() {
    if (this.transitioningToGame) {
      return;
    }

    this.transitioningToGame = true;
    this.scene.start(GAME_SCENE_KEY);
  }

  handleScaleResize() {
    this.scene.restart();
  }

  cleanupSceneSubscriptions() {
    this.input?.keyboard?.off?.("keydown-ENTER", this.onEnterKeyDown, this);
    this.input?.keyboard?.off?.("keydown-SPACE", this.onSpaceKeyDown, this);
    this.scale?.off?.("resize", this.onScaleResize, this);
  }
}
