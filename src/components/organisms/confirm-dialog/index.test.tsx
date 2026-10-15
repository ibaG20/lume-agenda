/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ConfirmProvider, useConfirm } from "./index";

afterEach(cleanup);

function Ask() {
  const confirm = useConfirm();
  const [answer, setAnswer] = useState("pendente");

  return (
    <button
      onClick={() => {
        void confirm({
          title: "Sair da conta",
          description: "Você precisará entrar de novo.",
          confirmLabel: "Sair",
          tone: "danger",
        }).then((accepted) => setAnswer(accepted ? "sim" : "não"));
      }}
      type="button"
    >
      Perguntar {answer}
    </button>
  );
}

describe("ConfirmProvider", () => {
  it("resolves true when the danger action is confirmed", async () => {
    render(
      <ConfirmProvider>
        <Ask />
      </ConfirmProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Perguntar/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Sair" }));
    expect(
      await screen.findByRole("button", { name: "Perguntar sim" }),
    ).toBeTruthy();
  });

  it("resolves false when cancelled", async () => {
    render(
      <ConfirmProvider>
        <Ask />
      </ConfirmProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Perguntar/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancelar" }));
    expect(
      await screen.findByRole("button", { name: "Perguntar não" }),
    ).toBeTruthy();
  });
});
