import Phaser from "phaser";
import { COLORS } from "../ui/tokens";
import { DAY_COMPLETE_SCENE_KEY, GAME_SCENE_KEY, MENU_SCENE_KEY, SHIFT_COMPLETE_SCENE_KEY } from "./sceneKeys";
import { AudioManager } from "../audio/AudioManager.js";

const ROUND_DURATION_SECONDS = 30;
const LEVELS_PER_SHIFT = 3;
const SHIFT_NAMES = ["Breakfast", "Lunch", "Dinner"];
const FIRST_DAY_PLATE_GOAL = 10;
const MIN_ROUND_DURATION_SECONDS = 15;
const ROUND_DURATION_DECAY_PER_DAY = 2.5;
const PLATE_GOAL_INCREASE_PER_DAY = 5;
const PLATE_GOAL_SOFT_CAP_START_DAY = 5;
const PLATE_GOAL_SOFT_CAP_INCREASE_PER_DAY = 2;
const RIVAL_SPEED_INCREASE_PER_DAY = 0.05;
const PLAYER_SPAWN_COLLISION_RADIUS = 20;
const PLAYER_SPAWN_TABLE_BUFFER = 4;
const PLAYER_SPEED = 240;
const INTERACTION_RADIUS = 34;
const MIN_INTERACTION_RADIUS = 24;
const NEXT_QUEUE_LENGTH = 8;
const LEVEL_TABLE_QUEUE_COUNT = 4;
const PLAYER_ASSET_KEY = "waiter-player";
const RIVAL_ASSET_KEY = "waiter-rival";
const CHEF_ASSET_KEY = "chef";
const TABLE_ASSET_KEY = "table";
const HUD_SCORE_ICON_KEY = "hud-score";
const HUD_TIMER_ICON_KEY = "hud-timer";
const HUD_TARGET_ICON_KEY = "hud-target";
const HUD_WARNING_ICON_KEY = "hud-warning";
const RIVAL_COUNT = 4;
const RIVAL_SPEED = 150;
const RIVAL_RADIUS = 14;
const RIVAL_TIME_PENALTY_SECONDS = 1.5;
const RIVAL_HIT_COOLDOWN_MS = 1400;
const RIVAL_POST_HIT_ESCAPE_GRACE_MS = 850;
const RIVAL_POST_BUMP_DISENGAGE_MS = 1200;
const RIVAL_STUN_DURATION_MS = 900;
const RIVAL_BUMP_COOLDOWN_MS = 1800;
const RIVAL_BUMP_CHASE_LOCKOUT_MS = 2600;
const ROUND_BALANCE_LOG_DAY_LIMIT = 10;
const RIVAL_STUCK_RECOVERY_THRESHOLD = 8;
const RIVAL_HARD_RESET_THRESHOLD = 20;
const RIVAL_STALL_MOVEMENT_EPSILON = 0.15;
const RIVAL_STALL_WINDOW_MS = 900;
const RIVAL_STALL_MAX_RECOVERIES = 2;
const RIVAL_INITIAL_CHASE_DELAY_MS = 80;
const RIVAL_PLAYER_FOLLOW_ENGAGE_RADIUS = 170;
const RIVAL_PLAYER_FOLLOW_RELEASE_RADIUS = 210;
const RIVAL_PLAYER_FOLLOW_BUFFER = 28;
const RIVAL_PLAYER_FOLLOW_PREDICTION = 10;
const RIVAL_PLAYER_FOLLOW_MIN_MOTION = 0.08;
const RIVAL_PLAYER_FOLLOW_RETARGET_MS = 220;
const RIVAL_PLAYER_FOLLOW_TARGET_BLEND = 0.35;
const RIVAL_PLAYER_FOLLOW_SPEED_SCALE = 0.88;
const RIVAL_DIRECTION_REPEAT_DOT = 0.86;
const RIVAL_ROUTE_REACH_DISTANCE = 12;
const RIVAL_ROUTE_RETARGET_MIN_MS = 800;
const RIVAL_ROUTE_RETARGET_MAX_MS = 1700;
const RIVAL_TABLE_CONTACT_RETARGET_MIN_MS = 220;
const RIVAL_TABLE_CONTACT_RETARGET_MAX_MS = 420;
const RIVAL_ROUTE_HISTORY_SIZE = 5;
const RIVAL_PATTERN_VERTICAL_TOP_PADDING = 78;
const RIVAL_PATTERN_VERTICAL_BOTTOM_PADDING = 72;
const RIVAL_SPAWN_PLAYER_SAFE_DISTANCE = 150;
const RIVAL_SPAWN_TARGET_DISTANCE = 250;
const RIVAL_SPAWN_MIN_SEPARATION = 150;
const RIVAL_LANE_MARGIN = 20;
const RIVAL_LANES = ["left", "center", "right"];
const RIVAL_SPAWN_LANE_SEQUENCE = ["left", "center", "right", "top-center"];
const RIVAL_PATROL_WAYPOINT_JITTER = 10;
const RIVAL_TABLE_SWITCH_CHANCE = 0.4;
const RIVAL_EDGE_FOLLOW_STEP = 12;
const RIVAL_BUMP_RESPONSE_FACTOR = 0.75;
const RIVAL_BUMP_MIN_IMPULSE = 42;
const RIVAL_PASS_NO_GO_RADIUS = 52;
const RIVAL_VARIATION_BASE_CHANCE = 0.18;
const RIVAL_VARIATION_MAX_CHANCE = 0.38;
const RIVAL_VARIATION_RECENT_HISTORY_BLOCK = 2;
const RIVAL_VARIATION_MIN_WAYPOINTS = 4;
const RIVAL_HOME_ZONE_STALL_MS = 1300;
const RIVAL_HOME_ZONE_PULLBACK_BUFFER = 10;
const RIVAL_DEFAULT_RETARGET_SCALE = 1;
const RIVAL_DEFAULT_PLAYER_INFLUENCE_MIN = 0.12;
const RIVAL_AGGRESSION_PROFILES = [
  { label: "steady", speedScale: 0.92, retargetScale: 1.15, playerInfluenceMin: 0.2, bumpImpulseScale: 0.88 },
  { label: "pressing", speedScale: 1, retargetScale: 1, playerInfluenceMin: 0.14, bumpImpulseScale: 1 },
  { label: "aggressive", speedScale: 1.06, retargetScale: 0.92, playerInfluenceMin: 0.1, bumpImpulseScale: 1.08 },
  // Raised playerInfluenceMin from 0.08 to 0.11 so the top-center diagonal rival
  // only reacts to deliberate player motion rather than micro-movement jitter.
  { label: "relentless", speedScale: 1.1, retargetScale: 0.82, playerInfluenceMin: 0.11, bumpImpulseScale: 1.12 },
];
const PLAYER_SPAWN_SAFE_CHOICES = 4;
const BOUNDARY_WALL_THICKNESS = 16;
const CHEF_ANNOUNCE_DISPLAY_MS = 2400;
const CHEF_POST_DELIVERY_DELAY_MS = 3000;
const SEAT_PAIR_GAP = 30;
const SEAT_RING_OFFSET = 18;
const SEAT_COLLIDER_RADIUS = 13;
const RIVAL_PATROL_CLEARANCE = 10;
const TABLE_VARIANTS = [
  { width: 112, height: 34, orientation: "horizontal" },
  { width: 34, height: 114, orientation: "vertical" },
  { width: 96, height: 30, orientation: "horizontal" },
  { width: 30, height: 102, orientation: "vertical" },
  { width: 120, height: 36, orientation: "horizontal" },
  { width: 36, height: 122, orientation: "vertical" },
  { width: 104, height: 32, orientation: "horizontal" },
  { width: 32, height: 110, orientation: "vertical" },
  { width: 126, height: 38, orientation: "horizontal" },
  { width: 38, height: 98, orientation: "vertical" },
];

// Combo chain
const COMBO_TIER_1_THRESHOLD = 3;
const COMBO_TIER_2_THRESHOLD = 5;
const COMBO_TIER_1_MULTIPLIER = 1.5;
const COMBO_TIER_2_MULTIPLIER = 2.0;
// Pause overlay
const PAUSE_OVERLAY_DEPTH = 100;
// Per-day twist identifiers
const DAY_TWIST_RUSH_HOUR = "rush_hour";
const DAY_TWIST_BLUE_PLATE = "blue_plate";
const DAY_TWIST_PEAK_SERVICE = "peak_service";
const RUSH_HOUR_RIVAL_SPEED_BONUS = 0.15;
const BLUE_PLATE_SCORE_MULTIPLIER = 1.25;
const PEAK_SERVICE_TIMER_PENALTY = 5;
const TIMER_LOW_WARNING_SECONDS = 7;

export class GameScene extends Phaser.Scene {
  constructor() {
    super(GAME_SCENE_KEY);
    this.resetRunState();
  }

  init(data) {
    this.resetRunState();
    if (data) {
      this.shiftLevel = data.shiftLevel ?? 1;
      this.shiftScore = data.shiftScore ?? 0;
      this.shiftDelivered = data.shiftDelivered ?? 0;
      this.shiftNumber = data.shiftNumber ?? 1;
    }
  }

  resetRunState() {
    this.remainingTime = ROUND_DURATION_SECONDS;
    this.deliveredPlates = 0;
    this.score = 0;
    this.roundEnded = false;
    this.chefContainer = null;
    this.chefBubbleContainer = null;
    this.chefSpeechText = null;
    this.chefHiddenY = 0;
    this.chefEmergeY = 0;
    this.hideChefAnnouncementEvent = null;
    this.pendingChefAnnouncementEvent = null;
    this.announcedTargetSeatLabel = null;
    this.orderAnnouncementActive = false;
    this.orderTimerRunning = false;
    this.passReadyForPickup = false;
    this.passInteractionVisual = null;
    this.nextTargets = [];
    this.carryingOrder = false;
    this.orderStage = "needPickup";
    this.rivals = [];
    this.rivalPatrolNoGoColliders = [];
    this.queueTableLabels = [];
    this.calledSeatLabels = new Set();
    this.lastRivalPenaltyAt = -Infinity;
    this.roundStartedAt = 0;
    this.lastKnownScaleSize = null;
    this.playerLastPosition = null;
    this.playerMotionVector = { x: 0, y: 0 };
    this.playerMotionStrength = 0;
    this.playerLocationHintText = null;
    this.rivalPenaltyHintText = null;
    this.scoreHudIcon = null;
    this.timerHudIcon = null;
    this.targetHudIcon = null;
    this.warningHudIcon = null;
    this.hudDamageFlash = null;
    this.hideRivalPenaltyHintEvent = null;
    this.playerRivalGhostUntil = 0;
    this.returnToMenuEvent = null;
    this.onEscKeyDown = null;
    this.layoutIndex = 0;
    this.shiftLevel = 1;
    this.shiftScore = 0;
    this.shiftDelivered = 0;
    this.shiftNumber = 1;
    this.layoutPlateGoal = FIRST_DAY_PLATE_GOAL;
    this.roundBumpCount = 0;
    this.deliveryDurations = [];
    // Combo chain
    this.comboCount = 0;
    this.bestComboStreak = 0;
    this.comboFlashText = null;
    this.hideComboFlashEvent = null;
    // Pause
    this.isPaused = false;
    this.pauseOverlay = null;
    this.onPauseKeyDown = null;
    this.onPauseEnterKeyDown = null;
    this.onRestartShiftDown = null;
    this.pauseResumeKey = null;
    this.pauseRestartKey = null;
    this.pauseMainMenuKey = null;
    // Day twist
    this.dayTwist = null;
    // Timer warning
    this.hasPlayedTimerWarning = false;
    this.rivalBumpDetectedThisFrame = false;
  }

  create() {
    const { width, height } = this.scale;
    const hudTop = 0;
    const hudHeight = 72;
    const hudPrimaryY = 18;
    const hudSecondaryY = 42;
    const hudWarningY = 60;
    const arenaTop = hudTop + hudHeight;
    const arenaHeight = height - arenaTop;

    AudioManager.playGameMusic();

    this.dayTwist = this.getDayTwistForDay(this.shiftNumber);
    this.layoutPlateGoal = this.getLayoutPlateGoalForDay(this.shiftNumber);
    this.remainingTime = this.getRoundDurationSecondsForDay(this.shiftNumber);
    if (this.dayTwist === DAY_TWIST_PEAK_SERVICE) {
      this.remainingTime = Math.max(MIN_ROUND_DURATION_SECONDS, this.remainingTime - PEAK_SERVICE_TIMER_PENALTY);
    }

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add.rectangle(width / 2, hudTop, width, hudHeight, 0x000000, 1).setOrigin(0.5, 0).setDepth?.(30);
    this.hudDamageFlash = this.add.rectangle(width / 2, height / 2, width, height, 0xe45454, 0);
    this.hudDamageFlash?.setDepth?.(31);

    const centerX = width / 2;
    const leftColumnX = centerX - 210;
    const centerColumnX = centerX;
    const rightColumnX = centerX + 210;
    const hudAccentColor = Number.parseInt("F6C453", 16);

    // HUD icons: prefer manifest sprites, fallback to simple vector marks in tests/headless.
    const scoreIconX = leftColumnX - 26;
    const scoreValueX = scoreIconX + 14;
    const scoreIcon = this.textures?.exists?.(HUD_SCORE_ICON_KEY)
      ? this.add.image(scoreIconX, hudPrimaryY, HUD_SCORE_ICON_KEY).setDisplaySize(18, 18)
      : this.textures?.exists?.("plate")
        ? this.add.image(scoreIconX, hudPrimaryY, "plate").setDisplaySize(16, 16)
        : this.add.circle(scoreIconX, hudPrimaryY, 7, hudAccentColor, 1);
    this.scoreHudIcon = scoreIcon;
    scoreIcon?.setDepth?.(32);

    const timerIcon = this.textures?.exists?.(HUD_TIMER_ICON_KEY)
      ? this.add.image(centerColumnX - 58, hudPrimaryY, HUD_TIMER_ICON_KEY).setDisplaySize(18, 18)
      : this.add.circle(centerColumnX - 58, hudPrimaryY, 8, 0x183250, 1);
    this.timerHudIcon = timerIcon;
    timerIcon?.setDepth?.(32);
    if (!this.textures?.exists?.(HUD_TIMER_ICON_KEY)) {
      timerIcon?.setStrokeStyle?.(2, hudAccentColor);
      const timerNeedle = this.add.rectangle(centerColumnX - 56, hudPrimaryY - 1, 2, 7, hudAccentColor, 1);
      timerNeedle?.setDepth?.(33);
    }

    const targetIcon = this.textures?.exists?.(HUD_TARGET_ICON_KEY)
      ? this.add.image(rightColumnX - 30, hudPrimaryY, HUD_TARGET_ICON_KEY).setDisplaySize(18, 18)
      : this.textures?.exists?.("chef")
        ? this.add.image(rightColumnX - 30, hudPrimaryY, "chef").setDisplaySize(16, 16)
        : this.add.triangle(rightColumnX - 30, hudPrimaryY, 0, 14, 14, 14, 7, 0, 0x7fe38b, 1).setStrokeStyle?.(1, 0xd8f7e0);
    this.targetHudIcon = targetIcon;
    targetIcon?.setDepth?.(32);

    this.scoreText = this.add.text(scoreValueX, hudPrimaryY, `${this.getTotalScore()}`, {
      fontFamily: "Courier New, monospace",
      fontSize: "30px",
      color: "#f1f5ff",
      stroke: "#0a1424",
      strokeThickness: 2,
    });
    this.scoreText.setOrigin?.(0, 0.5);
    this.scoreText.setDepth?.(32);

    this.goalHudText = this.add.text(rightColumnX, hudPrimaryY, `${this.layoutPlateGoal}`, {
      fontFamily: "Courier New, monospace",
      fontSize: "30px",
      color: "#f6c453",
      stroke: "#251012",
      strokeThickness: 2,
    });
    this.goalHudText.setOrigin?.(0.5, 0.5);
    this.goalHudText.setDepth?.(32);

    this.targetHudText = this.add.text(rightColumnX, hudSecondaryY, "--", {
      fontFamily: "Courier New, monospace",
      fontSize: "24px",
      color: "#d8e3f6",
      stroke: "#0a1424",
      strokeThickness: 1,
    });
    this.targetHudText.setOrigin?.(0.5, 0.5);
    this.targetHudText.setDepth?.(32);

    this.shiftLevelText = this.add.text(leftColumnX, hudSecondaryY, this.formatHudShiftValue(), {
      fontFamily: "Courier New, monospace",
      fontSize: "24px",
      color: "#b9c6dd",
      stroke: "#0a1424",
      strokeThickness: 1,
    });
    this.shiftLevelText.setOrigin?.(0.5, 0.5);
    this.shiftLevelText.setDepth?.(32);

    this.timerText = this.add
      .text(centerColumnX, hudPrimaryY, `${this.formatTime(this.remainingTime)}`, {
        fontFamily: "Courier New, monospace",
        fontSize: "32px",
        color: "#fff0c7",
        stroke: "#241112",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0.5);
    this.timerText.setDepth?.(32);

    this.rivalPenaltyHintText = this.add.text(width / 2, hudWarningY, "", {
      fontFamily: "Courier New, monospace",
      fontSize: "16px",
      color: "#f6c453",
      stroke: "#2d1315",
      strokeThickness: 1,
    });
    this.rivalPenaltyHintText.setOrigin?.(0.5, 0.5);
    this.rivalPenaltyHintText.setAlpha?.(0);
    this.rivalPenaltyHintText.setDepth?.(32);

    this.warningHudIcon = this.textures?.exists?.(HUD_WARNING_ICON_KEY)
      ? this.add.image(centerColumnX + 58, hudPrimaryY, HUD_WARNING_ICON_KEY).setDisplaySize(16, 16)
      : this.add.triangle(centerColumnX + 58, hudPrimaryY, 0, 14, 14, 14, 7, 0, 0xe45454, 1).setStrokeStyle?.(1, 0xffd3d3);
    this.warningHudIcon?.setDepth?.(32);
    this.warningHudIcon?.setAlpha?.(0.85);

    // Combo flash popup (fades out after each combo delivery)
    this.comboFlashText = this.add.text(width / 2, hudTop + hudHeight + 28, "", {
      fontFamily: "Courier New, monospace",
      fontSize: "17px",
      color: "#f6c453",
      stroke: "#2d1315",
      strokeThickness: 3,
    });
    this.comboFlashText.setOrigin?.(0.5, 0);
    this.comboFlashText.setAlpha?.(0);
    this.comboFlashText.setDepth?.(32);

    // Day-twist badge displayed in HUD when a special modifier is active
    const twistHudValue = this.getDayTwistHudValue(this.dayTwist);
    if (twistHudValue) {
      const twistBadge = this.add.text(centerColumnX + 150, hudWarningY, `★ ${twistHudValue}`, {
        fontFamily: "Courier New, monospace",
        fontSize: "14px",
        color: "#ffe08a",
        stroke: "#1a0608",
        strokeThickness: 1,
      });
      twistBadge.setOrigin?.(0.5, 0.5);
      twistBadge.setDepth?.(32);
    }

    this.arenaBounds = {
      minX: 0,
      maxX: width,
      minY: arenaTop,
      maxY: arenaTop + arenaHeight,
    };
    this.boundaryColliders = this.createBoundaryColliders();

    this.mazeColumns = [0.08, 0.22, 0.36, 0.5, 0.64, 0.78, 0.91].map((ratio) =>
      this.arenaBounds.minX + ratio * (this.arenaBounds.maxX - this.arenaBounds.minX)
    );

    this.mazeRows = [0.14, 0.34, 0.54, 0.74, 0.9].map((ratio) =>
      this.arenaBounds.minY + ratio * (this.arenaBounds.maxY - this.arenaBounds.minY)
    );

    this.drawPacmanMaze();

    this.pickupZone = {
      label: "PASS",
      x: this.mazeColumns[3],
      y: this.arenaBounds.minY + 22,
    };
    this.passInteractionZone = {
      label: "PASS_POINT",
      x: this.pickupZone.x,
      y: this.pickupZone.y + 46,
    };
    this.kitchenDoorCollider = {
      type: "rect",
      x: this.pickupZone.x,
      y: this.pickupZone.y,
      halfWidth: 47,
      halfHeight: 22,
    };
    this.rivalPassNoGoCollider = {
      type: "circle",
      x: this.passInteractionZone.x,
      y: this.passInteractionZone.y,
      radius: RIVAL_PASS_NO_GO_RADIUS,
    };

    this.layoutIndex = this.getLayoutIndexForDay(this.shiftNumber);
    this.tableZones = this.createTableZones();
    this.tableColliders = this.tableZones.map((zone) => zone.collider);
    this.rivalPatrolNoGoColliders = this.createRivalPatrolNoGoColliders();
    this.seatZones = this.createSeatZones();
    this.seatColliders = this.seatZones.map((seat) => ({ type: "circle", x: seat.x, y: seat.y, radius: 13 }));
    this.boundaryColliders = this.createBoundaryColliders();
    this.initializeQueueTables();
    this.roundStartedAt = this.time?.now ?? Date.now();
    const spawnPoint = this.getPlayerSpawnPoint();
    this.rivals = this.createRivals(spawnPoint);

    this.drawPickupCounter();
    this.createChefAnnouncer();

    this.player = this.createPlayerVisual(spawnPoint.x, spawnPoint.y);
    this.playerLastPosition = { x: this.player.x, y: this.player.y };

    this.playerLocationHintText = this.add.text(spawnPoint.x, spawnPoint.y - 34, "", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "12px",
      color: "#fff4c9",
      stroke: "#200608",
      strokeThickness: 2,
    });
    this.playerLocationHintText.setOrigin?.(0.5, 1);
    this.playerLocationHintText.setDepth?.(9);
    this.updatePlayerLocationHint();

    this.nextTargets = this.createInitialSeatQueue(NEXT_QUEUE_LENGTH);
    this.scheduleNextTargetAnnouncement();
    this.updatePersistentHud();

    this.cursors = this.input?.keyboard?.createCursorKeys();
    this.wasd = this.input?.keyboard?.addKeys("W,A,S,D");

    this.onEscKeyDown = this.onEscKeyDown ?? this.handleEscToMenu.bind(this);
    this.input?.keyboard?.off?.("keydown-ESC", this.onEscKeyDown, this);
    this.input?.keyboard?.on?.("keydown-ESC", this.onEscKeyDown, this);

    this.onPauseKeyDown = this.onPauseKeyDown ?? this.togglePause.bind(this);
    this.input?.keyboard?.off?.("keydown-P", this.onPauseKeyDown, this);
    this.input?.keyboard?.on?.("keydown-P", this.onPauseKeyDown, this);

    this.lastKnownScaleSize = {
      width: Math.round(this.scale.width),
      height: Math.round(this.scale.height),
    };
    this.scale?.off?.("resize", this.handleScaleResize, this);
    this.scale?.on?.("resize", this.handleScaleResize, this);
    this.events?.once?.("shutdown", this.cleanupSceneRuntime, this);
  }

