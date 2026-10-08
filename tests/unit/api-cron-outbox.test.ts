import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../../src/app/api/internal/cron/process-outbox/route";
import * as sendModule from "../../src/server/inbox/send";

vi.mock("../../src/lib/db", () => {
  const mockDb = {
    query: {
      outboxMessage: { findMany: vi.fn() },
      organization: { findFirst: vi.fn() },
      conversation: { findFirst: vi.fn() },
    },
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
  };
  return { getDb: () => mockDb };
});

import { getDb } from "../../src/lib/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = getDb() as any;

vi.mock("../../src/server/inbox/send", () => ({
  sendText: vi.fn(),
}));

describe("POST /api/internal/cron/process-outbox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "secret";
  });

  it("returns 401 if secret is invalid", async () => {
    const req = new Request("http://localhost/api/cron", {
      method: "POST",
      headers: { "Authorization": "Bearer wrong" }
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("processes outbox messages sequentially", async () => {
    vi.mocked(db.query.outboxMessage.findMany).mockResolvedValue([
      { id: "msg_1", organizationId: "org_1", payload: { to: "c_1", text: "Hello 1" } },
      { id: "msg_2", organizationId: "org_1", payload: { to: "c_2", text: "Hello 2" } },
    ]);
    vi.mocked(db.query.organization.findFirst).mockResolvedValue({ id: "org_1", outboxDelayLimit: 10 });
    vi.mocked(db.query.conversation.findFirst).mockResolvedValue({ id: "conv_1" });
    vi.mocked(sendModule.sendText).mockResolvedValue({ messageId: "123" });

    const req = new Request("http://localhost/api/cron", {
      method: "POST",
      headers: { "Authorization": "Bearer secret" }
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(sendModule.sendText).toHaveBeenCalledTimes(2);
    expect(db.update).toHaveBeenCalledTimes(2); // updates status to sent
  });
});
