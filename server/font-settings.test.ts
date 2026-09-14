import { describe, expect, it } from "vitest";
import { readFontSize, readFontStyle } from "../client/src/lib/font-settings";

describe("font settings", () => {
  it("returns supported font size and falls back for invalid values", () => {
    expect(readFontSize("large")).toBe("large");
    expect(readFontSize("unexpected")).toBe("medium");
    expect(readFontSize(null)).toBe("medium");
  });

  it("returns supported font style and falls back for invalid values", () => {
    expect(readFontStyle("formal")).toBe("formal");
    expect(readFontStyle("unexpected")).toBe("cute");
    expect(readFontStyle(null)).toBe("cute");
  });
});
