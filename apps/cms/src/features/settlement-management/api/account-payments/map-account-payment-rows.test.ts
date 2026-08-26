import { describe, expect, it } from 'vitest'
import { mapAccountPaymentListItemToRow } from './map-account-payment-rows'
import { buildSettlementByIdMap } from './map-settlement-context'
import type {
  AccountPaymentListItemResponse,
  SettlementListItemResponse,
} from '@/shared/api/generated/settlement/schemas'

describe('mapAccountPaymentListItemToRow', () => {
  it('join된 정산 라인의 institutionName·sessionOrdinal을 사용', () => {
    const settlements: SettlementListItemResponse[] = [
      {
        settlementId: 1001,
        programNameKo: 'JA 경제교실',
        instructorName: '홍길동',
        institutionName: '○○초등학교',
        sessionOrdinal: 3,
        lectureDate: '2026-08-12',
        scheduleId: 88001,
      },
    ]
    const payment: AccountPaymentListItemResponse = {
      accountPaymentId: 11,
      settlementId: 1001,
      instructorName: '홍길동',
      netPaymentAmount: 915000,
      paymentStatus: 'PENDING',
    }

    const row = mapAccountPaymentListItemToRow(
      payment,
      0,
      buildSettlementByIdMap(settlements)
    )

    expect(row.institutionName).toBe('○○초등학교')
    expect(row.sessionLabel).toBe('3차시')
    expect(row.lectureDate).toBe('2026-08-12')
    expect(row.sessionLabel).not.toBe('88001차시')
  })

  it('정산 목록 join 없이 계좌 지급 목록 필드만으로 매핑한다', () => {
    const payment: AccountPaymentListItemResponse = {
      accountPaymentId: 11,
      settlementId: 1001,
      instructorName: '홍길동',
      netPaymentAmount: 915000,
      paymentStatus: 'PENDING',
      scheduledPaymentDate: '2026-08-26',
    }

    const row = mapAccountPaymentListItemToRow(payment, 0)

    expect(row.id).toBe('11')
    expect(row.instructorName).toBe('홍길동')
    expect(row.programName).toBe('-')
    expect(row.institutionName).toBe('-')
    expect(row.transferScheduledDate).toBe('2026-08-26')
  })

  it('목록 응답에 프로그램·기관·출강일이 있으면 정산 join 없이 사용한다', () => {
    const payment: AccountPaymentListItemResponse & {
      programNameKo: string
      institutionName: string
      sessionOrdinal: number
      lectureDate: string
    } = {
      accountPaymentId: 11,
      settlementId: 1001,
      instructorName: '홍길동',
      netPaymentAmount: 915000,
      paymentStatus: 'PENDING',
      programNameKo: 'JA 경제교실',
      institutionName: '○○초등학교',
      sessionOrdinal: 3,
      lectureDate: '2026-08-12',
    }

    const row = mapAccountPaymentListItemToRow(payment, 0)

    expect(row.programName).toBe('JA 경제교실')
    expect(row.institutionName).toBe('○○초등학교')
    expect(row.sessionLabel).toBe('3차시')
    expect(row.lectureDate).toBe('2026-08-12')
  })
})
