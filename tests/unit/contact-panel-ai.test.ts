import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ContactPanel } from "@/components/inbox/contact-panel";
import type { ConversationDto } from "@/lib/types";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("ContactPanel - Visibilidad de IA en esta conversación", () => {
  const mockConversation: ConversationDto = {
    id: "conv-1",
    channel: "whatsapp",
    contact: {
      id: "cont-1",
      name: "Juan Pérez",
      phone: "+5215512345678",
    },
    stageName: null,
    aiEnabled: true,
    handoffAt: null,
    handoffReason: null,
    lastInboundAt: new Date().toISOString(),
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
    windowOpen: true,
    windowRemainingMs: 86400000,
    preview: null,
    anuncio: null,
  };

  it("oculta la sección 'IA en esta conversación' cuando la configuración principal de IA no está activa", () => {
    const html = renderToString(
      React.createElement(ContactPanel, {
        conversation: mockConversation,
        refreshKey: 1,
        onPatchConversation: vi.fn(),
        onClose: vi.fn(),
      })
    );

    // Con brain inicial (null / sin activar por admin), la sección no debe aparecer
    expect(html).not.toContain("IA en esta conversación");
  });
});
