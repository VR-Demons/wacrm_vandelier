import { randomBytes, createHash } from "crypto";

export async function generateApiKey() {
  const bytes = randomBytes(32);
  const key = `sk_live_${bytes.toString("hex")}`;
  const prefix = key.substring(0, 12);
  const hash = await hashApiKey(key);
  
  return { key, hash, prefix };
}

export async function hashApiKey(key: string): Promise<string> {
  return createHash("sha256").update(key).digest("hex");
}

export async function validateApiKey(key: string, expectedHash: string): Promise<boolean> {
  const actualHash = await hashApiKey(key);
  return actualHash === expectedHash;
}