  handleEscToMenu() {
    this.scene.start(MENU_SCENE_KEY);
  }

  cleanupSceneRuntime() {
    AudioManager.stopMusic();
    this.scale?.off?.("resize", this.handleScaleResize, this);
    this.input?.keyboard?.off?.("keydown-ESC", this.onEscKeyDown, this);
    this.input?.keyboard?.off?.("keydown-P", this.onPauseKeyDown, this);
    this.hidePauseOverlay();

    if (this.pendingChefAnnouncementEvent?.remove) {
      this.pendingChefAnnouncementEvent.remove(false);
      this.pendingChefAnnouncementEvent = null;
    }

    if (this.hideChefAnnouncementEvent?.remove) {
      this.hideChefAnnouncementEvent.remove(false);
      this.hideChefAnnouncementEvent = null;
    }

    if (this.returnToMenuEvent?.remove) {
      this.returnToMenuEvent.remove(false);
      this.returnToMenuEvent = null;
    }

    if (this.hideRivalPenaltyHintEvent?.remove) {
      this.hideRivalPenaltyHintEvent.remove(false);
      this.hideRivalPenaltyHintEvent = null;
    }

    if (this.hideComboFlashEvent?.remove) {
      this.hideComboFlashEvent.remove(false);
      this.hideComboFlashEvent = null;
    }

    if (this.tweens?.killTweensOf) {
      this.tweens.killTweensOf(this.chefContainer);
      this.tweens.killTweensOf(this.chefBubbleContainer);
      this.tweens.killTweensOf(this.chefSpeechText);
    }
  }

  handleScaleResize(gameSize) {
    const width = Math.round(gameSize?.width ?? this.scale.width);
    const height = Math.round(gameSize?.height ?? this.scale.height);
    const previous = this.lastKnownScaleSize;
    this.lastKnownScaleSize = { width, height };

    if (!previous) {
      return;
    }

    // Ignore bootstrap resize chatter that can fire right after scene creation.
    if (Math.abs(width - previous.width) < 2 && Math.abs(height - previous.height) < 2) {
      return;
    }

    const now = this.time?.now ?? Date.now();
    if (now - this.roundStartedAt < 500) {
      return;
    }

    this.scene.restart({
      shiftLevel: this.shiftLevel,
      shiftScore: this.shiftScore,
      shiftDelivered: this.shiftDelivered,
      shiftNumber: this.shiftNumber,
    });
  }

  update(_, delta) {
    if (this.roundEnded) {
      return;
    }

    if (this.isPaused) {
      this.handlePauseHotkeys();
      return;
    }

    this.rivalBumpDetectedThisFrame = false;
    const dt = delta / 1000;
    this.updateTimer(dt);
    if (this.roundEnded) {
      return;
    }

    this.handleMovement(dt);
    this.updatePlayerMotionIntent(dt);
    this.tryStartOrderTimer();
    if (this.roundEnded) {
      return;
    }

    this.updateRivals(dt);
    this.resolveRivalToRivalBumps();
    this.handleRivalCollisionPenalty();
    if (this.roundEnded) {
      return;
    }

    this.handleInteractions();
    this.updatePlayerLocationHint();
  }

  updateTimer(dt) {
    if (!this.orderTimerRunning) {
      this.timerText?.setText(`${this.formatTime(this.remainingTime)}`);
      return;
    }

    this.remainingTime = Math.max(0, this.remainingTime - dt);
    this.timerText?.setText(`${this.formatTime(this.remainingTime)}`);

    if (!this.hasPlayedTimerWarning && this.remainingTime <= TIMER_LOW_WARNING_SECONDS && this.remainingTime > 0) {
      this.hasPlayedTimerWarning = true;
      AudioManager.onTimerWarning();
      this.pulseTimerWarning();
    }

    if (this.remainingTime <= 0) {
      this.endRound("TIME_UP");
      return;
    }

  }

  handleMovement(dt) {
    if (!this.player || !this.arenaBounds) {
      return;
    }

    const keyDir = this.getKeyboardDirection();
    const directionX = keyDir.x;
    const directionY = keyDir.y;

    if (directionX === 0 && directionY === 0) {
      return;
    }

    const previousX = this.player.x;
    const previousY = this.player.y;
    const len = Math.hypot(directionX, directionY);
    const speed = this.getCurrentMoveSpeed() * dt;
    const nextX = Phaser.Math.Clamp(previousX + (directionX / len) * speed, this.arenaBounds.minX, this.arenaBounds.maxX);
    const nextY = Phaser.Math.Clamp(previousY + (directionY / len) * speed, this.arenaBounds.minY, this.arenaBounds.maxY);

    const resolvedStaticPosition = this.resolveTableCollision(nextX, nextY, previousX, previousY);
    const resolvedPosition = this.resolveRivalCollision(
      resolvedStaticPosition.x,
      resolvedStaticPosition.y,
      previousX,
      previousY
    );
    this.player.x = resolvedPosition.x;
    this.player.y = resolvedPosition.y;
  }

  updatePlayerMotionIntent(dt) {
    if (!this.player) {
      return;
    }

    if (!this.playerLastPosition) {
      this.playerLastPosition = { x: this.player.x, y: this.player.y };
      this.playerMotionVector = { x: 0, y: 0 };
      this.playerMotionStrength = 0;
      return;
    }

    const dx = this.player.x - this.playerLastPosition.x;
    const dy = this.player.y - this.playerLastPosition.y;
    this.playerLastPosition = { x: this.player.x, y: this.player.y };

    const distance = Math.hypot(dx, dy);
    if (distance > 0.25) {
      this.playerMotionVector = { x: dx / distance, y: dy / distance };
      const referenceSpeed = Math.max(1, this.getCurrentMoveSpeed() * Math.max(dt, 0.016));
      this.playerMotionStrength = Math.min(1, distance / referenceSpeed);
      return;
    }

    this.playerMotionStrength = Math.max(0, this.playerMotionStrength - dt * 3);
    if (this.playerMotionStrength <= 0.001) {
      this.playerMotionVector = { x: 0, y: 0 };
      this.playerMotionStrength = 0;
    }
  }

  resolveRivalCollision(nextX, nextY, previousX, previousY, bodyRadius = 14) {
    if (!this.rivals?.length) {
      return { x: nextX, y: nextY };
    }

    const now = this.time?.now ?? Date.now();
    if (now < (this.playerRivalGhostUntil ?? 0)) {
      return { x: nextX, y: nextY };
    }

    const collidedRival = this.rivals.find((rival) => {
      const distance = Phaser.Math.Distance.Between(nextX, nextY, rival.x, rival.y);
      return distance < bodyRadius + rival.radius;
    });

    if (collidedRival) {
      // Any body contact with a rival should count as a bump for penalty checks.
      this.rivalBumpDetectedThisFrame = true;

      const bumpCooldownUntil = collidedRival.bumpCooldownUntil ?? 0;
      if (now >= bumpCooldownUntil) {
        collidedRival.stunnedUntil = now + RIVAL_STUN_DURATION_MS;
        collidedRival.bumpCooldownUntil = now + RIVAL_BUMP_COOLDOWN_MS;
        collidedRival.bumpChaseLockoutUntil = now + RIVAL_BUMP_CHASE_LOCKOUT_MS;
        collidedRival.bumpRecoveryActive = true;
        collidedRival.isInterceptingPlayer = false;
        collidedRival.nextInterceptionRetargetAt = 0;
        this.assignNextRivalRouteTarget(collidedRival, true);
      }

      // Even when cooldown blocks a new stun, force a short disengage to avoid lock-on body pinning.
      collidedRival.bumpChaseLockoutUntil = Math.max(
        collidedRival.bumpChaseLockoutUntil ?? 0,
        now + RIVAL_POST_BUMP_DISENGAGE_MS
      );
    }

    const rivalColliders = this.rivals.map((rival) => ({
      type: "circle",
      x: rival.x,
      y: rival.y,
      radius: rival.radius,
    }));

    return this.resolveCollisionAgainstColliders(nextX, nextY, previousX, previousY, rivalColliders, bodyRadius);
  }

  resolveTableCollision(nextX, nextY, previousX, previousY, bodyRadius = 14) {
    const colliders = [...(this.tableColliders ?? []), ...(this.seatColliders ?? []), ...(this.boundaryColliders ?? [])];
    if (this.kitchenDoorCollider) {
      colliders.push(this.kitchenDoorCollider);
    }
    return this.resolveCollisionAgainstColliders(nextX, nextY, previousX, previousY, colliders, bodyRadius);
  }

  resolveCollisionAgainstColliders(nextX, nextY, previousX, previousY, colliders, bodyRadius) {
    const isBlocked = (x, y) => this.isBlockedByColliders(x, y, colliders, bodyRadius);

    if (!isBlocked(nextX, nextY)) {
      return { x: nextX, y: nextY };
    }

    const canMoveXOnly = !isBlocked(nextX, previousY);
    const canMoveYOnly = !isBlocked(previousX, nextY);

    if (canMoveXOnly && !canMoveYOnly) {
      return { x: nextX, y: previousY };
    }

    if (canMoveYOnly && !canMoveXOnly) {
      return { x: previousX, y: nextY };
    }

    if (canMoveXOnly && canMoveYOnly) {
      const deltaX = Math.abs(nextX - previousX);
      const deltaY = Math.abs(nextY - previousY);
      if (deltaX >= deltaY) {
        return { x: nextX, y: previousY };
      }

      return { x: previousX, y: nextY };
    }

    return { x: previousX, y: previousY };
  }

  isBlockedByColliders(x, y, colliders, bodyRadius) {
    return colliders.some((collider) => {
      if (collider?.type === "rect" || (collider?.halfWidth && collider?.halfHeight)) {
        return (
          Math.abs(x - collider.x) < collider.halfWidth + bodyRadius &&
          Math.abs(y - collider.y) < collider.halfHeight + bodyRadius
        );
      }

      const distance = Phaser.Math.Distance.Between(x, y, collider.x, collider.y);
      return distance < (collider.radius ?? 0) + bodyRadius;
    });
  }

  resolveRivalPatrolCollision(nextX, nextY, previousX, previousY, bodyRadius = RIVAL_RADIUS) {
    const resolvedBase = this.resolveTableCollision(nextX, nextY, previousX, previousY, bodyRadius);
    if (resolvedBase.x === previousX && resolvedBase.y === previousY) {
      return resolvedBase;
    }

    const noGoColliders = [...(this.rivalPatrolNoGoColliders ?? [])];
    if (this.rivalPassNoGoCollider) {
      noGoColliders.push(this.rivalPassNoGoCollider);
    }
    if (noGoColliders.length === 0) {
      return resolvedBase;
    }

    return this.resolveCollisionAgainstColliders(
      resolvedBase.x,
      resolvedBase.y,
      previousX,
      previousY,
      noGoColliders,
      bodyRadius
    );
  }

  handleInteractions() {
    if (!this.player) {
      return;
    }

    if (
      this.orderStage === "needPickup"
      && this.passReadyForPickup
      && this.isAdjacent(this.passInteractionZone, this.getCurrentInteractionRadius())
    ) {
      this.carryingOrder = true;
      this.orderStage = "needSeat";
      this.setPassPickupAvailability(false);
      AudioManager.onPickup();
      this.pulsePassIndicator();
      return;
    }

    if (this.orderStage === "needSeat" && this.carryingOrder) {
      const targetSeat = this.findDeliverableSeat();
      if (!targetSeat) {
        return;
      }

      this.carryingOrder = false;
      this.orderStage = "needPickup";
      this.deliveredPlates += 1;
      const deliveryDuration = this.getRoundDurationSecondsForDay(this.shiftNumber) - this.remainingTime;
      this.deliveryDurations.push(Math.max(0, deliveryDuration));

      this.comboCount += 1;
      if (this.comboCount > this.bestComboStreak) {
        this.bestComboStreak = this.comboCount;
      }
      const deliveryMult = this.getDeliveryScoreMultiplier();
      const earnedScore = Math.ceil(this.remainingTime * deliveryMult);
      this.score += earnedScore;
      this.scoreText?.setText(`${this.getTotalScore()}`);
      this.updatePersistentHud();
      this.showComboFlash(deliveryMult);
      this.playDeliveryHudFeedback(targetSeat);

      if (this.comboCount >= COMBO_TIER_1_THRESHOLD) {
        AudioManager.onComboDelivery();
      } else {
        AudioManager.onDelivery();
      }

      if (this.deliveredPlates >= this.layoutPlateGoal) {
        this.endRound("LAYOUT_CLEAR");
        return;
      }

      this.advanceTargetQueue(targetSeat.label);
    }
  }

