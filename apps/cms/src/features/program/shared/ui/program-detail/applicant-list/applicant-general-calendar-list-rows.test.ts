import { describe, expect, it } from 'vitest'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { ApplicantCalendarEvent } from './applicant-calendar-events'
import {
  buildGeneralInstitutionCalendarListRows,
  buildGeneralInstructorCalendarListRows,
} from './applicant-general-calendar-list-rows'
import type { Program } from '@/types/domain'

const instructor = {
  id: 'inst-1',
  no: 1,
  instructorName: '한서연',
  lectureExperienceYears: 0,
  educationLevel: '',
  educationSchoolName: '',
  contact: '',
  email: '',
  address: '',
  approvalStatus: 'approved',
  // 신청 단위 거리 — 마지막 배정 기관 거리라 기관 카드에 쓰면 안 된다
  distanceKm: 77.7,
  organizationDistances: [
    { organizationApplicationId: 501, distanceKm: 12.3, longDistance: false },
    { organizationApplicationId: 502, distanceKm: 231.4, longDistance: true },
  ],
} as ApplicantInstructorRow

function eventFor(organizationApplicationId: string, schoolName: string): ApplicantCalendarEvent {
  return {
    id: `2026-11-20|${organizationApplicationId}|9001`,
    title: schoolName,
    startDate: '2026-11-20T00:00:00.000Z',
    endDate: '2026-11-20T01:00:00.000Z',
    originalItem: {
      ...instructor,
      calendarBucketSchoolName: schoolName,
      calendarInstitutionRow: { id: organizationApplicationId, schoolName } as ApplicantSchoolRow,
      calendarInstitutionInstructors: [instructor],
    },
  } as unknown as ApplicantCalendarEvent
}

describe('buildGeneralInstructorCalendarListRows 거리', () => {
  it('기관 카드마다 그 기관 신청까지의 거리를 쓴다', () => {
    const rows = buildGeneralInstructorCalendarListRows([
      eventFor('501', '계남중학교'),
      eventFor('502', '부명초등학교'),
    ])
    expect(rows.map(row => row.distanceDisplay)).toEqual(['12.3km', '231.4km (장거리)'])
    expect(rows[0]?.isNearDistance).toBe(true)
  })

  it('그 기관 거리가 없으면 신청 단위 거리로 대체하지 않는다', () => {
    const [row] = buildGeneralInstructorCalendarListRows([eventFor('999', '다른학교')])
    expect(row?.distanceKm).toBeNull()
    expect(row?.distanceDisplay).toBe('-')
  })
})

describe('buildGeneralInstitutionCalendarListRows 일정 라벨(교육 구조별)', () => {
  function institutionEvent(sessionNo: number, scheduleName?: string): ApplicantCalendarEvent {
    const institution = {
      id: 'org-1',
      schoolName: '제이초',
      region: '서울특별시 중구',
      educationGrade: '3학년',
      approvalStatus: 'approved',
      sessions: [
        {
          round: 1,
          sessionNo,
          ...(scheduleName ? { scheduleName } : {}),
          date: '2026.11.20',
          dayOfWeek: '금',
          duration: '-',
          format: '-',
          classNum: '',
          timeRange: '09:00 ~ 10:00',
        },
      ],
    } as unknown as ApplicantSchoolRow
    return {
      id: 'ev-1',
      title: '제이초',
      startDate: '2026-11-20T00:00:00',
      endDate: '2026-11-20T01:00:00',
      originalItem: institution,
    } as unknown as ApplicantCalendarEvent
  }
  function program(structure: 'curriculum' | 'schedule', round: 'single' | 'multi'): Program {
    return {
      id: 'p-1',
      generalProgramAudience: 'organization',
      generalProgramEducationStructure: structure,
      generalProgramSessionRound: round,
      generalCommonInfo: {
        curriculumSessions:
          structure === 'curriculum'
            ? [
                { sessionLabel: round === 'multi' ? '1회차' : '1차시', title: '', description: '' },
                { sessionLabel: round === 'multi' ? '2회차' : '2차시', title: '', description: '' },
              ]
            : [],
        scheduleDetails: [{ scheduleLabel: '세부 일정 01', name: '오리엔테이션' }],
      },
    } as unknown as Program
  }

  it('program이 없으면 지망·순번을 회차로 쓰지 않고 시간만', () => {
    expect(buildGeneralInstitutionCalendarListRows([institutionEvent(2)])[0]?.sessionLabel).toBe(
      '09:00 ~ 10:00'
    )
  })

  it('일정형=세부 일정명, 단일=N차시, 복수=sessionNo 회차', () => {
    expect(
      buildGeneralInstitutionCalendarListRows([institutionEvent(1, '현장 견학')], {
        program: program('schedule', 'multi'),
      })[0]?.sessionLabel
    ).toBe('현장 견학 (09:00 ~ 10:00)')
    expect(
      buildGeneralInstitutionCalendarListRows([institutionEvent(1)], {
        program: program('curriculum', 'single'),
      })[0]?.sessionLabel
    ).toBe('2차시 (09:00 ~ 10:00)')
    expect(
      buildGeneralInstitutionCalendarListRows([institutionEvent(2)], {
        program: program('curriculum', 'multi'),
      })[0]?.sessionLabel
    ).toMatch(/^2회차/)
  })
})

describe('buildGeneralInstructorCalendarListRows 활동 포기', () => {
  const withdrawn = { ...instructor, activityWithdrawn: true } as ApplicantInstructorRow
  function withdrawnEvent(): ApplicantCalendarEvent {
    const event = eventFor('501', '계남중학교')
    return {
      ...event,
      originalItem: {
        ...(event.originalItem as object),
        calendarInstitutionInstructors: [withdrawn],
      },
    } as unknown as ApplicantCalendarEvent
  }

  it('일반 기관형(showActivityWithdrawn)에서만 activityWithdrawn을 카드에 싣는다', () => {
    const [shown] = buildGeneralInstructorCalendarListRows([withdrawnEvent()], {
      showActivityWithdrawn: true,
    })
    expect(shown?.activityWithdrawn).toBe(true)
    // 1사1교 등 옵션 생략 — 기존처럼 뱃지 없음
    const [hidden] = buildGeneralInstructorCalendarListRows([withdrawnEvent()])
    expect(hidden?.activityWithdrawn).toBeUndefined()
  })
})
