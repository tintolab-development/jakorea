import type { RecruitPosting, RecruitPostingListFilter } from '@/entities/recruit-posting/model/types'
import { getJAKoreaHomepageAdminAPICareersSubset } from '@/shared/api/generated/careers/careers-api'
import { shouldUseRecruitPostingRemoteApi } from './capabilities'
import { mapCareerPostingAdminItem, toNumericId } from './mappers'
import {
  filterRecruitPostings,
  readRecruitPostings,
  removeRecruitPostings as removeLocal,
  setRecruitPostingPublic as setPublicLocal,
} from './store'

function careersApi() {
  return getJAKoreaHomepageAdminAPICareersSubset()
}

export async function listRecruitPostingsService(
  filter?: RecruitPostingListFilter,
): Promise<RecruitPosting[]> {
  if (shouldUseRecruitPostingRemoteApi()) {
    const response = await careersApi().list15()
    const items = (response.items ?? [])
      .map(mapCareerPostingAdminItem)
      .filter((row): row is RecruitPosting => row != null)
    return filterRecruitPostings(items, filter)
  }
  return readRecruitPostings(filter)
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
    await careersApi().delete4(ids.map(toNumericId))
    return
  }
  removeLocal(ids)
}
