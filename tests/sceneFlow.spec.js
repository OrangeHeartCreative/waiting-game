import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  BOOT_SCENE_KEY,
  PRELOAD_SCENE_KEY,
  MENU_SCENE_KEY,
  GAME_SCENE_KEY,
} from "../src/scenes/sceneKeys";
import { BASE_WIDTH, BASE_HEIGHT } from "../src/game/constants";
import { ASSET_MANIFEST } from "../src/assets/manifest";

vi.mock("phaser", () => ({
  default: {
    Scene: class {},
    Math: {
      Clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
      Between: (min, max) => min + Math.floor((max - min) / 2),
      Distance: {
        Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
      },
    },
  },
}));

let BootScene;
let PreloadScene;
let MenuScene;
let GameScene;

beforeAll(async () => {
  ({ BootScene } = await import("../src/scenes/BootScene"));
  ({ PreloadScene } = await import("../src/scenes/PreloadScene"));
  ({ MenuScene } = await import("../src/scenes/MenuScene"));
  ({ GameScene } = await import("../src/scenes/GameScene"));
});

function makeTextObject() {
  return {
    setOrigin() {
      return this;
    },
    setText() {
      return this;
    },
    setColor() {
      return this;
    },
    setAlpha() {
      return this;
    },
    setScale() {
      return this;
    },
  };
}

function makeRectObject() {
  return {
    setStrokeStyle() {
      return this;
    },
    setOrigin() {
      return this;
    },
    setVisible() {
      return this;
    },
    setPosition() {
      return this;
    },
    setAlpha() {
      return this;
    },
  };
}

function makeCircleObject() {
  return {
    setStrokeStyle() {
      return this;
    },
    setAlpha() {
      return this;
    },
  };
}

function makeImageObject() {
  return {
    setDisplaySize() {
      return this;
    },
    setAlpha() {
      return this;
    },
  };
}

function makeContainerObject() {
  return {
    y: 0,
    setDepth() {
      return this;
    },
    setVisible() {
      return this;
    },
  };
}

describe("foundation configuration", () => {
  it("keeps scene keys unique", () => {
    const keys = [BOOT_SCENE_KEY, PRELOAD_SCENE_KEY, MENU_SCENE_KEY, GAME_SCENE_KEY];
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses a valid base resolution", () => {
    expect(BASE_WIDTH).toBeGreaterThan(0);
    expect(BASE_HEIGHT).toBeGreaterThan(0);
  });

  it("exposes an asset manifest array", () => {
    expect(Array.isArray(ASSET_MANIFEST)).toBe(true);
  });
});

