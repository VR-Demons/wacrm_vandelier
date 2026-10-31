import {
  simulateCollectionsRun,
  type ClientRecord,
  type SimulatorConfig,
  type SimulationOptions,
  type SimulationResult
} from "@/services/collectionsSimulator";
import { getDb, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";

const N8N_DEFAULT_URL = "https://n8n.vandelierai.com";
const TABLE_ID_EXIGIBILIDAD = "H3fj5bUAAZK83wqY"; // Bot_Clients
const TABLE_ID_ATRASADOS = "czLf6vCR4KpbPDVo";    // Bot_Clients_Atrasados
const TABLE_ID_CONFIG = "KTOr37TRGOev8Ywa";       // Bot_Config

export interface FetchN8nOptions {
  apiUrl?: string;
  apiKey?: string;
}

/**
 * Recupera todas las filas de una DataTable de n8n mediante paginación con nextCursor.
 */
async function fetchAllN8nTableRows(
  tableId: string,
  apiUrl: string,
  apiKey: string
): Promise<Record<string, unknown>[]> {
  const allRows: Record<string, unknown>[] = [];
  let cursor: string | null = null;
  const baseUrl = apiUrl.replace(/\/+$/, "");

  do {
    let url = `${baseUrl}/api/v1/data-tables/${tableId}/rows?limit=100`;
    if (cursor) {
      url += `&cursor=${encodeURIComponent(cursor)}`;
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-N8N-API-KEY": apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Error al consultar tabla n8n ${tableId} (status ${response.status}): ${errText}`
      );
    }

    const json = (await response.json()) as {
      data?: Record<string, unknown>[];
      nextCursor?: string | null;
    };

    if (Array.isArray(json.data)) {
      allRows.push(...json.data);
    }
    cursor = json.nextCursor ?? null;
  } while (cursor);

  return allRows;
}

/**
 * Consulta la configuración de cobranza y carteras activas desde n8n DataTables.
 */
export async function fetchN8nCollectionsData(options: FetchN8nOptions = {}): Promise<{
  exigibilidadClients: ClientRecord[];
  atrasadosClients: ClientRecord[];
  config: SimulatorConfig;
}> {
  const apiUrl = options.apiUrl || process.env.N8N_API_URL || N8N_DEFAULT_URL;
  const apiKey = options.apiKey || process.env.N8N_API_KEY;

  if (!apiKey) {
    throw new Error("N8N_API_KEY no está configurada");
  }

  const [rawConfig, rawExigibilidad, rawAtrasados] = await Promise.all([
    fetchAllN8nTableRows(TABLE_ID_CONFIG, apiUrl, apiKey),
    fetchAllN8nTableRows(TABLE_ID_EXIGIBILIDAD, apiUrl, apiKey),
    fetchAllN8nTableRows(TABLE_ID_ATRASADOS, apiUrl, apiKey),
  ]);

  const config: SimulatorConfig = {};
  for (const row of rawConfig) {
    const k = String(row.key || "");
    const v = row.value;
    if (k) {
      if (k === "flow_earlybird") config.flow_earlybird = v === "true" || v === true;
      else if (k === "flow_payday") config.flow_payday = v === "true" || v === true;
      else if (k === "flow_due") config.flow_due = v === "true" || v === true;
      else if (k === "flow_email") config.flow_email = v === "true" || v === true;
      else if (k === "test_mode") config.test_mode = v === "true" || v === true;
      else if (k === "test_phone") config.test_phone = String(v);
      else if (k === "whatsapp_template_media_id") config.whatsapp_template_media_id = String(v);
    }
  }

  return {
    exigibilidadClients: rawExigibilidad as ClientRecord[],
    atrasadosClients: rawAtrasados as ClientRecord[],
    config,
  };
}

/**
 * Consulta los folios no pagados desde la base de datos PostgreSQL local del CRM.
 */
