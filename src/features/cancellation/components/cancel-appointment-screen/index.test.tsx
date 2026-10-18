/** @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmProvider } from "@/components/organisms/confirm-dialog";
import { CancelAppointmentScreen } from ".";

const preview = vi.fn();
const cancel = vi.fn();

vi.mock("../../hooks/use-cancellation-preview", () => ({
  useCancellationPreview: (...args: unknown[]) => preview(...args),
}));

vi.mock("../../hooks/use-cancel-appointment", () => ({
  useCancelAppointment: () => ({
    status: "idle",
    data: undefined,
    error: undefined,
    cancel,
    isIdempotent: false,
  }),
}));

const token = "11111111-2222-4333-8444-555555555555";

const confirmed = {
  appointmentId: "apt-1",
  start: "2026-10-19T12:00:00.000Z",
  end: "2026-10-19T13:00:00.000Z",
  status: "CONFIRMED" as const,
  providerName: "Studio Bela Unha",
  publicSlug: "studio-bela-unha",
  timezone: "America/Sao_Paulo",
};

function renderScreen(value = token) {
  return render(
    <ConfirmProvider>
      <CancelAppointmentScreen token={value} />
    </ConfirmProvider>,
  );
}

describe("CancelAppointmentScreen", () => {
  beforeEach(() => {
    preview.mockReset();
    cancel.mockReset();
    cancel.mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    cleanup();
  });

  it("does not load or cancel when the link has no token", () => {
    preview.mockReturnValue({
      status: "idle",
      data: undefined,
      error: undefined,
      refetch: vi.fn(),
    });

    renderScreen("");

    expect(screen.getByText("Link de cancelamento incompleto")).toBeTruthy();
    expect(preview).toHaveBeenCalledWith("");
    expect(cancel).not.toHaveBeenCalled();
  });

  it("shows the appointment and waits for an explicit confirmation", () => {
    preview.mockReturnValue({
      status: "success",
      data: confirmed,
      error: undefined,
      refetch: vi.fn(),
    });

    renderScreen();

    expect(screen.getByText("Studio Bela Unha")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Cancelar agendamento" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Escolher outro horário" })).toBeNull();
    expect(cancel).not.toHaveBeenCalled();
  });

  it("cancels only after the confirmation dialog", async () => {
    preview.mockReturnValue({
      status: "success",
      data: confirmed,
      error: undefined,
      refetch: vi.fn(),
    });

    renderScreen();
    fireEvent.click(
      screen.getByRole("button", { name: "Cancelar agendamento" }),
    );
    expect(cancel).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog", { name: "Cancelar este horário?" });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Cancelar agendamento" }),
    );

    await waitFor(() => {
      expect(cancel).toHaveBeenCalledWith(token);
    });
  });

  it("sends an already cancelled appointment to the provider schedule", () => {
    preview.mockReturnValue({
      status: "success",
      data: { ...confirmed, status: "CANCELLED" },
      error: undefined,
      refetch: vi.fn(),
    });

    renderScreen();

    expect(screen.queryByRole("button", { name: "Cancelar agendamento" })).toBeNull();
    expect(screen.getByRole("link", { name: "Escolher outro horário" }).getAttribute("href")).toBe(
      "/studio-bela-unha/agendar",
    );
    expect(cancel).not.toHaveBeenCalled();
  });

  it("hides the token when the appointment cannot be found", () => {
    preview.mockReturnValue({
      status: "error",
      data: undefined,
      error: { code: "NOT_FOUND", message: "Recurso não encontrado.", requestId: "x" },
      refetch: vi.fn(),
    });

    renderScreen();

    expect(screen.getByText("Não encontramos este agendamento")).toBeTruthy();
    expect(document.body.textContent).not.toContain(token);
    expect(cancel).not.toHaveBeenCalled();
  });
});
