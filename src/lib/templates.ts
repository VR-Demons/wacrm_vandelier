/**
 * Variables posicionales {{n}} del cuerpo de una plantilla de WhatsApp.
 * Puro y sin dependencias: lo usan tanto el servicio de servidor como la UI
 * (que necesita saber cuántos campos pintar antes de enviar).
 */

const VARIABLE_REGEX = /\{\{\s*(\d+)\s*\}\}/g;
const NAMED_VARIABLE_REGEX = /\{\{\s*([a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ\s]+)\s*\}\}/g;

/** Máximo de parámetros por cuerpo que acepta Meta. */
export const MAX_TEMPLATE_VARIABLES = 10;

function variableIndexes(body: string): number[] {
  const found = new Set<number>();
  for (const m of body.matchAll(VARIABLE_REGEX)) found.add(Number(m[1]));
  return [...found].sort((a, b) => a - b);
}

export function countVariables(body: string): number {
  const indexes = variableIndexes(body);
  return indexes.length ? indexes[indexes.length - 1]! : 0;
}

/**
 * Valida que si se usan números, sean contiguos.
 * O si se usan nombres, que no pasen del máximo.
 */
export function validateBodyVariables(body: string): string | null {
  const names = extractNamedVariables(body);
  if (names.length > 0) {
    if (names.length > MAX_TEMPLATE_VARIABLES) {
      return `El cuerpo admite hasta ${MAX_TEMPLATE_VARIABLES} variables`;
    }
    return null; // Named variables are converted automatically
  }

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

/** Extrae nombres de variables en el orden que aparecen por primera vez. (Solo letras) */
export function extractNamedVariables(body: string): string[] {
  const names = new Set<string>();
  for (const m of body.matchAll(NAMED_VARIABLE_REGEX)) {
    const val = m[1]?.trim();
    if (val && !/^\d+$/.test(val)) {
      names.add(val);
    }
  }
  return [...names];
}

/** Extrae todas las variables en orden de aparición, sean números o nombres. */
export function extractAllVariables(body: string): string[] {
  const names = new Set<string>();
  for (const m of body.matchAll(NAMED_VARIABLE_REGEX)) {
    const val = m[1]?.trim();
    if (val) names.add(val);
  }
  return [...names];
}

/** Convierte un cuerpo con nombres a formato Meta {{1}} y genera el map. */
export function processNamedVariables(body: string): { metaBody: string; variablesMap: Record<string, string> } {
  const names = extractNamedVariables(body);
  if (names.length === 0) return { metaBody: body, variablesMap: {} };

  const variablesMap: Record<string, string> = {};
  names.forEach((name, i) => {
    variablesMap[`body_${i + 1}`] = name;
  });

  const metaBody = body.replace(NAMED_VARIABLE_REGEX, (match, val: string) => {
    const trimmed = val.trim();
    if (/^\d+$/.test(trimmed)) return match;
    const index = names.indexOf(trimmed) + 1;
    return `{{${index}}}`;
  });

  return { metaBody, variablesMap };
}

/** Sustituye {{n}} o {{nombre}} por su valor correspondiente en el diccionario. */
export function renderBody(body: string, variables: Record<string, string> | string[] = []): string {
  if (Array.isArray(variables)) {
    return body.replace(VARIABLE_REGEX, (_match, index: string) => {
      return variables[Number(index) - 1] ?? "";
    });
  }
  return body.replace(NAMED_VARIABLE_REGEX, (_match, val: string) => {
    const trimmed = val.trim();
    return variables[`body_${trimmed}`] ?? variables[trimmed] ?? "";
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
