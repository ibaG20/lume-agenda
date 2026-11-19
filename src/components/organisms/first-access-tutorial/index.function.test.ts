/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FIRST_ACCESS_GUIDE_COOKIE,
  FIRST_ACCESS_GUIDE_METADATA_KEY,
} from "@/lib/first-access-guide";

const { updateUser } = vi.hoisted(() => ({ updateUser: vi.fn() }));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({ auth: { updateUser } }),
}));
import {
  hasCompletedTutorial,
  saveTutorialCompletion,
  tutorialStorageKey,
} from "./index.function";

describe("first access tutorial storage", () => {
  beforeEach(() => {
    updateUser.mockReset();
    updateUser.mockResolvedValue({ data: {}, error: null });
    window.localStorage.clear();
    document.cookie = `${FIRST_ACCESS_GUIDE_COOKIE}=; path=/; max-age=0`;
  });

  it("mirrors the completion in a cookie read by the server", () => {
    saveTutorialCompletion("user-a");

    expect(document.cookie).toContain(`${FIRST_ACCESS_GUIDE_COOKIE}=user-a`);
    window.localStorage.clear();
    expect(hasCompletedTutorial("user-a")).toBe(true);
    expect(hasCompletedTutorial("user-b")).toBe(false);
  });

  it("records the completion on the account for other devices", () => {
    saveTutorialCompletion("user-a");

    expect(updateUser).toHaveBeenCalledWith({
      data: { [FIRST_ACCESS_GUIDE_METADATA_KEY]: expect.any(String) },
    });
  });

  it("keeps working when the account cannot be updated", () => {
    updateUser.mockRejectedValue(new Error("offline"));

    expect(() => saveTutorialCompletion("user-a")).not.toThrow();
  });

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
