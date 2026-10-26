/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSignOut } from "./use-sign-out";

const signOutApi = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({}),
}));

vi.mock("../api/sign-out", () => ({
  signOut: (...args: unknown[]) => signOutApi(...args),
}));

describe("useSignOut", () => {
  beforeEach(() => {
    signOutApi.mockReset();
  });

  it("marks success after Auth signs out", async () => {
    signOutApi.mockResolvedValue({
      ok: true,
      data: { signedOut: true },
      requestId: "ok",
    });

    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    expect(result.current.status).toBe("success");
  });

  it("clears stored reads after a successful sign-out", async () => {
    window.localStorage.setItem(
      "agendinha-read:profile",
      JSON.stringify({ data: { name: "Ana" }, savedAt: Date.now() }),
    );
    signOutApi.mockResolvedValue({
      ok: true,
      data: { signedOut: true },
      requestId: "ok",
    });

    const { result } = renderHook(() => useSignOut());

    await act(async () => {
      await result.current.signOut();
    });

    expect(window.localStorage.getItem("agendinha-read:profile")).toBeNull();
  });
});
