import type { SettlementWriteDraft } from '../model/write-draft'

const STORAGE_PREFIX = 'platform.settlement-write-draft'

function buildStorageKey(applicationId: string, sessionId: string): string {
  return `${STORAGE_PREFIX}.${applicationId}.${sessionId}`
}

export function saveSettlementWriteDraft(draft: SettlementWriteDraft): void {
  const key = buildStorageKey(draft.meta.applicationId, draft.meta.sessionId)
  window.sessionStorage.setItem(key, JSON.stringify(draft))
}

export function loadSettlementWriteDraft(
  applicationId: string,
  sessionId: string
): SettlementWriteDraft | null {
  const raw = window.sessionStorage.getItem(buildStorageKey(applicationId, sessionId))
  if (!raw) return null

  try {
    return JSON.parse(raw) as SettlementWriteDraft
  } catch {
    return null
  }
}

export function clearSettlementWriteDraft(applicationId: string, sessionId: string): void {
  window.sessionStorage.removeItem(buildStorageKey(applicationId, sessionId))
}
