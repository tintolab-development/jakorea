/**
 * 일반 프로그램 상세 임금 정보 — view / overlay 시드가 같은 급수·금액·지급 항목을 쓴다.
 */
import { parseCompanySchoolWageAmountFromPricing } from '@/features/program/shared/lib/company-school-wage-pricing'
import { formatNumberDisplay } from '@/shared/utils'
import {
  coerceProgramPaymentItemsText,
  programPaymentItemLabelsFromIds,
  resolveProgramPaymentItemIdsFromLabels,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'

export const WAGE_GRADE_FIELDS = [
  { label: '1급 강사비', overlayKey: 'grade1Fee', max: 500_000, maxHint: '500,000' },
  { label: '2급 강사비', overlayKey: 'grade2Fee', max: 400_000, maxHint: '400,000' },
  { label: '3급 강사비', overlayKey: 'grade3Fee', max: 300_000, maxHint: '300,000' },
] as const

/** settlementPolicy 라벨 → 등록 지급 항목 옵션명 */
const PAYMENT_ITEM_LABEL_ALIASES: Record<string, string> = {
  교통비: '강사 교통비',
  식비: '식사비',
}

export function parseWageGradeAmount(pricing: string | undefined): number | null {
  if (!pricing?.trim()) return null
  const fromLabeled = parseCompanySchoolWageAmountFromPricing(pricing, 'regular')
  if (fromLabeled) {
    const n = Number(fromLabeled.replace(/,/g, ''))
    if (Number.isFinite(n)) return n
  }
  const match = pricing.match(/([\d,]+)\s*원/)
  if (!match) return null
  const n = Number(match[1].replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

/** 상세 RHF 금액 필드 — 「1시간 당」의 1을 금액으로 쓰지 않는다. */
export function parseWageGradeAmountToFormString(pricing: string | undefined): string {
  const amount = parseWageGradeAmount(pricing)
  return amount == null ? '' : String(amount)
}

export function pricingByWageGrade(
  rows: Array<{ grade: string; pricing: string }> | undefined
): Record<string, string | undefined> {
  return Object.fromEntries((rows ?? []).map(row => [row.grade, row.pricing]))
}

export function resolveWagePaymentItemIds(paymentItems: unknown): string[] {
  const text = coerceProgramPaymentItemsText(paymentItems)
  if (!text.trim()) return []
  const aliased = text
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(token => PAYMENT_ITEM_LABEL_ALIASES[token] ?? token)
    .join(', ')
  return resolveProgramPaymentItemIdsFromLabels(aliased)
}

export function resolveWagePaymentItemsView(paymentItems: unknown): string {
  const text = coerceProgramPaymentItemsText(paymentItems)
  const ids = resolveWagePaymentItemIds(text)
  return programPaymentItemLabelsFromIds(ids) || text.trim() || '-'
}

const WAGE_OVERLAY = 'generalRegistration.wageInfo' as const

function overlayWageFee(overlay: Record<string, unknown> | undefined, key: string): number | null {
  const raw = overlay?.[key]
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw.replace(/,/g, ''))
    return Number.isFinite(n) ? n : null
  }
  return null
}

export function formatWageGradePricing(amount: number | null): string {
  if (amount == null) return ''
  return `1시간 당 | 기본 : ${formatNumberDisplay(amount)}원`
}

export function resolveWageGradeFee(
  overlay: Record<string, unknown> | undefined,
  rows: Array<{ grade: string; pricing: string }> | undefined,
  field: (typeof WAGE_GRADE_FIELDS)[number]
): number | null {
  const fromRow = parseWageGradeAmount(pricingByWageGrade(rows)[field.label])
  if (fromRow != null) return fromRow
  return overlayWageFee(overlay, `${WAGE_OVERLAY}.${field.overlayKey}`)
}

export function resolveWagePaymentItemsFromOverlay(
  overlay: Record<string, unknown> | undefined
): string {
  const labels = overlay?.[`${WAGE_OVERLAY}.paymentItemLabels`]
  if (typeof labels === 'string' && labels.trim()) return labels.trim()
  const ids = overlay?.[`${WAGE_OVERLAY}.paymentItemValues`]
  if (Array.isArray(ids) && ids.length > 0) {
    return programPaymentItemLabelsFromIds(ids.map(String))
  }
  return ''
}

/** 조회 — 중첩 wageGradeRows가 SSOT. overlay는 중첩 금액이 없을 때만. */
export function applyRegistrationWageOverlayToCommonInfo<
  T extends { wageGradeRows?: Array<{ grade: string; pricing: string }>; paymentItems?: string },
>(common: T, overlay: Record<string, unknown> | undefined): T {
  const byGrade = pricingByWageGrade(common.wageGradeRows)
  const wageGradeRows = WAGE_GRADE_FIELDS.map(field => {
    const amount = resolveWageGradeFee(overlay, common.wageGradeRows, field)
    return {
      grade: field.label,
      pricing: amount != null ? formatWageGradePricing(amount) : (byGrade[field.label] ?? ''),
    }
  })
  const fromNested = coerceProgramPaymentItemsText(common.paymentItems).trim()
  const paymentItems = fromNested || resolveWagePaymentItemsFromOverlay(overlay)
  return {
    ...common,
    wageGradeRows,
    ...(paymentItems ? { paymentItems } : {}),
  }
}
