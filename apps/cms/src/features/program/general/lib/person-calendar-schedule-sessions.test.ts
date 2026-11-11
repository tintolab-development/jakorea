import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  buildAssignedPersonCalendarSessionsByMemberId,
  buildScheduleIdsPersonCalendarSessions,
  formatPersonCalendarSessionLabel,
} from './person-calendar-schedule-sessions'
import {
  resolveEducationScheduleSessionLeadLabel,
  resolveSchoolDetailAttendanceSessionLeadLabel,
} from './school-detail-attendance-display'
import {
  buildIndividualScheduleUnassignMessage,
  resolveIndividualScheduleUnassignTitle,
} from '../ui/detail-modal/program-status/school-detail-unassign-confirm-modal'

function program(input: {
  structure: 'curriculum' | 'schedule'
  round: 'single' | 'multi'
  curriculumLabels?: string[]
  scheduleDetailNames?: string[]
}): Program {
  return {
    id: 'p-1',
    generalProgramAudience: 'individual',
    generalProgramEducationStructure: input.structure,
    generalProgramSessionRound: input.round,
    generalCommonInfo: {
      curriculumSessions: (input.curriculumLabels ?? []).map(sessionLabel => ({
        sessionLabel,
        title: '',
        description: '',
      })),
      scheduleDetails: (input.scheduleDetailNames ?? []).map((name, index) => ({
        scheduleLabel: `세부 일정 ${String(index + 1).padStart(2, '0')}`,
        name,
      })),
    },
  } as unknown as Program
}

const schedules = [
  {
    id: 11,
    sessionNo: 2,
    curriculumSessionCount: 2,
    startAt: '2026-01-07T00:20:00Z',
    endAt: '2026-01-07T02:20:00Z',
  },
  { id: 12, sessionNo: 1, startAt: '2026-01-12T23:20:00Z', endAt: '2026-01-13T00:20:00Z' },
  {
    id: 13,
    scheduleRole: 'PRE_EDUCATION',
    startAt: '2026-01-05T01:00:00Z',
    endAt: '2026-01-05T02:00:00Z',
  },
]

describe('buildScheduleIdsPersonCalendarSessions', () => {
  it('maps availableScheduleIds to KST sessions and skips unknown ids', () => {
    const sessions = buildScheduleIdsPersonCalendarSessions([11, 99, 11, 12], schedules)
    expect(sessions).toHaveLength(2)
    expect(sessions[0]).toMatchObject({
      date: '2026.01.07',
      timeRange: '09:20 ~ 11:20',
      sessionNo: 2,
      curriculumSessionCount: 2,
      resolvedScheduleId: 11,
    })
    expect(sessions[1]).toMatchObject({ date: '2026.01.13', timeRange: '08:20 ~ 09:20' })
  })

  it('returns [] without ids or schedules', () => {
    expect(buildScheduleIdsPersonCalendarSessions(undefined, schedules)).toEqual([])
    expect(buildScheduleIdsPersonCalendarSessions([11], [])).toEqual([])
  })
})

describe('일정 라벨 — 교육 구조별 (회차 ≠ 차시)', () => {
  const [withCount, noCount, preEducation] = buildScheduleIdsPersonCalendarSessions(
    [11, 12, 13],
    schedules
  )

  it('커리큘럼형 복수 회차: N회차(sessionNo), 차시 수를 알면 기존 관례 `N회차 (K차시)`', () => {
    const p = program({ structure: 'curriculum', round: 'multi', curriculumLabels: ['1회차', '2회차'] })
    // 일정 curriculumSessionCount(2) — 회차 2의 차시 수
    expect(formatPersonCalendarSessionLabel(withCount!, p)).toBe('2회차 · 2차시 (09:20 ~ 11:20)')
    // 차시 수 없음 → 회차만. sessionNo(1)를 차시로 쓰지 않는다
    expect(formatPersonCalendarSessionLabel(noCount!, p)).toBe('1회차 (08:20 ~ 09:20)')
  })

  it('커리큘럼형 단일 회차(하루 진행): 차시 수 `N차시` — 일정 값, 없으면 공통정보 차시 개수', () => {
    const p = program({
      structure: 'curriculum',
      round: 'single',
      curriculumLabels: ['1차시', '2차시', '3차시'],
    })
    expect(formatPersonCalendarSessionLabel(withCount!, p)).toBe('2차시 (09:20 ~ 11:20)')
    expect(formatPersonCalendarSessionLabel(noCount!, p)).toBe('3차시 (08:20 ~ 09:20)')
  })

  it('일정형: 세부 일정명(sessionNo 기준)', () => {
    const p = program({ structure: 'schedule', round: 'multi', scheduleDetailNames: ['오리엔테이션', '본 교육'] })
    expect(formatPersonCalendarSessionLabel(noCount!, p)).toBe('오리엔테이션 (08:20 ~ 09:20)')
    expect(formatPersonCalendarSessionLabel(withCount!, p)).toBe('본 교육 (09:20 ~ 11:20)')
  })

  it('사전교육: 사전교육 라벨', () => {
    const p = program({ structure: 'curriculum', round: 'multi', curriculumLabels: ['1회차'] })
    expect(formatPersonCalendarSessionLabel(preEducation!, p)).toBe('사전교육 (10:00 ~ 11:00)')
  })

  it('프로그램 정보가 없으면 시간만, 복수 회차인데 회차를 모르면 null', () => {
    expect(formatPersonCalendarSessionLabel(withCount!, null)).toBe('09:20 ~ 11:20')
    const p = program({ structure: 'curriculum', round: 'multi', curriculumLabels: ['1회차'] })
    expect(resolveEducationScheduleSessionLeadLabel({ sessionNo: null }, p)).toBeNull()
  })
})

