import { describe, expect, it } from 'vitest'
import {
  buildParticipatingInstructorAssignedScheduleRowsFromBoard,
  buildParticipatingInstructorWaitingScheduleRowsFromBoard,
  buildParticipatingInstructorWaitingSchoolRowsFromBoard,
  createSessionInstructorCapChecker,
  mergeInstitutionWaitingRowsBySchool,
} from './build-participating-instructor-assignment-rows'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import type { InstructorAssignmentListItemEnriched } from '@/features/program/general/api/instructor-assignment-types'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'

function session(
  scheduleId: number | null,
  date: string,
  overrides: Partial<ParticipatingSchoolSession> = {}
): ParticipatingSchoolSession {
  return {
    round: 1,
    date,
    dayOfWeek: '화',
    duration: '60분',
    format: '공통 교육 예정',
    classNum: '1교시',
    timeRange: '18:57 ~ 19:57',
    status: 'pending',
    resolvedScheduleId: scheduleId,
    scheduleUnresolved: scheduleId == null,
    ...overrides,
  }
}

function school(
  id: string,
  orgAppId: string,
  name: string,
  sessions: ParticipatingSchoolSession[],
  overrides: Partial<ParticipatingSchoolRow> = {}
): ParticipatingSchoolRow {
  return {
    id,
    no: 1,
    schoolName: name,
    region: '-',
    educationGrade: '-',
    classCount: 0,
    studentCount: 0,
    lectureRound: '',
    textbookStatus: 'not_applicable',
    approvalStatus: 'approved',
    teacherName: '-',
    instructors: '',
    organizationApplicationId: orgAppId,
    sessions,
    ...overrides,
  }
}

function assignment(
  assignmentId: number,
  instructorMemberId: number,
  organizationApplicationId: number,
  scheduleId: number,
  assignmentStatus = 'ASSIGNED'
): InstructorAssignmentListItemEnriched {
  return {
    assignmentId,
    programId: 186416,
    scheduleId,
    organizationApplicationId,
    instructorMemberId,
    assignmentStatus,
  } as InstructorAssignmentListItemEnriched
}

function instructor(memberId: string): ParticipatingInstructorRow {
  return { id: `p-${memberId}`, memberId } as ParticipatingInstructorRow
}

/** program 186416 실제 응답 기준 */
const schoolRows = [
  school('1695006', '1691530', '광주누리초등학교', [session(187446, '2026.11.03')], {
    preferredEducationSchedules: [
      { scheduleId: 184988, round: 1, startAt: '2026-11-03T09:57:00Z', endAt: '2026-11-03T10:57:00Z', label: null },
    ],
  }),
  school('1695004', '1691529', 'QA 제휴학교', [session(187447, '2026.11.05')]),
  school('1694993', '1691527', 'QA 제휴학교', [session(187429, '2026.11.11')]),
]

const assignments = [
  assignment(1694872, 190076, 1691530, 187446),
  assignment(1694871, 190076, 1691527, 187429),
  assignment(1694870, 190076, 1691529, 187447),
  assignment(1694868, 190102, 1691527, 187429),
]

function build(input: {
  memberId: string
  schoolRows?: ParticipatingSchoolRow[]
  assignments?: InstructorAssignmentListItemEnriched[]
  isCompanySchool?: boolean
  maxAssignableInstructors?: number | null
}) {
  return buildParticipatingInstructorWaitingSchoolRowsFromBoard({
    instructor: instructor(input.memberId),
    schoolRows: input.schoolRows ?? schoolRows,
    instructorList: [],
    assignedSchoolIds: new Set(),
    isCompanySchool: input.isCompanySchool ?? false,
    assignments: input.assignments ?? assignments,
    instructorMemberId: input.memberId,
    maxAssignableInstructors: input.maxAssignableInstructors,
  })
}

const twoScheduleSchool = school('1695004', '1691529', 'QA 제휴학교', [
  session(187447, '2026.11.05'),
  session(187448, '2026.11.06', { round: 2, dayOfWeek: '금' }),
])

