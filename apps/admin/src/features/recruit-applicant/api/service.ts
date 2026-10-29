import axios from 'axios'
import type {
  RecruitApplicant,
  RecruitApplicantDetail,
  RecruitApplicantListFilter,
  RecruitApplicantListResult,
} from '@/entities/recruit-applicant/model/types'
import { getJAKoreaHomepageAdminAPICareersSubset } from '@/shared/api/generated/careers/careers-api'
import { shouldUseRecruitApplicantRemoteApi } from './capabilities'
import {
  detailFromListItem,
  mapCareerTalentApplicationDetail,
  mapCareerTalentApplicationListItem,
  toNumericId,
  toTalentApplicationListParams,
} from './mappers'
import {
  confirmRecruitApplicants as confirmLocal,
  readRecruitApplicants,
  removeRecruitApplicants as removeLocal,
} from './store'

export type RecruitApplicantConfirmInput = {
  id: string
  version: number
}

function careersApi() {
  return getJAKoreaHomepageAdminAPICareersSubset()
}

/** 원격 목록 — 필터·totalCount 는 서버 응답을 그대로 사용한다. */
async function listRemote(
  filter?: RecruitApplicantListFilter,
): Promise<RecruitApplicantListResult> {
  const response = await careersApi().list15(toTalentApplicationListParams(filter))
  const items = (response.items ?? [])
    .map(mapCareerTalentApplicationListItem)
    .filter((row): row is RecruitApplicant => row != null)
  return {
    items,
    totalCount: response.totalCount ?? items.length,
  }
}

export function isRecruitApplicantNotFoundError(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 404) return false
  const data = error.response.data
  if (!data || typeof data !== 'object') return false
  return (data as { code?: unknown }).code === 'CAREER_RESOURCE_NOT_FOUND'
}

export async function getRecruitApplicantService(
  id: string,
): Promise<RecruitApplicantDetail | null> {
  if (shouldUseRecruitApplicantRemoteApi()) {
    const row = await careersApi().detail9(toNumericId(id))
    const mapped = mapCareerTalentApplicationDetail(row)
    if (!mapped) {
      throw new Error('신청 상세를 불러오지 못했습니다.')
    }
    return mapped
  }
  const found = readRecruitApplicants().find(item => item.id === id)
  return found ? detailFromListItem(found) : null
}

export async function downloadRecruitApplicantAttachmentService(
  id: string,
  assetId?: number | null,
): Promise<{ downloadUrl: string; originalName?: string } | null> {
  if (!shouldUseRecruitApplicantRemoteApi()) return null
  const numericId = toNumericId(id)
  const response =
    assetId != null && assetId > 0
      ? await careersApi().attachmentDownloadByAsset2(numericId, assetId)
      : await careersApi().attachmentDownload2(numericId)
  if (!response.downloadUrl) return null
  return {
    downloadUrl: response.downloadUrl,
    originalName: response.originalName,
  }
}

export async function listRecruitApplicantsService(
  filter?: RecruitApplicantListFilter,
): Promise<RecruitApplicantListResult> {
  if (shouldUseRecruitApplicantRemoteApi()) {
    return listRemote(filter)
  }
  const items = readRecruitApplicants(filter)
  return { items, totalCount: items.length }
}

export async function confirmRecruitApplicantsService(
  items: RecruitApplicantConfirmInput[],
): Promise<void> {
  if (shouldUseRecruitApplicantRemoteApi()) {
    const api = careersApi()
    for (const item of items) {
      await api.confirm4(toNumericId(item.id), { version: item.version })
    }
    return
  }
  confirmLocal(items.map(item => item.id))
}

export async function removeRecruitApplicantsService(ids: string[]): Promise<void> {
  if (shouldUseRecruitApplicantRemoteApi()) {
    await careersApi().delete4(ids.map(toNumericId))
    return
  }
  removeLocal(ids)
}
