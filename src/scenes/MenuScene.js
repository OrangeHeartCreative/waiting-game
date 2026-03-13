import Phaser from "phaser";
import { MENU_SCENE_KEY, GAME_SCENE_KEY } from "./sceneKeys";
import { AudioManager } from "../audio/AudioManager.js";

const SETTINGS = { masterVol: 8, sfxVol: 8 };
const MENU_UI_FONT_FAMILY = '"Press Start 2P", "Trebuchet MS", sans-serif';
const MENU_DISPLAY_FONT_FAMILY = '"Bangers", "Trebuchet MS", sans-serif';
// Responsive font size: clamped to [min,max] and scaled relative to 1280px reference width.
const clampPx = (base, min, max, w) => `${Math.max(min, Math.min(max, Math.round(base * (w / 1280))))}px`;

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

    this.cameras.main.setBackgroundColor(0x000000);
    this.cameras.main.fadeIn?.(700, 0, 0, 0);

    // Retro CRT scanline overlay
    const scanlines = this.add.graphics?.();
    scanlines?.setDepth?.(10);
    if (scanlines?.fillStyle && scanlines?.fillRect) {
      for (let sy = 0; sy < height; sy += 4) {
        scanlines.fillStyle(0x000000, 0.18);
        scanlines.fillRect(0, sy, width, 2);
      }
    }

    // Edge vignette — darkens frame edges for depth
    this.add.rectangle(0, height / 2, width * 0.2, height, 0x000000, 0.5).setOrigin(0, 0.5).setDepth?.(9);
    this.add.rectangle(width, height / 2, width * 0.2, height, 0x000000, 0.5).setOrigin(1, 0.5).setDepth?.(9);
    this.add.rectangle(width / 2, 0, width, height * 0.14, 0x000000, 0.45).setOrigin(0.5, 0).setDepth?.(9);
    this.add.rectangle(width / 2, height, width, height * 0.14, 0x000000, 0.45).setOrigin(0.5, 1).setDepth?.(9);

    this.drawGameLogo(width / 2, height * 0.31, width);

    this.add
      .text(width / 2, height * 0.487, "A RESTAURANT DELIVERY GAME", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(12, 9, 14, width),
        color: "#6a96bf",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.add.rectangle(width / 2, height * 0.557, Math.min(width * 0.4, 480), 2, 0xf6c453, 0.35).setOrigin(0.5);

    const startPanelY = height * 0.634;
    this.add.rectangle(width / 2, startPanelY, Math.min(width * 0.7, 820), 58, 0x2a0b10, 1).setStrokeStyle(3, 0xf6c453);
    this.add
      .text(width / 2, startPanelY, startHint, {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(18, 12, 22, width),
        color: "#fff0c7",
        stroke: "#190509",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.74, "[ S ] Settings    [ H ] How to Play", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(13, 10, 16, width),
        color: "#6a96bf",
      })
      .setOrigin(0.5);

    // Animated arcade marquee lights
    const lightY = height * 0.81;
    const lightGap = 34;
    const lightRects = [-1, 0, 1].map((offset, index) => {
      const palette = [0xc8a030, 0x59b9ff, 0xe45454][index];
      const outer = this.add.rectangle(width / 2 + offset * lightGap, lightY, 14, 14, palette, 1).setStrokeStyle(2, 0x091422);
      this.add.rectangle(width / 2 + offset * lightGap, lightY, 6, 6, 0xffffff, 0.28);
      return outer;
    });
    if (this.tweens?.add) {
      lightRects.forEach((rect, i) => {
        this.tweens.add({ targets: rect, alpha: 0.2, duration: 700, yoyo: true, repeat: -1, ease: "Sine.InOut", delay: i * 240 });
      });
    }

    this.add
      .text(width / 2, height * 0.955, "\u00a9 2026  ORANGE HEART CREATIVE", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(10, 8, 11, width),
        color: "#2e4460",
      })
      .setOrigin(0.5);

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

    // Web fonts can settle after first paint; reflow any open overlay once final
    // font metrics are available.
    if (globalThis.document?.fonts?.ready?.then) {
      globalThis.document.fonts.ready.then(() => {
        this.time?.delayedCall?.(0, () => {
          if (this.scene?.isActive?.()) {
            this.refreshOpenOverlayLayout();
          }
        });
      });
    }

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

  drawGameLogo(centerX, centerY, width) {
    const logoRadius = Math.min(width * 0.36, 470);

    this.add
      .text(centerX - 3, centerY - logoRadius * 0.17, "DUMB", {
        fontFamily: MENU_DISPLAY_FONT_FAMILY,
        fontSize: clampPx(110, 64, 136, width),
        color: "#ea4837",
        stroke: "#12050b",
        strokeThickness: 14,
      })
      .setOrigin(0.5)
      .setAngle?.(-2);

    this.add
      .text(centerX + 4, centerY + logoRadius * 0.13, "WAITERS!", {
        fontFamily: MENU_DISPLAY_FONT_FAMILY,
        fontSize: clampPx(118, 68, 144, width),
        color: "#f7c549",
        stroke: "#12050b",
        strokeThickness: 15,
      })
      .setOrigin(0.5)
      .setAngle?.(1.2);

    this.add
      .text(centerX, centerY + logoRadius * 0.13, "WAITERS!", {
        fontFamily: MENU_DISPLAY_FONT_FAMILY,
        fontSize: clampPx(118, 68, 144, width),
        color: "#0c0910",
        stroke: "#f7c549",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setAngle?.(1.2);
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
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(22, 14, 26, width),
        color: "#f6c453",
      })
      .setOrigin(0.5);

    let sel = 0;
    const masterTxt = this.add
      .text(cx, cy - 30, `MASTER VOL  ${this._buildVolBar(SETTINGS.masterVol)}`, {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(15, 11, 18, width),
        color: "#f6c453",
      })
      .setOrigin(0.5);
    const sfxTxt = this.add
      .text(cx, cy + 22, `SFX VOL     ${this._buildVolBar(SETTINGS.sfxVol)}`, {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(15, 11, 18, width),
        color: "#8ab0d0",
      })
      .setOrigin(0.5);
    const hintTxt = this.add
      .text(cx, cy + 106, "UP/DOWN select    LEFT/RIGHT adjust    ESC close", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(11, 9, 13, width),
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
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(20, 13, 24, width),
        color: "#f6c453",
      })
      .setOrigin(0.5);

    if (!this.add?.container || !this.add?.circle) {
      const summaryTxt = this.add
        .text(cx, cy + 6, "PICK UP AT PASS\nDELIVER TO HIGHLIGHTED SEAT\nAVOID RIVALS\nP TO PAUSE", {
          fontFamily: MENU_UI_FONT_FAMILY,
          fontSize: clampPx(11, 9, 13, width),
          color: "#d8eaff",
          align: "center",
          lineSpacing: 8,
        })
        .setOrigin(0.5);

      const hintTxt = this.add
        .text(cx, cy + 204, "H or ESC to close", {
          fontFamily: MENU_UI_FONT_FAMILY,
          fontSize: clampPx(10, 8, 12, width),
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
        summaryTxt,
        hintTxt,
        onKey,
      };
      return;
    }

    const cardY = cy + 4;
    const cardW = Math.max(180, Math.min(220, Math.floor((panelW - 110) / 3)));
    const cardH = 248;
    const gap = Math.max(14, Math.min(24, Math.floor((panelW - cardW * 3) / 4)));
    const leftX = cx - (cardW + gap);
    const midX = cx;
    const rightX = cx + (cardW + gap);

    const cardA = this.add.rectangle(leftX, cardY, cardW, cardH, 0x142a49, 1).setStrokeStyle(2, 0x4a6d9c);
    const cardB = this.add.rectangle(midX, cardY, cardW, cardH, 0x142a49, 1).setStrokeStyle(2, 0x4a6d9c);
    const cardC = this.add.rectangle(rightX, cardY, cardW, cardH, 0x142a49, 1).setStrokeStyle(2, 0x4a6d9c);

    const flowArrow1 = this.add
      .text((leftX + midX) / 2, cardY - 12, ">", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(28, 18, 34, width),
        color: "#f6c453",
      })
      .setOrigin(0.5);
    const flowArrow2 = this.add
      .text((midX + rightX) / 2, cardY - 12, ">", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(28, 18, 34, width),
        color: "#f6c453",
      })
      .setOrigin(0.5);

    const cardATitle = this.add
      .text(leftX, cardY - 98, "1) PICK UP", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(12, 9, 14, width),
        color: "#9cd0ff",
      })
      .setOrigin(0.5);
    const passChefHat = this.add.roundRectangle?.(0, -8, 24, 12, 5, 0xf7fbff, 1)
      ?? this.add.rectangle(0, -8, 24, 12, 0xf7fbff, 1);
    passChefHat?.setStrokeStyle?.(1, 0xb7c5d8);
    const passChefBrim = this.add.rectangle(0, -2, 30, 5, 0xe7f0fb, 1).setStrokeStyle?.(1, 0xa6b7cf);
    const passChefFace = this.add.circle(0, 9, 10, 0xffd2a8, 1).setStrokeStyle?.(2, 0x5a2b1f);
    const passChefCoat = this.add.roundRectangle?.(0, 28, 28, 26, 7, 0xf9fcff, 1)
      ?? this.add.rectangle(0, 28, 28, 26, 0xf9fcff, 1);
    passChefCoat?.setStrokeStyle?.(2, 0x4d6388);
    const passIcon = this.add.container(leftX, cardY - 34, [passChefCoat, passChefHat, passChefBrim, passChefFace]);
    const passLabel = this.add
      .text(leftX, cardY + 4, "PASS", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(11, 9, 13, width),
        color: "#ffe8aa",
      })
      .setOrigin(0.5);
    const playerHeadA = this.add.circle(0, -10, 8, 0xffd2a8, 1).setStrokeStyle?.(2, 0x5a2b1f);
    const playerBodyA = this.add.roundRectangle?.(0, 8, 20, 24, 7, 0x2e80ff, 1)
      ?? this.add.rectangle(0, 8, 20, 24, 0x2e80ff, 1);
    playerBodyA?.setStrokeStyle?.(2, 0x163767);
    const playerApronA = this.add.rectangle(0, 11, 12, 14, 0xf7f2e8, 1).setStrokeStyle?.(1, 0x9ea8b5);
    const playerIconA = this.add.container(leftX, cardY + 42, [playerBodyA, playerApronA, playerHeadA]);
    const cardAFoot = this.add
      .text(leftX, cardY + 94, "WASD / ARROWS", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(10, 8, 12, width),
        color: "#d8eaff",
      })
      .setOrigin(0.5);

    const cardBTitle = this.add
      .text(midX, cardY - 98, "2) DELIVER", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(12, 9, 14, width),
        color: "#9cd0ff",
      })
      .setOrigin(0.5);
    const targetRing = this.add.circle(midX, cardY - 22, 22, 0x16324f, 1).setStrokeStyle(3, 0xf6c453);
    const targetSeatRing = this.add.circle(0, 0, 10, 0xf7fbff, 1).setStrokeStyle?.(2, 0x8aa0bf);
    const targetSeatCenter = this.add.circle(0, 0, 5, 0xdde7f3, 1);
    const targetSeat = this.add.container(midX, cardY - 22, [targetSeatRing, targetSeatCenter]);
    const plateRing = this.add.circle(0, 0, 9, 0xffffff, 1).setStrokeStyle?.(2, 0x7fa0d0);
    const plateCenter = this.add.circle(0, 0, 4, 0xe7eef8, 1);
    const plateIcon = this.add.container(midX - 48, cardY + 28, [plateRing, plateCenter]);
    const tossArrow = this.add
      .text(midX - 22, cardY + 28, "->", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(14, 10, 17, width),
        color: "#7fe38b",
      })
      .setOrigin(0.5);
    const comboTxt = this.add
      .text(midX, cardY + 94, "COMBO 3x=1.5  5x=2.0", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(10, 8, 12, width),
        color: "#ffe08a",
      })
      .setOrigin(0.5);

    const cardCTitle = this.add
      .text(rightX, cardY - 98, "3) AVOID", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(12, 9, 14, width),
        color: "#9cd0ff",
      })
      .setOrigin(0.5);
    const rivalHead = this.add.circle(0, -10, 8, 0xffd2a8, 1).setStrokeStyle?.(2, 0x5a2b1f);
    const rivalBody = this.add.roundRectangle?.(0, 8, 20, 24, 7, 0xca4f80, 1)
      ?? this.add.rectangle(0, 8, 20, 24, 0xca4f80, 1);
    rivalBody?.setStrokeStyle?.(2, 0x5f163a);
    const rivalApron = this.add.rectangle(0, 11, 12, 14, 0xf6d9e7, 1).setStrokeStyle?.(1, 0x9f6d85);
    const rivalIcon = this.add.container(rightX, cardY - 20, [rivalBody, rivalApron, rivalHead]);
    const warning = this.add
      .text(rightX, cardY + 26, "!", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(24, 16, 29, width),
        color: "#ffe08a",
      })
      .setOrigin(0.5);
    const penaltyTxt = this.add
      .text(rightX, cardY + 94, "BUMP = TIME LOSS", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(10, 8, 12, width),
        color: "#ffd3d3",
      })
      .setOrigin(0.5);

    const bottomHint = this.add
      .text(cx, cy + 180, "Twists: Rush Hour / Blue Plate / Peak Service   |   Pause: P  Resume: ESC/P  Restart: R  Menu: M", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(9, 8, 11, width),
        color: "#b6d8ff",
        align: "center",
        wordWrap: { width: panelW - 42, useAdvancedWrap: true },
      })
      .setOrigin(0.5);

    const hintTxt = this.add
      .text(cx, cy + 204, "H or ESC to close", {
        fontFamily: MENU_UI_FONT_FAMILY,
        fontSize: clampPx(10, 8, 12, width),
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
      this.refreshOpenOverlayLayout();
      return;
    }

    this.scene.restart();
  }

  refreshOpenOverlayLayout() {
    if (this.settingsOverlay) {
      this.hideSettingsOverlay();
      this.showSettingsOverlay();
      return;
    }

    if (this.howToPlayOverlay) {
      this.hideHowToPlayOverlay();
      this.showHowToPlayOverlay();
    }
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
