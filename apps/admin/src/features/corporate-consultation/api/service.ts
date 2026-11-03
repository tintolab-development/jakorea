import type {
  CorporateConsultation,
  CorporateConsultationListFilter,
} from '@/entities/corporate-consultation/model/types'
import {
  fetchAllAdminListPages,
  paginateLocalRows,
  toAdminListPage,
  type AdminListPage,
} from '@/shared/lib/admin-infinite-list'
import { getJAKoreaHomepageAdminAPISponsorshipSubset } from '@/shared/api/generated/sponsorship/sponsorship-api'
import { shouldUseCorporateConsultationRemoteApi } from './capabilities'
import {
  mapConsultationDetailToDomain,
  mapConsultationListItemToDomain,
  toBulkRequest,
  toConsultationListParams,
  toStatusUpdateRequest,
} from './mappers'
import { isAdminForbidden, isAdminNotFound } from '@/features/system-inbox/lib/http-status'
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
  filter: CorporateConsultationListFilter,
  page: number,
): Promise<AdminListPage<CorporateConsultation>> {
  const response = await sponsorshipApi().list14(toConsultationListParams(filter, page))
  return toAdminListPage(
    (response.items ?? []).map(mapConsultationListItemToDomain),
    page,
    response,
  )
}

function resolveRowsFromCache(
  ids: string[],
  cachedRows?: CorporateConsultation[],
): CorporateConsultation[] {
  const idSet = new Set(ids)
  return (cachedRows ?? []).filter(row => idSet.has(row.id))
}

export async function listCorporateConsultationsPageService(
  filter: CorporateConsultationListFilter = {},
  page = 0,
): Promise<AdminListPage<CorporateConsultation>> {
  if (shouldUseCorporateConsultationRemoteApi()) {
    return listRemoteConsultations(filter, page)
  }
  return paginateLocalRows(readCorporateConsultations(filter), page)
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
      const row = await sponsorshipApi().detail8(numericId)
      return mapConsultationDetailToDomain(row)
    } catch (error) {
      if (isAdminForbidden(error) || isAdminNotFound(error)) throw error
      return null
    }
  }
  return getWithLogLocal(id, actorName)
}

export async function downloadCorporateConsultationAttachmentService(
  id: string,
  assetId?: number | null,
): Promise<{ downloadUrl: string; originalName?: string } | null> {
  if (!shouldUseCorporateConsultationRemoteApi()) {
    return null
  }
  const numericId = Number(id)
  if (!Number.isFinite(numericId) || numericId <= 0) return null
  const response =
    assetId != null && assetId > 0
      ? await sponsorshipApi().attachmentDownloadByAsset1(numericId, assetId)
      : await sponsorshipApi().attachmentDownload1(numericId)
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
      const listed = await fetchAllAdminListPages(page => listRemoteConsultations({}, page))
      rows = resolveRowsFromCache(ids, listed)
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
      const listed = await fetchAllAdminListPages(page => listRemoteConsultations({}, page))
      rows = resolveRowsFromCache(ids, listed).filter(row => row.status === 'pending')
    }
    if (rows.length === 0) return []

    if (rows.length === 1) {
      const row = rows[0]!
      const updated = await sponsorshipApi().updateStatus1(
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
