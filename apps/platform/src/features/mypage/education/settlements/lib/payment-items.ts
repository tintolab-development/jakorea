export type ReceiptPaymentUiKind = 'transport' | 'amount_with_receipt'

const TRANSPORT_ITEM_TYPES = new Set([
  'TRANSPORTATION',
  'TRANSPORT_STUDENT',
  'TRANSPORT_INSTRUCTOR',
  'LONG_DISTANCE_TRANSPORTATION',
])

const RECEIPT_ITEM_TYPE_LABELS: Record<string, string> = {
  TRANSPORTATION: '교통비',
  TRANSPORT_STUDENT: '교통비',
  TRANSPORT_INSTRUCTOR: '교통비',
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

export function receiptPaymentItemLabel(item: {
  itemType?: string | null
  itemName?: string | null
}): string {
  const named = item.itemName?.trim()
  if (named) return named
  const type = normalizePaymentItemType(item.itemType)
  return RECEIPT_ITEM_TYPE_LABELS[type] ?? item.itemType?.trim() ?? '지급 항목'
}

/**
 * ItemInput.itemType은 서버 payableItems 값을 그대로 둔다.
 * ExpenseInput.expenseType은 OpenAPI가 문자열(최대 50)이고,
 * IndividualSettlementExpenseInput 열거에는 ACTIVITY가 없다. ACTIVITY는 OTHER로 바꾸지 않는다.
 */
export function mapItemTypeToExpenseType(itemType: string): string {
  const type = normalizePaymentItemType(itemType)
  if (TRANSPORT_ITEM_TYPES.has(type)) return 'TRANSPORTATION'
  if (type === 'MEAL') return 'MEAL'
  if (type === 'LODGING' || type === 'LODGING_GENERAL' || type === 'LODGING_1C1S') return 'LODGING'
  if (type === 'MATERIAL') return 'MATERIAL'
  if (type === 'OTHER') return 'OTHER'
  return type
}

export type ReceiptPayableItem = {
  itemType: string
  itemName: string
  evidenceRequired: boolean | null
}

export function normalizePayableItems(
  items: readonly { itemType?: string | null; itemName?: string | null; evidenceRequired?: boolean | null }[] | null | undefined,
): ReceiptPayableItem[] {
  const normalized: ReceiptPayableItem[] = []
  const seen = new Set<string>()
  for (const item of items ?? []) {
    const itemType = normalizePaymentItemType(item.itemType)
    if (!itemType || seen.has(itemType)) continue
    seen.add(itemType)
    normalized.push({
      itemType,
      itemName: receiptPaymentItemLabel({ itemType, itemName: item.itemName }),
      evidenceRequired:
        item.evidenceRequired === true ? true : item.evidenceRequired === false ? false : null,
    })
  }
  return normalized
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
