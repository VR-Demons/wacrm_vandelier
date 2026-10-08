import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { DeveloperSettingsClient } from "../../src/app/(app)/settings/developer/client";

describe("DeveloperSettingsClient", () => {
  it("renders the developer settings UI", () => {
    const html = renderToString(React.createElement(DeveloperSettingsClient, {
      initialDelay: 1000,
      initialPrefix: "sk_live_1234",
      organizationId: "org_1",
    }));
    
    // Assert real behavior visible to user
    expect(html).toContain("1000"); // delay value
    expect(html).toContain("sk_live_1234"); // prefix
    expect(html).toContain("Generar Nueva Clave API");
  });
});