describe('buildParticipatingInstructorWaitingSchoolRowsFromBoard', () => {
  it('program 186416: 공하은 — 세 일정 모두 본인 배정이라 빈 목록', () => {
    expect(build({ memberId: '190076', maxAssignableInstructors: 1 })).toEqual([])
    expect(build({ memberId: '190076', maxAssignableInstructors: 2 })).toEqual([])
    expect(build({ memberId: '190076' })).toEqual([])
  })

  it('program 186416: 최지원 — 공하은 배정 일정은 노출, 본인 배정(QA 11/11)은 제외', () => {
    for (const isCompanySchool of [false, true]) {
      const rows = build({ memberId: '190102', isCompanySchool, maxAssignableInstructors: 2 })
      expect(rows.map(r => r.schoolId).sort()).toEqual(['1695004', '1695006'])
      expect(rows.flatMap(r => r.sessions?.map(s => s.resolvedScheduleId) ?? []).sort()).toEqual([
        187446, 187447,
      ])
      expect(rows.every(r => r.assignmentStatus === 'waiting')).toBe(true)
    }
  })

  it('program 186416: 최대 배정 수 1이면 공하은 배정 일정은 배정 불가 (기관형 unavailable, 1사1교 기존 라벨)', () => {
    for (const [isCompanySchool, expected] of [
      [false, 'unavailable'],
      [true, 'no_assignable_schedule'],
    ] as const) {
      const rows = build({ memberId: '190102', isCompanySchool, maxAssignableInstructors: 1 })
      expect(rows.map(r => r.schoolId).sort()).toEqual(['1695004', '1695006'])
      expect(rows.every(r => r.assignmentStatus === expected)).toBe(true)
    }
  })

  it('최대 배정 수 값이 없으면 다른 강사 배정 일정은 waiting', () => {
    const rows = build({ memberId: '190102', maxAssignableInstructors: null })
    expect(rows.map(r => r.schoolId).sort()).toEqual(['1695004', '1695006'])
    expect(rows.every(r => r.assignmentStatus === 'waiting')).toBe(true)
  })

  it('최대 배정 수는 서로 다른 강사 수로 센다 (2명 배정 + 최대 2 → 배정 불가, 최대 3 → waiting)', () => {
    const twoAssigned = [assignment(1, 190076, 1691529, 187447), assignment(2, 190200, 1691529, 187447)]
    const input = { memberId: '190102', schoolRows: [schoolRows[1]!], assignments: twoAssigned }
    expect(build({ ...input, maxAssignableInstructors: 2 })[0]?.assignmentStatus).toBe('unavailable')
    expect(build({ ...input, maxAssignableInstructors: 3 })[0]?.assignmentStatus).toBe('waiting')
  })

  it('기관형: 신청 기관 + 일정별 행 — 다 찬 일정만 배정 불가', () => {
    const rows = build({
      memberId: '190102',
      maxAssignableInstructors: 1,
      schoolRows: [twoScheduleSchool],
      assignments: [assignment(1, 190076, 1691529, 187447)],
    })
    expect(rows).toHaveLength(2)
    expect(rows.every(r => r.schoolId === '1695004' && r.sessions?.length === 1)).toBe(true)
    const statusById = Object.fromEntries(rows.map(r => [r.resolvedScheduleId, r.assignmentStatus]))
    expect(statusById).toEqual({ 187447: 'unavailable', 187448: 'waiting' })
    expect(new Set(rows.map(r => r.id)).size).toBe(2)
  })

  it('C: 이 강사 배정이 취소된 일정은 배정 취소(assignment_cancelled)로 노출', () => {
    const rows = build({
      memberId: '190102',
      schoolRows: [twoScheduleSchool],
      assignments: [assignment(1, 190102, 1691529, 187447, 'CANCELLED')],
    })
    const statusById = Object.fromEntries(rows.map(r => [r.resolvedScheduleId, r.assignmentStatus]))
    expect(statusById).toEqual({ 187447: 'assignment_cancelled', 187448: 'waiting' })
  })

  it('C: 취소 후 같은 일정에 재배정되면 대기 목록에서 제외', () => {
    const rows = build({
      memberId: '190102',
      schoolRows: [twoScheduleSchool],
      assignments: [
        assignment(1, 190102, 1691529, 187447, 'CANCELED'),
        assignment(2, 190102, 1691529, 187447),
      ],
    })
    expect(rows.map(r => [r.resolvedScheduleId, r.assignmentStatus])).toEqual([[187448, 'unavailable']])
  })

  it('D: 배정된 일정만 제외하고 같은 기관 다른 일정은 배정 불가, 다른 기관은 영향 없음', () => {
    const rows = build({
      memberId: '190102',
      schoolRows: [twoScheduleSchool, schoolRows[0]!],
      assignments: [assignment(1, 190102, 1691529, 187447)],
    })
    const statusById = Object.fromEntries(rows.map(r => [r.resolvedScheduleId, r.assignmentStatus]))
    expect(statusById).toEqual({ 187448: 'unavailable', 187446: 'waiting' })
  })

  it('1사1교는 기존 그대로 — 취소 이력 미표시, 배정 기관 전체 제외', () => {
    const cancelledRows = build({
      memberId: '190102',
      isCompanySchool: true,
      schoolRows: [twoScheduleSchool],
      assignments: [assignment(1, 190102, 1691529, 187447, 'CANCELLED')],
    })
    expect(cancelledRows.map(r => r.assignmentStatus)).toEqual(['waiting', 'waiting'])
    const assignedRows = build({
      memberId: '190102',
      isCompanySchool: true,
      schoolRows: [twoScheduleSchool],
      assignments: [assignment(1, 190102, 1691529, 187447)],
    })
    expect(assignedRows).toEqual([])
  })

  it('1사1교: 다 찬 날짜 행만 배정 불가', () => {
    const rows = build({
      memberId: '190102',
      isCompanySchool: true,
      maxAssignableInstructors: 1,
      schoolRows: [
        school('1695004', '1691529', 'QA 제휴학교', [
          session(187447, '2026.11.05'),
          session(187448, '2026.11.06', { round: 2, dayOfWeek: '금' }),
        ]),
      ],
      assignments: [assignment(1, 190076, 1691529, 187447)],
    })
    const statusById = Object.fromEntries(rows.map(r => [r.resolvedScheduleId, r.assignmentStatus]))
    expect(statusById).toEqual({ 187447: 'no_assignable_schedule', 187448: 'waiting' })
  })

  it('취소된 배정은 최대 배정 수에 포함하지 않는다', () => {
    const rows = build({
      memberId: '190102',
      maxAssignableInstructors: 1,
      schoolRows: [schoolRows[1]!],
      assignments: [assignment(1, 190076, 1691529, 187447, 'CANCELLED')],
    })
    expect(rows.map(r => r.schoolId)).toEqual(['1695004'])
    expect(rows[0]?.assignmentStatus).toBe('waiting')
  })

  it('uses confirmed sessions, not preferred schedules', () => {
    const rows = build({ memberId: '190102', schoolRows: [schoolRows[0]!], assignments: [] })
    expect(rows[0]?.sessions?.map(s => s.resolvedScheduleId)).toEqual([187446])
  })

  it('excludes schools whose schedule is unresolved', () => {
    const rows = build({
      memberId: '190102',
      schoolRows: [school('x', '9', '미확정학교', [session(null, '2026.11.07')])],
      assignments: [],
    })
    expect(rows).toEqual([])
  })
})

