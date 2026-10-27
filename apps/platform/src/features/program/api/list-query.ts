import type { ProgramsListParams } from '../model/types.ts'
import type { PortalProgramListFilterValue, PortalProgramListQuery } from './types.ts'

const PORTAL_TAB = {
  youth: 'YOUTH_YOUNG',
  institution: 'ORGANIZATION',
  instructor: 'INSTRUCTOR',
} as const

const PORTAL_RECRUITMENT_STATUS = {
  scheduled: 'UPCOMING',
  recruiting: 'OPEN',
  closed: 'CLOSED',
} as const

const PORTAL_SORT = {
  latest: 'LATEST',
  name: 'NAME',
  'closing-soon': 'CLOSING_SOON',
} as const

const EDUCATION_METHOD = {
  online: 'ONLINE',
  offline: 'OFFLINE',
  hybrid: 'HYBRID',
  participant_choice: 'PARTICIPANT_SELECTION',
} as const

function omitAll(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed || trimmed === 'all') return undefined
  return trimmed
}

/** 중복·순서 차이를 제거해 query key에 넣을 필터 값을 정규화한다. */
export function normalizePortalProgramFilterValues(
  value: PortalProgramListFilterValue | undefined,
): string[] {
  const values = Array.isArray(value) ? value : value == null ? [] : [value]
  return [...new Set(values.map(item => item.trim()).filter(Boolean))].sort()
}

function omitAllValues(values: readonly string[] | undefined): string[] {
  return [...new Set((values ?? []).map(item => item.trim()).filter(item => item && item !== 'all'))]
}

function mappedFilterValue(
  scalar: string,
  values: readonly string[] | undefined,
  map: (value: string) => string | undefined,
): PortalProgramListFilterValue | undefined {
  const scalarValue = omitAll(scalar)
  const source = values && values.length > 0 ? omitAllValues(values) : scalarValue ? [scalarValue] : []
  const mapped = source.map(map).filter((value): value is string => Boolean(value))
  if (mapped.length === 0) return undefined
  return mapped.length === 1 ? mapped[0] : mapped
}

function operatingRange(value: string): { operatingFrom?: string; operatingTo?: string } {
  const range = /^(\d{4}-\d{2}-\d{2})~(\d{4}-\d{2}-\d{2})$/.exec(value)
  if (range) return { operatingFrom: range[1], operatingTo: range[2] }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { operatingFrom: value, operatingTo: value }
  if (/^\d{4}$/.test(value)) return { operatingFrom: `${value}-01-01`, operatingTo: `${value}-12-31` }
  return {}
}

/** Platform 목록 URL 상태 → GET /api/portal/programs 쿼리 */
export function toPortalProgramListQuery(
  params: ProgramsListParams,
  pageSize: number,
): PortalProgramListQuery {
  const category = params.category
  const portalTab = category === 'all' ? undefined : PORTAL_TAB[category]
  const programType = mappedFilterValue(
    params.programType,
    params.programTypeValues,
    value => value.toUpperCase(),
  )
  const recruitmentStatus = mappedFilterValue(
    params.recruitmentStatus,
    params.recruitmentStatusValues,
    value =>
      PORTAL_RECRUITMENT_STATUS[value as keyof typeof PORTAL_RECRUITMENT_STATUS] ??
      value.toUpperCase(),
  )
  const educationForm = mappedFilterValue(
    params.educationForm,
    params.educationFormValues,
    value =>
      EDUCATION_METHOD[value as keyof typeof EDUCATION_METHOD] ?? value.toUpperCase(),
  )
  const operating = operatingRange(params.operatingPeriod)
  const recruitmentTargetFilter = mappedFilterValue(
    params.recruitmentTarget,
    params.recruitmentTargetValues,
    omitAll,
  )
  const educationTargetFilter = mappedFilterValue(
    params.educationTarget,
    params.educationTargetValues,
    omitAll,
  )

  return {
    keyword: omitAll(params.q),
    portalTab,
    applicationType: params.applicationType,
    programType,
    recruitmentStatus,
    recruitmentTarget: recruitmentTargetFilter,
    educationTarget: educationTargetFilter,
    educationMethod: educationForm,
    ...operating,
    sort: PORTAL_SORT[params.sort] ?? 'LATEST',
    page: Math.max(0, params.page - 1),
    size: pageSize,
  }
}

/** 홈 캐러셀 — GET /api/portal/programs?page=0&size=8&sort=LATEST. 프로그램별 홈 노출 플래그 없음. */
export const HOME_PORTAL_PROGRAMS_QUERY: PortalProgramListQuery = {
  page: 0,
  size: 8,
  sort: 'LATEST',
}
