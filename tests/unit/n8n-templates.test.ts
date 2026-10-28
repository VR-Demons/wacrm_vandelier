/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/public/v1/n8n/templates/route";
import { validateRequestApiKey } from "@/lib/auth/public-api";
import { getOrCreateContactByIdentity } from "@/server/inbox/identity";
import { getOrCreateConversation } from "@/server/inbox/ingest";
import { upsertContactFolios } from "@/server/folios";
import { moveLeadToStage } from "@/server/leads/stage-history";
import { getDb } from "@/lib/db";

vi.mock("@/lib/auth/public-api", () => ({ validateRequestApiKey: vi.fn() }));
vi.mock("@/server/inbox/identity", () => ({
  getOrCreateContactByIdentity: vi.fn(),
  BSUID_PREFIX: "bsuid:",
}));
vi.mock("@/server/inbox/ingest", () => ({ getOrCreateConversation: vi.fn() }));
vi.mock("@/server/folios", () => ({ upsertContactFolios: vi.fn() }));
vi.mock("@/server/leads/stage-history", () => ({ moveLeadToStage: vi.fn() }));
vi.mock("@/lib/db", () => {
  const db = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(),
    })),
  };
  return { getDb: () => db, schema: { template: {}, lead: {}, outboxMessage: {} } };
});

describe("n8n webhook integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes payload correctly, upserts data, and inserts outbox", async () => {
    vi.mocked(validateRequestApiKey).mockResolvedValue({ organizationId: "org-1" } as any);
    
    vi.mocked(getOrCreateContactByIdentity).mockResolvedValue({
      contact: { id: "c-1", phone: "5215512345678" } as any,
      isNew: false
    });
    vi.mocked(getOrCreateConversation).mockResolvedValue({ id: "conv-1" } as any);

    const db = getDb() as any;
    const { schema } = await import("@/lib/db");
    db.select.mockImplementation(() => ({
      from: (table: any) => ({
        where: () => ({
          limit: vi.fn().mockImplementation(() => {
            if (table === schema.template) return Promise.resolve([{ id: "tpl-1", name: "test_tpl", pipelineStageId: "stage-1" }]);
            if (table === schema.lead) return Promise.resolve([{ id: "lead-1" }]);
            return Promise.resolve([]);
          })
        }),
      }),
    }));

    const req = new Request("http://localhost/api/public/v1/n8n/templates", {
      method: "POST",
      body: JSON.stringify({
        records: [
          {
            phone: "5215512345678",
            name: "John Doe",
            folio: 100,
            templateName: "test_tpl"
          }
        ]
      })
    });

    const res = await POST(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.summary.success).toBe(1);

    expect(getOrCreateContactByIdentity).toHaveBeenCalledWith("org-1", {
      identity: "525512345678",
      phone: "525512345678",
      profileName: "John Doe",
      waUserId: null
    });
    
    expect(upsertContactFolios).toHaveBeenCalledWith("org-1", [
      expect.objectContaining({ phone: "5215512345678", folio: 100 })
    ]);

    expect(moveLeadToStage).toHaveBeenCalledWith({
      organizationId: "org-1",
      leadId: "lead-1",
      toStageId: "stage-1",
      source: "sistema"
    });

    expect(db.insert).toHaveBeenCalled();
  });

  it("handles missing template match by adding to errors array", async () => {
    vi.mocked(validateRequestApiKey).mockResolvedValue({ organizationId: "org-1" } as any);
    vi.mocked(getOrCreateContactByIdentity).mockResolvedValue({
      contact: { id: "c-1", phone: "5215512345678" } as any,
      isNew: false
    });
    vi.mocked(getOrCreateConversation).mockResolvedValue({ id: "conv-1" } as any);

    const db = getDb() as any;
    const { schema } = await import("@/lib/db");
    db.select.mockImplementation(() => ({
      from: (table: any) => ({
        where: () => ({
          limit: vi.fn().mockResolvedValue([]), // template not found
        }),
      }),
    }));

    const req = new Request("http://localhost/api/public/v1/n8n/templates", {
      method: "POST",
      body: JSON.stringify({
        records: [{ phone: "5215512345678", templateName: "non_existent" }]
      })
    });

    const res = await POST(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.summary.error).toBe(1);
    expect(json.errors[0].error).toBe("Template not found: non_existent");
  });

  it("queues messages for delivery", async () => {
    vi.mocked(validateRequestApiKey).mockResolvedValue({ organizationId: "org-1" } as any);
    vi.mocked(getOrCreateContactByIdentity).mockResolvedValue({
      contact: { id: "c-1", phone: "5215512345678" } as any,
      isNew: false
    });
    vi.mocked(getOrCreateConversation).mockResolvedValue({ id: "conv-1" } as any);

    const db = getDb() as any;
    const { schema } = await import("@/lib/db");
    const valuesMock = vi.fn();
    db.insert.mockImplementation(() => ({ values: valuesMock }));
    db.select.mockImplementation(() => ({
      from: (table: any) => ({
        where: () => ({
          limit: vi.fn().mockImplementation(() => {
             if (table === schema.template) return Promise.resolve([{ id: "tpl-1", name: "test_tpl", pipelineStageId: null }]);
             return Promise.resolve([]);
          })
        }),
      }),
    }));

    const req = new Request("http://localhost/api/public/v1/n8n/templates", {
      method: "POST",
      body: JSON.stringify({
        records: [
          { phone: "5215512345678", templateName: "test_tpl", templateVariables: { var1: "val" } }
        ]
      })
    });

    const res = await POST(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.summary.success).toBe(1);
    expect(json.queueIds.length).toBe(1);

    expect(valuesMock).toHaveBeenCalledWith(expect.objectContaining({
      type: "template",
      payload: expect.objectContaining({
        templateId: "tpl-1",
        variables: { var1: "val" }
      }),
      status: "pending"
    }));
  });
});
