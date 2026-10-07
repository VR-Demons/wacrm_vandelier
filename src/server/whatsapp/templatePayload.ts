import { extractAllVariables } from "@/lib/templates";

export function buildTemplateComponents(
  template: { body: string; header?: { format: string } | null; buttons?: unknown },
  variables: Record<string, string>,
  fallbackImageUrl?: string | null
): Record<string, unknown>[] {
  const result: Record<string, unknown>[] = [];

  // HEADER
  if (template.header) {
    const headerFormat = template.header.format;
    const headerParams: Record<string, unknown>[] = [];
    if (headerFormat === "TEXT") {
      if (variables.header_1) {
        headerParams.push({ type: "text", text: variables.header_1 });
      }
    } else if (headerFormat === "IMAGE") {
      const url = variables.header_1 || fallbackImageUrl;
      if (url) {
        headerParams.push({ type: "image", image: { link: url } });
      } else {
        throw new Error("Debe configurar una imagen de plantillas en Ajustes");
      }
    } else if (headerFormat === "VIDEO") {
      if (variables.header_1) {
        headerParams.push({ type: "video", video: { link: variables.header_1 } });
      }
    } else if (headerFormat === "DOCUMENT") {
      if (variables.header_1) {
        headerParams.push({ type: "document", document: { link: variables.header_1 } });
      }
    }
    
    if (headerParams.length > 0) {
      result.push({
        type: "header",
        parameters: headerParams,
      });
    }
  }

  // BODY
  const bodyVars = extractAllVariables(template.body);
  if (bodyVars.length > 0) {
    const bodyParams: Record<string, unknown>[] = [];
    for (const varName of bodyVars) {
      const val = variables[`body_${varName}`] || variables[varName] || "";
      if (/^\d+$/.test(varName)) {
        bodyParams.push({ type: "text", text: val });
      } else {
        bodyParams.push({ type: "text", parameter_name: varName, text: val });
      }
    }
    if (bodyParams.length > 0) {
      result.push({
        type: "body",
        parameters: bodyParams
      });
    }
  }

  // BUTTONS
  if (Array.isArray(template.buttons)) {
    for (let i = 0; i < template.buttons.length; i++) {
      const btn = template.buttons[i];
      if (btn.type === "URL" && btn.url && typeof btn.url === "string" && btn.url.includes("{{1}}")) {
        const val = variables[`button_${i}_1`];
        if (val) {
          result.push({
            type: "button",
            sub_type: "url",
            index: String(i),
            parameters: [
              {
                type: "text",
                text: val
              }
            ]
          });
        }
      }
    }
  }

  return result;
}
