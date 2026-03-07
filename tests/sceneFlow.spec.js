import { describe, expect, it } from "vitest";
import {
  BOOT_SCENE_KEY,
  PRELOAD_SCENE_KEY,
  MENU_SCENE_KEY,
  GAME_SCENE_KEY,
} from "../src/scenes/sceneKeys";
import { BASE_WIDTH, BASE_HEIGHT } from "../src/game/constants";
import { ASSET_MANIFEST } from "../src/assets/manifest";

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
