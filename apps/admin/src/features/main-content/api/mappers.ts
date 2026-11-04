/**
 * 메인 콘텐츠 — OpenAPI ↔ 도메인 매핑
 */

import type {
  DonationSection,
  EducationSection,
  ImpactStoryOption,
  ImpactStorySection,
  MainContents,
  PerformanceMetric,
  PerformanceMetricId,
  PerformanceSection,
} from '@/entities/main-content/model/types'
import type { AdminContentResponse } from '@/shared/api/generated/main/schemas/adminContentResponse'
import type { DonationResponse } from '@/shared/api/generated/main/schemas/donationResponse'
import type { DonationUpdateRequest } from '@/shared/api/generated/main/schemas/donationUpdateRequest'
import type { EducationResponse } from '@/shared/api/generated/main/schemas/educationResponse'
import type { EducationUpdateRequest } from '@/shared/api/generated/main/schemas/educationUpdateRequest'
import type { ImpactResponse } from '@/shared/api/generated/main/schemas/impactResponse'
import type { ImpactUpdateRequest } from '@/shared/api/generated/main/schemas/impactUpdateRequest'
import type { MainStoryOption } from '@/shared/api/generated/main/schemas/mainStoryOption'
import type { PerformanceResponse } from '@/shared/api/generated/main/schemas/performanceResponse'
import type { PerformanceUpdateRequest } from '@/shared/api/generated/main/schemas/performanceUpdateRequest'

const METRIC_DEFS: readonly {
  id: PerformanceMetricId
  label: string
  unit: string
  countKey:
    | 'networkDistributionCount'
    | 'partnerOrganizationCount'
    | 'educatorCount'
    | 'youthBeneficiaryCount'
}[] = [
  {
    id: 'network',
    label: '전국 교육 네트워크 분포 수',
    unit: '지역+',
    countKey: 'networkDistributionCount',
  },
  {
    id: 'partners',
    label: '전문 협업 학교, 기관, 단체 수',
    unit: '개+',
    countKey: 'partnerOrganizationCount',
  },
  {
    id: 'volunteers',
    label: '전문 봉사자, 교사, 강사 수',
    unit: '명+',
    countKey: 'educatorCount',
  },
  {
    id: 'beneficiaries',
    label: '교육 수혜자 청소년들의 수',
    unit: '여명',
    countKey: 'youthBeneficiaryCount',
  },
]

function formatCount(value: number | undefined): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  return new Intl.NumberFormat('ko-KR').format(Math.max(0, Math.trunc(value)))
}

/** FE 표시 문자열("1,000") → API Long. 빈 값은 fallback 하지 않는다. */
export function parseMetricCount(value: string): number {
  const digits = value.trim().replace(/,/g, '')
  if (!/^\d+$/.test(digits)) {
    throw new Error('metric count is required')
  }
  return Number(digits)
}

export function mapStoryOptionToDomain(row: MainStoryOption): ImpactStoryOption {
  return {
    id: row.id != null ? String(row.id) : '',
    title: row.title ?? '',
    createdAt: row.publishAt ?? '',
  }
}

function mapEducation(row: EducationResponse | undefined): EducationSection {
  return {
    title: row?.title ?? '',
    version: row?.version ?? 0,
  }
}

function mapImpact(row: ImpactResponse | undefined): ImpactStorySection {
  return {
    title: row?.title ?? '',
    youtubeUrl: row?.youtubeUrl ?? '',
    featuredContentId: row?.featuredStoryId != null ? String(row.featuredStoryId) : '',
    version: row?.version ?? 0,
  }
}

function mapPerformance(row: PerformanceResponse | undefined): PerformanceSection {
  const metrics: PerformanceMetric[] = METRIC_DEFS.map(def => ({
    id: def.id,
    label: def.label,
    unit: def.unit,
    value: formatCount(row?.[def.countKey]),
  }))
  return {
    title: row?.title ?? '',
    metrics,
    bottomText: row?.bottomText ?? '',
    version: row?.version ?? 0,
  }
}

function mapDonation(row: DonationResponse | undefined): DonationSection {
  return {
    title: row?.title ?? '',
    cta1: {
      label: row?.cta1Label ?? '',
      linkUrl: row?.cta1Url ?? '',
    },
    cta2: {
      label: row?.cta2Label ?? '',
      linkUrl: row?.cta2Url ?? '',
    },
    version: row?.version ?? 0,
  }
}

export function mapAdminContentToDomain(response: AdminContentResponse): MainContents {
  const options = (response.impact?.featuredStoryOptions ?? [])
    .map(mapStoryOptionToDomain)
    .filter(opt => opt.id)
  return {
    education: mapEducation(response.education),
    impactStory: mapImpact(response.impact),
    performance: mapPerformance(response.performance),
    donation: mapDonation(response.donation),
    updatedAt: new Date().toISOString(),
    impactStoryOptions: options,
  }
}

export function toEducationUpdateRequest(section: EducationSection): EducationUpdateRequest {
  return {
    title: section.title.trim(),
    version: section.version,
  }
}

export function toImpactUpdateRequest(section: ImpactStorySection): ImpactUpdateRequest {
  return {
    title: section.title.trim(),
    youtubeUrl: section.youtubeUrl.trim(),
    featuredStoryId: Number(section.featuredContentId.trim()),
    version: section.version,
  }
}

export function toPerformanceUpdateRequest(
  section: PerformanceSection,
): PerformanceUpdateRequest {
  const byId = new Map(section.metrics.map(m => [m.id, m]))
  return {
    title: section.title.trim(),
    networkDistributionCount: parseMetricCount(byId.get('network')?.value ?? ''),
    partnerOrganizationCount: parseMetricCount(byId.get('partners')?.value ?? ''),
    educatorCount: parseMetricCount(byId.get('volunteers')?.value ?? ''),
    youthBeneficiaryCount: parseMetricCount(byId.get('beneficiaries')?.value ?? ''),
    bottomText: section.bottomText.trim(),
    version: section.version,
  }
}

export function toDonationUpdateRequest(section: DonationSection): DonationUpdateRequest {
  return {
    title: section.title.trim(),
    cta1Label: section.cta1.label.trim(),
    cta1Url: section.cta1.linkUrl.trim(),
    cta2Label: section.cta2.label.trim(),
    cta2Url: section.cta2.linkUrl.trim(),
    version: section.version,
  }
}

export function mergeEducationResponse(
  prev: MainContents,
  row: EducationResponse,
): MainContents {
  return {
    ...prev,
    education: mapEducation(row),
    updatedAt: new Date().toISOString(),
  }
}

export function mergeImpactResponse(prev: MainContents, row: ImpactResponse): MainContents {
  const options = (row.featuredStoryOptions ?? [])
    .map(mapStoryOptionToDomain)
    .filter(opt => opt.id)
  return {
    ...prev,
    impactStory: mapImpact(row),
    impactStoryOptions: options.length > 0 ? options : prev.impactStoryOptions,
    updatedAt: new Date().toISOString(),
  }
}

export function mergePerformanceResponse(
  prev: MainContents,
  row: PerformanceResponse,
): MainContents {
  return {
    ...prev,
    performance: mapPerformance(row),
    updatedAt: new Date().toISOString(),
  }
}

export function mergeDonationResponse(
  prev: MainContents,
  row: DonationResponse,
): MainContents {
  return {
    ...prev,
    donation: mapDonation(row),
    updatedAt: new Date().toISOString(),
  }
}
