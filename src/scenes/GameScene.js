import Phaser from "phaser";
import { COLORS, SPACING } from "../ui/tokens";
import { GAME_SCENE_KEY, MENU_SCENE_KEY } from "./sceneKeys";

const ROUND_DURATION_SECONDS = 30;
const PLAYER_SPEED = 240;
const INTERACTION_RADIUS = 34;
const MIN_INTERACTION_RADIUS = 24;
const NEXT_QUEUE_LENGTH = 8;
const LEVEL_TABLE_QUEUE_COUNT = 4;
const ACTIVE_TARGET_WINDOW = 1;
const PLAYER_ASSET_KEY = "waiter-player";
const RIVAL_COUNT = 2;
const RIVAL_SPEED = 165;
const RIVAL_RADIUS = 14;
const RIVAL_TIME_PENALTY_SECONDS = 2;
const RIVAL_HIT_COOLDOWN_MS = 1200;
const RIVAL_STUN_DURATION_MS = 750;
const RIVAL_MIN_TURN_INTERVAL_MS = 280;
const RIVAL_MAX_TURN_INTERVAL_MS = 760;
const RIVAL_STUCK_RECOVERY_THRESHOLD = 8;
const RIVAL_EARLY_CHASE_WINDOW_MS = 5000;
const RIVAL_EARLY_CHASE_BIAS = 0.92;
const RIVAL_DEFAULT_CHASE_BIAS = 0.72;
const RIVAL_INITIAL_CHASE_DELAY_MS = 80;
const PLAYER_SPAWN_SAFETY_WINDOW_MS = 1000;
const PLAYER_SPAWN_SAFE_CHOICES = 4;
const BOUNDARY_WALL_THICKNESS = 16;
const TABLE_VARIANTS = [
  { width: 108, height: 34, orientation: "horizontal" },
  { width: 34, height: 108, orientation: "vertical" },
  { width: 96, height: 32, orientation: "horizontal" },
  { width: 32, height: 96, orientation: "vertical" },
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
    this.nextTargets = [];
    this.carryingOrder = false;
    this.orderStage = "needPickup";
    this.rivals = [];
    this.queueTableLabels = [];
    this.lastRivalPenaltyAt = -Infinity;
    this.roundStartedAt = 0;
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

    this.tableZones = this.createTableZones();
    this.tableColliders = this.tableZones.map((zone) => zone.collider);
    this.seatZones = this.createSeatZones();
    this.seatColliders = this.seatZones.map((seat) => ({ type: "circle", x: seat.x, y: seat.y, radius: 13 }));
    this.boundaryColliders = this.createBoundaryColliders();
    this.initializeQueueTables();
    this.roundStartedAt = this.time?.now ?? Date.now();
    this.rivals = this.createRivals();

    this.drawPickupCounter();

    const spawnPoint = this.getPlayerSpawnPoint();
    this.player = this.createPlayerVisual(spawnPoint.x, spawnPoint.y);

    this.nextPanelHeader = this.add
      .text(width - 62, this.arenaBounds.minY + 10, "NEXT", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "22px",
        color: "#f1f5ff",
      })
      .setOrigin(0.5, 0);

    this.nextPanelText = this.add
      .text(width - 62, this.arenaBounds.minY + 44, "", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "21px",
        color: "#f1f5ff",
        align: "center",
        lineSpacing: 10,
      })
      .setOrigin(0.5, 0);

    this.nextTargets = this.createInitialSeatQueue(NEXT_QUEUE_LENGTH);
    this.refreshQueuePanel();
    this.updateSeatActivationFromQueue();

    this.feedbackText = this.add
      .text(width / 2, height - 72, "COLLECT ORDER AT PASS", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "18px",
        color: "#f6c453",
      })
      .setOrigin(0.5);

    this.add
      .text(
        SPACING.md,
        height - SPACING.md,
        "Pac maze service: randomized seat queue across all tables",
        {
          fontFamily: "Verdana, sans-serif",
          fontSize: "15px",
          color: "#b9c6dd",
        }
      )
      .setOrigin(0, 1);

    this.cursors = this.input.keyboard?.createCursorKeys();
    this.wasd = this.input.keyboard?.addKeys("W,A,S,D");
    this.pointerDown = false;

    this.input.on?.("pointerdown", () => {
      this.pointerDown = true;
    });

    this.input.on?.("pointerup", () => {
      this.pointerDown = false;
    });

    this.input.keyboard?.on("keydown-ESC", () => {
      this.scene.start(MENU_SCENE_KEY);
    });

    this.scale.on("resize", () => {
      this.scene.restart();
    });
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
    if (this.roundEnded) {
      return;
    }

    this.updateRivals(dt);
    this.handleRivalCollisionPenalty();
    if (this.roundEnded) {
      return;
    }

    this.handleInteractions();
  }

  updateTimer(dt) {
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

    const pointerDir = this.getPointerDirection();
    const keyDir = this.getKeyboardDirection();
    const activeDirection = this.pointerDown ? pointerDir : keyDir;
    const directionX = activeDirection.x;
    const directionY = activeDirection.y;

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
    const isBlocked = (x, y) => colliders.some((collider) => {
      if (collider?.type === "rect" || (collider?.halfWidth && collider?.halfHeight)) {
        return (
          Math.abs(x - collider.x) < collider.halfWidth + bodyRadius &&
          Math.abs(y - collider.y) < collider.halfHeight + bodyRadius
        );
      }

      const distance = Phaser.Math.Distance.Between(x, y, collider.x, collider.y);
      return distance < (collider.radius ?? 0) + bodyRadius;
    });

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

    if (isBlocked(nextX, nextY)) {
      return { x: previousX, y: previousY };
    }

    return { x: nextX, y: nextY };
  }

  handleInteractions() {
    if (!this.player) {
      return;
    }

    if (this.orderStage === "needPickup" && this.isAdjacent(this.passInteractionZone, this.getCurrentInteractionRadius())) {
      this.carryingOrder = true;
      this.orderStage = "needSeat";
      this.statusText?.setText("STATUS: DELIVERY");
      this.setFeedback(`DELIVER ${this.getCurrentTargetSeatLabel()}`);
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
      if (rival.stunnedUntil && now < rival.stunnedUntil) {
        rival.blockedFrames = 0;
        return;
      }

      this.maybeTurnRival(rival);
      let nextX = rival.x + rival.vx * dt;
      let nextY = rival.y + rival.vy * dt;

      if (nextX <= this.arenaBounds.minX + rival.radius || nextX >= this.arenaBounds.maxX - rival.radius) {
        this.pickNextRivalDirection(rival, true);
        nextX = rival.x + rival.vx * dt;
        nextY = rival.y + rival.vy * dt;
      }

      if (nextY <= this.arenaBounds.minY + rival.radius || nextY >= this.arenaBounds.maxY - rival.radius) {
        this.pickNextRivalDirection(rival, true);
        nextX = rival.x + rival.vx * dt;
        nextY = rival.y + rival.vy * dt;
      }

      let resolvedPosition = this.resolveTableCollision(nextX, nextY, rival.x, rival.y, rival.radius);
      let blocked = resolvedPosition.x === rival.x && resolvedPosition.y === rival.y;
      if (blocked) {
        this.pickNextRivalDirection(rival, true);
        const retryX = rival.x + rival.vx * dt;
        const retryY = rival.y + rival.vy * dt;
        resolvedPosition = this.resolveTableCollision(retryX, retryY, rival.x, rival.y, rival.radius);
        blocked = resolvedPosition.x === rival.x && resolvedPosition.y === rival.y;
      }

      if (blocked) {
        rival.blockedFrames += 1;
        if (rival.blockedFrames >= RIVAL_STUCK_RECOVERY_THRESHOLD) {
          this.repositionRival(rival);
          rival.blockedFrames = 0;
        }
        return;
      }

      rival.blockedFrames = 0;

      rival.x = resolvedPosition.x;
      rival.y = resolvedPosition.y;
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

  maybeTurnRival(rival) {
    const now = this.time?.now ?? Date.now();
    if (now >= rival.nextTurnAt) {
      this.pickNextRivalDirection(rival, false);
    }
  }

  pickNextRivalDirection(rival, avoidCurrent) {
    const directions = this.shuffleDirections([
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ]);

    const currentDir = this.getDirectionFromVelocity(rival.vx, rival.vy);
    const now = this.time?.now ?? Date.now();
    const candidates = [];

    for (const direction of directions) {
      if (avoidCurrent && direction.x === currentDir.x && direction.y === currentDir.y) {
        continue;
      }

      const probeDistance = rival.radius + 8;
      const probeX = rival.x + direction.x * probeDistance;
      const probeY = rival.y + direction.y * probeDistance;
      const resolvedProbe = this.resolveTableCollision(probeX, probeY, rival.x, rival.y, rival.radius);
      const blocked = resolvedProbe.x === rival.x && resolvedProbe.y === rival.y;
      if (blocked) {
        continue;
      }

      candidates.push(direction);
    }

    if (candidates.length === 0) {
      // If all probes are blocked, schedule an early retry.
      rival.nextTurnAt = now + 120;
      return false;
    }

    const available = candidates.length > 1 && rival.lastDirection
      ? candidates.filter(
          (direction) => direction.x !== rival.lastDirection.x || direction.y !== rival.lastDirection.y
        )
      : candidates;

    let chosenDirection = available[Math.floor(Math.random() * available.length)];
    if (this.player && Math.random() < this.getRivalChaseBias()) {
      chosenDirection = candidates.reduce((best, direction) => {
        const bestX = rival.x + best.x * rival.radius;
        const bestY = rival.y + best.y * rival.radius;
        const bestDistance = Phaser.Math.Distance.Between(bestX, bestY, this.player.x, this.player.y);

        const candidateX = rival.x + direction.x * rival.radius;
        const candidateY = rival.y + direction.y * rival.radius;
        const candidateDistance = Phaser.Math.Distance.Between(candidateX, candidateY, this.player.x, this.player.y);

        return candidateDistance < bestDistance ? direction : best;
      }, candidates[0]);
    }

    rival.vx = chosenDirection.x * RIVAL_SPEED;
    rival.vy = chosenDirection.y * RIVAL_SPEED;
    rival.lastDirection = { x: chosenDirection.x, y: chosenDirection.y };
    rival.nextTurnAt = now + this.randomTurnDelay();
    return true;
  }

  getRivalChaseBias() {
    const now = this.time?.now ?? Date.now();
    if (now - this.roundStartedAt < RIVAL_EARLY_CHASE_WINDOW_MS) {
      return RIVAL_EARLY_CHASE_BIAS;
    }
    return RIVAL_DEFAULT_CHASE_BIAS;
  }

  getDirectionFromVelocity(vx, vy) {
    if (Math.abs(vx) >= Math.abs(vy)) {
      return { x: Math.sign(vx), y: 0 };
    }
    return { x: 0, y: Math.sign(vy) };
  }

  randomTurnDelay() {
    return Math.floor(RIVAL_MIN_TURN_INTERVAL_MS + Math.random() * (RIVAL_MAX_TURN_INTERVAL_MS - RIVAL_MIN_TURN_INTERVAL_MS));
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
      this.pickNextRivalDirection(rival, false);
      return;
    }
  }

  handleRivalCollisionPenalty() {
    if (!this.player || !this.rivals?.length) {
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

  getPointerDirection() {
    const pointer = this.input.activePointer;
    if (!this.pointerDown || !pointer) {
      return { x: 0, y: 0 };
    }

    const dx = pointer.worldX - this.player.x;
    const dy = pointer.worldY - this.player.y;
    const len = Math.hypot(dx, dy);

    if (len < 10) {
      return { x: 0, y: 0 };
    }

    return { x: dx / len, y: dy / len };
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

  refreshQueuePanel() {
    const lines = this.nextTargets.map((label, index) => {
      const marker = index < ACTIVE_TARGET_WINDOW ? ">" : " ";
      return `${marker} ${label}`;
    });

    this.nextPanelText?.setText(lines.join("\n"));
  }

  updateSeatActivationFromQueue() {
    const activeSeat = this.getCurrentTargetSeatLabel();

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

    this.refreshQueuePanel();
    this.updateSeatActivationFromQueue();
  }

  setFeedback(message) {
    this.feedbackText?.setText(message);
  }

  endRound(reason) {
    if (this.roundEnded) {
      return;
    }

    const summary = this.buildRoundSummary(reason);
    this.roundEnded = true;
    this.statusText?.setText(`STATUS: ${summary.status}`);
    this.setFeedback(summary.banner);

    this.time.delayedCall(550, () => {
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

  createTableZones() {
    const tablePositions = [
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

    return tablePositions.map((zone, index) => {
      const variant = TABLE_VARIANTS[index % TABLE_VARIANTS.length];
      const colliderBounds = this.getTableColliderBounds(variant);
      const visual = this.createTableVisual(zone.x, zone.y, variant);
      const labelText = this.add
        .text(zone.x, zone.y, zone.label, {
          fontFamily: "Georgia, serif",
          fontSize: "30px",
          color: "#17223a",
        })
        .setOrigin(0.5);

      return {
        ...zone,
        variant,
        collider: {
          type: "rect",
          x: zone.x,
          y: zone.y,
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
      { x: this.mazeColumns[5], y: this.mazeRows[3] },
    ];
  }

  createSeatZones() {
    return this.tableZones.flatMap((table) => {
      const variant = table.variant ?? TABLE_VARIANTS[0];
      const seatGap = 20;
      const sideGapX = Math.ceil(variant.width / 2) + 18;
      const sideGapY = Math.ceil(variant.height / 2) + 18;
      const offsets =
        variant.orientation === "vertical"
          ? [
              { number: 1, dx: -sideGapX, dy: -seatGap },
              { number: 2, dx: -sideGapX, dy: seatGap },
              { number: 3, dx: sideGapX, dy: -seatGap },
              { number: 4, dx: sideGapX, dy: seatGap },
            ]
          : [
              { number: 1, dx: -seatGap, dy: -sideGapY },
              { number: 2, dx: seatGap, dy: -sideGapY },
              { number: 3, dx: -seatGap, dy: sideGapY },
              { number: 4, dx: seatGap, dy: sideGapY },
            ];

      return offsets.map((offset) => {
        const x = table.x + offset.dx;
        const y = table.y + offset.dy;
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
      });
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
    this.add.circle(this.passInteractionZone.x, this.passInteractionZone.y, 8, 0xf6c453, 0.55).setStrokeStyle(2, 0xffefb5);
  }

  createRivals() {
    const spawnPoints = [
      { x: this.mazeColumns[1], y: this.mazeRows[2], vx: RIVAL_SPEED, vy: 0 },
      { x: this.mazeColumns[5], y: this.mazeRows[3], vx: -RIVAL_SPEED, vy: 0 },
    ];

    return Array.from({ length: RIVAL_COUNT }, (_, index) => {
      const seed = spawnPoints[index % spawnPoints.length];
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
        lastDirection: null,
        stunnedUntil: 0,
      };

      this.pickNextRivalDirection(rival, false);

      return rival;
    });
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
