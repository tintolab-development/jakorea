import type { PortalRecruitment } from '../api/types'
import type { ProgramCategory, ProgramListItem, ProgramTab } from '../model/types'

/** 목록 탭이 가리키는 신청 유형. 다른 탭 모집으로 바꾸지 않는다. */
const TAB_APPLICATION_TYPES = {
  YOUTH_YOUNG: ['INDIVIDUAL', 'VOLUNTEER'],
  ORGANIZATION: ['ORGANIZATION'],
  INSTRUCTOR: ['INSTRUCTOR'],
} as const

export type PortalTabCode = keyof typeof TAB_APPLICATION_TYPES

export type PortalRecruitmentFocus = {
  portalTab?: PortalTabCode
  applicationTypes?: string[]
  /** 목록→상세→신청에서 단일 모집만 쓴다. 하위 호환으로 배열 파싱은 허용. */
  recruitmentIds?: number[]
}

export type SelectedRecruitments = {
  rows: PortalRecruitment[]
  applicationTypes: string[]
  recruitmentIds: number[]
  /** focus로 좁혔지만 확정 1건이 아님 — 대표 모집으로 쓰지 않는다. */
  ambiguous: boolean
}

const CATEGORY_TO_PORTAL_TAB: Record<ProgramTab, PortalTabCode> = {
  youth: 'YOUTH_YOUNG',
  institution: 'ORGANIZATION',
  instructor: 'INSTRUCTOR',
}

const PORTAL_TAB_TO_CATEGORY: Record<PortalTabCode, ProgramTab> = {
  YOUTH_YOUNG: 'youth',
  ORGANIZATION: 'institution',
  INSTRUCTOR: 'instructor',
}

export function portalTabFromCategory(category: ProgramCategory): PortalTabCode | undefined {
  if (category === 'all') return undefined
  return CATEGORY_TO_PORTAL_TAB[category]
}

export function programTabFromPortalTab(tab: PortalTabCode): ProgramTab {
  return PORTAL_TAB_TO_CATEGORY[tab]
}

function upperList(values: readonly string[] | undefined): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values ?? []) {
    const code = value.trim().toUpperCase()
    if (!code || seen.has(code)) continue
    seen.add(code)
    result.push(code)
  }
  return result
}

/** 탭에 허용된 신청 유형. 목록 `availableApplicationTypes`가 있으면 그 교집합만 쓴다. */
export function applicationTypesForPortalTab(
  tab: PortalTabCode,
  listed?: readonly string[],
): string[] {
  const allowed = TAB_APPLICATION_TYPES[tab]
  const fromList = upperList(listed).filter(code =>
    (allowed as readonly string[]).includes(code),
  )
  return fromList.length > 0 ? fromList : [...allowed]
}

export function rowApplicationTypes(row: PortalRecruitment): string[] {
  const listed = upperList(row.applicationTypes)
  if (listed.length > 0) return listed
  const explicit = upperList(row.applicationType ? [row.applicationType] : undefined)
  if (explicit.length > 0) return explicit
  const recruitmentType = (row.recruitmentType ?? '').trim().toUpperCase()
  const targetType = (row.targetType ?? '').trim().toUpperCase()
  if (recruitmentType === 'VOLUNTEER') return ['VOLUNTEER']
  if (recruitmentType === 'INSTRUCTOR') return ['INSTRUCTOR']
  if (recruitmentType === 'PARTICIPANT' && targetType === 'INDIVIDUAL') return ['INDIVIDUAL']
  if (recruitmentType === 'PARTICIPANT' && targetType === 'BOTH') {
    return ['INDIVIDUAL', 'ORGANIZATION']
  }
  if (recruitmentType === 'PARTICIPANT') return ['ORGANIZATION']
  return []
}

/**
 * 목록 카드 React key.
 * 같은 recruitmentId에 신청 유형이 둘이면 applicationType까지 붙인다.
 */
export function programListEntryKey(
  program: Pick<ProgramListItem, 'id' | 'recruitmentId' | 'applicationType'>,
): string {
  if (program.recruitmentId == null) return program.id
  const applicationType = program.applicationType?.trim().toUpperCase()
  return applicationType
    ? `${program.id}:${program.recruitmentId}:${applicationType}`
    : `${program.id}:${program.recruitmentId}`
}

/** 목록 행 → 상세/신청 focus. recruitmentId가 있으면 단일 id만 실는다. */
export function focusFromListItem(
  program: Pick<ProgramListItem, 'recruitmentId' | 'applicationType' | 'applicationTypes'>,
  category: ProgramCategory,
): PortalRecruitmentFocus | null {
  const portalTab = portalTabFromCategory(category)
  const recruitmentId =
    program.recruitmentId != null &&
    Number.isSafeInteger(program.recruitmentId) &&
    program.recruitmentId > 0
      ? program.recruitmentId
      : undefined
  const singleType = program.applicationType?.trim().toUpperCase() || undefined
  const applicationTypes = singleType
    ? [singleType]
    : portalTab
      ? applicationTypesForPortalTab(portalTab, program.applicationTypes)
      : upperList(program.applicationTypes)

  if (!portalTab && !recruitmentId && applicationTypes.length === 0) return null
  return {
    ...(portalTab ? { portalTab } : {}),
    ...(applicationTypes.length > 0 ? { applicationTypes } : {}),
    ...(recruitmentId != null ? { recruitmentIds: [recruitmentId] } : {}),
  }
}

/**
 * 상세 모집 선택.
 * 1) recruitmentId exact
 * 2) applicationType / portalTab narrowing
 * 3) exact id 없이 후보가 2건 이상이면 ambiguous — 임의 첫 행을 대표로 쓰지 않는다.
 */
