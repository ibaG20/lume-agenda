/** @vitest-environment jsdom */

import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RegisterServiceWorker } from "./register-sw";

describe("RegisterServiceWorker", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("removes the app worker and its caches outside production", async () => {
    const unregisterApp = vi.fn().mockResolvedValue(true);
    const unregisterOther = vi.fn().mockResolvedValue(true);
    const deleteCache = vi.fn().mockResolvedValue(true);
    const register = vi.fn();

    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistrations: vi.fn().mockResolvedValue([
          {
            active: { scriptURL: "http://localhost/sw.js" },
            unregister: unregisterApp,
          },
          {
            active: { scriptURL: "http://localhost/other-worker.js" },
            unregister: unregisterOther,
          },
        ]),
        register,
      },
    });
    Object.defineProperty(window, "caches", {
      configurable: true,
      value: {
        delete: deleteCache,
        keys: vi
          .fn()
          .mockResolvedValue(["agendinha-v3", "agendinha-v4", "other-cache"]),
      },
    });

    render(<RegisterServiceWorker />);

    await waitFor(() => expect(unregisterApp).toHaveBeenCalledOnce());
    expect(unregisterOther).not.toHaveBeenCalled();
    expect(deleteCache).toHaveBeenCalledTimes(2);
    expect(deleteCache).toHaveBeenCalledWith("agendinha-v3");
    expect(deleteCache).toHaveBeenCalledWith("agendinha-v4");
    expect(register).not.toHaveBeenCalled();
  });
});
