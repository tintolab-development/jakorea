/**
 * 정산 관리 > 정산 항목 설정 — 목업 데이터
 * SSOT: Notion 정산 항목 설정 + 목록 시안 (임금 6 · 지급 6 · 공제 1)
 */

import type { SettlementEligiblePayeeType } from '@/features/settlement-management/lib/settlement-payment-item-payee'

export type SettlementItemSettingIconKey =
  | 'wage_tier1'
  | 'wage_tier2'
  | 'wage_tier3'
  | 'wage_special_lecture'
  | 'wage_other_labor'
  | 'wage_gemini'
  | 'wage_multi_instructor'
  | 'wage_simple_labor'
  | 'pay_transport'
  | 'pay_lodging'
  | 'pay_meal'
  | 'pay_activity'
  | 'pay_meeting'
  | 'pay_volunteer'
  | 'deduct_business_33'
  | 'deduct_other_88'
  | 'deduct_other_44'
  | 'deduct_other_22'

export type SettlementItemSettingCategoryKind = 'wage' | 'payment' | 'deduction'

export interface SettlementItemSettingRow {
  id: string
  /** API 항목 id (remote 전용) */
  apiItemId?: number
  /** remote: wage | payment | deduction */
  sectionKind?: SettlementItemSettingCategoryKind
  /** remote: WageItemType enum */
  wageItemType?: string
  /** remote: PaymentItemType enum */
  paymentItemType?: string
  /** remote: 설정 카드 layout (활동비=meal) */
  layout?: string
  title: string
  description: string
  iconKey: SettlementItemSettingIconKey
  /**
   * 임시: 헤더·카드에 Tossface(`.tossface`)로 표시할 단일 문자.
   * 미설정이면 `iconKey` SVG 아이콘 사용.
   */
  emojiOverride?: string | null
  /** BE eligiblePayeeTypes — 서버 값만 쓴다. 미설정이면 지급 대상으로 거르지 않는다 */
  eligiblePayeeTypes?: SettlementEligiblePayeeType[]
}

export interface SettlementItemSettingSection {
  kind: SettlementItemSettingCategoryKind
  sectionTitle: string
  items: SettlementItemSettingRow[]
}

/** 마지막으로 로드된 정산 설정 section (동기 조회용 — prefer query cache) */
export const settlementItemSettingSections: SettlementItemSettingSection[] = []

export function replaceSettlementItemSettingSections(
  sections: readonly SettlementItemSettingSection[]
): void {
  settlementItemSettingSections.length = 0
  settlementItemSettingSections.push(...sections)
}

export function getSettlementItemSettingSectionsSnapshot(): SettlementItemSettingSection[] {
  return settlementItemSettingSections
}
