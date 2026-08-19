import type {
  BannerSaveInput,
  CultureSaveItem,
  InterviewSaveItem,
  RecruitGuideData,
} from '@/entities/recruit-guide/model/types'
import { shouldUseRecruitGuideRemoteApi } from './capabilities'
import {
  addInterview as addInterviewLocal,
  readRecruitGuide,
  removeInterviews as removeInterviewsLocal,
  replaceInterview as replaceInterviewLocal,
  saveBanner as saveBannerLocal,
  saveCulture as saveCultureLocal,
} from './store'

export async function getRecruitGuideService(): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    throw new Error('채용 안내 remote API가 아직 연동되지 않았습니다.')
  }
  return readRecruitGuide()
}

export async function saveBannerService(input: BannerSaveInput): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    throw new Error('채용 안내 remote API가 아직 연동되지 않았습니다.')
  }
  return saveBannerLocal(input)
}

export async function saveCultureService(items: CultureSaveItem[]): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    throw new Error('채용 안내 remote API가 아직 연동되지 않았습니다.')
  }
  return saveCultureLocal(items)
}

export async function addInterviewService(input: InterviewSaveItem): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    throw new Error('채용 안내 remote API가 아직 연동되지 않았습니다.')
  }
  return addInterviewLocal(input)
}

export async function replaceInterviewService(
  id: string,
  input: InterviewSaveItem,
): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    throw new Error('채용 안내 remote API가 아직 연동되지 않았습니다.')
  }
  return replaceInterviewLocal(id, input)
}

export async function removeInterviewsService(ids: string[]): Promise<RecruitGuideData> {
  if (shouldUseRecruitGuideRemoteApi()) {
    throw new Error('채용 안내 remote API가 아직 연동되지 않았습니다.')
  }
  return removeInterviewsLocal(ids)
}
