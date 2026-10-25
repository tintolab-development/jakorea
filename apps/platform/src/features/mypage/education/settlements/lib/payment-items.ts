export type ReceiptPaymentUiKind = 'transport' | 'amount_with_receipt'

const TRANSPORT_ITEM_TYPES = new Set([
  'TRANSPORTATION',
  'TRANSPORT_STUDENT',
  'TRANSPORT_INSTRUCTOR',
  'STUDENT_TRANSPORTATION',
  'LONG_DISTANCE_TRANSPORTATION',
])

/** 개인 정산 API에서 동일 CMS TRANSPORT_STUDENT 정책으로 합쳐지는 교통비 별칭 */
const INDIVIDUAL_TRANSPORT_ALIASES = new Set([
  'TRANSPORTATION',
  'STUDENT_TRANSPORTATION',
  'TRANSPORT_STUDENT',
])

const RECEIPT_ITEM_TYPE_LABELS: Record<string, string> = {
  TRANSPORTATION: '교통비',
  TRANSPORT_STUDENT: '교통비',
  TRANSPORT_INSTRUCTOR: '교통비',
  STUDENT_TRANSPORTATION: '교통비',
  LONG_DISTANCE_TRANSPORTATION: '장거리 교통비',
  MEAL: '식사비',
  ACTIVITY: '활동비',
  LODGING: '숙박비',
  LODGING_GENERAL: '숙박비',
  LODGING_1C1S: '숙박비',
  MATERIAL: '재료비',
  OTHER: '기타',
}

export function normalizePaymentItemType(itemType: string | null | undefined): string {
  return itemType?.trim().toUpperCase() ?? ''
}

export function resolveReceiptPaymentUiKind(itemType: string | null | undefined): ReceiptPaymentUiKind {
  return TRANSPORT_ITEM_TYPES.has(normalizePaymentItemType(itemType))
    ? 'transport'
    : 'amount_with_receipt'
}

export function isTransportPaymentItemType(itemType: string | null | undefined): boolean {
  return resolveReceiptPaymentUiKind(itemType) === 'transport'
}

export function isIndividualTransportAlias(itemType: string | null | undefined): boolean {
  return INDIVIDUAL_TRANSPORT_ALIASES.has(normalizePaymentItemType(itemType))
}

function looksLikeApiEnum(value: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(value)
}

export function receiptPaymentItemLabel(item: {
  itemType?: string | null
  itemName?: string | null
}): string {
  const named = item.itemName?.trim()
  if (named) {
    const namedLabel = RECEIPT_ITEM_TYPE_LABELS[named.toUpperCase()]
    if (namedLabel) return namedLabel
    if (!looksLikeApiEnum(named)) return named
  }
  const type = normalizePaymentItemType(item.itemType)
  return RECEIPT_ITEM_TYPE_LABELS[type] ?? '지급 항목'
}

/** IndividualSettlementExpenseInput.expenseType OpenAPI enum */
export const INDIVIDUAL_SETTLEMENT_EXPENSE_TYPES = [
  'TRANSPORTATION',
  'MEAL',
  'LODGING',
  'MATERIAL',
  'OTHER',
] as const

export type IndividualSettlementExpenseType = (typeof INDIVIDUAL_SETTLEMENT_EXPENSE_TYPES)[number]

const EXPENSE_TYPE_SET = new Set<string>(INDIVIDUAL_SETTLEMENT_EXPENSE_TYPES)

/**
 * items[].itemType은 payableItems 값을 그대로 둔다.
 * expenses[].expenseType은 OpenAPI enum만 사용한다. ACTIVITY는 enum에 없어 OTHER로 보낸다.
 */
export function mapItemTypeToExpenseType(itemType: string): IndividualSettlementExpenseType | string {
  const type = normalizePaymentItemType(itemType)
  if (TRANSPORT_ITEM_TYPES.has(type)) return 'TRANSPORTATION'
  if (type === 'MEAL') return 'MEAL'
  if (type === 'LODGING' || type === 'LODGING_GENERAL' || type === 'LODGING_1C1S') return 'LODGING'
  if (type === 'MATERIAL') return 'MATERIAL'
  if (type === 'ACTIVITY') return 'OTHER'
  if (type === 'OTHER') return 'OTHER'
  return EXPENSE_TYPE_SET.has(type) ? type : type
}

export function isSupportedIndividualExpenseType(itemType: string): boolean {
  return EXPENSE_TYPE_SET.has(mapItemTypeToExpenseType(itemType))
}

/** CMS 증빙 불필요(false)·미설정(null)은 영수증 제출 UI를 열지 않는다. */
export function isReceiptEvidenceRequired(value: boolean | null | undefined): boolean {
  return value === true
}

