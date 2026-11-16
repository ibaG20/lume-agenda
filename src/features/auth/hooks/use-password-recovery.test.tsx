/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  usePasswordResetRequest,
  usePasswordUpdate,
} from "./use-password-recovery";

const requestPasswordReset = vi.fn();
const updatePassword = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({}),
}));

vi.mock("../api/password-recovery", () => ({
  requestPasswordReset: (...args: unknown[]) => requestPasswordReset(...args),
  updatePassword: (...args: unknown[]) => updatePassword(...args),
}));

describe("password recovery hooks", () => {
  beforeEach(() => {
    requestPasswordReset.mockReset();
    updatePassword.mockReset();
  });

  it("uses the reset-password callback when requesting the email", async () => {
    requestPasswordReset.mockResolvedValue({
      ok: true,
      data: { requested: true },
      requestId: "ok",
    });
    const { result } = renderHook(() => usePasswordResetRequest());

    await act(async () => {
      await result.current.requestPasswordReset("prestador@salao.com");
    });

    expect(result.current.status).toBe("success");
    expect(requestPasswordReset).toHaveBeenCalledWith(
      {},
      {
        email: "prestador@salao.com",
        redirectTo:
          "http://localhost:3000/auth/callback?next=%2Freset-password",
      },
    );
  });

  it("updates the password through the active recovery session", async () => {
    updatePassword.mockResolvedValue({
      ok: true,
      data: { updated: true },
      requestId: "ok",
    });
    const { result } = renderHook(() => usePasswordUpdate());

    await act(async () => {
      await result.current.updatePassword("nova-senha");
    });

    expect(result.current.status).toBe("success");
    expect(updatePassword).toHaveBeenCalledWith({}, "nova-senha");
  });
});
