import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../src/app/api/public/v1/messages/route";
import * as auth from "../../src/lib/auth/public-api";

vi.mock("../../src/lib/auth/public-api", () => ({
  validateRequestApiKey: vi.fn(),
}));

vi.mock("../../src/server/inbox/identity", () => ({
  getOrCreateContactByIdentity: vi.fn().mockResolvedValue({
    contact: { id: "c_phone_123" },
  }),
}));

vi.mock("../../src/server/inbox/ingest", () => ({
  getOrCreateConversation: vi.fn().mockResolvedValue({
    id: "conv_123",
  }),
}));

vi.mock("../../src/server/whatsapp/templates", () => ({
  sendTemplate: vi.fn().mockResolvedValue({ messageId: "msg_tpl_123" }),
  TemplateError: class TemplateError extends Error {
    code = "invalid";
  },
}));

vi.mock("../../src/lib/db", () => {
  const mockDb = {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
    })),
    query: {
      template: {
        findFirst: vi.fn(),
      },
      conversation: {
        findFirst: vi.fn(),
      },
    },
  };
  return { getDb: () => mockDb };
});

import { getDb } from "../../src/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = getDb() as any;

describe("POST /api/public/v1/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if unauthorized", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue(null);
    const req = new Request("http://localhost/api/public/v1/messages", { method: "POST" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("inserts single message into outbox", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue({ organizationId: "org_1" });
    const req = new Request("http://localhost/api/public/v1/messages", {
      method: "POST",
      body: JSON.stringify({ contactId: "c_1", message: "Hello!" }),
    });
    
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it("inserts batch messages into outbox", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue({ organizationId: "org_1" });
    const req = new Request("http://localhost/api/public/v1/messages", {
      method: "POST",
      body: JSON.stringify([
        { contactId: "c_1", message: "Hello 1" },
        { contactId: "c_2", message: "Hello 2" }
      ]),
    });
    
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.summary.total).toBe(2);
    expect(db.insert).toHaveBeenCalledTimes(2);
  });

  it("resolves phone number to contact and queues message", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue({ organizationId: "org_1" });
    const req = new Request("http://localhost/api/public/v1/messages", {
      method: "POST",
      body: JSON.stringify({ phone: "+5215512345678", message: "Hello by phone!" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(db.insert).toHaveBeenCalled();
  });

  it("queues template message into outbox", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue({ organizationId: "org_1" });
    db.query.template.findFirst.mockResolvedValue({
      id: "tpl_123",
      name: "aviso_pago",
      status: "approved",
      language: "es_MX",
    });

    const req = new Request("http://localhost/api/public/v1/messages", {
      method: "POST",
      body: JSON.stringify({
        phone: "+5215512345678",
        template: "aviso_pago",
        variables: { "1": "Jane", "2": "$1,200.00" },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.queueIds).toHaveLength(1);
    expect(db.insert).toHaveBeenCalled();
  });

  it("sends template message immediately when immediate is true", async () => {
    vi.mocked(auth.validateRequestApiKey).mockResolvedValue({ organizationId: "org_1" });
    db.query.template.findFirst.mockResolvedValue({
      id: "tpl_123",
      name: "aviso_pago",
      status: "approved",
      language: "es_MX",
    });
    db.query.conversation.findFirst.mockResolvedValue({
      id: "conv_123",
    });

    const req = new Request("http://localhost/api/public/v1/messages", {
      method: "POST",
      body: JSON.stringify({
        phone: "+5215512345678",
        template: "aviso_pago",
        variables: ["Jane", "$1,200.00"],
        immediate: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.sentMessageIds).toEqual(["msg_tpl_123"]);
  });
});
