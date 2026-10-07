/**
 * Variables posicionales {{n}} del cuerpo de una plantilla de WhatsApp.
 * Puro y sin dependencias: lo usan tanto el servicio de servidor como la UI
 * (que necesita saber cuántos campos pintar antes de enviar).
 */

const VARIABLE_REGEX = /\{\{\s*(\d+)\s*\}\}/g;

/** Máximo de parámetros posicionales por cuerpo que acepta Meta. */
export const MAX_TEMPLATE_VARIABLES = 10;

/** Índices distintos de {{n}} presentes en el cuerpo, ordenados. */
function variableIndexes(body: string): number[] {
  const found = new Set<number>();
  for (const m of body.matchAll(VARIABLE_REGEX)) found.add(Number(m[1]));
  return [...found].sort((a, b) => a - b);
}

/**
 * Cuántos parámetros exige el cuerpo = el índice más alto. Con la numeración
 * validada (1..N sin saltos) equivale al número de variables distintas.
 */
export function countVariables(body: string): number {
  const indexes = variableIndexes(body);
  return indexes.length ? indexes[indexes.length - 1]! : 0;
}

/**
 * Meta acepta varias variables por cuerpo, pero exige numeración posicional
 * contigua desde {{1}}: un salto ({{1}} y {{3}}) es rechazo seguro.
 */
export function validateBodyVariables(body: string): string | null {
  const indexes = variableIndexes(body);
  if (indexes.length === 0) return null;
  if (indexes.length > MAX_TEMPLATE_VARIABLES) {
    return `El cuerpo admite hasta ${MAX_TEMPLATE_VARIABLES} variables`;
  }
  for (let i = 0; i < indexes.length; i++) {
    if (indexes[i] !== i + 1) {
      return `Las variables deben ir numeradas {{1}}, {{2}}, … sin saltos (falta {{${i + 1}}})`;
    }
  }
  return null;
}

/** Sustituye {{n}} por `variables[n-1]` (vacío si no hay valor). */
export function renderBody(body: string, variables: string[] = []): string {
  return body.replace(VARIABLE_REGEX, (_match, index: string) => {
    return variables[Number(index) - 1] ?? "";
  });
}

/**
 * Extracts positional variables from Meta template components and returns a 
 * dictionary mapping the variable keys to human-readable names.
 */
export function generateVariablesMap(components: { type?: string; format?: string; text?: string; buttons?: { url?: string }[] }[]): Record<string, string> {
  const variablesMap: Record<string, string> = {};

  if (!components || !Array.isArray(components)) return variablesMap;

  for (const comp of components) {
    const type = (comp.type || "").toLowerCase();
    
    if (type === "header") {
      const format = (comp.format || "").toUpperCase();
      if (format === "IMAGE") {
        variablesMap[`${type}_1`] = "Imagen (URL)";
      } else if (format === "VIDEO") {
        variablesMap[`${type}_1`] = "Video (URL)";
      } else if (format === "DOCUMENT") {
        variablesMap[`${type}_1`] = "Documento (URL)";
      } else if (format === "TEXT" && comp.text) {
        const count = countVariables(comp.text);
        for (let i = 1; i <= count; i++) {
          variablesMap[`${type}_${i}`] = `Parámetro ${i}`;
        }
      }
    } else if (type === "body" && comp.text) {
      const count = countVariables(comp.text);
      for (let i = 1; i <= count; i++) {
        variablesMap[`${type}_${i}`] = `Parámetro ${i}`;
      }
    } else if (type === "buttons" && Array.isArray(comp.buttons)) {
      comp.buttons.forEach((btn: { url?: string }, index: number) => {
        if (btn.url) {
          const count = countVariables(btn.url);
          for (let i = 1; i <= count; i++) {
            variablesMap[`button_${index}_${i}`] = `Parámetro ${i}`;
          }
        }
      });
    }
  }

  return variablesMap;
}
