import { describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/api/axios-instance', () => ({
  axiosClient: {
    get: vi.fn(),
  },
}))

import { axiosClient } from '@/shared/api/axios-instance'
import {
  fetchGeminiLectureSchedules,
  fetchGeminiSettlementSummary,
  parseGeminiLectureSchedules,
  parseGeminiSettlementSummary,
} from '../src/features/mypage/education/settlements/api/gemini-settlement-client'
import {
  displayGeminiBusinessIncome,
  displayGeminiProcessingStatus,
  formatGeminiWon,
  GEMINI_LECTURE_SCHEDULES_PATH,
  GEMINI_SETTLEMENT_SUMMARY_PATH,
  resolveGeminiFeeBasisDisplay,
} from '../src/features/mypage/education/settlements/lib/gemini-settlement-status'

describe('gemini settlement client', () => {
  it('calls gemini-settlement-summary and gemini-lecture-schedules', async () => {
    const get = vi.mocked(axiosClient.get)
    get.mockImplementation(async (url: string) => {
      if (url === GEMINI_SETTLEMENT_SUMMARY_PATH('INSTRUCTOR', '42')) {
        return {
          data: {
            paymentStatementProcessingStatusCode: 'AWAITING_CONFIRMATION',
            lectureFeeBasis: null,
            businessIncome: false,
          },
        }
      }
      if (url === GEMINI_LECTURE_SCHEDULES_PATH('INSTRUCTOR', '42')) {
        return { data: [] }
      }
      throw new Error(`unexpected url ${url}`)
    })

    const summary = await fetchGeminiSettlementSummary('INSTRUCTOR', '42')
    const schedules = await fetchGeminiLectureSchedules('INSTRUCTOR', '42')

    expect(get).toHaveBeenCalledWith(
      GEMINI_SETTLEMENT_SUMMARY_PATH('INSTRUCTOR', '42'),
      expect.anything(),
    )
    expect(get).toHaveBeenCalledWith(
      GEMINI_LECTURE_SCHEDULES_PATH('INSTRUCTOR', '42'),
      expect.anything(),
    )
    expect(summary.paymentStatementProcessingStatusCode).toBe('AWAITING_CONFIRMATION')
    expect(summary.lectureFeeBasis).toBeNull()
    expect(schedules).toEqual([])
  })

  it('keeps gemini-settlement-summary labels and rounds as-is', () => {
    const summary = parseGeminiSettlementSummary({
      paymentStatementProcessingStatus: '확인 대기 중',
      paymentStatementProcessingStatusCode: 'AWAITING_CONFIRMATION',
      lectureProgressRound: 2,
      lectureTotalRound: 4,
      lectureFeeBasis: 'GRADE_2',
      businessIncomeLabel: '해당 없음',
      businessIncome: false,
    })
    expect(summary.paymentStatementProcessingStatus).toBe('확인 대기 중')
    expect(summary.lectureProgressRound).toBe(2)
    expect(summary.lectureTotalRound).toBe(4)
    expect(summary.lectureFeeBasis).toBe('GRADE_2')
    expect(summary.businessIncomeLabel).toBe('해당 없음')
  })

  it('reads recognizedClassCount and numeric distanceFromHome', () => {
    const items = parseGeminiLectureSchedules({
      items: [
        {
          scheduleId: 9,
          startAt: '2026-11-10T01:00:00.000Z',
          endAt: '2026-11-10T03:00:00.000Z',
          recognizedClassCount: 2,
          trainingTimeText: '10:00~12:00',
          instructorRole: 'LEAD',
          distanceFromHome: 23.4,
        },
      ],
    })
    expect(items[0]?.recognizedClassCount).toBe(2)
    expect(items[0]?.trainingTimeText).toBe('10:00~12:00')
    expect(items[0]?.distanceFromHome).toBe(23.4)
    expect(items[0]?.instructorRole).toBe('LEAD')
  })

  it('reads BE trainingDate·trainingStartTime·trainingEndTime', () => {
    const items = parseGeminiLectureSchedules({
      items: [
        {
          scheduleId: 3,
          institutionName: '서울등현초등학교',
          grade: '5학년',
          trainingDate: '2026-01-09',
          trainingStartTime: '10:00:00',
          trainingEndTime: '11:20:00',
          trainingTimeText: '10:00~11:20',
          recognizedClassCount: 3,
        },
      ],
    })
    expect(items[0]?.trainingDate).toBe('2026-01-09')
    expect(items[0]?.trainingStartTime).toBe('10:00:00')
    expect(items[0]?.trainingEndTime).toBe('11:20:00')
  })

  it('reads per-schedule accountPaymentStatus·settlementStatusLabel·expectedAmount', () => {
    const items = parseGeminiLectureSchedules({
      applicationId: 921201,
      items: [
        {
          scheduleId: 921301,
          trainingDate: '2026-09-01',
          accountPaymentStatus: 'PAID',
          settlementStatusLabel: '계좌 지급 완료',
          expectedAmount: 170000,
        },
        {
          scheduleId: 921302,
          trainingDate: '2026-09-08',
          accountPaymentStatus: null,
          settlementStatusLabel: null,
          expectedAmount: null,
        },
        { scheduleId: 921303, expectedAmount: 0, settlementStatusLabel: '확인 대기 중' },
        { scheduleId: 921304, expectedAmount: '170000' },
        { scheduleId: 921305 },
      ],
    })
    expect(items.map(item => item.scheduleId)).toEqual([921301, 921302, 921303, 921304, 921305])
    expect(items[0]).toMatchObject({
      accountPaymentStatus: 'PAID',
      settlementStatusLabel: '계좌 지급 완료',
      expectedAmount: 170000,
    })
    expect(items[1]).toMatchObject({
      accountPaymentStatus: null,
      settlementStatusLabel: null,
      expectedAmount: null,
    })
    expect(items[2]?.expectedAmount).toBe(0)
    expect(items[3]?.expectedAmount).toBeNull()
    expect(items[4]).toMatchObject({ settlementStatusLabel: null, expectedAmount: null })
  })

  it('reads lectureFeeBasisItems in server order and tolerates missing', () => {
    const summary = parseGeminiSettlementSummary({
      businessIncomeYn: false,
      businessIncomeLabel: '사업소득자 아님',
      lectureFeeBasis: '인정 2차시 고정 강사비 170000원',
      lectureFeeBasisItems: [
        { classCount: 1, amount: 0 },
        { classCount: 2, amount: 170000 },
        { classCount: 3, amount: null },
        { classCount: '4', amount: 270000 },
      ],
    })
    expect(summary.businessIncome).toBe(false)
    expect(summary.lectureFeeBasisItems).toEqual([
      { classCount: 1, amount: 0 },
      { classCount: 2, amount: 170000 },
      { classCount: 3, amount: null },
    ])
    expect(parseGeminiSettlementSummary({}).lectureFeeBasisItems).toEqual([])
  })

  it('formats fee basis items, falls back to lectureFeeBasis only when items are empty', () => {
    expect(
      resolveGeminiFeeBasisDisplay({
        lectureFeeBasis: '인정 2차시 고정 강사비 170000원',
        lectureFeeBasisItems: [
          { classCount: 1, amount: 0 },
          { classCount: 2, amount: 170000 },
          { classCount: 3, amount: 220000 },
          { classCount: 4, amount: null },
        ],
      }),
    ).toEqual({ items: ['1차시 0원', '2차시 170,000원', '3차시 220,000원', '4차시 -'], fallback: '' })
    expect(
      resolveGeminiFeeBasisDisplay({
        lectureFeeBasis: '인정 2차시 고정 강사비 170000원',
        lectureFeeBasisItems: [],
      }),
    ).toEqual({ items: [], fallback: '인정 2차시 고정 강사비 170000원' })
    expect(resolveGeminiFeeBasisDisplay({ lectureFeeBasisItems: [] }).fallback).toBe('-')
    expect(formatGeminiWon(0)).toBe('0원')
    expect(formatGeminiWon(null)).toBe('-')
  })

  it('maps labels to Figma copy by code / yn', () => {
    expect(
      displayGeminiProcessingStatus({
        paymentStatementProcessingStatusCode: 'PARTIAL_CONFIRMATION',
        paymentStatementProcessingStatus: '확인 진행 중',
      }),
    ).toBe('확인진행중')
    expect(
      displayGeminiProcessingStatus({ paymentStatementProcessingStatusCode: 'ACCOUNT_PAID' }),
    ).toBe('계좌지급완료')
    expect(
      displayGeminiProcessingStatus({
        paymentStatementProcessingStatusCode: 'UNKNOWN',
        paymentStatementProcessingStatus: '확인 대기 중',
      }),
    ).toBe('확인 대기 중')
    expect(displayGeminiProcessingStatus(null)).toBe('-')
    expect(
      displayGeminiBusinessIncome({ businessIncome: false, businessIncomeLabel: '사업소득자 아님' }),
    ).toBe('해당 없음')
    expect(displayGeminiBusinessIncome({ businessIncomeLabel: '사업소득자 아님' })).toBe('해당 없음')
    expect(
      displayGeminiBusinessIncome({ businessIncome: true, businessIncomeLabel: '사업소득자' }),
    ).toBe('사업소득자')
    expect(displayGeminiBusinessIncome({ businessIncome: null, businessIncomeLabel: null })).toBe('-')
  })
})
