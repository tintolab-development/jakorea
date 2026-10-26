import { describe, expect, it } from 'vitest'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
import { buildBulkTransferSheetRows } from './bulk-transfer-fortune-data'

function row(
  status: AccountPaymentRow['accountPaymentStatus'],
  overrides: Partial<AccountPaymentRow> = {}
): AccountPaymentRow {
  return {
    id: 'ap-1',
    accountPaymentId: 101,
    settlementId: 201,
    no: 1,
    instructorName: '강사',
    programName: '프로그램',
    institutionName: '기관',
    sessionLabel: '1차시',
    accountPaymentStatus: status,
    amount: 100_000,
    transferScheduledDate: '2026-10-26',
    paymentOrderStatus: 'confirmed',
    ...overrides,
  }
}

describe('buildBulkTransferSheetRows', () => {
  it('지급 대기 건만 1건당 1행으로 만들고 지급 완료 건은 제외한다', () => {
    const rows = buildBulkTransferSheetRows([
      row('awaiting_confirmation'),
      row('account_paid', { id: 'ap-2', accountPaymentId: 102, settlementId: 202 }),
    ])

    expect(rows).toHaveLength(1)
    expect(rows[0]?.depositAmount).toBe(100_000)
  })

  it('계좌 원문이 응답에 없으면 임의 계좌번호를 만들지 않는다', () => {
    const [line] = buildBulkTransferSheetRows([row('awaiting_confirmation')])

    expect(line?.depositBank).toBe('')
    expect(line?.depositAccount).toBe('')
    expect(line?.mobile).toBe('')
  })
})
