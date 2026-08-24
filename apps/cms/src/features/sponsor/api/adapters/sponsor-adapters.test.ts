import { describe, expect, it } from 'vitest'
import {
  mapYearlyBusinessResponse,
  mergeYearlyBusinessRows,
  shouldPersistYearlyBusinessRow,
  toYearlyBusinessRequest,
} from './sponsor-adapters'

describe('yearly business adapters', () => {
  it('maps businessYear to year', () => {
    expect(
      mapYearlyBusinessResponse({
        id: 'yb-1',
        businessYear: 2024,
        donationAmount: 1000,
        beneficiaryCount: 12,
        memo: '메모',
        businessName: '2024년 후원',
        managerNameSnapshot: '김담당',
      })
    ).toEqual({
      id: 'yb-1',
      year: 2024,
      donationAmount: 1000,
      beneficiaryCount: 12,
      memo: '메모',
      businessName: '2024년 후원',
      managerNameSnapshot: '김담당',
    })
  })

  it('maps year back to businessYear and fills required businessName', () => {
    expect(
      toYearlyBusinessRequest({
        id: 'yb-1',
        year: 2025,
        donationAmount: 2000,
        beneficiaryCount: 3,
        memo: '',
        businessName: '',
        managerNameSnapshot: '',
      })
    ).toEqual({
      businessYear: 2025,
      businessName: '2025년',
      donationAmount: 2000,
      beneficiaryCount: 3,
      memo: '',
    })
  })

  it('keeps existing businessName and manager snapshot on request', () => {
    expect(
      toYearlyBusinessRequest({
        id: 'yb-1',
        year: 2025,
        donationAmount: 2000,
        beneficiaryCount: 3,
        memo: '',
        businessName: 'JA 후원',
        managerNameSnapshot: '이담당',
      })
    ).toMatchObject({
      businessName: 'JA 후원',
      managerNameSnapshot: '이담당',
    })
  })

  it('persists existing rows and filled new rows, skips empty placeholders', () => {
    expect(
      shouldPersistYearlyBusinessRow({
        id: 'yb-1',
        year: 2024,
        donationAmount: 0,
        beneficiaryCount: 0,
        memo: '',
        businessName: '',
        managerNameSnapshot: '',
      })
    ).toBe(true)
    expect(
      shouldPersistYearlyBusinessRow({
        id: '',
        year: 2026,
        donationAmount: 1000,
        beneficiaryCount: 0,
        memo: '',
        businessName: '',
        managerNameSnapshot: '',
      })
    ).toBe(true)
    expect(
      shouldPersistYearlyBusinessRow({
        id: '',
        year: 2026,
        donationAmount: 0,
        beneficiaryCount: 0,
        memo: '',
        businessName: '',
        managerNameSnapshot: '',
      })
    ).toBe(false)
  })

  it('fills missing years from sponsorship start to now, newest first', () => {
    const rows = mergeYearlyBusinessRows(
      [
        {
          id: 'yb-1',
          year: 2024,
          donationAmount: 10,
          beneficiaryCount: 1,
          memo: '',
          businessName: '2024년',
          managerNameSnapshot: '',
        },
      ],
      '2023-03-01',
      new Date('2025-08-24')
    )
    expect(rows.map(row => row.year)).toEqual([2025, 2024, 2023])
    expect(rows.find(row => row.year === 2024)?.id).toBe('yb-1')
    expect(rows.find(row => row.year === 2025)?.id).toBe('')
  })
})
