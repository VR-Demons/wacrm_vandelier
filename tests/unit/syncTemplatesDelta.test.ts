import { describe, expect, it } from "vitest";
import { computeSyncDelta, LocalTemplate, RemoteTemplate } from "@/server/whatsapp/templatesDelta";

describe("computeSyncDelta", () => {
  it("returns toDelete for local templates missing from remote", () => {
    const local: LocalTemplate[] = [
      { id: "1", name: "old_template", language: "es", status: "approved", category: "UTILITY" },
    ];
    const remote: RemoteTemplate[] = [
      { name: "new_template", language: "es", status: "APPROVED", components: [] }
    ];
    
    const delta = computeSyncDelta(local, remote);
    expect(delta.toDelete).toEqual(["1"]);
    expect(delta.toInsert).toHaveLength(1);
    expect(delta.toUpdate).toHaveLength(0);
  });

  it("returns toUpdate for templates that exist in both and parses components", () => {
    const local: LocalTemplate[] = [
      { id: "1", name: "existing", language: "es", status: "pending", category: "MARKETING" },
    ];
    const remote: RemoteTemplate[] = [
      { 
        id: "meta123",
        name: "existing", 
        language: "es", 
        status: "APPROVED", 
        category: "MARKETING",
        components: [
          { type: "BODY", text: "Hello {{1}}" },
          { type: "HEADER", format: "IMAGE" }
        ]
      }
    ];

    const delta = computeSyncDelta(local, remote);
    
    expect(delta.toDelete).toHaveLength(0);
    expect(delta.toInsert).toHaveLength(0);
    expect(delta.toUpdate).toHaveLength(1);
    expect(delta.toUpdate[0]!.id).toBe("1");
    expect(delta.toUpdate[0]!.data.status).toBe("approved");
    expect(delta.toUpdate[0]!.data.body).toBe("Hello {{1}}");
    expect(delta.toUpdate[0]!.data.header).toEqual({ type: "HEADER", format: "IMAGE" });
    expect(delta.toUpdate[0]!.data.variablesMap).toEqual({
      header_1: "Imagen (URL)",
      body_1: "Parámetro 1"
    });
  });

  it("returns toInsert for new templates from remote", () => {
    const local: LocalTemplate[] = [];
    const remote: RemoteTemplate[] = [
      { 
        id: "meta123",
        name: "new_one", 
        language: "en", 
        status: "APPROVED", 
        category: "UTILITY",
        components: [
          { type: "BODY", text: "Alert {{1}}" },
          { type: "FOOTER", text: "Bye" },
          { type: "BUTTONS", buttons: [{ url: "https://example.com" }] }
        ]
      }
    ];

    const delta = computeSyncDelta(local, remote);
    
    expect(delta.toDelete).toHaveLength(0);
    expect(delta.toUpdate).toHaveLength(0);
    expect(delta.toInsert).toHaveLength(1);
    
    const insert = delta.toInsert[0]!;
    expect(insert.name).toBe("new_one");
    expect(insert.language).toBe("en");
    expect(insert.status).toBe("approved");
    expect(insert.body).toBe("Alert {{1}}");
    expect(insert.footer).toBe("Bye");
    expect(insert.buttons).toEqual([{ url: "https://example.com" }]);
    expect(insert.variablesMap).toEqual({ body_1: "Parámetro 1" });
  });
});
