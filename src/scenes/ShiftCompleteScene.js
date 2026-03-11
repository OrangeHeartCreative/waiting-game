import Phaser from "phaser";
import { COLORS } from "../ui/tokens";
import { SHIFT_COMPLETE_SCENE_KEY, GAME_SCENE_KEY, MENU_SCENE_KEY } from "./sceneKeys";

const LEVELS_PER_DAY = 3;
const SHIFT_NAMES = ["Breakfast", "Lunch", "Dinner"];

export class ShiftCompleteScene extends Phaser.Scene {
  constructor() {
    super(SHIFT_COMPLETE_SCENE_KEY);
    this.totalScore = 0;
    this.totalDelivered = 0;
    this.shiftLevel = 1;
    this.shiftNumber = 1;
    this.shiftCount = 1;
    this.isDayComplete = false;
  }

  init(data) {
    this.totalScore = data?.totalScore ?? 0;
    this.totalDelivered = data?.totalDelivered ?? 0;
    this.shiftLevel = data?.shiftLevel ?? 1;
    this.shiftNumber = data?.shiftNumber ?? 1;
    this.shiftCount = (this.shiftNumber - 1) * LEVELS_PER_DAY + this.shiftLevel;
    this.isDayComplete = data?.isDayComplete ?? this.shiftLevel >= LEVELS_PER_DAY;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(width / 2, height * 0.22, `SHIFT ${this.shiftCount} COMPLETE`, {
        fontFamily: "Georgia, serif",
        fontSize: "48px",
        color: "#f6c453",
      })
      .setOrigin(0.5);

    const shiftName = SHIFT_NAMES[(this.shiftLevel - 1) % SHIFT_NAMES.length];
    this.add
      .text(width / 2, height * 0.34, `DAY ${this.shiftNumber}  —  ${shiftName}`, {
        fontFamily: "Verdana, sans-serif",
        fontSize: "22px",
        color: "#b9c6dd",
      })
      .setOrigin(0.5);

    if (this.isDayComplete) {
      this.add
        .text(width / 2, height * 0.40, "DAY COMPLETE", {
          fontFamily: "Verdana, sans-serif",
          fontSize: "18px",
          color: "#ffe08a",
        })
        .setOrigin(0.5);
    }

    this.add
      .text(width / 2, height * 0.46, `SCORE: ${this.totalScore}`, {
        fontFamily: "Verdana, sans-serif",
        fontSize: "36px",
        color: "#f1f5ff",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.56, `PLATES SERVED: ${this.totalDelivered}`, {
        fontFamily: "Verdana, sans-serif",
        fontSize: "22px",
        color: "#b9c6dd",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.7, "START NEXT SHIFT", {
        fontFamily: "Georgia, serif",
        fontSize: "32px",
        color: "#f6c453",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.82, "MAIN MENU", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "18px",
        color: "#6a7897",
      })
      .setOrigin(0.5);

    this.input?.keyboard?.on?.("keydown-SPACE", () => this.startNextShift());
    this.input?.keyboard?.on?.("keydown-ESC", () => this.scene.start(MENU_SCENE_KEY));

    this.scale?.on?.("resize", this.handleScaleResize, this);
    this.events?.once?.("shutdown", () => this.scale?.off?.("resize", this.handleScaleResize, this));
  }

  handleScaleResize() {
    this.scene.restart({
      totalScore: this.totalScore,
      totalDelivered: this.totalDelivered,
      shiftLevel: this.shiftLevel,
      shiftNumber: this.shiftNumber,
      isDayComplete: this.isDayComplete,
    });
  }

  startNextShift() {
    this.scene.start(GAME_SCENE_KEY, {
      shiftLevel: this.shiftLevel + 1,
      shiftScore: this.totalScore,
      shiftDelivered: this.totalDelivered,
      shiftNumber: this.shiftNumber,
    });
  }
}
