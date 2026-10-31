/**
 * 사전교육(PRE_EDUCATION) 일정 행 FE 계약 — 대시보드 역할 필드·출석·승인 id·배정 후보.
 * 행: educationSlotKey `general-pre-education:1`, scheduleRole PRE_EDUCATION, sessionNo null.
 */
import { describe, expect, it } from 'vitest'
import { buildProgressAttendanceSessionsFromRemote } from '@/features/program/general/api/adapters/progress-attendance-adapters'
import {
  buildIndividualApprovalSchedulePlan,
  defaultIndividualApprovalScheduleIds,
  validateIndividualApprovalScheduleSelection,
} from '@/features/program/general/lib/individual-approval-education-scope'
import { buildIndividualVolunteerAssignmentRowsFromEducationScope } from '@/features/program/general/lib/participating-individual-volunteer-assignment'
import { buildParticipatingInstructorWaitingScheduleRowsFromBoard } from '@/features/program/general/lib/build-participating-instructor-assignment-rows'
import { isProgramSchedulePreEducation } from '@/features/program/shared/lib/program-schedule-canonical'
import type { DashboardProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse'
import type { ProgramEducationSlotResponse } from '@/shared/api/generated/dashboard/schemas/programEducationSlotResponse'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type { Program } from '@/types/domain'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'

const PRE_EDUCATION_DASHBOARD_ROW = {
  scheduleId: 7000,
  sessionNo: null,
  scheduleName: '사전 교육',
  scheduleRole: 'PRE_EDUCATION',
  educationSlotKey: 'general-pre-education:1',
  scheduleStatus: 'SCHEDULED',
  startAt: '2026-11-02T10:00:00+09:00',
  endAt: '2026-11-02T11:00:00+09:00',
} as unknown as DashboardProgramScheduleResponse

function mainDashboardRow(
  scheduleId: number,
  sessionNo: number | null,
  extra: Record<string, unknown> = {}
): DashboardProgramScheduleResponse {
  return {
    scheduleId,
    sessionNo,
    scheduleStatus: 'SCHEDULED',
    startAt: `2026-11-1${sessionNo ?? 0}T10:00:00+09:00`,
    endAt: `2026-11-1${sessionNo ?? 0}T12:00:00+09:00`,
    ...extra,
  } as unknown as DashboardProgramScheduleResponse
}

describe('isProgramSchedulePreEducation', () => {
  it('PRE_EDUCATION만 참, null 역할(레거시)은 사전교육이 아니다', () => {
    expect(isProgramSchedulePreEducation({ scheduleRole: 'PRE_EDUCATION' })).toBe(true)
    expect(isProgramSchedulePreEducation({ educationSlotKey: 'general-pre-education:1' })).toBe(
      true
    )
    expect(isProgramSchedulePreEducation({ scheduleRole: 'EDUCATION' })).toBe(false)
    expect(isProgramSchedulePreEducation({ scheduleRole: null })).toBe(false)
    expect(isProgramSchedulePreEducation({})).toBe(false)
  })
})

describe('출석 — 대시보드 scheduleRole·educationSlotKey 매핑', () => {
  it('값이 있으면 그대로, 없으면 null (EDUCATION으로 채우지 않음)', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        mainDashboardRow(9001, 1, {
          scheduleRole: 'EDUCATION',
          educationSlotKey: 'general-common-line:1',
        }),
        mainDashboardRow(9002, 2),
      ],
      participants: [],
      attendancesByScheduleId: {},
    })
    expect(sessions[0]).toMatchObject({
      scheduleRole: 'EDUCATION',
      educationSlotKey: 'general-common-line:1',
    })
    expect(sessions[1]?.scheduleRole).toBeNull()
    expect(sessions[1]?.educationSlotKey).toBeNull()
  })

  it('sessionNo=null 사전교육 행 — 서버 순서 유지, 「일시 ㅣ 사전교육」, 본교육 회차·필터 중복 없음', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [
        PRE_EDUCATION_DASHBOARD_ROW,
        mainDashboardRow(9001, 1, { scheduleRole: 'EDUCATION' }),
        mainDashboardRow(9002, 2, { scheduleRole: 'EDUCATION' }),
      ],
      participants: [],
      attendancesByScheduleId: {},
    })
    expect(sessions.map(s => s.id)).toEqual(['7000', '9001', '9002'])
    expect(new Set(sessions.map(s => s.filterValue)).size).toBe(3)
    expect(sessions[0]).toMatchObject({
      scheduleRole: 'PRE_EDUCATION',
      educationSlotKey: 'general-pre-education:1',
    })
    expect(sessions[0]?.headerTitle).toMatch(/ ㅣ 사전교육$/u)
    expect(sessions[0]?.headerTitle).not.toContain('회차')
    expect(sessions[0]?.filterLabel).toMatch(/ ㅣ 사전교육$/u)
    expect(sessions[1]?.headerTitle).toContain('1회차')
    expect(sessions[2]?.headerTitle).toContain('2회차')
  })

  it('본교육 sessionNo가 없을 때 폴백 회차는 사전교육 행을 세지 않는다', () => {
    const sessions = buildProgressAttendanceSessionsFromRemote({
      schedules: [PRE_EDUCATION_DASHBOARD_ROW, mainDashboardRow(9001, null)],
      participants: [],
      attendancesByScheduleId: {},
    })
    expect(sessions[1]?.round).toBe(1)
    expect(sessions[1]?.headerTitle).toContain('1회차')
  })
})

