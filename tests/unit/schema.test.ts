import { describe, it, expect } from "vitest";
import { apiKey, outboxMessage, organization, message } from "../../src/lib/db/schema";

describe("Database Schema (Public API & Outbox)", () => {
  it("exports apiKey table with expected columns", () => {
    expect(apiKey).toBeDefined();
    // Use Drizzle's getTableConfig or just check object keys
    const cols = Object.keys(apiKey);
    expect(cols).toContain("id");
    expect(cols).toContain("organizationId");
    expect(cols).toContain("keyHash");
    expect(cols).toContain("prefix");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("lastUsedAt");
  });

  it("exports outboxMessage table with expected columns", () => {
    expect(outboxMessage).toBeDefined();
    const cols = Object.keys(outboxMessage);
    expect(cols).toContain("id");
    expect(cols).toContain("organizationId");
    expect(cols).toContain("payload");
    expect(cols).toContain("status");
    expect(cols).toContain("error");
    expect(cols).toContain("createdAt");
    expect(cols).toContain("scheduledFor");
  });

  it("organization table has outboxDelayLimit column", () => {
    const cols = Object.keys(organization);
    expect(cols).toContain("outboxDelayLimit");
  });

  it("message.origin enum includes api and bot", () => {
    const originEnum = message.origin.enumValues;
    expect(originEnum).toContain("api");
    expect(originEnum).toContain("bot");
  });
});