describe('resolveSchoolDetailAttendanceSessionLeadLabel — 출석·과제 패널·필터·엑셀', () => {
  it('단일 회차는 회차 번호를 차시 라벨 인덱스로 쓰지 않고 차시 수 `N차시`', () => {
    const p = program({
      structure: 'curriculum',
      round: 'single',
      curriculumLabels: ['1차시', '2차시', '3차시', '4차시'],
    })
    // 구: curriculumSessions[round-1].sessionLabel → `1차시`
    expect(resolveSchoolDetailAttendanceSessionLeadLabel(p, 1)).toBe('4차시')
    expect(resolveSchoolDetailAttendanceSessionLeadLabel(p, 1, { curriculumSessionCount: 2 })).toBe(
      '2차시'
    )
  })

  it('복수 회차는 `N회차`, 공통정보 회차 행의 진행 차시 수가 있으면 `N회차 (K차시)`', () => {
    const p = {
      ...program({ structure: 'curriculum', round: 'multi' }),
      generalCommonInfo: {
        curriculumSessions: [
          { sessionLabel: '1회차', title: '2', description: '' },
          { sessionLabel: '2회차', title: '', description: '' },
        ],
      },
    } as unknown as Program
    expect(resolveSchoolDetailAttendanceSessionLeadLabel(p, 1)).toBe('1회차 (2차시)')
    expect(resolveSchoolDetailAttendanceSessionLeadLabel(p, 2)).toBe('2회차')
  })

  it('일정형은 세부 일정명, 사전교육은 사전교육', () => {
    const p = program({ structure: 'schedule', round: 'single', scheduleDetailNames: ['특강'] })
    expect(resolveSchoolDetailAttendanceSessionLeadLabel(p, 1)).toBe('특강')
    expect(
      resolveSchoolDetailAttendanceSessionLeadLabel(p, 1, { scheduleRole: 'PRE_EDUCATION' })
    ).toBe('사전교육')
  })
})

describe('buildAssignedPersonCalendarSessionsByMemberId', () => {
  it('groups by member, drops cancelled, falls back to lectureDate', () => {
    const map = buildAssignedPersonCalendarSessionsByMemberId(
      [
        { instructorMemberId: 7, scheduleId: 11, assignmentStatus: 'ASSIGNED' },
        { instructorMemberId: 7, scheduleId: 11, assignmentStatus: 'ASSIGNED' },
        { instructorMemberId: 7, scheduleId: 12, assignmentStatus: 'CANCELLED' },
        {
          instructorMemberId: 8,
          scheduleId: 500,
          lectureDate: '2026-02-03',
          curriculumSessionCount: 3,
        },
      ],
      schedules
    )
    expect(map.get('7')).toHaveLength(1)
    expect(map.get('8')?.[0]).toMatchObject({
      date: '2026.02.03',
      timeRange: '-',
      curriculumSessionCount: 3,
    })
  })
})

describe('individual schedule unassign copy', () => {
  it('builds single/bulk title and before/after-send message', () => {
    expect(resolveIndividualScheduleUnassignTitle(1)).toBe('교육 배정 취소 안내')
    expect(resolveIndividualScheduleUnassignTitle(3)).toBe('교육 일괄 배정 취소 안내')
    expect(buildIndividualScheduleUnassignMessage(['2026.01.09(금) 09:20 ~ 11:20'], false)).toBe(
      '[**2026.01.09(금) 09:20 ~ 11:20**] 교육일의 배정을 취소하시겠습니까?\n취소 시 발송 예정인 배정 알림이 있는 경우 자동으로 취소됩니다.'
    )
    expect(buildIndividualScheduleUnassignMessage(['A', 'B', 'C'], true)).toBe(
      '[**A**] 교육일 외 2개의 배정을 취소하시겠습니까?\n취소 시 입력하신 사유가 회원에게 취소 사유로 안내되며, 알림이 발송됩니다.'
    )
  })
})
