import type { Program } from '@/types/domain'
import type { ProgramSettlementPaymentItemRequest } from '@/shared/api/generated/dashboard/schemas/programSettlementPaymentItemRequest'
import { getActivePaymentItemCatalogRows } from '@/features/template/lib/template-registration-payment-item-options'
import {
  coerceProgramPaymentItemsText,
  isProgramPaymentNoneOnly,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE,
  resolveProgramPaymentItemIdsFromLabels,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'

/** 프로그램 정산 정책 지급 항목 코드 — 설정 단계 저장 계약 */
export const PROGRAM_SETTLEMENT_PAYMENT_ITEM_TYPES = [
  'TRANSPORTATION',
  'LONG_DISTANCE_TRANSPORTATION',
  'LODGING',
  'ACTIVITY',
  'MEAL',
] as const

export type ProgramSettlementPaymentItemType =
  (typeof PROGRAM_SETTLEMENT_PAYMENT_ITEM_TYPES)[number]

const PROGRAM_ITEM_TYPE_SET = new Set<string>(PROGRAM_SETTLEMENT_PAYMENT_ITEM_TYPES)

const CATALOG_TYPE_TO_PROGRAM_TYPE: Record<string, ProgramSettlementPaymentItemType> = {
  TRANSPORTATION: 'TRANSPORTATION',
  TRANSPORT_INSTRUCTOR: 'TRANSPORTATION',
  TRANSPORT_STUDENT: 'TRANSPORTATION',
  LONG_DISTANCE_TRANSPORTATION: 'LONG_DISTANCE_TRANSPORTATION',
  LONG_DISTANCE: 'LONG_DISTANCE_TRANSPORTATION',
  LODGING: 'LODGING',
  LODGING_GENERAL: 'LODGING',
  LODGING_1C1S: 'LODGING',
  ACTIVITY: 'ACTIVITY',
  MEAL: 'MEAL',
}

function compactLabel(value: string): string {
  return value.replace(/\s+/g, '')
}

const LEGACY_MOCK_ID_TO_TYPE: Record<string, ProgramSettlementPaymentItemType> = {
  'p-1': 'TRANSPORTATION',
  'p-3': 'LODGING',
  'p-6': 'ACTIVITY',
  'p-7': 'LODGING',
}

function normalizeItemTypeToken(type: string): string {
  return type.trim().toUpperCase().replace(/[\s-]+/g, '_')
}

function catalogTypeToProgramType(type: string): string | undefined {
  const normalized = normalizeItemTypeToken(type)
  if (!normalized) return undefined
  return CATALOG_TYPE_TO_PROGRAM_TYPE[normalized] ?? (PROGRAM_ITEM_TYPE_SET.has(normalized) ? normalized : undefined)
}

function labelToProgramType(label: string): string | undefined {
  const compact = compactLabel(label)
  if (!compact) return undefined
  if (compact.includes('장거리') && compact.includes('교통')) return 'LONG_DISTANCE_TRANSPORTATION'
  if (compact.includes('숙박')) return 'LODGING'
  if (compact.includes('식사') || compact === '식비') return 'MEAL'
  if (compact.includes('활동')) return 'ACTIVITY'
  if (compact.includes('교통')) return 'TRANSPORTATION'
  return undefined
}

/** 카탈로그 id·라벨·정책 코드를 프로그램 저장 itemType으로 변환한다. 유형별 차단 없음. */
export function resolveProgramSettlementItemType(token: string): string | undefined {
  const raw = token.trim()
  if (!raw || raw === PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE) return undefined

  const fromType = catalogTypeToProgramType(raw)
  if (fromType) return fromType

  const legacy = LEGACY_MOCK_ID_TO_TYPE[raw]
  if (legacy) return legacy

  const row = getActivePaymentItemCatalogRows().find(item => item.id === raw)
  if (row?.paymentItemType?.trim()) {
    return catalogTypeToProgramType(row.paymentItemType) ?? row.paymentItemType.trim()
  }
  if (row?.title?.trim()) {
    const fromRowLabel = labelToProgramType(row.title)
    if (fromRowLabel) return fromRowLabel
  }

  return labelToProgramType(raw)
}

function paymentItemTokens(paymentItems: unknown): string[] {
  const ids = resolveProgramPaymentItemIdsFromLabels(paymentItems)
  if (isProgramPaymentNoneOnly(ids)) return []
  if (ids.length > 0) return ids
  return coerceProgramPaymentItemsText(paymentItems)
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .filter(token => token !== PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL)
}

/**
 * 화면 선택값 → 프로그램 Create/Update `paymentItems`.
 * null/undefined → omit(undefined). 해당없음·빈 선택 → [].
 */
export function mapProgramPaymentItemsToSettlementRequest(
  paymentItems: unknown
): ProgramSettlementPaymentItemRequest[] | undefined {
  if (paymentItems == null) return undefined
  if (typeof paymentItems === 'string' && !paymentItems.trim()) return []
  const tokens = paymentItemTokens(paymentItems)
  if (
    typeof paymentItems === 'string' &&
    paymentItems.trim() === PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  ) {
    return []
  }
  const out: ProgramSettlementPaymentItemRequest[] = []
  const seen = new Set<string>()
  for (const token of tokens) {
    const itemType = resolveProgramSettlementItemType(token)
    if (!itemType || seen.has(itemType)) continue
    seen.add(itemType)
    out.push({ itemType, useYn: true })
  }
  if (out.length === 0 && tokens.length === 0) return []
  return out
}

export function programPaymentItemsRequestSignature(paymentItems: unknown): string {
  const request = mapProgramPaymentItemsToSettlementRequest(paymentItems)
  if (request == null) return ''
  return request.map(item => item.itemType ?? '').filter(Boolean).join(',')
}

export function programPaymentItemsUnchanged(
  next: Program['generalCommonInfo'] | undefined,
  existing: Program['generalCommonInfo'] | undefined
): boolean {
  return (
    programPaymentItemsRequestSignature(next?.paymentItems) ===
    programPaymentItemsRequestSignature(existing?.paymentItems)
  )
}

export function assignProgramPaymentItemsToWriteRequest(args: {
  body: { paymentItems?: ProgramSettlementPaymentItemRequest[] }
  program: Program
  patch?: Partial<Program>
  baseline?: Program
}): void {
  const { body, program, patch, baseline } = args
  if (patch && baseline) {
    const patchCommon = patch.generalCommonInfo
    const patchHasPaymentItems =
      patchCommon != null && Object.prototype.hasOwnProperty.call(patchCommon, 'paymentItems')
    if (!patchHasPaymentItems) return
    if (programPaymentItemsUnchanged(program.generalCommonInfo, baseline.generalCommonInfo)) {
      return
    }
  }
  const mapped = mapProgramPaymentItemsToSettlementRequest(program.generalCommonInfo?.paymentItems)
  if (mapped === undefined) return
  body.paymentItems = mapped
}
