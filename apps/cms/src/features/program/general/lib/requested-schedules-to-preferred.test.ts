import { describe, expect, it } from 'vitest'
import {
  mapParticipantToParticipatingSchoolRow,
  mapStoredPeriodRequestedSchedulesToHopeSessions,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import { buildHopeEducationSessionsFromPreferred } from '@/features/program/general/lib/organization-education-schedule-sources'
import { readOrganizationApplicationPreferredEducationSchedules } from '@/features/program/general/lib/organization-application-preferred-education-schedules'
import { buildParticipatingSchoolPreferredScheduleLines } from '@/features/program/general/lib/participating-school-session-display'
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'
import { requestedSchedulesToPreferredEducationSchedules } from './requested-schedules-to-preferred'

/**
 * 이전 경로: organization-applications 목록의 `preferredEducationSchedules`
 * (BE `fromRequestedSchedule`이 requested-schedules로 만든 값) → buildHopeEducationSessionsFromPreferred.
 * 기간형은 행별 `/requested-schedules` → mapStoredPeriodRequestedSchedulesToHopeSessions.
 */
function oldPathHope(input: {
  requestedSchedules: RequestedScheduleResponse[]
  bePreferredEducationSchedules: unknown[]
}) {
  const storedPeriod = mapStoredPeriodRequestedSchedulesToHopeSessions(input.requestedSchedules)
  const preferred = readOrganizationApplicationPreferredEducationSchedules({
    preferredEducationSchedules: input.bePreferredEducationSchedules,
  })
  const fromPreferred = buildHopeEducationSessionsFromPreferred(preferred)
  return {
    preferred,
    hope: storedPeriod.length > 0 ? storedPeriod : fromPreferred,
  }
}

function newPathRow(requestedSchedules: RequestedScheduleResponse[]) {
  return mapParticipantToParticipatingSchoolRow(
    {
      participantId: 1,
      organizationApplicationId: 501,
      organizationName: '테스트기관',
      sessions: [],
      requestedSchedules,
    },
    0,
    '186500'
  )
}

describe('participants requestedSchedules → 희망 일정 (이전 경로와 동일)', () => {
  it('1사1교 교시형', () => {
    const requestedSchedules: RequestedScheduleResponse[] = [
      {
        id: 99460,
        preferenceOrder: 1,
        requestedDate: '2026-11-18',
        startPeriod: 2,
        sessionCount: 2,
        combinedClassYn: false,
        sessionTimes: [
          { sessionOrder: 1, period: 2, startTime: '10:00:00', endTime: '10:40:00' },
          { sessionOrder: 2, period: 3, startTime: '10:50:00', endTime: '11:30:00' },
        ],
        resolvedScheduleId: 5001,
        resolvedScheduleIds: [5001],
        label: null,
        periodStartDate: null,
        periodEndDate: null,
      },
      {
        id: 99461,
        preferenceOrder: 2,
        requestedDate: '2026-11-20',
        startPeriod: 1,
        sessionCount: 1,
        combinedClassYn: true,
        sessionTimes: [{ sessionOrder: 1, period: 1, startTime: '09:00', endTime: '09:40' }],
        resolvedScheduleId: null,
        resolvedScheduleIds: [],
        label: null,
        periodStartDate: null,
        periodEndDate: null,
      },
    ]
    const bePreferredEducationSchedules = [
      {
        scheduleId: 5001,
        round: 1,
        startAt: '2026-11-18T01:00:00Z',
        endAt: '2026-11-18T02:30:00Z',
        label: null,
        unresolvedReason: null,
        scheduleIds: [5001],
        educationDate: '2026-11-18',
      },
      {
        scheduleId: null,
        round: 2,
        startAt: '2026-11-20T00:00:00Z',
        endAt: '2026-11-20T00:40:00Z',
        label: null,
        unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH',
        scheduleIds: [],
        educationDate: '2026-11-20',
      },
    ]
    const old = oldPathHope({ requestedSchedules, bePreferredEducationSchedules })
    const row = newPathRow(requestedSchedules)

    expect(requestedSchedulesToPreferredEducationSchedules(requestedSchedules)).toEqual(
      old.preferred
    )
    expect(row.preferredEducationSchedules).toEqual(old.preferred)
    // participants 경로는 지망 순위·신청 차시 수를 별도 필드로 더 싣는다(기존 필드는 이전 경로와 동일).
    const requestedSessionCounts = [2, 1]
    expect(row.hopeEducationSessions).toEqual(
      old.hope.map((session, index) => ({
        ...session,
        preferenceOrder: session.round,
        requestedSessionCount: requestedSessionCounts[index],
      }))
    )
    expect(buildParticipatingSchoolPreferredScheduleLines(row.hopeEducationSessions)).toEqual(
      buildParticipatingSchoolPreferredScheduleLines(old.hope)
    )
    expect(row.lectureRound).toBe(String(old.hope.length))
  })

  it('일반 기관 시각 지정형 (공통정보 줄 label 포함)', () => {
    const requestedSchedules: RequestedScheduleResponse[] = [
      {
        id: 99470,
        preferenceOrder: 1,
        requestedDate: '2026-11-18',
        startPeriod: null,
        sessionCount: 1,
        combinedClassYn: false,
        sessionTimes: [{ sessionOrder: 1, period: null, startTime: '14:00', endTime: '16:00' }],
        resolvedScheduleId: 7001,
        resolvedScheduleIds: [7001, 7002],
        label: '26년 11월 18일 14:00 ~ 16:00',
        periodStartDate: null,
        periodEndDate: null,
      },
      {
        id: null,
        preferenceOrder: 2,
        startPeriod: null,
        sessionCount: 1,
        combinedClassYn: false,
        sessionTimes: [],
        resolvedScheduleId: null,
        resolvedScheduleIds: [],
        label: '26년 11월 25일 10:00 ~ 12:00',
        periodStartDate: null,
        periodEndDate: null,
      },
    ]
    const bePreferredEducationSchedules = [
      {
        scheduleId: 7001,
        round: 1,
        startAt: '2026-11-18T05:00:00Z',
        endAt: '2026-11-18T07:00:00Z',
        label: '26년 11월 18일 14:00 ~ 16:00',
        unresolvedReason: null,
        scheduleIds: [7001, 7002],
        educationDate: '2026-11-18',
      },
      {
        scheduleId: null,
        round: 2,
        startAt: null,
        endAt: null,
        label: '26년 11월 25일 10:00 ~ 12:00',
        unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH',
        scheduleIds: [],
        educationDate: null,
      },
    ]
    const old = oldPathHope({ requestedSchedules, bePreferredEducationSchedules })
    const row = newPathRow(requestedSchedules)

    expect(row.preferredEducationSchedules).toEqual(old.preferred)
    // participants 경로는 지망 순위·신청 차시 수를 별도 필드로 더 싣는다(기존 필드는 이전 경로와 동일).
    const requestedSessionCounts = [1, 1]
    expect(row.hopeEducationSessions).toEqual(
      old.hope.map((session, index) => ({
        ...session,
        preferenceOrder: session.round,
        requestedSessionCount: requestedSessionCounts[index],
      }))
    )
    expect(buildParticipatingSchoolPreferredScheduleLines(row.hopeEducationSessions)).toEqual(
      buildParticipatingSchoolPreferredScheduleLines(old.hope)
    )
    expect(row.lectureRound).toBe(String(old.hope.length))
  })

  it('기간형 (종일 행)', () => {
    const requestedSchedules: RequestedScheduleResponse[] = [
      {
        id: 99452,
        preferenceOrder: 1,
        requestedDate: '2026-11-18',
        startPeriod: 1,
        sessionCount: 1,
        combinedClassYn: false,
        sessionTimes: [],
        resolvedScheduleId: null,
        createdByActorType: 'ADMIN',
        createdByActorId: 99101,
        label: null,
        periodStartDate: null,
        periodEndDate: null,
        resolvedScheduleIds: [],
      },
      {
        id: 99453,
        preferenceOrder: 2,
        requestedDate: '2026-11-20',
        startPeriod: null,
        sessionCount: 1,
        combinedClassYn: false,
        sessionTimes: [],
        resolvedScheduleId: 8001,
        label: null,
        periodStartDate: null,
        periodEndDate: null,
        resolvedScheduleIds: [8001],
      },
    ]
    const bePreferredEducationSchedules = [
      {
        scheduleId: null,
        round: 1,
        startAt: '2026-11-17T15:00:00Z',
        endAt: '2026-11-18T15:00:00Z',
        label: null,
        unresolvedReason: 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH',
        scheduleIds: [],
        educationDate: '2026-11-18',
      },
      {
        scheduleId: 8001,
        round: 2,
        startAt: '2026-11-19T15:00:00Z',
        endAt: '2026-11-20T15:00:00Z',
        label: null,
        unresolvedReason: null,
        scheduleIds: [8001],
        educationDate: '2026-11-20',
      },
    ]
    const old = oldPathHope({ requestedSchedules, bePreferredEducationSchedules })
    const row = newPathRow(requestedSchedules)

    expect(row.preferredEducationSchedules).toEqual(old.preferred)
    expect(row.hopeEducationSessions).toEqual(old.hope)
    expect(row.hopeEducationSessions?.map(session => session.requestedScheduleId)).toEqual([
      99452, 99453,
    ])
    expect(row.lectureRound).toBe('2')
  })

  it('requestedSchedules가 비면 희망 일정 없이 dto preferred 폴백만 남는다', () => {
    expect(requestedSchedulesToPreferredEducationSchedules([])).toEqual([])
    expect(requestedSchedulesToPreferredEducationSchedules(undefined)).toEqual([])
  })
})
