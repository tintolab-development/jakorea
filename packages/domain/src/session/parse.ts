import { parseInstantMs } from './clock.js'
import { SESSION_WARNING_LEAD_MS } from './constants.js'

export type AdminAuthActivityResponse = {
  lastUserActivityAt: string
  updated: boolean
}

export type AdminAuthSessionResponse = {
  sessionStartedAt: string
  absoluteExpiresAt: string
  lastUserActivityAt: string
  idleExpiresAt: string | null
  refreshIdleExpiresAt: string | null
  idlePolicyEnforced: boolean
  serverNow: string
}

function readIsoString(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  return parseInstantMs(value) == null ? null : value.trim()
}

function unwrapBareRecord(payload: unknown): Record<string, unknown> | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
  const record = payload as Record<string, unknown>
  if ('success' in record && 'data' in record && record.data && typeof record.data === 'object') {
    return record.data as Record<string, unknown>
  }
  return record
}

export function parseAdminAuthActivityResponse(payload: unknown): AdminAuthActivityResponse | null {
  const record = unwrapBareRecord(payload)
  if (!record) return null
  const lastUserActivityAt = readIsoString(record.lastUserActivityAt)
  if (!lastUserActivityAt || typeof record.updated !== 'boolean') return null
  return { lastUserActivityAt, updated: record.updated }
}

export function parseAdminAuthSessionResponse(payload: unknown): AdminAuthSessionResponse | null {
  const record = unwrapBareRecord(payload)
  if (!record) return null
  const sessionStartedAt = readIsoString(record.sessionStartedAt)
  const absoluteExpiresAt = readIsoString(record.absoluteExpiresAt)
  const lastUserActivityAt = readIsoString(record.lastUserActivityAt)
  const serverNow = readIsoString(record.serverNow)
  if (!sessionStartedAt || !absoluteExpiresAt || !lastUserActivityAt || !serverNow) return null
  if (typeof record.idlePolicyEnforced !== 'boolean') return null
  const idleExpiresAt =
    record.idleExpiresAt == null ? null : readIsoString(record.idleExpiresAt)
  if (record.idleExpiresAt != null && idleExpiresAt == null) return null
  const refreshIdleExpiresAt =
    record.refreshIdleExpiresAt == null ? null : readIsoString(record.refreshIdleExpiresAt)
  return {
    sessionStartedAt,
    absoluteExpiresAt,
    lastUserActivityAt,
    idleExpiresAt,
    refreshIdleExpiresAt,
    idlePolicyEnforced: record.idlePolicyEnforced,
    serverNow,
  }
}

/** 유휴 연장 성공: 서버 유휴 기한이 경고 구간을 벗어날 만큼 남아 있고, 절대 만료가 먼저가 아님 */
export function isSessionIdleStillValid(
  session: AdminAuthSessionResponse,
  nowMs: number,
  previousIdleExpiresAt?: string | null
): boolean {
  if (!session.idlePolicyEnforced) return false
  const idleMs = parseInstantMs(session.idleExpiresAt)
  const absoluteMs = parseInstantMs(session.absoluteExpiresAt)
  if (idleMs == null || absoluteMs == null) return false
  const remainingIdle = idleMs - nowMs
  const remainingAbsolute = absoluteMs - nowMs
  if (remainingIdle <= 0 || remainingAbsolute <= 0) return false
  if (remainingAbsolute <= remainingIdle && remainingAbsolute <= SESSION_WARNING_LEAD_MS) {
    return false
  }
  if (remainingIdle > SESSION_WARNING_LEAD_MS) return true
  const previousMs = parseInstantMs(previousIdleExpiresAt ?? null)
  return previousMs != null && idleMs > previousMs && remainingIdle > 30_000
}
