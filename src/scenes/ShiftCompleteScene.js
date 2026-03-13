import Phaser from "phaser";
import { SHIFT_COMPLETE_SCENE_KEY, GAME_SCENE_KEY, MENU_SCENE_KEY } from "./sceneKeys";

const LEVELS_PER_DAY = 3;
const SHIFT_NAMES = ["Breakfast", "Lunch", "Dinner"];
const DISPLAY_FONT = '"Bangers", "Trebuchet MS", sans-serif';
const UI_FONT = '"Press Start 2P", "Trebuchet MS", sans-serif';
const clampPx = (base, min, max, w) => `${Math.max(min, Math.min(max, Math.round(base * (w / 1280))))}px`;

export class ShiftCompleteScene extends Phaser.Scene {
  constructor() {
    super(SHIFT_COMPLETE_SCENE_KEY);
    this.totalScore = 0;
    this.totalDelivered = 0;
    this.shiftLevel = 1;
    this.shiftNumber = 1;
    this.shiftCount = 1;
    this.isDayComplete = false;
    this.bestCombo = 0;
    this.onNextShiftKeyDown = null;
    this.onMenuKeyDown = null;
  }

  init(data) {
    this.totalScore = data?.totalScore ?? 0;
    this.totalDelivered = data?.totalDelivered ?? 0;
    this.shiftLevel = data?.shiftLevel ?? 1;
    this.shiftNumber = data?.shiftNumber ?? 1;
    this.shiftCount = (this.shiftNumber - 1) * LEVELS_PER_DAY + this.shiftLevel;
    this.isDayComplete = data?.isDayComplete ?? this.shiftLevel >= LEVELS_PER_DAY;
    this.bestCombo = data?.bestCombo ?? 0;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const cx = width / 2;
    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.fadeIn?.(600, 0, 0, 0);

    // CRT scanline overlay
    const scanlines = this.add.graphics?.();
    scanlines?.setDepth?.(10);
    if (scanlines?.fillStyle && scanlines?.fillRect) {
      for (let sy = 0; sy < height; sy += 4) {
        scanlines.fillStyle(0x000000, 0.16);
        scanlines.fillRect(0, sy, width, 2);
      }
    }

    // Edge vignette
    this.add.rectangle(0, height / 2, width * 0.18, height, 0x000000, 0.5).setOrigin(0, 0.5).setDepth?.(9);
    this.add.rectangle(width, height / 2, width * 0.18, height, 0x000000, 0.5).setOrigin(1, 0.5).setDepth?.(9);

    this.add
      .text(cx, height * 0.12, `SHIFT ${this.shiftCount} COMPLETE`, {
        fontFamily: DISPLAY_FONT,
        fontSize: clampPx(72, 44, 88, width),
        color: "#f6c453",
        stroke: "#21070b",
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    const shiftName = SHIFT_NAMES[(this.shiftLevel - 1) % SHIFT_NAMES.length];
    this.add
      .text(cx, height * 0.24, `DAY ${this.shiftNumber}  \u2014  ${shiftName.toUpperCase()}`, {
        fontFamily: UI_FONT,
        fontSize: clampPx(16, 11, 20, width),
        color: "#b9c6dd",
        stroke: "#0d1728",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add.rectangle(cx, height * 0.31, Math.min(width * 0.5, 600), 2, 0xf6c453, 0.4).setOrigin(0.5);

    if (this.isDayComplete) {
      this.add
        .text(cx, height * 0.355, "\u2605  DAY COMPLETE  \u2605", {
          fontFamily: DISPLAY_FONT,
          fontSize: clampPx(36, 22, 44, width),
          color: "#ffe08a",
          stroke: "#21070b",
          strokeThickness: 8,
        })
        .setOrigin(0.5);
    }

    const statsTopY = this.isDayComplete ? 0.46 : 0.41;

    // Stats card background
    this.add
      .rectangle(cx, height * (statsTopY + 0.12), Math.min(width * 0.68, 800), 170, 0x080e1a, 1)
      .setStrokeStyle(1, 0x1e3352);

    const statsCenterY = statsTopY + 0.12;
    const scoreY = statsCenterY - 0.045;
    const platesY = statsCenterY + 0.045;

    this.add
      .text(cx, height * scoreY, `SCORE  ${this.totalScore}`, {
        fontFamily: UI_FONT,
        fontSize: clampPx(22, 14, 27, width),
        color: "#f1f5ff",
        stroke: "#0d1a30",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, height * platesY, `PLATES  ${this.totalDelivered}`, {
        fontFamily: UI_FONT,
        fontSize: clampPx(15, 11, 19, width),
        color: "#b9c6dd",
        stroke: "#111d33",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    const btnYFrac = statsTopY + 0.35;
    this.add.rectangle(cx, height * (btnYFrac - 0.04), Math.min(width * 0.4, 480), 2, 0xf6c453, 0.3).setOrigin(0.5);

    this.add.rectangle(cx, height * btnYFrac, Math.min(width * 0.7, 820), 58, 0x2a0b10, 1).setStrokeStyle(3, 0xf6c453);
    this.add
      .text(cx, height * btnYFrac, "START NEXT SHIFT", {
        fontFamily: UI_FONT,
        fontSize: clampPx(18, 12, 22, width),
        color: "#f6c453",
        stroke: "#21070b",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, height * (btnYFrac + 0.115), "ENTER / SPACE: CONTINUE   \u00b7   ESC: MAIN MENU", {
        fontFamily: UI_FONT,
        fontSize: clampPx(11, 9, 13, width),
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
      shiftLevel: this.shiftLevel,
      shiftNumber: this.shiftNumber,
      isDayComplete: this.isDayComplete,
      bestCombo: this.bestCombo,
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

  cleanupSceneSubscriptions() {
    this.input?.keyboard?.off?.("keydown-ENTER", this.onNextShiftKeyDown, this);
    this.input?.keyboard?.off?.("keydown-SPACE", this.onNextShiftKeyDown, this);
    this.input?.keyboard?.off?.("keydown-ESC", this.onMenuKeyDown, this);
    this.scale?.off?.("resize", this.handleScaleResize, this);
  }

}
