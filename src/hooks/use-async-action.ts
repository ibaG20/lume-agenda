"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/organisms/toaster";
import type { ApiError, ApiResult } from "@/types/api";
import { toApiError } from "@/lib/api";

export type AsyncActionOptions = {
  successMessage?: string;
  errorToast?: boolean;
};

export type AsyncActionState<T> =
  | { status: "idle"; data: undefined; error: undefined }
  | { status: "pending"; data: T | undefined; error: undefined }
  | { status: "success"; data: T; error: undefined }
  | { status: "error"; data: undefined; error: ApiError };

const idleState = {
  status: "idle" as const,
  data: undefined,
  error: undefined,
};

export function useAsyncAction<TInput, TData>(
  action: (input: TInput) => Promise<ApiResult<TData>>,
  options?: AsyncActionOptions,
) {
  const toast = useToast();
  const [state, setState] = useState<AsyncActionState<TData>>(idleState);
  const actionRef = useRef(action);
  const optionsRef = useRef(options);

  useEffect(() => {
    actionRef.current = action;
    optionsRef.current = options;
  }, [action, options]);

  const run = useCallback(
    async (input: TInput): Promise<ApiResult<TData>> => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        const error = toApiError({
          code: "UNAVAILABLE",
          message: "Você está offline. Envie de novo quando a conexão voltar.",
          requestId: "offline",
        });
        setState({ status: "error", data: undefined, error });
        toast.push({ title: error.message, tone: "warning" });
        return { ok: false, error };
      }

      setState((previous) => ({
        status: "pending",
        data: previous.data,
        error: undefined,
      }));

      try {
        const result = await actionRef.current(input);
        if (result.ok) {
          setState({
            status: "success",
            data: result.data,
            error: undefined,
          });
          if (optionsRef.current?.successMessage) {
            toast.push({
              title: optionsRef.current.successMessage,
              tone: "success",
            });
          }
        } else {
          setState({
            status: "error",
            data: undefined,
            error: result.error,
          });
          if (optionsRef.current?.errorToast) {
            toast.push({ title: result.error.message, tone: "error" });
          }
        }
        return result;
      } catch {
        const error = toApiError({
          code: "UNAVAILABLE",
          requestId: "client-unavailable",
        });
        setState({
          status: "error",
          data: undefined,
          error,
        });
        if (optionsRef.current?.errorToast) {
          toast.push({ title: error.message, tone: "error" });
        }
        return { ok: false, error };
      }
    },
    [toast],
  );

  const reset = useCallback(() => {
    setState(idleState);
  }, []);

  return { ...state, run, reset };
}
