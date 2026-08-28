import { describe, expect, it } from 'vitest'
import {
  resolveAccountPaymentAttendanceDate,
  resolveAccountPaymentCalendarDate,
  type AccountPaymentRow,
} from '@/data/mock/account-payments-list'

function baseRow(overrides: Partial<AccountPaymentRow> = {}): AccountPaymentRow {
  return {
    id: '1',
    no: 1,
    instructorName: '테스트',
    programName: '프로그램',
    institutionName: '기관',
    sessionLabel: '1차시',
    accountPaymentStatus: 'awaiting_confirmation',
    amount: 1000,
    transferScheduledDate: '2026-08-26',
    lectureDate: '2026-08-12',
    paymentOrderStatus: 'confirmed',
    ...overrides,
  }
}

describe('account payment calendar date', () => {
  it('캘린더 키는 이체 예정일(scheduledPaymentDate)만 사용', () => {
    const row = baseRow()
    expect(resolveAccountPaymentCalendarDate(row)).toBe('2026-08-26')
    expect(resolveAccountPaymentCalendarDate(row)).not.toBe(
      resolveAccountPaymentAttendanceDate(row)
    )
  })

  it('lectureDate는 교육 진행일 표시용으로만 사용', () => {
    expect(resolveAccountPaymentAttendanceDate(baseRow())).toBe('2026-08-12')
  })
})
