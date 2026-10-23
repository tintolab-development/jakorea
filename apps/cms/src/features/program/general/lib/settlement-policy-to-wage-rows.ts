/**
 * typed ProgramResponse.settlementPolicy → 공통정보 임금/지급항목 표시값.
 * Primary 8 SoT: config wageGradeRows보다 settlementPolicy 우선.
 */

import type { ProgramSettlementPaymentItemResponse } from '@/shared/api/generated/logs/schemas/programSettlementPaymentItemResponse'
import type { ProgramSettlementPolicyResponse } from '@/shared/api/generated/logs/schemas/programSettlementPolicyResponse'
import type { ProgramWagePolicyResponse } from '@/shared/api/generated/logs/schemas/programWagePolicyResponse'
import type { Program } from '@/types/domain'
import { formatNumberDisplay } from '@/shared/utils'
import {
  coerceProgramPaymentItemsText,
  PROGRAM_WAGE_DEDUCTION_LABEL,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import {
  INSTRUCTOR_FEE_GRADE_CODES,
  INSTRUCTOR_FEE_GRADE_LABELS,
  toInstructorFeeGradeCode,
} from '@/shared/constants/instructor-fee-grade'

const PAYMENT_ITEM_LABEL: Record<string, string> = {
  TRANSPORTATION: '교통비',
  STUDENT_TRANSPORTATION: '학생 교통비',
  LONG_DISTANCE_TRANSPORTATION: '장거리 교통비',
  LODGING: '숙박비',
  ACTIVITY: '참여자 활동비',
  MEAL: '식비',
}

/** settlementPolicy.deductionType → 화면 한글 라벨 */
const DEDUCTION_TYPE_LABEL: Record<string, string> = {
  NONE: PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  'N/A': PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  NA: PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  DAILY_WORKER_WITHHOLDING: PROGRAM_WAGE_DEDUCTION_LABEL,
}

function formatWon(amount: number | undefined): string | undefined {
  if (amount == null || Number.isNaN(amount)) return undefined
  return `${formatNumberDisplay(amount)}원`
}

function normalizeFeeKind(kind: string | undefined): 'NORMAL' | 'LONG_DISTANCE' | 'OTHER' {
  const normalized = (kind ?? '').trim().toUpperCase()
  if (normalized === 'NORMAL' || normalized === 'BASE' || normalized === 'BASIC') return 'NORMAL'
  if (
    normalized === 'LONG_DISTANCE' ||
    normalized === 'LONGDISTANCE' ||
    normalized === 'LONG_DIST'
  ) {
    return 'LONG_DISTANCE'
  }
  return 'OTHER'
}

function gradeKey(policy: ProgramWagePolicyResponse): string {
  const raw = (policy.feeGrade ?? '').trim().toUpperCase()
  return toInstructorFeeGradeCode(raw) ?? (raw || 'UNKNOWN')
}

/** settlementPolicy.wagePolicies → wageGradeRows (1~3급) */
export function mapSettlementWagePoliciesToGradeRows(
  wagePolicies: ProgramWagePolicyResponse[] | undefined
): NonNullable<Program['generalCommonInfo']>['wageGradeRows'] {
  if (!wagePolicies?.length) return undefined

  const byGrade = new Map<string, { normal?: number; longDistance?: number }>()
  for (const policy of wagePolicies) {
    const key = gradeKey(policy)
    if (!key || key === 'UNKNOWN') continue
    const bucket = byGrade.get(key) ?? {}
    const kind = normalizeFeeKind(policy.feeKind)
    if (kind === 'NORMAL') bucket.normal = policy.amount ?? policy.maxAmount
    if (kind === 'LONG_DISTANCE') bucket.longDistance = policy.amount ?? policy.maxAmount
    byGrade.set(key, bucket)
  }

  const orderedKeys: string[] = INSTRUCTOR_FEE_GRADE_CODES.filter(key => byGrade.has(key))
  const extraKeys = [...byGrade.keys()].filter(key => !orderedKeys.includes(key))
  const keys = [...orderedKeys, ...extraKeys]
  if (keys.length === 0) return undefined

  return keys.map(key => {
    const bucket = byGrade.get(key) ?? {}
    const code = toInstructorFeeGradeCode(key)
    const grade = code ? INSTRUCTOR_FEE_GRADE_LABELS[code] : `${key} 강사비`
    const normalLabel = formatWon(bucket.normal)
    const longLabel = formatWon(bucket.longDistance)
    const parts: string[] = ['1시간 당']
    if (normalLabel) parts.push(`기본 : ${normalLabel}`)
    if (longLabel) parts.push(`장거리 : ${longLabel}`)
    return {
      grade,
      pricing: parts.join(' | '),
    }
  })
}

export function mapSettlementPaymentItemsToLabel(
  paymentItems: readonly unknown[] | undefined
): string | undefined {
  if (!paymentItems?.length) return undefined
  const labels = paymentItems
    .map(item => {
      if (typeof item === 'string') {
        const token = item.trim()
        if (!token) return undefined
        return PAYMENT_ITEM_LABEL[token.toUpperCase().replace(/[\s-]+/g, '_')] ?? token
      }
      if (!item || typeof item !== 'object') return undefined
      const record = item as ProgramSettlementPaymentItemResponse
      if (record.useYn === false) return undefined
      if (typeof record.itemType !== 'string') return undefined
      const type = record.itemType.trim().toUpperCase()
      if (!type) return undefined
      return PAYMENT_ITEM_LABEL[type] ?? record.itemType.trim()
    })
    .filter((label): label is string => Boolean(label))
  if (labels.length === 0) return undefined
  return labels.join(', ')
}

function withStringPaymentItems(
  commonInfo: Program['generalCommonInfo'] | undefined
): Program['generalCommonInfo'] | undefined {
  if (!commonInfo || commonInfo.paymentItems == null || typeof commonInfo.paymentItems === 'string') {
    return commonInfo
  }
  const paymentItems = coerceProgramPaymentItemsText(commonInfo.paymentItems).trim()
  if (!paymentItems) {
    const { paymentItems: _drop, ...rest } = commonInfo
    return rest
  }
  return { ...commonInfo, paymentItems }
}

export function mapSettlementDeductionTypeToLabel(
  deductionType: string | undefined
): string | undefined {
  if (deductionType == null || deductionType.trim() === '') return undefined
  const raw = deductionType.trim()
  const normalized = raw.toUpperCase().replace(/[\s-]+/g, '_')
  if (DEDUCTION_TYPE_LABEL[normalized]) return DEDUCTION_TYPE_LABEL[normalized]
  if (raw === PROGRAM_WAGE_DEDUCTION_LABEL || raw === PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL) {
    return raw
  }
  // 이미 저장된 영문 enum이 commonInfo.deductionItems에 들어온 경우
  if (normalized.includes('DAILY_WORKER') || normalized.includes('WITHHOLDING')) {
    return PROGRAM_WAGE_DEDUCTION_LABEL
  }
  return raw
}

export function applySettlementPolicyToCommonInfo(
  commonInfo: Program['generalCommonInfo'] | undefined,
  settlementPolicy: ProgramSettlementPolicyResponse | undefined
): Program['generalCommonInfo'] | undefined {
  const normalizedCommon = withStringPaymentItems(commonInfo)
  if (!settlementPolicy) return normalizedCommon

  const wageGradeRows =
    mapSettlementWagePoliciesToGradeRows(settlementPolicy.wagePolicies) ??
    normalizedCommon?.wageGradeRows
  const policyPaymentItemsPresent = Array.isArray(settlementPolicy.paymentItems)
  const paymentItemsFromPolicy = policyPaymentItemsPresent
    ? mapSettlementPaymentItemsToLabel(settlementPolicy.paymentItems)
    : undefined
  const overlayPaymentItems = normalizedCommon?.paymentItems?.trim() || undefined
  // 구조화 배열이 있으면(빈 배열 포함) overlay 라벨보다 우선한다. null/누락은 overlay 유지.
  const paymentItems = policyPaymentItemsPresent
    ? paymentItemsFromPolicy || undefined
    : overlayPaymentItems
  const deductionItems =
    mapSettlementDeductionTypeToLabel(settlementPolicy.deductionType) ??
    normalizedCommon?.deductionItems

  if (!normalizedCommon && !wageGradeRows && !paymentItems && !deductionItems) return undefined

  const { paymentItems: _overlayPaymentItems, ...restNormalized } = normalizedCommon ?? {}
  void _overlayPaymentItems

  return {
    ...restNormalized,
    ...(wageGradeRows ? { wageGradeRows } : {}),
    ...(paymentItems ? { paymentItems } : {}),
    ...(deductionItems ? { deductionItems } : {}),
  }
}
