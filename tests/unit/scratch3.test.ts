import { describe, expect, it, vi } from "vitest";
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
              name: "Test Template",
              language: "es",
              status: "approved",
              body: "Hola {{1}}, tu código es {{2}}",
              variablesMap: {
                header_1: "URL del documento",
                body_1: "Nombre del cliente",
                body_2: "Código de acceso",
              },
            },
          ],
          () => {},
        ],
        ["t1", () => {}],
        [{}, () => {}],
        [false, () => {}],
        [null, () => {}],
      ];

      // If we are calling useState for a new render cycle, reset if it exceeds 5
      if (stateIndex >= 5) stateIndex = 0;
      
      return states[stateIndex++];
    },
    useEffect: () => {},
  };
});

describe("Template UI Presentation", () => {
  it("renders headers, variables, and footer", () => {
    stateIndex = 0; // reset before test
    const html = renderToString(
      React.createElement(TemplateSender, {
        conversationId: "test-conv",
        onSent: () => {},
      })
    );
    console.log(html);
  });
});