  updateRivals(dt) {
    if (!this.rivals?.length || !this.arenaBounds) {
      return;
    }

    this.rivals.forEach((rival) => {
      const now = this.time?.now ?? Date.now();
      if (rival.lastFramePosition == null) {
        rival.lastFramePosition = { x: rival.x, y: rival.y };
      }
      if (rival.stallElapsedMs == null) {
        rival.stallElapsedMs = 0;
      }

      if (rival.stunnedUntil && now < rival.stunnedUntil) {
        rival.blockedFrames = 0;
        rival.lastFramePosition = { x: rival.x, y: rival.y };
        rival.stallElapsedMs = 0;
        rival.stallRecoveryCount = 0;
        return;
      }

      const interceptionTarget = this.getRivalPlayerInterceptionTarget(rival);
      if (interceptionTarget) {
        const needsRetarget =
          !rival.isInterceptingPlayer
          || !rival.routeTarget
          || now >= (rival.nextInterceptionRetargetAt ?? 0)
          || this.isRivalAtRouteTarget(rival, rival.routeTarget);

        if (needsRetarget) {
          if (rival.isInterceptingPlayer && rival.routeTarget) {
            const blend = RIVAL_PLAYER_FOLLOW_TARGET_BLEND;
            rival.routeTarget = {
              x: rival.routeTarget.x + (interceptionTarget.x - rival.routeTarget.x) * blend,
              y: rival.routeTarget.y + (interceptionTarget.y - rival.routeTarget.y) * blend,
            };
          } else {
            rival.routeTarget = interceptionTarget;
          }

          rival.nextInterceptionRetargetAt = now + RIVAL_PLAYER_FOLLOW_RETARGET_MS;
        }

        rival.isInterceptingPlayer = true;
      } else {
        if (rival.isInterceptingPlayer) {
          rival.isInterceptingPlayer = false;
          rival.nextInterceptionRetargetAt = 0;
          this.assignNextRivalRouteTarget(rival, true);
        }

        if (rival.bumpRecoveryActive && rival.routeTarget && this.isRivalAtRouteTarget(rival, rival.routeTarget)) {
          rival.bumpRecoveryActive = false;
          rival.nextInterceptionRetargetAt = 0;
          this.assignNextRivalRouteTarget(rival, true);
        } else if (!rival.routeTarget || this.isRivalAtRouteTarget(rival, rival.routeTarget)) {
          this.assignNextRivalRouteTarget(rival, false);
        }
      }

      const baseRivalSpeed = rival.moveSpeed ?? RIVAL_SPEED;
      const currentRivalSpeed = rival.isInterceptingPlayer
        ? baseRivalSpeed * RIVAL_PLAYER_FOLLOW_SPEED_SCALE
        : baseRivalSpeed;
      let remainingMove = currentRivalSpeed * dt;
      let guard = 0;
      let zeroDistanceRetargets = 0;

      while (remainingMove > 0.0001 && guard < 12) {
        guard += 1;
        if (!rival.routeTarget) {
          this.assignNextRivalRouteTarget(rival, false);
        }
        if (!rival.routeTarget) {
          break;
        }

        const targetDx = rival.routeTarget.x - rival.x;
        const targetDy = rival.routeTarget.y - rival.y;
        const targetDistance = Math.hypot(targetDx, targetDy);
        if (targetDistance < 0.001) {
          zeroDistanceRetargets += 1;

          // If route selection keeps collapsing to current position, force a detour target.
          if (zeroDistanceRetargets >= 3) {
            const fallbackTarget = this.getRivalDynamicFallbackWaypoint(rival, rival.routeTarget);
            if (fallbackTarget) {
              rival.routeTarget = { x: fallbackTarget.x, y: fallbackTarget.y };
              zeroDistanceRetargets = 0;
              continue;
            }

            this.repositionRival(rival);
            zeroDistanceRetargets = 0;
            remainingMove = 0;
            continue;
          }

          this.assignNextRivalRouteTarget(rival, true);
          continue;
        }
        zeroDistanceRetargets = 0;

        const headingX = targetDx / targetDistance;
        const headingY = targetDy / targetDistance;
        rival.vx = headingX * currentRivalSpeed;
        rival.vy = headingY * currentRivalSpeed;
        const stepDistance = Math.min(remainingMove, targetDistance);
        const nextX = rival.x + headingX * stepDistance;
        const nextY = rival.y + headingY * stepDistance;
        const resolvedPosition = this.resolveRivalPatrolCollision(nextX, nextY, rival.x, rival.y, rival.radius);
        const blocked = resolvedPosition.x === rival.x && resolvedPosition.y === rival.y;

        if (blocked) {
          rival.blockedFrames += 1;
          rival.lastTableContactAt = now;
          this.assignNextRivalRouteTarget(rival, true, { avoidHeadingX: headingX, avoidHeadingY: headingY });
          const retargetScale = rival.retargetScale ?? RIVAL_DEFAULT_RETARGET_SCALE;
          rival.nextTurnAt = now + Math.round(Phaser.Math.Between(
            RIVAL_TABLE_CONTACT_RETARGET_MIN_MS,
            RIVAL_TABLE_CONTACT_RETARGET_MAX_MS
          ) * retargetScale);

          const slidePosition = this.tryRivalBoundarySlide(rival, headingX, headingY, stepDistance);
          if (slidePosition) {
            rival.blockedFrames = Math.max(0, rival.blockedFrames - 1);
            rival.x = slidePosition.x;
            rival.y = slidePosition.y;
            // End movement processing this frame to prevent contact jitter loops.
            remainingMove = 0;
            continue;
          }

          if (rival.blockedFrames >= RIVAL_STUCK_RECOVERY_THRESHOLD) {
            this.recoverStuckRival(rival);
          }
          // Hard-blocked this frame, retry on the next frame with a fresh heading.
          remainingMove = 0;
          continue;
        }

        rival.blockedFrames = 0;
        rival.x = resolvedPosition.x;
        rival.y = resolvedPosition.y;

        if (this.isRivalAtRouteTarget(rival, rival.routeTarget)) {
          this.assignNextRivalRouteTarget(rival, false);
        }
        remainingMove -= stepDistance;
      }



      if (rival.visual) {
        rival.visual.x = rival.x;
        rival.visual.y = rival.y;
      }
      if (rival.labelVisual) {
        rival.labelVisual.x = rival.x;
        rival.labelVisual.y = rival.y;
      }

      this.enforceRivalHomeZone(rival, now);

      const previousFramePosition = rival.lastFramePosition ?? { x: rival.x, y: rival.y };
      const movedDistance = Phaser.Math.Distance.Between(
        previousFramePosition.x,
        previousFramePosition.y,
        rival.x,
        rival.y
      );
      rival.lastFramePosition = { x: rival.x, y: rival.y };

      if (movedDistance >= RIVAL_STALL_MOVEMENT_EPSILON) {
        rival.stallElapsedMs = 0;
        rival.stallRecoveryCount = 0;
        return;
      }

      rival.stallElapsedMs += dt * 1000;
      if (rival.stallElapsedMs < RIVAL_STALL_WINDOW_MS) {
        return;
      }

      const recoveries = rival.stallRecoveryCount ?? 0;
      if (recoveries >= RIVAL_STALL_MAX_RECOVERIES) {
        this.repositionRival(rival);
        rival.stallRecoveryCount = 0;
        rival.stallElapsedMs = 0;
        rival.lastFramePosition = { x: rival.x, y: rival.y };
        return;
      }

      this.assignNextRivalRouteTarget(rival, true);
      this.recoverStuckRival(rival);
      rival.stallRecoveryCount = recoveries + 1;
      rival.stallElapsedMs = 0;
    });
  }

  setRivalDirection(rival, direction) {
    if (!direction) {
      return;
    }

    const speed = rival.moveSpeed ?? RIVAL_SPEED;
    rival.vx = direction.x * speed;
    rival.vy = direction.y * speed;

    rival.directionHistory = rival.directionHistory ?? [];
    rival.directionHistory.unshift({ x: direction.x, y: direction.y });
    rival.directionHistory = rival.directionHistory.slice(0, 4);
    rival.lastDirection = { x: direction.x, y: direction.y };
  }

  isRivalAtRouteTarget(rival, target) {
    if (!target) {
      return false;
    }

    return Phaser.Math.Distance.Between(rival.x, rival.y, target.x, target.y) <= RIVAL_ROUTE_REACH_DISTANCE;
  }

  getRivalRouteNodes(rival) {
    if (!this.tableZones?.length) {
      return [];
    }

    const tableNodes = this.tableZones.flatMap((table) => this.buildTablePatrolWaypoints(table));
    const detourNodes = this.getRivalLaneDetourNodes(rival);
    const nodes = [...tableNodes, ...detourNodes];
    return nodes.filter((node) => this.isRivalSpawnOpen(node.x, node.y));
  }

  getRivalLaneDetourNodes(rival) {
    if (!this.mazeColumns?.length || !this.mazeRows?.length) {
      return [];
    }

    const laneBounds = this.getRivalLaneBounds(rival?.lane);
    const points = this.mazeRows.flatMap((y) => this.mazeColumns.map((x) => ({ x, y })));
    return points.filter((point) => {
      if (laneBounds && (point.x < laneBounds.minX || point.x > laneBounds.maxX)) {
        return false;
      }
      return this.isRivalSpawnOpen(point.x, point.y);
    });
  }

  getRivalPlayerInterceptionTarget(rival) {
    if (!this.player || !this.arenaBounds || !rival) {
      return null;
    }

    const now = this.time?.now ?? Date.now();
    if (rival.bumpRecoveryActive || now < (rival.bumpChaseLockoutUntil ?? 0)) {
      return null;
    }

    const distanceToPlayer = Phaser.Math.Distance.Between(rival.x, rival.y, this.player.x, this.player.y);
    const engageRadius = RIVAL_PLAYER_FOLLOW_ENGAGE_RADIUS;
    const releaseRadius = RIVAL_PLAYER_FOLLOW_RELEASE_RADIUS;
    const sensingRadius = rival.isInterceptingPlayer ? releaseRadius : engageRadius;
    if (distanceToPlayer > sensingRadius) {
      return null;
    }

    const toPlayerX = (this.player.x - rival.x) / Math.max(distanceToPlayer, 0.001);
    const toPlayerY = (this.player.y - rival.y) / Math.max(distanceToPlayer, 0.001);

    const motion = this.playerMotionVector ?? { x: 0, y: 0 };
    const motionMagnitude = Math.hypot(motion.x, motion.y);
    const hasMotionIntent =
      (this.playerMotionStrength ?? 0) >= RIVAL_PLAYER_FOLLOW_MIN_MOTION && motionMagnitude > 0.001;
    const motionUnitX = hasMotionIntent ? motion.x / motionMagnitude : 0;
    const motionUnitY = hasMotionIntent ? motion.y / motionMagnitude : 0;

    // Approach the player's lane while keeping a short standoff distance to reduce forced bumps.
    const predictedPlayerX = this.player.x + motionUnitX * RIVAL_PLAYER_FOLLOW_PREDICTION;
    const predictedPlayerY = this.player.y + motionUnitY * RIVAL_PLAYER_FOLLOW_PREDICTION;
    const rawTargetX = predictedPlayerX - toPlayerX * RIVAL_PLAYER_FOLLOW_BUFFER;
    const rawTargetY = predictedPlayerY - toPlayerY * RIVAL_PLAYER_FOLLOW_BUFFER;

    const clampedTarget = {
      x: Phaser.Math.Clamp(rawTargetX, this.arenaBounds.minX + rival.radius, this.arenaBounds.maxX - rival.radius),
      y: Phaser.Math.Clamp(rawTargetY, this.arenaBounds.minY + rival.radius, this.arenaBounds.maxY - rival.radius),
    };

    return this.findNearestOpenPatrolPoint(clampedTarget, null) ?? clampedTarget;
  }

  getRivalVerticalIntentY(rival) {
    if (!this.arenaBounds) {
      return rival?.y ?? 0;
    }

    const topY = this.arenaBounds.minY + RIVAL_PATTERN_VERTICAL_TOP_PADDING;
    const bottomY = this.arenaBounds.maxY - RIVAL_PATTERN_VERTICAL_BOTTOM_PADDING;
    return (rival?.verticalPatrolDirection ?? 1) > 0 ? bottomY : topY;
  }

  getRivalHorizontalIntentX(rival) {
    const laneBounds = this.getRivalLaneBounds(rival?.lane);
    if (!laneBounds) {
      return rival?.x ?? this.arenaBounds?.minX ?? 0;
    }

    const leftX = laneBounds.minX + RIVAL_LANE_MARGIN;
    const rightX = laneBounds.maxX - RIVAL_LANE_MARGIN;
    return (rival?.horizontalPatrolDirection ?? 1) > 0 ? rightX : leftX;
  }

  buildRivalBehaviorWaypoints(rival) {
    if (!this.arenaBounds) {
      return [];
    }

    const topY = this.arenaBounds.minY + RIVAL_PATTERN_VERTICAL_TOP_PADDING;
    const bottomY = this.arenaBounds.maxY - RIVAL_PATTERN_VERTICAL_BOTTOM_PADDING;
    const fieldLeftX = this.arenaBounds.minX + RIVAL_LANE_MARGIN;
    const fieldRightX = this.arenaBounds.maxX - RIVAL_LANE_MARGIN;
    const fieldMidX = (fieldLeftX + fieldRightX) / 2;
    const leftInnerX = fieldLeftX + (fieldRightX - fieldLeftX) * 0.24;
    const rightInnerX = fieldLeftX + (fieldRightX - fieldLeftX) * 0.76;
    const midUpperY = topY + (bottomY - topY) * 0.32;
    const midY = (topY + bottomY) / 2;
    const midLowerY = topY + (bottomY - topY) * 0.72;

    const byPattern = {
      // Clockwise outer loop that repeatedly crosses full width and height.
      left: [
        { x: fieldLeftX, y: topY },
        { x: rightInnerX, y: topY },
        { x: fieldRightX, y: midUpperY },
        { x: rightInnerX, y: bottomY },
        { x: fieldLeftX, y: bottomY },
        { x: leftInnerX, y: midY },
      ],
      // Serpentine center sweep that spans all columns and rows.
      center: [
        { x: leftInnerX, y: topY },
        { x: fieldRightX, y: topY },
        { x: rightInnerX, y: midUpperY },
        { x: fieldLeftX, y: midUpperY },
        { x: leftInnerX, y: midLowerY },
        { x: fieldRightX, y: midLowerY },
        { x: rightInnerX, y: bottomY },
        { x: fieldMidX, y: bottomY },
      ],
      // Counter-clockwise mirror loop for opposite traffic direction.
      right: [
        { x: fieldRightX, y: topY },
        { x: leftInnerX, y: topY },
        { x: fieldLeftX, y: midUpperY },
        { x: leftInnerX, y: bottomY },
        { x: fieldRightX, y: bottomY },
        { x: rightInnerX, y: midY },
      ],
      // Diagonal sweeps that repeatedly cut top-to-bottom through the full field.
      "top-center": [
        { x: fieldMidX, y: topY },
        { x: fieldRightX, y: midUpperY },
        { x: leftInnerX, y: midY },
        { x: fieldRightX, y: bottomY },
        { x: fieldLeftX, y: midLowerY },
        { x: rightInnerX, y: midY },
        { x: fieldLeftX, y: topY },
      ],
    };

    const rawPoints = byPattern[rival.behaviorPattern ?? rival.lane] ?? byPattern.center;
    const resolvedPoints = rawPoints
      .map((point) => this.findNearestOpenPatrolPoint(point, null))
      .filter((point) => Boolean(point));

    const deduped = resolvedPoints.filter((point, index, all) =>
      all.findIndex((other) => Math.abs(other.x - point.x) < 1 && Math.abs(other.y - point.y) < 1) === index
    );

    return deduped.length >= 4 ? deduped : rawPoints.filter((point) => this.isRivalSpawnOpen(point.x, point.y));
  }

  findNearestOpenPatrolPoint(point, lane) {
    if (!point || !this.arenaBounds) {
      return null;
    }

    const laneBounds = this.getRivalLaneBounds(lane);
    const clampX = (x) => {
      const minX = laneBounds ? laneBounds.minX + RIVAL_RADIUS : this.arenaBounds.minX + RIVAL_RADIUS;
      const maxX = laneBounds ? laneBounds.maxX - RIVAL_RADIUS : this.arenaBounds.maxX - RIVAL_RADIUS;
      return Phaser.Math.Clamp(x, minX, maxX);
    };
    const clampY = (y) => Phaser.Math.Clamp(y, this.arenaBounds.minY + RIVAL_RADIUS, this.arenaBounds.maxY - RIVAL_RADIUS);

    const basePoint = { x: clampX(point.x), y: clampY(point.y) };
    if (this.isRivalSpawnOpen(basePoint.x, basePoint.y)) {
      return basePoint;
    }

    const searchSteps = [14, 28, 42, 56];
    for (const step of searchSteps) {
      const probes = [
        { x: basePoint.x + step, y: basePoint.y },
        { x: basePoint.x - step, y: basePoint.y },
        { x: basePoint.x, y: basePoint.y + step },
        { x: basePoint.x, y: basePoint.y - step },
        { x: basePoint.x + step, y: basePoint.y + step },
        { x: basePoint.x + step, y: basePoint.y - step },
        { x: basePoint.x - step, y: basePoint.y + step },
        { x: basePoint.x - step, y: basePoint.y - step },
      ];

      const openProbe = probes
        .map((probe) => ({ x: clampX(probe.x), y: clampY(probe.y) }))
        .find((probe) => this.isRivalSpawnOpen(probe.x, probe.y));

      if (openProbe) {
        return openProbe;
      }
    }

    return null;
  }

