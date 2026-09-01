import { describe, expect, it } from 'vitest'
import { mapAccountPaymentListItemToRow } from './map-account-payment-rows'
import type { AccountPaymentListItemResponse } from '@/shared/api/generated/settlement/schemas'

describe('mapAccountPaymentListItemToRow', () => {
  it('목록 extras로 프로그램·기관·차시·출강일을 채운다 (settlement join 없음)', () => {
    const payment: AccountPaymentListItemResponse = {
      accountPaymentId: 11,
      settlementId: 1001,
      memberId: 169202,
      instructorName: '홍길동',
      netPaymentAmount: 915000,
      paymentStatus: 'WAITING_PAYMENT',
      scheduledPaymentDate: '2026-08-26',
      programNameKo: 'JA 경제교실',
      institutionName: '○○초등학교',
      sessionLabel: '2 ~ 3차시',
      lectureDate: '2026-08-12',
    }

    const row = mapAccountPaymentListItemToRow(payment, 0)

    expect(row.id).toBe('11')
    expect(row.settlementId).toBe(1001)
    expect(row.instructorMemberId).toBe(169202)
    expect(row.instructorName).toBe('홍길동')
    expect(row.programName).toBe('JA 경제교실')
    expect(row.institutionName).toBe('○○초등학교')
    expect(row.sessionLabel).toBe('2 ~ 3차시')
    expect(row.lectureDate).toBe('2026-08-12')
    expect(row.transferScheduledDate).toBe('2026-08-26')
    expect(row.accountPaymentStatus).toBe('awaiting_confirmation')
  })

  it('개인 프로그램은 기관·차시가 `-`', () => {
    const payment: AccountPaymentListItemResponse = {
      accountPaymentId: 12,
      instructorName: '양가을',
      netPaymentAmount: 200000,
      paymentStatus: 'WAITING_PAYMENT',
      programNameKo: '개인 컨설팅',
      institutionName: null,
      sessionLabel: null,
      sessionOrdinal: null,
      lectureDate: '2026-01-10',
      scheduledPaymentDate: '2026-02-01',
    }

    const row = mapAccountPaymentListItemToRow(payment, 0)

    expect(row.institutionName).toBe('-')
    expect(row.sessionLabel).toBe('-')
    expect(row.lectureDate).toBe('2026-01-10')
  })

  it('sessionLabel 없으면 sessionOrdinal → N차시', () => {
    const payment: AccountPaymentListItemResponse = {
      accountPaymentId: 13,
      instructorName: '김틴토',
      paymentStatus: 'PAID',
      sessionOrdinal: 3,
      programNameKo: 'HSBC',
    }

    const row = mapAccountPaymentListItemToRow(payment, 0)

    expect(row.sessionLabel).toBe('3차시')
    expect(row.accountPaymentStatus).toBe('account_paid')
  })

  it('extras 없으면 표시 필드는 `-`', () => {
    const payment: AccountPaymentListItemResponse = {
      accountPaymentId: 11,
      settlementId: 1001,
      instructorName: '홍길동',
      netPaymentAmount: 915000,
      paymentStatus: 'FAILED',
      scheduledPaymentDate: '2026-08-26',
    }

    const row = mapAccountPaymentListItemToRow(payment, 0)

    expect(row.programName).toBe('-')
    expect(row.institutionName).toBe('-')
    expect(row.sessionLabel).toBe('-')
    expect(row.accountPaymentStatus).toBe('awaiting_confirmation')
  })
})
