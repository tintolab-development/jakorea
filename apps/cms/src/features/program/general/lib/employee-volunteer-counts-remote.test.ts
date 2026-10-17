import { describe, expect, it } from 'vitest'
import {
  buildEmployeeVolunteerCountsPutRequest,
  buildEmployeeVolunteerSessionRowScheduleMap,
  EmployeeVolunteerScheduleMappingError,
  mapEmployeeVolunteerCountsGetToSessionCounts,
} from './employee-volunteer-counts-remote'
import type { EmployeeVolunteerSessionRow } from './employee-volunteer-session-rows'

describe('buildEmployeeVolunteerSessionRowScheduleMap', () => {
  const sessionRows: EmployeeVolunteerSessionRow[] = [
    {
      id: 'pre_education',
      label: '사전교육',
      round: null,
      isPreEducation: true,
      countsTowardParticipants: true,
    },
    {
      id: 'round_1',
      label: '1회차 교육',
      round: 1,
      isPreEducation: false,
      countsTowardParticipants: false,
    },
    {
      id: 'round_2',
      label: '2회차 교육',
      round: 2,
      isPreEducation: false,
      countsTowardParticipants: false,
    },
  ]

  it('sessionNo로 회차 scheduleId를 매칭한다', () => {
    const map = buildEmployeeVolunteerSessionRowScheduleMap(sessionRows, [
      { scheduleId: 10, sessionNo: 0, scheduleName: '사전교육' },
      { scheduleId: 20, sessionNo: 1, scheduleName: '1회차' },
      { scheduleId: 30, sessionNo: 2, scheduleName: '2회차' },
    ])

    expect(map.get('pre_education')).toBe(10)
    expect(map.get('round_1')).toBe(20)
    expect(map.get('round_2')).toBe(30)
  })

  it('사전교육 이름이 없으면 pre_education 행을 매핑하지 않는다', () => {
    const map = buildEmployeeVolunteerSessionRowScheduleMap(sessionRows, [
      { scheduleId: 20, sessionNo: 1, scheduleName: '1회차' },
      { scheduleId: 30, sessionNo: 2, scheduleName: '2회차' },
    ])

    expect(map.has('pre_education')).toBe(false)
    expect(map.get('round_1')).toBe(20)
  })
})

describe('mapEmployeeVolunteerCountsGetToSessionCounts', () => {
  const sessionRows: EmployeeVolunteerSessionRow[] = [
    {
      id: 'program_progress',
      label: '프로그램 진행',
      round: 1,
      isPreEducation: false,
      countsTowardParticipants: false,
    },
  ]

  it('confirmed=false이면 미등록(빈 값)으로 복원한다', () => {
    const counts = mapEmployeeVolunteerCountsGetToSessionCounts(
      sessionRows,
      [{ scheduleId: 1, sessionNo: 1, scheduleName: '프로그램 진행' }],
      [
        {
          scheduleId: 1,
          newVolunteerCount: 0,
          reparticipationVolunteerCount: 0,
          confirmed: false,
        },
      ]
    )

    expect(counts.program_progress).toEqual({})
  })

  it('confirmed=true이고 0명이면 저장된 0으로 복원한다', () => {
    const counts = mapEmployeeVolunteerCountsGetToSessionCounts(
      sessionRows,
      [{ scheduleId: 1, sessionNo: 1, scheduleName: '프로그램 진행' }],
      [
        {
          scheduleId: 1,
          newVolunteerCount: 0,
          reparticipationVolunteerCount: 0,
          confirmed: true,
          revision: 1,
        },
      ]
    )

    expect(counts.program_progress).toEqual({ newCount: 0, returningCount: 0 })
  })
})

