/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePasswordResetRequest } from "../hooks/use-password-recovery";
import { ForgotPasswordScreen } from "./forgot-password-screen";

const requestPasswordReset = vi.fn();

vi.mock("../hooks/use-password-recovery", () => ({
  usePasswordResetRequest: vi.fn(),
}));

afterEach(cleanup);

function mockRecovery() {
  vi.mocked(usePasswordResetRequest).mockReturnValue({
    status: "idle",
    error: undefined,
    data: undefined,
    requestPasswordReset,
  });
}

describe("ForgotPasswordScreen", () => {
  beforeEach(() => {
    requestPasswordReset.mockReset();
    mockRecovery();
  });

  it("submits a normalized email and shows a neutral confirmation", async () => {
    requestPasswordReset.mockResolvedValue({
      ok: true,
      data: { requested: true },
      requestId: "ok",
    });
    render(<ForgotPasswordScreen configured />);

    fireEvent.change(screen.getByLabelText("E-mail"), {
      target: { value: "  prestador@salao.com  " },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Enviar link de recuperação" }),
    );

    expect(await screen.findByText("Confira seu e-mail")).not.toBeNull();
    expect(requestPasswordReset).toHaveBeenCalledWith("prestador@salao.com");
    expect(screen.getByRole("status").textContent).not.toContain(
      "prestador@salao.com",
    );
  });

  it("explains an invalid or expired recovery link", () => {
    render(<ForgotPasswordScreen configured initialError="invalid_link" />);

    expect(screen.getByRole("alert").textContent).toContain(
      "link é inválido ou expirou",
    );
  });

  it("disables submission when Supabase is not configured", () => {
    render(<ForgotPasswordScreen configured={false} />);

    expect(
      (
        screen.getByRole("button", {
          name: "Enviar link de recuperação",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });
});
