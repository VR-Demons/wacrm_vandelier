import { describe, expect, it } from "vitest";
import { buildTemplateComponents } from "@/server/whatsapp/templatePayload";

describe("buildTemplateComponents", () => {
  it("builds payload for body text variables", () => {
    const template = {
      body: "Hello {{1}}, your code is {{2}}"
    };
    const result = buildTemplateComponents(template, {
      body_1: "John",
      body_2: "1234"
    });
    
    expect(result).toEqual([
      {
        type: "body",
        parameters: [
          { type: "text", text: "John" },
          { type: "text", text: "1234" }
        ]
      }
    ]);
  });

  it("sanitizes newlines in body parameter values to prevent Meta error 132018", () => {
    const template = {
      body: "Items: {{lista_items}}"
    };
    const result = buildTemplateComponents(template, {
      lista_items: "Item 1\nItem 2\r\nItem 3"
    });

    expect(result).toEqual([
      {
        type: "body",
        parameters: [
          { type: "text", parameter_name: "lista_items", text: "Item 1 — Item 2 — Item 3" }
        ]
      }
    ]);
  });

  it("builds payload with named parameter_name for custom variables", () => {
    const template = {
      body: "Ref: {{referencias}}"
    };
    const result = buildTemplateComponents(template, {
      referencias: "REF-001 / REF-002"
    });

    expect(result).toEqual([
      {
        type: "body",
        parameters: [
          { type: "text", parameter_name: "referencias", text: "REF-001 / REF-002" }
        ]
      }
    ]);
  });

  it("builds payload with header text variable", () => {
    const template = {
      header: { format: "TEXT", text: "Alert {{1}}" },
      body: "Message"
    };
    const result = buildTemplateComponents(template, {
      header_1: "Warning"
    });

    expect(result).toEqual([
      {
        type: "header",
        parameters: [
          { type: "text", text: "Warning" }
        ]
      }
    ]);
  });

  it("builds payload with header image variable", () => {
    const template = {
      header: { format: "IMAGE" },
      body: "Message"
    };
    const result = buildTemplateComponents(template, {
      header_1: "https://example.com/img.png"
    });

    expect(result).toEqual([
      {
        type: "header",
        parameters: [
          { type: "image", image: { link: "https://example.com/img.png" } }
        ]
      }
    ]);
  });

  it("falls back to logo for header image if variable is missing", () => {
    const template = {
      header: { format: "IMAGE" },
      body: "Message"
    };
    const result = buildTemplateComponents(template, {}, "https://fallback.com/logo.png");

    expect(result).toEqual([
      {
        type: "header",
        parameters: [
          { type: "image", image: { link: "https://fallback.com/logo.png" } }
        ]
      }
    ]);
  });

  it("builds payload with button url variable", () => {
    const template = {
      body: "Message",
      buttons: [
        { type: "URL", url: "https://example.com/{{1}}" }
      ]
    };
    const result = buildTemplateComponents(template, {
      button_0_1: "my-path"
    });

    expect(result).toEqual([
      {
        type: "button",
        sub_type: "url",
        index: "0",
        parameters: [
          { type: "text", text: "my-path" }
        ]
      }
    ]);
  });

  it("builds payload for aviso_adeudo_moral with named parameters and sanitizes newlines", () => {
    const template = {
      body: "Hola *{{contacto}}*, pago de {{producto}} a nombre de *{{empresa}}*: {{lista_adeudos}} Referencia: {{referencias}}"
    };
    const result = buildTemplateComponents(template, {
      contacto: "DIEGO",
      producto: "los préstamos",
      empresa: "Garciacano Garcia Diego",
      lista_adeudos: "• Folio 001227\n• Folio 001304",
      referencias: "001227, 001304"
    });

    expect(result).toEqual([
      {
        type: "body",
        parameters: [
          { type: "text", parameter_name: "contacto", text: "DIEGO" },
          { type: "text", parameter_name: "producto", text: "los préstamos" },
          { type: "text", parameter_name: "empresa", text: "Garciacano Garcia Diego" },
          { type: "text", parameter_name: "lista_adeudos", text: "• Folio 001227 — • Folio 001304" },
          { type: "text", parameter_name: "referencias", text: "001227, 001304" }
        ]
      }
    ]);
  });

  it("builds payload for aviso_adeudo_fisica with named parameters", () => {
    const template = {
      body: "Hola *{{cliente}}*, pago de {{producto}}: {{lista_adeudos}} Referencia: {{referencias}}"
    };
    const result = buildTemplateComponents(template, {
      cliente: "Carlos Mendoza",
      producto: "tu préstamo",
      lista_adeudos: "• Folio 002100 - $12,450.00 MXN",
      referencias: "002100"
    });

    expect(result).toEqual([
      {
        type: "body",
        parameters: [
          { type: "text", parameter_name: "cliente", text: "Carlos Mendoza" },
          { type: "text", parameter_name: "producto", text: "tu préstamo" },
          { type: "text", parameter_name: "lista_adeudos", text: "• Folio 002100 - $12,450.00 MXN" },
          { type: "text", parameter_name: "referencias", text: "002100" }
        ]
      }
    ]);
  });
});
