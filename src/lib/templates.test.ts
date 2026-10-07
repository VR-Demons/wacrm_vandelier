import { describe, test, expect } from "vitest";
import { generateVariablesMap } from "./templates";

describe("generateVariablesMap", () => {
  test("generates map for body and header text variables", () => {
    const components = [
      {
        type: "HEADER",
        format: "TEXT",
        text: "Offer {{1}}",
      },
      {
        type: "BODY",
        text: "Hello {{1}}, get {{2}} off today!",
      },
    ];

    const result = generateVariablesMap(components);
    
    expect(result).toEqual({
      header_1: "Parámetro 1",
      body_1: "Parámetro 1",
      body_2: "Parámetro 2",
    });
  });

  test("generates map for header image format", () => {
    const components = [
      {
        type: "HEADER",
        format: "IMAGE",
      },
    ];

    const result = generateVariablesMap(components);
    
    expect(result).toEqual({
      header_1: "Imagen (URL)",
    });
  });
  
  test("generates map for buttons with variables", () => {
    const components = [
      {
        type: "BUTTONS",
        buttons: [
          {
            type: "URL",
            url: "https://example.com/{{1}}"
          }
        ]
      }
    ];

    const result = generateVariablesMap(components);
    
    expect(result).toEqual({
      button_0_1: "Parámetro 1",
    });
  });
});
