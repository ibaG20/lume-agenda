/** @vitest-environment jsdom */

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Skeleton } from "./index";

afterEach(cleanup);

describe("Skeleton", () => {
  it("renders a decorative placeholder", () => {
    const { container } = render(<Skeleton width="8rem" />);
    const bone = container.querySelector("span");
    expect(bone?.getAttribute("aria-hidden")).toBe("true");
    expect(bone?.getAttribute("style")).toContain("8rem");
  });
});
