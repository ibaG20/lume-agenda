/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  hasCompletedTutorial,
  saveTutorialCompletion,
  tutorialStorageKey,
} from "./index.function";

describe("first access tutorial storage", () => {
  beforeEach(() => window.localStorage.clear());

  it("uses a different completion marker for each user", () => {
    saveTutorialCompletion("user-a");

    expect(hasCompletedTutorial("user-a")).toBe(true);
    expect(hasCompletedTutorial("user-b")).toBe(false);
    expect(window.localStorage.getItem(tutorialStorageKey("user-a"))).toBe("1");
  });

  it("keeps working when local storage is unavailable", () => {
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });

    expect(hasCompletedTutorial("user-a")).toBe(false);
    expect(() => saveTutorialCompletion("user-a")).not.toThrow();

    getItem.mockRestore();
    setItem.mockRestore();
  });
});