function slot(
  scheduleId: number,
  scheduleRole: string,
  sessionNo: number | null
): ProgramEducationSlotResponse {
  return {
    scheduleId,
    scheduleRole,
    sessionNo,
    scheduleOrigin: 'PROGRAM_DEFINED',
    scheduleStatus: 'ACTIVE',
    educationSlotKey:
      scheduleRole === 'PRE_EDUCATION' ? 'general-pre-education:1' : `general-common-line:${sessionNo}`,
    startAt: '2026-11-10T10:00:00+09:00',
    endAt: '2026-11-10T12:00:00+09:00',
  } as unknown as ProgramEducationSlotResponse
}

describe('승인 confirmedScheduleIds — 본교육 id만', () => {
  const slots = [slot(7000, 'PRE_EDUCATION', null), slot(9001, 'EDUCATION', 1), slot(9002, 'EDUCATION', 2)]

  it('일정형 복수(전체 배정)는 PRE_EDUCATION을 잠금 id에 넣지 않는다', () => {
    const plan = buildIndividualApprovalSchedulePlan({
      program: { educationStructure: 'SCHEDULE', sessionRound: 'MULTI', educationScheduleMode: 'FIXED_DATE' },
      slots,
      slotsResolved: true,
    })
    expect(plan.lockedScheduleIds).toEqual([9001, 9002])
    expect(plan.options.map(o => o.scheduleId)).toEqual([9001, 9002])
    const ids = defaultIndividualApprovalScheduleIds(plan)
    const selection = validateIndividualApprovalScheduleSelection(plan, ids)
    expect(selection).toEqual({ ok: true, confirmedScheduleIds: [9001, 9002] })
  })

  it('희망 일정이 사전교육 id여도 선택 불가 — 사전교육 선택을 요구하지 않는다', () => {
    const plan = buildIndividualApprovalSchedulePlan({
      program: { educationStructure: 'SCHEDULE', sessionRound: 'SINGLE', educationScheduleMode: 'FIXED_DATE' },
      preferred: [
        { scheduleId: 7000, startAt: null, endAt: null, label: null },
        { scheduleId: 9001, startAt: null, endAt: null, label: null },
      ] as PreferredEducationSchedule[],
      slots,
      slotsResolved: true,
    })
    expect(plan.blockedReason).toBeNull()
    expect(plan.options.filter(o => o.selectable).map(o => o.scheduleId)).toEqual([9001])
    expect(defaultIndividualApprovalScheduleIds(plan)).toEqual([9001])
    expect(validateIndividualApprovalScheduleSelection(plan, [7000]).ok).toBe(false)
  })
})

describe('배정 후보 — PRE_EDUCATION 제외', () => {
  it('봉사 배정 대기에 사전교육 일정이 없다 (배정된 사전교육은 배정 목록에 그대로)', () => {
    const program = { id: '186486', generalProgramAudience: 'individual' } as Program
    const schedules = [PRE_EDUCATION_DASHBOARD_ROW, mainDashboardRow(9001, 1), mainDashboardRow(9002, 2)]
    const { waiting } = buildIndividualVolunteerAssignmentRowsFromEducationScope({
      program,
      assignedScheduleIds: [],
      schedules,
    })
    expect(waiting.map(row => row.scheduleId)).toEqual([9001, 9002])

    const assignedView = buildIndividualVolunteerAssignmentRowsFromEducationScope({
      program,
      assignedScheduleIds: [7000],
      schedules,
    })
    expect(assignedView.assigned.map(row => row.scheduleId)).toEqual([7000])
    expect(assignedView.waiting.map(row => row.scheduleId)).toEqual([9001, 9002])
  })

  it('개인형 강사 배정 대기에 사전교육 일정이 없다 (역할 null 레거시는 유지)', () => {
    const schedules = [
      { id: 7000, scheduleRole: 'PRE_EDUCATION', sessionNo: null, scheduleStatus: 'ACTIVE' },
      { id: 9001, scheduleRole: 'EDUCATION', sessionNo: 1, scheduleStatus: 'ACTIVE' },
      { id: 9002, sessionNo: 2, scheduleStatus: 'ACTIVE' },
    ] as unknown as ProgramScheduleResponse[]
    const rows = buildParticipatingInstructorWaitingScheduleRowsFromBoard({
      instructor: { id: 'i-10', instructorMemberId: '10' } as unknown as ParticipatingInstructorRow,
      schedules,
      scheduleLabelById: new Map(),
      assignments: [],
      instructorMemberId: '10',
    })
    expect(rows.map(row => row.resolvedScheduleId)).toEqual([9001, 9002])
  })
})