  getNextBehaviorWaypoint(rival, forceRetarget) {
    if (!rival.behaviorWaypoints?.length) {
      rival.behaviorWaypoints = this.buildRivalBehaviorWaypoints(rival);
    }
    if (!rival.behaviorWaypoints?.length) {
      rival.behaviorWaypoints = this.getRivalRouteNodes(rival);
      rival.behaviorMode = "loop";
    }
    if (!rival.behaviorWaypoints?.length) {
      return null;
    }

    if (rival.behaviorWaypoints.length === 1) {
      const staticWaypoint = rival.behaviorWaypoints[0];
      return this.getRivalDynamicFallbackWaypoint(rival, staticWaypoint) ?? staticWaypoint;
    }

    const total = rival.behaviorWaypoints.length;
    if (rival.behaviorIndex == null) {
      rival.behaviorIndex = 0;
      return rival.behaviorWaypoints[rival.behaviorIndex];
    }

    if (!forceRetarget && rival.routeTarget && !this.isRivalAtRouteTarget(rival, rival.routeTarget)) {
      return rival.behaviorWaypoints[rival.behaviorIndex];
    }

    const step = this.getDeterministicBehaviorStep(rival);
    if ((rival.behaviorMode ?? "loop") === "pingpong") {
      let nextDirection = step >= 0 ? 1 : -1;
      if (rival.behaviorIndex >= total - 1) {
        nextDirection = -1;
      } else if (rival.behaviorIndex <= 0) {
        nextDirection = 1;
      }

      rival.behaviorDirection = nextDirection;
      rival.behaviorIndex = Phaser.Math.Clamp(rival.behaviorIndex + nextDirection, 0, total - 1);
      return rival.behaviorWaypoints[rival.behaviorIndex];
    }

    rival.behaviorIndex = (rival.behaviorIndex + step + total) % total;
    return rival.behaviorWaypoints[rival.behaviorIndex];
  }

  getRivalDynamicFallbackWaypoint(rival, excludedWaypoint) {
    const minTravelDistance = RIVAL_ROUTE_REACH_DISTANCE * 1.75;
    const uniqueCandidates = [];
    const pushUnique = (point) => {
      if (!point) {
        return;
      }
      const exists = uniqueCandidates.some((candidate) =>
        Math.abs(candidate.x - point.x) < 1 && Math.abs(candidate.y - point.y) < 1
      );
      if (!exists) {
        uniqueCandidates.push(point);
      }
    };

    (this.getRivalLaneDetourNodes(rival) ?? []).forEach(pushUnique);
    (this.getRivalRouteNodes(rival) ?? []).forEach(pushUnique);

    const travelCandidates = uniqueCandidates.filter((point) => {
      if (excludedWaypoint && Math.abs(point.x - excludedWaypoint.x) < 1 && Math.abs(point.y - excludedWaypoint.y) < 1) {
        return false;
      }

      const distance = Phaser.Math.Distance.Between(rival.x, rival.y, point.x, point.y);
      return distance >= minTravelDistance;
    });

    if (!travelCandidates.length) {
      return null;
    }

    return travelCandidates.reduce((best, candidate) => {
      if (!best) {
        return candidate;
      }

      const bestDistance = Phaser.Math.Distance.Between(rival.x, rival.y, best.x, best.y);
      const candidateDistance = Phaser.Math.Distance.Between(rival.x, rival.y, candidate.x, candidate.y);
      return candidateDistance > bestDistance ? candidate : best;
    }, null);
  }

  getRivalBumpRecoveryWaypoint(rival, excludedWaypoint) {
    if (!rival || !this.player) {
      return this.getRivalDynamicFallbackWaypoint(rival, excludedWaypoint);
    }

    const minTravelDistance = RIVAL_ROUTE_REACH_DISTANCE * 1.75;
    const uniqueCandidates = [];
    const pushUnique = (point) => {
      if (!point) {
        return;
      }
      const exists = uniqueCandidates.some((candidate) =>
        Math.abs(candidate.x - point.x) < 1 && Math.abs(candidate.y - point.y) < 1
      );
      if (!exists) {
        uniqueCandidates.push(point);
      }
    };

    (this.getRivalLaneDetourNodes(rival) ?? []).forEach(pushUnique);
    (this.getRivalRouteNodes(rival) ?? []).forEach(pushUnique);

    const travelCandidates = uniqueCandidates.filter((point) => {
      if (excludedWaypoint && Math.abs(point.x - excludedWaypoint.x) < 1 && Math.abs(point.y - excludedWaypoint.y) < 1) {
        return false;
      }

      const distance = Phaser.Math.Distance.Between(rival.x, rival.y, point.x, point.y);
      return distance >= minTravelDistance;
    });

    if (!travelCandidates.length) {
      return this.getRivalDynamicFallbackWaypoint(rival, excludedWaypoint);
    }

    return travelCandidates
      .map((candidate) => {
        const playerDistance = Phaser.Math.Distance.Between(candidate.x, candidate.y, this.player.x, this.player.y);
        const rivalDistance = Phaser.Math.Distance.Between(candidate.x, candidate.y, rival.x, rival.y);
        return {
          candidate,
          score: playerDistance * 1.6 + rivalDistance * 0.35 + Math.random() * 6,
        };
      })
      .sort((a, b) => b.score - a.score)[0]?.candidate ?? null;
  }

  selectRivalTravelTarget(rival, preferredWaypoint) {
    if (!preferredWaypoint) {
      return null;
    }

    const minTravelDistance = RIVAL_ROUTE_REACH_DISTANCE * 1.75;
    const preferredDistance = Phaser.Math.Distance.Between(rival.x, rival.y, preferredWaypoint.x, preferredWaypoint.y);
    if (preferredDistance >= minTravelDistance) {
      return preferredWaypoint;
    }

    const waypointAlternatives = (rival.behaviorWaypoints ?? []).filter((point) => {
      if (Math.abs(point.x - preferredWaypoint.x) < 1 && Math.abs(point.y - preferredWaypoint.y) < 1) {
        return false;
      }
      const distance = Phaser.Math.Distance.Between(rival.x, rival.y, point.x, point.y);
      return distance >= minTravelDistance;
    });

    if (waypointAlternatives.length > 0) {
      return waypointAlternatives.reduce((best, candidate) => {
        if (!best) {
          return candidate;
        }

        const bestDistance = Phaser.Math.Distance.Between(rival.x, rival.y, best.x, best.y);
        const candidateDistance = Phaser.Math.Distance.Between(rival.x, rival.y, candidate.x, candidate.y);
        return candidateDistance > bestDistance ? candidate : best;
      }, null);
    }

    return this.getRivalDynamicFallbackWaypoint(rival, preferredWaypoint) ?? preferredWaypoint;
  }

  getDeterministicBehaviorStep(rival) {
    const baseStep = rival.behaviorPattern === "right" ? -1 : 1;
    const motionThreshold = rival.playerInfluenceMin ?? RIVAL_DEFAULT_PLAYER_INFLUENCE_MIN;
    if ((this.playerMotionStrength ?? 0) < motionThreshold) {
      return baseStep;
    }

    const motion = this.playerMotionVector ?? { x: 0, y: 0 };
    const horizontalDominant = Math.abs(motion.x) >= Math.abs(motion.y);
    if (horizontalDominant) {
      if (rival.lane === "right") {
        return motion.x >= 0 ? -1 : 1;
      }
      return motion.x >= 0 ? 1 : -1;
    }

    if (rival.lane === "top-center") {
      return motion.y >= 0 ? 1 : -1;
    }

    return motion.y >= 0 ? baseStep : -baseStep;
  }

  isRivalRepeatingPattern(rival) {
    const history = rival.routeHistory ?? [];
    if (history.length < 4) {
      return false;
    }

    const [a, b, c, d] = history;
    const same = (p1, p2) => Math.abs(p1.x - p2.x) < 1 && Math.abs(p1.y - p2.y) < 1;
    // ABAB or near-ABAB route loops are a common source of repetitive motion.
    return same(a, c) && same(b, d);
  }

  assignNextRivalRouteTarget(rival, forceRetarget) {
    const now = this.time?.now ?? Date.now();

    if (rival.bumpRecoveryActive) {
      const recoveryWaypoint = this.getRivalBumpRecoveryWaypoint(rival, rival.routeTarget);
      if (recoveryWaypoint) {
        rival.routeTarget = { x: recoveryWaypoint.x, y: recoveryWaypoint.y };
        rival.routeHistory = rival.routeHistory ?? [];
        rival.routeHistory.unshift({ x: recoveryWaypoint.x, y: recoveryWaypoint.y });
        rival.routeHistory = rival.routeHistory.slice(0, RIVAL_ROUTE_HISTORY_SIZE);
        const retargetScale = rival.retargetScale ?? RIVAL_DEFAULT_RETARGET_SCALE;
        rival.nextTurnAt = now + Math.round(
          Phaser.Math.Between(RIVAL_ROUTE_RETARGET_MIN_MS, RIVAL_ROUTE_RETARGET_MAX_MS) * retargetScale
        );
        return;
      }
    }

    const nextWaypoint = this.getNextBehaviorWaypoint(rival, forceRetarget);
    if (!nextWaypoint) {
      const routed = this.assignRivalPatrolRoute(rival, true);
      if (routed && rival.patrolWaypoints?.length) {
        const fallbackWaypoint = this.getRivalPatrolTarget(rival) ?? rival.patrolWaypoints[0];
        if (fallbackWaypoint) {
          rival.routeTarget = { x: fallbackWaypoint.x, y: fallbackWaypoint.y };
          const retargetScale = rival.retargetScale ?? RIVAL_DEFAULT_RETARGET_SCALE;
          rival.nextTurnAt = now + Math.round(Phaser.Math.Between(RIVAL_ROUTE_RETARGET_MIN_MS, RIVAL_ROUTE_RETARGET_MAX_MS) * retargetScale);
        }
      }
      return;
    }

    const variedWaypoint = this.selectRivalVariationWaypoint(rival, nextWaypoint) ?? nextWaypoint;
    const resolvedWaypoint = this.selectRivalTravelTarget(rival, variedWaypoint) ?? variedWaypoint;
    rival.routeTarget = { x: resolvedWaypoint.x, y: resolvedWaypoint.y };
    rival.routeHistory = rival.routeHistory ?? [];
    rival.routeHistory.unshift({ x: resolvedWaypoint.x, y: resolvedWaypoint.y });
    rival.routeHistory = rival.routeHistory.slice(0, RIVAL_ROUTE_HISTORY_SIZE);
    const retargetScale = rival.retargetScale ?? RIVAL_DEFAULT_RETARGET_SCALE;
    rival.nextTurnAt = now + Math.round(Phaser.Math.Between(RIVAL_ROUTE_RETARGET_MIN_MS, RIVAL_ROUTE_RETARGET_MAX_MS) * retargetScale);
  }

  selectRivalVariationWaypoint(rival, preferredWaypoint) {
    if (!preferredWaypoint) {
      return preferredWaypoint;
    }

    const behaviorWaypoints = rival.behaviorWaypoints ?? [];
    if (behaviorWaypoints.length < RIVAL_VARIATION_MIN_WAYPOINTS) {
      return preferredWaypoint;
    }

    const variationChance = Math.min(
      RIVAL_VARIATION_MAX_CHANCE,
      RIVAL_VARIATION_BASE_CHANCE + (rival.routeEntropy ?? 0.4) * 0.15 + (rival.routeVariance ?? 0.4) * 0.1
    );
    if (Math.random() > variationChance) {
      return preferredWaypoint;
    }

    const recentHistory = (rival.routeHistory ?? []).slice(0, RIVAL_VARIATION_RECENT_HISTORY_BLOCK);
    const candidates = behaviorWaypoints.filter((waypoint) => {
      const sameAsPreferred = Math.abs(waypoint.x - preferredWaypoint.x) < 1 && Math.abs(waypoint.y - preferredWaypoint.y) < 1;
      if (sameAsPreferred) {
        return false;
      }

      const isRecent = recentHistory.some((recent) =>
        Math.abs(waypoint.x - recent.x) < 1 && Math.abs(waypoint.y - recent.y) < 1
      );
      if (isRecent) {
        return false;
      }

      return Phaser.Math.Distance.Between(rival.x, rival.y, waypoint.x, waypoint.y) > RIVAL_ROUTE_REACH_DISTANCE * 2;
    });

    if (!candidates.length) {
      return preferredWaypoint;
    }

    const verticalIntent = rival.verticalPatrolDirection >= 0 ? 1 : -1;
    const horizontalIntent = rival.horizontalPatrolDirection >= 0 ? 1 : -1;
    const sorted = candidates
      .map((candidate) => {
        const distance = Phaser.Math.Distance.Between(rival.x, rival.y, candidate.x, candidate.y);
        const verticalDelta = (candidate.y - rival.y) * verticalIntent;
        const horizontalDelta = (candidate.x - rival.x) * horizontalIntent;
        return {
          candidate,
          score: distance + verticalDelta * 0.65 + horizontalDelta * 0.65 + Math.random() * 12,
        };
      })
      .sort((a, b) => b.score - a.score);

    const pickPool = sorted.slice(0, Math.min(3, sorted.length));
    const pick = pickPool[Math.floor(Math.random() * pickPool.length)]?.candidate;
    return pick ?? preferredWaypoint;
  }

  enforceRivalHomeZone(rival, now) {
    const homeZone = rival.homeZone;
    if (!homeZone) {
      return;
    }

    if (rival.y <= homeZone.maxY + RIVAL_HOME_ZONE_PULLBACK_BUFFER) {
      rival.outOfHomeZoneSince = null;
      return;
    }

    if (rival.outOfHomeZoneSince == null) {
      rival.outOfHomeZoneSince = now;
      return;
    }

    if (now - rival.outOfHomeZoneSince < RIVAL_HOME_ZONE_STALL_MS) {
      return;
    }

    const topWaypoint = (rival.behaviorWaypoints ?? []).reduce((best, waypoint) => {
      if (!best) {
        return waypoint;
      }
      return waypoint.y < best.y ? waypoint : best;
    }, null);

    if (topWaypoint) {
      rival.routeTarget = { x: topWaypoint.x, y: topWaypoint.y };
      rival.outOfHomeZoneSince = now;
      return;
    }

    this.assignNextRivalRouteTarget(rival, true);
    rival.outOfHomeZoneSince = now;
  }

  getRivalAggressionProfile(index) {
    return RIVAL_AGGRESSION_PROFILES[index % RIVAL_AGGRESSION_PROFILES.length];
  }

  tryRivalBoundarySlide(rival, headingX, headingY, stepDistance) {
    const slideDistance = Math.max(8, Math.min(stepDistance, RIVAL_EDGE_FOLLOW_STEP));

    const anchorTable = this.getRivalAnchorTable(rival);
    const radialX = rival.x - (anchorTable?.x ?? rival.x - headingY);
    const radialY = rival.y - (anchorTable?.y ?? rival.y + headingX);
    const radialLength = Math.hypot(radialX, radialY);

    // Prefer a consistent clockwise/counterclockwise tangent around table boundaries to avoid jitter.
    const tangentCW = radialLength > 0.001
      ? { x: radialY / radialLength, y: -radialX / radialLength }
      : { x: headingY, y: -headingX };
    const tangentCCW = radialLength > 0.001
      ? { x: -radialY / radialLength, y: radialX / radialLength }
      : { x: -headingY, y: headingX };

    const preferredFirst = rival.patrolClockwise ? [tangentCW, tangentCCW] : [tangentCCW, tangentCW];
    const lateralOptions = [...preferredFirst, { x: -headingY, y: headingX }, { x: headingY, y: -headingX }];

    for (const lateral of lateralOptions) {
      const lateralLen = Math.hypot(lateral.x, lateral.y);
      if (lateralLen <= 0.001) {
        continue;
      }

      const slideX = rival.x + (lateral.x / lateralLen) * slideDistance;
      const slideY = rival.y + (lateral.y / lateralLen) * slideDistance;
      const resolved = this.resolveRivalPatrolCollision(slideX, slideY, rival.x, rival.y, rival.radius);
      if (resolved.x !== rival.x || resolved.y !== rival.y) {
        return resolved;
      }
    }

    return null;
  }

  getRivalAnchorTable(rival) {
    if (!this.tableZones?.length) {
      return null;
    }

    if (rival.patrolTableLabel) {
      const patrolTable = this.tableZones.find((table) => table.label === rival.patrolTableLabel);
      if (patrolTable) {
        return patrolTable;
      }
    }

    return this.tableZones.reduce((nearest, table) => {
      if (!nearest) {
        return table;
      }
      const nearestDistance = Phaser.Math.Distance.Between(rival.x, rival.y, nearest.x, nearest.y);
      const tableDistance = Phaser.Math.Distance.Between(rival.x, rival.y, table.x, table.y);
      return tableDistance < nearestDistance ? table : nearest;
    }, null);
  }

  getRivalPatrolTarget(rival) {
    if (!rival.patrolWaypoints?.length) {
      return null;
    }
    const index = ((rival.patrolWaypointIndex ?? 0) + rival.patrolWaypoints.length) % rival.patrolWaypoints.length;
    return rival.patrolWaypoints[index];
  }

  assignRivalPatrolRoute(rival, allowTableSwitch) {
    const tables = this.tableZones ?? [];
    if (tables.length === 0) {
      return false;
    }

    let tableCandidates = [...tables];
    if (allowTableSwitch && rival.patrolTableLabel) {
      const alternateTables = tables.filter((table) => table.label !== rival.patrolTableLabel);
      if (alternateTables.length > 0) {
        tableCandidates = alternateTables;
      }
    }

    const shuffledTables = this.getSpreadTablesForRival(rival, tableCandidates);
    for (const table of shuffledTables) {
      const waypoints = this.buildTablePatrolWaypoints(table);
      if (waypoints.length < 4) {
        continue;
      }

      rival.patrolTableLabel = table.label;
      rival.patrolWaypoints = waypoints;
      rival.patrolClockwise = Math.random() < 0.5;
      rival.patrolWaypointIndex = this.getNearestWaypointIndex(rival, waypoints);
      return true;
    }

    return false;
  }

