import { describe, expect, it } from "vitest";
import manifest from "./manifest";

describe("manifest", () => {
  it("describes an installable Lume Agendas app", () => {
    const data = manifest();

    expect(data.name).toBe("Lume Agendas");
    expect(data.short_name).toBe("Lume");
    expect(data.display).toBe("standalone");
    expect(data.start_url).toBe("/inicio");
    expect(data.icons?.map((icon) => icon.src)).toEqual([
      "/icons/icon-192.png",
      "/icons/icon-512.png",
      "/icons/icon-maskable-512.png",
    ]);
  });
});
