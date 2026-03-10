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

  create(data) {
    const { width, height } = this.scale;
    const summary = this.resolveRoundSummary(data);
    const ctaLabel = summary.hasRoundResult ? "RETRY" : "START SHIFT";
    const startHint = summary.hasRoundResult ? "Press ENTER or SPACE to retry" : "Press ENTER or SPACE to start";

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

    this.add
      .text(width / 2, height * 0.6, ctaLabel, {
        fontFamily: "Georgia, serif",
        fontSize: "32px",
        color: "#101522",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.72, "Run the maze, collect at PASS, and serve seat orders", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "18px",
        color: "#b9c6dd",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.76, startHint, {
        fontFamily: "Verdana, sans-serif",
        fontSize: "15px",
        color: "#f1f5ff",
      })
      .setOrigin(0.5);

    this.add.rectangle(width / 2, height * 0.82, 470, 106, COLORS.panel).setStrokeStyle(2, COLORS.panelAlt);

    this.add
      .text(width / 2, height * 0.79, summary.primary, {
        fontFamily: "Verdana, sans-serif",
        fontSize: "16px",
        color: "#f1f5ff",
        align: "center",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.85, summary.secondary, {
        fontFamily: "Verdana, sans-serif",
        fontSize: "14px",
        color: "#b9c6dd",
        align: "center",
      })
      .setOrigin(0.5);

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

    this.add.rectangle(width / 2, height * 0.9, width - SPACING.lg * 2, 2, COLORS.panelAlt);
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

  resolveRoundSummary(data) {
    if (!data || !data.reason) {
      return {
        hasRoundResult: false,
        primary: "Last round: none yet",
        secondary: "Start shift: timer, score, and deliveries reset to defaults",
      };
    }

    const label = data.reasonLabel ?? data.reason;
    const score = data.score ?? 0;
    const delivered = data.delivered ?? 0;

    return {
      hasRoundResult: true,
      primary: `Last round: ${label} | Score ${score} | Delivered ${delivered}`,
      secondary: "Press RETRY to run the next shift",
    };
  }
}
