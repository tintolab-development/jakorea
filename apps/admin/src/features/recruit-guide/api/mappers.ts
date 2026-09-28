/**
 * 채용 안내 — OpenAPI ↔ 도메인 매핑
 * 저장 API는 없다. GET 응답만 도메인으로 옮긴다.
 */

import type {
  CultureItem,
  CultureItemId,
  InterviewItem,
  RecruitGuideData,
} from '@/entities/recruit-guide/model/types'
import { getJAKoreaHomepageAdminAPIAssetsSubset } from '@/shared/api/generated/assets/assets-api'
import type { CareerCultureItemResponse } from '@/shared/api/generated/careers/schemas/careerCultureItemResponse'
import type { CareerGuideAdminResponse } from '@/shared/api/generated/careers/schemas/careerGuideAdminResponse'
import type { CareerInterviewResponse } from '@/shared/api/generated/careers/schemas/careerInterviewResponse'

const CULTURE_CODE: Record<string, CultureItemId> = {
  MAKE_AN_IMPACT: 'make_an_impact',
  KEEP_LEARNING: 'keep_learning',
  SPEAK_OPENLY: 'speak_openly',
  READY_TO_HELP: 'ready_to_help',
}

async function resolveBannerImage(
  assetId: number | null | undefined,
  fallbackUrl: string,
): Promise<{ imageUrl: string; imageFileName?: string; imageAssetId?: number }> {
  const url = fallbackUrl.trim()
  if (assetId == null || !Number.isFinite(assetId) || assetId <= 0) {
    return {
      imageUrl: url,
      imageFileName: fileNameFromUrl(url),
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
    const path = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? new URL(trimmed).pathname
      : trimmed
    const base = path.split('/').filter(Boolean).pop()
    if (!base) return undefined
    return decodeURIComponent(base.split('?')[0] ?? base)
  } catch {
    return undefined
  }
}

function mapCultureItem(row: CareerCultureItemResponse): CultureItem | null {
  const id = row.code ? CULTURE_CODE[row.code] : undefined
  if (!id) return null
  return {
    id,
    itemLabel: row.label ?? '',
    title: row.title ?? '',
    description: row.description ?? '',
    version: 0,
  }
}

function mapInterview(row: CareerInterviewResponse): InterviewItem | null {
  const storyKey = row.storyKey?.trim()
  if (!storyKey) return null
  return {
    id: storyKey,
    storyId: storyKey,
    title: row.title ?? '',
    publishedYear: row.year ?? 0,
    imageUrl: row.coverImageUrl || undefined,
  }
}

export async function mapCareerGuideAdminToDomain(
  row: CareerGuideAdminResponse,
): Promise<RecruitGuideData> {
  const cultureItems = [...(row.cultureItems ?? [])]
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map(mapCultureItem)
    .filter((item): item is CultureItem => item != null)

  const interviews = [...(row.interviews ?? [])]
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
    .map(mapInterview)
    .filter((item): item is InterviewItem => item != null)

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
