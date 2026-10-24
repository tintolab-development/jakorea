import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  mapParticipatingSessionsToInstructorAssignOptions,
  resolveInstructorAssignSessionDisplayLabels,
} from './instructor-assign-session-options'

function session(overrides: Partial<ParticipatingSchoolSession> = {}): ParticipatingSchoolSession {
  return {
    round: 1,
    date: '2026.04.20',
    dayOfWeek: '월',
    duration: '2',
    format: '오프라인',
    classNum: '1',
    timeRange: '09:30~12:20',
    ...overrides,
  }
}

describe('resolveInstructorAssignSessionDisplayLabels', () => {
  it('날짜가 있으면 날짜+시간을 유지한다', () => {
    expect(resolveInstructorAssignSessionDisplayLabels(session())).toEqual({
      dateLabel: '2026.04.20(월)',
      timeLabel: '09:30 ~ 12:20',
      scheduleLabel: '2026.04.20(월) 09:30 ~ 12:20',
    })
  })

  it('시각만 슬롯에 넣은 경우 요일을 붙이지 않고 시간만 노출한다', () => {
    expect(
      resolveInstructorAssignSessionDisplayLabels(
        session({
          date: '10:00 ~ 12:00',
          dayOfWeek: '월',
          timeRange: '10:00~12:00',
          scheduleLabel: '10:00 ~ 12:00',
        })
      )
    ).toEqual({
      dateLabel: '',
      timeLabel: '10:00 ~ 12:00',
      scheduleLabel: '10:00 ~ 12:00',
    })
  })

  it('날짜가 비어 있으면 시간만 슬롯 라벨로 쓴다', () => {
    const options = mapParticipatingSessionsToInstructorAssignOptions([
      session({ date: '', dayOfWeek: '', timeRange: '10:00~12:00' }),
    ])
    expect(options[0]?.scheduleLabel).toBe('10:00 ~ 12:00')
    expect(options[0]?.dateLabel).toBeUndefined()
    expect(options[0]?.timeLabel).toBe('10:00 ~ 12:00')
  })
})
