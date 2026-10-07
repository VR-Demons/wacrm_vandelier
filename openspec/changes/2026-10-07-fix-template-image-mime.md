# SDD Plan: Fix Template Image Media Upload Error (Meta 131053)

## 1. Proposal
**Problem:** 
When sending a template with an image header uploaded through the global template settings, Meta rejects it with error `Media upload error (Meta 131053)`. This occurs because the `Content-Type` header of the image response at `/api/branding/template-image` is hardcoded to `image/png`. If a user uploads a JPEG, Meta downloads it, reads the HTTP headers, gets `image/png`, but the file signature is JPEG, causing Meta's strict media validator to reject the upload.

**Intent:** 
Correct the HTTP response headers in `/api/branding/template-image` to dynamically sniff the file bytes and return the exact MIME type (e.g. `image/jpeg`, `image/webp`, `image/png`), preventing format mismatch errors during Meta's media download.

## 2. Specification
**Template Image Public API (`src/app/api/branding/template-image/route.ts`):**
- Import `sniffFaviconMime` (from `@/lib/favicon`) to detect the true MIME type from the raw bytes.
- When serving the media file, pass the buffer through `sniffFaviconMime(bytes)`.
- Fall back to `application/octet-stream` or `image/jpeg` only if the format isn't recognized, but our upload endpoint already validates the file via the same sniffer, so the format will be recognized.
- Update the `Headers` initialization to use the dynamic MIME type.

## 3. Design
**A. Snippet Update (`src/app/api/branding/template-image/route.ts`):**
```typescript
import { readMediaFile } from "@/server/whatsapp/media";
import { sniffFaviconMime } from "@/lib/favicon";

// ... Inside GET
const buf = await readMediaFile(org, TEMPLATE_IMAGE_ASSET);
const bytes = new Uint8Array(buf);
const mime = sniffFaviconMime(bytes) || "application/octet-stream";

return new Response(bytes, {
  headers: cabeceras(mime, cacheable),
});
```

## 4. Tasks
- [ ] Task 1: Refactor `src/app/api/branding/template-image/route.ts` to implement dynamic MIME sniffing using `sniffFaviconMime`.
