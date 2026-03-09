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
  };
}

function makeRectObject() {
  return {
    setStrokeStyle() {
      return this;
    },
    setInteractive() {
      return this;
    },
    on() {
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

  it("registers pointer transition from menu to game", () => {
    const scene = new MenuScene();
    let startedKey = null;
    const pointerListeners = {};

    scene.scale = { width: 1280, height: 720, on: () => {} };
    scene.cameras = { main: { setBackgroundColor: () => {} } };
    scene.scene = {
      start: (key) => {
        startedKey = key;
      },
      restart: () => {},
    };

    const textObject = makeTextObject();
    const rectObject = makeRectObject();
    scene.add = {
      text: () => textObject,
      rectangle: () => rectObject,
    };

    rectObject.on = (event, cb) => {
      pointerListeners[event] = cb;
      return rectObject;
    };

    scene.create();
    pointerListeners.pointerup();
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
      on: () => {},
      activePointer: { worldX: 0, worldY: 0 },
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

  it("applies a five-second penalty when player bumps a rival", () => {
    const scene = new GameScene();
    let endedReason = null;
    const timerUpdates = [];

    scene.player = { x: 100, y: 100 };
    scene.rivals = [{ x: 110, y: 100, radius: 12 }];
    scene.remainingTime = 30;
    scene.timerText = { setText: (value) => timerUpdates.push(value) };
    scene.time = { now: 1000 };
    scene.endRound = (reason) => {
      endedReason = reason;
    };

    scene.handleRivalCollisionPenalty();
    expect(scene.remainingTime).toBe(28);
    expect(timerUpdates.at(-1)).toBe("TIMER: 00:28");
    expect(endedReason).toBeNull();

    scene.time.now = 1200;
    scene.handleRivalCollisionPenalty();
    expect(scene.remainingTime).toBe(28);
  });

  it("uses stronger rival chase bias near round start", () => {
    const scene = new GameScene();

    scene.roundStartedAt = 1000;
    scene.time = { now: 1200 };
    expect(scene.getRivalChaseBias()).toBeGreaterThan(0.8);

    scene.time = { now: 9000 };
    expect(scene.getRivalChaseBias()).toBeLessThan(0.8);
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

  it("repositions rival after repeated blocked frames", () => {
    const scene = new GameScene();
    let recoveryCalls = 0;

    scene.arenaBounds = { minX: 0, maxX: 300, minY: 0, maxY: 300 };
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
      },
    ];

    scene.resolveTableCollision = () => ({ x: 100, y: 100 });
    scene.pickNextRivalDirection = () => false;
    scene.repositionRival = () => {
      recoveryCalls += 1;
    };

    scene.updateRivals(0.016);
    expect(recoveryCalls).toBe(1);
  });

  it("activates only the current target seat", () => {
    const scene = new GameScene();

    scene.nextTargets = ["B2", "B1"];
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
    scene.remainingTime = 42;
    scene.score = 42;

    scene.advanceTargetQueue("A1");

    expect(scene.nextTargets).toEqual(["A2", "A1"]);
    expect(scene.score).toBe(42);
    expect(scene.remainingTime).toBe(30);
    expect(scene.seatZones.find((seat) => seat.label === "A2")?.isActive).toBe(true);
    expect(scene.seatZones.find((seat) => seat.label === "A1")?.isActive).toBe(false);

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

  it("allows pickup when adjacent to pass interaction point", () => {
    const scene = new GameScene();

    scene.orderStage = "needPickup";
    scene.carryingOrder = false;
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
