/**
 * 기업후원 안내 — OpenAPI ↔ 도메인 매핑
 */

import type {
  CorporateGuideData,
  MetricItemId,
  MetricSaveItem,
  PartnershipSaveItem,
  PartnershipStepNumber,
} from '@/entities/corporate-guide/model/types'
import type { BannerResponse } from '@/shared/api/generated/sponsorship/schemas/bannerResponse'
import type { BannerUpdateRequest } from '@/shared/api/generated/sponsorship/schemas/bannerUpdateRequest'
import type { CorporateAdminResponse } from '@/shared/api/generated/sponsorship/schemas/corporateAdminResponse'
import type { CorporateMetricResponse } from '@/shared/api/generated/sponsorship/schemas/corporateMetricResponse'
import type { CorporateStepResponse } from '@/shared/api/generated/sponsorship/schemas/corporateStepResponse'
import type { FixedTextUpdateRequest } from '@/shared/api/generated/sponsorship/schemas/fixedTextUpdateRequest'

const METRIC_BY_CODE: Record<string, MetricItemId> = {
  GLOBAL_SCALE: 'global_scale',
  TRANSPARENCY: 'transparency',
  PROVEN_IMPACT: 'proven_impact',
}

const METRIC_BY_ID: Record<number, MetricItemId> = {
  1: 'global_scale',
  2: 'transparency',
  3: 'proven_impact',
}

const METRIC_LABEL: Record<MetricItemId, string> = {
  global_scale: '글로벌 확장성',
  transparency: '최고 수준의 투명성',
  proven_impact: '검증된 임팩트',
}

const METRIC_API_ID: Record<MetricItemId, number> = {
  global_scale: 1,
  transparency: 2,
  proven_impact: 3,
}

export function mapCorporateAdminToDomain(row: CorporateAdminResponse): CorporateGuideData {
  const bannerImage = row.banner?.image

  const metricsRaw = (row.metrics ?? [])
    .map(item => {
      const apiId = item.id ?? 0
      const domainId =
        (item.code && METRIC_BY_CODE[item.code]) || METRIC_BY_ID[apiId] || null
      if (!domainId) return null
      return {
        id: domainId,
        apiId,
        itemLabel: item.name ?? METRIC_LABEL[domainId],
        title: item.title ?? '',
        description: item.description ?? '',
        version: item.version ?? 0,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item != null)

  const metricsById = new Map(metricsRaw.map(m => [m.id, m]))
  const metrics = (['global_scale', 'transparency', 'proven_impact'] as const).map(id => {
    return (
      metricsById.get(id) ?? {
        id,
        apiId: METRIC_API_ID[id],
        itemLabel: METRIC_LABEL[id],
        title: '',
        description: '',
        version: 0,
      }
    )
  })

  const stepsRaw = (row.steps ?? [])
    .map(item => {
      const stepNum = (item.stepNumber ?? item.id ?? 0) as number
      if (stepNum < 1 || stepNum > 6) return null
      const step = stepNum as PartnershipStepNumber
      return {
        step,
        apiId: item.id ?? stepNum,
        title: item.title ?? '',
        description: item.description ?? '',
        version: item.version ?? 0,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item != null)
    .sort((a, b) => a.step - b.step)

  const stepsByNum = new Map(stepsRaw.map(s => [s.step, s]))
  const partnershipSteps = ([1, 2, 3, 4, 5, 6] as const).map(step => {
    return (
      stepsByNum.get(step) ?? {
        step,
        apiId: step,
        title: '',
        description: '',
        version: 0,
      }
    )
  })

  return {
    banner: {
      imageUrl: bannerImage?.publicUrl ?? '',
      imageFileName: bannerImage?.originalName ?? undefined,
      imageAssetId: bannerImage?.assetId,
      mainText: row.banner?.mainText ?? '',
      subText: row.banner?.subText ?? '',
      version: row.banner?.version ?? 0,
    },
    metrics,
    partnershipSteps,
    updatedAt: new Date().toISOString(),
  }
}

export function toCorporateBannerUpdateRequest(
  bannerAssetId: number,
  mainText: string,
  subText: string,
  version: number
): BannerUpdateRequest {
  return {
    bannerAssetId,
    mainText: mainText.trimEnd(),
    subText: subText.trimEnd(),
    version,
  }
}

export function toMetricsUpdateRequest(items: MetricSaveItem[]): FixedTextUpdateRequest {
  return {
    items: items.map(item => ({
      id: item.apiId,
      title: item.title.trimEnd(),
      description: item.description.trimEnd(),
      version: item.version,
    })),
  }
}

export function toStepsUpdateRequest(items: PartnershipSaveItem[]): FixedTextUpdateRequest {
  return {
    items: items.map(item => ({
      id: item.apiId,
      title: item.title.trimEnd(),
      description: item.description.trimEnd(),
      version: item.version,
    })),
  }
}

/** PUT banner 응답을 캐시 문서에 병합 — 추가 GET 방지 */
export function mergeBannerIntoCorporateGuide(
  prev: CorporateGuideData,
  banner: BannerResponse,
  fallbackAssetId?: number,
): CorporateGuideData {
  return {
    ...prev,
    banner: {
      imageUrl: banner.image?.publicUrl ?? prev.banner.imageUrl,
      imageFileName: banner.image?.originalName ?? prev.banner.imageFileName,
      imageAssetId: banner.image?.assetId ?? fallbackAssetId ?? prev.banner.imageAssetId,
      mainText: banner.mainText ?? prev.banner.mainText,
      subText: banner.subText ?? prev.banner.subText,
      version: banner.version ?? prev.banner.version,
    },
    updatedAt: new Date().toISOString(),
  }
}

export function mergeMetricsIntoCorporateGuide(
  prev: CorporateGuideData,
  rows: CorporateMetricResponse[],
): CorporateGuideData {
  const partial = mapCorporateAdminToDomain({ metrics: rows })
  return {
    ...prev,
    metrics: partial.metrics,
    updatedAt: new Date().toISOString(),
  }
}

export function mergeStepsIntoCorporateGuide(
  prev: CorporateGuideData,
  rows: CorporateStepResponse[],
): CorporateGuideData {
  const partial = mapCorporateAdminToDomain({ steps: rows })
  return {
    ...prev,
    partnershipSteps: partial.partnershipSteps,
    updatedAt: new Date().toISOString(),
  }
}
