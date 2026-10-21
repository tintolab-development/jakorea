import type { ProgramsListParams } from '../model/types.ts'
import type { PortalProgramListQuery } from './types.ts'

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
  participant_choice: 'PARTICIPANT_CHOICE',
} as const

function omitAll(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed || trimmed === 'all') return undefined
  return trimmed
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
  const programType = omitAll(params.programType)?.toUpperCase()
  const recruitmentStatus = omitAll(params.recruitmentStatus)
  const educationForm = omitAll(params.educationForm)
  const operating = operatingRange(params.operatingPeriod)
  const recruitmentTargetFilter = omitAll(params.recruitmentTarget)
  const educationTargetFilter = omitAll(params.educationTarget)
  /** API는 `educationTargets`만 사용. URL의 모집·교육 대상 필터가 서로 다르면 전송하지 않는다. */
  const educationTargets =
    educationTargetFilter && recruitmentTargetFilter && educationTargetFilter !== recruitmentTargetFilter
      ? undefined
      : educationTargetFilter ?? recruitmentTargetFilter

  return {
    keyword: omitAll(params.q),
    portalTab,
    programType,
    recruitmentStatus: recruitmentStatus
      ? PORTAL_RECRUITMENT_STATUS[recruitmentStatus as keyof typeof PORTAL_RECRUITMENT_STATUS] ??
        recruitmentStatus.toUpperCase()
      : undefined,
    educationTargets,
    educationMethod: educationForm
      ? EDUCATION_METHOD[educationForm as keyof typeof EDUCATION_METHOD] ??
        educationForm.toUpperCase()
      : undefined,
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
