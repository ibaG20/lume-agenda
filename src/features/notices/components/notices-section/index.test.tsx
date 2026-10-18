/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NoticesSection } from ".";

const refetch = vi.fn();
const dismiss = vi.fn();

vi.mock("../../hooks/use-notices", () => ({
  useNotices: () => ({
    status: "success",
    data: {
      timezone: "America/Sao_Paulo",
      notices: [
        {
          id: "notice-1",
          eventType: "CLIENT_CANCELLED",
          clientName: "Ana Souza",
          start: "2026-10-19T12:00:00.000Z",
          end: "2026-10-19T13:00:00.000Z",
          createdAt: "2026-10-18T18:00:00.000Z",
        },
      ],
    },
    error: undefined,
    refetch,
  }),
}));

vi.mock("../../hooks/use-dismiss-notice", () => ({
  useDismissNotice: () => ({
    status: "idle",
    error: undefined,
    dismiss,
  }),
}));

describe("NoticesSection", () => {
  beforeEach(() => {
    refetch.mockReset();
    dismiss.mockReset();
    dismiss.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows the blocked-notification note only after mount", async () => {
    vi.stubGlobal("Notification", { permission: "denied" });
    render(<NoticesSection />);

    expect(
      await screen.findByText(/notificações do celular estão bloqueadas/),
    ).toBeTruthy();
  });

  it("shows a client cancellation and removes it when dismissed", async () => {
    render(<NoticesSection />);

    expect(screen.getByText("Ana Souza")).toBeTruthy();
    expect(screen.getByText(/cancelou o horário/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Dispensar" }));

    await waitFor(() => {
      expect(dismiss).toHaveBeenCalledWith("notice-1");
      expect(screen.queryByText("Ana Souza")).toBeNull();
    });
    expect(screen.getByText("Nenhum cancelamento de cliente por enquanto.")).toBeTruthy();
  });
});
