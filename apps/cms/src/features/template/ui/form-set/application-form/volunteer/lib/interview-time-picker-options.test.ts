import { describe, expect, it } from 'vitest'
import { snapMinuteToStep } from '@/shared/components/date-time-picker-shared'
import { INTERVIEW_TIME_DEFAULT_START, interviewTimeMinuteStep } from './interview-time-picker-options'

describe('면접 진행 가능 시간 팝업 옵션 (QA-0350-4f7f)', () => {
  it('기본 시작 시각은 09:00', () => {
    expect(INTERVIEW_TIME_DEFAULT_START).toEqual({ hour: 9, minute: 0 })
  })

  it('분 스텝은 슬롯 간격을 따른다', () => {
    expect(interviewTimeMinuteStep('15')).toBe(15)
    expect(interviewTimeMinuteStep('30')).toBe(30)
    expect(interviewTimeMinuteStep('60')).toBe(60)
    expect(interviewTimeMinuteStep('')).toBe(30)
  })

  it('기존 분은 스텝에 맞춰 내림한다', () => {
    expect(snapMinuteToStep(45, 30)).toBe(30)
    expect(snapMinuteToStep(14, 15)).toBe(0)
    expect(snapMinuteToStep(37, 60)).toBe(0)
    expect(snapMinuteToStep(37, undefined)).toBe(37)
  })
})
