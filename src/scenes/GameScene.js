import Phaser from "phaser";
import { COLORS, SPACING } from "../ui/tokens";
import { GAME_SCENE_KEY, MENU_SCENE_KEY } from "./sceneKeys";

const ROUND_DURATION_SECONDS = 30;
const PLAYER_SPEED = 240;
const INTERACTION_RADIUS = 34;
const MIN_INTERACTION_RADIUS = 24;
const NEXT_QUEUE_LENGTH = 8;
const LEVEL_TABLE_QUEUE_COUNT = 4;
const PLAYER_ASSET_KEY = "waiter-player";
const RIVAL_COUNT = 4;
const RIVAL_SPEED = 165;
const RIVAL_RADIUS = 14;
const RIVAL_TIME_PENALTY_SECONDS = 1.5;
const RIVAL_HIT_COOLDOWN_MS = 1400;
const RIVAL_STUN_DURATION_MS = 900;
const RIVAL_STUCK_RECOVERY_THRESHOLD = 8;
const RIVAL_HARD_RESET_THRESHOLD = 20;
const RIVAL_STALL_MOVEMENT_EPSILON = 0.15;
const RIVAL_STALL_WINDOW_MS = 900;
const RIVAL_STALL_MAX_RECOVERIES = 2;
const RIVAL_INITIAL_CHASE_DELAY_MS = 80;
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
  { label: "relentless", speedScale: 1.1, retargetScale: 0.82, playerInfluenceMin: 0.08, bumpImpulseScale: 1.12 },
];
const PLAYER_SPAWN_SAFETY_WINDOW_MS = 1000;
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

export class GameScene extends Phaser.Scene {
  constructor() {
    super(GAME_SCENE_KEY);
    this.resetRunState();
  }

  init() {
    this.resetRunState();
  }

  resetRunState() {
    this.remainingTime = ROUND_DURATION_SECONDS;
    this.deliveredPlates = 0;
    this.score = 0;
    this.roundEnded = false;
    this.chefContainer = null;
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
    this.lastRivalPenaltyAt = -Infinity;
    this.roundStartedAt = 0;
    this.lastKnownScaleSize = null;
    this.playerLastPosition = null;
    this.playerMotionVector = { x: 0, y: 0 };
    this.playerMotionStrength = 0;
    this.returnToMenuEvent = null;
    this.onEscKeyDown = null;
  }

  create() {
    const { width, height } = this.scale;
    const hudTop = SPACING.lg;
    const hudHeight = 70;
    const arenaTop = hudTop + hudHeight + 20;
    const arenaHeight = height - arenaTop - 60;

    this.cameras.main.setBackgroundColor(COLORS.background);

    this.add.rectangle(width / 2, hudTop, width - SPACING.lg, hudHeight, COLORS.panel).setOrigin(0.5, 0);

    this.scoreText = this.add.text(SPACING.md, SPACING.lg, "SCORE: 0", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "24px",
      color: "#f1f5ff",
    });

    this.timerText = this.add
      .text(width / 2, SPACING.lg, `TIMER: ${this.formatTime(ROUND_DURATION_SECONDS)}`, {
        fontFamily: "Verdana, sans-serif",
        fontSize: "24px",
        color: "#f1f5ff",
      })
      .setOrigin(0.5, 0);

