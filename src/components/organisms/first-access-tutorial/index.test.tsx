/** @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FirstAccessTutorial } from "./index";
import { tutorialStorageKey } from "./index.function";

describe("FirstAccessTutorial", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it("explains every activity and saves completion", async () => {
    render(<FirstAccessTutorial enabled userId="user-a" />);

    expect(
      await screen.findByRole("heading", { name: "Bem-vinda à Agendinha" }),
    ).toBeTruthy();

    const next = screen.getByRole("button", { name: "Próximo" });
    fireEvent.click(next);
    expect(screen.getByRole("heading", { name: "Agendamentos" })).toBeTruthy();
    fireEvent.click(next);
    expect(screen.getByRole("heading", { name: "Horários" })).toBeTruthy();
    fireEvent.click(next);
    expect(
      screen.getByRole("heading", { name: "Criar novo horário" }),
    ).toBeTruthy();
    fireEvent.click(next);
    expect(
      screen.getByRole("heading", { name: "Perfil e link de agendamento" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Começar a usar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(window.localStorage.getItem(tutorialStorageKey("user-a"))).toBe("1");
  });

  it("does not open after the tutorial was completed", async () => {
    window.localStorage.setItem(tutorialStorageKey("user-a"), "1");
    render(<FirstAccessTutorial enabled userId="user-a" />);

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("does not open outside the complete dashboard", async () => {
    render(<FirstAccessTutorial enabled={false} userId="user-a" />);

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(
      window.localStorage.getItem(tutorialStorageKey("user-a")),
    ).toBeNull();
  });
});
