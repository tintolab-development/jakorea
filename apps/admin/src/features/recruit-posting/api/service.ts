/**
 * 채용공고 — Homepage careers OpenAPI
 */

import type {
  RecruitPosting,
  RecruitPostingAttachment,
  RecruitPostingCreateInput,
  RecruitPostingListFilter,
  RecruitPostingUpdateInput,
} from '@/entities/recruit-posting/model/types'
import { getJAKoreaHomepageAdminAPICareersSubset } from '@/shared/api/generated/careers/careers-api'
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list'
import {
  mapCareerPostingAdminDetail,
  mapCareerPostingAdminItem,
  toCareerPostingCreateRequest,
  toCareerPostingUpdateRequest,
  toNumericId,
  toRecruitPostingListParams,
} from './mappers'
import { uploadRecruitPostingAttachmentAsset } from './upload-posting-attachment'

function careersApi() {
  return getJAKoreaHomepageAdminAPICareersSubset()
}

/** 첨부 0건 → undefined(제거). 새 File → upload. 기존 assetId → 유지. */
async function resolveAttachmentAssetId(
  attachments: RecruitPostingAttachment[],
): Promise<number | undefined> {
  if (attachments.length === 0) return undefined
  const withFile = attachments.find(att => att.file instanceof File)
  if (withFile?.file) {
    return uploadRecruitPostingAttachmentAsset(withFile.file)
  }
  const assetId = attachments[0]?.assetId
  if (assetId != null && assetId > 0) return assetId
  return undefined
}

export async function listRecruitPostingsPageService(
  filter: RecruitPostingListFilter | undefined,
  page: number,
): Promise<AdminListPage<RecruitPosting>> {
  const response = await careersApi().list9(toRecruitPostingListParams(filter, page))
  return toAdminListPage(
    (response.items ?? [])
      .map(mapCareerPostingAdminItem)
      .filter((row): row is RecruitPosting => row != null),
    page,
    response,
  )
}

export async function getRecruitPostingService(id: string): Promise<RecruitPosting | null> {
  try {
    const row = await careersApi().detail3(toNumericId(id))
    return mapCareerPostingAdminDetail(row)
  } catch {
    return null
  }
}

export async function createRecruitPostingService(
  input: RecruitPostingCreateInput,
): Promise<RecruitPosting> {
  const attachmentAssetId = await resolveAttachmentAssetId(input.attachments)
  const created = await careersApi().create11(
    toCareerPostingCreateRequest(input, attachmentAssetId),
  )
  const mapped = mapCareerPostingAdminDetail(created)
  if (!mapped) throw new Error('채용공고를 등록하지 못했습니다.')
  return mapped
}

export async function updateRecruitPostingService(
  input: RecruitPostingUpdateInput,
  cached?: RecruitPosting | null,
): Promise<RecruitPosting> {
  const current = cached && cached.id === input.id ? cached : await getRecruitPostingService(input.id)
  if (!current) {
    throw new Error('채용공고를 찾을 수 없습니다.')
  }
  const attachmentAssetId = await resolveAttachmentAssetId(input.attachments)
  const updated = await careersApi().update14(
    toNumericId(input.id),
    toCareerPostingUpdateRequest(input, current.version, attachmentAssetId),
  )
  const mapped = mapCareerPostingAdminDetail(updated)
  if (!mapped) throw new Error('채용공고를 수정하지 못했습니다.')
  return mapped
}

export async function setRecruitPostingPublicService(
  id: string,
  isPublic: boolean,
  version: number,
): Promise<RecruitPosting> {
  const row = await careersApi().changeVisibility(toNumericId(id), { isPublic, version })
  const mapped = mapCareerPostingAdminItem(row)
  if (!mapped) throw new Error('채용공고 공개 여부를 바꾸지 못했습니다.')
  return mapped
}

export async function removeRecruitPostingsService(ids: string[]): Promise<void> {
  await careersApi().delete2(ids.map(toNumericId))
}
