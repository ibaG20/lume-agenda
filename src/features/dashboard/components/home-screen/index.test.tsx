// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ emptyAgenda: false }));

vi.mock("@/features/profile", () => ({
  useProfile: () => ({
    status: "success",
    data: {
      id: "provider-1",
      name: "Ana",
      publicSlug: "ana-servicos",
      phone: "11999999999",
      timezone: "America/Sao_Paulo",
      updatedAt: "2026-09-26T12:00:00.000Z",
    },
    error: undefined,
    refetch: vi.fn(),
  }),
}));
vi.mock("@/features/notices", () => ({
  NoticesSection: () => <section>Avisos</section>,
}));
vi.mock("@/features/agenda", () => ({
  useDailyAgenda: () => ({
    status: "success",
    data: {
      date: "2026-09-26",
      timezone: "America/Sao_Paulo",
      slots: mocks.emptyAgenda
        ? []
        : [
            {
              start: "2026-09-26T12:00:00.000Z",
              end: "2026-09-26T13:00:00.000Z",
              state: "booked",
              appointmentId: "appointment-1",
              clientName: "Bruno",
            },
          ],
    },
    error: undefined,
    refetch: vi.fn(),
  }),
}));

import { HomeScreen } from ".";

beforeEach(() => {
  mocks.emptyAgenda = false;
});

afterEach(cleanup);

describe("HomeScreen", () => {
  it("shows today's customer and quick actions without a greeting", () => {
    render(<HomeScreen />);

    expect(screen.queryByText(/Olá, Ana!/)).toBeNull();
    expect(screen.getByText("Bruno")).toBeTruthy();
    expect(screen.getByText("09:00")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Gerenciar agendamentos/ })
        .getAttribute("href"),
    ).toBe("/inicio/agendamentos");
    expect(
      screen
        .getByRole("link", { name: /Configurar horários/ })
        .getAttribute("href"),
    ).toBe("/inicio/horarios");

    const today = screen.getByRole("heading", { name: "Hoje" });
    const notices = screen.getByText("Avisos");
    expect(
      today.compareDocumentPosition(notices) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows an illustration instead of text when today's agenda is empty", () => {
    mocks.emptyAgenda = true;

    render(<HomeScreen />);

    expect(screen.getByAltText("Nenhum agendamento hoje.")).toBeTruthy();
    expect(screen.queryByText("Nenhum agendamento hoje.")).toBeNull();
  });
});
