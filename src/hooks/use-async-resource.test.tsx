/** @vitest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

  it("shows a skeleton-ready pending state when a keyed resource changes", async () => {
    const pending = new Map<
      string,
      (value: ApiResult<{ key: string }>) => void
    >();
    const fetcher = vi.fn(
      (key: string) =>
        new Promise<ApiResult<{ key: string }>>((resolve) => {
          pending.set(key, resolve);
        }),
    );
    const { result, rerender } = renderHook(
      ({ key }) => useAsyncResource(() => fetcher(key), key),
      { initialProps: { key: "first" } },
    );

    await act(async () => pending.get("first")?.(ok({ key: "first" })));
    expect(result.current.data).toEqual({ key: "first" });

    rerender({ key: "second" });
    await waitFor(() => expect(result.current.status).toBe("pending"));
    expect(result.current.data).toBeUndefined();

    await act(async () => pending.get("second")?.(ok({ key: "second" })));
    expect(result.current.data).toEqual({ key: "second" });
  });

  it("can discard cached content while a mutation-triggered refresh runs", async () => {
    let resolveRefresh:
      ((value: ApiResult<{ version: number }>) => void) | undefined;
    let calls = 0;
    const { result } = renderHook(() =>
      useAsyncResource(
        () => {
          calls += 1;
          if (calls === 1) return Promise.resolve(ok({ version: 1 }));
          return new Promise<ApiResult<{ version: number }>>((resolve) => {
            resolveRefresh = resolve;
          });
        },
        "refresh-with-loading",
        { cacheKey: "refresh-with-loading" },
      ),
    );

    await waitFor(() => expect(result.current.status).toBe("success"));
    act(() => result.current.refetch({ showLoading: true }));
    await waitFor(() => expect(result.current.status).toBe("pending"));
    expect(result.current.data).toBeUndefined();

    await act(async () => resolveRefresh?.(ok({ version: 2 })));
    expect(result.current.data).toEqual({ version: 2 });
  });

  it("commits optimistic data to state and the read cache", async () => {
    const { result } = renderHook(() =>
      useAsyncResource(() => Promise.resolve(ok({ items: [1] })), "mutable", {
        cacheKey: "mutable",
      }),
    );

    await waitFor(() => expect(result.current.status).toBe("success"));
    act(() =>
      result.current.updateData((current) => ({
        items: [0, ...current.items],
      })),
    );

    expect(result.current.data).toEqual({ items: [0, 1] });
    expect(
      JSON.parse(window.localStorage.getItem("agendinha-read:mutable") ?? ""),
    ).toMatchObject({
      data: { items: [0, 1] },
    });
  });

  it("shows the last stored payload when the next read fails", async () => {
    window.localStorage.setItem(
      "agendinha-read:agenda:today",
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
      "agendinha-read:agenda:today",
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
      "agendinha-read:profile",
      JSON.stringify({ data: { name: "Ana" }, savedAt: Date.now() }),
    );
    window.localStorage.setItem("other", "keep");
    clearReadCache();
    expect(window.localStorage.getItem("agendinha-read:profile")).toBeNull();
    expect(window.localStorage.getItem("other")).toBe("keep");
  });
});
