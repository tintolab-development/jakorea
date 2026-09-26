/**
 * 채용공고 — Homepage careers OpenAPI
 *
 * list GET(`/api/admin/careers/postings`) 에 필터 query가 없다.
 * 공개·상태·제목·작성자·모집/게시 기간은 응답 후 `filterRecruitPostings`로 거른다.
 */

import type {
  RecruitPosting,
  RecruitPostingAttachment,
  RecruitPostingCreateInput,
  RecruitPostingListFilter,
  RecruitPostingUpdateInput,
} from '@/entities/recruit-posting/model/types'
import { getJAKoreaHomepageAdminAPICareersSubset } from '@/shared/api/generated/careers/careers-api'
import { shouldUseRecruitPostingRemoteApi } from './capabilities'
import {
  mapCareerPostingAdminDetail,
  mapCareerPostingAdminItem,
  toCareerPostingCreateRequest,
  toCareerPostingUpdateRequest,
  toNumericId,
} from './mappers'
import {
  createRecruitPosting as createLocal,
  filterRecruitPostings,
  getRecruitPostingById,
  readRecruitPostings,
  removeRecruitPostings as removeLocal,
  setRecruitPostingPublic as setPublicLocal,
  updateRecruitPosting as updateLocal,
} from './store'
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

export async function listRecruitPostingsService(
  filter?: RecruitPostingListFilter,
): Promise<RecruitPosting[]> {
  if (shouldUseRecruitPostingRemoteApi()) {
    const response = await careersApi().list9()
    const items = (response.items ?? [])
      .map(mapCareerPostingAdminItem)
      .filter((row): row is RecruitPosting => row != null)
    return filterRecruitPostings(items, filter)
  }
  return readRecruitPostings(filter)
}

export async function getRecruitPostingService(id: string): Promise<RecruitPosting | null> {
  if (shouldUseRecruitPostingRemoteApi()) {
    try {
      const row = await careersApi().detail3(toNumericId(id))
      return mapCareerPostingAdminDetail(row)
    } catch {
      return null
    }
  }
  return getRecruitPostingById(id)
}

export async function createRecruitPostingService(
  input: RecruitPostingCreateInput,
): Promise<RecruitPosting> {
  if (shouldUseRecruitPostingRemoteApi()) {
    const attachmentAssetId = await resolveAttachmentAssetId(input.attachments)
    const created = await careersApi().create11(
      toCareerPostingCreateRequest(input, attachmentAssetId),
    )
    const mapped = mapCareerPostingAdminDetail(created)
    if (!mapped) throw new Error('채용공고를 등록하지 못했습니다.')
    return mapped
  }
  return createLocal(input)
}

export async function updateRecruitPostingService(
  input: RecruitPostingUpdateInput,
  cached?: RecruitPosting | null,
): Promise<RecruitPosting> {
  if (shouldUseRecruitPostingRemoteApi()) {
    const current =
      cached && cached.id === input.id ? cached : await getRecruitPostingService(input.id)
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
  return updateLocal(input)
}

export async function setRecruitPostingPublicService(
  id: string,
  isPublic: boolean,
  version: number,
): Promise<RecruitPosting> {
  if (shouldUseRecruitPostingRemoteApi()) {
    const row = await careersApi().changeVisibility(toNumericId(id), { isPublic, version })
    const mapped = mapCareerPostingAdminItem(row)
    if (!mapped) throw new Error('채용공고 공개 여부를 바꾸지 못했습니다.')
    return mapped
  }
  return setPublicLocal(id, isPublic)
}

export async function removeRecruitPostingsService(ids: string[]): Promise<void> {
  if (shouldUseRecruitPostingRemoteApi()) {
    await careersApi().delete2(ids.map(toNumericId))
    return
  }
  removeLocal(ids)
}
