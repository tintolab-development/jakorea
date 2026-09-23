export type CompanySchoolWageAmountKind = 'regular' | 'longDistance'

/**
 * `1시간 당 | 기본 : 120,000원 | 장거리 : 60,000원` 에서 금액만 읽는다.
 * 「1시간 당」처럼 원 단위가 없는 조각은 금액으로 쓰지 않는다.
 */
export function parseCompanySchoolWageAmountFromPricing(
  pricing: string | undefined,
  kind: CompanySchoolWageAmountKind
): string | undefined {
  if (!pricing?.trim()) return undefined
  const parts = pricing
    .split(/\s*\|\s*/)
    .map(part => part.trim())
    .filter(Boolean)

  const labeled = parts.find(part =>
    kind === 'regular' ? part.includes('기본') : part.includes('장거리')
  )
  const withWon = parts.filter(part => /[\d,]+\s*원/.test(part))
  const fallback =
    kind === 'regular'
      ? withWon.find(part => !part.includes('장거리'))
      : withWon.find(part => part.includes('장거리'))
  const target = labeled ?? fallback
  return target?.match(/([\d,]+)\s*원/)?.[1]
}
