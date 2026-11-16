/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePasswordUpdate } from "../hooks/use-password-recovery";
import { ResetPasswordScreen } from "./reset-password-screen";

const updatePassword = vi.fn();

vi.mock("../hooks/use-password-recovery", () => ({
  usePasswordUpdate: vi.fn(),
}));

afterEach(cleanup);

function mockRecovery() {
  vi.mocked(usePasswordUpdate).mockReturnValue({
    status: "idle",
    error: undefined,
    data: undefined,
    updatePassword,
  });
}

function fillPasswords(password: string, confirmation: string) {
  fireEvent.change(screen.getByLabelText("Nova senha"), {
    target: { value: password },
  });
  fireEvent.change(screen.getByLabelText("Confirme a nova senha"), {
    target: { value: confirmation },
  });
}

describe("ResetPasswordScreen", () => {
  beforeEach(() => {
    updatePassword.mockReset();
    mockRecovery();
  });

  it("rejects different password confirmations locally", async () => {
    render(<ResetPasswordScreen configured />);
    fillPasswords("nova-senha", "senha-diferente");
    fireEvent.click(screen.getByRole("button", { name: "Atualizar senha" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "As senhas precisam ser iguais.",
    );
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it("updates the password and confirms success", async () => {
    updatePassword.mockResolvedValue({
      ok: true,
      data: { updated: true },
      requestId: "ok",
    });
    render(<ResetPasswordScreen configured />);
    fillPasswords("nova-senha", "nova-senha");
    fireEvent.click(screen.getByRole("button", { name: "Atualizar senha" }));

    expect(await screen.findByText("Senha atualizada")).not.toBeNull();
    expect(updatePassword).toHaveBeenCalledWith("nova-senha");
    expect(screen.getByRole("status").textContent).toContain(
      "Senha alterada com sucesso.",
    );
  });
});