describe("scene flow smoke", () => {
  it("starts preload from boot", () => {
    const scene = new BootScene();
    let startedKey = null;

    scene.scene = {
      start: (key) => {
        startedKey = key;
      },
    };

    scene.create();
    expect(startedKey).toBe(PRELOAD_SCENE_KEY);
  });

  it("starts menu from preload", () => {
    const scene = new PreloadScene();
    let startedKey = null;

    scene.scene = {
      start: (key) => {
        startedKey = key;
      },
    };

    scene.create();
    expect(startedKey).toBe(MENU_SCENE_KEY);
  });

  it("registers keyboard transition from menu to game", () => {
    const scene = new MenuScene();
    let startedKey = null;
    const keyboardListeners = {};

    scene.scale = { width: 1280, height: 720, on: () => {} };
    scene.cameras = { main: { setBackgroundColor: () => {} } };
    scene.scene = {
      start: (key) => {
        startedKey = key;
      },
      restart: () => {},
    };

    scene.input = {
      keyboard: {
        on: (event, cb) => {
          keyboardListeners[event] = cb;
        },
      },
    };

    const textObject = makeTextObject();
    const rectObject = makeRectObject();
    scene.add = {
      text: () => textObject,
      rectangle: () => rectObject,
    };

    scene.create();
    keyboardListeners["keydown-ENTER"]();
    expect(startedKey).toBe(GAME_SCENE_KEY);
  });

  it("renders updated menu copy", () => {
    const scene = new MenuScene();
    const renderedText = [];

    scene.scale = { width: 1280, height: 720, on: () => {} };
    scene.cameras = { main: { setBackgroundColor: () => {} } };
    scene.scene = { start: () => {}, restart: () => {} };

    scene.add = {
      text: (_, __, value) => {
        renderedText.push(value);
        return makeTextObject();
      },
      rectangle: () => makeRectObject(),
    };

    scene.create();
    expect(renderedText).toContain("START SHIFT");
    expect(renderedText).toContain("Run the maze, collect at PASS, and serve seat orders");
  });

  it("registers ESC transition from game to menu", () => {
    const scene = new GameScene();
    let startedKey = null;
    const keyboardListeners = {};

    scene.scale = { width: 1280, height: 720, on: () => {} };
    scene.cameras = { main: { setBackgroundColor: () => {} } };
    scene.scene = {
      start: (key) => {
        startedKey = key;
      },
      restart: () => {},
    };

    scene.add = {
      text: () => makeTextObject(),
      rectangle: () => makeRectObject(),
      circle: () => makeCircleObject(),
      ellipse: () => makeRectObject(),
      triangle: () => makeRectObject(),
      container: () => makeContainerObject(),
      image: () => makeImageObject(),
    };

    scene.input = {
      keyboard: {
        on: (event, cb) => {
          keyboardListeners[event] = cb;
        },
        createCursorKeys: () => ({}),
        addKeys: () => ({}),
      },
    };

    scene.create();
    keyboardListeners["keydown-ESC"]();
    expect(startedKey).toBe(MENU_SCENE_KEY);
  });

  it("updates timer and score deterministically", () => {
    const scene = new GameScene();
    const scoreUpdates = [];
    const timerUpdates = [];

    scene.remainingTime = 30;
    scene.orderTimerRunning = true;
    scene.score = 0;
    scene.scoreText = { setText: (value) => scoreUpdates.push(value) };
    scene.timerText = { setText: (value) => timerUpdates.push(value) };

    scene.updateTimer(1.25);

    expect(scene.score).toBe(0);
    expect(scoreUpdates.length).toBe(0);
    expect(timerUpdates.at(-1)).toBe("TIMER: 00:29");
  });

  it("scales interaction radius and move speed over time", () => {
    const scene = new GameScene();

    scene.remainingTime = 30;
    expect(scene.getCurrentInteractionRadius()).toBe(34);
    expect(scene.getCurrentMoveSpeed()).toBe(240);

    scene.remainingTime = 0;
    expect(scene.getCurrentInteractionRadius()).toBe(24);
    expect(scene.getCurrentMoveSpeed()).toBe(280);
  });

  it("advances pingpong rival waypoint at lane edge", () => {
    const scene = new GameScene();
    const rival = {
      behaviorMode: "pingpong",
      behaviorWaypoints: [
        { x: 100, y: 100 },
        { x: 200, y: 100 },
      ],
      behaviorIndex: 0,
      behaviorDirection: 1,
    };

    scene.getDeterministicBehaviorStep = () => -1;

    const nextWaypoint = scene.getNextBehaviorWaypoint(rival, true);
    expect(nextWaypoint).toEqual({ x: 200, y: 100 });
    expect(rival.behaviorIndex).toBe(1);
  });

  it("defines distinct aggression profiles for rivals", () => {
    const scene = new GameScene();

    const profiles = [
      scene.getRivalAggressionProfile(0),
      scene.getRivalAggressionProfile(1),
      scene.getRivalAggressionProfile(2),
      scene.getRivalAggressionProfile(3),
    ];

    const labels = profiles.map((profile) => profile.label);
    const speedScales = profiles.map((profile) => profile.speedScale);

    expect(new Set(labels).size).toBe(4);
    expect(Math.min(...speedScales)).toBeLessThan(Math.max(...speedScales));
  });

  it("pulls top-left rival back toward upper zone after lingering low", () => {
    const scene = new GameScene();
    const rival = {
      x: 120,
      y: 360,
      lane: "left",
      homeZone: { minY: 100, maxY: 240 },
      outOfHomeZoneSince: 0,
      behaviorWaypoints: [
        { x: 120, y: 380 },
        { x: 140, y: 180 },
        { x: 160, y: 220 },
      ],
      routeTarget: { x: 120, y: 380 },
    };

    scene.enforceRivalHomeZone(rival, 1400);

    expect(rival.routeTarget).toEqual({ x: 140, y: 180 });
  });

  it("keeps rivals moving during long deterministic simulation", () => {
    const scene = new GameScene();
    const rival = {
      x: 100,
      y: 120,
      vx: 0,
      vy: 0,
      radius: 14,
      stunnedUntil: 0,
      blockedFrames: 0,
      behaviorMode: "pingpong",
      behaviorPattern: "center",
      lane: "center",
      behaviorWaypoints: [
        { x: 100, y: 120 },
        { x: 220, y: 120 },
      ],
      behaviorIndex: 0,
      behaviorDirection: 1,
      routeTarget: null,
      routeHistory: [],
      nextTurnAt: 0,
      patrolClockwise: true,
      patrolWaypoints: [],
      patrolWaypointIndex: 0,
      lastTableContactAt: -Infinity,
    };

    scene.arenaBounds = { minX: 0, maxX: 300, minY: 0, maxY: 300 };
    scene.rivals = [rival];
    scene.playerMotionStrength = 1;
    scene.playerMotionVector = { x: -1, y: 0 };
    scene.time = { now: 0 };
    scene.resolveRivalPatrolCollision = (nextX, nextY) => ({ x: nextX, y: nextY });

    let movedFrames = 0;
    let previousX = rival.x;
    let previousY = rival.y;

    for (let frame = 0; frame < 3600; frame += 1) {
      scene.time.now = frame * 16;
      scene.updateRivals(1 / 60);
      const moved = Math.hypot(rival.x - previousX, rival.y - previousY);
      if (moved > 0.01) {
        movedFrames += 1;
      }
      previousX = rival.x;
      previousY = rival.y;
    }

    expect(movedFrames).toBeGreaterThan(3000);
    expect(rival.x).toBeGreaterThan(100);
    expect(rival.x).toBeLessThan(220);
  });

  it("can choose an alternate waypoint for less predictable routing", () => {
    const scene = new GameScene();
    const randomSpy = vi.spyOn(Math, "random").mockImplementation(() => 0);
    const rival = {
      x: 100,
      y: 120,
      verticalPatrolDirection: 1,
      routeEntropy: 0.9,
      routeVariance: 0.9,
      routeHistory: [],
      behaviorWaypoints: [
        { x: 110, y: 140 },
        { x: 180, y: 300 },
        { x: 220, y: 360 },
        { x: 140, y: 260 },
      ],
    };

    const preferred = { x: 110, y: 140 };
    const picked = scene.selectRivalVariationWaypoint(rival, preferred);

    expect(picked).not.toEqual(preferred);
    randomSpy.mockRestore();
  });

  it("blocks rivals from spawning in pass pickup no-go zone", () => {
    const scene = new GameScene();

    scene.tableColliders = [];
    scene.seatColliders = [];
    scene.boundaryColliders = [];
    scene.rivalPatrolNoGoColliders = [];
    scene.kitchenDoorCollider = null;
    scene.rivalPassNoGoCollider = { type: "circle", x: 200, y: 200, radius: 52 };

    const blocked = scene.isRivalSpawnOpen(200, 200);
    const open = scene.isRivalSpawnOpen(300, 200);

    expect(blocked).toBe(false);
    expect(open).toBe(true);
  });

  it("chooses fallback travel target when waypoint collapses to current point", () => {
    const scene = new GameScene();
    const rival = {
      x: 100,
      y: 120,
      behaviorMode: "pingpong",
      behaviorPattern: "center",
      lane: "center",
      behaviorWaypoints: [{ x: 100, y: 120 }],
      behaviorIndex: 0,
      behaviorDirection: 1,
      routeTarget: null,
      routeHistory: [],
    };

    scene.time = { now: 1000 };
    scene.getRivalLaneDetourNodes = () => [
      { x: 100, y: 120 },
      { x: 220, y: 120 },
    ];
    scene.getRivalRouteNodes = () => [{ x: 220, y: 120 }];

    scene.assignNextRivalRouteTarget(rival, true);

    expect(rival.routeTarget).toEqual({ x: 220, y: 120 });
  });

  it("escapes repeated zero-distance retarget loops", () => {
    const scene = new GameScene();
    const rival = {
      x: 100,
      y: 120,
      vx: 0,
      vy: 0,
      radius: 14,
      stunnedUntil: 0,
      blockedFrames: 0,
      routeTarget: { x: 100, y: 120 },
      routeHistory: [],
      behaviorWaypoints: [{ x: 100, y: 120 }],
      behaviorIndex: 0,
      behaviorDirection: 1,
      behaviorMode: "pingpong",
      behaviorPattern: "center",
      lane: "center",
      patrolClockwise: true,
      patrolWaypoints: [],
      patrolWaypointIndex: 0,
      lastTableContactAt: -Infinity,
    };

    scene.arenaBounds = { minX: 0, maxX: 400, minY: 0, maxY: 300 };
    scene.rivals = [rival];
    scene.time = { now: 1000 };
    scene.resolveRivalPatrolCollision = (nextX, nextY) => ({ x: nextX, y: nextY });
    scene.assignNextRivalRouteTarget = () => {
      rival.routeTarget = { x: rival.x, y: rival.y };
    };
    scene.getRivalDynamicFallbackWaypoint = () => ({ x: 220, y: 120 });

    scene.updateRivals(1 / 60);

    expect(rival.x).toBeGreaterThan(100);
    expect(rival.routeTarget).toEqual({ x: 220, y: 120 });
  });

  it("hard-resets rival after prolonged micro-movement stall", () => {
    const scene = new GameScene();
    const rival = {
      x: 100,
      y: 120,
      vx: 0,
      vy: 0,
      radius: 14,
      stunnedUntil: 0,
      blockedFrames: 0,
      routeTarget: { x: 320, y: 120 },
      routeHistory: [],
      behaviorWaypoints: [{ x: 320, y: 120 }],
      behaviorIndex: 0,
      behaviorDirection: 1,
      behaviorMode: "pingpong",
      behaviorPattern: "center",
      lane: "center",
      patrolClockwise: true,
      patrolWaypoints: [],
      patrolWaypointIndex: 0,
      lastTableContactAt: -Infinity,
      lastFramePosition: { x: 100, y: 120 },
      lastProgressAt: 0,
      stallRecoveryCount: 0,
    };

    let hardResetCalls = 0;
    scene.arenaBounds = { minX: 0, maxX: 500, minY: 0, maxY: 300 };
    scene.rivals = [rival];
    scene.resolveRivalPatrolCollision = () => ({ x: rival.x + 0.02, y: rival.y });
    scene.assignNextRivalRouteTarget = () => {};
    scene.recoverStuckRival = () => {};
    scene.repositionRival = () => {
      hardResetCalls += 1;
      rival.x = 260;
      rival.y = 120;
    };

    for (let frame = 0; frame < 220; frame += 1) {
      scene.time = { now: frame * 16 };
      scene.updateRivals(1 / 60);
      if (hardResetCalls > 0) {
        break;
      }
    }

    expect(hardResetCalls).toBeGreaterThan(0);
    expect(rival.x).toBe(260);
  });

  it("sends time-up payload to menu scene", () => {
    const scene = new GameScene();
    let delayedMs = 0;
    let startCall = null;

    scene.score = 42;
    scene.deliveredPlates = 7;
    scene.statusText = { setText: () => {} };
    scene.feedbackText = { setText: () => {} };
    scene.time = {
      delayedCall: (ms, callback) => {
        delayedMs = ms;
        callback();
      },
    };
    scene.scene = {
      start: (key, data) => {
        startCall = { key, data };
      },
    };

    scene.endRound("TIME_UP");

    expect(delayedMs).toBe(550);
    expect(startCall).toEqual({
      key: MENU_SCENE_KEY,
      data: {
        score: 42,
        delivered: 7,
        reason: "TIME_UP",
        reasonLabel: "Game over (time up)",
      },
    });
  });

  it("resets run state in init", () => {
    const scene = new GameScene();

    scene.remainingTime = 12;
    scene.deliveredPlates = 9;
    scene.score = 4;
    scene.carryingOrder = true;
    scene.orderStage = "needSeat";
    scene.roundEnded = true;
    scene.nextTargets = ["E", "F"];

    scene.init();

    expect(scene.remainingTime).toBe(30);
    expect(scene.deliveredPlates).toBe(0);
    expect(scene.score).toBe(0);
    expect(scene.carryingOrder).toBe(false);
    expect(scene.orderStage).toBe("needPickup");
    expect(scene.roundEnded).toBe(false);
    expect(scene.nextTargets).toEqual([]);
  });

  it("maps time-up outcomes to tier labels", () => {
    const scene = new GameScene();

    expect(scene.buildRoundSummary("TIME_UP").label).toBe("Game over (time up)");
  });

  it("applies a fair cooldowned penalty when player bumps a rival", () => {
    const scene = new GameScene();
    let endedReason = null;
    const timerUpdates = [];

    scene.player = { x: 100, y: 100 };
    scene.rivals = [{ x: 110, y: 100, radius: 12 }];
    scene.remainingTime = 30;
    scene.orderTimerRunning = true;
    scene.timerText = { setText: (value) => timerUpdates.push(value) };
    scene.time = { now: 1000 };
    scene.endRound = (reason) => {
      endedReason = reason;
    };

    scene.handleRivalCollisionPenalty();
    expect(scene.remainingTime).toBe(28.5);
    expect(timerUpdates.at(-1)).toBe("TIMER: 00:29");
    expect(endedReason).toBeNull();

    scene.time.now = 1200;
    scene.handleRivalCollisionPenalty();
    expect(scene.remainingTime).toBe(28.5);
  });

  it("builds table patrol routes for rivals", () => {
    const scene = new GameScene();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);

    scene.arenaBounds = { minX: 0, maxX: 500, minY: 0, maxY: 500 };
    scene.resolveTableCollision = (nextX, nextY) => ({ x: nextX, y: nextY });
    scene.shuffleDirections = (values) => values;
    scene.tableZones = [
      {
        label: "A",
        x: 200,
        y: 200,
        collider: { halfWidth: 40, halfHeight: 24 },
      },
    ];

    const rival = {
      x: 120,
      y: 200,
      patrolTableLabel: null,
      patrolWaypoints: [],
      patrolWaypointIndex: 0,
      patrolClockwise: true,
    };

    const assigned = scene.assignRivalPatrolRoute(rival, true);
    expect(assigned).toBe(true);
    expect(rival.patrolTableLabel).toBe("A");
    expect(rival.patrolWaypoints.length).toBeGreaterThanOrEqual(6);
    expect(rival.patrolWaypoints.some((point) => point.y < 200)).toBe(true);
    expect(rival.patrolWaypoints.some((point) => point.y > 200)).toBe(true);

    randomSpy.mockRestore();
  });

  it("includes a bottom-left table in current layout", () => {
    const scene = new GameScene();
    scene.mazeColumns = [100, 200, 300, 400, 500, 600, 700];
    scene.mazeRows = [100, 180, 260, 340, 420];

    const tablePositions = scene.getCurrentLayoutTablePositions();
    const bottomLeftTable = tablePositions.find((table) => table.label === "J");

    expect(bottomLeftTable).toBeDefined();
    expect(bottomLeftTable?.x).toBe(100);
    expect(bottomLeftTable?.y).toBe(384);
  });

  it("uses a unique size variant for each table", () => {
    const scene = new GameScene();
    scene.mazeColumns = [100, 200, 300, 400, 500, 600, 700];
    scene.mazeRows = [100, 180, 260, 340, 420];
    scene.arenaBounds = { minX: 24, maxX: 760, minY: 100, maxY: 520 };
    scene.add = {
      rectangle: () => ({ setStrokeStyle: () => ({}) }),
      text: () => ({ setOrigin: () => ({}) }),
    };

    const zones = scene.createTableZones();
    const signatures = zones.map((zone) => `${zone.variant.width}x${zone.variant.height}`);

    expect(zones.length).toBe(10);
    expect(new Set(signatures).size).toBe(10);
  });

  it("keeps the bottom-left table off arena walls", () => {
    const scene = new GameScene();
    scene.mazeColumns = [100, 200, 300, 400, 500, 600, 700];
    scene.mazeRows = [100, 180, 260, 340, 420];
    scene.arenaBounds = { minX: 24, maxX: 760, minY: 100, maxY: 520 };
    scene.add = {
      rectangle: () => ({ setStrokeStyle: () => ({}) }),
      text: () => ({ setOrigin: () => ({}) }),
    };

    const zones = scene.createTableZones();
    const bottomLeft = zones.find((zone) => zone.label === "J");

    expect(bottomLeft).toBeDefined();
    const bottomEdge = (bottomLeft?.y ?? 0) + (bottomLeft?.collider?.halfHeight ?? 0);
    expect(bottomEdge).toBeLessThanOrEqual(498);
  });

  it("builds vertical-sweep behavior waypoints for center lane rivals", () => {
    const scene = new GameScene();

    scene.arenaBounds = { minX: 0, maxX: 600, minY: 100, maxY: 500 };
    scene.isRivalSpawnOpen = () => true;

    const rival = {
      lane: "center",
      behaviorPattern: "center",
    };

    const points = scene.buildRivalBehaviorWaypoints(rival);
    const yValues = points.map((point) => point.y);

    expect(points.length).toBeGreaterThanOrEqual(5);
    expect(Math.min(...yValues)).toBeLessThanOrEqual(180);
    expect(Math.max(...yValues)).toBeGreaterThanOrEqual(420);
  });

  it("separates overlapping rivals so they bump each other", () => {
    const scene = new GameScene();
    const rivalA = {
      x: 200,
      y: 200,
      radius: 14,
      vx: 0,
      vy: 0,
      visual: { x: 200, y: 200 },
      labelVisual: { x: 200, y: 200 },
    };
    const rivalB = {
      x: 210,
      y: 200,
      radius: 14,
      vx: 0,
      vy: 0,
      visual: { x: 210, y: 200 },
      labelVisual: { x: 210, y: 200 },
    };

    scene.arenaBounds = { minX: 0, maxX: 500, minY: 0, maxY: 300 };
    scene.rivals = [rivalA, rivalB];
    scene.assignNextRivalRouteTarget = () => {};

    scene.resolveRivalToRivalBumps();

    const distance = Math.hypot(rivalB.x - rivalA.x, rivalB.y - rivalA.y);
    expect(distance).toBeGreaterThanOrEqual(28);
    expect(Math.abs(rivalA.vx)).toBeGreaterThan(0);
    expect(Math.abs(rivalB.vx)).toBeGreaterThan(0);
  });

  it("picks an open random player spawn point", () => {
    const scene = new GameScene();

    scene.mazeColumns = [0, 100, 200, 300, 400, 500, 600];
    scene.mazeRows = [0, 80, 160, 240, 320];
    scene.shuffleDirections = (values) => values;
    scene.resolveTableCollision = (nextX, nextY) => {
      if (nextX === 100 && nextY === 80) {
        return { x: 0, y: 0 };
      }
      return { x: nextX, y: nextY };
    };

    const spawn = scene.getPlayerSpawnPoint();
    expect(spawn).toEqual({ x: 300, y: 80 });
  });

  it("falls back to an open maze spawn when preferred points are blocked", () => {
    const scene = new GameScene();

    scene.mazeColumns = [0, 100, 200, 300, 400, 500, 600];
    scene.mazeRows = [0, 80, 160, 240, 320];
    scene.shuffleDirections = (values) => values;
    scene.resolveTableCollision = (nextX, nextY, previousX, previousY) => {
      const isPreferredSpawn = nextY === 80 && (nextX === 100 || nextX === 300 || nextX === 500);
      if (isPreferredSpawn) {
        return { x: previousX - 1, y: previousY - 1 };
      }
      return { x: nextX, y: nextY };
    };

    const spawn = scene.getPlayerSpawnPoint();
    expect(spawn).not.toEqual({ x: 100, y: 80 });
    expect(spawn).not.toEqual({ x: 300, y: 80 });
    expect(spawn).not.toEqual({ x: 500, y: 80 });
    expect(scene.isSpawnPositionOpen(spawn)).toBe(true);
  });

  it("biases early spawn choices away from rival starts", () => {
    const scene = new GameScene();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

    scene.roundStartedAt = 1000;
    scene.time = { now: 1100 };
    scene.getPlayerSpawnCandidates = () => [
      { x: 0, y: 0 },
      { x: 200, y: 0 },
      { x: 400, y: 0 },
    ];
    scene.getRivalSpawnPoints = () => [{ x: 0, y: 0 }, { x: 50, y: 0 }];
    scene.resolveTableCollision = (nextX, nextY) => ({ x: nextX, y: nextY });

    const spawn = scene.getPlayerSpawnPoint();
    expect(spawn).toEqual({ x: 400, y: 0 });

    randomSpy.mockRestore();
  });

  it("recovers blocked rival via patrol reroute before hard reset", () => {
    const scene = new GameScene();
    let rerouteCalls = 0;
    let hardResetCalls = 0;

    scene.arenaBounds = { minX: 0, maxX: 300, minY: 0, maxY: 300 };
    scene.tableZones = [
      {
        label: "A",
        x: 120,
        y: 100,
        collider: { halfWidth: 30, halfHeight: 18 },
      },
    ];
    scene.rivals = [
      {
        x: 100,
        y: 100,
        vx: 100,
        vy: 0,
        radius: 14,
        nextTurnAt: Number.POSITIVE_INFINITY,
        blockedFrames: 7,
        visual: { x: 100, y: 100 },
        labelVisual: { x: 100, y: 100 },
        patrolTableLabel: "A",
        patrolWaypoints: [{ x: 120, y: 100 }],
        patrolWaypointIndex: 0,
        patrolClockwise: true,
      },
    ];

    scene.resolveTableCollision = () => ({ x: 100, y: 100 });
    scene.assignRivalPatrolRoute = () => {
      rerouteCalls += 1;
      return true;
    };
    scene.repositionRival = () => {
      hardResetCalls += 1;
    };

    scene.updateRivals(0.016);
    expect(rerouteCalls).toBeGreaterThanOrEqual(1);
    expect(hardResetCalls).toBe(0);
  });

  it("activates only the current target seat", () => {
    const scene = new GameScene();

    scene.nextTargets = ["B2", "B1"];
    scene.announcedTargetSeatLabel = "B2";
    scene.seatZones = ["A1", "A2", "B1", "B2", "C1"].map((label) => ({
      label,
      tableLabel: label.slice(0, 1),
      isActive: false,
      visual: { setAlpha: () => {} },
      labelText: { setColor: () => {} },
    }));
    scene.tableZones = ["A", "B", "C"].map((label) => ({
      label,
      isActive: false,
      visual: { setAlpha: () => {} },
      labelText: { setColor: () => {} },
    }));

    scene.updateSeatActivationFromQueue();

    expect(scene.seatZones.find((seat) => seat.label === "B2")?.isActive).toBe(true);
    expect(scene.seatZones.find((seat) => seat.label === "B1")?.isActive).toBe(false);
    expect(scene.seatZones.find((seat) => seat.label === "A1")?.isActive).toBe(false);
    expect(scene.seatZones.find((seat) => seat.label === "C1")?.isActive).toBe(false);
  });

  it("advances seat queue across all tables", () => {
    const scene = new GameScene();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    let delayedMs = 0;
    let delayedCallback = null;
    scene.announceCurrentTargetSeat = vi.fn();

    scene.nextTargets = ["A1", "A2"];
    scene.deliveredPlates = 0;
    scene.seatZones = ["A1", "A2", "B1", "B2", "C1", "D1"].map((label) => ({
      label,
      tableLabel: label.slice(0, 1),
      isActive: false,
      visual: { setAlpha: () => {} },
      labelText: { setColor: () => {} },
    }));
    scene.tableZones = ["A"].map((label) => ({
      label,
      isActive: false,
      visual: { setAlpha: () => {} },
      labelText: { setColor: () => {} },
    }));
    scene.nextPanelText = { setText: () => {} };
    scene.scoreText = { setText: () => {} };
    scene.timerText = { setText: () => {} };
    scene.time = {
      delayedCall: (ms, callback) => {
        delayedMs = ms;
        delayedCallback = callback;
        return { remove: () => {} };
      },
    };
    scene.remainingTime = 42;
    scene.score = 42;

    scene.advanceTargetQueue("A1");

    expect(scene.nextTargets).toEqual(["A2", "A1"]);
    expect(scene.score).toBe(42);
    expect(scene.remainingTime).toBe(30);
    expect(scene.seatZones.find((seat) => seat.label === "A2")?.isActive).toBe(false);
    expect(scene.seatZones.find((seat) => seat.label === "A1")?.isActive).toBe(false);
    expect(delayedMs).toBe(3000);
    expect(scene.announceCurrentTargetSeat).toHaveBeenCalledTimes(0);

    delayedCallback();
    expect(scene.announceCurrentTargetSeat).toHaveBeenCalledTimes(1);

    randomSpy.mockRestore();
  });

  it("limits queue targets to selected queue tables", () => {
    const scene = new GameScene();

    scene.queueTableLabels = ["A", "C", "E", "G"];
    scene.seatZones = ["A1", "B1", "C1", "D1", "E1", "F1", "G1", "H1"].map((label) => ({
      label,
      tableLabel: label.slice(0, 1),
    }));

    const pool = scene.getSeatLabelPool();

    expect(pool).toEqual(["A1", "C1", "E1", "G1"]);
  });

  it("omits seats that hug boundary walls", () => {
    const scene = new GameScene();

    scene.arenaBounds = { minX: 24, maxX: 600, minY: 100, maxY: 500 };
    scene.tableZones = [
      {
        label: "A",
        x: 90,
        y: 260,
        variant: { width: 108, height: 34, orientation: "horizontal" },
      },
      {
        label: "B",
        x: 510,
        y: 260,
        variant: { width: 108, height: 34, orientation: "horizontal" },
      },
    ];
    scene.add = {
      circle: () => ({ setStrokeStyle: () => {} }),
      text: () => ({ setOrigin: () => ({}) }),
    };

    const seats = scene.createSeatZones();
    const labels = seats.map((seat) => seat.label);

    expect(labels).not.toContain("A5");
    expect(labels).toContain("A6");
    expect(labels).not.toContain("B6");
    expect(labels).toContain("B5");
  });

  it("blocks movement when crossing into table and seat colliders", () => {
    const scene = new GameScene();
    scene.tableColliders = [{ x: 120, y: 120, radius: 36 }];
    scene.seatColliders = [{ x: 180, y: 120, radius: 16 }];

    const blockedByTable = scene.resolveTableCollision(130, 120, 90, 120);
    const blockedBySeat = scene.resolveTableCollision(184, 120, 140, 120);
    const open = scene.resolveTableCollision(240, 120, 140, 120);

    expect(blockedByTable).toEqual({ x: 90, y: 120 });
    expect(blockedBySeat).toEqual({ x: 140, y: 120 });
    expect(open).toEqual({ x: 240, y: 120 });
  });

  it("slides across one axis when seat collisions block diagonal movement", () => {
    const scene = new GameScene();
    scene.tableColliders = [];
    scene.seatColliders = [{ type: "circle", x: 120, y: 120, radius: 16 }];

    const resolved = scene.resolveTableCollision(120, 120, 90, 90);

    expect(resolved).toEqual({ x: 120, y: 90 });
  });

  it("treats kitchen door as a movement blocker", () => {
    const scene = new GameScene();
    scene.tableColliders = [];
    scene.seatColliders = [];
    scene.kitchenDoorCollider = { type: "rect", x: 100, y: 100, halfWidth: 30, halfHeight: 16 };

    const blocked = scene.resolveTableCollision(100, 100, 100, 150);
    expect(blocked).toEqual({ x: 100, y: 150 });
  });

  it("treats boundary walls as movement blockers", () => {
    const scene = new GameScene();
    scene.tableColliders = [];
    scene.seatColliders = [];
    scene.boundaryColliders = [{ type: "rect", x: 100, y: 40, halfWidth: 80, halfHeight: 8 }];

    const blocked = scene.resolveTableCollision(100, 40, 100, 70);
    const open = scene.resolveTableCollision(100, 120, 100, 70);

    expect(blocked).toEqual({ x: 100, y: 70 });
    expect(open).toEqual({ x: 100, y: 120 });
  });

  it("stuns rival bodies on contact instead of blocking player", () => {
    const scene = new GameScene();
    scene.time = { now: 1000 };
    scene.rivals = [{ x: 100, y: 100, radius: 14, stunnedUntil: 0 }];

    const passedThrough = scene.resolveRivalCollision(100, 100, 100, 150);
    const open = scene.resolveRivalCollision(160, 100, 100, 150);

    expect(passedThrough).toEqual({ x: 100, y: 100 });
    expect(open).toEqual({ x: 160, y: 100 });
    expect(scene.rivals[0].stunnedUntil).toBeGreaterThan(1000);
  });

  it("blocks pickup before chef announcement", () => {
    const scene = new GameScene();

    scene.orderStage = "needPickup";
    scene.carryingOrder = false;
    scene.passReadyForPickup = false;
    scene.player = { x: 100, y: 124 };
    scene.passInteractionZone = { x: 100, y: 120 };
    scene.getCurrentInteractionRadius = () => 10;
    scene.getCurrentTargetSeatLabel = () => "A1";
    scene.statusText = { setText: () => {} };
    scene.feedbackText = { setText: () => {} };

    scene.handleInteractions();

    expect(scene.orderStage).toBe("needPickup");
    expect(scene.carryingOrder).toBe(false);
  });

  it("allows pickup when adjacent to pass interaction point after chef announcement", () => {
    const scene = new GameScene();

    scene.orderStage = "needPickup";
    scene.carryingOrder = false;
    scene.passReadyForPickup = true;
    scene.player = { x: 100, y: 124 };
    scene.passInteractionZone = { x: 100, y: 120 };
    scene.getCurrentInteractionRadius = () => 10;
    scene.getCurrentTargetSeatLabel = () => "A1";
    scene.statusText = { setText: () => {} };
    scene.feedbackText = { setText: () => {} };

    scene.handleInteractions();

    expect(scene.orderStage).toBe("needSeat");
    expect(scene.carryingOrder).toBe(true);
  });
});
