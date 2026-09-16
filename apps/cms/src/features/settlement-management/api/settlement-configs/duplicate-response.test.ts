import { describe, expect, it } from 'vitest'
import type { SettlementConfigResponse } from '@/shared/api/generated/settlement/schemas'
import { PaymentItemResponsePaymentItemType } from '@/shared/api/generated/settlement/schemas/paymentItemResponsePaymentItemType'
import {
  resolveDuplicatedPaymentItem,
  SettlementConfigDuplicateResponseError,
} from './duplicate-response'

const source = {
  id: 166203,
  paymentItemType: PaymentItemResponsePaymentItemType.LODGING_GENERAL,
  itemName: '숙박비',
  maxAmount: 150000,
  useYn: true,
}

function config(paymentItems: SettlementConfigResponse['paymentItems']) {
  return { configId: 166000, paymentItems } satisfies SettlementConfigResponse
}

describe('resolveDuplicatedPaymentItem', () => {
  it('기존 ID와 다른 단일 복제본을 반환한다', () => {
    const duplicated = {
      ...source,
      id: 166208,
      itemName: '숙박비 (복사본)',
    }

    expect(
      resolveDuplicatedPaymentItem(config([source]), config([source, duplicated]), source.id)
    ).toEqual(duplicated)
  })

  it('동일한 복사본 이름이 있어도 신규 ID로 식별한다', () => {
    const existingCopy = {
      ...source,
      id: 166208,
      itemName: '숙박비 (복사본)',
    }
    const newCopy = {
      ...existingCopy,
      id: 166209,
    }

    expect(
      resolveDuplicatedPaymentItem(
        config([source, existingCopy]),
        config([source, existingCopy, newCopy]),
        source.id
      ).id
    ).toBe(166209)
  })

  it('200 응답에 신규 항목이 없으면 실패 처리한다', () => {
    expect(() =>
      resolveDuplicatedPaymentItem(config([source]), config([source]), source.id)
    ).toThrow(SettlementConfigDuplicateResponseError)
  })

  it('이름이나 유형이 계약과 다른 신규 항목이면 실패 처리한다', () => {
    const invalidCopy = {
      ...source,
      id: 166208,
      itemName: '숙박비',
    }

    expect(() =>
      resolveDuplicatedPaymentItem(config([source]), config([source, invalidCopy]), source.id)
    ).toThrow('복제 결과가 지급 항목 복제 계약과 일치하지 않습니다.')
  })
})
