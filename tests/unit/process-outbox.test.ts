/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/internal/cron/process-outbox/route";
import { sendText } from "@/server/inbox/send";
import { sendTemplate } from "@/server/whatsapp/templates";
import { getDb } from "@/lib/db";

vi.mock("@/lib/db", () => {
  const db = {
    query: {
      outboxMessage: {
        findMany: vi.fn(),
      },
      organization: {
        findFirst: vi.fn(),
      },
      conversation: {
        findFirst: vi.fn(),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(),
      })),
    })),
  };
  return { getDb: () => db };
});

vi.mock("@/server/inbox/send", () => ({ sendText: vi.fn() }));
vi.mock("@/server/whatsapp/templates", () => ({ sendTemplate: vi.fn() }));

describe("process-outbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("llama a sendTemplate cuando msg.type es 'template'", async () => {
    const db = getDb() as any;
    process.env.CRON_SECRET = "test-secret";
    
    db.query.outboxMessage.findMany.mockResolvedValue([
      {
        id: "1",
        organizationId: "org-1",
        type: "template",
        payload: { to: "contact-1", templateId: "tpl-1", variables: { k: "v" } },
        status: "pending",
      },
    ]);
    db.query.organization.findFirst.mockResolvedValue({ id: "org-1", outboxDelayLimit: 0 });
    db.query.conversation.findFirst.mockResolvedValue({ id: "conv-1", contactId: "contact-1" });

    const req = new Request("http://localhost/api/internal/cron/process-outbox", {
      method: "POST",
      headers: { authorization: `Bearer test-secret` },
    });

    const res = await POST(req);
    const json = await res.json();

    expect(json.success).toBe(true);
    expect(json.processed).toBe(1);
    expect(sendTemplate).toHaveBeenCalledWith({
      conversationId: "conv-1",
      organizationId: "org-1",
      templateId: "tpl-1",
      variables: { k: "v" },
    });
    expect(sendText).not.toHaveBeenCalled();
  });
});
