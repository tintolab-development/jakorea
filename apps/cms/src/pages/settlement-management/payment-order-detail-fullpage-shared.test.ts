import { describe, expect, it } from 'vitest'
import { deriveAggregateFromLines } from './payment-order-detail-fullpage-shared'
import type { PaymentOrderAdminLineProcessingStatus } from '@/data/mock/payment-order-admin-list'

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
})
