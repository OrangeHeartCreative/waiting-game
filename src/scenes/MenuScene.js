import Phaser from "phaser";
import { COLORS, SPACING } from "../ui/tokens";
import { MENU_SCENE_KEY, GAME_SCENE_KEY } from "./sceneKeys";
import { AudioManager } from "../audio/AudioManager.js";

const SETTINGS = { masterVol: 8, sfxVol: 8 };

export class MenuScene extends Phaser.Scene {
  constructor() {
    super(MENU_SCENE_KEY);
    this.transitioningToGame = false;
    this.onEnterKeyDown = null;
    this.onSpaceKeyDown = null;
    this.onScaleResize = null;
    this.enterKey = null;
    this.spaceKey = null;
    this.settingsKey = null;
    this.howToPlayKey = null;
    this.settingsOverlay = null;
    this.howToPlayOverlay = null;
    this.overlayToggleLockedUntil = 0;
    this.lastResizeAt = 0;
    this.onMenuInputGesture = null;
  }

  init() {
    this.transitioningToGame = false;
    this.lastResizeAt = 0;
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
      .text(width / 2, height * 0.28, "DUMB WAITERS!", {
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

    this.add
      .text(width / 2, height * 0.845, "[ S ] Settings    [ H ] How to Play", {
        fontFamily: "Courier New, monospace",
        fontSize: "13px",
        color: "#6a96bf",
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
    this.enterKey = this.input?.keyboard?.addKey?.(Phaser.Input.Keyboard.KeyCodes.ENTER) ?? null;
    this.spaceKey = this.input?.keyboard?.addKey?.(Phaser.Input.Keyboard.KeyCodes.SPACE) ?? null;
    this.settingsKey = this.input?.keyboard?.addKey?.(Phaser.Input.Keyboard.KeyCodes.S) ?? null;
    this.howToPlayKey = this.input?.keyboard?.addKey?.(Phaser.Input.Keyboard.KeyCodes.H) ?? null;

    SETTINGS.masterVol = Math.round(AudioManager.getMasterVolume() * 10);
    SETTINGS.sfxVol = Math.round(AudioManager.getSfxVolume() * 10);

    this.input?.keyboard?.off?.("keydown-ENTER", this.onEnterKeyDown, this);
    this.input?.keyboard?.off?.("keydown-SPACE", this.onSpaceKeyDown, this);
    this.scale?.off?.("resize", this.onScaleResize, this);

    this.input?.keyboard?.on?.("keydown-ENTER", this.onEnterKeyDown, this);
    this.input?.keyboard?.on?.("keydown-SPACE", this.onSpaceKeyDown, this);
    this.scale?.on?.("resize", this.onScaleResize, this);

    this.events?.once?.("shutdown", this.cleanupSceneSubscriptions, this);

    this.onMenuInputGesture = this.onMenuInputGesture ?? this.handleMenuInputGesture.bind(this);
    this.input?.keyboard?.off?.("keydown", this.onMenuInputGesture, this);
    this.input?.off?.("pointerdown", this.onMenuInputGesture, this);
    this.input?.keyboard?.on?.("keydown", this.onMenuInputGesture, this);
    this.input?.on?.("pointerdown", this.onMenuInputGesture, this);

    AudioManager.playMenuMusic();
  }

  handleMenuInputGesture() {
    if (this.transitioningToGame) {
      return;
    }

    AudioManager.resume();
    AudioManager.playMenuMusic();
  }

  handleStartInput() {
    if (this.transitioningToGame || this.settingsOverlay || this.howToPlayOverlay) {
      return;
    }

    this.transitioningToGame = true;
    // Unlock Web Audio on the confirmed user gesture so in-game SFX can play.
    AudioManager.resume();
    AudioManager.stopMusic();
    this.scene.start(GAME_SCENE_KEY);
  }

  update() {
    if ((this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) || (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey))) {
      this.handleStartInput();
    }

    if (this.settingsKey && Phaser.Input.Keyboard.JustDown(this.settingsKey)) {
      this.toggleSettingsOverlay();
    }

    if (this.howToPlayKey && Phaser.Input.Keyboard.JustDown(this.howToPlayKey)) {
      this.toggleHowToPlayOverlay();
    }
  }

  toggleSettingsOverlay(evt) {
    const now = this.time?.now ?? Date.now();
    if (now < this.overlayToggleLockedUntil) {
      return;
    }
    if (evt?.repeat) {
      return;
    }

    this.overlayToggleLockedUntil = now + 180;
    if (this.settingsOverlay) {
      this.hideSettingsOverlay();
    } else {
      this.hideHowToPlayOverlay();
      this.showSettingsOverlay();
    }
  }

  showSettingsOverlay() {
    if (this.settingsOverlay) return;
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const panelW = Math.min(width * 0.6, 560);
    const panelH = 300;

    const bg = this.add.rectangle(cx, cy, width, height, 0x000000, 0.72);
    const panel = this.add.rectangle(cx, cy, panelW, panelH, 0x0d1f38, 1).setStrokeStyle(3, 0xf6c453);
    const titleTxt = this.add
      .text(cx, cy - 90, "SETTINGS", {
        fontFamily: "Courier New, monospace",
        fontSize: "28px",
        color: "#f6c453",
      })
      .setOrigin(0.5);

    let sel = 0;
    const masterTxt = this.add
      .text(cx, cy - 30, `MASTER VOL  ${this._buildVolBar(SETTINGS.masterVol)}`, {
        fontFamily: "Courier New, monospace",
        fontSize: "19px",
        color: "#f6c453",
      })
      .setOrigin(0.5);
    const sfxTxt = this.add
      .text(cx, cy + 22, `SFX VOL     ${this._buildVolBar(SETTINGS.sfxVol)}`, {
        fontFamily: "Courier New, monospace",
        fontSize: "19px",
        color: "#8ab0d0",
      })
      .setOrigin(0.5);
    const hintTxt = this.add
      .text(cx, cy + 106, "UP/DOWN select    LEFT/RIGHT adjust    ESC close", {
        fontFamily: "Courier New, monospace",
        fontSize: "13px",
        color: "#6a96bf",
      })
      .setOrigin(0.5);

    const refresh = () => {
      masterTxt.setText(`MASTER VOL  ${this._buildVolBar(SETTINGS.masterVol)}`);
      sfxTxt.setText(`SFX VOL     ${this._buildVolBar(SETTINGS.sfxVol)}`);
      masterTxt.setColor(sel === 0 ? "#f6c453" : "#8ab0d0");
      sfxTxt.setColor(sel === 1 ? "#f6c453" : "#8ab0d0");
    };

    const onKey = (evt) => {
      if (evt.key === "Escape") {
        this.hideSettingsOverlay();
        return;
      }
      if (evt.key === "ArrowUp" || evt.key === "ArrowDown") {
        sel = evt.key === "ArrowDown" ? (sel + 1) % 2 : (sel + 1) % 2;
        refresh();
        return;
      }
      if (evt.key === "ArrowLeft" || evt.key === "ArrowRight") {
        const delta = evt.key === "ArrowRight" ? 1 : -1;
        if (sel === 0) {
          SETTINGS.masterVol = Math.min(10, Math.max(0, SETTINGS.masterVol + delta));
          AudioManager.setMasterVolume(SETTINGS.masterVol / 10);
        } else {
          SETTINGS.sfxVol = Math.min(10, Math.max(0, SETTINGS.sfxVol + delta));
          AudioManager.setSfxVolume(SETTINGS.sfxVol / 10);
        }
        refresh();
      }
    };

    this.input?.keyboard?.on?.("keydown", onKey);
    this.settingsOverlay = { bg, panel, titleTxt, masterTxt, sfxTxt, hintTxt, onKey };
  }

  hideSettingsOverlay() {
    if (!this.settingsOverlay) return;
    const { bg, panel, titleTxt, masterTxt, sfxTxt, hintTxt, onKey } = this.settingsOverlay;
    this.input?.keyboard?.off?.("keydown", onKey);
    [bg, panel, titleTxt, masterTxt, sfxTxt, hintTxt].forEach((o) => o?.destroy());
    this.settingsOverlay = null;
  }

  toggleHowToPlayOverlay(evt) {
    const now = this.time?.now ?? Date.now();
    if (now < this.overlayToggleLockedUntil) {
      return;
    }
    if (evt?.repeat) {
      return;
    }

    this.overlayToggleLockedUntil = now + 180;
    if (this.howToPlayOverlay) {
      this.hideHowToPlayOverlay();
    } else {
      this.hideSettingsOverlay();
      this.showHowToPlayOverlay();
    }
  }

  showHowToPlayOverlay() {
    if (this.howToPlayOverlay) return;
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;
    const panelW = Math.min(width * 0.9, 900);
    const panelH = 460;

    const bg = this.add.rectangle(cx, cy, width, height, 0x000000, 0.72);
    const panel = this.add.rectangle(cx, cy, panelW, panelH, 0x0d1f38, 1).setStrokeStyle(3, 0xf6c453);
    const titleTxt = this.add
      .text(cx, cy - 190, "HOW TO PLAY", {
        fontFamily: "Courier New, monospace",
        fontSize: "26px",
        color: "#f6c453",
      })
      .setOrigin(0.5);

    const cardY = cy + 4;
    const cardW = 230;
    const cardH = 248;
    const gap = 24;
    const leftX = cx - cardW - gap;
    const midX = cx;
    const rightX = cx + cardW + gap;

    const cardA = this.add.rectangle(leftX, cardY, cardW, cardH, 0x142a49, 1).setStrokeStyle(2, 0x4a6d9c);
    const cardB = this.add.rectangle(midX, cardY, cardW, cardH, 0x142a49, 1).setStrokeStyle(2, 0x4a6d9c);
    const cardC = this.add.rectangle(rightX, cardY, cardW, cardH, 0x142a49, 1).setStrokeStyle(2, 0x4a6d9c);

    const flowArrow1 = this.add
      .text(cx - 128, cardY - 12, ">", {
        fontFamily: "Courier New, monospace",
        fontSize: "40px",
        color: "#f6c453",
      })
      .setOrigin(0.5);
    const flowArrow2 = this.add
      .text(cx + 128, cardY - 12, ">", {
        fontFamily: "Courier New, monospace",
        fontSize: "40px",
        color: "#f6c453",
      })
      .setOrigin(0.5);

    const cardATitle = this.add
      .text(leftX, cardY - 98, "1) PICK UP", {
        fontFamily: "Courier New, monospace",
        fontSize: "16px",
        color: "#9cd0ff",
      })
      .setOrigin(0.5);
    const passIcon = this.textures?.exists?.("chef")
      ? this.add.image(leftX, cardY - 30, "chef").setDisplaySize(46, 62)
      : this.add.rectangle(leftX, cardY - 30, 94, 46, 0x2f4670, 1).setStrokeStyle(2, 0xf6c453);
    const passLabel = this.add
      .text(leftX, cardY + 4, "PASS", {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        color: "#ffe8aa",
      })
      .setOrigin(0.5);
    const playerIconA = this.textures?.exists?.("waiter-player")
      ? this.add.image(leftX, cardY + 42, "waiter-player").setDisplaySize(28, 40)
      : this.add.circle(leftX, cardY + 42, 11, 0x59b9ff, 1).setStrokeStyle(2, 0xdaf3ff);
    const cardAFoot = this.add
      .text(leftX, cardY + 94, "WASD / ARROWS", {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        color: "#d8eaff",
      })
      .setOrigin(0.5);

    const cardBTitle = this.add
      .text(midX, cardY - 98, "2) DELIVER", {
        fontFamily: "Courier New, monospace",
        fontSize: "16px",
        color: "#9cd0ff",
      })
      .setOrigin(0.5);
    const targetRing = this.add.circle(midX, cardY - 22, 22, 0x16324f, 1).setStrokeStyle(3, 0xf6c453);
    const targetSeat = this.textures?.exists?.("plate")
      ? this.add.image(midX, cardY - 22, "plate").setDisplaySize(22, 22)
      : this.add.circle(midX, cardY - 22, 10, 0xf6c453, 1);
    const plateIcon = this.textures?.exists?.("plate")
      ? this.add.image(midX - 48, cardY + 28, "plate").setDisplaySize(20, 20)
      : this.add.circle(midX - 48, cardY + 28, 9, 0xffffff, 1).setStrokeStyle(2, 0x7fa0d0);
    const tossArrow = this.add
      .text(midX - 22, cardY + 28, "->", {
        fontFamily: "Courier New, monospace",
        fontSize: "18px",
        color: "#7fe38b",
      })
      .setOrigin(0.5);
    const comboTxt = this.add
      .text(midX, cardY + 94, "COMBO 3x=1.5  5x=2.0", {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        color: "#ffe08a",
      })
      .setOrigin(0.5);

    const cardCTitle = this.add
      .text(rightX, cardY - 98, "3) AVOID", {
        fontFamily: "Courier New, monospace",
        fontSize: "16px",
        color: "#9cd0ff",
      })
      .setOrigin(0.5);
    const rivalIcon = this.textures?.exists?.("waiter-rival")
      ? this.add.image(rightX, cardY - 20, "waiter-rival").setDisplaySize(30, 42)
      : this.add.rectangle(rightX, cardY - 20, 28, 36, 0xe45454, 1).setStrokeStyle(2, 0xffb4b4);
    const warning = this.add
      .text(rightX, cardY + 26, "!", {
        fontFamily: "Courier New, monospace",
        fontSize: "34px",
        color: "#ffe08a",
      })
      .setOrigin(0.5);
    const penaltyTxt = this.add
      .text(rightX, cardY + 94, "BUMP = TIME LOSS", {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        color: "#ffd3d3",
      })
      .setOrigin(0.5);

    const bottomHint = this.add
      .text(cx, cy + 180, "Twists: Rush Hour / Blue Plate / Peak Service   |   Pause: P  Resume: ESC/P  Restart: R  Menu: M", {
        fontFamily: "Courier New, monospace",
        fontSize: "12px",
        color: "#b6d8ff",
      })
      .setOrigin(0.5);

    const hintTxt = this.add
      .text(cx, cy + 204, "H or ESC to close", {
        fontFamily: "Courier New, monospace",
        fontSize: "13px",
        color: "#8fb9df",
      })
      .setOrigin(0.5);

    const onKey = (evt) => {
      if (evt.key === "Escape") {
        this.hideHowToPlayOverlay();
      }
    };

    this.input?.keyboard?.on?.("keydown", onKey);
    this.howToPlayOverlay = {
      bg,
      panel,
      titleTxt,
      cardA,
      cardB,
      cardC,
      flowArrow1,
      flowArrow2,
      cardATitle,
      passIcon,
      passLabel,
      playerIconA,
      cardAFoot,
      cardBTitle,
      targetRing,
      targetSeat,
      plateIcon,
      tossArrow,
      comboTxt,
      cardCTitle,
      rivalIcon,
      warning,
      penaltyTxt,
      bottomHint,
      hintTxt,
      onKey,
    };
  }

  hideHowToPlayOverlay() {
    if (!this.howToPlayOverlay) return;
    const { onKey, ...overlayObjects } = this.howToPlayOverlay;
    this.input?.keyboard?.off?.("keydown", onKey);
    Object.values(overlayObjects).forEach((o) => o?.destroy());
    this.howToPlayOverlay = null;
  }

  handleScaleResize() {
    const now = this.time?.now ?? Date.now();
    if (now - this.lastResizeAt < 250) {
      return;
    }

    this.lastResizeAt = now;
    if (this.settingsOverlay || this.howToPlayOverlay) {
      return;
    }

    this.scene.restart();
  }

  cleanupSceneSubscriptions() {
    this.input?.keyboard?.off?.("keydown-ENTER", this.onEnterKeyDown, this);
    this.input?.keyboard?.off?.("keydown-SPACE", this.onSpaceKeyDown, this);
    this.input?.keyboard?.off?.("keydown", this.onMenuInputGesture, this);
    this.input?.off?.("pointerdown", this.onMenuInputGesture, this);
    this.scale?.off?.("resize", this.onScaleResize, this);
    this.enterKey = null;
    this.spaceKey = null;
    this.settingsKey = null;
    this.howToPlayKey = null;
    this.onMenuInputGesture = null;
    this.hideSettingsOverlay();
    this.hideHowToPlayOverlay();
  }

  _buildVolBar(level) {
    const filled = Math.round(level);
    return "[" + "|".repeat(filled) + "\xB7".repeat(10 - filled) + "]";
  }
}
