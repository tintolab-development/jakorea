import type {
  BannerSaveInput,
  CultureSaveItem,
  InterviewSaveItem,
  RecruitGuideData,
} from '@/entities/recruit-guide/model/types'
import { getJAKoreaHomepageAdminAPICareersSubset } from '@/shared/api/generated/careers/careers-api'
import { shouldUseRecruitGuideRemoteApi } from './capabilities'
import { mapCareerGuideAdminToDomain } from './mappers'
import {
  addInterview as addInterviewLocal,
  readRecruitGuide,
  removeInterviews as removeInterviewsLocal,
  replaceInterview as replaceInterviewLocal,
  saveBanner as saveBannerLocal,
  saveCulture as saveCultureLocal,
} from './store'

const REMOTE_WRITE_ERROR = '채용 안내 저장 API가 아직 없습니다.'

function careersApi() {
  return getJAKoreaHomepageAdminAPICareersSubset()
}

export async function getRecruitGuideService(): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    const row = await careersApi().guide1()
    return mapCareerGuideAdminToDomain(row)
  }
  return readRecruitGuide()
}

export async function saveBannerService(input: BannerSaveInput): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    throw new Error(REMOTE_WRITE_ERROR)
  }
  return saveBannerLocal(input)
}

export async function saveCultureService(items: CultureSaveItem[]): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    throw new Error(REMOTE_WRITE_ERROR)
  }
  return saveCultureLocal(items)
}

export async function addInterviewService(input: InterviewSaveItem): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    throw new Error(REMOTE_WRITE_ERROR)
  }
  return addInterviewLocal(input)
}

export async function replaceInterviewService(
  id: string,
  input: InterviewSaveItem,
): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    throw new Error(REMOTE_WRITE_ERROR)
  }
  return replaceInterviewLocal(id, input)
}

export async function removeInterviewsService(ids: string[]): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    throw new Error(REMOTE_WRITE_ERROR)
  }
  return removeInterviewsLocal(ids)
}
