/**
 * 017 — Estado en memoria del mock de Zernio (solo dev/test). Vive en
 * globalThis porque Next recarga módulos en dev; una instancia = un proceso,
 * así que el outbox en memoria alcanza para las aserciones del self-test.
 */

export type ZernioSentMessage = {
  n: number;
  conversationId: string;
  accountId: string | null;
  message: string;
  /** Presente solo fuera de la ventana de 24 h. */
  messagingType?: string;
  messageTag?: string;
  /** Llave de idempotencia con la que llegó, si la hubo. */
  idempotencyKey: string | null;
  at: string;
};

type ZernioMockState = {
  seq: number;
  sent: ZernioSentMessage[];
};

const g = globalThis as unknown as { __voceroZernioMock?: ZernioMockState };

export function zernioMockState(): ZernioMockState {
  if (!g.__voceroZernioMock) g.__voceroZernioMock = { seq: 0, sent: [] };
  return g.__voceroZernioMock;
}

export function resetZernioMock(): void {
  g.__voceroZernioMock = { seq: 0, sent: [] };
}

/**
 * Una llave que termina en `-invalid` se rechaza, igual que hace el mock de
 * Graph: es como el arnés comprueba que unas credenciales malas NO se guardan.
 */
export function zernioTokenIsBad(authorization: string | null): boolean {
  const token = (authorization ?? "").replace(/^Bearer\s+/i, "");
  return token.length === 0 || token.endsWith("-invalid");
}
