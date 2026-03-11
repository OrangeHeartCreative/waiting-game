import Phaser from "phaser";
import { COLORS } from "../ui/tokens";
import { DAY_COMPLETE_SCENE_KEY, GAME_SCENE_KEY, MENU_SCENE_KEY } from "./sceneKeys";

const SHIFT_NAMES = ["Breakfast", "Lunch", "Dinner"];

export class DayCompleteScene extends Phaser.Scene {
  constructor() {
    super(DAY_COMPLETE_SCENE_KEY);
    this.totalScore = 0;
    this.totalDelivered = 0;
    this.shiftNumber = 1;
  }

  init(data) {
    this.totalScore = data?.totalScore ?? 0;
    this.totalDelivered = data?.totalDelivered ?? 0;
    this.shiftNumber = data?.shiftNumber ?? 1;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const nextDay = this.shiftNumber + 1;
    const nextShiftName = SHIFT_NAMES[0];

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add
      .text(width / 2, height * 0.22, `DAY ${this.shiftNumber} COMPLETE`, {
        fontFamily: "Georgia, serif",
        fontSize: "48px",
        color: "#f6c453",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.34, `NEXT: DAY ${nextDay}  —  ${nextShiftName}`, {
        fontFamily: "Verdana, sans-serif",
        fontSize: "22px",
        color: "#b9c6dd",
      })
      .setOrigin(0.5);

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
      shiftNumber: this.shiftNumber,
    });
  }

  startNextShift() {
    this.scene.start(GAME_SCENE_KEY, {
      shiftLevel: 1,
      shiftScore: this.totalScore,
      shiftDelivered: this.totalDelivered,
      shiftNumber: this.shiftNumber + 1,
    });
  }
}