/** @vitest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { clearReadCache, useAsyncResource } from "./use-async-resource";
import type { ApiResult } from "@/types/api";

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data, requestId: "req" };
}

function fail(message = "falhou"): ApiResult<never> {
  return {
    ok: false,
    error: {
      code: "INTERNAL",
      message,
      requestId: "req",
    },
  };
}

describe("useAsyncResource", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("keeps idle when disabled", () => {
    const { result } = renderHook(() =>
      useAsyncResource(() => Promise.resolve(ok({ items: [1] })), "k", {
        enabled: false,
      }),
    );

    expect(result.current.status).toBe("idle");
  });

  it("marks success and empty from the payload", async () => {
    const { result } = renderHook(() =>
      useAsyncResource(
        () => Promise.resolve(ok({ items: [] as number[] })),
        "empty",
        {
          isEmpty: (data) => data.items.length === 0,
        },
      ),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("empty");
    });
    expect(result.current.data).toEqual({ items: [] });
  });

  it("exposes envelope errors", async () => {
    const { result } = renderHook(() =>
      useAsyncResource(() => Promise.resolve(fail()), "err"),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.error?.code).toBe("INTERNAL");
  });

  it("refetches when asked", async () => {
    let calls = 0;
    const { result } = renderHook(() =>
      useAsyncResource(() => {
        calls += 1;
        return Promise.resolve(ok({ calls }));
      }, "refetch"),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });

    await act(async () => {
      result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data?.calls).toBe(2);
    });
  });

  it("shows the last stored payload when the next read fails", async () => {
    window.localStorage.setItem(
      "lume-read:agenda:today",
      JSON.stringify({ data: { slots: [1] }, savedAt: Date.now() }),
    );
    const { result } = renderHook(() =>
      useAsyncResource(() => Promise.resolve(fail("sem rede")), "agenda", {
        cacheKey: "agenda:today",
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(result.current.fromCache).toBe(true);
    expect(result.current.data).toEqual({ slots: [1] });
  });

  it("keeps an expired snapshot when the next read fails", async () => {
    window.localStorage.setItem(
      "lume-read:agenda:today",
      JSON.stringify({
        data: { slots: [2] },
        savedAt: Date.now() - 24 * 60 * 60 * 1000,
      }),
    );
    const { result } = renderHook(() =>
      useAsyncResource(() => Promise.resolve(fail("sem rede")), "agenda", {
        cacheKey: "agenda:today",
        cacheTtlMs: 6 * 60 * 60 * 1000,
      }),
    );

    await waitFor(() => {
      expect(result.current.status).toBe("success");
    });
    expect(result.current.fromCache).toBe(true);
    expect(result.current.data).toEqual({ slots: [2] });
  });

  it("clears stored reads", () => {
    window.localStorage.setItem(
      "lume-read:profile",
      JSON.stringify({ data: { name: "Ana" }, savedAt: Date.now() }),
    );
    window.localStorage.setItem("other", "keep");
    clearReadCache();
    expect(window.localStorage.getItem("lume-read:profile")).toBeNull();
    expect(window.localStorage.getItem("other")).toBe("keep");
  });
});
