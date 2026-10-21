import type { PortalApplicationOption } from './application-types'

export type ProgramApplicationSelection = {
  /** exact match — 있으면 이 id만. 다른 canApply로 이동하지 않는다. */
  recruitmentId?: number
  recruitmentIds?: number[]
  applicationTypes?: string[]
  programType?: string | null
}

function isUjatProgramType(programType: string | null | undefined): boolean {
  const type = (programType ?? '').trim().toUpperCase()
  return type === 'UJAT' || type === 'UJAT_PROGRAM'
}

/** UJAT는 교육진행자를 VOLUNTEER만 쓴다. INSTRUCTOR 행이 와도 그리지 않는다. */
export function filterPortalApplicationOptionsForProgram(
  options: readonly PortalApplicationOption[],
  programType?: string | null,
): PortalApplicationOption[] {
  if (!isUjatProgramType(programType)) return [...options]
  return options.filter(
    row => (row.applicationType ?? '').trim().toUpperCase() !== 'INSTRUCTOR',
  )
}

function hasRecruitmentIdentity(row: PortalApplicationOption): boolean {
  return row.recruitmentId != null && Boolean(row.applicationType?.trim())
}

function hasFormBinding(row: PortalApplicationOption): boolean {
  return row.formBindingId != null
}

/** 모집 id와 신청 유형을 함께 써서 같은 모집의 다른 신청 유형을 구분한다. */
export function applicationOptionKey(row: PortalApplicationOption): string | null {
  const recruitmentId = row.recruitmentId
  const applicationType = row.applicationType?.trim().toUpperCase()
  if (recruitmentId == null || !applicationType) return null
  return `${recruitmentId}:${applicationType}`
}

function normalizeApplicationTypes(selection?: ProgramApplicationSelection | null): string[] {
  return (selection?.applicationTypes ?? [])
    .map(type => type.trim().toUpperCase())
    .filter(Boolean)
}

function resolveExactRecruitmentId(
  selection?: ProgramApplicationSelection | null,
): number | undefined {
  if (selection?.recruitmentId != null && selection.recruitmentId > 0) {
    return selection.recruitmentId
  }
  if (selection?.recruitmentIds?.length === 1) {
    return selection.recruitmentIds[0]
  }
  return undefined
}

function filterByApplicationTypes(
  rows: PortalApplicationOption[],
  applicationTypes: string[],
): PortalApplicationOption[] {
  if (applicationTypes.length === 0) return rows
  const types = new Set(applicationTypes)
  return rows.filter(row => types.has((row.applicationType ?? '').trim().toUpperCase()))
}

/**
 * application-options에서 모집 entry를 고른다.
 * recruitmentId가 있으면 그 행만. 같은 id에 신청 유형이 둘이면 applicationType까지 맞는다.
 * formBindingId가 null이어도 해당 행을 반환한다(blockedReason 전달용). 양식 GET은 호출부에서 막는다.
 * 다른 canApply option으로 바꾸지 않는다.
 * applicationType만 있고 후보가 2건이면 null (UJAT 상·하반기 VOLUNTEER).
 */
export function pickApplicationOption(
  options: PortalApplicationOption[],
  selection?: ProgramApplicationSelection | null,
): PortalApplicationOption | null {
  const identifiable = filterPortalApplicationOptionsForProgram(
    options,
    selection?.programType,
  ).filter(hasRecruitmentIdentity)
  if (identifiable.length === 0) return null

  const applicationTypes = normalizeApplicationTypes(selection)
  const exactId = resolveExactRecruitmentId(selection)
  const byKey = new Map(
    identifiable.flatMap(row => {
      const key = applicationOptionKey(row)
      return key ? [[key, row] as const] : []
    }),
  )

  if (exactId != null) {
    if (applicationTypes.length === 1) {
      return byKey.get(`${exactId}:${applicationTypes[0]}`) ?? null
    }
    let matches = identifiable.filter(row => row.recruitmentId === exactId)
    matches = filterByApplicationTypes(matches, applicationTypes)
    if (matches.length !== 1) return null
    return matches[0] ?? null
  }

  if (applicationTypes.length > 0) {
    const typed = filterByApplicationTypes(identifiable, applicationTypes)
    if (typed.length !== 1) return null
    return typed[0] ?? null
  }

  const withBinding = identifiable.filter(hasFormBinding)
  const canApply = withBinding.find(row => row.canApply === true)
  return canApply ?? withBinding[0] ?? null
}
