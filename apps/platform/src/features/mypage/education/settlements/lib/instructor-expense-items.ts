import type { SettlementWriteDraft } from '../model/write-draft.ts'
import { parseSettlementAmount, readPositiveWonLimit } from './format-write-draft.ts'

/**
 * 강사 지급조서 실비(식사비·활동비) 정책 — 미리보기 payableItems (기획 K14, BE 정산 4차).
 * 프로그램에서 켠 항목만 온다(LODGING·ACTIVITY·MEAL). maxLimitWon은 CMS 설정의 신청 1건 기준 한도.
 */
export type InstructorExpenseItemPolicy = {
  /** 이 프로그램에서 신청할 수 있는 항목인지 */
  allowed: boolean
  /** 신청 1건 기준 최대 한도(원). 없으면 null */
  maxLimitWon: number | null
  /** 영수증 필요 여부. 서버가 미설정(null)이면 기존처럼 필요로 본다 */
  evidenceRequired: boolean
}

export type InstructorExpensePolicies = {
  /** 미리보기 payableItems를 받았는지. 받기 전에는 기존 동작(신청 가능·한도 없음·영수증 필요) */
  loaded: boolean
  meal: InstructorExpenseItemPolicy
  activity: InstructorExpenseItemPolicy
  /** 일반 숙박비(LODGING)가 켜져 있는지 — 입력 영역은 시안 대기(K15) */
  lodgingOffered: boolean
}

const UNKNOWN_POLICY: InstructorExpenseItemPolicy = {
  allowed: true,
  maxLimitWon: null,
  evidenceRequired: true,
}

export const DEFAULT_INSTRUCTOR_EXPENSE_POLICIES: InstructorExpensePolicies = {
  loaded: false,
  meal: UNKNOWN_POLICY,
  activity: UNKNOWN_POLICY,
  lodgingOffered: false,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeItemType(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

function readPolicy(item: Record<string, unknown> | undefined): InstructorExpenseItemPolicy {
  if (!item) return { allowed: false, maxLimitWon: null, evidenceRequired: false }
  const max = typeof item.maxLimitWon === 'number' ? readPositiveWonLimit(item.maxLimitWon) : null
  return {
    allowed: true,
    maxLimitWon: max,
    evidenceRequired: item.evidenceRequired !== false,
  }
}

/** 미리보기 응답 → 실비 정책. payableItems가 배열이 아니면 받기 전으로 본다 */
export function readInstructorExpensePolicies(preview: unknown): InstructorExpensePolicies {
  if (!isRecord(preview) || !Array.isArray(preview.payableItems)) {
    return DEFAULT_INSTRUCTOR_EXPENSE_POLICIES
  }
  const byType = new Map<string, Record<string, unknown>>()
  for (const raw of preview.payableItems) {
    if (!isRecord(raw)) continue
    const type = normalizeItemType(raw.itemType)
    if (type) byType.set(type, raw)
  }
  return {
    loaded: true,
    meal: readPolicy(byType.get('MEAL')),
    activity: readPolicy(byType.get('ACTIVITY')),
    lodgingOffered: byType.has('LODGING') || byType.has('LODGING_GENERAL'),
  }
}

/** 강사 실비 한도 초과 문구 (서버 400 PAYMENT_ITEM_LIMIT_EXCEEDED에도 같은 문구). 영수증 문구와 다르다 */
export function instructorPaymentItemLimitMessage(maxLimitWon: number): string {
  return `신청은 최대 ${maxLimitWon.toLocaleString('ko-KR')}원까지만 가능합니다.`
}

/** 강사 draft에서 처음으로 한도를 넘는 실비 항목의 한도. 없으면 null */
export function findExceededInstructorExpenseLimit(draft: SettlementWriteDraft): number | null {
  for (const item of [draft.meal, draft.activity]) {
    if (item.allowed === false) continue
    const limit = readPositiveWonLimit(item.maxLimitWon)
    if (limit != null && parseSettlementAmount(item.amount) > limit) return limit
  }
  return null
}

/** 서버 400 PAYMENT_ITEM_LIMIT_EXCEEDED 문구 — 한도를 알 수 있는 첫 항목 기준 */
export function instructorPaymentItemLimitExceededAlert(draft: SettlementWriteDraft): string | null {
  const exceeded = findExceededInstructorExpenseLimit(draft)
  if (exceeded != null) return instructorPaymentItemLimitMessage(exceeded)
  const known = [draft.meal, draft.activity]
    .map(item => readPositiveWonLimit(item.maxLimitWon))
    .find((limit): limit is number => limit != null)
  return known != null ? instructorPaymentItemLimitMessage(known) : null
}
