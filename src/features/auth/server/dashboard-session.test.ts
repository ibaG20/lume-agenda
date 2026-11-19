import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  guideCookie: undefined as string | undefined,
  getProfile: vi.fn(),
  hasPublicEnv: vi.fn(),
  redirect: vi.fn((path: string): never => {
    throw new Error(`redirect:${path}`);
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("react", () => ({ cache: <T>(callback: T) => callback }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "agendinha_guia_concluido_v2" && mocks.guideCookie
        ? { name, value: mocks.guideCookie }
        : undefined,
  }),
}));
vi.mock("@/features/profile", () => ({ getProfile: mocks.getProfile }));
vi.mock("@/lib/env/public", () => ({ hasPublicEnv: mocks.hasPublicEnv }));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));

import {
  requireCompleteProfile,
  requireDashboardUser,
} from "./dashboard-session";

const profile = {
  id: "provider-1",
  name: "Ana",
  publicSlug: "ana-servicos",
  phone: "11999999999",
  timezone: "America/Sao_Paulo" as const,
  updatedAt: "2026-09-26T12:00:00.000Z",
};

function authenticatedClient() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "provider-1", email: "ana@example.com" } },
        error: null,
      }),
    },
  };
}

describe("dashboard session guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.guideCookie = "provider-1";
    mocks.hasPublicEnv.mockReturnValue(true);
    mocks.createServerSupabaseClient.mockResolvedValue(authenticatedClient());
  });

  it("redirects visitors without a session to sign in", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("missing session"),
        }),
      },
    });

    await expect(requireDashboardUser()).rejects.toThrow(
      "redirect:/sign-in?next=%2Finicio",
    );
  });

  it("redirects the first access to profile completion", async () => {
    mocks.getProfile.mockResolvedValue({
      ok: false,
      error: { code: "NOT_FOUND", message: "Perfil não encontrado." },
    });

    await expect(requireCompleteProfile()).rejects.toThrow(
      "redirect:/perfil?primeiro-acesso=1",
    );
  });

  it("keeps incomplete profiles out of the dashboard", async () => {
    mocks.getProfile.mockResolvedValue({
      ok: true,
      data: { ...profile, phone: null },
      requestId: "profile-1",
    });

    await expect(requireCompleteProfile()).rejects.toThrow(
      "redirect:/perfil?primeiro-acesso=1",
    );
  });

  it("lets the first access guide show the dashboard before the profile", async () => {
    mocks.guideCookie = undefined;
    mocks.getProfile.mockResolvedValue({
      ok: false,
      error: { code: "NOT_FOUND", message: "Perfil não encontrado." },
    });

    await expect(requireCompleteProfile()).resolves.toBeNull();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("ignores a guide completed by another user on the same browser", async () => {
    mocks.guideCookie = "provider-2";
    mocks.getProfile.mockResolvedValue({
      ok: true,
      data: { ...profile, phone: null },
      requestId: "profile-3",
    });

    await expect(requireCompleteProfile()).resolves.toBeNull();
  });

  it("honors a guide completed on another device", async () => {
    mocks.guideCookie = undefined;
    mocks.createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              id: "provider-1",
              email: "ana@example.com",
              user_metadata: {
                agendinha_guia_concluido_em: "2026-11-19T12:00:00.000Z",
              },
            },
          },
          error: null,
        }),
      },
    });
    mocks.getProfile.mockResolvedValue({
      ok: false,
      error: { code: "NOT_FOUND", message: "Perfil não encontrado." },
    });

    await expect(requireCompleteProfile()).rejects.toThrow(
      "redirect:/perfil?primeiro-acesso=1",
    );
  });

  it("allows access after the required profile is complete", async () => {
    mocks.getProfile.mockResolvedValue({
      ok: true,
      data: profile,
      requestId: "profile-2",
    });

    await expect(requireCompleteProfile()).resolves.toEqual(profile);
  });
});
