import { beforeAll, describe, expect, it, vi } from "vitest";
import {
  BOOT_SCENE_KEY,
  PRELOAD_SCENE_KEY,
  MENU_SCENE_KEY,
  GAME_SCENE_KEY,
  SHIFT_COMPLETE_SCENE_KEY,
  DAY_COMPLETE_SCENE_KEY,
} from "../src/scenes/sceneKeys";
import { BASE_WIDTH, BASE_HEIGHT } from "../src/game/constants";
import { ASSET_MANIFEST } from "../src/assets/manifest";

vi.mock("phaser", () => ({
  default: {
    Scene: class {},
    Input: {
      Keyboard: {
        KeyCodes: {
          S: 83,
          H: 72,
          R: 82,
          M: 77,
          ESC: 27,
        },
        JustDown: (key) => {
          if (!key?.__justDown) {
            return false;
          }
          key.__justDown = false;
          return true;
        },
      },
    },
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
let ShiftCompleteScene;
let DayCompleteScene;

beforeAll(async () => {
  ({ BootScene } = await import("../src/scenes/BootScene"));
  ({ PreloadScene } = await import("../src/scenes/PreloadScene"));
  ({ MenuScene } = await import("../src/scenes/MenuScene"));
  ({ GameScene } = await import("../src/scenes/GameScene"));
  ({ ShiftCompleteScene } = await import("../src/scenes/ShiftCompleteScene"));
  ({ DayCompleteScene } = await import("../src/scenes/DayCompleteScene"));
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
    setInteractive() {
      return this;
    },
    on() {
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
    setInteractive() {
      return this;
    },
    on() {
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

function makeGraphicsObject() {
  return {
    fillStyle() {},
    fillRect() {},
    lineStyle() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    strokePath() {},
    strokeRect() {},
  };
}

describe("foundation configuration", () => {
  it("keeps scene keys unique", () => {
    const keys = [BOOT_SCENE_KEY, PRELOAD_SCENE_KEY, MENU_SCENE_KEY, GAME_SCENE_KEY, SHIFT_COMPLETE_SCENE_KEY, DAY_COMPLETE_SCENE_KEY];
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

    scene.cameras = { main: { setBackgroundColor: () => {} } };
    scene.scene = {
      start: (key) => {
        startedKey = key;
      },
    };
    // Simulate loader with no assets pending so the fallback path fires.
    scene.load = {
      image: () => {},
      once: () => {},
      start: () => {},
      isLoading: () => false,
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
    expect(renderedText).toContain("Press ENTER or SPACE to start");
    expect(renderedText).toContain("HOW TO MOVE\nWASD or Arrow Keys");
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
    scene.add.graphics = () => makeGraphicsObject();

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
    expect(timerUpdates.at(-1)).toBe("00:29");
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

  it("retargets nearby rivals to pursue the player with a buffer", () => {
    const scene = new GameScene();
    const rival = {
      x: 100,
      y: 100,
      vx: 0,
      vy: 0,
      radius: 14,
      stunnedUntil: 0,
      blockedFrames: 0,
      routeTarget: { x: 80, y: 80 },
      lane: "center",
      behaviorWaypoints: [{ x: 80, y: 80 }, { x: 120, y: 120 }],
      behaviorIndex: 0,
      behaviorDirection: 1,
      behaviorMode: "loop",
      behaviorPattern: "center",
      patrolClockwise: true,
      patrolWaypoints: [],
      patrolWaypointIndex: 0,
      lastTableContactAt: -Infinity,
      routeHistory: [],
      isInterceptingPlayer: false,
    };

    scene.arenaBounds = { minX: 0, maxX: 400, minY: 0, maxY: 300 };
    scene.player = { x: 160, y: 100 };
    scene.playerMotionVector = { x: 1, y: 0 };
    scene.playerMotionStrength = 1;
    scene.rivals = [rival];
    scene.time = { now: 500 };
    scene.resolveRivalPatrolCollision = (nextX, nextY) => ({ x: nextX, y: nextY });
    scene.findNearestOpenPatrolPoint = (point) => point;

    scene.updateRivals(1 / 60);

    expect(rival.isInterceptingPlayer).toBe(true);
    expect(rival.routeTarget.x).toBeGreaterThan(80);
    expect(rival.routeTarget.x).toBeLessThan(scene.player.x);
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

  it("routes layout clear to shift complete scene", () => {
    const scene = new GameScene();
    let delayedMs = 0;
    let startCall = null;

    scene.shiftLevel = 1;
    scene.shiftScore = 0;
    scene.shiftDelivered = 0;
    scene.shiftNumber = 1;
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

    scene.endRound("LAYOUT_CLEAR");

    expect(delayedMs).toBe(550);
    expect(startCall).toEqual({
      key: SHIFT_COMPLETE_SCENE_KEY,
      data: {
        totalScore: 42,
        totalDelivered: 7,
        shiftLevel: 1,
        shiftNumber: 1,
        isDayComplete: false,
        bestCombo: 0,
      },
    });
  });

  it("marks day complete after level 3 layout clear", () => {
    const scene = new GameScene();
    let startCall = null;

    scene.shiftLevel = 3;
    scene.shiftScore = 100;
    scene.shiftDelivered = 12;
    scene.shiftNumber = 2;
    scene.score = 42;
    scene.deliveredPlates = 7;
    scene.statusText = { setText: () => {} };
    scene.feedbackText = { setText: () => {} };
    scene.time = {
      delayedCall: (_, callback) => {
        callback();
      },
    };
    scene.scene = {
      start: (key, data) => {
        startCall = { key, data };
      },
    };

    scene.endRound("LAYOUT_CLEAR");

    expect(startCall).toEqual({
      key: DAY_COMPLETE_SCENE_KEY,
      data: {
        totalScore: 142,
        totalDelivered: 19,
        shiftLevel: 3,
        shiftNumber: 2,
        isDayComplete: true,
        bestCombo: 0,
      },
    });
  });

  it("derives layout index from day number", () => {
    const scene = new GameScene();

    expect(scene.getLayoutIndexForDay(1)).toBe(0);
    expect(scene.getLayoutIndexForDay(2)).toBe(1);
    expect(scene.getLayoutIndexForDay(3)).toBe(2);
    expect(scene.getLayoutIndexForDay(4)).toBe(1);
    expect(scene.getLayoutIndexForDay(5)).toBe(3);
    expect(scene.getLayoutIndexForDay(6)).toBe(4);
    expect(scene.getLayoutIndexForDay(7)).toBe(0);
  });

  it("scales difficulty up from day 2 onward", () => {
    const scene = new GameScene();

    expect(scene.getRoundDurationSecondsForDay(1)).toBe(30);
    expect(scene.getRoundDurationSecondsForDay(2)).toBe(27.5);
    expect(scene.getRoundDurationSecondsForDay(6)).toBe(17.5);

    expect(scene.getLayoutPlateGoalForDay(1)).toBe(10);
    expect(scene.getLayoutPlateGoalForDay(2)).toBe(15);
    expect(scene.getLayoutPlateGoalForDay(6)).toBe(32);
    expect(scene.getLayoutPlateGoalForDay(8)).toBe(36);

    expect(scene.getRivalSpeedScaleForDay(1)).toBe(1);
    expect(scene.getRivalSpeedScaleForDay(2)).toBeCloseTo(1.05, 5);
    expect(scene.getRivalSpeedScaleForDay(6)).toBeCloseTo(1.25, 5);
  });

  it("keeps day loop continuous while increasing challenge", () => {
    const scene = new GameScene();

    const day7 = {
      timer: scene.getRoundDurationSecondsForDay(7),
      goal: scene.getLayoutPlateGoalForDay(7),
      speedScale: scene.getRivalSpeedScaleForDay(7),
    };
    const day8 = {
      timer: scene.getRoundDurationSecondsForDay(8),
      goal: scene.getLayoutPlateGoalForDay(8),
      speedScale: scene.getRivalSpeedScaleForDay(8),
    };

    expect(day8.timer).toBeLessThanOrEqual(day7.timer);
    expect(day8.goal).toBeGreaterThan(day7.goal);
    expect(day8.speedScale).toBeGreaterThan(day7.speedScale);
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
    expect(scene.shiftLevel).toBe(1);
    expect(scene.shiftScore).toBe(0);
    expect(scene.shiftDelivered).toBe(0);
    expect(scene.shiftNumber).toBe(1);
    expect(scene.carryingOrder).toBe(false);
    expect(scene.orderStage).toBe("needPickup");
    expect(scene.roundEnded).toBe(false);
    expect(scene.nextTargets).toEqual([]);
  });

  it("init reads shift data passed from scene start", () => {
    const scene = new GameScene();

    scene.init({
      shiftLevel: 2,
      shiftScore: 33,
      shiftDelivered: 4,
      shiftNumber: 7,
    });

    expect(scene.shiftLevel).toBe(2);
    expect(scene.shiftScore).toBe(33);
    expect(scene.shiftDelivered).toBe(4);
    expect(scene.shiftNumber).toBe(7);
  });

  it("maps layout-clear outcomes to labels", () => {
    const scene = new GameScene();

    expect(scene.buildRoundSummary("LAYOUT_CLEAR", 1).label).toBe("Layout 1 complete");
    expect(scene.buildRoundSummary("LAYOUT_CLEAR", 3).label).toBe("Layout 3 complete");
  });

  it("clears the layout after 10 delivered plates", () => {
    const scene = new GameScene();
    let endedReason = null;

    scene.orderStage = "needSeat";
    scene.carryingOrder = true;
    scene.player = { x: 0, y: 0 };
    scene.deliveredPlates = 9;
    scene.remainingTime = 20;
    scene.layoutPlateGoal = 10;
    scene.score = 0;
    scene.scoreText = { setText: () => {} };
    scene.statusText = { setText: () => {} };
    scene.setFeedback = () => {};
    scene.findDeliverableSeat = () => ({ label: "A-1" });
    scene.advanceTargetQueue = () => {};
    scene.endRound = (reason) => {
      endedReason = reason;
    };

    scene.handleInteractions();

    expect(scene.deliveredPlates).toBe(10);
    expect(endedReason).toBe("LAYOUT_CLEAR");
  });

  it("ShiftCompleteScene startNextShift advances level within same day", () => {
    const scene = new ShiftCompleteScene();
    let startCall = null;

    scene.shiftLevel = 1;
    scene.shiftNumber = 2;
    scene.totalScore = 150;
    scene.totalDelivered = 18;
    scene.scene = {
      start: (key, data) => {
        startCall = { key, data };
      },
    };

    scene.startNextShift();

    expect(startCall).toEqual({
      key: GAME_SCENE_KEY,
      data: {
        shiftLevel: 2,
        shiftScore: 150,
        shiftDelivered: 18,
        shiftNumber: 2,
      },
    });
  });

  it("ShiftCompleteScene binds ENTER and SPACE to continue", () => {
    const scene = new ShiftCompleteScene();
    const keyboardListeners = {};
    const startedKeys = [];

    scene.init({ totalScore: 99, totalDelivered: 11, shiftLevel: 2, shiftNumber: 3 });
    scene.scale = { width: 1280, height: 720, on: () => {}, off: () => {} };
    scene.cameras = { main: { setBackgroundColor: () => {} } };
    scene.scene = {
      start: (key) => {
        startedKeys.push(key);
      },
      restart: () => {},
    };
    scene.input = {
      keyboard: {
        on: (event, cb) => {
          keyboardListeners[event] = cb;
        },
        off: () => {},
      },
    };
    scene.events = { once: () => {} };
    scene.add = {
      text: () => makeTextObject(),
      rectangle: () => makeRectObject(),
    };

    scene.create();
    keyboardListeners["keydown-ENTER"]();
    keyboardListeners["keydown-SPACE"]();

    expect(startedKeys).toEqual([GAME_SCENE_KEY, GAME_SCENE_KEY]);
  });

  it("DayCompleteScene startNextShift rolls to next day", () => {
    const scene = new DayCompleteScene();
    let startCall = null;

    scene.shiftNumber = 2;
    scene.totalScore = 200;
    scene.totalDelivered = 30;
    scene.scene = {
      start: (key, data) => {
        startCall = { key, data };
      },
    };

    scene.startNextShift();

    expect(startCall).toEqual({
      key: GAME_SCENE_KEY,
      data: {
        shiftLevel: 1,
        shiftScore: 200,
        shiftDelivered: 30,
        shiftNumber: 3,
      },
    });
  });

  it("DayCompleteScene binds ENTER and SPACE to continue", () => {
    const scene = new DayCompleteScene();
    const keyboardListeners = {};
    const startedKeys = [];

    scene.init({ totalScore: 120, totalDelivered: 14, shiftNumber: 4 });
    scene.scale = { width: 1280, height: 720, on: () => {}, off: () => {} };
    scene.cameras = { main: { setBackgroundColor: () => {} } };
    scene.scene = {
      start: (key) => {
        startedKeys.push(key);
      },
      restart: () => {},
    };
    scene.input = {
      keyboard: {
        on: (event, cb) => {
          keyboardListeners[event] = cb;
        },
        off: () => {},
      },
    };
    scene.events = { once: () => {} };
    scene.add = {
      text: () => makeTextObject(),
      rectangle: () => makeRectObject(),
    };

    scene.create();
    keyboardListeners["keydown-ENTER"]();
    keyboardListeners["keydown-SPACE"]();

    expect(startedKeys).toEqual([GAME_SCENE_KEY, GAME_SCENE_KEY]);
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

    scene.rivalBumpDetectedThisFrame = true;
    scene.handleRivalCollisionPenalty();
    expect(scene.remainingTime).toBe(28.5);
    expect(timerUpdates.at(-1)).toBe("00:29");
    expect(endedReason).toBeNull();

    scene.time.now = 1200;
    scene.rivalBumpDetectedThisFrame = true;
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

  it("stops at table I as the last table in layout 1", () => {
    const scene = new GameScene();
    scene.mazeColumns = [100, 200, 300, 400, 500, 600, 700];
    scene.mazeRows = [100, 180, 260, 340, 420];

    const tablePositions = scene.getLayout1TablePositions();
    const labels = tablePositions.map((t) => t.label);

    expect(labels).not.toContain("J");
    expect(labels.at(-1)).toBe("I");
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

    expect(zones.length).toBe(9);
    expect(new Set(signatures).size).toBe(9);
  });

  it("keeps all tables off arena walls", () => {
    const scene = new GameScene();
    scene.mazeColumns = [100, 200, 300, 400, 500, 600, 700];
    scene.mazeRows = [100, 180, 260, 340, 420];
    scene.arenaBounds = { minX: 24, maxX: 760, minY: 100, maxY: 520 };
    scene.add = {
      rectangle: () => ({ setStrokeStyle: () => ({}) }),
      text: () => ({ setOrigin: () => ({}) }),
    };

    const zones = scene.createTableZones();
    zones.forEach((zone) => {
      const bottomEdge = zone.y + (zone.collider?.halfHeight ?? 0);
      expect(bottomEdge).toBeLessThanOrEqual(498);
    });
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
    const rivalStarts = scene.getRivalSpawnPoints();
    const nearestRivalDistance = rivalStarts.reduce((best, rival) => {
      const distance = Math.hypot(spawn.x - rival.x, spawn.y - rival.y);
      return Math.min(best, distance);
    }, Number.POSITIVE_INFINITY);

    expect(scene.isSpawnPositionOpen(spawn)).toBe(true);
    expect(nearestRivalDistance).toBeGreaterThanOrEqual(150);
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

  it("biases spawn choices away from rival starts", () => {
    const scene = new GameScene();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

    scene.mazeColumns = [0, 100, 200, 300, 400];
    scene.mazeRows = [0, 100, 200];
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
    const nearestRivalDistance = scene.getRivalSpawnPoints().reduce((best, rival) => {
      const distance = Math.hypot(spawn.x - rival.x, spawn.y - rival.y);
      return Math.min(best, distance);
    }, Number.POSITIVE_INFINITY);

    expect(spawn.x).toBe(400);
    expect(nearestRivalDistance).toBeGreaterThanOrEqual(150);

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

  it("blocks player movement into rivals and stuns them on contact", () => {
    const scene = new GameScene();
    scene.assignNextRivalRouteTarget = vi.fn();
    scene.time = { now: 1000 };
    scene.rivals = [{ x: 100, y: 100, radius: 14, stunnedUntil: 0 }];

    // Player tries to walk into the rival — should be pushed back to previous y.
    const blocked = scene.resolveRivalCollision(100, 100, 100, 150);
    // Player moves to a clear position — should pass through.
    const open = scene.resolveRivalCollision(160, 100, 100, 150);
    scene.time.now = 1200;
    const blockedAgain = scene.resolveRivalCollision(100, 100, 100, 150);

    expect(blocked).toEqual({ x: 100, y: 150 });
    expect(open).toEqual({ x: 160, y: 100 });
    expect(blockedAgain).toEqual({ x: 100, y: 150 });
    expect(scene.rivals[0].stunnedUntil).toBeGreaterThan(1000);
    expect(scene.rivals[0].stunnedUntil).toBe(1900);
    expect(scene.rivals[0].bumpRecoveryActive).toBe(true);
    expect(scene.assignNextRivalRouteTarget).toHaveBeenCalledTimes(1);
  });

  it("allows brief escape movement after rival penalty to prevent body-pin lock", () => {
    const scene = new GameScene();
    scene.assignNextRivalRouteTarget = vi.fn();
    scene.player = { x: 100, y: 100 };
    scene.rivals = [{ x: 110, y: 100, radius: 14, stunnedUntil: 0 }];
    scene.remainingTime = 30;
    scene.orderTimerRunning = true;
    scene.lastRivalPenaltyAt = -Infinity;
    scene.rivalBumpDetectedThisFrame = true;
    scene.timerText = { setText: () => {} };
    scene.showRivalPenaltyHint = () => {};
    scene.time = { now: 1000 };

    scene.handleRivalCollisionPenalty();

    const freeMove = scene.resolveRivalCollision(110, 100, 100, 100);
    expect(freeMove).toEqual({ x: 110, y: 100 });

    scene.time.now = 2500;
    const blockedAgain = scene.resolveRivalCollision(110, 100, 100, 100);
    expect(blockedAgain).toEqual({ x: 100, y: 100 });
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

describe("pause/settings smoke", () => {
  function makeMenuSceneHarness() {
    const scene = new MenuScene();
    const keyboardListeners = {};
    const keysByCode = {};

    scene.scale = { width: 1280, height: 720, on: () => {}, off: () => {} };
    scene.cameras = { main: { setBackgroundColor: () => {} } };
    scene.scene = { start: () => {}, restart: () => {} };
    scene.tweens = {
      add: () => {},
      stagger: () => 0,
    };
    scene.time = { now: 0 };
    scene.events = { once: () => {} };

    scene.input = {
      keyboard: {
        on: (event, cb) => {
          keyboardListeners[event] = cb;
        },
        off: () => {},
        addKey: (code) => {
          const key = { code, __justDown: false };
          keysByCode[code] = key;
          return key;
        },
      },
    };

    const textObj = {
      ...makeTextObject(),
      setDepth() {
        return this;
      },
      setScrollFactor() {
        return this;
      },
      destroy() {},
    };
    const rectObj = {
      ...makeRectObject(),
      setDepth() {
        return this;
      },
      destroy() {},
    };
    const circleObj = {
      ...makeCircleObject(),
      destroy() {},
    };

    scene.add = {
      text: () => ({ ...textObj }),
      rectangle: () => ({ ...rectObj }),
      circle: () => ({ ...circleObj }),
    };

    scene.create();
    return { scene, keysByCode, keyboardListeners };
  }

  it("opens and closes settings overlay via S hotkey polling", () => {
    const { scene, keysByCode } = makeMenuSceneHarness();
    const sCode = 83;

    keysByCode[sCode].__justDown = true;
    scene.update();
    expect(scene.settingsOverlay).not.toBeNull();

    scene.time.now = 400;
    keysByCode[sCode].__justDown = true;
    scene.update();
    expect(scene.settingsOverlay).toBeNull();
  });

  it("opens and closes how-to-play overlay via H hotkey polling", () => {
    const { scene, keysByCode } = makeMenuSceneHarness();
    const hCode = 72;

    keysByCode[hCode].__justDown = true;
    scene.update();
    expect(scene.howToPlayOverlay).not.toBeNull();

    scene.time.now = 400;
    keysByCode[hCode].__justDown = true;
    scene.update();
    expect(scene.howToPlayOverlay).toBeNull();
  });

  it("pause hotkeys handle ESC resume, R restart, and M menu", () => {
    const scene = new GameScene();
    const restartSpy = vi.fn();
    const startSpy = vi.fn();
    const resumeSpy = vi.fn(() => {
      scene.isPaused = false;
    });

    scene.scene = { restart: restartSpy, start: startSpy };
    scene.hidePauseOverlay = vi.fn();
    scene.resumeGame = resumeSpy;
    scene.shiftLevel = 2;
    scene.shiftScore = 120;
    scene.shiftDelivered = 9;
    scene.shiftNumber = 4;

    scene.isPaused = true;
    scene.pauseResumeKey = { __justDown: true };
    scene.pauseRestartKey = { __justDown: false };
    scene.pauseMainMenuKey = { __justDown: false };
    scene.handlePauseHotkeys();
    expect(resumeSpy).toHaveBeenCalledTimes(1);

    scene.isPaused = true;
    scene.pauseResumeKey.__justDown = false;
    scene.pauseRestartKey.__justDown = true;
    scene.handlePauseHotkeys();
    expect(restartSpy).toHaveBeenCalledTimes(1);

    scene.isPaused = true;
    scene.pauseRestartKey.__justDown = false;
    scene.pauseMainMenuKey.__justDown = true;
    scene.handlePauseHotkeys();
    expect(startSpy).toHaveBeenCalledTimes(1);
  });
});

describe("technical and quality hardening", () => {
  it("cleans up keyboard listeners, timers, and tweens on shutdown", () => {
    const scene = new GameScene();
    const keyboardOff = vi.fn();
    const scaleOff = vi.fn();
    const removePending = vi.fn();
    const removeChefHide = vi.fn();
    const removeReturnToMenu = vi.fn();
    const removePenaltyHint = vi.fn();
    const removeComboFlash = vi.fn();
    const killTweensOf = vi.fn();

    scene.scale = { off: scaleOff };
    scene.input = { keyboard: { off: keyboardOff } };
    scene.hidePauseOverlay = vi.fn();
    scene.onEscKeyDown = vi.fn();
    scene.onPauseKeyDown = vi.fn();
    scene.pendingChefAnnouncementEvent = { remove: removePending };
    scene.hideChefAnnouncementEvent = { remove: removeChefHide };
    scene.returnToMenuEvent = { remove: removeReturnToMenu };
    scene.hideRivalPenaltyHintEvent = { remove: removePenaltyHint };
    scene.hideComboFlashEvent = { remove: removeComboFlash };
    scene.chefContainer = {};
    scene.chefBubbleContainer = {};
    scene.chefSpeechText = {};
    scene.tweens = { killTweensOf };

    scene.cleanupSceneRuntime();

    expect(scaleOff).toHaveBeenCalledWith("resize", scene.handleScaleResize, scene);
    expect(keyboardOff).toHaveBeenCalledWith("keydown-ESC", scene.onEscKeyDown, scene);
    expect(keyboardOff).toHaveBeenCalledWith("keydown-P", scene.onPauseKeyDown, scene);
    expect(scene.hidePauseOverlay).toHaveBeenCalledTimes(1);

    expect(removePending).toHaveBeenCalledWith(false);
    expect(removeChefHide).toHaveBeenCalledWith(false);
    expect(removeReturnToMenu).toHaveBeenCalledWith(false);
    expect(removePenaltyHint).toHaveBeenCalledWith(false);
    expect(removeComboFlash).toHaveBeenCalledWith(false);

    expect(scene.pendingChefAnnouncementEvent).toBeNull();
    expect(scene.hideChefAnnouncementEvent).toBeNull();
    expect(scene.returnToMenuEvent).toBeNull();
    expect(scene.hideRivalPenaltyHintEvent).toBeNull();
    expect(scene.hideComboFlashEvent).toBeNull();
    expect(killTweensOf).toHaveBeenCalledTimes(3);
  });

  it("reuses stable pause listener reference across repeated create calls", () => {
    const scene = new GameScene();
    const keyboardListeners = {};
    const keyboardOn = vi.fn((event, cb) => {
      keyboardListeners[event] = cb;
    });
    const keyboardOff = vi.fn();
    const scaleOn = vi.fn();
    const scaleOff = vi.fn();

    scene.scale = { width: 1280, height: 720, on: scaleOn, off: scaleOff };
    scene.cameras = { main: { setBackgroundColor: () => {} } };
    scene.scene = { start: () => {}, restart: () => {} };
    scene.events = { once: vi.fn() };
    scene.time = {
      now: 0,
      delayedCall: () => ({ remove: () => {} }),
    };
    scene.tweens = {
      add: () => {},
      killTweensOf: () => {},
    };
    scene.input = {
      keyboard: {
        on: keyboardOn,
        off: keyboardOff,
        createCursorKeys: () => ({}),
        addKeys: () => ({}),
      },
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
    scene.add.graphics = () => makeGraphicsObject();

    scene.create();
    const firstPauseHandler = scene.onPauseKeyDown;
    const firstEscHandler = scene.onEscKeyDown;

    scene.create();

    expect(scene.onPauseKeyDown).toBe(firstPauseHandler);
    expect(scene.onEscKeyDown).toBe(firstEscHandler);
    expect(keyboardOff).toHaveBeenCalledWith("keydown-P", firstPauseHandler, scene);
    expect(keyboardOff).toHaveBeenCalledWith("keydown-ESC", firstEscHandler, scene);
    expect(scaleOff).toHaveBeenCalledWith("resize", scene.handleScaleResize, scene);
    expect(keyboardListeners["keydown-P"]).toBe(firstPauseHandler);
  });

  it("keeps frame dispatch within budget under simulated pressure", () => {
    const scene = new GameScene();
    scene.roundEnded = false;
    scene.isPaused = false;
    scene.updateTimer = () => {};
    scene.handleMovement = () => {};
    scene.updatePlayerMotionIntent = () => {};
    scene.tryStartOrderTimer = () => {};
    scene.updateRivals = () => {};
    scene.resolveRivalToRivalBumps = () => {};
    scene.handleRivalCollisionPenalty = () => {};
    scene.handleInteractions = () => {};
    scene.updatePlayerLocationHint = () => {};

    const start = Date.now();
    for (let i = 0; i < 1200; i += 1) {
      scene.update(null, 16.67);
    }
    const elapsedMs = Date.now() - start;

    expect(elapsedMs).toBeLessThan(250);
  });
});

describe("combo chain", () => {
  it("multiplier stays 1 below tier 1 threshold", () => {
    const scene = new GameScene();
    scene.comboCount = 2;
    expect(scene.getComboMultiplier()).toBe(1);
  });

  it("applies tier-1 multiplier at threshold", () => {
    const scene = new GameScene();
    scene.comboCount = 3;
    expect(scene.getComboMultiplier()).toBeCloseTo(1.5);
  });

  it("applies tier-2 multiplier at higher threshold", () => {
    const scene = new GameScene();
    scene.comboCount = 5;
    expect(scene.getComboMultiplier()).toBeCloseTo(2.0);
  });

  it("resets combo on rival collision penalty", () => {
    const scene = new GameScene();

    scene.comboCount = 4;
    scene.roundBumpCount = 0;
    scene.lastRivalPenaltyAt = -Infinity;
    scene.remainingTime = 20;
    scene.orderTimerRunning = true;
    scene.player = { x: 100, y: 100 };
    scene.rivals = [{ x: 105, y: 100, radius: 14, stunnedUntil: 0 }];
    scene.time = { now: 99999 };
    scene.timerText = { setText: () => {} };
    scene.showRivalPenaltyHint = () => {};

    scene.rivalBumpDetectedThisFrame = true;
    scene.handleRivalCollisionPenalty();

    expect(scene.comboCount).toBe(0);
  });

  it("blue plate twist applies score multiplier", () => {
    const scene = new GameScene();
    scene.dayTwist = "blue_plate";
    scene.comboCount = 0;
    const mult = scene.getDeliveryScoreMultiplier();
    expect(mult).toBeCloseTo(1.25);
  });

  it("blue plate + combo tier-2 stacks multiplier", () => {
    const scene = new GameScene();
    scene.dayTwist = "blue_plate";
    scene.comboCount = 5;
    const mult = scene.getDeliveryScoreMultiplier();
    expect(mult).toBeCloseTo(2.5);
  });
});

describe("day twist", () => {
  it("day 3 gives rush hour twist", () => {
    const scene = new GameScene();
    expect(scene.getDayTwistForDay(3)).toBe("rush_hour");
  });

  it("day 5 gives blue plate twist", () => {
    const scene = new GameScene();
    expect(scene.getDayTwistForDay(5)).toBe("blue_plate");
  });

  it("day 7 gives peak service twist", () => {
    const scene = new GameScene();
    expect(scene.getDayTwistForDay(7)).toBe("peak_service");
  });

  it("day 1 and day 2 have no twist", () => {
    const scene = new GameScene();
    expect(scene.getDayTwistForDay(1)).toBeNull();
    expect(scene.getDayTwistForDay(2)).toBeNull();
  });

  it("getDayTwistLabel returns human-readable labels", () => {
    const scene = new GameScene();
    expect(scene.getDayTwistLabel("rush_hour")).toBe("RUSH HOUR");
    expect(scene.getDayTwistLabel("blue_plate")).toBe("BLUE PLATE SPECIAL");
    expect(scene.getDayTwistLabel("peak_service")).toBe("PEAK SERVICE");
    expect(scene.getDayTwistLabel(null)).toBeNull();
  });
});

describe("additional layouts", () => {
  function makeSceneWithArena() {
    const scene = new GameScene();
    scene.arenaBounds = { minX: 0, maxX: 1280, minY: 70, maxY: 720 };
    scene.mazeColumns = [103, 281, 460, 640, 819, 998, 1166];
    scene.mazeRows = [161, 291, 421, 551, 655];
    return scene;
  }

  it("layout 4 returns 9 table positions", () => {
    const scene = makeSceneWithArena();
    const positions = scene.getLayout4TablePositions();
    expect(positions).toHaveLength(9);
  });

  it("layout 5 returns 9 table positions", () => {
    const scene = makeSceneWithArena();
    const positions = scene.getLayout5TablePositions();
    expect(positions).toHaveLength(9);
  });

  it("all layout 4 positions have distinct labels", () => {
    const scene = makeSceneWithArena();
    const labels = scene.getLayout4TablePositions().map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("all layout 5 positions have distinct labels", () => {
    const scene = makeSceneWithArena();
    const labels = scene.getLayout5TablePositions().map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