export function selectRecruitmentsForFocus(
  recruitments: readonly PortalRecruitment[] | undefined,
  focus: PortalRecruitmentFocus,
): SelectedRecruitments {
  const all = [...(recruitments ?? [])]
  const requestedIds = (focus.recruitmentIds ?? []).filter(id => id > 0)
  const exactId = requestedIds.length === 1 ? requestedIds[0] : undefined

  if (exactId != null) {
    const requested = upperList(focus.applicationTypes)
    const rows = all.filter(row => {
      if (row.recruitmentId !== exactId) return false
      if (requested.length === 0) return true

      const listedTypes = upperList(row.applicationTypes)
      if (listedTypes.length > 0) {
        return requested.every(type => listedTypes.includes(type))
      }
      const derived = rowApplicationTypes(row)
      if (derived.length > 0) {
        return requested.every(type => derived.includes(type))
      }
      return true
    })
    const fromRows = upperList(rows.flatMap(rowApplicationTypes))
    const applicationTypes =
      requested.length > 0 ? fromRows.filter(code => requested.includes(code)) : fromRows
    return {
      rows,
      applicationTypes,
      recruitmentIds: rows.flatMap(row => (row.recruitmentId != null ? [row.recruitmentId] : [])),
      // 같은 recruitmentId에 신청 유형이 둘이면(BOTH) 요청 유형이 하나일 때만 확정한다.
      ambiguous: rows.length !== 1 || applicationTypes.length !== 1,
    }
  }

  const tabTypes = focus.portalTab ? ([...TAB_APPLICATION_TYPES[focus.portalTab]] as string[]) : null
  const requested = upperList(focus.applicationTypes)
  const allowed =
    requested.length > 0
      ? tabTypes
        ? requested.filter(code => tabTypes.includes(code))
        : requested
      : tabTypes

  let rows = all
  if (requestedIds.length > 1) {
    const ids = new Set(requestedIds)
    rows = rows.filter(row => row.recruitmentId != null && ids.has(row.recruitmentId))
  }
  if (allowed && allowed.length > 0) {
    rows = rows.filter(row => rowApplicationTypes(row).some(code => allowed.includes(code)))
  }

  const applicationTypes = upperList(
    rows.flatMap(row =>
      rowApplicationTypes(row).filter(code => !allowed || allowed.includes(code)),
    ),
  )
  const recruitmentIds = rows.flatMap(row =>
    row.recruitmentId != null ? [row.recruitmentId] : [],
  )
  const narrowed = Boolean(focus.portalTab || requested.length > 0 || requestedIds.length > 0)
  const ambiguous = narrowed && rows.length !== 1

  return {
    rows,
    applicationTypes,
    recruitmentIds,
    ambiguous,
  }
}

/** 상세 GET query — URL 의 applicationType·recruitmentId 만 실어 보낸다. */
export function portalProgramDetailRequestQuery(
  focus?: PortalRecruitmentFocus | null,
): { recruitmentId?: number; applicationType?: string } | undefined {
  const recruitmentId = focus?.recruitmentIds?.[0]
  const applicationType = focus?.applicationTypes?.[0]?.trim()
  const query: { recruitmentId?: number; applicationType?: string } = {}
  if (recruitmentId != null && Number.isSafeInteger(recruitmentId) && recruitmentId > 0) {
    query.recruitmentId = recruitmentId
  }
  if (applicationType) query.applicationType = applicationType
  return query.recruitmentId != null || query.applicationType ? query : undefined
}

export function writePortalRecruitmentFocus(
  params: URLSearchParams,
  focus?: PortalRecruitmentFocus | null,
) {
  if (!focus) return
  if (focus.portalTab) params.set('portalTab', focus.portalTab)
  if (focus.applicationTypes && focus.applicationTypes.length > 0) {
    params.set('applicationType', focus.applicationTypes.join(','))
  }
  if (focus.recruitmentIds && focus.recruitmentIds.length > 0) {
    // 목록→상세는 단일 id. 하위 호환으로 첫 id만 쓴다.
    params.set('recruitmentId', String(focus.recruitmentIds[0]))
  }
}

function parsePortalTab(value: string | null): PortalTabCode | undefined {
  const code = value?.trim().toUpperCase()
  if (code === 'YOUTH_YOUNG' || code === 'ORGANIZATION' || code === 'INSTRUCTOR') return code
  return undefined
}

export function readPortalRecruitmentFocus(search: string): PortalRecruitmentFocus | null {
  const params = new URLSearchParams(search)
  const portalTab = parsePortalTab(params.get('portalTab'))
  const applicationTypes = upperList(params.get('applicationType')?.split(','))
  const recruitmentIds = (params.get('recruitmentId') ?? '')
    .split(',')
    .flatMap(part => {
      const id = Number.parseInt(part.trim(), 10)
      return Number.isSafeInteger(id) && id > 0 ? [id] : []
    })
  // 단일 모집 identity — 여러 값이 오면 첫 값만 사용
  const singleRecruitmentIds = recruitmentIds.length > 0 ? [recruitmentIds[0]!] : []
  if (!portalTab && applicationTypes.length === 0 && singleRecruitmentIds.length === 0) {
    return null
  }
  return {
    ...(portalTab ? { portalTab } : {}),
    ...(applicationTypes.length > 0 ? { applicationTypes } : {}),
    ...(singleRecruitmentIds.length > 0 ? { recruitmentIds: singleRecruitmentIds } : {}),
  }
}
