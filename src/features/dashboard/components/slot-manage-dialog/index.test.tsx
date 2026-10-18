/** @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgendaSlot } from "@/features/agenda";
import { SlotManageDialog } from "./index";

const deactivate = vi.fn();
const reactivate = vi.fn();
const cancel = vi.fn();

vi.mock("@/features/overrides", () => ({
  useSlotAvailability: () => ({
    isPending: false,
    error: undefined,
    deactivate,
    reactivate,
    reset: vi.fn(),
  }),
}));

vi.mock("@/features/provider-cancellation", () => ({
  useProviderCancelAppointment: () => ({
    status: "idle",
    error: undefined,
    cancel,
    reset: vi.fn(),
  }),
}));

const base = {
  start: "2026-10-20T18:00:00.000Z",
  end: "2026-10-20T19:00:00.000Z",
};

function renderDialog(slot: AgendaSlot) {
  const onChanged = vi.fn();
  const onClose = vi.fn();
  render(
    <SlotManageDialog
      date="2026-10-20"
      onChanged={onChanged}
      onClose={onClose}
      slot={slot}
      timezone="America/Sao_Paulo"
    />,
  );
  return { onChanged, onClose };
}

const ok = { ok: true, data: {}, requestId: "ok" };

afterEach(cleanup);

beforeEach(() => {
  deactivate.mockReset().mockResolvedValue(ok);
  reactivate.mockReset().mockResolvedValue(ok);
  cancel.mockReset().mockResolvedValue(ok);
});

describe("SlotManageDialog", () => {
  it("inactivates only the selected slot of that day", async () => {
    const { onChanged, onClose } = renderDialog({
      ...base,
      state: "available",
    });

    expect(screen.getByText("15:00 – 16:00")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Inativar horário" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(deactivate).toHaveBeenCalledWith(base);
    expect(onChanged).toHaveBeenCalled();
  });

  it("reactivates a blocked slot through its override", async () => {
    const { onClose } = renderDialog({
      ...base,
      state: "blocked",
      overrideId: "ovr-1",
    });

    fireEvent.click(screen.getByRole("button", { name: "Reativar horário" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(reactivate).toHaveBeenCalledWith("ovr-1");
  });

  it("asks whether to inactivate the slot after cancelling", async () => {
    const { onChanged, onClose } = renderDialog({
      ...base,
      state: "booked",
      appointmentId: "apt-1",
      clientName: "Ana",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Cancelar e avisar cliente" }),
    );

    await screen.findByText("Agendamento cancelado");
    expect(cancel).toHaveBeenCalledWith("apt-1");
    expect(onChanged).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Inativar horário" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(deactivate).toHaveBeenCalledWith(base);
    expect(onChanged).toHaveBeenCalledTimes(2);
  });

  it("keeps the slot available after cancelling when asked", async () => {
    const { onClose } = renderDialog({
      ...base,
      state: "booked",
      appointmentId: "apt-1",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Cancelar e avisar cliente" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Manter disponível" }),
    );

    expect(onClose).toHaveBeenCalled();
    expect(deactivate).not.toHaveBeenCalled();
  });

  it("cancels a booked slot and keeps the dialog open on failure", async () => {
    cancel.mockResolvedValue({
      ok: false,
      error: { code: "UNAVAILABLE", message: "Falhou", requestId: "x" },
    });
    const { onClose } = renderDialog({
      ...base,
      state: "booked",
      appointmentId: "apt-1",
      clientName: "Ana",
    });

    expect(screen.getByText("Ana")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Cancelar e avisar cliente" }),
    );

    await waitFor(() => expect(cancel).toHaveBeenCalledWith("apt-1"));
    expect(onClose).not.toHaveBeenCalled();
  });
});
