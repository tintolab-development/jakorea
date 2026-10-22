/** 후원사 담당자 셀렉트 — 담당자를 고르지 않는 명시 값. API contact id로 보내지 않는다. */
export const SPONSOR_CONTACT_UNSELECTED_VALUE = '__sponsor_contact_unselected__' as const

export const SPONSOR_CONTACT_UNSELECTED_LABEL = '미선택' as const

export function isSponsorContactUnselected(value: string | null | undefined): boolean {
  return value === SPONSOR_CONTACT_UNSELECTED_VALUE
}

export function isSponsorContactUnselectedLabel(value: string | null | undefined): boolean {
  return value?.trim() === SPONSOR_CONTACT_UNSELECTED_LABEL
}

/**
 * 저장된 담당자가 미선택이면 수정 폼에 미선택 값을 넣는다.
 * 저장 시 contact id는 빼고 라벨만 `미선택`으로 남는 계약을 되돌린다.
 */
export function resolveSponsorContactIdsForEdit(input: {
  ids?: readonly string[] | null
  id?: string | null
  managerLine?: string | null
  /** 후원사가 선택된 상태에서 담당자 ref·표시명이 없으면 미선택 sentinel */
  hasSelectedSponsors?: boolean
}): string[] {
  const stored = [
    ...new Set(
      [...(input.ids ?? []), input.id ?? '']
        .map(value => value.trim())
        .filter(id => id && id !== '__all__' && id !== 'ALL')
    ),
  ]
  if (stored.some(id => isSponsorContactUnselected(id))) {
    return [SPONSOR_CONTACT_UNSELECTED_VALUE]
  }
  if (stored.length > 0) return stored
  const managerLine = input.managerLine?.trim() ?? ''
  if (isSponsorContactUnselectedLabel(managerLine)) {
    return [SPONSOR_CONTACT_UNSELECTED_VALUE]
  }
  if (input.hasSelectedSponsors && !managerLine) {
    return [SPONSOR_CONTACT_UNSELECTED_VALUE]
  }
  return []
}

/** Program 조회 스냅샷 → 수정 폼/overlay 담당자 값 */
export function resolveSponsorContactIdsFromProgram(program: {
  sponsorId?: string | null
  managerName?: string | null
  generalCommonInfo?: {
    sponsorManagementIds?: readonly string[] | null
    sponsorManagementId?: string | null
    sponsorManagerContactIds?: readonly string[] | null
    sponsorManagerContactId?: string | null
    sponsorManagerLine?: string | null
  } | null
}): string[] {
  const sponsorIds =
    program.generalCommonInfo?.sponsorManagementIds?.length
      ? program.generalCommonInfo.sponsorManagementIds
      : program.generalCommonInfo?.sponsorManagementId
        ? [program.generalCommonInfo.sponsorManagementId]
        : program.sponsorId
          ? [program.sponsorId]
          : []
  return resolveSponsorContactIdsForEdit({
    ids: program.generalCommonInfo?.sponsorManagerContactIds,
    id: program.generalCommonInfo?.sponsorManagerContactId,
    managerLine:
      program.generalCommonInfo?.sponsorManagerLine?.trim() ||
      program.managerName?.trim() ||
      '',
    hasSelectedSponsors: sponsorIds.some(id => String(id).trim() !== ''),
  })
}

export function withSponsorContactUnselectedOption<T extends { value: string; label: string }>(
  options: readonly T[],
  extra?: Omit<T, 'value' | 'label'>
): T[] {
  const unselected = {
    ...(extra ?? {}),
    value: SPONSOR_CONTACT_UNSELECTED_VALUE,
    label: SPONSOR_CONTACT_UNSELECTED_LABEL,
  } as T
  return [...options, unselected]
}

/** 후원사가 선택돼 있으면 담당자가 0명이어도 미선택을 붙인다. */
export function withSponsorContactUnselectedIfSponsorsSelected<
  T extends { value: string; label: string },
>(options: readonly T[], hasSelectedSponsors: boolean, extra?: Omit<T, 'value' | 'label'>): T[] {
  if (!hasSelectedSponsors) return [...options]
  return withSponsorContactUnselectedOption(options, extra)
}

/**
 * 미선택과 실제 담당자는 같이 두지 않는다.
 * 미선택을 새로 고르면 미선택만, 담당자를 고르면 미선택을 뺀다.
 */
/** 저장·조회 데이터 기준 후원사 담당자가 명시적으로 미선택인지 */
export function isProgramSponsorManagerUnselected(input: {
  sponsorManagerContactIds?: readonly string[] | null
  sponsorManagerContactId?: string | null
  managerLine?: string | null
  managerName?: string | null
}): boolean {
  return resolveSponsorContactIdsForEdit({
    ids: input.sponsorManagerContactIds,
    id: input.sponsorManagerContactId,
    managerLine:
      input.managerLine?.trim() ||
      input.managerName?.trim() ||
      '',
  }).some(id => isSponsorContactUnselected(id))
}

export function normalizeSponsorContactUnselectedSelection(
  next: readonly string[],
  previous: readonly string[] = []
): string[] {
  const unique = [...new Set(next.map(id => id.trim()).filter(Boolean))]
  const hadUnselected = previous.some(id => isSponsorContactUnselected(id))
  const hasUnselected = unique.some(id => isSponsorContactUnselected(id))
  if (!hasUnselected) return unique
  if (!hadUnselected || unique.length === 1) return [SPONSOR_CONTACT_UNSELECTED_VALUE]
  return unique.filter(id => !isSponsorContactUnselected(id))
}
