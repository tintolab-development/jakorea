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
} from '../src/features/mypage/education/settlements/api/gemini-settlement-client'
import {
  GEMINI_LECTURE_SCHEDULES_PATH,
  GEMINI_SETTLEMENT_SUMMARY_PATH,
} from '../src/features/mypage/education/settlements/lib/gemini-settlement-status'

describe('gemini settlement client', () => {
  it('calls gemini-settlement-summary and gemini-lecture-schedules', async () => {
    const get = vi.mocked(axiosClient.get)
    get.mockImplementation(async (url: string) => {
      if (url === GEMINI_SETTLEMENT_SUMMARY_PATH('42')) {
        return {
          data: {
            paymentStatementProcessingStatusCode: 'AWAITING_CONFIRMATION',
            lectureFeeBasis: null,
            businessIncome: false,
          },
        }
      }
      if (url === GEMINI_LECTURE_SCHEDULES_PATH('42')) {
        return { data: [] }
      }
      throw new Error(`unexpected url ${url}`)
    })

    const summary = await fetchGeminiSettlementSummary('42')
    const schedules = await fetchGeminiLectureSchedules('42')

    expect(get).toHaveBeenCalledWith(GEMINI_SETTLEMENT_SUMMARY_PATH('42'), expect.anything())
    expect(get).toHaveBeenCalledWith(GEMINI_LECTURE_SCHEDULES_PATH('42'), expect.anything())
    expect(summary.paymentStatementProcessingStatusCode).toBe('AWAITING_CONFIRMATION')
    expect(summary.lectureFeeBasis).toBeNull()
    expect(schedules).toEqual([])
  })
})
