/** @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScheduleListScreen } from ".";

const confirm = vi.fn();
const refetch = vi.fn();
const updateData = vi.fn();
const remove = vi.fn();
const setActive = vi.fn();

vi.mock("@/components/organisms/confirm-dialog", () => ({
  useConfirm: () => confirm,
}));

vi.mock("@/features/schedule-rules", () => ({
  useScheduleGroups: () => ({
    status: "success",
    data: [
      {
        id: "group-1",
        name: "Manhã",
        isActive: false,
        rules: [],
      },
    ],
    error: undefined,
    fromCache: false,
    cachedAt: undefined,
    refetch,
    updateData,
  }),
  useGroupMutation: () => ({
    isPending: false,
    error: undefined,
    isConflict: false,
    remove,
    setActive,
  }),
}));

describe("ScheduleListScreen", () => {
  beforeEach(() => {
    confirm.mockReset().mockResolvedValue(true);
    refetch.mockReset();
    updateData.mockReset();
    remove.mockReset();
    setActive.mockReset();
  });

  afterEach(cleanup);

  it("switches a group immediately while the server confirms the change", () => {
    setActive.mockReturnValue(new Promise(() => undefined));
    render(<ScheduleListScreen />);

    const toggle = screen.getByRole("checkbox", { name: "Ativar Manhã" });
    fireEvent.click(toggle);

    expect((toggle as HTMLInputElement).checked).toBe(true);
    expect(setActive).toHaveBeenCalledWith({ id: "group-1", isActive: true });
  });

  it("removes a confirmed group immediately", async () => {
    remove.mockReturnValue(new Promise(() => undefined));
    render(<ScheduleListScreen />);

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(confirm).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByText("Manhã")).toBeNull());
    expect(remove).toHaveBeenCalledWith("group-1");
  });
});