  getSpreadTablesForRival(rival, tableCandidates) {
    const others = (this.rivals ?? []).filter((other) => other && other !== rival);
    const scored = tableCandidates.map((table) => {
      const nearestOtherDistance = others.reduce((best, other) => {
        const distance = Phaser.Math.Distance.Between(table.x, table.y, other.x ?? table.x, other.y ?? table.y);
        return Math.min(best, distance);
      }, Number.POSITIVE_INFINITY);

      const ownDistance = Phaser.Math.Distance.Between(rival.x, rival.y, table.x, table.y);
      // Prefer tables far from other rivals while still allowing travel variety.
      const spreadScore = nearestOtherDistance * 1.45 + ownDistance * 0.2 + Math.random() * 8;
      return { table, spreadScore };
    });

    scored.sort((a, b) => b.spreadScore - a.spreadScore);
    return scored.map((entry) => entry.table);
  }

  buildTablePatrolWaypoints(table) {
    const collider = table?.collider;
    if (!table || !collider) {
      return [];
    }

    const seatLanePadding = SEAT_RING_OFFSET + SEAT_COLLIDER_RADIUS + RIVAL_RADIUS + RIVAL_PATROL_CLEARANCE;
    const routeHalfWidth = collider.halfWidth + seatLanePadding;
    const routeHalfHeight = collider.halfHeight + seatLanePadding;

    const baseWaypoints = [
      { x: table.x - routeHalfWidth, y: table.y - routeHalfHeight },
      { x: table.x, y: table.y - routeHalfHeight },
      { x: table.x + routeHalfWidth, y: table.y - routeHalfHeight },
      { x: table.x + routeHalfWidth, y: table.y },
      { x: table.x + routeHalfWidth, y: table.y + routeHalfHeight },
      { x: table.x, y: table.y + routeHalfHeight },
      { x: table.x - routeHalfWidth, y: table.y + routeHalfHeight },
      { x: table.x - routeHalfWidth, y: table.y },
    ];

    const labelSeed = table.label?.charCodeAt(0) ?? 65;
    const filteredWaypoints = baseWaypoints
      .map((point, index) => {
        // Keep patrol offsets deterministic to prevent per-frame retarget jitter.
        const jitterX = Math.sin(labelSeed * 0.17 + index * 2.13) * RIVAL_PATROL_WAYPOINT_JITTER;
        const jitterY = Math.cos(labelSeed * 0.19 + index * 1.81) * RIVAL_PATROL_WAYPOINT_JITTER;
        const x = Phaser.Math.Clamp(
          point.x + jitterX,
          this.arenaBounds.minX + RIVAL_RADIUS,
          this.arenaBounds.maxX - RIVAL_RADIUS
        );
        const y = Phaser.Math.Clamp(
          point.y + jitterY,
          this.arenaBounds.minY + RIVAL_RADIUS,
          this.arenaBounds.maxY - RIVAL_RADIUS
        );
        return { x, y };
      })
      .filter((point) => {
        const resolved = this.resolveTableCollision(point.x, point.y, point.x, point.y, RIVAL_RADIUS);
        return resolved.x === point.x && resolved.y === point.y;
      });



    return filteredWaypoints;
  }

  getNearestWaypointIndex(rival, waypoints) {
    return waypoints.reduce((nearestIndex, waypoint, index) => {
      const nearest = waypoints[nearestIndex];
      const nearestDistance = Phaser.Math.Distance.Between(rival.x, rival.y, nearest.x, nearest.y);
      const candidateDistance = Phaser.Math.Distance.Between(rival.x, rival.y, waypoint.x, waypoint.y);
      return candidateDistance < nearestDistance ? index : nearestIndex;
    }, 0);
  }

  advanceRivalPatrolWaypoint(rival, blocked) {
    if (!rival.patrolWaypoints?.length) {
      this.assignRivalPatrolRoute(rival, true);
      return;
    }

    const total = rival.patrolWaypoints.length;
    const direction = rival.patrolClockwise ? 1 : -1;
    rival.patrolWaypointIndex = ((rival.patrolWaypointIndex ?? 0) + direction + total) % total;

    const switchChance = blocked ? RIVAL_TABLE_SWITCH_CHANCE * 0.75 : RIVAL_TABLE_SWITCH_CHANCE;
    if (Math.random() < switchChance) {
      this.assignRivalPatrolRoute(rival, true);
    }
  }

  pickNextRivalDirection(rival, options = {}) {
    const baseDirections = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: Math.SQRT1_2, y: Math.SQRT1_2 },
      { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
      { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
      { x: -Math.SQRT1_2, y: -Math.SQRT1_2 },
    ];

    const previous = rival.directionHistory?.[0] ?? rival.lastDirection;
    const prior = rival.directionHistory?.[1] ?? null;
    const avoidX = options.avoidHeadingX ?? 0;
    const avoidY = options.avoidHeadingY ?? 0;

    const scored = baseDirections
      .map((direction) => {
        let score = Math.random();

        if (previous) {
          const similarity = direction.x * previous.x + direction.y * previous.y;
          if (similarity > RIVAL_DIRECTION_REPEAT_DOT) {
            score -= 3;
          } else if (similarity > 0.4) {
            score -= 0.6;
          } else {
            score += 0.35;
          }
        }

        if (prior) {
          const similarityToPrior = direction.x * prior.x + direction.y * prior.y;
          if (similarityToPrior > RIVAL_DIRECTION_REPEAT_DOT) {
            score -= 1.2;
          }
        }

        if (avoidX || avoidY) {
          const collisionSimilarity = direction.x * avoidX + direction.y * avoidY;
          if (collisionSimilarity > 0.5) {
            score -= 2;
          }
        }

        const probeDistance = 22;
        const probeX = rival.x + direction.x * probeDistance;
        const probeY = rival.y + direction.y * probeDistance;
        const probe = this.resolveRivalPatrolCollision(probeX, probeY, rival.x, rival.y, rival.radius);
        const blocked = probe.x === rival.x && probe.y === rival.y;
        if (blocked) {
          score -= 2.5;
        }

        return { direction, score };
      })
      .sort((a, b) => b.score - a.score);

    return scored[0]?.direction ?? { x: 1, y: 0 };
  }

