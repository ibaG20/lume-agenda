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

const CACHE_PREFIX = "lume-read:";
const DEFAULT_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

type StoredValue<T> = { data: T; savedAt: number };

function readStored<T>(
  cacheKey: string,
  ttlMs: number,
): StoredValue<T> | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + cacheKey);
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
    window.localStorage.setItem(CACHE_PREFIX + cacheKey, JSON.stringify(value));
  } catch {
    // Quota or private mode: the screen still works from the network.
  }
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
  const [reloadToken, setReloadToken] = useState(0);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<number>();
  const [state, setState] = useState<AsyncResourceState<T>>(
    enabled
      ? { status: "pending", data: undefined, error: undefined }
      : idleState,
  );

  const fetcherRef = useRef(fetcher);
  const isEmptyRef = useRef(isEmpty);

  useEffect(() => {
    fetcherRef.current = fetcher;
    isEmptyRef.current = isEmpty;
  }, [fetcher, isEmpty]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let cancelled = false;
    const cached = cacheKey ? readStored<T>(cacheKey, cacheTtlMs) : undefined;

    // Fetch remoto: o pending precisa ir para o estado da UI.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hook de leitura remota
    setState((previous) => {
      if (cached) {
        const empty = isEmptyRef.current?.(cached.data) ?? false;
        return {
          status: empty ? "empty" : "success",
          data: cached.data,
          error: undefined,
        };
      }
      if (previous.data !== undefined && previous.status !== "error") {
        return { ...previous, error: undefined };
      }
      return { status: "pending", data: undefined, error: undefined };
    });
    setFromCache(Boolean(cached));
    setCachedAt(cached?.savedAt);

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
          const empty = isEmptyRef.current?.(result.data) ?? false;
          setState({
            status: empty ? "empty" : "success",
            data: result.data,
            error: undefined,
          });
          return;
        }
        if (cached) return;
        setFromCache(false);
        setState({
          status: "error",
          data: undefined,
          error: result.error,
        });
      })
      .catch(() => {
        if (cancelled || cached) {
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
  }, [cacheKey, cacheTtlMs, enabled, key, reloadToken]);

  const refetch = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  if (!enabled) {
    return { ...idleState, refetch, fromCache: false, cachedAt: undefined };
  }

  return { ...state, refetch, fromCache, cachedAt };
}
