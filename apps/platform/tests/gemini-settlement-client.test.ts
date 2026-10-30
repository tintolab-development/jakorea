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
  GEMINI_LECTURE_SCHEDULES_PATH,
  GEMINI_SETTLEMENT_SUMMARY_PATH,
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
})
