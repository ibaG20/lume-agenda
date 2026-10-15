/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Modal } from "./index";

afterEach(cleanup);

function Harness() {
  const [open, setOpen] = useState(true);
  return (
    <Modal
      description="O horário volta a ficar livre."
      footer={
        <button onClick={() => setOpen(false)} type="button">
          Fechar
        </button>
      }
      onClose={() => setOpen(false)}
      open={open}
      title="Cancelar agendamento"
    >
      <p>Maria · 10:30</p>
    </Modal>
  );
}

describe("Modal", () => {
  it("renders the title and closes from the backdrop", () => {
    render(<Harness />);

    expect(
      screen.getByRole("heading", { name: "Cancelar agendamento" }),
    ).toBeTruthy();
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes when escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} open title="Aviso">
        <p>Texto</p>
      </Modal>,
    );

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { bubbles: true, cancelable: true }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