describe('buildParticipatingInstructorWaitingScheduleRowsFromBoard (개인형)', () => {
  const schedules: ProgramScheduleResponse[] = [
    { id: 301, locationName: '서울 강의장', scheduleStatus: 'ACTIVE' },
    { id: 302, address: '부산시 해운대구', scheduleStatus: 'ACTIVE' },
    { id: 303, scheduleStatus: 'ACTIVE' },
  ]
  const scheduleLabelById = new Map([
    ['301', { date: '2026.11.03', time: '10:00 ~ 12:00', session: '1차시' }],
    ['302', { date: '2026.11.04' }],
  ])
  function individualAssignment(
    assignmentId: number,
    memberId: number,
    scheduleId: number,
    status = 'ASSIGNED'
  ): InstructorAssignmentListItemEnriched {
    return {
      assignmentId,
      programId: 1,
      scheduleId,
      organizationApplicationId: null,
      instructorMemberId: memberId,
      assignmentStatus: status,
    } as unknown as InstructorAssignmentListItemEnriched
  }
  function buildIndividual(input: {
    memberId: string
    assignments: InstructorAssignmentListItemEnriched[]
    maxAssignableInstructors?: number | null
  }) {
    return buildParticipatingInstructorWaitingScheduleRowsFromBoard({
      instructor: instructor(input.memberId),
      schedules,
      scheduleLabelById,
      assignments: input.assignments,
      instructorMemberId: input.memberId,
      maxAssignableInstructors: input.maxAssignableInstructors,
    })
  }

  it('본인 배정 일정은 제외하고 서버 순서·역순 번호를 유지한다', () => {
    const rows = buildIndividual({ memberId: '10', assignments: [individualAssignment(1, 10, 302)] })
    expect(rows.map(r => r.resolvedScheduleId)).toEqual([301, 303])
    expect(rows.map(r => r.no)).toEqual([2, 1])
    expect(rows[0]).toMatchObject({
      lectureLocation: '서울 강의장',
      scheduleLabel: '2026.11.03 | 10:00 ~ 12:00 | 1차시',
      assignmentStatus: 'waiting',
    })
    expect(rows[1]).toMatchObject({ lectureLocation: '-', scheduleLabel: '-' })
    expect(rows.every(r => r.organizationApplicationId === undefined)).toBe(true)
  })

  it('다른 강사가 배정된 일정도 노출한다 (cap 미도달 → waiting)', () => {
    const rows = buildIndividual({
      memberId: '10',
      assignments: [individualAssignment(1, 20, 301)],
      maxAssignableInstructors: 2,
    })
    expect(rows.map(r => r.resolvedScheduleId)).toEqual([301, 302, 303])
    expect(rows.every(r => r.assignmentStatus === 'waiting')).toBe(true)
  })

  it('일정별 서로 다른 강사 수가 cap 이상이면 배정 불가(unavailable)', () => {
    const rows = buildIndividual({
      memberId: '10',
      assignments: [
        individualAssignment(1, 20, 301),
        individualAssignment(2, 30, 301),
        individualAssignment(3, 20, 302),
      ],
      maxAssignableInstructors: 2,
    })
    const statusById = Object.fromEntries(rows.map(r => [r.resolvedScheduleId, r.assignmentStatus]))
    expect(statusById).toEqual({ 301: 'unavailable', 302: 'waiting', 303: 'waiting' })
  })

  it('cap 값이 없으면 제한 없이 waiting', () => {
    for (const max of [null, undefined, 0]) {
      const rows = buildIndividual({
        memberId: '10',
        assignments: [individualAssignment(1, 20, 301), individualAssignment(2, 30, 301)],
        maxAssignableInstructors: max,
      })
      expect(rows.every(r => r.assignmentStatus === 'waiting')).toBe(true)
    }
  })

  it('취소된 배정은 본인 제외·cap 계산에 포함하지 않고, 본인 취소 일정은 배정 취소로 노출', () => {
    const rows = buildIndividual({
      memberId: '10',
      assignments: [
        individualAssignment(1, 10, 302, 'CANCELLED'),
        individualAssignment(2, 20, 301, 'CANCELED'),
      ],
      maxAssignableInstructors: 1,
    })
    const statusById = Object.fromEntries(rows.map(r => [r.resolvedScheduleId, r.assignmentStatus]))
    expect(statusById).toEqual({ 301: 'waiting', 302: 'assignment_cancelled', 303: 'waiting' })
  })

  it('본인 취소 후 재배정된 일정은 제외', () => {
    const rows = buildIndividual({
      memberId: '10',
      assignments: [individualAssignment(1, 10, 302, 'CANCELLED'), individualAssignment(2, 10, 302)],
    })
    expect(rows.map(r => r.resolvedScheduleId)).toEqual([301, 303])
  })
})

