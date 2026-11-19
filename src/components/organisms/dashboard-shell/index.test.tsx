/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardShell } from "./index";

vi.mock("next/navigation", () => ({ usePathname: () => "/ajuda" }));
vi.mock("next/offline", () => ({ useOffline: () => false }));
vi.mock("@/components/organisms/first-access-tutorial", () => ({
  FirstAccessTutorial: ({
    enabled,
    onOpenChange,
  }: {
    enabled: boolean;
    onOpenChange?: (open: boolean) => void;
  }) => (
    <button
      data-enabled={enabled}
      onClick={() => onOpenChange?.(true)}
      type="button"
    >
      Abrir guia
    </button>
  ),
}));

describe("DashboardShell", () => {
  afterEach(cleanup);

  it("exposes help in the desktop sidebar and mobile header", () => {
    render(
      <DashboardShell userId="user-a">
        <p>Conteúdo</p>
      </DashboardShell>,
    );

    const desktopHelp = screen.getByRole("link", { name: "Ajuda" });
    const mobileHelp = screen.getByRole("link", {
      name: "Ajuda e perguntas frequentes",
    });

    expect(desktopHelp.getAttribute("href")).toBe("/ajuda");
    expect(desktopHelp.getAttribute("aria-current")).toBe("page");
    expect(mobileHelp.getAttribute("href")).toBe("/ajuda");
    expect(mobileHelp.getAttribute("aria-current")).toBe("page");
  });

  it.each([
    { profileIncomplete: true, guideCompleted: false, enabled: "true" },
    { profileIncomplete: true, guideCompleted: true, enabled: "false" },
    { profileIncomplete: false, guideCompleted: false, enabled: "false" },
    { profileIncomplete: false, guideCompleted: true, enabled: "false" },
  ])(
    "opens the guide by itself only on the first access (%o)",
    ({ profileIncomplete, guideCompleted, enabled }) => {
      render(
        <DashboardShell
          guideCompleted={guideCompleted}
          profileIncomplete={profileIncomplete}
          userId="user-a"
        >
          <p>Conteúdo</p>
        </DashboardShell>,
      );

      expect(
        screen.getByRole("button", { name: "Abrir guia" }).dataset.enabled,
      ).toBe(enabled);
    },
  );

  it("removes the mobile dock while the guide is open", () => {
    render(
      <DashboardShell userId="user-a">
        <p>Conteúdo</p>
      </DashboardShell>,
    );

    expect(
      screen.getByRole("navigation", { name: "Navegação principal" }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Abrir guia" }));
    expect(
      screen.queryByRole("navigation", { name: "Navegação principal" }),
    ).toBeNull();
  });
});
