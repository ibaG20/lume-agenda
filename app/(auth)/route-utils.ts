import { NextResponse, type NextRequest } from "next/server";
import { applyAuthResponseHeaders, normalizeNextPath } from "@/features/auth";

export function createAuthHeaderCollector() {
  const headers = new Headers();

  return {
    headers,
    onAuthHeaders(values: Record<string, string>) {
      Object.entries(values).forEach(([name, value]) => {
        headers.set(name, value);
      });
    },
  };
}

export function redirectWithAuthHeaders(
  location: URL,
  status: 302 | 303,
  authHeaders?: Headers,
): NextResponse {
  const response = NextResponse.redirect(location, { status });
  applyAuthResponseHeaders(response.headers, authHeaders);
  return response;
}

export function signInErrorUrl(
  request: NextRequest,
  error: "oauth_callback" | "session_expired" | "unavailable",
  nextPath = "/",
): URL {
  const url = new URL("/sign-in", request.url);
  const safeNextPath = normalizeNextPath(nextPath);
  url.searchParams.set("error", error);
  if (safeNextPath !== "/") {
    url.searchParams.set("next", safeNextPath);
  }
  return url;
}

export function authCallbackErrorUrl(
  request: NextRequest,
  error: "oauth_callback" | "unavailable",
  nextPath = "/",
): URL {
  const safeNextPath = normalizeNextPath(nextPath);
  const destination = new URL(safeNextPath, request.url);

  if (destination.pathname === "/reset-password") {
    const url = new URL("/forgot-password", request.url);
    url.searchParams.set(
      "error",
      error === "unavailable" ? "unavailable" : "invalid_link",
    );
    return url;
  }

  return signInErrorUrl(request, error, safeNextPath);
}
