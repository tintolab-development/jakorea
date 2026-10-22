/** 채용 안내 — OpenAPI ↔ 도메인 매핑 */

import type {
  CultureItem,
  CultureItemId,
  InterviewItem,
  RecruitGuideData,
} from '@/entities/recruit-guide/model/types'
import { getJAKoreaHomepageAdminAPIAssetsSubset } from '@/shared/api/generated/assets/assets-api'
import type { CareerGuideAdminCultureItemResponse } from '@/shared/api/generated/careers/schemas/careerGuideAdminCultureItemResponse'
import type { CareerGuideAdminInterviewResponse } from '@/shared/api/generated/careers/schemas/careerGuideAdminInterviewResponse'
import type { CareerGuideAdminResponse } from '@/shared/api/generated/careers/schemas/careerGuideAdminResponse'
import type { CareerGuideBannerResponse } from '@/shared/api/generated/careers/schemas/careerGuideBannerResponse'

const CULTURE_CODE: Record<string, CultureItemId> = {
  MAKE_AN_IMPACT: 'make_an_impact',
  KEEP_LEARNING: 'keep_learning',
  SPEAK_OPENLY: 'speak_openly',
  READY_TO_HELP: 'ready_to_help',
}

const CULTURE_API_ID: Record<CultureItemId, number> = {
  make_an_impact: 1,
  keep_learning: 2,
  speak_openly: 3,
  ready_to_help: 4,
}

async function resolveBannerImage(
  assetId: number | null | undefined,
  fallbackUrl: string
): Promise<{ imageUrl: string; imageFileName?: string; imageAssetId: number | null }> {
  const url = fallbackUrl.trim()
  if (assetId == null || !Number.isFinite(assetId) || assetId <= 0) {
    return {
      imageUrl: url,
      imageFileName: fileNameFromUrl(url),
      imageAssetId: null,
    }
  }
  try {
    const asset = await getJAKoreaHomepageAdminAPIAssetsSubset().getAsset(assetId)
    return {
      imageUrl: asset.publicUrl?.trim() || url,
      imageFileName:
        asset.originalName?.trim() || fileNameFromUrl(asset.publicUrl ?? url) || undefined,
      imageAssetId: assetId,
    }
  } catch {
    return {
      imageUrl: url,
      imageFileName: fileNameFromUrl(url),
      imageAssetId: assetId,
    }
  }
}

function fileNameFromUrl(url: string): string | undefined {
  const trimmed = url.trim()
  if (!trimmed) return undefined
  try {
    const path =
      trimmed.startsWith('http://') || trimmed.startsWith('https://')
        ? new URL(trimmed).pathname
        : trimmed
    const base = path.split('/').filter(Boolean).pop()
    if (!base) return undefined
    return decodeURIComponent(base.split('?')[0] ?? base)
  } catch {
    return undefined
  }
}

function mapCultureItem(row: CareerGuideAdminCultureItemResponse): CultureItem | null {
  const id = row.code ? CULTURE_CODE[row.code] : undefined
  // 초기 관리자 조회 계약은 하위 항목에 id/version을 포함하지 않고
  // displayOrder만 반환한다. 새 계약의 id를 우선 사용하되, 고정된 문화
  // 항목의 코드가 있는 구버전 응답에서는 코드의 서버 고정 ID를 복원한다.
  const apiId = row.id ?? (id ? CULTURE_API_ID[id] : undefined)
  if (!id || apiId !== CULTURE_API_ID[id]) return null
  return {
    id,
    apiId,
    itemLabel: row.label ?? '',
    title: row.title ?? '',
    description: row.description ?? '',
    version: row.version ?? 0,
  }
}

function mapInterview(row: CareerGuideAdminInterviewResponse): InterviewItem | null {
  const id = row.id ?? row.displayOrder
  const storyId = row.storyKey?.trim()
  if (id == null || !storyId) return null
  return {
    id: String(id),
    storyId,
    title: row.title ?? '',
    publishedYear: row.year ?? null,
    version: row.version ?? 0,
    imageUrl: row.coverImageUrl || undefined,
  }
}

export async function mapCareerGuideAdminToDomain(
  row: CareerGuideAdminResponse
): Promise<RecruitGuideData> {
  const cultureItems = [...(row.cultureItems ?? [])]
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map(mapCultureItem)
    .filter((item): item is CultureItem => item != null)

  const interviews = [...(row.interviews ?? [])]
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map(mapInterview)
    .filter((item): item is InterviewItem => item != null)

  if (cultureItems.length !== 4 || new Set(cultureItems.map(item => item.apiId)).size !== 4) {
    throw new Error('CAREER_GUIDE_CULTURE_RESPONSE_INVALID')
  }
  const banner = await resolveBannerImage(row.bannerAssetId, row.bannerImageUrl ?? '')

  return {
    banner: {
      imageUrl: banner.imageUrl,
      imageFileName: banner.imageFileName,
      imageAssetId: banner.imageAssetId,
      mainText: row.mainText ?? '',
      subText01: row.subTextKo ?? '',
      subText02: row.subTextEn ?? '',
      version: row.version ?? 0,
    },
    cultureItems,
    interviews,
    updatedAt: '',
  }
}

export function mergeBannerResponse(
  current: RecruitGuideData,
  response: CareerGuideBannerResponse,
  image: { imageUrl?: string; imageFileName?: string; imageAssetId?: number | null }
): RecruitGuideData {
  const imageAssetId =
    image.imageAssetId !== undefined
      ? image.imageAssetId
      : response.imageAssetId !== undefined
        ? response.imageAssetId
        : current.banner.imageAssetId
  const imageUrl = image.imageUrl !== undefined ? image.imageUrl : current.banner.imageUrl
  const imageFileName =
    image.imageFileName !== undefined
      ? image.imageFileName || undefined
      : current.banner.imageFileName

  return {
    ...current,
    banner: {
      ...current.banner,
      imageUrl,
      imageFileName,
      imageAssetId,
      mainText: response.mainText ?? current.banner.mainText,
      subText01: response.subTextKo ?? current.banner.subText01,
      subText02: response.subTextEn ?? current.banner.subText02,
      version: response.version ?? current.banner.version,
    },
    updatedAt: new Date().toISOString(),
  }
}

export function mergeCultureItemsResponse(
  current: RecruitGuideData,
  rows: CareerGuideAdminCultureItemResponse[]
): RecruitGuideData {
  const cultureItems = rows
    .map(mapCultureItem)
    .filter((item): item is CultureItem => item != null)
    .sort((a, b) => a.apiId - b.apiId)
  if (cultureItems.length !== 4 || new Set(cultureItems.map(item => item.apiId)).size !== 4) {
    throw new Error('CAREER_GUIDE_CULTURE_RESPONSE_INVALID')
  }
  return {
    ...current,
    cultureItems,
    updatedAt: new Date().toISOString(),
  }
}

export function mergeInterviewResponse(
  current: RecruitGuideData,
  row: CareerGuideAdminInterviewResponse
): RecruitGuideData {
  const interview = mapInterview(row)
  if (!interview) throw new Error('CAREER_GUIDE_INTERVIEW_RESPONSE_INVALID')
  const interviews = current.interviews.some(item => item.id === interview.id)
    ? current.interviews.map(item => (item.id === interview.id ? interview : item))
    : [...current.interviews, interview]
  return {
    ...current,
    interviews: interviews.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })),
    updatedAt: new Date().toISOString(),
  }
}
