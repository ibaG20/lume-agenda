import type { AuthError, SupabaseClient, User } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import {
  PASSWORD_RESET_REQUEST_ERROR_MESSAGE,
  PASSWORD_UPDATE_ERROR_MESSAGE,
  requestPasswordReset,
  updatePassword,
} from "./password-recovery";

function createClient(overrides: {
  resetPasswordForEmail?: ReturnType<typeof vi.fn>;
  updateUser?: ReturnType<typeof vi.fn>;
}) {
  return {
    auth: {
      resetPasswordForEmail:
        overrides.resetPasswordForEmail ??
        vi.fn().mockResolvedValue({ data: {}, error: null }),
      updateUser:
        overrides.updateUser ??
        vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } as User },
          error: null,
        }),
    },
  } as unknown as SupabaseClient;
}

describe("requestPasswordReset", () => {
  it("requests a recovery email with the trusted callback", async () => {
    const client = createClient({});
    const redirectTo =
      "http://localhost:3000/auth/callback?next=%2Freset-password";

    const result = await requestPasswordReset(client, {
      email: "prestador@salao.com",
      redirectTo,
    });

    expect(result.ok).toBe(true);
    expect(client.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "prestador@salao.com",
      { redirectTo },
    );
  });

  it("does not expose the provider response or recipient on failure", async () => {
    const client = createClient({
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "User prestador@salao.com was not found",
          status: 400,
        } as AuthError,
      }),
    });

    const result = await requestPasswordReset(client, {
      email: "prestador@salao.com",
      redirectTo: "http://localhost:3000/auth/callback",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION");
      expect(result.error.message).toBe(PASSWORD_RESET_REQUEST_ERROR_MESSAGE);
      expect(result.error.message).not.toContain("@");
    }
  });

  it("maps rate limits to a temporary failure", async () => {
    const client = createClient({
      resetPasswordForEmail: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "Too many requests", status: 429 } as AuthError,
      }),
    });

    const result = await requestPasswordReset(client, {
      email: "prestador@salao.com",
      redirectTo: "http://localhost:3000/auth/callback",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("UNAVAILABLE");
  });
});

describe("updatePassword", () => {
  it("updates the password for the recovery session", async () => {
    const client = createClient({});

    const result = await updatePassword(client, "nova-senha");

    expect(result).toEqual({
      ok: true,
      data: { updated: true },
      requestId: expect.any(String),
    });
    expect(client.auth.updateUser).toHaveBeenCalledWith({
      password: "nova-senha",
    });
  });

  it("fails safely when the recovery session is no longer valid", async () => {
    const client = createClient({
      updateUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "JWT expired", status: 401 } as AuthError,
      }),
    });

    const result = await updatePassword(client, "nova-senha");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe(PASSWORD_UPDATE_ERROR_MESSAGE);
      expect(result.error.message).not.toContain("JWT");
    }
  });
});
