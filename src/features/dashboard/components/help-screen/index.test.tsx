/** @vitest-environment jsdom */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HelpScreen } from "./index";

vi.mock("next/offline", () => ({ useOffline: () => false }));

describe("HelpScreen", () => {
  afterEach(cleanup);

  it("presents the FAQ and a way to replay the guide", () => {
    const { container } = render(<HelpScreen />);

    expect(
      screen.getByRole("heading", { name: "Como podemos ajudar?" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /Rever guia/ }).getAttribute("href"),
    ).toBe("/inicio?guia=1");
    expect(container.querySelectorAll("details")).toHaveLength(9);
    expect(
      screen.getByText("Como altero meus dados e o link de agendamento?"),
    ).toBeTruthy();
    expect(screen.getByText("Como cancelo um atendimento?")).toBeTruthy();
  });

  it("links answers to the relevant dashboard screens", () => {
    render(<HelpScreen />);

    expect(
      screen
        .getAllByRole("link", { name: "Perfil" })
        .every((link) => link.getAttribute("href") === "/perfil"),
    ).toBe(true);
    expect(
      screen
        .getAllByRole("link", { name: "Agendamentos" })
        .some((link) => link.getAttribute("href") === "/inicio/agendamentos"),
    ).toBe(true);
  });
});
