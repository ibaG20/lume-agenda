/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Popover } from "./index";

afterEach(cleanup);

describe("Popover", () => {
  it("opens the note and closes with escape", () => {
    render(
      <Popover label="Sobre o fuso horário">
        Os horários usam este fuso.
      </Popover>,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Sobre o fuso horário" }),
    );
    expect(screen.getByRole("dialog").textContent).toContain(
      "Os horários usam este fuso.",
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