    this.statusText = this.add
      .text(width - SPACING.md, SPACING.lg, "STATUS: PICKUP", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "24px",
        color: "#f1f5ff",
      })
      .setOrigin(1, 0);

    this.arenaBounds = {
      minX: SPACING.lg,
      maxX: width - 130,
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

    this.nextTargets = this.createInitialSeatQueue(NEXT_QUEUE_LENGTH);
    this.scheduleNextTargetAnnouncement();

    this.feedbackText = this.add
      .text(width / 2, height - 72, "WAIT FOR CHEF CALLOUT", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "18px",
        color: "#f6c453",
      })
      .setOrigin(0.5);

    this.add
      .text(
        SPACING.md,
        height - SPACING.md,
        "Pac maze service: follow chef callouts and the highlighted seat",
        {
          fontFamily: "Verdana, sans-serif",
          fontSize: "15px",
          color: "#b9c6dd",
        }
      )
      .setOrigin(0, 1);

    this.cursors = this.input?.keyboard?.createCursorKeys();
    this.wasd = this.input?.keyboard?.addKeys("W,A,S,D");

    this.onEscKeyDown = this.onEscKeyDown ?? this.handleEscToMenu.bind(this);
    this.input?.keyboard?.off?.("keydown-ESC", this.onEscKeyDown, this);
    this.input?.keyboard?.on?.("keydown-ESC", this.onEscKeyDown, this);

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
    this.scale?.off?.("resize", this.handleScaleResize, this);
    this.input?.keyboard?.off?.("keydown-ESC", this.onEscKeyDown, this);

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

    if (this.tweens?.killTweensOf) {
      this.tweens.killTweensOf(this.chefContainer);
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

    this.scene.restart();
  }

  update(_, delta) {
    if (this.roundEnded) {
      return;
    }

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
  }

  updateTimer(dt) {
    if (!this.orderTimerRunning) {
      this.timerText?.setText(`TIMER: ${this.formatTime(this.remainingTime)}`);
      return;
    }

    this.remainingTime = Math.max(0, this.remainingTime - dt);
    this.timerText?.setText(`TIMER: ${this.formatTime(this.remainingTime)}`);

    if (this.remainingTime <= 0) {
      this.endRound("TIME_UP");
      return;
    }

    if (this.remainingTime <= 15) {
      this.setFeedback("FINAL RUSH");
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

    const collidedRival = this.rivals.find((rival) => {
      const distance = Phaser.Math.Distance.Between(nextX, nextY, rival.x, rival.y);
      return distance < bodyRadius + rival.radius;
    });

    if (collidedRival) {
      const now = this.time?.now ?? Date.now();
      if (!collidedRival.stunnedUntil || now >= collidedRival.stunnedUntil) {
        collidedRival.stunnedUntil = now + RIVAL_STUN_DURATION_MS;
      }
    }

    return { x: nextX, y: nextY };
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
      this.statusText?.setText("STATUS: DELIVERY");
      this.setFeedback(`DELIVER ${this.getCurrentTargetSeatLabel()}`);
      this.setPassPickupAvailability(false);
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
      const earnedScore = Math.ceil(this.remainingTime);
      this.score += earnedScore;
      this.scoreText?.setText(`SCORE: ${this.score}`);
      this.statusText?.setText(`STATUS: SERVING (${this.deliveredPlates})`);
      this.setFeedback(`SERVED ${targetSeat.label} (+${earnedScore})`);
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

      if (!rival.routeTarget || this.isRivalAtRouteTarget(rival, rival.routeTarget)) {
        this.assignNextRivalRouteTarget(rival, false);
      }

      const currentRivalSpeed = rival.moveSpeed ?? RIVAL_SPEED;
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

    const resolvedWaypoint = this.selectRivalTravelTarget(rival, nextWaypoint) ?? nextWaypoint;
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
    const sorted = candidates
      .map((candidate) => {
        const distance = Phaser.Math.Distance.Between(rival.x, rival.y, candidate.x, candidate.y);
        const verticalDelta = (candidate.y - rival.y) * verticalIntent;
        return {
          candidate,
          score: distance + verticalDelta * 0.8 + Math.random() * 12,
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

    const playerRadius = 14;
    const hitRival = this.rivals.some((rival) => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, rival.x, rival.y);
      return distance < rival.radius + playerRadius;
    });

    if (!hitRival) {
      return;
    }

    this.lastRivalPenaltyAt = now;
    this.remainingTime = Math.max(0, this.remainingTime - RIVAL_TIME_PENALTY_SECONDS);
    this.timerText?.setText(`TIMER: ${this.formatTime(this.remainingTime)}`);
    this.setFeedback(`RIVAL BUMP -${RIVAL_TIME_PENALTY_SECONDS}s`);

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
    const seatPool = this.getSeatLabelPool();
    const queue = [];

    while (queue.length < length) {
      const shuffled = this.shuffleLabels(seatPool);
      for (const seatLabel of shuffled) {
        queue.push(seatLabel);
        if (queue.length >= length) {
          break;
        }
      }
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

  updateSeatActivationFromQueue() {
    const activeSeat = this.announcedTargetSeatLabel;

    this.seatZones.forEach((seat) => {
      seat.isActive = seat.label === activeSeat;
      seat.visual?.setAlpha?.(seat.isActive ? 1 : 0.35);
      seat.labelText?.setColor?.(seat.isActive ? "#fff8d6" : "#6a7897");
    });

    this.tableZones.forEach((zone) => {
      const hasActiveSeat = this.seatZones.some((seat) => seat.tableLabel === zone.label && seat.isActive);
      zone.isActive = hasActiveSeat;
      zone.visual?.setAlpha?.(hasActiveSeat ? 1 : 0.65);
      zone.labelText?.setColor?.(hasActiveSeat ? "#101522" : "#7f8da9");
    });
  }

  advanceTargetQueue(completedSeatLabel) {
    const activeSeat = this.getCurrentTargetSeatLabel();
    if (!activeSeat || (completedSeatLabel && completedSeatLabel !== activeSeat)) {
      return;
    }

    this.nextTargets.shift();
    const seatPool = this.getSeatLabelPool();
    this.nextTargets.push(seatPool[Math.floor(Math.random() * seatPool.length)]);

    this.remainingTime = ROUND_DURATION_SECONDS;
    this.timerText?.setText(`TIMER: ${this.formatTime(this.remainingTime)}`);
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

    const chefBody = this.add.rectangle(0, 16, 54, 54, 0xf8f3e7, 1).setStrokeStyle(2, 0x2f3d55);
    const chefApron = this.add.rectangle(0, 24, 30, 34, 0xe7f0ff, 1).setStrokeStyle(1, 0x5c759d);
    const chefHat = this.add.ellipse(0, -8, 60, 24, 0xffffff, 1).setStrokeStyle(2, 0x2f3d55);
    const chefFace = this.add.circle(0, 4, 16, 0xffd3ad, 1).setStrokeStyle(2, 0x2f3d55);
    const chefMouth = this.add.rectangle(0, 11, 10, 2, 0x2f3d55, 1);

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
      bubbleShadow,
      bubbleBg,
      bubblePointer,
      this.chefSpeechText,
      chefBody,
      chefApron,
      chefHat,
      chefFace,
      chefMouth,
    ]);
    this.chefContainer.setDepth?.(8);
    this.chefContainer.setVisible(false);
  }

  announceCurrentTargetSeat() {
    const seatLabel = this.getCurrentTargetSeatLabel();
    if (!seatLabel || !this.chefContainer || !this.chefSpeechText) {
      return;
    }

    this.announcedTargetSeatLabel = seatLabel;
    this.orderAnnouncementActive = true;
    this.orderTimerRunning = false;
    this.setPassPickupAvailability(true);
    this.updateSeatActivationFromQueue();
    this.setFeedback("COLLECT ORDER AT PASS");

    const tableLabel = seatLabel.slice(0, 1);
    const seatNumber = seatLabel.slice(1);
    this.chefSpeechText.setText(`NEXT UP\nTABLE ${tableLabel} / SEAT ${seatNumber}`);

    this.chefContainer.setVisible(true);
    this.chefContainer.y = this.chefHiddenY;

    if (this.tweens?.killTweensOf) {
      this.tweens.killTweensOf(this.chefContainer);
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
          return;
        }

        this.chefContainer.setVisible(false);
      });
    }
  }

  setFeedback(message) {
    this.feedbackText?.setText(message);
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

    const summary = this.buildRoundSummary(reason);
    this.roundEnded = true;
    this.statusText?.setText(`STATUS: ${summary.status}`);
    this.setFeedback(summary.banner);

    if (this.returnToMenuEvent?.remove) {
      this.returnToMenuEvent.remove(false);
      this.returnToMenuEvent = null;
    }

    this.returnToMenuEvent = this.time.delayedCall(550, () => {
      this.returnToMenuEvent = null;
      this.scene.start(MENU_SCENE_KEY, {
        score: this.score,
        delivered: this.deliveredPlates,
        reason: summary.code,
        reasonLabel: summary.label,
      });
    });
  }

  buildRoundSummary(reasonCode) {
    if (reasonCode === "TIME_UP") {
      return {
        code: reasonCode,
        label: "Game over (time up)",
        status: "GAME OVER",
        banner: "GAME OVER",
      };
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
      return this.add.image(x, y, PLAYER_ASSET_KEY).setDisplaySize(40, 40);
    }

    const player = this.add.circle(x, y, 20, COLORS.accent, 1);
    player.setStrokeStyle?.(3, COLORS.text);
    return player;
  }

  getTableColliderBounds(variant) {
    return {
      halfWidth: Math.ceil(variant.width / 2),
      halfHeight: Math.ceil(variant.height / 2),
    };
  }

  createTableVisual(x, y, variant) {
    const table = this.add.rectangle(x, y, variant.width, variant.height, 0x7bbf7b, 1);
    table.setStrokeStyle?.(3, 0xd7f4d7);
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
      // Bottom-left density boost while preserving open lanes near PASS.
      { label: "J", x: this.mazeColumns[0], y: this.mazeRows[3] + (this.mazeRows[4] - this.mazeRows[3]) * 0.55 },
    ];
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

  isSpawnPositionOpen(point) {
    const resolved = this.resolveTableCollision(point.x, point.y, point.x, point.y, 14);
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
    const openCandidates = this.getPlayerSpawnCandidates().filter((candidate) => this.isSpawnPositionOpen(candidate));

    if (openCandidates.length === 0) {
      const backupCandidates = this.getOpenSpawnPointsFromMazeIntersections();
      if (backupCandidates.length > 0) {
        const shuffledBackup = this.shuffleDirections(backupCandidates);
        return shuffledBackup[0];
      }

      return { x: this.mazeColumns[1], y: this.mazeRows[1] };
    }

    const now = this.time?.now ?? Date.now();
    if (now - this.roundStartedAt < PLAYER_SPAWN_SAFETY_WINDOW_MS) {
      const rivalStarts = this.getRivalSpawnPoints();
      const ranked = [...openCandidates]
        .map((candidate) => {
          const nearestRivalDistance = rivalStarts.reduce((best, rival) => {
            const distance = Phaser.Math.Distance.Between(candidate.x, candidate.y, rival.x, rival.y);
            return Math.min(best, distance);
          }, Number.POSITIVE_INFINITY);

          return { candidate, nearestRivalDistance };
        })
        .sort((a, b) => b.nearestRivalDistance - a.nearestRivalDistance);

      const preferred = ranked.slice(0, Math.min(PLAYER_SPAWN_SAFE_CHOICES, ranked.length)).map((entry) => entry.candidate);
      return preferred[Math.floor(Math.random() * preferred.length)];
    }

    const shuffled = this.shuffleDirections(openCandidates);
    return shuffled[0];
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
          const visual = this.add.circle(x, y, 13, 0x334f7c, 1);
          visual.setStrokeStyle?.(2, 0x93add4);
          const labelText = this.add
            .text(x, y, String(offset.number), {
              fontFamily: "Verdana, sans-serif",
              fontSize: "11px",
              color: "#d6e2f6",
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
    // Back wall kitchen door centered on the arena's top edge.
    this.add
      .rectangle(this.pickupZone.x, this.arenaBounds.minY + 6, 220, 14, 0x2b4269, 1)
      .setStrokeStyle(2, 0x7ea1d4);
    this.add.rectangle(this.pickupZone.x, this.pickupZone.y, 94, 44, 0x2a3e63, 1).setStrokeStyle(2, 0xb9cbea);
    this.add.rectangle(this.pickupZone.x, this.pickupZone.y + 22, 122, 10, 0x334f7c, 1).setStrokeStyle(2, 0x9cb7df);
    this.add
      .text(this.pickupZone.x, this.pickupZone.y, "PASS", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "15px",
        color: "#f1f5ff",
      })
      .setOrigin(0.5);
    this.passInteractionVisual = this.add
      .circle(this.passInteractionZone.x, this.passInteractionZone.y, 8, 0xf6c453, 0.55)
      .setStrokeStyle(2, 0xffefb5);
    this.setPassPickupAvailability(this.passReadyForPickup);
  }

  setPassPickupAvailability(isReady) {
    this.passReadyForPickup = isReady;

    if (!this.passInteractionVisual) {
      return;
    }

    const fillColor = isReady ? 0xf6c453 : 0x60779d;
    const strokeColor = isReady ? 0xffefb5 : 0x9eb0c7;
    const fillAlpha = isReady ? 0.55 : 0.25;
    this.passInteractionVisual.setFillStyle?.(fillColor, fillAlpha);
    this.passInteractionVisual.setStrokeStyle?.(2, strokeColor);
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
      const visual = this.add.circle(seed.x, seed.y, RIVAL_RADIUS, 0xa83a3a, 1);
      visual.setStrokeStyle?.(2, 0xffcdcd);
      const labelVisual = this.add
        .text(seed.x, seed.y, "R", {
          fontFamily: "Verdana, sans-serif",
          fontSize: "12px",
          color: "#fff3f3",
        })
        .setOrigin(0.5)
        .setDepth?.(2);

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
        patrolTableLabel: null,
        patrolWaypoints: [],
        patrolWaypointIndex: 0,
        patrolClockwise: true,
        lastFramePosition: { x: seed.x, y: seed.y },
        stallElapsedMs: 0,
        stallRecoveryCount: 0,
        outOfHomeZoneSince: null,
      };

      const profile = this.getRivalAggressionProfile(index);
      rival.aggressionLabel = profile.label;
      rival.moveSpeed = Math.round(RIVAL_SPEED * profile.speedScale);
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
    const arenaWidth = this.arenaBounds.maxX - this.arenaBounds.minX;
    const arenaHeight = this.arenaBounds.maxY - this.arenaBounds.minY;
    const centerX = this.arenaBounds.minX + arenaWidth / 2;
    const centerY = this.arenaBounds.minY + arenaHeight / 2;

    this.add.rectangle(centerX, centerY, arenaWidth, arenaHeight, 0x1c2f4f, 0.35).setStrokeStyle(3, 0x6f8eb8);

    this.mazeRows.forEach((y) => {
      this.mazeColumns.forEach((x) => {
        this.add.circle(x, y, 4, 0xc9d9f2, 0.8);
      });
    });
  }
}
