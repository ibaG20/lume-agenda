import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("manifest", () => {
  it("describes an installable Agendinha app", () => {
    const data = manifest();

    expect(data.name).toBe("Agendinha");
    expect(data.short_name).toBe("Agendinha");
    expect(data.display).toBe("standalone");
    expect(data.start_url).toBe("/inicio");
    expect(data.icons?.map((icon) => icon.src)).toEqual([
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      "/icons/icon-maskable-512.png",
    ]);
  });
});
