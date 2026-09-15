/**
 * typed ProgramResponse.settlementPolicy → 공통정보 임금/지급항목 표시값.
 * Primary 8 SoT: config wageGradeRows보다 settlementPolicy 우선.
 */

import type { ProgramSettlementPaymentItemResponse } from '@/shared/api/generated/logs/schemas/programSettlementPaymentItemResponse'
import type { ProgramSettlementPolicyResponse } from '@/shared/api/generated/logs/schemas/programSettlementPolicyResponse'
import type { ProgramWagePolicyResponse } from '@/shared/api/generated/logs/schemas/programWagePolicyResponse'
import type { Program } from '@/types/domain'

const FEE_GRADE_LABEL: Record<string, string> = {
  GRADE_1: '1급 강사비',
  GRADE_2: '2급 강사비',
  GRADE_3: '3급 강사비',
  '1': '1급 강사비',
  '2': '2급 강사비',
  '3': '3급 강사비',
}

const PAYMENT_ITEM_LABEL: Record<string, string> = {
  TRANSPORTATION: '교통비',
  LODGING: '숙박비',
  ACTIVITY: '활동비',
  MEAL: '식비',
}

function formatWon(amount: number | undefined): string | undefined {
  if (amount == null || Number.isNaN(amount)) return undefined
  return `${amount.toLocaleString('ko-KR')}원`
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
  if (raw in FEE_GRADE_LABEL) return raw
  if (raw.startsWith('GRADE_')) return raw
  if (/^[123]$/.test(raw)) return `GRADE_${raw}`
  return raw || 'UNKNOWN'
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

  const orderedKeys = ['GRADE_1', 'GRADE_2', 'GRADE_3'].filter(key => byGrade.has(key))
  const extraKeys = [...byGrade.keys()].filter(key => !orderedKeys.includes(key))
  const keys = [...orderedKeys, ...extraKeys]
  if (keys.length === 0) return undefined

  return keys.map(key => {
    const bucket = byGrade.get(key) ?? {}
    const grade = FEE_GRADE_LABEL[key] ?? `${key} 강사비`
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
  paymentItems: ProgramSettlementPaymentItemResponse[] | undefined
): string | undefined {
  if (!paymentItems?.length) return undefined
  const labels = paymentItems
    .filter(item => item.useYn !== false)
    .map(item => {
      const type = (item.itemType ?? '').trim().toUpperCase()
      return PAYMENT_ITEM_LABEL[type] ?? item.itemType?.trim()
    })
    .filter((label): label is string => Boolean(label))
  if (labels.length === 0) return undefined
  return labels.join(', ')
}

export function mapSettlementDeductionTypeToLabel(
  deductionType: string | undefined
): string | undefined {
  if (deductionType == null || deductionType.trim() === '') return undefined
  const normalized = deductionType.trim().toUpperCase()
  if (normalized === 'NONE' || normalized === 'N/A' || normalized === 'NA') return '해당없음'
  return deductionType.trim()
}

export function applySettlementPolicyToCommonInfo(
  commonInfo: Program['generalCommonInfo'] | undefined,
  settlementPolicy: ProgramSettlementPolicyResponse | undefined
): Program['generalCommonInfo'] | undefined {
  if (!settlementPolicy) return commonInfo

  const wageGradeRows =
    mapSettlementWagePoliciesToGradeRows(settlementPolicy.wagePolicies) ??
    commonInfo?.wageGradeRows
  const paymentItems =
    mapSettlementPaymentItemsToLabel(settlementPolicy.paymentItems) ?? commonInfo?.paymentItems
  const deductionItems =
    mapSettlementDeductionTypeToLabel(settlementPolicy.deductionType) ??
    commonInfo?.deductionItems

  if (!commonInfo && !wageGradeRows && !paymentItems && !deductionItems) return undefined

  return {
    ...commonInfo,
    ...(wageGradeRows ? { wageGradeRows } : {}),
    ...(paymentItems ? { paymentItems } : {}),
    ...(deductionItems ? { deductionItems } : {}),
  }
}
