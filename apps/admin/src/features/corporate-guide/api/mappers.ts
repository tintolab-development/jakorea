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
  transparency: '최고수준의 투명성',
  proven_impact: '검증된 임팩트',
}

const METRIC_API_ID: Record<MetricItemId, number> = {
  global_scale: 1,
  transparency: 2,
  proven_impact: 3,
}

const METRIC_LABEL_DEFAULTS: Record<MetricItemId, string> = {
  global_scale: '글로벌 확장성',
  transparency: '최고수준의 투명성',
  proven_impact: '검증된 임팩트',
}

const METRIC_DESCRIPTION_DEFAULTS: Record<MetricItemId, string> = {
  global_scale: 'JA 글로벌 네트워크를 통한 교육 프로그램 확장',
  transparency: 'JA Worldwide 기준에 따른 투명한 조직 운영 체계',
  proven_impact: '연간 청소년 교육으로 이어온 10년 이상의 장기 파트너십',
}

const LEGACY_METRIC_LABELS: Partial<Record<MetricItemId, string>> = {
  transparency: '최고 수준의 투명성',
}

const LEGACY_METRIC_DESCRIPTIONS: Partial<Record<MetricItemId, string>> = {
  global_scale: '글로벌 네트워크를 통한 사업 확장',
  proven_impact: '10년 이상 이어온 파트너십을 통한 누적 교육 인원',
}

const STEP_DESCRIPTION_DEFAULTS: Record<PartnershipStepNumber, string> = {
  1: 'JA Korea에 파트너십 문의',
  2: '프로그램 적합도 및 수혜 대상 타당성 조사\n기업 사회공헌 목표 파악',
  3: '프로그램 목적 및 포지셔닝 설계\n수혜 대상 및 프로그램 운영 방식 제안',
  4: '운영 기간 및 기부금 확정\n기부금(프로그램 운영비) 지원',
  5: '수혜 대상자 및 교사·강사·봉사자 모집/선발\n프로그램 진행',
  6: '프로그램 결과 및 회계 보고\n성과 평가\n차년도 계획 수립 및 파트너십 점검',
}

const LEGACY_STEP_DESCRIPTIONS: Record<PartnershipStepNumber, string> = {
  1: '파트너십 문의',
  2: '프로그램 적합성 및 교육 대상 검토\n기업 CSR 목표 파악',
  3: '프로그램 목적 및 포지셔닝 설계\n운영 방식 제안',
  4: '운영 기간 및 후원 규모 확정\n프로그램 비용 지원',
  5: '수혜자 및 강사 모집·선발\n프로그램 진행',
  6: '결과·정산 보고서 제공\n성과 평가 및 차년도 계획 수립',
}

function normalizeCopy(value: string): string {
  return value.replace(/·/g, '').replace(/\s+/g, ' ').trim()
}

function resolveMetricLabel(id: MetricItemId, value: string | undefined): string {
  const label = value?.trim() ?? ''
  return !label || label === LEGACY_METRIC_LABELS[id]
    ? METRIC_LABEL_DEFAULTS[id]
    : label
}

function resolveMetricDescription(id: MetricItemId, value: string | undefined): string {
  const description = value?.trim() ?? ''
  return !description || normalizeCopy(description) === normalizeCopy(LEGACY_METRIC_DESCRIPTIONS[id] ?? '')
    ? METRIC_DESCRIPTION_DEFAULTS[id]
    : value ?? METRIC_DESCRIPTION_DEFAULTS[id]
}

function resolveStepDescription(
  step: PartnershipStepNumber,
  value: string | undefined,
): string {
  const description = value?.trim() ?? ''
  return !description || normalizeCopy(description) === normalizeCopy(LEGACY_STEP_DESCRIPTIONS[step])
    ? STEP_DESCRIPTION_DEFAULTS[step]
    : value ?? STEP_DESCRIPTION_DEFAULTS[step]
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
        itemLabel: resolveMetricLabel(domainId, item.name),
        title: item.title ?? '',
        description: resolveMetricDescription(domainId, item.description),
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
        description: resolveStepDescription(step, item.description),
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
