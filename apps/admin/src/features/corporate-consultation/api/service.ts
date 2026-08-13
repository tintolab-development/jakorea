import type {
  CorporateConsultation,
  CorporateConsultationListFilter,
  CorporateConsultationListResult,
} from '@/entities/corporate-consultation/model/types'
import { getJAKoreaHomepageAdminAPISponsorshipSubset } from '@/shared/api/generated/sponsorship/sponsorship-api'
import { shouldUseCorporateConsultationRemoteApi } from './capabilities'
import {
  mapConsultationDetailToDomain,
  mapConsultationListItemToDomain,
  toBulkRequest,
  toConsultationListParams,
  toStatusUpdateRequest,
} from './mappers'
import {
  confirmCorporateConsultations as confirmLocal,
  getCorporateConsultationWithPrivacyLog as getWithLogLocal,
  readCorporateConsultations,
  removeCorporateConsultations as removeLocal,
} from './store'

function sponsorshipApi() {
  return getJAKoreaHomepageAdminAPISponsorshipSubset()
}

async function listRemoteConsultations(
  filter: CorporateConsultationListFilter = {},
): Promise<CorporateConsultationListResult> {
  const response = await sponsorshipApi().list12(toConsultationListParams(filter))
  return {
    items: (response.items ?? []).map(mapConsultationListItemToDomain),
    totalCount: response.totalCount ?? response.items?.length ?? 0,
  }
}

function resolveRowsFromCache(
  ids: string[],
  cachedRows?: CorporateConsultation[],
): CorporateConsultation[] {
  const idSet = new Set(ids)
  return (cachedRows ?? []).filter(row => idSet.has(row.id))
}

export async function listCorporateConsultationsService(
  filter: CorporateConsultationListFilter = {},
): Promise<CorporateConsultationListResult> {
  if (shouldUseCorporateConsultationRemoteApi()) {
    return listRemoteConsultations(filter)
  }
  const items = readCorporateConsultations(filter)
  return { items, totalCount: items.length }
}

export async function getCorporateConsultationService(
  id: string,
  actorName?: string,
): Promise<CorporateConsultation | null> {
  if (shouldUseCorporateConsultationRemoteApi()) {
    void actorName
    const numericId = Number(id)
    if (!Number.isFinite(numericId) || numericId <= 0) return null
    try {
      const row = await sponsorshipApi().detail5(numericId)
      return mapConsultationDetailToDomain(row)
    } catch {
      return null
    }
  }
  return getWithLogLocal(id, actorName)
}

export async function downloadCorporateConsultationAttachmentService(
  id: string,
): Promise<{ downloadUrl: string; originalName?: string } | null> {
  if (!shouldUseCorporateConsultationRemoteApi()) {
    return null
  }
  const numericId = Number(id)
  if (!Number.isFinite(numericId) || numericId <= 0) return null
  const response = await sponsorshipApi().attachmentDownload(numericId)
  if (!response.downloadUrl) return null
  return {
    downloadUrl: response.downloadUrl,
    originalName: response.originalName,
  }
}

export async function removeCorporateConsultationsService(
  ids: string[],
  cachedRows?: CorporateConsultation[],
): Promise<void> {
  if (shouldUseCorporateConsultationRemoteApi()) {
    if (ids.length === 0) return
    let rows = resolveRowsFromCache(ids, cachedRows)
    if (rows.length === 0) {
      const listed = await listRemoteConsultations()
      rows = resolveRowsFromCache(ids, listed.items)
    }
    if (rows.length === 0) return
    await sponsorshipApi().bulkDelete6(toBulkRequest(rows))
    return
  }
  removeLocal(ids)
}

export async function confirmCorporateConsultationsService(
  ids: string[],
  actorName?: string,
  cachedRows?: CorporateConsultation[],
): Promise<CorporateConsultation[]> {
  if (shouldUseCorporateConsultationRemoteApi()) {
    if (ids.length === 0) return []
    let rows = resolveRowsFromCache(ids, cachedRows).filter(row => row.status === 'pending')
    if (rows.length === 0) {
      const listed = await listRemoteConsultations()
      rows = resolveRowsFromCache(ids, listed.items).filter(row => row.status === 'pending')
    }
    if (rows.length === 0) return []

    if (rows.length === 1) {
      const row = rows[0]!
      const updated = await sponsorshipApi().updateStatus(
        Number(row.id),
        toStatusUpdateRequest(row, 'confirmed'),
      )
      return [mapConsultationListItemToDomain(updated)]
    }

    await sponsorshipApi().bulkConfirm(toBulkRequest(rows))
    const confirmedAt = new Date().toISOString()
    return rows.map(row => ({
      ...row,
      status: 'confirmed' as const,
      confirmedAt,
      confirmedByName: actorName?.trim() ? actorName.trim() : row.confirmedByName,
      version: row.version + 1,
    }))
  }
  return confirmLocal(ids, actorName)
}
