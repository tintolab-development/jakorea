import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  buildParticipatingInstitutionScheduleChangeLine,
  buildParticipatingInstitutionScheduleChangeRequests,
} from './participating-institution-schedule-change'

const baseSession: ParticipatingSchoolSession = {
  round: 1,
  date: '2026.04.20',
  dayOfWeek: '월',
  duration: '3시간',
  format: '오프라인',
  classNum: '3차시',
  timeRange: '09:30 ~ 12:20',
}

describe('participating institution schedule change', () => {
  it('ISO 시각이 있으면 그것으로 일정 문자열을 만든다', () => {
    const line = buildParticipatingInstitutionScheduleChangeLine({
      ...baseSession,
      startAt: '2026-04-20T09:30:00',
      endAt: '2026-04-20T12:20:00',
    })
    expect(line).toContain('2026')
    expect(line).toContain('09:30')
    expect(line).toContain('12:20')
  })

  it('바뀐 날짜만 fromDate → toDate 요청으로 만든다', () => {
    const previous = [
      buildParticipatingInstitutionScheduleChangeLine({
        ...baseSession,
        startAt: '2026-04-20T09:30:00',
        endAt: '2026-04-20T12:20:00',
      }),
      buildParticipatingInstitutionScheduleChangeLine({
        ...baseSession,
        round: 2,
        startAt: '2026-04-27T13:00:00',
        endAt: '2026-04-27T15:50:00',
      }),
    ]
    const next = [
      previous[0]!,
      buildParticipatingInstitutionScheduleChangeLine({
        ...baseSession,
        round: 2,
        startAt: '2026-04-28T13:00:00',
        endAt: '2026-04-28T15:50:00',
      }),
    ]
    expect(buildParticipatingInstitutionScheduleChangeRequests(previous, next)).toEqual([
      { fromDate: '2026-04-27', toDate: '2026-04-28' },
    ])
  })
})
