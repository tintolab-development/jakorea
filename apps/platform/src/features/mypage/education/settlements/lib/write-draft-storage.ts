import type { SettlementWriteDraft } from '../model/write-draft'

const STORAGE_PREFIX = 'platform.settlement-write-draft'

function buildStorageKey(applicationId: string, sessionId: string): string {
  return `${STORAGE_PREFIX}.${applicationId}.${sessionId}`
}

function sanitizeDraftForStorage(draft: SettlementWriteDraft): SettlementWriteDraft {
  return {
    ...draft,
    basic: {
      ...draft.basic,
      residentFront: '',
      residentBack: '',
      accountNumber: '',
    },
  }
}

export function saveSettlementWriteDraft(draft: SettlementWriteDraft): void {
  const key = buildStorageKey(draft.meta.applicationId, draft.meta.sessionId)
  window.sessionStorage.setItem(key, JSON.stringify(sanitizeDraftForStorage(draft)))
}

export function loadSettlementWriteDraft(
  applicationId: string,
  sessionId: string
): SettlementWriteDraft | null {
  const raw = window.sessionStorage.getItem(buildStorageKey(applicationId, sessionId))
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as SettlementWriteDraft
    return {
      ...parsed,
      meta: {
        ...parsed.meta,
        documentKind: parsed.meta.documentKind ?? (parsed.meta.isInstructor ? 'payment_statement' : 'receipt'),
        idempotencyKey: parsed.meta.idempotencyKey ?? '',
      },
      enabledItemTypes: parsed.enabledItemTypes ?? [],
      extraItems: parsed.extraItems ?? [],
      transport: {
        ...parsed.transport,
        depart: {
          ...parsed.transport.depart,
          fileNames: parsed.transport.depart?.fileNames ?? [],
          attachments: parsed.transport.depart?.attachments ?? [],
        },
        return: {
          ...parsed.transport.return,
          fileNames: parsed.transport.return?.fileNames ?? [],
          attachments: parsed.transport.return?.attachments ?? [],
        },
      },
      meal: parsed.meal ?? { amount: '', fileNames: [] },
      activity: parsed.activity ?? { amount: '', fileNames: [] },
    }
  } catch {
    return null
  }
}

export function clearSettlementWriteDraft(applicationId: string, sessionId: string): void {
  window.sessionStorage.removeItem(buildStorageKey(applicationId, sessionId))
}
