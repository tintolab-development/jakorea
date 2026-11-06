import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  buildTrainedTeacherEducationProgressRows,
  formatTrainedTeacherEducationProgressDateTime,
  resolveTrainedTeacherEducationProgressBadge,
} from './education-progress-schedule'

function session(
  patch: Partial<ParticipatingSchoolSession> &
    Pick<ParticipatingSchoolSession, 'date' | 'timeRange' | 'resolvedScheduleId'>
): ParticipatingSchoolSession {
  return {
    round: 1,
    dayOfWeek: '화',
    duration: '',
    format: '',
    classNum: '',
    ...patch,
  }
}

describe('resolveTrainedTeacherEducationProgressBadge', () => {
  it('COMPLETED / SCHEDULED / IN_PROGRESS 만 시안 뱃지로 매핑한다', () => {
    expect(resolveTrainedTeacherEducationProgressBadge('COMPLETED')).toEqual({
      label: '진행 완료',
      statusClass: 'participating-institution-application-info__session-status--completed',
    })
    expect(resolveTrainedTeacherEducationProgressBadge('IN_PROGRESS')?.label).toBe('진행 중')
    expect(resolveTrainedTeacherEducationProgressBadge('SCHEDULED')?.label).toBe('진행 대기')
    expect(resolveTrainedTeacherEducationProgressBadge('UNSCHEDULED')).toBeNull()
    expect(resolveTrainedTeacherEducationProgressBadge(null)).toBeNull()
    expect(resolveTrainedTeacherEducationProgressBadge(undefined)).toBeNull()
  })

  it('preferred MATCHED 는 진행 뱃지로 쓰지 않는다', () => {
    expect(resolveTrainedTeacherEducationProgressBadge('MATCHED')).toBeNull()
  })
})