describe('buildEmployeeVolunteerCountsPutRequest', () => {
  const sessionRows: EmployeeVolunteerSessionRow[] = [
    {
      id: 'round_1',
      label: '1회차 교육',
      round: 1,
      isPreEducation: false,
      countsTowardParticipants: false,
    },
    {
      id: 'round_2',
      label: '2회차 교육',
      round: 2,
      isPreEducation: false,
      countsTowardParticipants: false,
    },
  ]

  const schedules = [
    { scheduleId: 20, sessionNo: 1, scheduleName: '1회차' },
    { scheduleId: 30, sessionNo: 2, scheduleName: '2회차' },
  ]

  it('GET entries의 scheduleId 집합으로 PUT entries를 만든다', () => {
    const request = buildEmployeeVolunteerCountsPutRequest({
      organizationApplicationId: 50101,
      sessionRows,
      schedules,
      countsBySessionId: {
        round_1: { newCount: 3, returningCount: 2 },
        round_2: { newCount: 1, returningCount: 0 },
      },
      previousEntries: [
        { scheduleId: 20, revision: 2, confirmed: true },
        { scheduleId: 30, revision: 0, confirmed: false },
      ],
    })

    expect(request.reason).toBe('CMS 참여 봉사자 임직원 자원봉사자 인원 등록')
    expect(request.entries).toHaveLength(2)
    expect(request.entries?.[0]).toEqual({
      scheduleId: 20,
      newVolunteerCount: 3,
      reparticipationVolunteerCount: 2,
      expectedRevision: 2,
    })
    expect(request.entries?.[1]).toEqual({
      scheduleId: 30,
      newVolunteerCount: 1,
      reparticipationVolunteerCount: 0,
      expectedRevision: 0,
    })
  })

  it('서버 일정이 화면 매핑과 다르면 저장을 차단한다', () => {
    expect(() =>
      buildEmployeeVolunteerCountsPutRequest({
        sessionRows,
        schedules,
        countsBySessionId: {
          round_1: { newCount: 1, returningCount: 0 },
          round_2: { newCount: 0, returningCount: 0 },
        },
        previousEntries: [{ scheduleId: 99, revision: 0 }],
      })
    ).toThrow(EmployeeVolunteerScheduleMappingError)
  })

  it('program_progress는 regularSchedules[0] 폴백 없이 이름 매칭만 한다', () => {
    const progressRow: EmployeeVolunteerSessionRow = {
      id: 'program_progress',
      label: '프로그램 진행',
      round: 1,
      isPreEducation: false,
      countsTowardParticipants: false,
    }
    const map = buildEmployeeVolunteerSessionRowScheduleMap([progressRow], [
      { scheduleId: 20, sessionNo: 1, scheduleName: '다른 이름' },
    ])
    expect(map.has('program_progress')).toBe(false)
  })

  it('GET entries scheduleName으로 동일 sessionNo 일정을 구분한다', () => {
    const sessionRowsMulti: EmployeeVolunteerSessionRow[] = [
      {
        id: 'round_1',
        label: '오리엔테이션',
        round: 1,
        isPreEducation: false,
        countsTowardParticipants: false,
      },
      {
        id: 'round_2',
        label: '국내대회',
        round: 2,
        isPreEducation: false,
        countsTowardParticipants: false,
      },
    ]

    const map = buildEmployeeVolunteerSessionRowScheduleMap(
      sessionRowsMulti,
      [
        { scheduleId: 201, sessionNo: 1, scheduleName: '오리엔테이션' },
        { scheduleId: 202, sessionNo: 1, scheduleName: '국내대회' },
      ],
      [
        { scheduleId: 201, scheduleName: '오리엔테이션' },
        { scheduleId: 202, scheduleName: '국내대회' },
      ]
    )

    expect(map.get('round_1')).toBe(201)
    expect(map.get('round_2')).toBe(202)
  })

  it('Orientation은 사전교육으로 매핑하지 않는다', () => {
    const preRow: EmployeeVolunteerSessionRow = {
      id: 'pre_education',
      label: '사전교육',
      round: null,
      isPreEducation: true,
      countsTowardParticipants: true,
    }

    const map = buildEmployeeVolunteerSessionRowScheduleMap(
      [preRow],
      [{ scheduleId: 50, sessionNo: 0, scheduleName: 'Orientation' }]
    )

    expect(map.has('pre_education')).toBe(false)
  })
})
