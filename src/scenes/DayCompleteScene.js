import Phaser from "phaser";
import { DAY_COMPLETE_SCENE_KEY, GAME_SCENE_KEY, MENU_SCENE_KEY } from "./sceneKeys";

const SHIFT_NAMES = ["Breakfast", "Lunch", "Dinner"];
const DISPLAY_FONT = '"Bangers", "Trebuchet MS", sans-serif';
const UI_FONT = '"Press Start 2P", "Trebuchet MS", sans-serif';
const clampPx = (base, min, max, w) => `${Math.max(min, Math.min(max, Math.round(base * (w / 1280))))}px`;

export class DayCompleteScene extends Phaser.Scene {
  constructor() {
    super(DAY_COMPLETE_SCENE_KEY);
    this.totalScore = 0;
    this.totalDelivered = 0;
    this.shiftNumber = 1;
    this.bestCombo = 0;
    this.onNextShiftKeyDown = null;
    this.onMenuKeyDown = null;
  }

  init(data) {
    this.totalScore = data?.totalScore ?? 0;
    this.totalDelivered = data?.totalDelivered ?? 0;
    this.shiftNumber = data?.shiftNumber ?? 1;
    this.bestCombo = data?.bestCombo ?? 0;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    const cx = width / 2;
    const nextDay = this.shiftNumber + 1;
    const nextShiftName = SHIFT_NAMES[0];
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
      .text(cx, height * 0.12, `DAY ${this.shiftNumber} COMPLETE`, {
        fontFamily: DISPLAY_FONT,
        fontSize: clampPx(72, 44, 88, width),
        color: "#f6c453",
        stroke: "#21070b",
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, height * 0.24, `NEXT: DAY ${nextDay}  \u2014  ${nextShiftName.toUpperCase()}`, {
        fontFamily: UI_FONT,
        fontSize: clampPx(16, 11, 20, width),
        color: "#b9c6dd",
        stroke: "#0d1728",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add.rectangle(cx, height * 0.31, Math.min(width * 0.5, 600), 2, 0xf6c453, 0.4).setOrigin(0.5);

    const hasCombo = this.bestCombo >= 3;

    // Stats card background
    this.add
      .rectangle(cx, height * (hasCombo ? 0.565 : 0.535), Math.min(width * 0.68, 800), hasCombo ? 240 : 195, 0x080e1a, 1)
      .setStrokeStyle(1, 0x1e3352);

    this.add
      .text(cx, height * 0.38, `SCORE  ${this.totalScore}`, {
        fontFamily: UI_FONT,
        fontSize: clampPx(22, 14, 27, width),
        color: "#f1f5ff",
        stroke: "#0d1a30",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(cx, height * 0.47, `PLATES  ${this.totalDelivered}`, {
        fontFamily: UI_FONT,
        fontSize: clampPx(15, 11, 19, width),
        color: "#b9c6dd",
        stroke: "#111d33",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    const grade = this.getPerformanceGrade(this.totalScore, this.shiftNumber);
    const gradeColors = { S: "#ffe08a", A: "#88e888", B: "#60c8f0", C: "#c0c0c0" };
    const gradeColor = gradeColors[grade] ?? "#c0c0c0";
    this.add
      .text(cx, height * 0.57, grade, {
        fontFamily: DISPLAY_FONT,
        fontSize: clampPx(52, 32, 64, width),
        color: gradeColor,
        stroke: "#0d1728",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    if (hasCombo) {
      this.add
        .text(cx, height * 0.66, `BEST COMBO  \u00d7${this.bestCombo}`, {
          fontFamily: UI_FONT,
          fontSize: clampPx(13, 9, 16, width),
          color: "#ffe08a",
          stroke: "#0d1728",
          strokeThickness: 2,
        })
        .setOrigin(0.5);
    }

    const btnYFrac = hasCombo ? 0.78 : 0.74;
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
      shiftNumber: this.shiftNumber,
      bestCombo: this.bestCombo,
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

  /** Returns S/A/B/C based on score relative to day number. */
  getPerformanceGrade(score, dayNumber) {
    const threshold = (dayNumber ?? 1) * 90;
    if (score >= threshold * 4) return "S";
    if (score >= threshold * 2.5) return "A";
    if (score >= threshold * 1.2) return "B";
    return "C";
  }
}