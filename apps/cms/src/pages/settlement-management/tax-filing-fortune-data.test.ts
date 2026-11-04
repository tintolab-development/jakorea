import { describe, expect, it } from 'vitest'
import type { AccountPaymentRow } from '@/features/settlement-management/model/account-payments-list'
import { buildTaxFilingSheetLines } from './tax-filing-fortune-data'

function paidRow(
  partial: Partial<AccountPaymentRow> & Pick<AccountPaymentRow, 'id'>
): AccountPaymentRow {
  return {
    no: 1,
    instructorName: '김강사',
    programName: '프로그램',
    institutionName: '-',
    sessionLabel: '1차시',
    accountPaymentStatus: 'account_paid',
    amount: 100000,
    transferScheduledDate: '2026-11-04',
    paymentOrderStatus: 'confirmed',
    ...partial,
  }
}

describe('buildTaxFilingSheetLines residentId', () => {
  it('미리보기에는 마스킹된 주민등록번호만 넣는다', () => {
    const lines = buildTaxFilingSheetLines([
      paidRow({
        id: '1',
        residentRegistrationNumberMasked: '900101-1******',
      }),
    ])
    const detail = lines.find(line => line.kind === 'detail' && line.name === '김강사')
    expect(detail).toMatchObject({ residentId: '900101-1******' })
  })

  it('마스킹 값이 없으면 대시', () => {
    const lines = buildTaxFilingSheetLines([paidRow({ id: '1' })])
    const detail = lines.find(line => line.kind === 'detail' && line.name === '김강사')
    expect(detail).toMatchObject({ residentId: '-' })
  })
})
