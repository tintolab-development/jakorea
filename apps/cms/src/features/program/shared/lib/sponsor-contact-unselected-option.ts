/** 후원사 담당자 셀렉트 — 담당자를 고르지 않는 명시 값. API contact id로 보내지 않는다. */
export const SPONSOR_CONTACT_UNSELECTED_VALUE = '__sponsor_contact_unselected__' as const

export const SPONSOR_CONTACT_UNSELECTED_LABEL = '미선택' as const

export function isSponsorContactUnselected(value: string | null | undefined): boolean {
  return value === SPONSOR_CONTACT_UNSELECTED_VALUE
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

/**
 * 미선택과 실제 담당자는 같이 두지 않는다.
 * 미선택을 새로 고르면 미선택만, 담당자를 고르면 미선택을 뺀다.
 */
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
