import type {
  PaymentItemResponse,
  SettlementConfigResponse,
} from '@/shared/api/generated/settlement/schemas'

export const SETTLEMENT_CONFIG_DUPLICATE_RESPONSE_INVALID =
  'SETTLEMENT_CONFIG_DUPLICATE_RESPONSE_INVALID'

export class SettlementConfigDuplicateResponseError extends Error {
  readonly code = SETTLEMENT_CONFIG_DUPLICATE_RESPONSE_INVALID

  constructor(message = '복제 결과에 신규 지급 항목이 포함되지 않았습니다.') {
    super(message)
    this.name = 'SettlementConfigDuplicateResponseError'
  }
}

function paymentItemIds(config: SettlementConfigResponse): Set<number> {
  return new Set(
    (config.paymentItems ?? []).map(item => item.id).filter((id): id is number => id != null)
  )
}

export function resolveDuplicatedPaymentItem(
  before: SettlementConfigResponse,
  after: SettlementConfigResponse,
  sourceItemId: number
): PaymentItemResponse & { id: number } {
  if (!Array.isArray(after.paymentItems)) {
    throw new SettlementConfigDuplicateResponseError()
  }

  const source = (before.paymentItems ?? []).find(item => item.id === sourceItemId)
  if (!source) {
    throw new SettlementConfigDuplicateResponseError(
      '복제할 지급 항목의 기존 상태를 확인할 수 없습니다.'
    )
  }

  const existingIds = paymentItemIds(before)
  const addedItems = after.paymentItems.filter(
    (item): item is PaymentItemResponse & { id: number } =>
      item.id != null && !existingIds.has(item.id)
  )

  if (addedItems.length !== 1) {
    throw new SettlementConfigDuplicateResponseError()
  }

  const duplicated = addedItems[0]
  const expectedName = `${source.itemName ?? ''} (복사본)`
  if (
    duplicated.id === sourceItemId ||
    duplicated.itemName !== expectedName ||
    duplicated.paymentItemType !== source.paymentItemType ||
    duplicated.useYn !== source.useYn
  ) {
    throw new SettlementConfigDuplicateResponseError(
      '복제 결과가 지급 항목 복제 계약과 일치하지 않습니다.'
    )
  }

  return duplicated
}
