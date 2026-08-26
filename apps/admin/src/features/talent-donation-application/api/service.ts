import type {
  TalentDonationApplication,
  TalentDonationApplicationListFilter,
  TalentDonationApplicationListResult,
} from '@/entities/talent-donation-application/model/types'
import { shouldUseTalentDonationApplicationRemoteApi } from './capabilities'
import {
  confirmTalentDonationApplications as confirmLocal,
  getTalentDonationApplicationWithPrivacyLog as getWithLogLocal,
  readTalentDonationApplications,
  removeTalentDonationApplications as removeLocal,
} from './store'

export async function listTalentDonationApplicationsService(
  filter: TalentDonationApplicationListFilter = {},
): Promise<TalentDonationApplicationListResult> {
  if (shouldUseTalentDonationApplicationRemoteApi()) {
    const items = readTalentDonationApplications(filter)
    return { items, totalCount: items.length }
  }
  const items = readTalentDonationApplications(filter)
  return { items, totalCount: items.length }
}

export async function getTalentDonationApplicationService(
  id: string,
  actorName?: string,
): Promise<TalentDonationApplication | null> {
  return getWithLogLocal(id, actorName)
}

export async function removeTalentDonationApplicationsService(
  ids: string[],
  _cachedRows?: TalentDonationApplication[],
): Promise<void> {
  void _cachedRows
  removeLocal(ids)
}

export async function confirmTalentDonationApplicationsService(
  ids: string[],
  actorName?: string,
  _cachedRows?: TalentDonationApplication[],
): Promise<TalentDonationApplication[]> {
  void _cachedRows
  return confirmLocal(ids, actorName)
}
