import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { AppNav } from "@/components/app-nav";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) =>
    React.createElement("a", { href, ...props }, children),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/contacts",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/components/use-events", () => ({
  useEvents: vi.fn(),
}));

const mockBranding = {
  name: "Vandelier CRM",
  accent: "#2563eb",
  currency: "USD" as const,
  favicon: null,
};

describe("AppNav - Base de Datos menu item", () => {
  it("renders Base de Datos with link to https://vandelierai.com/ in the same tab", () => {
    const html = renderToString(
      React.createElement(AppNav, {
        branding: mockBranding,
        userName: "Test User",
        role: "owner",
        theme: "light",
      })
    );

    expect(html).toContain("Base de Datos");
    expect(html).toContain('href="https://vandelierai.com/"');
    // Ensure it does not have target="_blank" since user requested same tab navigation
    expect(html).not.toMatch(/href="https:\/\/vandelierai\.com\/"[^>]*target="_blank"/);
  });

  it("is visible to all user roles including operador", () => {
    const htmlAdmin = renderToString(
      React.createElement(AppNav, {
        branding: mockBranding,
        userName: "Admin User",
        role: "admin",
        theme: "light",
      })
    );
    expect(htmlAdmin).toContain("Base de Datos");

    const htmlOperador = renderToString(
      React.createElement(AppNav, {
        branding: mockBranding,
        userName: "Operador User",
        role: "operador",
        theme: "light",
      })
    );
    expect(htmlOperador).toContain("Base de Datos");
    expect(htmlOperador).toContain('href="https://vandelierai.com/"');
    // Operador should still have restricted items hidden
    expect(htmlOperador).not.toContain('href="/results"');
    expect(htmlOperador).not.toContain('href="/agent"');
    expect(htmlOperador).not.toContain('href="/lab"');
  });

  it("maintains correct position after Contactos even when agenda is enabled", () => {
    const htmlAgenda = renderToString(
      React.createElement(AppNav, {
        branding: mockBranding,
        userName: "Owner User",
        role: "owner",
        theme: "light",
        agenda: true,
      })
    );

    const contactosIndex = htmlAgenda.indexOf("Contactos");
    const baseDeDatosIndex = htmlAgenda.indexOf("Base de Datos");
    const resultadosIndex = htmlAgenda.indexOf("Resultados");

    expect(contactosIndex).toBeGreaterThan(0);
    expect(baseDeDatosIndex).toBeGreaterThan(contactosIndex);
    expect(resultadosIndex).toBeGreaterThan(baseDeDatosIndex);
  });
});