export function payableEvidenceRequired(
  payableItems: readonly { itemType?: string | null; evidenceRequired?: boolean | null }[] | null | undefined,
  itemType: string | null | undefined,
): boolean | null {
  const type = normalizePaymentItemType(itemType)
  if (!type) return null
  const matched = (payableItems ?? []).find(item => {
    const other = normalizePaymentItemType(item.itemType)
    if (other === type) return true
    return isIndividualTransportAlias(type) && isIndividualTransportAlias(other)
  })
  if (!matched) return null
  return matched.evidenceRequired === true ? true : matched.evidenceRequired === false ? false : null
}

export function overlayPayableEvidenceRequired<
  T extends { itemType: string; evidenceRequired?: boolean | null },
>(
  items: readonly T[],
  payableItems: readonly { itemType?: string | null; evidenceRequired?: boolean | null }[] | null | undefined,
): Array<T & { evidenceRequired: boolean }> {
  return items.map(item => ({
    ...item,
    evidenceRequired: isReceiptEvidenceRequired(
      payableEvidenceRequired(payableItems, item.itemType) ?? item.evidenceRequired,
    ),
  }))
}

export type ReceiptPayableItem = {
  itemType: string
  itemName: string
  evidenceRequired: boolean | null
}

const WAGE_ITEM_TYPES = new Set([
  'TIER1',
  'TIER2',
  'TIER3',
  'SPECIAL_LECTURE',
  'OTHER_LABOR',
  'GEMINI',
  'WAGE',
  'INSTRUCTOR_FEE',
  'LECTURE_FEE',
])

/** 영수증 작성·확인 노출 순서: 강사비 > 교통비 > 숙박비 > 활동비 > 식사비 */
export function receiptPayableDisplayRank(
  itemType: string | null | undefined,
  itemName?: string | null,
): number {
  const type = normalizePaymentItemType(itemType)
  const name = (itemName ?? '').replace(/\s+/g, '')
  if (WAGE_ITEM_TYPES.has(type) || name.includes('강사비')) return 0
  if (isTransportPaymentItemType(type) || type.includes('TRANSPORT')) {
    return 1
  }
  if (type.includes('LODGING') || name.includes('숙박')) return 2
  if (type === 'ACTIVITY' || name.includes('활동비') || name.includes('활동')) return 3
  if (type === 'MEAL' || name.includes('식사') || name === '식비') return 4
  return 5
}

export function isReceiptWageItemType(itemType: string | null | undefined, itemName?: string | null): boolean {
  return receiptPayableDisplayRank(itemType, itemName) === 0
}

export function sortReceiptPayableItems<T extends { itemType?: string | null; itemName?: string | null }>(
  items: readonly T[],
): T[] {
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const rank =
        receiptPayableDisplayRank(a.item.itemType, a.item.itemName) -
        receiptPayableDisplayRank(b.item.itemType, b.item.itemName)
      return rank !== 0 ? rank : a.index - b.index
    })
    .map(row => row.item)
}

export function normalizePayableItems(
  items: readonly { itemType?: string | null; itemName?: string | null; evidenceRequired?: boolean | null }[] | null | undefined,
): ReceiptPayableItem[] {
  const source = items ?? []
  const hasCanonicalTransport = source.some(
    item => normalizePaymentItemType(item.itemType) === 'TRANSPORTATION',
  )
  const normalized: ReceiptPayableItem[] = []
  const seen = new Set<string>()
  let keptIndividualTransport = false
  for (const item of source) {
    const itemType = normalizePaymentItemType(item.itemType)
    if (!itemType) continue
    if (isIndividualTransportAlias(itemType)) {
      if (hasCanonicalTransport && itemType !== 'TRANSPORTATION') continue
      if (keptIndividualTransport) continue
      keptIndividualTransport = true
    } else if (seen.has(itemType)) {
      continue
    }
    seen.add(itemType)
    normalized.push({
      itemType,
      itemName: receiptPaymentItemLabel({ itemType, itemName: item.itemName }),
      evidenceRequired:
        item.evidenceRequired === true ? true : item.evidenceRequired === false ? false : null,
    })
  }
  return sortReceiptPayableItems(normalized)
}

export function pickTransportPayableItem(
  items: readonly ReceiptPayableItem[],
): ReceiptPayableItem | undefined {
  return items.find(item => isTransportPaymentItemType(item.itemType))
}

export function pickAmountPayableItems(
  items: readonly ReceiptPayableItem[],
): ReceiptPayableItem[] {
  return items.filter(item => !isTransportPaymentItemType(item.itemType))
}