  shuffleDirections(directions) {
    const shuffled = [...directions];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  repositionRival(rival) {
    const candidatePoints = [
      { x: this.mazeColumns[1], y: this.mazeRows[2] },
      { x: this.mazeColumns[5], y: this.mazeRows[2] },
      { x: this.mazeColumns[1], y: this.mazeRows[3] },
      { x: this.mazeColumns[5], y: this.mazeRows[3] },
      { x: this.mazeColumns[3], y: this.mazeRows[4] },
    ];

    for (const point of this.shuffleDirections(candidatePoints)) {
      const resolved = this.resolveTableCollision(point.x, point.y, rival.x, rival.y, rival.radius);
      const open = resolved.x === point.x && resolved.y === point.y;
      if (!open) {
        continue;
      }

      rival.x = point.x;
      rival.y = point.y;
      if (rival.visual) {
        rival.visual.x = rival.x;
        rival.visual.y = rival.y;
      }
      if (rival.labelVisual) {
        rival.labelVisual.x = rival.x;
        rival.labelVisual.y = rival.y;
      }
      this.assignRivalPatrolRoute(rival, true);
      return;
    }
  }

  recoverStuckRival(rival) {
    // First attempt: reassign a fresh patrol route from current position.
    const reassigned = this.assignRivalPatrolRoute(rival, true);
    if (reassigned) {
      rival.blockedFrames = Math.max(0, rival.blockedFrames - 2);
      return;
    }

    // Second attempt: gently nudge toward current waypoint to escape overlap without visible snapping.
    const waypoint = this.getRivalPatrolTarget(rival);
    if (waypoint) {
      const dx = waypoint.x - rival.x;
      const dy = waypoint.y - rival.y;
      const len = Math.hypot(dx, dy);
      if (len > 0.001) {
        const nudgeDistance = 8;
        const nudgeX = rival.x + (dx / len) * nudgeDistance;
        const nudgeY = rival.y + (dy / len) * nudgeDistance;
        const nudged = this.resolveRivalPatrolCollision(nudgeX, nudgeY, rival.x, rival.y, rival.radius);
        if (nudged.x !== rival.x || nudged.y !== rival.y) {
          rival.x = nudged.x;
          rival.y = nudged.y;
          rival.blockedFrames = Math.max(0, rival.blockedFrames - 3);
          return;
        }
      }
    }

    // Last resort: only hard reset if the rival has been blocked for a long stretch.
    if (rival.blockedFrames >= RIVAL_HARD_RESET_THRESHOLD) {
      this.repositionRival(rival);
      rival.blockedFrames = 0;
    }
  }

  handleRivalCollisionPenalty() {
    if (!this.player || !this.rivals?.length) {
      return;
    }

    if (!this.orderTimerRunning) {
      return;
    }

    const now = this.time?.now ?? Date.now();
    if (now - this.lastRivalPenaltyAt < RIVAL_HIT_COOLDOWN_MS) {
      return;
    }

    if (!this.rivalBumpDetectedThisFrame) {
      return;
    }

    this.lastRivalPenaltyAt = now;
    this.roundBumpCount += 1;
    this.comboCount = 0;
    AudioManager.onBump();
    this.playRivalPenaltyFeedback();
    // Brief grace period lets the player escape instead of getting body-pinned.
    this.playerRivalGhostUntil = now + RIVAL_POST_HIT_ESCAPE_GRACE_MS;
    this.remainingTime = Math.max(0, this.remainingTime - RIVAL_TIME_PENALTY_SECONDS);
    this.timerText?.setText(`${this.formatTime(this.remainingTime)}`);
    this.showRivalPenaltyHint(RIVAL_TIME_PENALTY_SECONDS);

    if (this.remainingTime <= 0) {
      this.endRound("TIME_UP");
    }
  }

  resolveRivalToRivalBumps() {
    if (!this.rivals?.length) {
      return;
    }

    for (let i = 0; i < this.rivals.length; i += 1) {
      for (let j = i + 1; j < this.rivals.length; j += 1) {
        const rivalA = this.rivals[i];
        const rivalB = this.rivals[j];
        const dx = rivalB.x - rivalA.x;
        const dy = rivalB.y - rivalA.y;
        const distance = Math.hypot(dx, dy) || 0.0001;
        const minDistance = rivalA.radius + rivalB.radius;

        if (distance >= minDistance) {
          continue;
        }

        const normalX = dx / distance;
        const normalY = dy / distance;
        const overlap = minDistance - distance;
        const separation = overlap * 0.5;
        rivalA.x -= normalX * separation;
        rivalA.y -= normalY * separation;
        rivalB.x += normalX * separation;
        rivalB.y += normalY * separation;

        const bumpScaleA = rivalA.bumpImpulseScale ?? 1;
        const bumpScaleB = rivalB.bumpImpulseScale ?? 1;
        const baseImpulse = overlap * RIVAL_SPEED * RIVAL_BUMP_RESPONSE_FACTOR;
        const impulseA = Math.max(RIVAL_BUMP_MIN_IMPULSE, baseImpulse * bumpScaleA);
        const impulseB = Math.max(RIVAL_BUMP_MIN_IMPULSE, baseImpulse * bumpScaleB);
        rivalA.vx = -normalX * impulseA;
        rivalA.vy = -normalY * impulseA;
        rivalB.vx = normalX * impulseB;
        rivalB.vy = normalY * impulseB;

        this.assignNextRivalRouteTarget(rivalA, true);
        this.assignNextRivalRouteTarget(rivalB, true);
      }
    }

    this.rivals.forEach((rival) => {
      rival.x = Phaser.Math.Clamp(rival.x, this.arenaBounds.minX + rival.radius, this.arenaBounds.maxX - rival.radius);
      rival.y = Phaser.Math.Clamp(rival.y, this.arenaBounds.minY + rival.radius, this.arenaBounds.maxY - rival.radius);
      if (rival.visual) {
        rival.visual.x = rival.x;
        rival.visual.y = rival.y;
      }
      if (rival.labelVisual) {
        rival.labelVisual.x = rival.x;
        rival.labelVisual.y = rival.y;
      }
    });
  }

  findDeliverableSeat() {
    const radius = this.getCurrentInteractionRadius() + 4;
    const currentTarget = this.getCurrentTargetSeatLabel();
    return this.seatZones.find((seat) => seat.isActive && seat.label === currentTarget && this.isAdjacent(seat, radius));
  }

  isAdjacent(zone, radius) {
    return Phaser.Math.Distance.Between(this.player.x, this.player.y, zone.x, zone.y) <= radius;
  }

  getKeyboardDirection() {
    let x = 0;
    let y = 0;

    if (this.cursors?.left?.isDown || this.wasd?.A?.isDown) {
      x = -1;
    } else if (this.cursors?.right?.isDown || this.wasd?.D?.isDown) {
      x = 1;
    }

    if (this.cursors?.up?.isDown || this.wasd?.W?.isDown) {
      y = -1;
    } else if (this.cursors?.down?.isDown || this.wasd?.S?.isDown) {
      y = 1;
    }

    return { x, y };
  }

  getElapsedRatio() {
    const ratio = (ROUND_DURATION_SECONDS - this.remainingTime) / ROUND_DURATION_SECONDS;
    return Math.max(0, Math.min(1, ratio));
  }

  getCurrentInteractionRadius() {
    return Math.round(INTERACTION_RADIUS - (INTERACTION_RADIUS - MIN_INTERACTION_RADIUS) * this.getElapsedRatio());
  }

  getCurrentMoveSpeed() {
    return PLAYER_SPEED + Math.round(40 * this.getElapsedRatio());
  }

  createInitialSeatQueue(length) {
    const queue = [];
    while (queue.length < length) {
      const excludedLabels = new Set([...(this.calledSeatLabels ?? []), ...queue]);
      const label = this.pickRandomSeatFromPool(excludedLabels);
      if (label) queue.push(label);
    }
    return queue;
  }

  initializeQueueTables() {
    const tableLabels = this.tableZones.map((zone) => zone.label);
    this.queueTableLabels = this.shuffleLabels(tableLabels).slice(0, LEVEL_TABLE_QUEUE_COUNT);
  }

  shuffleLabels(labels) {
    const shuffled = [...labels];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getCurrentTargetSeatLabel() {
    return this.nextTargets[0] ?? null;
  }

  getSeatLabelPool() {
    const activeTables = new Set(this.queueTableLabels ?? []);
    if (activeTables.size === 0) {
      return this.seatZones.map((seat) => seat.label);
    }

    return this.seatZones
      .filter((seat) => activeTables.has(seat.tableLabel))
      .map((seat) => seat.label);
  }

  // Pick a random seat label with uniform probability per table.
  // Grouping by table first avoids bias toward tables with more surviving seats.
  pickRandomSeatFromPool(excludedLabels = null) {
    const pool = this.getSeatLabelPool();
    if (pool.length === 0) return null;

    const filteredPool = excludedLabels
      ? pool.filter((label) => !excludedLabels.has(label))
      : pool;
    const candidatePool = filteredPool.length > 0 ? filteredPool : pool;

    const byTable = new Map();
    for (const label of candidatePool) {
      const tableLabel = label.slice(0, -1);
      const group = byTable.get(tableLabel) ?? [];
      group.push(label);
      byTable.set(tableLabel, group);
    }

    const tableKeys = [...byTable.keys()];
    const chosenTable = tableKeys[Math.floor(Math.random() * tableKeys.length)];
    const seats = byTable.get(chosenTable);
    return seats[Math.floor(Math.random() * seats.length)];
  }

  updateSeatActivationFromQueue() {
    const activeSeat = this.announcedTargetSeatLabel;

    this.seatZones.forEach((seat) => {
      seat.isActive = seat.label === activeSeat;
      seat.visual?.setAlpha?.(seat.isActive ? 1 : 0.35);
      seat.labelText?.setColor?.(seat.isActive ? "#fff8d6" : "#b8c7e3");
    });

    this.tableZones.forEach((zone) => {
      const hasActiveSeat = this.seatZones.some((seat) => seat.tableLabel === zone.label && seat.isActive);
      zone.isActive = hasActiveSeat;
      zone.visual?.setAlpha?.(hasActiveSeat ? 1 : 0.65);
      zone.labelText?.setColor?.(hasActiveSeat ? "#101522" : "#56647e");
    });

    this.updatePersistentHud();
  }

  advanceTargetQueue(completedSeatLabel) {
    const activeSeat = this.getCurrentTargetSeatLabel();
    if (!activeSeat || (completedSeatLabel && completedSeatLabel !== activeSeat)) {
      return;
    }

    this.nextTargets.shift();
    const excludedLabels = new Set([...(this.calledSeatLabels ?? []), ...this.nextTargets]);
    const nextSeat = this.pickRandomSeatFromPool(excludedLabels);
    if (nextSeat) this.nextTargets.push(nextSeat);

    this.remainingTime = this.getRoundDurationSecondsForDay(this.shiftNumber);
    this.timerText?.setText(`${this.formatTime(this.remainingTime)}`);
    this.hasPlayedTimerWarning = false;
    this.orderAnnouncementActive = false;
    this.orderTimerRunning = false;

    // Focus should only appear after the chef announces the new target.
    this.announcedTargetSeatLabel = null;
    this.setPassPickupAvailability(false);
    this.updateSeatActivationFromQueue();
    this.scheduleNextTargetAnnouncement();
  }

  scheduleNextTargetAnnouncement() {
    if (this.pendingChefAnnouncementEvent?.remove) {
      this.pendingChefAnnouncementEvent.remove(false);
      this.pendingChefAnnouncementEvent = null;
    }

    if (this.time?.delayedCall) {
      this.pendingChefAnnouncementEvent = this.time.delayedCall(CHEF_POST_DELIVERY_DELAY_MS, () => {
        this.pendingChefAnnouncementEvent = null;
        this.announceCurrentTargetSeat();
      });
      return;
    }

    this.announceCurrentTargetSeat();
  }

  createChefAnnouncer() {
    if (!this.add || !this.pickupZone) {
      return;
    }

    this.chefHiddenY = this.pickupZone.y - 52;
    this.chefEmergeY = this.pickupZone.y - 6;
    const chefX = this.pickupZone.x;

    const chefVisual = this.textures?.exists(CHEF_ASSET_KEY)
      ? this.add.image(0, 16, CHEF_ASSET_KEY).setDisplaySize(42, 58)
      : this.add.rectangle(0, 16, 54, 54, 0xf8f3e7, 1).setStrokeStyle(2, 0x2f3d55);

    const bubbleShadow = this.add.rectangle(3, -56, 236, 70, 0x20314d, 0.38);
    const bubbleBg = this.add.rectangle(0, -58, 232, 66, 0xf8fbff, 1).setStrokeStyle(2, 0x4d6388);
    const bubblePointer = this.add.triangle(0, -24, 0, 0, 20, 0, 10, 16, 0xf8fbff, 1).setStrokeStyle(2, 0x4d6388);
    this.chefSpeechText = this.add
      .text(0, -58, "", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "16px",
        color: "#1b2a45",
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5);

    this.chefContainer = this.add.container(chefX, this.chefHiddenY, [
      chefVisual,
    ]);
    this.chefContainer.setDepth?.(20);
    this.chefContainer.setVisible(false);

    this.chefBubbleContainer = this.add.container(chefX, this.chefHiddenY, [
      bubbleShadow,
      bubbleBg,
      bubblePointer,
      this.chefSpeechText,
    ]);
    this.chefBubbleContainer.setDepth?.(40);
    this.chefBubbleContainer.setVisible(false);
  }

  announceCurrentTargetSeat() {
    const seatLabel = this.getCurrentTargetSeatLabel();
    if (!seatLabel || !this.chefContainer || !this.chefBubbleContainer || !this.chefSpeechText) {
      return;
    }

    this.calledSeatLabels?.add?.(seatLabel);
    this.announcedTargetSeatLabel = seatLabel;
    this.orderAnnouncementActive = true;
    this.orderTimerRunning = false;
    this.setPassPickupAvailability(true);
    this.updateSeatActivationFromQueue();
    this.pulseDisplay([this.targetHudIcon, this.targetHudText], { scale: 1.12, durationIn: 90, durationOut: 180 });

    const tableLabel = seatLabel.slice(0, 1);
    const seatNumber = seatLabel.slice(1);
    this.chefSpeechText.setText(`${tableLabel}${seatNumber}`);

    this.chefContainer.setVisible(true);
    this.chefBubbleContainer.setVisible(true);
    this.chefContainer.y = this.chefHiddenY;
    this.chefBubbleContainer.y = this.chefHiddenY;

    if (this.tweens?.killTweensOf) {
      this.tweens.killTweensOf(this.chefContainer);
      this.tweens.killTweensOf(this.chefBubbleContainer);
      this.tweens.killTweensOf(this.chefSpeechText);
    }

    if (this.tweens?.add) {
      this.chefSpeechText.setAlpha(0);
      this.tweens.add({
        targets: this.chefContainer,
        y: this.chefEmergeY,
        duration: 300,
        ease: "Back.Out",
      });
      this.tweens.add({
        targets: this.chefBubbleContainer,
        y: this.chefEmergeY,
        duration: 300,
        ease: "Back.Out",
      });
      this.chefSpeechText.setScale(0.94);
      this.tweens.add({
        targets: this.chefSpeechText,
        scale: 1,
        alpha: 1,
        duration: 220,
        ease: "Sine.Out",
      });
    } else {
      this.chefContainer.y = this.chefEmergeY;
      this.chefBubbleContainer.y = this.chefEmergeY;
      this.chefSpeechText.setAlpha(1);
    }

    if (this.hideChefAnnouncementEvent?.remove) {
      this.hideChefAnnouncementEvent.remove(false);
      this.hideChefAnnouncementEvent = null;
    }

    if (this.time?.delayedCall) {
      this.hideChefAnnouncementEvent = this.time.delayedCall(CHEF_ANNOUNCE_DISPLAY_MS, () => {
        if (!this.chefContainer) {
          return;
        }

        if (this.tweens?.add) {
          this.tweens.add({
            targets: this.chefContainer,
            y: this.chefHiddenY,
            duration: 220,
            ease: "Sine.In",
            onComplete: () => {
              this.chefContainer?.setVisible(false);
            },
          });
          this.tweens.add({
            targets: this.chefBubbleContainer,
            y: this.chefHiddenY,
            duration: 220,
            ease: "Sine.In",
            onComplete: () => {
              this.chefBubbleContainer?.setVisible(false);
            },
          });
          return;
        }

        this.chefContainer.setVisible(false);
        this.chefBubbleContainer.setVisible(false);
      });
    }
  }

  showRivalPenaltyHint(secondsLost) {
    if (!this.rivalPenaltyHintText) {
      return;
    }

    this.rivalPenaltyHintText.setText?.(`-${secondsLost}`);
    this.rivalPenaltyHintText.setAlpha?.(1);
    this.pulseDisplay(this.warningHudIcon, { scale: 1.18, durationIn: 100, durationOut: 220 });

    if (this.hideRivalPenaltyHintEvent?.remove) {
      this.hideRivalPenaltyHintEvent.remove(false);
      this.hideRivalPenaltyHintEvent = null;
    }

    if (this.time?.delayedCall) {
      this.hideRivalPenaltyHintEvent = this.time.delayedCall(900, () => {
        this.rivalPenaltyHintText?.setAlpha?.(0);
      });
      return;
    }

    this.rivalPenaltyHintText.setAlpha?.(0);
  }

  tryStartOrderTimer() {
    if (this.orderTimerRunning || !this.orderAnnouncementActive || !this.player || !this.passInteractionZone) {
      return;
    }

    const motion = this.playerMotionVector ?? { x: 0, y: 0 };
    const motionStrength = this.playerMotionStrength ?? 0;
    if (motionStrength < 0.05) {
      return;
    }

    const toPassX = this.passInteractionZone.x - this.player.x;
    const toPassY = this.passInteractionZone.y - this.player.y;
    const toPassDistance = Math.hypot(toPassX, toPassY);
    if (toPassDistance <= 0.001) {
      this.orderTimerRunning = true;
      return;
    }

    const towardPassDot = (motion.x * toPassX + motion.y * toPassY) / toPassDistance;
    if (towardPassDot >= 0.35) {
      this.orderTimerRunning = true;
    }
  }

  endRound(reason) {
    if (this.roundEnded) {
      return;
    }

    const totalScore = this.shiftScore + this.score;
    const totalDelivered = this.shiftDelivered + this.deliveredPlates;
    const isLayoutComplete = reason === "LAYOUT_CLEAR";
    const isLastLevelInDay = this.shiftLevel >= LEVELS_PER_SHIFT;
    const summary = this.buildRoundSummary(reason, this.shiftLevel);
    this.logRoundBalanceSnapshot(reason);
    this.roundEnded = true;

    if (this.returnToMenuEvent?.remove) {
      this.returnToMenuEvent.remove(false);
      this.returnToMenuEvent = null;
    }

    if (isLayoutComplete) {
      this.returnToMenuEvent = this.time.delayedCall(550, () => {
        this.returnToMenuEvent = null;
        AudioManager.onShiftComplete();
        this.scene.start(isLastLevelInDay ? DAY_COMPLETE_SCENE_KEY : SHIFT_COMPLETE_SCENE_KEY, {
          totalScore,
          totalDelivered,
          shiftLevel: this.shiftLevel,
          shiftNumber: this.shiftNumber,
          isDayComplete: isLastLevelInDay,
          bestCombo: this.bestComboStreak,
        });
      });
      return;
    }

    this.returnToMenuEvent = this.time.delayedCall(550, () => {
      this.returnToMenuEvent = null;
      this.scene.start(MENU_SCENE_KEY, {
        score: totalScore,
        delivered: totalDelivered,
        reason: summary.code,
        reasonLabel: summary.label,
      });
    });
  }

  formatShiftLabel() {
    const shiftName = SHIFT_NAMES[(this.shiftLevel - 1) % SHIFT_NAMES.length];
    return `DAY ${this.shiftNumber}  —  ${shiftName}`;
  }

  getLayoutIndexForDay(dayNumber) {
    const cadence = [0, 1, 2, 1, 3, 4, 0, 2, 3, 1];
    return cadence[(Math.max(1, dayNumber) - 1) % cadence.length];
  }

  getDayDifficultyStep(dayNumber = this.shiftNumber) {
    return Math.max(0, (dayNumber ?? 1) - 1);
  }

  getRoundDurationSecondsForDay(dayNumber = this.shiftNumber) {
    const step = this.getDayDifficultyStep(dayNumber);
    return Math.max(MIN_ROUND_DURATION_SECONDS, ROUND_DURATION_SECONDS - step * ROUND_DURATION_DECAY_PER_DAY);
  }

  getLayoutPlateGoalForDay(dayNumber = this.shiftNumber) {
    const normalizedDay = Math.max(1, dayNumber ?? 1);
    const preSoftCapDays = Math.max(0, Math.min(normalizedDay, PLATE_GOAL_SOFT_CAP_START_DAY) - 1);
    const postSoftCapDays = Math.max(0, normalizedDay - PLATE_GOAL_SOFT_CAP_START_DAY);
    return FIRST_DAY_PLATE_GOAL
      + preSoftCapDays * PLATE_GOAL_INCREASE_PER_DAY
      + postSoftCapDays * PLATE_GOAL_SOFT_CAP_INCREASE_PER_DAY;
  }

  getRivalSpeedScaleForDay(dayNumber = this.shiftNumber) {
    const step = this.getDayDifficultyStep(dayNumber);
    return 1 + step * RIVAL_SPEED_INCREASE_PER_DAY;
  }

  getTotalScore() {
    return this.shiftScore + this.score;
  }

  buildRoundSummary(reasonCode, shiftLevel) {
    if (reasonCode === "LAYOUT_CLEAR") {
      const level = shiftLevel ?? this.shiftLevel;
      const label = `Layout ${level} complete`;
      const banner = "SHIFT CHANGE";
      return { code: reasonCode, label, status: banner, banner };
    }

    if (reasonCode === "HAZARD_HIT") {
      return {
        code: reasonCode,
        label: "Game over (hazard hit)",
        status: "GAME OVER",
        banner: "GAME OVER",
      };
    }

    return {
      code: reasonCode,
      label: reasonCode,
      status: reasonCode,
      banner: "SHIFT ENDED",
    };
  }

  formatTime(seconds) {
    const clamped = Math.max(0, Math.ceil(seconds));
    const mins = Math.floor(clamped / 60);
    const secs = clamped % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  createPlayerVisual(x, y) {
    if (this.textures?.exists(PLAYER_ASSET_KEY)) {
      return this.add.image(x, y, PLAYER_ASSET_KEY).setDisplaySize(28, 42);
    }

    const player = this.add.circle(x, y, 20, COLORS.accent, 1);
    player.setStrokeStyle?.(3, COLORS.text);
    return player;
  }

  updatePlayerLocationHint() {
    if (!this.player || !this.playerLocationHintText) {
      return;
    }

    this.playerLocationHintText.setText?.("P1");
    this.playerLocationHintText.setPosition?.(this.player.x, this.player.y - 24);
  }

  getTableColliderBounds(variant) {
    return {
      halfWidth: Math.ceil(variant.width / 2),
      halfHeight: Math.ceil(variant.height / 2),
    };
  }

  createTableVisual(x, y, variant) {
    if (this.textures?.exists?.(TABLE_ASSET_KEY)) {
      const table = this.add.image(x, y, TABLE_ASSET_KEY).setDisplaySize(variant.width + 6, variant.height + 6);
      table.setAlpha?.(0.96);
      return table;
    }

    // Dark mahogany wood frame
    this.add.rectangle(x, y, variant.width + 6, variant.height + 6, 0x3A1A08, 1);
    // Cream tablecloth face
    const table = this.add.rectangle(x, y, variant.width, variant.height, 0xF0E8D4, 1);
    // Gold trim inset line
    this.add.rectangle(x, y, variant.width - 6, variant.height - 6, 0xF0E8D4, 0)
      .setStrokeStyle?.(1, 0xC8A030);
    return table;
  }

  getSafeTablePosition(x, y, variant) {
    const halfWidth = Math.ceil(variant.width / 2);
    const halfHeight = Math.ceil(variant.height / 2);
    const wallPadding = BOUNDARY_WALL_THICKNESS + 6;
    const safeX = Phaser.Math.Clamp(
      x,
      this.arenaBounds.minX + wallPadding + halfWidth,
      this.arenaBounds.maxX - wallPadding - halfWidth
    );
    const safeY = Phaser.Math.Clamp(
      y,
      this.arenaBounds.minY + wallPadding + halfHeight,
      this.arenaBounds.maxY - wallPadding - halfHeight
    );
    return { x: safeX, y: safeY };
  }

  getCurrentLayoutTablePositions() {
    if (this.layoutIndex === 1) {
      return this.getLayout2TablePositions();
    }
    if (this.layoutIndex === 2) {
      return this.getLayout3TablePositions();
    }
    if (this.layoutIndex === 3) {
      return this.getLayout4TablePositions();
    }
    if (this.layoutIndex === 4) {
      return this.getLayout5TablePositions();
    }
    return this.getLayout1TablePositions();
  }

  // Layout 1 (default): dense upper half with open lower lanes.
  getLayout1TablePositions() {
    return [
      { label: "A", x: this.mazeColumns[0], y: this.mazeRows[1] },
      { label: "B", x: this.mazeColumns[2], y: this.mazeRows[1] },
      { label: "C", x: this.mazeColumns[4], y: this.mazeRows[1] },
      { label: "D", x: this.mazeColumns[6], y: this.mazeRows[1] },
      { label: "E", x: this.mazeColumns[1], y: this.mazeRows[2] },
      { label: "F", x: this.mazeColumns[3], y: this.mazeRows[2] },
      { label: "G", x: this.mazeColumns[5], y: this.mazeRows[2] },
      { label: "H", x: this.mazeColumns[2], y: this.mazeRows[3] },
      { label: "I", x: this.mazeColumns[4], y: this.mazeRows[3] },
    ];
  }

  // Layout 2: wide upper flanks with open center corridor and symmetric lower spread.
  // Creates three clear vertical lanes through the mid-field, shifting rival
  // traffic pressure compared to layout 1.
  getLayout2TablePositions() {
    return [
      { label: "A", x: this.mazeColumns[1], y: this.mazeRows[1] },
      { label: "B", x: this.mazeColumns[5], y: this.mazeRows[1] },
      { label: "C", x: this.mazeColumns[0], y: this.mazeRows[2] },
      { label: "D", x: this.mazeColumns[2], y: this.mazeRows[2] },
      { label: "E", x: this.mazeColumns[4], y: this.mazeRows[2] },
      { label: "F", x: this.mazeColumns[6], y: this.mazeRows[2] },
      { label: "G", x: this.mazeColumns[1], y: this.mazeRows[3] },
      { label: "H", x: this.mazeColumns[3], y: this.mazeRows[3] },
      { label: "I", x: this.mazeColumns[5], y: this.mazeRows[3] },
    ];
  }

  // Layout 3: compressed center with offset lower anchors to force lateral reroutes.
  getLayout3TablePositions() {
    return [
      { label: "A", x: this.mazeColumns[3], y: this.mazeRows[1] },
      { label: "B", x: this.mazeColumns[1], y: this.mazeRows[1] },
      { label: "C", x: this.mazeColumns[5], y: this.mazeRows[1] },
      { label: "D", x: this.mazeColumns[2], y: this.mazeRows[2] },
      { label: "E", x: this.mazeColumns[4], y: this.mazeRows[2] },
      { label: "F", x: this.mazeColumns[0], y: this.mazeRows[3] },
      { label: "G", x: this.mazeColumns[6], y: this.mazeRows[3] },
      { label: "H", x: this.mazeColumns[2], y: this.mazeRows[4] },
      { label: "I", x: this.mazeColumns[4], y: this.mazeRows[4] },
    ];
  }

  logRoundBalanceSnapshot(reason) {
    if (this.shiftNumber > ROUND_BALANCE_LOG_DAY_LIMIT) {
      return;
    }

    const averageDeliverySeconds = this.deliveryDurations.length > 0
      ? Number((this.deliveryDurations.reduce((sum, value) => sum + value, 0) / this.deliveryDurations.length).toFixed(2))
      : null;

    globalThis.console?.info?.("[BALANCE SNAPSHOT]", {
      day: this.shiftNumber,
      shiftLevel: this.shiftLevel,
      layoutIndex: this.layoutIndex,
      layoutGoal: this.layoutPlateGoal,
      delivered: this.deliveredPlates,
      bumpCount: this.roundBumpCount,
      averageDeliverySeconds,
      reason,
    });
  }

  createTableZones() {
    const tablePositions = this.getCurrentLayoutTablePositions();

    return tablePositions.map((zone, index) => {
      const variant = TABLE_VARIANTS[index % TABLE_VARIANTS.length];
      const safePosition = this.getSafeTablePosition(zone.x, zone.y, variant);
      const colliderBounds = this.getTableColliderBounds(variant);
      const visual = this.createTableVisual(safePosition.x, safePosition.y, variant);
      const labelText = this.add
        .text(safePosition.x, safePosition.y, zone.label, {
          fontFamily: "Georgia, serif",
          fontSize: "30px",
          color: "#17223a",
        })
        .setOrigin(0.5);

      return {
        ...zone,
        x: safePosition.x,
        y: safePosition.y,
        variant,
        collider: {
          type: "rect",
          x: safePosition.x,
          y: safePosition.y,
          halfWidth: colliderBounds.halfWidth,
          halfHeight: colliderBounds.halfHeight,
        },
        visual,
        labelText,
        isActive: false,
      };
    });
  }

  createBoundaryColliders() {
    const width = this.arenaBounds.maxX - this.arenaBounds.minX;
    const height = this.arenaBounds.maxY - this.arenaBounds.minY;
    const wallHalf = BOUNDARY_WALL_THICKNESS / 2;
    const midX = this.arenaBounds.minX + width / 2;
    const midY = this.arenaBounds.minY + height / 2;

    return [
      {
        type: "rect",
        x: midX,
        y: this.arenaBounds.minY + wallHalf,
        halfWidth: width / 2,
        halfHeight: wallHalf,
      },
      {
        type: "rect",
        x: midX,
        y: this.arenaBounds.maxY - wallHalf,
        halfWidth: width / 2,
        halfHeight: wallHalf,
      },
      {
        type: "rect",
        x: this.arenaBounds.minX + wallHalf,
        y: midY,
        halfWidth: wallHalf,
        halfHeight: height / 2,
      },
      {
        type: "rect",
        x: this.arenaBounds.maxX - wallHalf,
        y: midY,
        halfWidth: wallHalf,
        halfHeight: height / 2,
      },
    ];
  }

  createRivalPatrolNoGoColliders() {
    return (this.tableZones ?? []).map((table) => {
      const collider = table.collider;
      const seatLanePadding = SEAT_RING_OFFSET + SEAT_COLLIDER_RADIUS + RIVAL_RADIUS;
      return {
        type: "rect",
        x: table.x,
        y: table.y,
        halfWidth: collider.halfWidth + seatLanePadding,
        halfHeight: collider.halfHeight + seatLanePadding,
      };
    });
  }

  getPlayerSpawnCandidates() {
    return [
      { x: this.mazeColumns[1], y: this.mazeRows[1] },
      { x: this.mazeColumns[3], y: this.mazeRows[1] },
      { x: this.mazeColumns[5], y: this.mazeRows[1] },
      { x: this.mazeColumns[1], y: this.mazeRows[3] },
      { x: this.mazeColumns[3], y: this.mazeRows[3] },
      { x: this.mazeColumns[5], y: this.mazeRows[3] },
      { x: this.mazeColumns[2], y: this.mazeRows[4] },
      { x: this.mazeColumns[4], y: this.mazeRows[4] },
    ];
  }

  isSpawnPositionOpen(point, bodyRadius = PLAYER_SPAWN_COLLISION_RADIUS + PLAYER_SPAWN_TABLE_BUFFER) {
    // Use an offset previous position so the resolver can distinguish blocked from open.
    // Passing the same coords for next and prev always returns prev on a block,
    // making every position incorrectly appear open.
    const prevX = point.x - bodyRadius * 3;
    const prevY = point.y - bodyRadius * 3;
    const resolved = this.resolveTableCollision(point.x, point.y, prevX, prevY, bodyRadius);
    return resolved.x === point.x && resolved.y === point.y;
  }

  getOpenSpawnPointsFromMazeIntersections() {
    return this.mazeRows.flatMap((y) =>
      this.mazeColumns
        .map((x) => ({ x, y }))
        .filter((point) => this.isSpawnPositionOpen(point))
    );
  }

  getPlayerSpawnPoint() {
    const preferredCandidates = this.getPlayerSpawnCandidates();
    const backupCandidates = this.getOpenSpawnPointsFromMazeIntersections();
    const seen = new Set();
    const mergedCandidates = [...preferredCandidates, ...backupCandidates].filter((candidate) => {
      const key = `${candidate.x},${candidate.y}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });

    const openCandidates = mergedCandidates.filter((candidate) => this.isSpawnPositionOpen(candidate));
    if (openCandidates.length === 0) {
      return { x: this.mazeColumns[1], y: this.mazeRows[1] };
    }

    const rivalStarts = this.getRivalSpawnPoints();
    const ranked = openCandidates
      .map((candidate) => {
        const nearestRivalDistance = rivalStarts.reduce((best, rival) => {
          const distance = Phaser.Math.Distance.Between(candidate.x, candidate.y, rival.x, rival.y);
          return Math.min(best, distance);
        }, Number.POSITIVE_INFINITY);
        return { candidate, nearestRivalDistance };
      })
      .sort((a, b) => b.nearestRivalDistance - a.nearestRivalDistance);

    const stronglySafe = ranked.filter((entry) => entry.nearestRivalDistance >= RIVAL_SPAWN_PLAYER_SAFE_DISTANCE);
    if (stronglySafe.length > 0) {
      const pickPool = stronglySafe.slice(0, Math.min(PLAYER_SPAWN_SAFE_CHOICES, stronglySafe.length));
      return pickPool[Math.floor(Math.random() * pickPool.length)].candidate;
    }

    // If no candidate clears the ideal rival distance, still pick the farthest open point.
    return ranked[0].candidate;
  }

  getRivalSpawnPoints() {
    return [
      { x: this.mazeColumns[1], y: this.mazeRows[2] },
      { x: this.mazeColumns[3], y: this.mazeRows[1] },
      { x: this.mazeColumns[3], y: this.mazeRows[3] },
      { x: this.mazeColumns[5], y: this.mazeRows[3] },
    ];
  }

  getRivalLaneBounds(lane) {
    if (!this.arenaBounds || !lane) {
      return null;
    }

    if (lane === "top-center") {
      const width = this.arenaBounds.maxX - this.arenaBounds.minX;
      const third = width / 3;
      const minX = this.arenaBounds.minX + third + RIVAL_LANE_MARGIN;
      const maxX = this.arenaBounds.minX + (third * 2) - RIVAL_LANE_MARGIN;
      return { minX, maxX };
    }

    const width = this.arenaBounds.maxX - this.arenaBounds.minX;
    const third = width / 3;
    const laneIndex = Math.max(0, RIVAL_LANES.indexOf(lane));
    const minX = this.arenaBounds.minX + laneIndex * third + RIVAL_LANE_MARGIN;
    const maxX = this.arenaBounds.minX + (laneIndex + 1) * third - RIVAL_LANE_MARGIN;
    return { minX, maxX };
  }

  getRivalSpawnPointsByLane(lane) {
    const laneBounds = this.getRivalLaneBounds(lane);
    const laneCoreSpawns = [
      { x: this.mazeColumns[1], y: this.mazeRows[2], vx: RIVAL_SPEED, vy: 0 },
      { x: this.mazeColumns[3], y: this.mazeRows[1], vx: 0, vy: RIVAL_SPEED },
      { x: this.mazeColumns[3], y: this.mazeRows[3], vx: 0, vy: -RIVAL_SPEED },
      { x: this.mazeColumns[5], y: this.mazeRows[3], vx: -RIVAL_SPEED, vy: 0 },
    ];

    const preferred = laneCoreSpawns.filter((spawn) => {
      if (!laneBounds) {
        return true;
      }
      return spawn.x >= laneBounds.minX && spawn.x <= laneBounds.maxX;
    });

    const lanePatrolFallback = (this.tableZones ?? []).flatMap((table) =>
      this.buildTablePatrolWaypoints(table)
        .filter((point) => {
          if (!laneBounds) {
            return true;
          }
          return point.x >= laneBounds.minX && point.x <= laneBounds.maxX;
        })
        .map((point) => ({ x: point.x, y: point.y, vx: RIVAL_SPEED, vy: 0 }))
    );

    return this.shuffleDirections([...preferred, ...lanePatrolFallback]);
  }

  pickRivalSpawnForLane(lane, playerSpawn, usedSpawns) {
    const candidates = this.getRivalSpawnPointsByLane(lane).filter((spawn) => this.isRivalSpawnOpen(spawn.x, spawn.y));
    if (!candidates.length) {
      return null;
    }

    const scored = candidates.map((candidate) => {
      const playerDistance = playerSpawn
        ? Phaser.Math.Distance.Between(candidate.x, candidate.y, playerSpawn.x, playerSpawn.y)
        : Number.POSITIVE_INFINITY;
      const nearestRivalDistance = (usedSpawns ?? []).reduce((best, used) => {
        const distance = Phaser.Math.Distance.Between(candidate.x, candidate.y, used.x, used.y);
        return Math.min(best, distance);
      }, Number.POSITIVE_INFINITY);

      const safeBonus = playerDistance >= RIVAL_SPAWN_PLAYER_SAFE_DISTANCE ? 220 : 0;
      const spreadBonus = Math.min(nearestRivalDistance, 200);
      return {
        candidate,
        score: playerDistance + safeBonus + spreadBonus + Math.random() * 10,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.candidate ?? null;
  }

  getRivalLaneForX(x) {
    if (!this.arenaBounds) {
      return RIVAL_LANES[1];
    }

    const width = this.arenaBounds.maxX - this.arenaBounds.minX;
    const third = width / 3;
    const relativeX = x - this.arenaBounds.minX;
    if (relativeX < third) {
      return RIVAL_LANES[0];
    }
    if (relativeX < third * 2) {
      return RIVAL_LANES[1];
    }
    return RIVAL_LANES[2];
  }

  pickRivalSpawnRelativeToPlayer(playerSpawn, usedSpawns, slotIndex, baseAngle) {
    const openPoints = this.getOpenSpawnPointsFromMazeIntersections();
    const preferredPoints = this.getRivalSpawnPoints();
    const candidates = this.shuffleDirections([
      ...preferredPoints.map((point) => ({ x: point.x, y: point.y })),
      ...openPoints,
    ]).filter((spawn) => this.isRivalSpawnOpen(spawn.x, spawn.y));

    if (!candidates.length) {
      return null;
    }

    const desiredAngle = baseAngle + (Math.PI * 2 * slotIndex) / RIVAL_COUNT;
    const scored = candidates.map((candidate) => {
      const dx = candidate.x - playerSpawn.x;
      const dy = candidate.y - playerSpawn.y;
      const playerDistance = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const angleDelta = Math.atan2(Math.sin(angle - desiredAngle), Math.cos(angle - desiredAngle));
      const angleScore = 1 - Math.min(1, Math.abs(angleDelta) / Math.PI);

      const distanceToTarget = Math.abs(playerDistance - RIVAL_SPAWN_TARGET_DISTANCE);
      const safeBonus = playerDistance >= RIVAL_SPAWN_PLAYER_SAFE_DISTANCE ? 200 : -300;
      const distanceScore = Math.max(0, 220 - distanceToTarget);

      const nearestRivalDistance = (usedSpawns ?? []).reduce((best, used) => {
        const distance = Phaser.Math.Distance.Between(candidate.x, candidate.y, used.x, used.y);
        return Math.min(best, distance);
      }, Number.POSITIVE_INFINITY);
      const spreadPenalty = nearestRivalDistance < RIVAL_SPAWN_MIN_SEPARATION ? -500 : 0;
      const spreadScore = Math.min(nearestRivalDistance, 260);

      const score = safeBonus + distanceScore + angleScore * 180 + spreadScore + spreadPenalty + Math.random() * 12;
      return { candidate, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const best = scored[0]?.candidate;
    if (!best) {
      return null;
    }

    // Start moving roughly inward so first beats feel active rather than static.
    const towardPlayerX = playerSpawn.x - best.x;
    const towardPlayerY = playerSpawn.y - best.y;
    const towardLen = Math.hypot(towardPlayerX, towardPlayerY) || 1;
    return {
      x: best.x,
      y: best.y,
      vx: (towardPlayerX / towardLen) * RIVAL_SPEED,
      vy: (towardPlayerY / towardLen) * RIVAL_SPEED,
    };
  }

  createSeatZones() {
    const seatClearance = BOUNDARY_WALL_THICKNESS + SEAT_COLLIDER_RADIUS;
    const minSeatX = this.arenaBounds.minX + seatClearance;
    const maxSeatX = this.arenaBounds.maxX - seatClearance;
    const minSeatY = this.arenaBounds.minY + seatClearance;
    const maxSeatY = this.arenaBounds.maxY - seatClearance;

    return this.tableZones.flatMap((table) => {
      const variant = table.variant ?? TABLE_VARIANTS[0];
      const seatGap = SEAT_PAIR_GAP;
      const sideGapX = Math.ceil(variant.width / 2) + SEAT_RING_OFFSET;
      const sideGapY = Math.ceil(variant.height / 2) + SEAT_RING_OFFSET;
      const offsets =
        variant.orientation === "vertical"
          ? [
              { number: 1, dx: -sideGapX, dy: -seatGap },
              { number: 2, dx: -sideGapX, dy: seatGap },
              { number: 3, dx: sideGapX, dy: -seatGap },
              { number: 4, dx: sideGapX, dy: seatGap },
              { number: 5, dx: 0, dy: -sideGapY },
              { number: 6, dx: 0, dy: sideGapY },
            ]
          : [
              { number: 1, dx: -seatGap, dy: -sideGapY },
              { number: 2, dx: seatGap, dy: -sideGapY },
              { number: 3, dx: -seatGap, dy: sideGapY },
              { number: 4, dx: seatGap, dy: sideGapY },
              { number: 5, dx: -sideGapX, dy: 0 },
              { number: 6, dx: sideGapX, dy: 0 },
            ];

      return offsets
        .map((offset) => {
          const x = table.x + offset.dx;
          const y = table.y + offset.dy;

          if (x < minSeatX || x > maxSeatX || y < minSeatY || y > maxSeatY) {
            return null;
          }

          const label = `${table.label}${offset.number}`;
          // Seat: gold outer ring + burgundy velvet fill
          this.add.circle(x, y, 14, 0xC8A030, 1);
          const visual = this.add.circle(x, y, 12, 0x5A1428, 1);
          const labelText = this.add
            .text(x, y, String(offset.number), {
              fontFamily: "Verdana, sans-serif",
              fontSize: "10px",
              color: "#F0C860",
            })
            .setOrigin(0.5);

          return {
            label,
            tableLabel: table.label,
            x,
            y,
            visual,
            labelText,
            isActive: false,
          };
        })
        .filter((seat) => seat !== null);
    });
  }

  drawPickupCounter() {
    const px = this.pickupZone.x;
    const topY = this.arenaBounds.minY;

    // Back wall panel (dark wainscoting color, spans full counter width)
    this.add.rectangle(px, topY + 6, 240, 16, 0x200608, 1).setStrokeStyle(1, 0xC8A030);

    // Counter cabinet (dark mahogany wood)
    this.add.rectangle(px, this.pickupZone.y - 4, 110, 36, 0x3A1A08, 1).setStrokeStyle(2, 0xC8A030);

    // Marble counter top
    this.add.rectangle(px, this.pickupZone.y + 14, 120, 10, 0xEAE0D0, 1).setStrokeStyle(1, 0xC0A880);

    // Marble veining (subtle diagonal accent lines using tiny rects)
    this.add.rectangle(px - 20, this.pickupZone.y + 13, 18, 1, 0xD0C8B8, 0.6);
    this.add.rectangle(px + 10, this.pickupZone.y + 15, 22, 1, 0xD0C8B8, 0.6);

    // Brass handle decorations (small gold rects)
    this.add.rectangle(px - 26, this.pickupZone.y - 2, 6, 10, 0xC8880A, 1).setStrokeStyle(1, 0xF0C060);
    this.add.rectangle(px + 26, this.pickupZone.y - 2, 6, 10, 0xC8880A, 1).setStrokeStyle(1, 0xF0C060);

    // Interaction pickup indicator (gold star/dot below counter)
    this.passInteractionVisual = this.add
      .circle(this.passInteractionZone.x, this.passInteractionZone.y, 9, 0xF0C030, 0.7)
      .setStrokeStyle(2, 0xFFE080);
    this.setPassPickupAvailability(this.passReadyForPickup);
  }

  setPassPickupAvailability(isReady) {
    this.passReadyForPickup = isReady;

    if (!this.passInteractionVisual) {
      return;
    }

    const fillColor = isReady ? 0xf6c453 : 0x89a5cc;
    const strokeColor = isReady ? 0xffefb5 : 0xd4e3f5;
    const fillAlpha = isReady ? 0.55 : 0.25;
    this.passInteractionVisual.setFillStyle?.(fillColor, fillAlpha);
    this.passInteractionVisual.setStrokeStyle?.(2, strokeColor);
  }

  pulsePassIndicator() {
    this.pulseDisplay(this.passInteractionVisual, { scale: 1.2, durationIn: 80, durationOut: 160 });
  }

  pulseTimerWarning() {
    this.pulseDisplay([this.timerText, this.timerHudIcon, this.warningHudIcon], {
      scale: 1.12,
      durationIn: 90,
      durationOut: 220,
    });
  }

  playDeliveryHudFeedback(targetSeat) {
    this.pulseDisplay([this.scoreText, this.scoreHudIcon], { scale: 1.16, durationIn: 80, durationOut: 180 });
    this.pulseDisplay(this.goalHudText, { scale: 1.08, durationIn: 90, durationOut: 200 });

    if (targetSeat?.visual) {
      targetSeat.visual.setAlpha?.(1);
      this.pulseDisplay(targetSeat.visual, { scale: 1.2, durationIn: 80, durationOut: 180 });
    }
  }

  playRivalPenaltyFeedback() {
    this.pulseDisplay(this.timerText, { scale: 1.14, durationIn: 70, durationOut: 200 });
    this.pulseDisplay(this.warningHudIcon, { scale: 1.2, durationIn: 70, durationOut: 210 });

    this.cameras?.main?.shake?.(90, 0.0026);

    if (this.hudDamageFlash && this.tweens?.add) {
      this.hudDamageFlash.setAlpha?.(0.24);
      this.tweens.add({
        targets: this.hudDamageFlash,
        alpha: 0,
        duration: 170,
        ease: "Sine.Out",
      });
    }
  }

  pulseDisplay(targets, options = {}) {
    if (!this.tweens?.add) {
      return;
    }

    const list = (Array.isArray(targets) ? targets : [targets]).filter(Boolean);
    if (list.length === 0) {
      return;
    }

    const scale = options.scale ?? 1.1;
    const durationIn = options.durationIn ?? 90;
    const durationOut = options.durationOut ?? 170;
    this.tweens.add({
      targets: list,
      scaleX: scale,
      scaleY: scale,
      duration: durationIn,
      yoyo: true,
      ease: "Sine.Out",
      hold: 0,
      repeat: 0,
      yoyoEase: "Sine.In",
      completeDelay: Math.max(0, durationOut - durationIn),
    });
  }

  updatePersistentHud() {
    if (this.goalHudText) {
      const remainingGoal = Math.max(0, this.layoutPlateGoal - this.deliveredPlates);
      this.goalHudText.setText?.(`${remainingGoal}`);
    }

    if (this.shiftLevelText) {
      this.shiftLevelText.setText?.(this.formatHudShiftValue());
    }

    if (!this.targetHudText) {
      return;
    }

    const announcedSeat = this.announcedTargetSeatLabel;
    if (!announcedSeat) {
      this.targetHudText.setText?.("--");
      return;
    }

    this.targetHudText.setText?.(this.formatTargetSeatHudValue(announcedSeat));
  }

  formatTargetSeatHudValue(seatLabel) {
    if (!seatLabel) {
      return "--";
    }

    const match = /^([A-Z]+)(\d+)$/i.exec(seatLabel.trim());
    if (!match) {
      return seatLabel;
    }

    const [, tableId, seatNumber] = match;
    return `${tableId.toUpperCase()}/${seatNumber}`;
  }

  formatHudShiftValue() {
    return `${this.shiftNumber}-${this.shiftLevel}`;
  }

  getDayTwistHudValue(dayTwist) {
    if (dayTwist === DAY_TWIST_RUSH_HOUR) {
      return "+15";
    }

    if (dayTwist === DAY_TWIST_BLUE_PLATE) {
      return "+25";
    }

    if (dayTwist === DAY_TWIST_PEAK_SERVICE) {
      return "-5";
    }

    return "";
  }

  createRivals(playerSpawn) {
    const usedSpawns = [];

    return Array.from({ length: RIVAL_COUNT }, (_, index) => {
      const lane = RIVAL_SPAWN_LANE_SEQUENCE[index % RIVAL_SPAWN_LANE_SEQUENCE.length];
      const laneSpawn = this.pickRivalSpawnForLane(lane, playerSpawn, usedSpawns);
      const fallbackSpawn = this.getRivalSpawnPointsByLane(lane)[0]
        ?? {
          x: this.getRivalSpawnPoints()[index % this.getRivalSpawnPoints().length].x,
          y: this.getRivalSpawnPoints()[index % this.getRivalSpawnPoints().length].y,
          vx: RIVAL_SPEED,
          vy: 0,
        };
      const seed = laneSpawn ?? fallbackSpawn;
      usedSpawns.push(seed);
      let visual;
      if (this.textures?.exists(RIVAL_ASSET_KEY)) {
        visual = this.add.image(seed.x, seed.y, RIVAL_ASSET_KEY).setDisplaySize(28, 42);
      } else {
        visual = this.add.circle(seed.x, seed.y, RIVAL_RADIUS, 0x8c1f66, 1);
        visual.setStrokeStyle?.(2, 0x2ecde8);
      }
      const labelVisual = null;

      const rival = {
        x: seed.x,
        y: seed.y,
        vx: seed.vx,
        vy: seed.vy,
        radius: RIVAL_RADIUS,
        visual,
        labelVisual,
        nextTurnAt: (this.time?.now ?? Date.now()) + RIVAL_INITIAL_CHASE_DELAY_MS,
        blockedFrames: 0,
        lastTableContactAt: -Infinity,
        lane,
        verticalPatrolDirection: lane === "top-center" ? 1 : index % 2 === 0 ? 1 : -1,
        horizontalPatrolDirection: index % 2 === 0 ? 1 : -1,
        behaviorPattern: lane,
        behaviorMode: lane === "center" ? "pingpong" : "loop",
        behaviorWaypoints: [],
        behaviorIndex: null,
        behaviorDirection: 1,
        lastDirection: { x: Math.sign(seed.vx) || 1, y: Math.sign(seed.vy) || 0 },
        directionHistory: [{ x: Math.sign(seed.vx) || 1, y: Math.sign(seed.vy) || 0 }],
        routeTarget: null,
        routeHistory: [],
        routeEntropy: 0.45 + Math.random() * 0.5,
        routeVariance: 0.35 + Math.random() * 0.7,
        lastPatternBreakAt: -Infinity,
        stunnedUntil: 0,
        bumpCooldownUntil: 0,
        bumpChaseLockoutUntil: 0,
        bumpRecoveryActive: false,
        patrolTableLabel: null,
        patrolWaypoints: [],
        patrolWaypointIndex: 0,
        patrolClockwise: true,
        lastFramePosition: { x: seed.x, y: seed.y },
        stallElapsedMs: 0,
        stallRecoveryCount: 0,
        isInterceptingPlayer: false,
        nextInterceptionRetargetAt: 0,
        outOfHomeZoneSince: null,
      };

      const profile = this.getRivalAggressionProfile(index);
      rival.aggressionLabel = profile.label;
      const rushBonus = this.dayTwist === DAY_TWIST_RUSH_HOUR ? RUSH_HOUR_RIVAL_SPEED_BONUS : 0;
      rival.moveSpeed = Math.round(RIVAL_SPEED * profile.speedScale * (this.getRivalSpeedScaleForDay(this.shiftNumber) + rushBonus));
      rival.retargetScale = profile.retargetScale;
      rival.playerInfluenceMin = profile.playerInfluenceMin;
      rival.bumpImpulseScale = profile.bumpImpulseScale;

      if (index === 0 && rival.lane === "left") {
        const verticalSpan = this.arenaBounds.maxY - this.arenaBounds.minY;
        rival.homeZone = {
          minY: this.arenaBounds.minY,
          maxY: this.arenaBounds.minY + verticalSpan * 0.58,
        };
      }

      this.assignNextRivalRouteTarget(rival, true);

      return rival;
    });
  }

  isRivalSpawnOpen(x, y) {
    const staticColliders = [
      ...(this.tableColliders ?? []),
      ...(this.seatColliders ?? []),
      ...(this.boundaryColliders ?? []),
      ...(this.rivalPatrolNoGoColliders ?? []),
    ];
    if (this.kitchenDoorCollider) {
      staticColliders.push(this.kitchenDoorCollider);
    }
    if (this.rivalPassNoGoCollider) {
      staticColliders.push(this.rivalPassNoGoCollider);
    }
    return !this.isBlockedByColliders(x, y, staticColliders, RIVAL_RADIUS);
  }

  pickFarthestRivalSpawn(candidates, usedSpawns) {
    if (!candidates?.length) {
      return null;
    }
    if (!usedSpawns?.length) {
      return candidates[0];
    }

    let bestCandidate = candidates[0];
    let bestScore = -Infinity;
    candidates.forEach((candidate) => {
      const nearestDistance = usedSpawns.reduce((best, used) => {
        const distance = Phaser.Math.Distance.Between(candidate.x, candidate.y, used.x, used.y);
        return Math.min(best, distance);
      }, Number.POSITIVE_INFINITY);

      if (nearestDistance > bestScore) {
        bestScore = nearestDistance;
        bestCandidate = candidate;
      }
    });

    return bestCandidate;
  }

  drawPacmanMaze() {
    const { minX, maxX, maxY } = this.arenaBounds;
    const minY = 0;
    const arenaWidth = maxX - minX;
    const arenaHeight = maxY - minY;
    const centerX = minX + arenaWidth / 2;
    const centerY = minY + arenaHeight / 2;

    // --- Wainscoting / wall backdrop ---
    this.add.rectangle(centerX, centerY, arenaWidth + 32, arenaHeight + 32, 0x3A0E12, 1);

    // --- Checkered marble floor (terra cotta / cream, SNES-style 40px tiles) ---
    const tileSize = 40;
    const graphics = this.add.graphics();
    const cols = Math.ceil(arenaWidth / tileSize) + 1;
    const rows = Math.ceil(arenaHeight / tileSize) + 1;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tileX = minX + col * tileSize;
        const tileY = minY + row * tileSize;
        const isLight = (row + col) % 2 === 0;
        graphics.fillStyle(isLight ? 0xF0E6CC : 0xC05030, 1);
        graphics.fillRect(tileX, tileY, tileSize, tileSize);
      }
    }

    // Clip floor to arena bounds using a covering mask rect on edges
    graphics.fillStyle(0x3A0E12, 1);
    // Left overhang clip
    graphics.fillRect(minX - tileSize, minY, tileSize, arenaHeight);
    // Right overhang clip
    graphics.fillRect(maxX, minY, tileSize, arenaHeight);
    // Top overhang clip
    graphics.fillRect(minX - tileSize, minY - tileSize, arenaWidth + tileSize * 2, tileSize);
    // Bottom overhang clip
    graphics.fillRect(minX - tileSize, maxY, arenaWidth + tileSize * 2, tileSize);

    // --- Grout lines overlay (subtle gold) ---
    const grout = this.add.graphics();
    grout.lineStyle(1, 0xC8A030, 0.35);
    for (let col = 0; col <= cols; col++) {
      const x = minX + col * tileSize;
      grout.beginPath();
      grout.moveTo(x, minY);
      grout.lineTo(x, maxY);
      grout.strokePath();
    }
    for (let row = 0; row <= rows; row++) {
      const y = minY + row * tileSize;
      grout.beginPath();
      grout.moveTo(minX, y);
      grout.lineTo(maxX, y);
      grout.strokePath();
    }

    // --- Decorative wainscoting border ---
    const border = this.add.graphics();
    // Outer dark border
    border.lineStyle(6, 0x200608, 1);
    border.strokeRect(minX, minY, arenaWidth, arenaHeight);
    // Inner gold trim
    border.lineStyle(2, 0xC8A030, 1);
    border.strokeRect(minX + 4, minY + 4, arenaWidth - 8, arenaHeight - 8);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Day twist helpers
  // ─────────────────────────────────────────────────────────────────────────

  getDayTwistForDay(dayNumber) {
    const twists = [
      null,              // Day 1 — no twist (tutorial day)
      null,              // Day 2
      DAY_TWIST_RUSH_HOUR,  // Day 3 — rivals faster
      null,              // Day 4
      DAY_TWIST_BLUE_PLATE, // Day 5 — score multiplier
      null,              // Day 6
      DAY_TWIST_PEAK_SERVICE, // Day 7 — reduced timer start
      DAY_TWIST_RUSH_HOUR,  // Day 8
      DAY_TWIST_BLUE_PLATE, // Day 9
      DAY_TWIST_PEAK_SERVICE, // Day 10
    ];
    const index = Math.max(0, (dayNumber ?? 1) - 1);
    return twists[index % twists.length] ?? null;
  }

  getDayTwistLabel(twist) {
    if (twist === DAY_TWIST_RUSH_HOUR) {
      return "RUSH HOUR";
    }
    if (twist === DAY_TWIST_BLUE_PLATE) {
      return "BLUE PLATE SPECIAL";
    }
    if (twist === DAY_TWIST_PEAK_SERVICE) {
      return "PEAK SERVICE";
    }
    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Combo chain helpers
  // ─────────────────────────────────────────────────────────────────────────

  getComboMultiplier() {
    if (this.comboCount >= COMBO_TIER_2_THRESHOLD) {
      return COMBO_TIER_2_MULTIPLIER;
    }
    if (this.comboCount >= COMBO_TIER_1_THRESHOLD) {
      return COMBO_TIER_1_MULTIPLIER;
    }
    return 1;
  }

  getDeliveryScoreMultiplier() {
    let mult = this.getComboMultiplier();
    if (this.dayTwist === DAY_TWIST_BLUE_PLATE) {
      mult *= BLUE_PLATE_SCORE_MULTIPLIER;
    }
    return mult;
  }

  showComboFlash(multiplier) {
    if (!this.comboFlashText) {
      return;
    }
    if (this.comboCount < COMBO_TIER_1_THRESHOLD) {
      this.comboFlashText.setAlpha?.(0);
      return;
    }
    const label = this.comboCount >= COMBO_TIER_2_THRESHOLD
      ? `×${multiplier.toFixed(1)} COMBO x${this.comboCount}!`
      : `×${multiplier.toFixed(1)} COMBO`;
    this.comboFlashText.setText?.(label);
    this.comboFlashText.setAlpha?.(1);

    if (this.hideComboFlashEvent?.remove) {
      this.hideComboFlashEvent.remove(false);
      this.hideComboFlashEvent = null;
    }
    if (this.time?.delayedCall) {
      this.hideComboFlashEvent = this.time.delayedCall(900, () => {
        this.comboFlashText?.setAlpha?.(0);
        this.hideComboFlashEvent = null;
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Pause overlay
  // ─────────────────────────────────────────────────────────────────────────

  togglePause() {
    if (this.roundEnded) {
      return;
    }
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  pauseGame() {
    this.isPaused = true;
    AudioManager.resume();
    this.showPauseOverlay();
  }

  resumeGame() {
    this.isPaused = false;
    this.hidePauseOverlay();
  }

  showPauseOverlay() {
    if (this.pauseOverlay) {
      return;
    }
    const width = this.scale?.width ?? 1280;
    const height = this.scale?.height ?? 720;

    const bg = this.add?.rectangle(width / 2, height / 2, width, height, 0x0a0f1a, 0.78);
    bg?.setDepth?.(PAUSE_OVERLAY_DEPTH);

    const card = this.add?.rectangle(width / 2, height / 2, 480, 300, 0x142238, 1);
    card?.setStrokeStyle?.(4, 0xf6c453);
    card?.setDepth?.(PAUSE_OVERLAY_DEPTH + 1);

    const titleText = this.add?.text(width / 2, height / 2 - 80, "PAUSED", {
      fontFamily: "Courier New, monospace",
      fontSize: "52px",
      color: "#f6c453",
      stroke: "#21070b",
      strokeThickness: 7,
    });
    titleText?.setOrigin?.(0.5);
    titleText?.setDepth?.(PAUSE_OVERLAY_DEPTH + 2);

    const hintsText = this.add?.text(width / 2, height / 2 + 10,
      "P / ESC  —  Resume\nR  —  Restart Shift\nM  —  Main Menu", {
      fontFamily: "Courier New, monospace",
      fontSize: "18px",
      color: "#b9c6dd",
      stroke: "#0d1728",
      strokeThickness: 2,
      align: "center",
      lineSpacing: 8,
    });
    hintsText?.setOrigin?.(0.5);
    hintsText?.setDepth?.(PAUSE_OVERLAY_DEPTH + 2);

    this.pauseOverlay = { bg, card, titleText, hintsText };

    this.pauseResumeKey = this.pauseResumeKey
      ?? this.input?.keyboard?.addKey?.(Phaser.Input.Keyboard.KeyCodes.ESC)
      ?? null;
    this.pauseRestartKey = this.pauseRestartKey
      ?? this.input?.keyboard?.addKey?.(Phaser.Input.Keyboard.KeyCodes.R)
      ?? null;
    this.pauseMainMenuKey = this.pauseMainMenuKey
      ?? this.input?.keyboard?.addKey?.(Phaser.Input.Keyboard.KeyCodes.M)
      ?? null;

    // R/M are handled by deterministic JustDown polling while paused.
  }

  hidePauseOverlay() {
    if (!this.pauseOverlay) {
      return;
    }
    const { bg, card, titleText, hintsText } = this.pauseOverlay;
    bg?.destroy?.();
    card?.destroy?.();
    titleText?.destroy?.();
    hintsText?.destroy?.();
    this.pauseOverlay = null;
  }

  handlePauseHotkeys() {
    if (this.pauseResumeKey && Phaser.Input.Keyboard.JustDown(this.pauseResumeKey)) {
      this.resumeGame();
      return;
    }

    if (this.pauseRestartKey && Phaser.Input.Keyboard.JustDown(this.pauseRestartKey)) {
      this.hidePauseOverlay();
      this.scene.restart({
        shiftLevel: this.shiftLevel,
        shiftScore: this.shiftScore,
        shiftDelivered: this.shiftDelivered,
        shiftNumber: this.shiftNumber,
      });
      return;
    }

    if (this.pauseMainMenuKey && Phaser.Input.Keyboard.JustDown(this.pauseMainMenuKey)) {
      this.hidePauseOverlay();
      this.scene.start(MENU_SCENE_KEY);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Additional table layouts (4 and 5)
  // ─────────────────────────────────────────────────────────────────────────

  getLayout4TablePositions() {
    // Zigzag pattern — alternating left/right column heights force diagonal routes.
    return [
      { label: "A", x: this.mazeColumns[0], y: this.mazeRows[0] },
      { label: "B", x: this.mazeColumns[2], y: this.mazeRows[2] },
      { label: "C", x: this.mazeColumns[4], y: this.mazeRows[0] },
      { label: "D", x: this.mazeColumns[6], y: this.mazeRows[2] },
      { label: "E", x: this.mazeColumns[1], y: this.mazeRows[3] },
      { label: "F", x: this.mazeColumns[3], y: this.mazeRows[1] },
      { label: "G", x: this.mazeColumns[5], y: this.mazeRows[3] },
      { label: "H", x: this.mazeColumns[2], y: this.mazeRows[4] },
      { label: "I", x: this.mazeColumns[4], y: this.mazeRows[4] },
    ];
  }

  getLayout5TablePositions() {
    // Ring layout — tables form a loose outer ring with open center.
    return [
      { label: "A", x: this.mazeColumns[0], y: this.mazeRows[1] },
      { label: "B", x: this.mazeColumns[3], y: this.mazeRows[0] },
      { label: "C", x: this.mazeColumns[6], y: this.mazeRows[1] },
      { label: "D", x: this.mazeColumns[0], y: this.mazeRows[3] },
      { label: "E", x: this.mazeColumns[6], y: this.mazeRows[3] },
      { label: "F", x: this.mazeColumns[1], y: this.mazeRows[4] },
      { label: "G", x: this.mazeColumns[3], y: this.mazeRows[4] },
      { label: "H", x: this.mazeColumns[5], y: this.mazeRows[4] },
      { label: "I", x: this.mazeColumns[3], y: this.mazeRows[2] },
    ];
  }
}
