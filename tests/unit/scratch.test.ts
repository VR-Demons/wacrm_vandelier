import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TemplateSender } from "@/components/inbox/template-sender";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: any) => {
      if (initial === null) {
        return [
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
        ];
      }
      if (initial === "") {
        return ["t1", () => {}];
      }
      return actual.useState(initial);
    },
    useEffect: () => {},
  };
});

describe("Template UI Presentation", () => {
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
