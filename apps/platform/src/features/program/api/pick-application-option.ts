import type { PortalApplicationOption } from './application-types'

export type ProgramApplicationSelection = {
  /** exact match — 있으면 이 id만. 다른 canApply로 이동하지 않는다. */
  recruitmentId?: number
  recruitmentIds?: number[]
  applicationTypes?: string[]
}

/**
 * application-options에서 모집 entry를 고른다.
 * recruitmentId가 있으면 그 행만. 같은 id에 신청 유형이 둘이면 applicationType까지 맞는다.
 * 다른 canApply option으로 바꾸지 않는다.
 * applicationType만 있고 후보가 2건이면 null (UJAT 상·하반기 VOLUNTEER).
 */
export function pickApplicationOption(
  options: PortalApplicationOption[],
  selection?: ProgramApplicationSelection | null,
): PortalApplicationOption | null {
  const withBinding = options.filter(
    row =>
      row.formBindingId != null &&
      row.recruitmentId != null &&
      Boolean(row.applicationType?.trim()),
  )
  if (withBinding.length === 0) return null

  const applicationTypes = (selection?.applicationTypes ?? [])
    .map(type => type.trim().toUpperCase())
    .filter(Boolean)

  const exactId =
    selection?.recruitmentId != null && selection.recruitmentId > 0
      ? selection.recruitmentId
      : selection?.recruitmentIds?.length === 1
        ? selection.recruitmentIds[0]
        : undefined

  if (exactId != null) {
    let matches = withBinding.filter(row => row.recruitmentId === exactId)
    if (applicationTypes.length > 0) {
      const types = new Set(applicationTypes)
      matches = matches.filter(row => types.has((row.applicationType ?? '').trim().toUpperCase()))
    }
    if (matches.length !== 1) return null
    return matches[0] ?? null
  }

  if (applicationTypes.length > 0) {
    const types = new Set(applicationTypes)
    const typed = withBinding.filter(row =>
      types.has((row.applicationType ?? '').trim().toUpperCase()),
    )
    if (typed.length !== 1) return null
    return typed[0] ?? null
  }

  const canApply = withBinding.find(row => row.canApply === true)
  return canApply ?? withBinding[0] ?? null
}
