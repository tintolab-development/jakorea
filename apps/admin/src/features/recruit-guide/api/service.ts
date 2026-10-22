import type {
  BannerSaveInput,
  CultureSaveItem,
  InterviewSaveItem,
  RecruitGuideData,
} from '@/entities/recruit-guide/model/types'
import { getJAKoreaHomepageAdminAPICareersSubset } from '@/shared/api/generated/careers/careers-api'
import { shouldUseRecruitGuideRemoteApi } from './capabilities'
import {
  mapCareerGuideAdminToDomain,
  mergeBannerResponse,
  mergeCultureItemsResponse,
  mergeInterviewResponse,
} from './mappers'
import { uploadCareerHeroImageAsset } from './upload-career-hero-image'
import {
  readRecruitGuide,
  saveBanner as saveBannerLocal,
  saveCulture as saveCultureLocal,
  updateInterview as updateInterviewLocal,
} from './store'

const CULTURE_ID: Record<CultureSaveItem['id'], number> = {
  make_an_impact: 1,
  keep_learning: 2,
  speak_openly: 3,
  ready_to_help: 4,
}

const CULTURE_IDS = new Set(Object.keys(CULTURE_ID))

function requiredText(value: string, requiredCode: string, tooLongCode: string, maxLength: number) {
  const normalized = value.trimEnd()
  if (!normalized.trim()) throw new Error(requiredCode)
  if (normalized.length > maxLength) throw new Error(tooLongCode)
  return normalized
}

function careersApi() {
  return getJAKoreaHomepageAdminAPICareersSubset()
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
  cached?: RecruitGuideData
): Promise<RecruitGuideData> {
  if (!shouldUseRecruitGuideRemoteApi()) return saveBannerLocal(input)

  const mainText = requiredText(
    input.mainText,
    'BANNER_MAIN_TEXT_REQUIRED',
    'BANNER_MAIN_TEXT_TOO_LONG',
    1000
  )
  const subTextKo = requiredText(
    input.subText01,
    'BANNER_SUB_TEXT_01_REQUIRED',
    'BANNER_SUB_TEXT_01_TOO_LONG',
    2000
  )
  const subTextEn = requiredText(
    input.subText02,
    'BANNER_SUB_TEXT_02_REQUIRED',
    'BANNER_SUB_TEXT_02_TOO_LONG',
    2000
  )

  const hasNewImage = input.imageFile != null
  let imageAssetId = input.imageAssetId ?? null
  if (input.imageFile) {
    imageAssetId = await uploadCareerHeroImageAsset(input.imageFile)
  }

  // FileReader data URL은 미리보기 전용이다. 새 파일을 선택한 경우에는
  // 서버 응답/재조회 전까지 기존 URL을 캐시에 임시로 남기고 data URL은 절대 저장하지 않는다.
  const imageUrl = hasNewImage ? '' : input.imageUrl.trim()
  if (!imageUrl && imageAssetId == null) throw new Error('BANNER_IMAGE_REQUIRED')

  const prev = await resolvePrev(cached)
  const response = await careersApi().updateCareerGuideBanner({
    imageAssetId,
    mainText,
    subTextKo,
    subTextEn,
    version: input.version,
  })
  return mergeBannerResponse(prev, response, {
    imageUrl: hasNewImage ? undefined : imageUrl,
    imageFileName: hasNewImage
      ? input.imageFileName?.trim()
      : imageAssetId == null
        ? ''
        : input.imageFileName?.trim() || prev.banner.imageFileName,
    imageAssetId,
  })
}

export async function saveCultureService(
  items: CultureSaveItem[],
  cached?: RecruitGuideData
): Promise<RecruitGuideData> {
  if (!shouldUseRecruitGuideRemoteApi()) return saveCultureLocal(items)

  if (
    items.length !== 4 ||
    new Set(items.map(item => item.id)).size !== 4 ||
    items.some(item => !CULTURE_IDS.has(item.id))
  ) {
    throw new Error('CULTURE_ITEMS_INVALID')
  }
  const prev = await resolvePrev(cached)
  const rows = await careersApi().updateCareerGuideCultureItems({
    items: items.map(item => {
      const id = CULTURE_ID[item.id]
      if (id == null) throw new Error('CULTURE_ITEMS_INVALID')
      const title = requiredText(
        item.title,
        'CULTURE_TITLE_REQUIRED',
        'CULTURE_TITLE_TOO_LONG',
        500
      )
      const description = requiredText(
        item.description,
        'CULTURE_DESCRIPTION_REQUIRED',
        'CULTURE_DESCRIPTION_TOO_LONG',
        2000
      )
      return {
        id,
        title,
        description,
        version: item.version,
      }
    }),
  })
  return mergeCultureItemsResponse(prev, rows)
}

export async function updateInterviewService(
  slotId: string | number,
  input: InterviewSaveItem,
  cached?: RecruitGuideData
): Promise<RecruitGuideData> {
  const numericSlotId = Number(slotId)
  if (numericSlotId !== 1 && numericSlotId !== 2 && numericSlotId !== 3) {
    throw new Error('INTERVIEW_SLOT_INVALID')
  }
  if (!shouldUseRecruitGuideRemoteApi()) {
    return updateInterviewLocal(numericSlotId, input)
  }
  const title = requiredText(
    input.title,
    'INTERVIEW_TITLE_REQUIRED',
    'INTERVIEW_TITLE_TOO_LONG',
    300
  )
  const year = input.publishedYear
  if (year !== null && (!Number.isInteger(year) || year < 1900 || year > 2200)) {
    throw new Error('INTERVIEW_YEAR_INVALID')
  }
  const prev = await resolvePrev(cached)
  const row = await careersApi().updateCareerGuideInterview(numericSlotId, {
    title,
    year,
    version: input.version,
  })
  return mergeInterviewResponse(prev, row)
}
