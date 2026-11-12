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
      paidAt: '2026-08-27T00:00:00.000Z',
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
    expect(row.paidAt).toBe('2026-08-27T00:00:00.000Z')
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

  it('BE N1 — 「강의 진행 차시」는 sessionLabel(인정 차시)만, sessionOrdinal(회차)로 바꾸지 않는다', () => {
    const payment: AccountPaymentListItemResponse = {
      accountPaymentId: 14,
      instructorName: '김틴토',
      paymentStatus: 'PAID',
      sessionLabel: '2차시',
      sessionOrdinal: 3,
    }

    const row = mapAccountPaymentListItemToRow(payment, 0)

    expect(row.sessionLabel).toBe('2차시')
    expect(row.sessionLabel).not.toContain('회차')
  })

  it('sessionLabel 없으면 sessionOrdinal으로 N차시를 만들지 않는다', () => {
    const payment: AccountPaymentListItemResponse = {
      accountPaymentId: 13,
      instructorName: '김틴토',
      paymentStatus: 'PAID',
      sessionOrdinal: 3,
      programNameKo: 'HSBC',
    }

    const row = mapAccountPaymentListItemToRow(payment, 0)

    expect(row.sessionLabel).toBe('-')
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

  it('영수증 지급 건: payeeType·sourceType을 담고 강의 진행 차시 null은 -', () => {
    const row = mapAccountPaymentListItemToRow(
      {
        accountPaymentId: 501,
        settlementId: null as unknown as undefined,
        instructorName: '김참여',
        netPaymentAmount: 30000,
        paymentStatus: 'WAITING_PAYMENT',
        sourceType: 'INDIVIDUAL_SETTLEMENT',
        payeeType: 'PARTICIPANT',
        sessionLabel: null as unknown as undefined,
      },
      0
    )
    expect(row.payeeType).toBe('PARTICIPANT')
    expect(row.sourceType).toBe('INDIVIDUAL_SETTLEMENT')
    expect(row.sessionLabel).toBe('-')
    expect(row.instructorName).toBe('김참여')
    expect(row.settlementId).toBeUndefined()
  })

  it('F(CMS-07): maskedRecipientPhone 마스킹값을 미리보기용으로만 싣고 빈 값은 생략한다', () => {
    const base = { accountPaymentId: 1, paymentStatus: 'WAITING_PAYMENT' } as AccountPaymentListItemResponse
    expect(
      mapAccountPaymentListItemToRow({ ...base, maskedRecipientPhone: '010-****-5678' } as never, 0)
        .maskedRecipientPhone
    ).toBe('010-****-5678')
    expect(mapAccountPaymentListItemToRow({ ...base, maskedRecipientPhone: null } as never, 0)).not.toHaveProperty(
      'maskedRecipientPhone'
    )
    expect(mapAccountPaymentListItemToRow(base, 0).recipientMobile).toBeUndefined()
  })
})
