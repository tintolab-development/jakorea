import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  buildInterviewAssignCompleteScheduleSummary,
  formatInterviewAssignCompleteScheduleDisplay,
} from './complete-modal'

describe('formatInterviewAssignCompleteScheduleDisplay', () => {
  it('피그마 시안 포맷 YYYY년 M월 D일(요일) HH:mm ~ HH:mm', () => {
    expect(
      formatInterviewAssignCompleteScheduleDisplay(dayjs('2026-09-15'), '09:00 ~ 09:30'),
    ).toBe('2026년 9월 15일(화) 09:00 ~ 09:30')
  })
})

describe('buildInterviewAssignCompleteScheduleSummary', () => {
  it('저장 라벨 2026.09.15(화)도 완료 모달 한글 날짜로 바꾼다', () => {
    expect(
      buildInterviewAssignCompleteScheduleSummary({
        dateLabel: '2026.09.15(화)',
        timeRange: '09:00-09:30',
        notifyTiming: 'immediate',
      }),
    ).toBe('2026년 9월 15일(화) 09:00 ~ 09:30')
  })
})
