import { NextResponse } from "next/server";
import { validateRequestApiKey } from "@/lib/auth/public-api";
import { getSessionOrNull } from "@/lib/auth/session";
import {
  getCollectionsScheduleSimulation,
  type GetScheduleSimulationOptions,
} from "@/server/collections/scheduleService";

export const dynamic = "force-dynamic";

/**
 * Resuelve la organización ya sea por cabecera x-api-key o por sesión web activa.
 */
async function resolveOrganizationId(req: Request): Promise<string | null> {
  const apiKeyAuth = await validateRequestApiKey(req);
  if (apiKeyAuth?.organizationId) {
    return apiKeyAuth.organizationId;
  }

  const session = await getSessionOrNull();
  if (session?.organizationId) {
    return session.organizationId;
  }

  return null;
}

export async function GET(req: Request) {
  const organizationId = await resolveOrganizationId(req);
  // Permitimos simular incluso sin tenant específico si se consulta directamente n8n,
  // pero si el API exige autenticación y hay API Key inválida, validamos:
  const keyHeader = req.headers.get("x-api-key");
  if (keyHeader && !organizationId) {
    return NextResponse.json({ error: "Unauthorized: Invalid API Key" }, { status: 401 });
  }

  const url = new URL(req.url);
  const referenceDate =
    url.searchParams.get("date") ||
    url.searchParams.get("dia") ||
    url.searchParams.get("referenceDate") ||
    undefined;
  const timeZone =
    url.searchParams.get("timeZone") ||
    url.searchParams.get("timezone") ||
    url.searchParams.get("tz") ||
    url.searchParams.get("zona_horaria") ||
    "America/Mexico_City";
  const flow =
    url.searchParams.get("flow") ||
    url.searchParams.get("flujo") ||
    url.searchParams.get("tipo_flujo") ||
    "ALL";
  const forceAllFlowsActive = url.searchParams.get("forceAllFlowsActive") === "true";
  const sourceParam = url.searchParams.get("source");
  const source: "n8n" | "db" | "auto" =
    sourceParam === "n8n" || sourceParam === "db" ? sourceParam : "auto";

  try {
    const simulation = await getCollectionsScheduleSimulation({
      source,
      organizationId: organizationId || undefined,
      referenceDate,
      timeZone,
      flow,
      forceAllFlowsActive,
    });

    return NextResponse.json({
      success: true,
      ...simulation,
    });
  } catch (error) {
    console.error("[getschedule] Error ejecutando simulación:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno al simular cobranza",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const organizationId = await resolveOrganizationId(req);
  const keyHeader = req.headers.get("x-api-key");
  if (keyHeader && !organizationId) {
    return NextResponse.json({ error: "Unauthorized: Invalid API Key" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const url = new URL(req.url);
  const referenceDate =
    (body.referenceDate as string | undefined) ||
    (body.date as string | undefined) ||
    (body.dia as string | undefined) ||
    url.searchParams.get("date") ||
    url.searchParams.get("dia") ||
    url.searchParams.get("referenceDate") ||
    undefined;
  const timeZone =
    (body.timeZone as string | undefined) ||
    (body.timezone as string | undefined) ||
    (body.tz as string | undefined) ||
    (body.zona_horaria as string | undefined) ||
    url.searchParams.get("timeZone") ||
    url.searchParams.get("timezone") ||
    url.searchParams.get("tz") ||
    url.searchParams.get("zona_horaria") ||
    "America/Mexico_City";
  const flow =
    (body.flow as string | undefined) ||
    (body.flujo as string | undefined) ||
    (body.tipo_flujo as string | undefined) ||
    url.searchParams.get("flow") ||
    url.searchParams.get("flujo") ||
    url.searchParams.get("tipo_flujo") ||
    "ALL";
  const flows = Array.isArray(body.flows) ? (body.flows as string[]) : undefined;
  const forceAllFlowsActive =
    body.forceAllFlowsActive === true ||
    url.searchParams.get("forceAllFlowsActive") === "true";
  const source =
    body.source === "n8n" || body.source === "db"
      ? body.source
      : (url.searchParams.get("source") as "n8n" | "db") || "auto";

  try {
    const simOptions: GetScheduleSimulationOptions = {
      source,
      organizationId: organizationId || undefined,
      referenceDate,
      timeZone,
      flow,
      flows,
      forceAllFlowsActive,
      overrideExigibilidad: Array.isArray(body.exigibilidadClients)
        ? (body.exigibilidadClients as any[])
        : Array.isArray(body.exigibilidadData)
        ? (body.exigibilidadData as any[])
        : undefined,
      overrideAtrasados: Array.isArray(body.atrasadosClients)
        ? (body.atrasadosClients as any[])
        : Array.isArray(body.atrasadosData)
        ? (body.atrasadosData as any[])
        : undefined,
      overrideConfig:
        body.config && typeof body.config === "object"
          ? (body.config as any)
          : undefined,
    };

    const simulation = await getCollectionsScheduleSimulation(simOptions);

    return NextResponse.json({
      success: true,
      ...simulation,
    });
  } catch (error) {
    console.error("[getschedule] Error ejecutando simulación (POST):", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error interno al simular cobranza",
      },
      { status: 500 }
    );
  }
}
