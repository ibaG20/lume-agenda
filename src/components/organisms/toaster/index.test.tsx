/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "./index";

afterEach(cleanup);

function Trigger() {
  const toast = useToast();
  return (
    <button
      onClick={() =>
        toast.push({
          title: "Perfil salvo",
          description: "Seus dados foram atualizados.",
          tone: "success",
          durationMs: 60_000,
        })
      }
      type="button"
    >
      Avisar
    </button>
  );
}

describe("ToastProvider", () => {
  it("shows a toast and dismisses it", () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Avisar" }));
    expect(screen.getByText("Perfil salvo")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Fechar aviso" }));
    expect(screen.queryByText("Perfil salvo")).toBeNull();
    vi.useRealTimers();
  });
});
