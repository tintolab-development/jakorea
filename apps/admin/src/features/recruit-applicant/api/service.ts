import type {
  RecruitApplicant,
  RecruitApplicantListFilter,
} from '@/entities/recruit-applicant/model/types'
import { getJAKoreaHomepageAdminAPICareersSubset } from '@/shared/api/generated/careers/careers-api'
import { shouldUseRecruitApplicantRemoteApi } from './capabilities'
import {
  mapCareerTalentApplicationListItem,
  toNumericId,
  toTalentApplicationListParams,
} from './mappers'
import {
  confirmRecruitApplicants as confirmLocal,
  filterRecruitApplicants,
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

export async function listRecruitApplicantsService(
  filter?: RecruitApplicantListFilter,
): Promise<RecruitApplicant[]> {
  if (shouldUseRecruitApplicantRemoteApi()) {
    const response = await careersApi().list14(toTalentApplicationListParams(filter))
    const pageItems = (response.items ?? [])
      .map(mapCareerTalentApplicationListItem)
      .filter((row): row is RecruitApplicant => row != null)
    return filterRecruitApplicants(pageItems, filter)
  }
  return readRecruitApplicants(filter)
}

export async function confirmRecruitApplicantsService(
  items: RecruitApplicantConfirmInput[],
): Promise<void> {
  if (shouldUseRecruitApplicantRemoteApi()) {
    const api = careersApi()
    for (const item of items) {
      await api.confirm2(toNumericId(item.id), { version: item.version })
    }
    return
  }
  confirmLocal(items.map(item => item.id))
}

export async function removeRecruitApplicantsService(ids: string[]): Promise<void> {
  if (shouldUseRecruitApplicantRemoteApi()) {
    await careersApi().delete3(ids.map(toNumericId))
    return
  }
  removeLocal(ids)
}
