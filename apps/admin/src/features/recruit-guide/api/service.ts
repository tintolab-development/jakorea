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

function careersApi() {
  return getJAKoreaHomepageAdminAPICareersSubset()
}

/**
 * 저장 API가 아직 없다.
 * remote GET 세션에서는 캐시 기준으로만 반영하고(persist: false),
 * 새로고침 시 서버 GET 값으로 돌아간다.
 */
function sessionWriteOptions(base: RecruitGuideData) {
  return { base, persist: false as const }
}

async function resolvePrev(cached?: RecruitGuideData): Promise<RecruitGuideData> {
  if (cached) return cached
  return getRecruitGuideService()
}

export async function getRecruitGuideService(): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    const row = await careersApi().guide1()
    return mapCareerGuideAdminToDomain(row)
  }
  return readRecruitGuide()
}

export async function saveBannerService(
  input: BannerSaveInput,
  cached?: RecruitGuideData,
): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    const prev = await resolvePrev(cached)
    return saveBannerLocal(input, sessionWriteOptions(prev))
  }
  return saveBannerLocal(input)
}

export async function saveCultureService(
  items: CultureSaveItem[],
  cached?: RecruitGuideData,
): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    const prev = await resolvePrev(cached)
    return saveCultureLocal(items, sessionWriteOptions(prev))
  }
  return saveCultureLocal(items)
}

export async function addInterviewService(
  input: InterviewSaveItem,
  cached?: RecruitGuideData,
): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    const prev = await resolvePrev(cached)
    return addInterviewLocal(input, sessionWriteOptions(prev))
  }
  return addInterviewLocal(input)
}

export async function replaceInterviewService(
  id: string,
  input: InterviewSaveItem,
  cached?: RecruitGuideData,
): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    const prev = await resolvePrev(cached)
    return replaceInterviewLocal(id, input, sessionWriteOptions(prev))
  }
  return replaceInterviewLocal(id, input)
}

export async function removeInterviewsService(
  ids: string[],
  cached?: RecruitGuideData,
): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    const prev = await resolvePrev(cached)
    return removeInterviewsLocal(ids, sessionWriteOptions(prev))
  }
  return removeInterviewsLocal(ids)
}
