import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TemplateSender } from "@/components/inbox/template-sender";

let stateIndex = 0;
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: any) => {
      const states = [
        [
          [
            {
              id: "t1",
              name: "Promo",
              language: "es",
              status: "approved",
              header: { format: "TEXT", text: "Header de prueba" },
              body: "Hola {{1}}, tu código es {{2}}",
              footer: "Footer de prueba",
              variablesMap: {
                header_1: "URL del documento",
                body_1: "Nombre del cliente",
                body_2: "Código de acceso",
              },
            },
          ],
          vi.fn(),
        ],
        ["t1", vi.fn()],
        [{}, vi.fn()],
        [false, vi.fn()],
        [null, vi.fn()],
      ];

      if (stateIndex >= 5) stateIndex = 0;
      return states[stateIndex++];
    },
    useEffect: vi.fn(),
  };
});

describe("Template UI Presentation", () => {
  beforeEach(() => {
    stateIndex = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("User views and fills a template", () => {
    const html = renderToString(
      React.createElement(TemplateSender, { conversationId: "test-conv", onSent: () => {} })
    );
    
    // Assert Variables
    expect(html).toContain("URL del documento");
    expect(html).toContain("Nombre del cliente");
    expect(html).toContain("Código de acceso");
    
    // Assert Header and Footer
    expect(html).toContain("Header de prueba");
    expect(html).toContain("Footer de prueba");
  });
});