describe('buildTrainedTeacherEducationProgressRows', () => {
  it('educationSchedules가 없으면 희망 일정으로 행을 만들지 않는다', () => {
    expect(
      buildTrainedTeacherEducationProgressRows(
        [],
        [
          {
            preferenceRank: 1,
            date: '2026-04-20',
            dayOfWeek: '월',
            sessionCount: 3,
            sessionTimes: [],
            scheduleId: 1,
            scheduleStatus: 'MATCHED',
          },
        ]
      )
    ).toEqual([])
  })

  it('1691599처럼 MATCHED 지망 7건이면 1~7지망 행을 모두 그린다', () => {
    const preferred = [
      { rank: 1, date: '2026-11-13', id: 187703, day: '금' },
      { rank: 2, date: '2026-11-16', id: 187704, day: '월' },
      { rank: 3, date: '2026-11-17', id: 187701, day: '화' },
      { rank: 4, date: '2026-11-19', id: 187702, day: '목' },
      { rank: 5, date: '2026-11-24', id: 187707, day: '화' },
      { rank: 6, date: '2026-11-26', id: 187706, day: '목' },
      { rank: 7, date: '2026-11-27', id: 187705, day: '금' },
    ]
    const rows = buildTrainedTeacherEducationProgressRows(
      preferred.map(item =>
        session({
          date: item.date.replace(/-/g, '.'),
          dayOfWeek: item.day,
          timeRange: '15:07~16:07',
          resolvedScheduleId: item.id,
          startAt: `${item.date}T06:07:00Z`,
          endAt: `${item.date}T07:07:00Z`,
          deliveryScheduleStatus: 'SCHEDULED',
        })
      ),
      preferred.map(item => ({
        preferenceRank: item.rank,
        date: item.date,
        dayOfWeek: item.day,
        sessionCount: 1,
        sessionTimes: [],
        scheduleId: item.id,
        scheduleStatus: 'MATCHED' as const,
      }))
    )

    expect(rows.map(row => row.rowLabel)).toEqual([
      '1지망',
      '2지망',
      '3지망',
      '4지망',
      '5지망',
      '6지망',
      '7지망',
    ])
    expect(rows.map(row => row.session.duration)).toEqual(Array(7).fill('1차시'))
    expect(rows.flatMap(row => row.attendanceScheduleIds)).toEqual([
      187703, 187704, 187701, 187702, 187707, 187706, 187705,
    ])
    expect(formatTrainedTeacherEducationProgressDateTime(rows[0]!.session)).toBe(
      '2026.11.13(금) 15:07 ~ 16:07'
    )
  })

  it('같은 지망·같은 희망 날짜의 연속 슬롯은 N차시로 묶고 scheduleId는 모두 남긴다', () => {
    const rows = buildTrainedTeacherEducationProgressRows(
      [
        session({
          date: '2026.04.20',
          dayOfWeek: '월',
          timeRange: '09:30~10:20',
          resolvedScheduleId: 1,
          startAt: '2026-04-20T00:30:00Z',
          endAt: '2026-04-20T01:20:00Z',
          deliveryScheduleStatus: 'COMPLETED',
        }),
        session({
          date: '2026.04.20',
          dayOfWeek: '월',
          timeRange: '10:30~11:20',
          resolvedScheduleId: 2,
          startAt: '2026-04-20T01:30:00Z',
          endAt: '2026-04-20T02:20:00Z',
          deliveryScheduleStatus: 'COMPLETED',
        }),
        session({
          date: '2026.04.20',
          dayOfWeek: '월',
          timeRange: '11:30~12:20',
          resolvedScheduleId: 3,
          startAt: '2026-04-20T02:30:00Z',
          endAt: '2026-04-20T03:20:00Z',
          deliveryScheduleStatus: 'COMPLETED',
        }),
      ],
      [
        {
          preferenceRank: 1,
          date: '2026-04-20',
          dayOfWeek: '월',
          sessionCount: 3,
          sessionTimes: [],
          scheduleId: 1,
          scheduleStatus: 'MATCHED',
        },
        {
          preferenceRank: 1,
          date: '2026-04-20',
          dayOfWeek: '월',
          sessionCount: 3,
          sessionTimes: [],
          scheduleId: 2,
          scheduleStatus: 'MATCHED',
        },
        {
          preferenceRank: 1,
          date: '2026-04-20',
          dayOfWeek: '월',
          sessionCount: 3,
          sessionTimes: [],
          scheduleId: 3,
          scheduleStatus: 'MATCHED',
        },
      ]
    )

    expect(rows).toHaveLength(1)
    expect(rows[0]?.rowLabel).toBe('1지망')
    expect(rows[0]?.session.duration).toBe('3차시')
    expect(rows[0]?.session.timeRange).toBe('09:30~12:20')
    expect(rows[0]?.attendanceScheduleIds).toEqual([1, 2, 3])
    expect(formatTrainedTeacherEducationProgressDateTime(rows[0]!.session)).toBe(
      '2026.04.20(월) 09:30 ~ 12:20'
    )
  })

  it('educationSchedules가 1건이면 preferred가 7건이어도 1행만 그린다', () => {
    const rows = buildTrainedTeacherEducationProgressRows(
      [
        session({
          date: '2026.11.24',
          timeRange: '15:07~16:07',
          resolvedScheduleId: 187707,
          deliveryScheduleStatus: 'SCHEDULED',
        }),
      ],
      [1, 2, 3, 4, 5, 6, 7].map(rank => ({
        preferenceRank: rank,
        date: '2026-11-24',
        dayOfWeek: '화',
        sessionCount: 1,
        sessionTimes: [],
        scheduleId: rank === 5 ? 187707 : 187700 + rank,
        scheduleStatus: 'MATCHED' as const,
      }))
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.rowLabel).toBe('5지망')
    expect(rows[0]?.attendanceScheduleIds).toEqual([187707])
  })

  it('UNMATCHED 블록은 지망 라벨에 쓰지 않고 교육 일정 행은 남긴다', () => {
    const rows = buildTrainedTeacherEducationProgressRows(
      [
        session({
          round: 7,
          date: '2026.11.24',
          timeRange: '15:07~16:07',
          resolvedScheduleId: 187707,
          deliveryScheduleStatus: 'SCHEDULED',
        }),
      ],
      [
        {
          preferenceRank: 5,
          date: '2026-11-24',
          dayOfWeek: '화',
          sessionCount: 1,
          sessionTimes: [],
          scheduleId: 187707,
          scheduleStatus: 'UNMATCHED',
        },
      ]
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.rowLabel).toBe('')
    expect(rows[0]?.session.duration).toBe('1차시')
  })

  it('session_no(round=7)를 차시로 쓰지 않는다', () => {
    const rows = buildTrainedTeacherEducationProgressRows(
      [
        session({
          round: 7,
          date: '2026.11.24',
          dayOfWeek: '화',
          timeRange: '15:07~16:07',
          duration: '7차시',
          resolvedScheduleId: 187707,
          startAt: '2026-11-24T06:07:00Z',
          endAt: '2026-11-24T07:07:00Z',
          deliveryScheduleStatus: 'SCHEDULED',
          educationScheduleLabel: '공통 교육 예정 7',
        }),
      ],
      [
        {
          preferenceRank: 5,
          date: '2026-11-24',
          dayOfWeek: '화',
          sessionCount: 1,
          sessionTimes: [],
          scheduleId: 187707,
          scheduleStatus: 'MATCHED',
          round: 7,
        },
      ]
    )

    expect(rows[0]?.rowLabel).toBe('5지망')
    expect(rows[0]?.session.duration).toBe('1차시')
    expect(rows[0]?.session.round).toBe(7)
    expect(formatTrainedTeacherEducationProgressDateTime(rows[0]!.session)).toBe(
      '2026.11.24(화) 15:07 ~ 16:07'
    )
  })
})
