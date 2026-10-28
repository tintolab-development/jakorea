import { describe, expect, it } from 'vitest'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
import { buildAccountPaymentExportRequest } from '@/features/settlement-management/api/account-payments/build-account-payment-export-request'
import {
  isAccountPaymentFormIssueEligible,
  pickEligibleAccountPaymentFormIssueRows,
} from './resolve-toolbar-form-issue-rows'

function row(overrides: Partial<AccountPaymentRow> = {}): AccountPaymentRow {
  return {
    id: 'ap-1',
    accountPaymentId: 1001,
    settlementId: 201,
    no: 1,
    instructorName: '강사',
    programName: '프로그램',
    institutionName: '기관',
    sessionLabel: '1차시',
    accountPaymentStatus: 'awaiting_confirmation',
    amount: 100_000,
    transferScheduledDate: '2026-10-26',
    paymentOrderStatus: 'confirmed',
    ...overrides,
  }
}

describe('pickEligibleAccountPaymentFormIssueRows', () => {
  it('대량이체는 지급 대기 행을 막고 지급 완료만 고르지 않는다', () => {
    const waiting = row({ id: 'w1', accountPaymentId: 11, settlementId: undefined })
    const paid = row({
      id: 'p1',
      accountPaymentId: 12,
      settlementId: 301,
      accountPaymentStatus: 'account_paid',
    })

    expect(isAccountPaymentFormIssueEligible('bulk-transfer', waiting)).toBe(true)
    expect(isAccountPaymentFormIssueEligible('bulk-transfer', paid)).toBe(false)
    expect(pickEligibleAccountPaymentFormIssueRows('bulk-transfer', [waiting])).toEqual([waiting])
    expect(pickEligibleAccountPaymentFormIssueRows('bulk-transfer', [waiting, paid])).toBeNull()
  })

  it('세금신고는 지급 완료·settlementId 행만 허용한다', () => {
    const waiting = row({ id: 'w1' })
    const paidNoSettlement = row({
      id: 'p0',
      settlementId: undefined,
      accountPaymentStatus: 'account_paid',
    })
    const paid = row({
      id: 'p1',
      settlementId: 301,
      accountPaymentStatus: 'account_paid',
    })

    expect(pickEligibleAccountPaymentFormIssueRows('tax-report', [paid])).toEqual([paid])
    expect(pickEligibleAccountPaymentFormIssueRows('tax-report', [waiting])).toBeNull()
    expect(pickEligibleAccountPaymentFormIssueRows('tax-report', [paidNoSettlement])).toBeNull()
  })

  it('발급 요청 본문에는 선택한 ID만 들어간다', () => {
    const selected = [
      row({ settlementId: 201, accountPaymentId: 1001 }),
      row({ id: 'ap-2', settlementId: undefined, accountPaymentId: 2001 }),
    ]
    const body = buildAccountPaymentExportRequest({
      kind: 'bulk-transfer',
      selection: { kind: 'selected', rows: selected },
    })

    expect(body.status).toBe('WAITING_PAYMENT')
    expect(body.settlementIds).toEqual([201])
    expect(body.accountPaymentIds).toEqual([2001])
  })
})
