import { describe, expect, it } from 'vitest'
import { enrichGeneralDetailScheduleLineLabel } from './applicants-detail-session-format'

describe('enrichGeneralDetailScheduleLineLabel', () => {
  it('커리큘럼·단일·날짜 — scheduleLabel에 입력순 차시 접미사', () => {
    expect(
      enrichGeneralDetailScheduleLineLabel('26년 4월 27일(월) 09:30 ~ 12:20', {
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        educationScheduleLines: ['26년 4월 20일(월) 09:30 ~ 12:20', '26년 4월 27일(월) 09:30 ~ 12:20'],
        preEducationNoticeRequired: true,
        curriculumChartSessionCount: 2,
      })
    ).toBe('26년 4월 27일(월) 09:30 ~ 12:20 | 2차시')
  })

  it('일정형·단일·날짜 — 접미사 없음', () => {
    expect(
      enrichGeneralDetailScheduleLineLabel('26년 4월 20일(월) 09:30 ~ 12:20', {
        educationStructure: 'schedule',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        preEducationNoticeRequired: true,
        curriculumChartSessionCount: 2,
      })
    ).toBe('26년 4월 20일(월) 09:30 ~ 12:20')
  })
})
