"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiError, ApiResult } from "@/types/api";

export type AsyncResourceState<T> =
  | { status: "idle"; data: undefined; error: undefined }
  | { status: "pending"; data: T | undefined; error: undefined }
  | { status: "success"; data: T; error: undefined }
  | { status: "empty"; data: T; error: undefined }
  | { status: "error"; data: undefined; error: ApiError };

const idleState = {
  status: "idle" as const,
  data: undefined,
  error: undefined,
};

export const READ_CACHE_PREFIX = "lume-read:";
const DEFAULT_CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const STALE_MAX_MS = 7 * 24 * 60 * 60 * 1000;

type StoredValue<T> = { data: T; savedAt: number };

function readStored<T>(
  cacheKey: string,
  ttlMs: number,
): StoredValue<T> | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(READ_CACHE_PREFIX + cacheKey);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as StoredValue<T>;
    if (
      typeof parsed.savedAt !== "number" ||
      Date.now() - parsed.savedAt > ttlMs
    ) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}

function writeStored<T>(cacheKey: string, data: T) {
  if (typeof window === "undefined") return;
  try {
    const value: StoredValue<T> = { data, savedAt: Date.now() };
    window.localStorage.setItem(
      READ_CACHE_PREFIX + cacheKey,
      JSON.stringify(value),
    );
  } catch {
    // Quota or private mode: the screen still works from the network.
  }
}

export function clearReadCache() {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key?.startsWith(READ_CACHE_PREFIX)) keys.push(key);
  }
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

function toResourceState<T>(
  data: T,
  isEmpty?: (data: T) => boolean,
): AsyncResourceState<T> {
  const empty = isEmpty?.(data) ?? false;
  return {
    status: empty ? "empty" : "success",
    data,
    error: undefined,
  };
}

export function useAsyncResource<T>(
  fetcher: () => Promise<ApiResult<T>>,
  key: string,
  options?: {
    enabled?: boolean;
    isEmpty?: (data: T) => boolean;
    cacheKey?: string;
    cacheTtlMs?: number;
  },
) {
  const enabled = options?.enabled ?? true;
  const isEmpty = options?.isEmpty;
  const cacheKey = options?.cacheKey;
  const cacheTtlMs = options?.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  const [reload, setReload] = useState({ token: 0, showLoading: false });
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<number>();
  const [state, setState] = useState<AsyncResourceState<T>>(
    enabled
      ? { status: "pending", data: undefined, error: undefined }
      : idleState,
  );
  const stateRef = useRef(state);

  const fetcherRef = useRef(fetcher);
  const isEmptyRef = useRef(isEmpty);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    fetcherRef.current = fetcher;
    isEmptyRef.current = isEmpty;
  }, [fetcher, isEmpty]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    const fresh =
      cacheKey && !reload.showLoading
        ? readStored<T>(cacheKey, cacheTtlMs)
        : undefined;
    const stale =
      cacheKey && !reload.showLoading
        ? readStored<T>(cacheKey, STALE_MAX_MS)
        : undefined;
    const snapshot = fresh ?? stale;

    setState(() => {
      if (snapshot) {
        return toResourceState(snapshot.data, isEmptyRef.current);
      }
      return { status: "pending", data: undefined, error: undefined };
    });
    setFromCache(Boolean(snapshot));
    setCachedAt(snapshot?.savedAt);

    void fetcherRef
      .current()
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.ok) {
          if (cacheKey) writeStored(cacheKey, result.data);
          setFromCache(false);
          setCachedAt(undefined);
          setState(toResourceState(result.data, isEmptyRef.current));
          return;
        }
        if (snapshot && result.error.code !== "UNAUTHENTICATED") {
          return;
        }
        setFromCache(false);
        setState({
          status: "error",
          data: undefined,
          error: result.error,
        });
      })
      .catch(() => {
        if (cancelled || snapshot) {
          return;
        }
        setFromCache(false);
        setState({
          status: "error",
          data: undefined,
          error: {
            code: "UNAVAILABLE",
            message: "Serviço temporariamente indisponível.",
            requestId: "client-unavailable",
          },
        });
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, cacheTtlMs, enabled, key, reload]);

  const refetch = useCallback((options?: { showLoading?: boolean }) => {
    setReload((current) => ({
      token: current.token + 1,
      showLoading: options?.showLoading === true,
    }));
  }, []);

  const updateData = useCallback(
    (updater: (current: T) => T) => {
      const current = stateRef.current;
      if (current.data === undefined) return;
      const data = updater(current.data);
      const next = toResourceState(data, isEmptyRef.current);
      stateRef.current = next;
      setState(next);
      if (cacheKey) writeStored(cacheKey, data);
    },
    [cacheKey],
  );

  if (!enabled) {
    return {
      ...idleState,
      refetch,
      updateData,
      fromCache: false,
      cachedAt: undefined,
    };
  }

  return { ...state, refetch, updateData, fromCache, cachedAt };
}
