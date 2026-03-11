import Phaser from "phaser";
import { COLORS } from "../ui/tokens";
import { DAY_COMPLETE_SCENE_KEY, GAME_SCENE_KEY, MENU_SCENE_KEY } from "./sceneKeys";

const SHIFT_NAMES = ["Breakfast", "Lunch", "Dinner"];
const GOLD_ACCENT = 13148208;

export class DayCompleteScene extends Phaser.Scene {
  constructor() {
    super(DAY_COMPLETE_SCENE_KEY);
    this.totalScore = 0;
    this.totalDelivered = 0;
    this.shiftNumber = 1;
    this.onNextShiftKeyDown = null;
    this.onMenuKeyDown = null;
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
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f2038, 1).setOrigin(0.5, 0.5);
    this.add.rectangle(width / 2, height / 2, width * 0.96, height * 0.9, 0x132742, 1).setStrokeStyle(4, GOLD_ACCENT);
    for (let y = 38; y < height - 38; y += 18) {
      this.add.rectangle(width / 2, y, width * 0.92, 2, 0x1b3352, 0.45);
    }

    const panelWidth = Math.min(width * 0.84, 980);
    const panelHeight = Math.min(height * 0.66, 560);
    const panelX = width / 2;
    const panelY = height / 2;
    const panelTop = panelY - panelHeight / 2;

    this.add.rectangle(panelX + 6, panelY + 6, panelWidth, panelHeight, 0x050a13, 0.5);
    this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x142238, 1).setStrokeStyle(4, GOLD_ACCENT);
    this.add.rectangle(panelX, panelTop + 40, panelWidth - 10, 72, 0x2a0b10, 1).setStrokeStyle(2, GOLD_ACCENT);

    this.add.rectangle(panelX - panelWidth / 2 + 34, panelTop + 40, 42, 42, 0x4c1120, 0.95).setStrokeStyle(2, GOLD_ACCENT);
    this.add.rectangle(panelX + panelWidth / 2 - 34, panelTop + 40, 42, 42, 0x4c1120, 0.95).setStrokeStyle(2, GOLD_ACCENT);

    this.add
      .text(panelX, panelTop + 40, `DAY ${this.shiftNumber} COMPLETE`, {
        fontFamily: "Courier New, monospace",
        fontSize: "48px",
        color: "#f6c453",
        stroke: "#21070b",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(panelX, panelTop + 122, `NEXT: DAY ${nextDay}  —  ${nextShiftName}`, {
        fontFamily: "Courier New, monospace",
        fontSize: "21px",
        color: "#b9c6dd",
        stroke: "#0d1728",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add
      .rectangle(panelX, panelTop + 230, panelWidth - 120, 72, 0x1a3152, 1)
      .setStrokeStyle(2, 0x93b8ff);

    this.add
      .text(panelX, panelTop + 230, `SCORE: ${this.totalScore}`, {
        fontFamily: "Courier New, monospace",
        fontSize: "32px",
        color: "#f1f5ff",
        stroke: "#0d1a30",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add.rectangle(panelX, panelTop + 302, panelWidth - 200, 54, 0x1a2a45, 1).setStrokeStyle(2, 0x4f6994);
    this.add
      .text(panelX, panelTop + 302, `PLATES SERVED: ${this.totalDelivered}`, {
        fontFamily: "Courier New, monospace",
        fontSize: "23px",
        color: "#b9c6dd",
        stroke: "#111d33",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add.rectangle(panelX, panelTop + 406, panelWidth - 220, 56, 0x341019, 1).setStrokeStyle(3, GOLD_ACCENT);
    this.add
      .text(panelX, panelTop + 404, "START NEXT SHIFT", {
        fontFamily: "Courier New, monospace",
        fontSize: "30px",
        color: "#f6c453",
        stroke: "#21070b",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(panelX, panelTop + 468, "ENTER / SPACE: CONTINUE   ·   ESC: MAIN MENU", {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        color: "#6a7897",
        stroke: "#0d1728",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.onNextShiftKeyDown = this.onNextShiftKeyDown ?? this.startNextShift.bind(this);
    this.onMenuKeyDown = this.onMenuKeyDown ?? (() => this.scene.start(MENU_SCENE_KEY));

    this.input?.keyboard?.off?.("keydown-ENTER", this.onNextShiftKeyDown, this);
    this.input?.keyboard?.off?.("keydown-SPACE", this.onNextShiftKeyDown, this);
    this.input?.keyboard?.off?.("keydown-ESC", this.onMenuKeyDown, this);

    this.input?.keyboard?.on?.("keydown-ENTER", this.onNextShiftKeyDown, this);
    this.input?.keyboard?.on?.("keydown-SPACE", this.onNextShiftKeyDown, this);
    this.input?.keyboard?.on?.("keydown-ESC", this.onMenuKeyDown, this);

    this.scale?.on?.("resize", this.handleScaleResize, this);
    this.events?.once?.("shutdown", this.cleanupSceneSubscriptions, this);
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

  cleanupSceneSubscriptions() {
    this.input?.keyboard?.off?.("keydown-ENTER", this.onNextShiftKeyDown, this);
    this.input?.keyboard?.off?.("keydown-SPACE", this.onNextShiftKeyDown, this);
    this.input?.keyboard?.off?.("keydown-ESC", this.onMenuKeyDown, this);
    this.scale?.off?.("resize", this.handleScaleResize, this);
  }
}