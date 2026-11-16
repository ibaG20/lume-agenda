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
    const dialog = screen.getByRole("dialog") as HTMLDialogElement;
    fireEvent.click(dialog);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(dialog.open).toBe(false);
    expect(dialog.hasAttribute("open")).toBe(false);
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

  it("places a guided modal beside a highlighted target", () => {
    render(
      <Modal
        onClose={() => undefined}
        open
        placement="right"
        spotlight={{ top: 24, left: 32, width: 180, height: 72 }}
        title="Guia"
      >
        <p>Passo atual</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    const spotlight = dialog.querySelector<HTMLElement>("[data-spotlight]");

    expect(dialog.dataset.placement).toBe("right");
    expect(dialog.querySelector("[data-tutorial-panel]")).toBeTruthy();
    expect(spotlight?.querySelector("svg")).toBeTruthy();
    expect(spotlight?.style.top).toBe("24px");
    expect(spotlight?.style.left).toBe("32px");
    expect(spotlight?.style.width).toBe("180px");
    expect(spotlight?.style.height).toBe("72px");
  });

  it("keeps a non-dismissible modal open after backdrop and escape", () => {
    const onClose = vi.fn();
    render(
      <Modal dismissible={false} onClose={onClose} open title="Guia">
        <p>Use os botões do guia.</p>
      </Modal>,
    );

    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    fireEvent(dialog, new Event("cancel", { cancelable: true }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeTruthy();
  });
});
