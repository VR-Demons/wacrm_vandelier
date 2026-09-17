export function cobranzaEnabled(): boolean {
  return process.env.COBRANZA === "on";
}
