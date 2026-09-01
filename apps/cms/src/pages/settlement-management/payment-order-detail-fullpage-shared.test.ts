import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  deriveAggregateFromLines,
  resolveDetailInitialDateRange,
} from './payment-order-detail-fullpage-shared'
import type { PaymentOrderAdminLineProcessingStatus } from '@/data/mock/payment-order-admin-list'

describe('resolveDetailInitialDateRange', () => {
  it('목록 조회 기간이 유효하면 그대로 반환', () => {
    const range: [ReturnType<typeof dayjs>, ReturnType<typeof dayjs>] = [
      dayjs('2025-09-15'),
      dayjs('2025-10-15'),
    ]
    expect(resolveDetailInitialDateRange(range)).toEqual(range)
  })

  it('목록 기간이 없거나 유효하지 않으면 null', () => {
    expect(resolveDetailInitialDateRange(null)).toBeNull()
    expect(resolveDetailInitialDateRange(undefined)).toBeNull()
    expect(resolveDetailInitialDateRange([dayjs('invalid'), dayjs('2025-10-15')])).toBeNull()
  })
})

describe('deriveAggregateFromLines', () => {
  it('빈 배열이면 na', () => {
    expect(deriveAggregateFromLines([])).toBe('na')
  })

  it('correction이 있으면 correction', () => {
    const s: PaymentOrderAdminLineProcessingStatus[] = ['pending', 'correction']
    expect(deriveAggregateFromLines(s)).toBe('correction')
  })

  it('application_rejected와 confirmed 혼재면 partial', () => {
    const s: PaymentOrderAdminLineProcessingStatus[] = ['confirmed', 'application_rejected']
    expect(deriveAggregateFromLines(s)).toBe('partial')
  })

  it('전부 confirmed면 confirmed', () => {
    const s: PaymentOrderAdminLineProcessingStatus[] = ['confirmed', 'confirmed']
    expect(deriveAggregateFromLines(s)).toBe('confirmed')
  })

  it('재신청과 확인 완료가 혼재면 partial', () => {
    const s: PaymentOrderAdminLineProcessingStatus[] = ['confirmed', 'reapplication']
    expect(deriveAggregateFromLines(s)).toBe('partial')
  })

  it('전부 대기·재신청이면 pending', () => {
    const s: PaymentOrderAdminLineProcessingStatus[] = ['pending', 'reapplication']
    expect(deriveAggregateFromLines(s)).toBe('pending')
  })
})
