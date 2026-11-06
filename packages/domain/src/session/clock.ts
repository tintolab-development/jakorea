export function parseInstantMs(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

export function readServerClockOffsetMs(serverNow: unknown, clientNowMs: number): number {
  const serverMs = parseInstantMs(serverNow)
  if (serverMs == null) return 0
  return serverMs - clientNowMs
}

export function correctedNowMs(clientNowMs: number, serverClockOffsetMs: number): number {
  return clientNowMs + serverClockOffsetMs
}

export function applyServerClockOffset(
  previousOffsetMs: number,
  serverNow: unknown,
  clientNowMs: number
): number {
  const next = readServerClockOffsetMs(serverNow, clientNowMs)
  if (parseInstantMs(serverNow) == null) return previousOffsetMs
  return next
}