describe('createSessionInstructorCapChecker (배정 안내 창 일정 선택 차단)', () => {
  const target = school('1695004', '1691529', 'QA 제휴학교', [
    session(187447, '2026.11.05'),
    session(187448, '2026.11.06', { round: 2 }),
  ])

  it('같은 기관 신청 + 일정의 강사 수가 cap 이상인 회차만 true', () => {
    const isAtCap = createSessionInstructorCapChecker({
      assignments: [assignment(1, 190076, 1691529, 187447), assignment(2, 190200, 1691529, 187447)],
      maxAssignableInstructors: 2,
    })
    expect(isAtCap(target, target.sessions![0]!)).toBe(true)
    expect(isAtCap(target, target.sessions![1]!)).toBe(false)
  })

  it('다른 기관 신청의 같은 일정 배정은 세지 않는다', () => {
    const isAtCap = createSessionInstructorCapChecker({
      assignments: [assignment(1, 190076, 9999, 187447)],
      maxAssignableInstructors: 1,
    })
    expect(isAtCap(target, target.sessions![0]!)).toBe(false)
  })

  it('cap 값이 없으면 항상 false, 취소 배정은 제외', () => {
    const full = [assignment(1, 190076, 1691529, 187447)]
    expect(
      createSessionInstructorCapChecker({ assignments: full, maxAssignableInstructors: null })(
        target,
        target.sessions![0]!
      )
    ).toBe(false)
    expect(
      createSessionInstructorCapChecker({
        assignments: [assignment(1, 190076, 1691529, 187447, 'CANCELLED')],
        maxAssignableInstructors: 1,
      })(target, target.sessions![0]!)
    ).toBe(false)
  })
})

