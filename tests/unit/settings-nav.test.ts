import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { SettingsNav } from "../../src/components/settings/settings-nav";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings",
}));

describe("SettingsNav", () => {
  it("renders the Desarrollador tab", () => {
    const html = renderToString(React.createElement(SettingsNav, {}));
    expect(html).toContain("Desarrollador");
    expect(html).toContain('href="/settings/developer"');
  });
});
