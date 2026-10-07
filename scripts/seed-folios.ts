import { readFileSync } from "node:fs";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { PG_CONNECTION_OPTIONS } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { normalizeContactPhone } from "@/lib/phone";
import { upsertContactFolios } from "@/server/folios";

function loadEnvVar(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  try {
    const env = readFileSync(".env", "utf8");
    const line = env.split(/\r?\n/).find((l) => l.startsWith(`${name}=`));
    return line?.slice(name.length + 1).trim();
  } catch {
    return undefined;
  }
}

const EXAMPLE_FOLIOS = [
  {
    Folio: 796,
    Cliente: "Garciacano Garcia Diego",
    FechaExigibilidad: "2026-10-01T06:00:00.000Z",
    Producto: "PRESTAMO",
    Total: 9000,
    Pagado: false,
    Mora: 0,
    Telefono: "5521738363",
    Correo: "",
    Contacto: "Pamela Chavez",
    RFC: "",
    Personalidad: "MORAL",
    id: 4564,
  },
  {
    Folio: 966,
    Cliente: "COQUILUB SA DE CV ",
    FechaExigibilidad: "2026-10-01T06:00:00.000Z",
    Producto: "PRESTAMO",
    Total: 453077.91,
    Pagado: false,
    Mora: 0,
    Telefono: "5521738363",
    Correo: "",
    Contacto: "Pamela Chavez",
    RFC: "",
    Personalidad: "MORAL",
    id: 4565,
  },
];

async function main() {
  const url = loadEnvVar("DATABASE_URL");
  if (!url) {
    console.error("[seed-folios] DATABASE_URL no está definida");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1, ...PG_CONNECTION_OPTIONS });
  const db = drizzle(sql, { schema });

  const orgs = await db.select().from(schema.organization).limit(1);
  const org = orgs[0];
  if (!org) {
    console.error("[seed-folios] No se encontró ninguna organización en la base de datos.");
    await sql.end();
    process.exit(1);
  }

  console.log(`[seed-folios] Insertando folios de ejemplo para la organización: ${org.name} (${org.id})...`);

  // Ejecutar upsert mediante la lógica centralizada del servidor
  const upserted = await upsertContactFolios(org.id, EXAMPLE_FOLIOS);

  console.log(`[seed-folios] Éxito: ${upserted.length} folios procesados.`);
  for (const f of upserted) {
    console.log(
      `  - Folio #${f.folio}: Tel ${f.phone} (original: ${f.rawPhone}), Producto: ${f.producto}, Exigibilidad: ${f.fechaExigibilidad?.toISOString()}, ContactoID: ${f.contactId ?? "Aún sin contacto en CRM"}`
    );
  }

  await sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("[seed-folios] Error fatal:", err);
  process.exit(1);
});