export async function fetchDbCollectionsData(organizationId: string): Promise<{
  exigibilidadClients: ClientRecord[];
  atrasadosClients: ClientRecord[];
  config: SimulatorConfig;
}> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.contactFolio)
    .where(
      and(
        eq(schema.contactFolio.organizationId, organizationId),
        eq(schema.contactFolio.pagado, false)
      )
    );

  const exigibilidadClients: ClientRecord[] = rows.map((r) => ({
    Folio: r.folio,
    Cliente: r.cliente ?? undefined,
    FechaExigibilidad: r.fechaExigibilidad ?? undefined,
    Producto: r.producto ?? undefined,
    Total: r.total ? Number(r.total) : undefined,
    Pagado: r.pagado,
    Mora: r.mora ? Number(r.mora) : 0,
    Telefono: r.phone,
    Correo: r.correo ?? undefined,
    Contacto: r.contacto ?? undefined,
    RFC: r.rfc ?? undefined,
    Personalidad: r.personalidad ?? undefined,
  }));

  const config: SimulatorConfig = {
    flow_earlybird: true,
    flow_payday: true,
    flow_due: true,
    flow_email: false,
    test_mode: false,
    whatsapp_template_media_id: "1109845575347729",
  };

  return {
    exigibilidadClients,
    atrasadosClients: [],
    config,
  };
}

export interface GetScheduleSimulationOptions {
  source?: "n8n" | "db" | "auto";
  organizationId?: string;
  referenceDate?: Date | string;
  timeZone?: string;
  forceAllFlowsActive?: boolean;
  flow?: string;
  flows?: string[];
  overrideExigibilidad?: ClientRecord[];
  overrideAtrasados?: ClientRecord[];
  overrideConfig?: SimulatorConfig;
  n8nOptions?: FetchN8nOptions;
}

/**
 * Ejecuta la simulación de agenda de cobranza integrando n8n DataTables o la BD local del CRM.
 */
export async function getCollectionsScheduleSimulation(
  options: GetScheduleSimulationOptions = {}
): Promise<SimulationResult & { sourceUsed: "n8n" | "db" | "custom" }> {
  let exigibilidad: ClientRecord[] = options.overrideExigibilidad ?? [];
  let atrasados: ClientRecord[] = options.overrideAtrasados ?? [];
  let config: SimulatorConfig = options.overrideConfig ?? {};
  let sourceUsed: "n8n" | "db" | "custom" = "custom";

  const hasCustomData =
    (options.overrideExigibilidad && options.overrideExigibilidad.length > 0) ||
    (options.overrideAtrasados && options.overrideAtrasados.length > 0) ||
    options.overrideConfig !== undefined;

  if (!hasCustomData) {
    const sourcePref = options.source || "auto";

    if (sourcePref === "db" && options.organizationId) {
      const dbData = await fetchDbCollectionsData(options.organizationId);
      exigibilidad = dbData.exigibilidadClients;
      atrasados = dbData.atrasadosClients;
      config = { ...dbData.config, ...config };
      sourceUsed = "db";
    } else {
      try {
        const n8nData = await fetchN8nCollectionsData(options.n8nOptions);
        exigibilidad = n8nData.exigibilidadClients;
        atrasados = n8nData.atrasadosClients;
        config = { ...n8nData.config, ...config };
        sourceUsed = "n8n";
      } catch (err) {
        if (options.organizationId) {
          const dbData = await fetchDbCollectionsData(options.organizationId);
          exigibilidad = dbData.exigibilidadClients;
          atrasados = dbData.atrasadosClients;
          config = { ...dbData.config, ...config };
          sourceUsed = "db";
        } else {
          throw err;
        }
      }
    }
  }

  const simOptions: SimulationOptions = {
    referenceDate: options.referenceDate,
    timeZone: options.timeZone,
    forceAllFlowsActive: options.forceAllFlowsActive,
    flow: options.flow,
    flows: options.flows,
  };

  const simulation = simulateCollectionsRun(exigibilidad, atrasados, config, simOptions);

  return {
    ...simulation,
    sourceUsed,
  };
}