describe('mergeInstitutionWaitingRowsBySchool (기관형 배정 확정)', () => {
  it('같은 기관 일정 행을 기관 1건으로 합치고 회차를 순서대로 모은다', () => {
    const rows = build({
      memberId: '190102',
      schoolRows: [twoScheduleSchool, schoolRows[0]!],
      assignments: [],
    })
    const merged = mergeInstitutionWaitingRowsBySchool(rows)
    expect(merged).toHaveLength(2)
    const qa = merged.find(r => r.schoolId === '1695004')
    expect(qa?.sessions?.map(s => s.resolvedScheduleId).sort()).toEqual([187447, 187448])
    expect(qa?.organizationApplicationId).toBe('1691529')
    expect(rows.find(r => r.schoolId === '1695004')?.sessions).toHaveLength(1)
  })
})

describe('buildParticipatingInstructorAssignedScheduleRowsFromBoard (개인형)', () => {
  it('교육 시작 시각 오름차순으로 정렬하고 시간·교육 진행 장소·거리를 표시한다', () => {
    const rows = buildParticipatingInstructorAssignedScheduleRowsFromBoard({
      instructorMemberId: '1695076',
      schoolRows: [school('org-1', '9', '기관명 쓰지 않음', [session(302, '2026.11.05')])],
      scheduleLabelById: new Map([
        ['301', { date: '2026.11.05(수)', time: '10:00 ~ 12:00', session: '1차시' }],
        ['302', { date: '2026.11.06(목)', time: '14:00 ~ 16:00', session: '2차시' }],
      ]),
      schedules: [
        {
          id: 302,
          startAt: '2026-11-06T05:00:00Z',
          sessionNo: 2,
          locationName: '일정별 장소 B',
        },
        {
          id: 301,
          startAt: '2026-11-05T01:00:00Z',
          sessionNo: 1,
          locationName: '공통 장소 A',
        },
      ],
      assignments: [
        {
          assignmentId: 2,
          programId: 1,
          scheduleId: 302,
          instructorMemberId: 1695076,
          assignmentStatus: 'ASSIGNED',
          organizationName: '기관명',
          lectureLocationName: '일정별 장소 B',
          distanceKm: 12.3,
        } as InstructorAssignmentListItemEnriched,
        {
          assignmentId: 1,
          programId: 1,
          scheduleId: 301,
          instructorMemberId: 1695076,
          assignmentStatus: 'ASSIGNED',
          organizationName: '기관명',
          lecturePlaceAddress: '서울 강의장 주소',
          distanceKm: 3,
          longDistance: true,
        } as InstructorAssignmentListItemEnriched,
      ],
    })
    expect(rows.map(r => r.no)).toEqual([1, 2])
    expect(rows.map(r => r.scheduleId)).toEqual(['301', '302'])
    expect(rows[0]?.scheduleLabel).toBe('2026.11.05(수) | 10:00 ~ 12:00 | 1차시')
    expect(rows[1]?.scheduleLabel).toBe('2026.11.06(목) | 14:00 ~ 16:00 | 2차시')
    expect(rows[0]?.lectureLocation).toBe('서울 강의장 주소')
    expect(rows[1]?.lectureLocation).toBe('일정별 장소 B')
    expect(rows[0]?.distanceFromHome).toBe('3km (장거리)')
    expect(rows[1]?.distanceFromHome).toBe('12.3km')
  })

  it('assignment 출강지가 없으면 같은 보드 일정 locationName/address를 쓰고 기관명은 쓰지 않는다', () => {
    const rows = buildParticipatingInstructorAssignedScheduleRowsFromBoard({
      instructorMemberId: '1',
      schoolRows: [school('org-1', '9', '서울초등학교', [session(10, '2026.11.05')])],
      scheduleLabelById: new Map(),
      schedules: [{ id: 10, locationName: '교육 진행 장소', address: '도로명' }],
      assignments: [
        {
          assignmentId: 9,
          programId: 1,
          scheduleId: 10,
          instructorMemberId: 1,
          assignmentStatus: 'ASSIGNED',
          organizationName: '서울초등학교',
        } as InstructorAssignmentListItemEnriched,
      ],
    })
    expect(rows[0]?.lectureLocation).toBe('교육 진행 장소')
  })
})
