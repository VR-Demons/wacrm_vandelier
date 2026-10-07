import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TemplateSender } from "@/components/inbox/template-sender";

describe("Template UI Presentation", () => {
  let useStateSpy: any;

  beforeEach(() => {
    let stateIndex = 0;
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
        vi.fn(),
      ],
      ["t1", vi.fn()],
      [{}, vi.fn()],
      [false, vi.fn()],
      [null, vi.fn()],
    ];

    useStateSpy = vi.spyOn(React, "useState").mockImplementation((init) => {
      if (stateIndex < states.length) {
        return states[stateIndex++];
      }
      return [init, vi.fn()];
    });
  });

  afterEach(() => {
    useStateSpy.mockRestore();
  });

  it("renders correctly", () => {
    const html = renderToString(
      React.createElement(TemplateSender, {
        conversationId: "test-conv",
        onSent: () => {},
      })
    );
    console.log(html);
  });
});
