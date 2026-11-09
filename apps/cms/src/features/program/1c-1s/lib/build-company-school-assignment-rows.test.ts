import { describe, expect, it } from 'vitest'
import { asOpenApiFixture } from '@/shared/test/openapi-fixture-cast'
import type { InstructorApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationListItemResponse'
import {
  buildCompanySchoolAssignedInstructorRows,
  buildCompanySchoolWaitingInstructorRows,
} from './build-company-school-assignment-rows'

describe('buildCompanySchoolWaitingInstructorRows', () => {
  const hopeSession = {
    round: 1,
    date: '2026.11.20',
    dayOfWeek: '금',
    duration: '3차시',
    format: '-',
    classNum: '1지망',
    timeRange: '09:00 ~ 10:00',
    status: 'pending' as const,
    resolvedScheduleId: 9001,
  }
  const generalApplication = asOpenApiFixture<InstructorApplicationListItemResponse>({
    id: 1,
    instructorMemberId: 170024,
    instructorName: '한서연',
    applicationStatus: 'APPROVED',
    distanceKm: 77.7,
    longDistance: false,
    organizationDistances: [
      { organizationId: 11, organizationApplicationId: 501, distanceKm: 12.3, longDistance: false },
      { organizationId: 12, organizationApplicationId: 502, distanceKm: 231.4, longDistance: true },
    ],
    preferredOrganizations: [],
    availableScheduleIds: [],
    availableActions: [],
  })

  it('일반 기관형은 이 기관 신청까지의 거리만 쓴다 (신청 단위 거리 대체 금지)', () => {
    const base = {
      schoolName: '계남중학교',
      sessions: [hopeSession],
      approvedInstructors: [generalApplication],
      assignedInstructorMemberIds: new Set<string>(),
    }
    expect(
      buildCompanySchoolWaitingInstructorRows({ ...base, organizationApplicationId: '501' })[0]
        ?.distanceToSchool
    ).toBe('12.3km')
    expect(
      buildCompanySchoolWaitingInstructorRows({ ...base, organizationApplicationId: '502' })[0]
        ?.distanceToSchool
    ).toBe('231.4km (장거리)')
    expect(
      buildCompanySchoolWaitingInstructorRows({ ...base, organizationApplicationId: '999' })[0]
        ?.distanceToSchool
    ).toBeUndefined()
    // 1사1교(기관 신청 id 미전달)는 기존 신청 단위 거리
    expect(buildCompanySchoolWaitingInstructorRows(base)[0]?.distanceToSchool).toBe('77.7km')
  })

  it('희망일(session)이 없으면 행을 만들지 않는다 (가짜 일정 금지)', () => {
    const rows = buildCompanySchoolWaitingInstructorRows({
      schoolName: '인천가온고등학교',
      sessions: [],
      approvedInstructors: [
        asOpenApiFixture<InstructorApplicationListItemResponse>({
          id: 1,
          instructorMemberId: 170024,
          instructorName: '한서연',
          applicationStatus: 'APPROVED',
          preferredOrganizations: [],
          availableScheduleIds: [],
          availableActions: [],
        }),
      ],
      assignedInstructorMemberIds: new Set(),
    })
    expect(rows).toEqual([])
  })

  it('점유일에 걸리면 unavailable', () => {
    const occupied = new Map<string, Set<string>>([['170024', new Set(['2026-09-12'])]])
    const rows = buildCompanySchoolWaitingInstructorRows({
      schoolName: '인천가온고등학교',
      sessions: [
        {
          round: 1,
          date: '2026.09.12',
          dayOfWeek: '금',
          duration: '1차시',
          format: '단독',
          classNum: '1교시',
          timeRange: '1교시',
          status: 'pending',
          requestedScheduleId: 12345,
          resolvedScheduleId: 9001,
        },
      ],
      approvedInstructors: [
        asOpenApiFixture<InstructorApplicationListItemResponse>({
          id: 1,
          instructorMemberId: 170024,
          instructorName: '한서연',
          applicationStatus: 'APPROVED',
          preferredOrganizations: [],
          availableScheduleIds: [],
          availableActions: [],
        }),
      ],
      assignedInstructorMemberIds: new Set(),
      occupiedLectureDatesByInstructorId: occupied,
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.assignmentStatus).toBe('unavailable')
    expect(rows[0]?.requestedScheduleId).toBe(12345)
  })

  it('승인 강사 목록의 homeAddress·distanceKm를 배정 대기 행에 매핑한다', () => {
    const rows = buildCompanySchoolWaitingInstructorRows({
      schoolName: '부명초등학교',
      sessions: [
        {
          round: 1,
          date: '2024.10.01',
          dayOfWeek: '화',
          duration: '1차시',
          format: '단독',
          classNum: '1교시',
          timeRange: '15:00 ~ 17:00',
          status: 'pending',
          requestedScheduleId: 1,
          resolvedScheduleId: 2,
        },
      ],
      approvedInstructors: [
        asOpenApiFixture<InstructorApplicationListItemResponse>({
          id: 1694662,
          instructorMemberId: 190001,
          instructorName: '이현아',
          applicationStatus: 'APPROVED',
          homeAddress: '서울특별시 강남구 테헤란로 1',
          preferredOrganizations: [],
          availableScheduleIds: [],
          availableActions: [],
          distanceKm: 42.3,
          longDistance: false,
        } as InstructorApplicationListItemResponse & {
          distanceKm?: number
          longDistance?: boolean
        }),
      ],
      assignedInstructorMemberIds: new Set(),
    })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.homeAddress).toBe('서울특별시 강남구 테헤란로 1')
    expect(rows[0]?.distanceToSchool).toBe('42.3km')
  })

  it('resolvedScheduleId null이면 일정 미생성으로 unavailable', () => {
    const rows = buildCompanySchoolWaitingInstructorRows({
      schoolName: '인천가온고등학교',
      sessions: [
        {
          round: 1,
          date: '2026.09.12',
          dayOfWeek: '금',
          duration: '1차시',
          format: '단독',
          classNum: '1교시',
          timeRange: '1교시',
          status: 'pending',
          requestedScheduleId: 99,
          resolvedScheduleId: null,
          scheduleUnresolved: true,
        },
      ],
      approvedInstructors: [
        asOpenApiFixture<InstructorApplicationListItemResponse>({
          id: 1,
          instructorMemberId: 170024,
          instructorName: '한서연',
          applicationStatus: 'APPROVED',
          preferredOrganizations: [],
          availableScheduleIds: [],
          availableActions: [],
        }),
      ],
      assignedInstructorMemberIds: new Set(),
    })
    expect(rows[0]?.assignmentStatus).toBe('unavailable')
    expect(rows[0]?.scheduleUnresolved).toBe(true)
    expect(rows[0]?.hopeScheduleLine).toContain('일정 미생성')
  })
})

describe('buildCompanySchoolAssignedInstructorRows', () => {
  it('배정 응답의 organizationId를 그대로 전달한다', () => {
    const rows = buildCompanySchoolAssignedInstructorRows({
      organizationApplicationId: '9001',
      instructorNameByMemberId: new Map([['170024', '한서연']]),
      scheduleLabelById: new Map(),
      assignments: [
        {
          assignmentId: 1,
          organizationApplicationId: 9001,
          organizationId: 8801,
          organizationName: '인천가온고등학교',
          instructorMemberId: 170024,
          assignmentStatus: 'ASSIGNED',
          scheduleLead: true,
        },
        {
          assignmentId: 2,
          organizationApplicationId: 9001,
          organizationId: undefined,
          instructorMemberId: 170025,
          assignmentStatus: 'ASSIGNED',
        },
      ],
    })

    expect(rows).toHaveLength(2)
    expect(rows[0]?.organizationId).toBe(8801)
    expect(rows[0]?.organizationName).toBe('인천가온고등학교')
    expect(rows[1]?.organizationId).toBeNull()
  })
})

describe('buildCompanySchoolAssignedInstructorRows — 배정 취소(CS02)', () => {
  const assignments = [
    { assignmentId: 1, organizationApplicationId: 9001, instructorMemberId: 1, assignmentStatus: 'ASSIGNED' },
    { assignmentId: 2, organizationApplicationId: 9001, instructorMemberId: 2, assignmentStatus: 'CANCELLED' },
  ]
  const base = {
    organizationApplicationId: '9001',
    instructorNameByMemberId: new Map<string, string>(),
    scheduleLabelById: new Map(),
    assignments,
  }

  it('기본은 취소된 배정을 제외한다', () => {
    const rows = buildCompanySchoolAssignedInstructorRows(base)
    expect(rows.map(r => [r.assignmentId, r.assignmentCancelled])).toEqual([['1', false]])
  })

  it('includeCancelled면 취소 배정을 「배정 취소」 행으로 포함한다', () => {
    const rows = buildCompanySchoolAssignedInstructorRows({ ...base, includeCancelled: true })
    expect(rows.map(r => [r.assignmentId, r.assignmentCancelled])).toEqual([
      ['1', false],
      ['2', true],
    ])
  })
})

describe('buildCompanySchoolAssignedInstructorRows — 배정 단위 정산 상태', () => {
  it('서버 settlementStatus를 그대로 쓰고, 없거나 모르는 값은 해당 없음', () => {
    const rows = buildCompanySchoolAssignedInstructorRows({
      organizationApplicationId: '9001',
      instructorNameByMemberId: new Map<string, string>(),
      scheduleLabelById: new Map(),
      assignments: [
        { assignmentId: 1, organizationApplicationId: 9001, settlementStatus: 'payment_statement_reapplication' },
        { assignmentId: 2, organizationApplicationId: 9001, settlementStatus: 'ACCOUNT_PAID' },
        { assignmentId: 3, organizationApplicationId: 9001 },
        { assignmentId: 4, organizationApplicationId: 9001, settlementStatus: 'WEIRD' },
      ],
    })
    expect(rows.map(r => r.settlementStatus)).toEqual([
      'payment_statement_reapplication',
      'account_paid',
      'none',
      'none',
    ])
  })
})
