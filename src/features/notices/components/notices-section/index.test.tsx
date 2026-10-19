/** @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NoticesSection } from ".";

const mocks = vi.hoisted(() => ({
  dismiss: vi.fn(),
  enableNotifications: vi.fn(),
  eventType: "CLIENT_CANCELLED" as "CLIENT_BOOKED" | "CLIENT_CANCELLED",
  getNotificationStatus: vi.fn(),
  refetch: vi.fn(),
}));

vi.mock("../../enable-notifications", () => ({
  enableMobileNotifications: mocks.enableNotifications,
  getMobileNotificationStatus: mocks.getNotificationStatus,
}));
vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({}),
}));

vi.mock("../../hooks/use-notices", () => ({
  useNotices: () => ({
    status: "success",
    data: {
      timezone: "America/Sao_Paulo",
      notices: [
        {
          id: "notice-1",
          eventType: mocks.eventType,
          clientName: "Ana Souza",
          start: "2026-10-19T12:00:00.000Z",
          end: "2026-10-19T13:00:00.000Z",
          createdAt: "2026-10-18T18:00:00.000Z",
        },
      ],
    },
    error: undefined,
    refetch: mocks.refetch,
  }),
}));

vi.mock("../../hooks/use-dismiss-notice", () => ({
  useDismissNotice: () => ({
    status: "idle",
    error: undefined,
    dismiss: mocks.dismiss,
  }),
}));

describe("NoticesSection", () => {
  beforeEach(() => {
    mocks.eventType = "CLIENT_CANCELLED";
    mocks.refetch.mockReset();
    mocks.dismiss.mockReset();
    mocks.dismiss.mockResolvedValue({ ok: true });
    mocks.enableNotifications.mockReset();
    mocks.enableNotifications.mockResolvedValue("enabled");
    mocks.getNotificationStatus.mockReset();
    mocks.getNotificationStatus.mockResolvedValue("enabled");
  });

  it("shows a new booking with a dismiss button", () => {
    mocks.eventType = "CLIENT_BOOKED";

    render(<NoticesSection />);

    expect(
      screen.getByText(/agendou o horário/).closest("li")?.dataset.eventType,
    ).toBe("CLIENT_BOOKED");
    expect(screen.getByRole("button", { name: "Dispensar" })).toBeTruthy();
  });

  afterEach(cleanup);

  it("shows a client cancellation and removes it when dismissed", async () => {
    render(<NoticesSection />);

    expect(screen.getByText("Ana Souza")).toBeTruthy();
    expect(
      screen.getByText(/cancelou o horário/).closest("li")?.dataset.eventType,
    ).toBe("CLIENT_CANCELLED");
    fireEvent.click(screen.getByRole("button", { name: "Dispensar" }));

    await waitFor(() => {
      expect(mocks.dismiss).toHaveBeenCalledWith("notice-1");
      expect(screen.queryByText("Ana Souza")).toBeNull();
    });
    expect(screen.queryByRole("region", { name: "Avisos" })).toBeNull();
  });

  it("registers this device when notifications are not enabled yet", async () => {
    mocks.getNotificationStatus.mockResolvedValue("default");
    render(<NoticesSection />);

    const button = await screen.findByRole("button", {
      name: "Ativar avisos",
    });
    fireEvent.click(button);

    await waitFor(() =>
      expect(mocks.enableNotifications).toHaveBeenCalledOnce(),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Ativar avisos" }),
      ).toBeNull(),
    );
  });
});
