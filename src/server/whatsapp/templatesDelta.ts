import { generateVariablesMap } from "@/lib/templates";

export type RemoteTemplate = {
  id?: string;
  name?: string;
  language?: string;
  status?: string;
  category?: string;
  rejected_reason?: string;
  components?: { type?: string; format?: string; text?: string; buttons?: { url?: string }[] }[];
};

export type LocalTemplate = {
  id: string;
  waTemplateId?: string | null;
  name: string;
  language: string;
  status: string;
  category: string;
};

export function mapMetaStatus(status: string | undefined): "approved" | "rejected" | "pending" | "draft" | null {
  const s = (status ?? "").toUpperCase();
  if (s === "APPROVED") return "approved";
  if (s === "REJECTED") return "rejected";
  if (s === "PENDING" || s === "IN_APPEAL" || s === "PENDING_DELETION") {
    return "pending";
  }
  return null;
}

export function computeSyncDelta(local: LocalTemplate[], remote: RemoteTemplate[]) {
  const toDelete: string[] = [];
  const toUpdate: { id: string; data: { status: "approved" | "rejected" | "pending" | "draft"; category: string; waTemplateId: string | null; rejectionReason: string | null; body: string; header: unknown; footer: string | null; buttons: unknown; variablesMap: Record<string, string> } }[] = [];
  const toInsert: { name: string; language: string; status: "approved" | "rejected" | "pending" | "draft"; category: string; waTemplateId: string | null; rejectionReason: string | null; body: string; header: unknown; footer: string | null; buttons: unknown; variablesMap: Record<string, string> }[] = [];

  const remoteProcessed = new Set<string>();

  for (const r of remote) {
    if (!r.name || !r.language) continue;
    
    const status = mapMetaStatus(r.status);
    if (!status) continue;

    const match = local.find(
      (t) =>
        (r.id && t.waTemplateId === r.id) ||
        (t.name === r.name && t.language === r.language)
    );

    let bodyText = "";
    let headerComp = null;
    let footerText = null;
    let buttonsComp = null;

    if (r.components) {
      for (const comp of r.components) {
        const type = (comp.type || "").toUpperCase();
        if (type === "BODY") bodyText = comp.text || "";
        else if (type === "HEADER") headerComp = comp;
        else if (type === "FOOTER") footerText = comp.text || "";
        else if (type === "BUTTONS") buttonsComp = comp.buttons || [];
      }
    }

    const variablesMap = generateVariablesMap(r.components || []);
    const category = r.category ?? (match ? match.category : "UTILITY");

    if (match) {
      remoteProcessed.add(match.id);
      toUpdate.push({
        id: match.id,
        data: {
          status,
          category,
          waTemplateId: match.waTemplateId ?? r.id ?? null,
          rejectionReason: r.rejected_reason ?? null,
          body: bodyText,
          header: headerComp,
          footer: footerText,
          buttons: buttonsComp,
          variablesMap,
        }
      });
    } else {
      toInsert.push({
        name: r.name,
        language: r.language,
        status,
        category,
        waTemplateId: r.id ?? null,
        rejectionReason: r.rejected_reason ?? null,
        body: bodyText,
        header: headerComp,
        footer: footerText,
        buttons: buttonsComp,
        variablesMap,
      });
    }
  }

  for (const l of local) {
    if (!remoteProcessed.has(l.id)) {
      toDelete.push(l.id);
    }
  }

  return { toDelete, toUpdate, toInsert };
}
