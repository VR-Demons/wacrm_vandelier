import { describe, expect, it } from "vitest";
import { normalizeContactPhone } from "@/lib/phone";

describe("normalizeContactPhone", () => {
  it("prefixes '52' for 10-digit numbers", () => {
    expect(normalizeContactPhone("5521738363")).toBe("525521738363");
    expect(normalizeContactPhone(5521738363)).toBe("525521738363");
  });

  it("strips spaces, dashes, parentheses and '+' before prefixing", () => {
    expect(normalizeContactPhone("(55) 2173-8363")).toBe("525521738363");
    expect(normalizeContactPhone("55 2173 8363")).toBe("525521738363");
    expect(normalizeContactPhone("+55-2173-8363")).toBe("525521738363");
  });

  it("normalizes 13-digit numbers starting with 521 to 52...", () => {
    expect(normalizeContactPhone("5215521738363")).toBe("525521738363");
    expect(normalizeContactPhone("+52 1 55 2173 8363")).toBe("525521738363");
    expect(normalizeContactPhone("+52-1-(55)-2173-8363")).toBe("525521738363");
  });

  it("keeps 12-digit numbers starting with 52 as is", () => {
    expect(normalizeContactPhone("525521738363")).toBe("525521738363");
    expect(normalizeContactPhone("+52 55 2173-8363")).toBe("525521738363");
  });

  it("handles non-Mexican or international numbers appropriately", () => {
    expect(normalizeContactPhone("14155551212")).toBe("14155551212");
    expect(normalizeContactPhone("+1 415 555 1212")).toBe("14155551212");
  });

  it("returns empty string for null, undefined or empty values", () => {
    expect(normalizeContactPhone("")).toBe("");
    expect(normalizeContactPhone(null)).toBe("");
    expect(normalizeContactPhone(undefined)).toBe("");
  });
});
