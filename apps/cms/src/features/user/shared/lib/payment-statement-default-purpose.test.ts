import { describe, expect, it } from 'vitest'
import {
  EMPTY_PAYMENT_STATEMENT_BASIC_INFO,
  mergePaymentStatementBasicInfo,
  PAYMENT_STATEMENT_DEFAULT_PURPOSE,
} from '@jakorea/form-schema/consent'

describe('mergePaymentStatementBasicInfo', () => {
  it('빈 paymentPurpose를 고정 문구로 채운다', () => {
    expect(mergePaymentStatementBasicInfo().paymentPurpose).toBe(
      PAYMENT_STATEMENT_DEFAULT_PURPOSE
    )
    expect(
      mergePaymentStatementBasicInfo({ nameKo: '홍길동', paymentPurpose: '' }).paymentPurpose
    ).toBe(PAYMENT_STATEMENT_DEFAULT_PURPOSE)
    expect(EMPTY_PAYMENT_STATEMENT_BASIC_INFO.paymentPurpose).toBe(
      PAYMENT_STATEMENT_DEFAULT_PURPOSE
    )
  })

  it('이미 있는 지급 목적은 유지한다', () => {
    expect(
      mergePaymentStatementBasicInfo({ paymentPurpose: '기타 지급' }).paymentPurpose
    ).toBe('기타 지급')
  })
})
