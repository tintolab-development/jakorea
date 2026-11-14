import { describe, expect, it } from 'vitest'
import { buildGeminiInstructorApplicationInfo } from './instructor-available-schedule'

const training = {
  officialDocumentRequired: null,
  officialDocumentRequiredInfo: null,
  institutionName: '서울초등학교',
  trainingDate: '',
  trainingTimeText: '',
}

describe('buildGeminiInstructorApplicationInfo', () => {
  it('확정 연수일이 있으면 그대로 쓴다', () => {
    const info = buildGeminiInstructorApplicationInfo(
      { ...training, trainingDate: '2026-11-25', trainingTimeText: '09:00~10:00' },
      { preferredScheduleSlots: [{ slotKey: '1', assignable: true, startAt: '2026-12-01T13:00:00' }] }
    )
    expect(info.trainingDate).toBe('2026-11-25')
    expect(info.trainingTimeText).toBe('09:00~10:00')
  })

  it('확정 연수일이 없으면 강사 신청 일정의 날짜·시각을 쓴다', () => {
    const info = buildGeminiInstructorApplicationInfo(training, {
      preferredScheduleSlots: [
        {
          slotKey: '1',
          assignable: true,
          startAt: '2026-11-25T09:00:00',
          endAt: '2026-11-25T10:00:00',
        },
      ],
    })
    expect(info.institutionName).toBe('서울초등학교')
    expect(info.trainingDate).toBe('2026-11-25')
    expect(info.trainingTimeText).toBe('09:00 ~ 10:00')
  })

  it('일정이 하나도 없으면 기관명만 남긴다', () => {
    const info = buildGeminiInstructorApplicationInfo(training, { preferredScheduleSlots: [] })
    expect(info.trainingDate).toBe('')
    expect(info.trainingTimeText).toBe('')
  })
})
