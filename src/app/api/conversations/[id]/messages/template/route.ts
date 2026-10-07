import { z } from "zod";
import { apiError, parseBody, withAuth } from "@/lib/api";
import { SendError } from "@/server/inbox/send";
import {
  sendTemplate,
  TemplateError,
  templateErrorStatus,
} from "@/server/whatsapp/templates";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  templateId: z.string().min(1),
  variables: z.union([
    z.record(z.string().trim().max(500)),
    z.array(z.string().trim().max(500))
  ]).optional(),
  variable: z.string().trim().max(500).optional(),
});

export const POST = withAuth(async (session, req: Request, ctx: Params) => {
  const { id } = await ctx.params;
  const body = await parseBody(req, bodySchema);
  if (!body.ok) return body.response;

  try {
    let variablesMap: Record<string, string> | undefined = undefined;
    if (body.data.variables && !Array.isArray(body.data.variables)) {
      variablesMap = body.data.variables;
    } else {
      const arr = Array.isArray(body.data.variables)
        ? body.data.variables
        : body.data.variable !== undefined
        ? [body.data.variable]
        : undefined;
      
      if (arr) {
        variablesMap = {};
        arr.forEach((v, i) => {
          variablesMap![`body_${i + 1}`] = v;
        });
      }
    }

    const result = await sendTemplate({
      organizationId: session.organizationId,
      conversationId: id,
      templateId: body.data.templateId,
      variables: variablesMap,
    });
    return Response.json({ messageId: result.messageId });
  } catch (err) {
    if (err instanceof TemplateError) {
      return apiError(templateErrorStatus(err), err.code, err.message);
    }
    if (err instanceof SendError) {
      return apiError(403, err.code, err.message);
    }
    throw err;
  }
});
