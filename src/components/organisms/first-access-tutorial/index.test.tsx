/** @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FirstAccessTutorial } from "./index";
import { tutorialStorageKey } from "./index.function";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

function renderTutorial(pathname = "/inicio", enabled = true) {
  return render(
    <FirstAccessTutorial
      enabled={enabled}
      pathname={pathname}
      userId="user-a"
    />,
  );
}

describe("FirstAccessTutorial", () => {
  beforeEach(() => {
    replace.mockReset();
    window.localStorage.clear();
    window.history.replaceState(null, "", "/inicio");
  });
  afterEach(() => {
    cleanup();
    document
      .querySelectorAll("[data-tutorial-target]")
      .forEach((target) => target.remove());
    vi.restoreAllMocks();
  });

  it("navigates through every activity and saves completion", async () => {
    const view = renderTutorial();

    expect(
      await screen.findByRole("heading", { name: "Painel do dia" }),
    ).toBeTruthy();

    const next = screen.getByRole("button", { name: "Próximo" });
    fireEvent.click(next);
    view.rerender(
      <FirstAccessTutorial
        enabled
        pathname="/inicio/horarios"
        userId="user-a"
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Configure seus horários" }),
    ).toBeTruthy();
    expect(replace).toHaveBeenLastCalledWith("/inicio/horarios", {
      scroll: false,
    });

    fireEvent.click(screen.getByRole("button", { name: "Voltar" }));
    view.rerender(
      <FirstAccessTutorial enabled pathname="/inicio" userId="user-a" />,
    );
    expect(
      await screen.findByRole("heading", { name: "Painel do dia" }),
    ).toBeTruthy();
    expect(replace).toHaveBeenLastCalledWith("/inicio", { scroll: false });

    fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    view.rerender(
      <FirstAccessTutorial
        enabled
        pathname="/inicio/horarios"
        userId="user-a"
      />,
    );
    await screen.findByRole("heading", { name: "Configure seus horários" });
    fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    view.rerender(
      <FirstAccessTutorial
        enabled
        pathname="/inicio/horarios/criar"
        userId="user-a"
      />,
    );
    expect(
      await screen.findByRole("heading", { name: "Crie um grupo de horários" }),
    ).toBeTruthy();
    expect(replace).toHaveBeenLastCalledWith("/inicio/horarios/criar", {
      scroll: false,
    });

    fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    view.rerender(
      <FirstAccessTutorial enabled pathname="/perfil" userId="user-a" />,
    );
    expect(
      await screen.findByRole("heading", {
        name: "Perfil e link de agendamento",
      }),
    ).toBeTruthy();
    expect(replace).toHaveBeenLastCalledWith("/perfil", { scroll: false });

    fireEvent.click(screen.getByRole("button", { name: "Próximo" }));
    view.rerender(
      <FirstAccessTutorial
        enabled
        pathname="/inicio/agendamentos"
        userId="user-a"
      />,
    );
    expect(
      await screen.findByRole("heading", {
        name: "Gerencie seus agendamentos",
      }),
    ).toBeTruthy();
    expect(replace).toHaveBeenLastCalledWith("/inicio/agendamentos", {
      scroll: false,
    });

    fireEvent.click(screen.getByRole("button", { name: "Concluir guia" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(window.localStorage.getItem(tutorialStorageKey("user-a"))).toBe("1");
  });

  it("skips the guide from its explicit action", async () => {
    renderTutorial();

    await screen.findByRole("heading", { name: "Painel do dia" });
    fireEvent.click(screen.getByRole("button", { name: "Pular guia" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(window.localStorage.getItem(tutorialStorageKey("user-a"))).toBe("1");
  });

  it.each(["cancel", "backdrop"])(
    "keeps the guide open after %s",
    async (action) => {
      renderTutorial();
      const dialog = await screen.findByRole("dialog");

      if (action === "cancel") {
        fireEvent(dialog, new Event("cancel", { cancelable: true }));
      } else {
        fireEvent.click(dialog);
      }

      expect(screen.getByRole("dialog")).toBeTruthy();
      expect(
        window.localStorage.getItem(tutorialStorageKey("user-a")),
      ).toBeNull();
    },
  );

  it("does not open after the guide was completed", async () => {
    window.localStorage.setItem(tutorialStorageKey("user-a"), "1");
    renderTutorial();

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("replays a completed guide when requested by the help page", async () => {
    window.localStorage.setItem(tutorialStorageKey("user-a"), "1");
    window.history.replaceState(null, "", "/inicio?guia=1");
    renderTutorial();

    expect(
      await screen.findByRole("heading", { name: "Painel do dia" }),
    ).toBeTruthy();
    expect(replace).toHaveBeenCalledWith("/inicio", { scroll: false });
  });

  it("does not open outside the complete dashboard", async () => {
    renderTutorial("/perfil", false);

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(
      window.localStorage.getItem(tutorialStorageKey("user-a")),
    ).toBeNull();
  });

  it("limits the mobile spotlight to the area above the guide panel", async () => {
    const target = document.createElement("div");
    target.dataset.tutorialTarget = "home-actions";
    document.body.append(target);

    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 390,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 800,
    });
    vi.spyOn(window, "scrollBy").mockImplementation(() => undefined);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        if (this.dataset.tutorialTarget === "home-actions") {
          return DOMRect.fromRect({ x: 20, y: 400, width: 350, height: 200 });
        }
        if (this.hasAttribute("data-tutorial-panel")) {
          return DOMRect.fromRect({ x: 0, y: 500, width: 390, height: 300 });
        }
        return DOMRect.fromRect();
      },
    );

    renderTutorial();
    const dialog = await screen.findByRole("dialog");

    await waitFor(() => {
      const spotlight = dialog.querySelector<HTMLElement>("[data-spotlight]");
      expect(spotlight?.style.top).toBe("392px");
      expect(spotlight?.style.height).toBe("96px");
    });
  });
});
