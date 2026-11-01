export type PortalEducationJournal = {
  journalId?: number
  programId?: number
  organizationApplicationId?: number
  submittedByMemberId?: number
  submittedByAdminId?: number
  fileObjectId?: number
  journalTitle?: string
  journalMemo?: string
  originalFilename?: string
  submittedAt?: string
  createdAt?: string
  updatedAt?: string
  availableActions?: string[]
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

export function normalizePortalEducationJournalList(payload: unknown): PortalEducationJournal[] {
  const body = unwrapEnvelope<PortalEducationJournal[] | { items?: PortalEducationJournal[] }>(payload)
  if (Array.isArray(body)) return body
  if (body && typeof body === 'object' && Array.isArray(body.items)) return body.items
  return []
}
