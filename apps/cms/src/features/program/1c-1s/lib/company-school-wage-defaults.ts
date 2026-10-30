import {
  normalizeProgramPaymentItemIds,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE,
  resolveProgramPaymentItemIdsFromLabels,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'

/** 1사1교 등록 폼 지급 항목 기본값(수정 가능). 카탈로그 라벨 별칭으로 id를 찾는다. */
export const COMPANY_SCHOOL_WAGE_DEFAULT_PAYMENT_LABELS =
  '교통비(일사일교), 숙박비(일사일교)' as const

/** 1사1교 등록 폼 공제 항목 표시값 */
export const COMPANY_SCHOOL_WAGE_DEDUCTION_LABEL = '원천징수세액' as const

export function resolveCompanySchoolWageDefaultPaymentItemIds(): string[] {
  return resolveProgramPaymentItemIdsFromLabels(COMPANY_SCHOOL_WAGE_DEFAULT_PAYMENT_LABELS).filter(
    id => id !== PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE
  )
}

/**
 * overlay/RHF에 지급 항목이 아직 없으면 기본값을 넣는다.
 * 사용자가 []로 비운 값·이미 고른 값은 유지한다.
 */
export function nextCompanySchoolWagePaymentItemValues(
  raw: unknown,
  catalogReady: boolean
): string[] | null {
  if (raw === undefined) {
    const seeded = resolveCompanySchoolWageDefaultPaymentItemIds()
    return seeded.length > 0 ? seeded : null
  }
  if (!catalogReady || !Array.isArray(raw)) return null
  const current = raw.map(id => String(id ?? '').trim()).filter(Boolean)
  const next = normalizeProgramPaymentItemIds(current)
  if (next.length !== current.length || next.some((id, index) => id !== current[index])) {
    return next
  }
  return null
}
