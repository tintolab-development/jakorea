import { describe, expect, it } from 'vitest'
import {
  buildAccountPaymentsListParams,
  mapAccountPaymentUiStatusToApiStatus,
  serializeAccountPaymentsListParamsKey,
} from './build-account-payments-list-params'

describe('mapAccountPaymentUiStatusToApiStatus', () => {
  it('대기 → WAITING_PAYMENT (REQUESTED로 위장하지 않음)', () => {
    expect(mapAccountPaymentUiStatusToApiStatus('awaiting_confirmation')).toBe('WAITING_PAYMENT')
  })

  it('완료 → PAID', () => {
    expect(mapAccountPaymentUiStatusToApiStatus('account_paid')).toBe('PAID')
  })
})

describe('buildAccountPaymentsListParams', () => {
  it('이체일 구간이 있으면 year보다 우선', () => {
    expect(
      buildAccountPaymentsListParams({
        year: 2026,
        fromDate: '2026-02-01',
        toDate: '2026-02-28',
        accountStatus: 'awaiting_confirmation',
        instructorName: '김틴토',
        programName: 'HSBC',
      })
    ).toEqual({
      status: 'WAITING_PAYMENT',
      fromDate: '2026-02-01',
      toDate: '2026-02-28',
      instructorName: '김틴토',
      programName: 'HSBC',
    })
  })

  it('날짜 없으면 year만', () => {
    expect(buildAccountPaymentsListParams({ year: 2026, accountStatus: 'all' })).toEqual({
      year: 2026,
    })
  })
})

describe('serializeAccountPaymentsListParamsKey', () => {
  it('이체일 있으면 year가 key에 포함되지 않음 (연도 탭 refetch 방지)', () => {
    const withYearIgnored = serializeAccountPaymentsListParamsKey({
      year: 2026,
      fromDate: '2026-02-01',
      toDate: '2026-02-28',
    })
    const withoutYear = serializeAccountPaymentsListParamsKey({
      fromDate: '2026-02-01',
      toDate: '2026-02-28',
    })
    expect(withYearIgnored).toBe(withoutYear)
    expect(withYearIgnored).not.toContain('year')
  })

  it('키 순서가 달라도 동일 serialize', () => {
    expect(
      serializeAccountPaymentsListParamsKey({
        programName: 'A',
        instructorName: 'B',
        accountStatus: 'account_paid',
      })
    ).toBe(
      serializeAccountPaymentsListParamsKey({
        instructorName: 'B',
        programName: 'A',
        accountStatus: 'account_paid',
      })
    )
  })
})
