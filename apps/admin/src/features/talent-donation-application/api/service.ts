import type {
  TalentDonationApplication,
  TalentDonationApplicationListFilter,
  TalentDonationApplicationListResult,
} from '@/entities/talent-donation-application/model/types'
import { getJAKoreaHomepageAdminAPISponsorshipSubset } from '@/shared/api/generated/sponsorship/sponsorship-api'
import { shouldUseTalentDonationApplicationRemoteApi } from './capabilities'
import {
  mapTalentApplicationDetailToDomain,
  mapTalentApplicationListItemToDomain,
  toTalentApplicationListParams,
  toTalentApplicationStatusUpdateRequest,
} from './mappers'
import { isAdminForbidden, isAdminNotFound } from '@/features/system-inbox/lib/http-status'
import {
  confirmTalentDonationApplications as confirmLocal,
  getTalentDonationApplicationWithPrivacyLog as getWithLogLocal,
  readTalentDonationApplications,
  removeTalentDonationApplications as removeLocal,
} from './store'

function sponsorshipApi() {
  return getJAKoreaHomepageAdminAPISponsorshipSubset()
}

async function listRemote(
  filter: TalentDonationApplicationListFilter = {},
): Promise<TalentDonationApplicationListResult> {
  const response = await sponsorshipApi().list13(toTalentApplicationListParams(filter))
  return {
    items: (response.items ?? []).map(mapTalentApplicationListItemToDomain),
    totalCount: response.totalCount ?? response.items?.length ?? 0,
  }
}

export async function listTalentDonationApplicationsService(
  filter: TalentDonationApplicationListFilter = {},
): Promise<TalentDonationApplicationListResult> {
  if (shouldUseTalentDonationApplicationRemoteApi()) {
    return listRemote(filter)
  }
  const items = readTalentDonationApplications(filter)
  return { items, totalCount: items.length }
}

export async function getTalentDonationApplicationService(
  id: string,
  actorName?: string,
): Promise<TalentDonationApplication | null> {
  if (shouldUseTalentDonationApplicationRemoteApi()) {
    void actorName
    const numericId = Number(id)
    if (!Number.isFinite(numericId) || numericId <= 0) return null
    try {
      const row = await sponsorshipApi().detail7(numericId)
      return mapTalentApplicationDetailToDomain(row)
    } catch (error) {
      if (isAdminForbidden(error) || isAdminNotFound(error)) throw error
      return null
    }
  }
  return getWithLogLocal(id, actorName)
}

export async function downloadTalentDonationApplicationAttachmentService(
  id: string,
  assetId?: number | null,
): Promise<{ downloadUrl: string; originalName?: string } | null> {
  if (!shouldUseTalentDonationApplicationRemoteApi()) {
    return null
  }
  const numericId = Number(id)
  if (!Number.isFinite(numericId) || numericId <= 0) return null
  const response =
    assetId != null && assetId > 0
      ? await sponsorshipApi().attachmentDownloadByAsset(numericId, assetId)
      : await sponsorshipApi().attachmentDownload(numericId)
  if (!response.downloadUrl) return null
  return {
    downloadUrl: response.downloadUrl,
    originalName: response.originalName,
  }
}

export async function removeTalentDonationApplicationsService(
  ids: string[],
  _cachedRows?: TalentDonationApplication[],
): Promise<void> {
  if (shouldUseTalentDonationApplicationRemoteApi()) {
    void _cachedRows
    const numericIds = ids
      .map(id => Number(id))
      .filter(id => Number.isFinite(id) && id > 0)
    if (numericIds.length === 0) return
    await sponsorshipApi().delete3(numericIds)
    return
  }
  removeLocal(ids)
}

export async function confirmTalentDonationApplicationsService(
  ids: string[],
  actorName?: string,
  _cachedRows?: TalentDonationApplication[],
): Promise<TalentDonationApplication[]> {
  if (shouldUseTalentDonationApplicationRemoteApi()) {
    void _cachedRows
    const results: TalentDonationApplication[] = []
    for (const id of ids) {
      const numericId = Number(id)
      if (!Number.isFinite(numericId) || numericId <= 0) continue
      const updated = await sponsorshipApi().updateStatus(
        numericId,
        toTalentApplicationStatusUpdateRequest('confirmed'),
      )
      const mapped = mapTalentApplicationListItemToDomain(updated)
      if (actorName?.trim() && !mapped.confirmedByName) {
        mapped.confirmedByName = actorName.trim()
      }
      results.push(mapped)
    }
    return results
  }
  return confirmLocal(ids, actorName)
}
