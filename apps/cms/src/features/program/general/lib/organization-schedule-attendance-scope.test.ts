import { describe, expect, it } from 'vitest'
import type { SlotResponse } from '@/shared/api/generated/dashboard/schemas/slotResponse'
import type { SchoolDetailAttendanceStudentRow } from '@/features/program/general/model/school-detail-types'
import {
  evaluateOrganizationAttendanceScopeReadiness,
  formatOrganizationAttendanceScopeBlockedDescription,
  isGeneralOrganizationAttendanceScopeRequiredError,
  resolveOrganizationAttendanceScopeErrorMessage,
} from './organization-schedule-attendance-scope'

function student(
  partial: Partial<SchoolDetailAttendanceStudentRow> & Pick<SchoolDetailAttendanceStudentRow, 'id'>
): SchoolDetailAttendanceStudentRow {
  return {
    ...partial,
    id: partial.id,
    no: partial.no ?? 1,
    name: partial.name ?? '학생',
    gradeClass: partial.gradeClass ?? '1반',
    participantId: partial.participantId ?? 1,
    status: partial.status ?? 'present',
    attendanceRecorded: partial.attendanceRecorded ?? partial.status !== 'unrecorded',
  }
}

type LegacySlotFixture = SlotResponse & {
  grade?: string | null
  className?: string | null
}

function slot(partial: LegacySlotFixture): SlotResponse {
  return partial as SlotResponse
}

describe('evaluateOrganizationAttendanceScopeReadiness', () => {
  const baseInput = {
    programId: '186092',
    organizationApplicationId: '1691243',
    scheduleId: 186674,
    educationGrade: '초5',
    rosterStudents: [student({ id: 's1', gradeClass: '1반', participantId: 10 })],
    assignmentSlots: [
      slot({
        scheduleId: 186674,
        organizationApplicationId: 1691243,
        programId: 186092,
        grade: '초5',
        className: '1반',
        active: true,
        assignmentStatus: 'TEMP_ASSIGNED',
      }),
    ],
  }

  it('allows save when every roster student has a matching assignment', () => {
    const result = evaluateOrganizationAttendanceScopeReadiness(baseInput)
    expect(result.ready).toBe(true)
    expect(result.unassignedStudentCount).toBe(0)
  })

  it('does not block other classes — assignment is schedule-level, not grade/class-level', () => {
    const result = evaluateOrganizationAttendanceScopeReadiness({
      ...baseInput,
      rosterStudents: [
        student({ id: 's1', gradeClass: '1반', participantId: 10 }),
        student({ id: 's2', gradeClass: '2반', participantId: 11 }),
      ],
    })
    expect(result.ready).toBe(true)
    expect(result.unassignedStudentCount).toBe(0)
  })

  it('allows save when student and assignment grade/class are null or empty (186408 regression)', () => {
    const result = evaluateOrganizationAttendanceScopeReadiness({
      programId: '186408',
      organizationApplicationId: '1691524',
      scheduleId: 187394,
      rosterStudents: [
        student({ id: 's1', gradeClass: '', participantId: 1694983 }),
        student({ id: 's2', gradeClass: '', participantId: 1694984 }),
      ],
      assignmentSlots: [
        slot({
          scheduleId: 187394,
          organizationApplicationId: 1691524,
          programId: 186408,
          grade: null,
          className: null,
          active: true,
          assignmentStatus: 'TEMP_ASSIGNED',
        }),
      ],
    })
    expect(result.ready).toBe(true)
  })

  it('blocks when there is no assignment for the schedule at all', () => {
    const result = evaluateOrganizationAttendanceScopeReadiness({
      ...baseInput,
      assignmentSlots: [],
    })
    expect(result.ready).toBe(false)
    expect(result.missingStep).toBe('SCHEDULE_ASSIGNMENT')
    expect(result.unassignedStudentCount).toBe(1)
  })

  it('blocks when the assignment belongs to another organization application', () => {
    const result = evaluateOrganizationAttendanceScopeReadiness({
      ...baseInput,
      assignmentSlots: [
        slot({
          scheduleId: 186674,
          organizationApplicationId: 9999999,
          programId: 186092,
          active: true,
          assignmentStatus: 'CONFIRMED',
        }),
      ],
    })
    expect(result.ready).toBe(false)
  })

  it('blocks when resolved schedule id exists but assignment is on another round', () => {
    const result = evaluateOrganizationAttendanceScopeReadiness({
      ...baseInput,
      scheduleId: 186674,
      assignmentSlots: [
        slot({
          scheduleId: 999999,
          organizationApplicationId: 1691243,
          programId: 186092,
          grade: '초5',
          className: '1반',
          active: true,
          assignmentStatus: 'CONFIRMED',
        }),
      ],
    })
    expect(result.ready).toBe(false)
  })

  it('blocks when assignment is inactive', () => {
    const result = evaluateOrganizationAttendanceScopeReadiness({
      ...baseInput,
      assignmentSlots: [
        slot({
          scheduleId: 186674,
          organizationApplicationId: 1691243,
          programId: 186092,
          grade: '초5',
          className: '1반',
          active: false,
          assignmentStatus: 'TEMP_ASSIGNED',
        }),
      ],
    })
    expect(result.ready).toBe(false)
  })

  it('blocks when assignment status is cancelled', () => {
    const result = evaluateOrganizationAttendanceScopeReadiness({
      ...baseInput,
      assignmentSlots: [
        slot({
          scheduleId: 186674,
          organizationApplicationId: 1691243,
          programId: 186092,
          grade: '초5',
          className: '1반',
          active: true,
          assignmentStatus: 'CANCELLED',
        }),
      ],
    })
    expect(result.ready).toBe(false)
  })

  it('ignores legacy grade/class on the slot — mismatch does not block', () => {
    const result = evaluateOrganizationAttendanceScopeReadiness({
      ...baseInput,
      rosterStudents: [student({ id: 's1', gradeClass: '초51반', participantId: 10 })],
      assignmentSlots: [
        slot({
          scheduleId: 186674,
          organizationApplicationId: 1691243,
          programId: 186092,
          grade: '초5',
          className: '1반',
          active: true,
          assignmentStatus: 'CONFIRMED',
        }),
      ],
    })
    expect(result.ready).toBe(true)
  })

  it('allows all roster students when OSA slot is schedule-only (no grade/class)', () => {
    const result = evaluateOrganizationAttendanceScopeReadiness({
      ...baseInput,
      rosterStudents: [
        student({ id: 's1', gradeClass: '1반', participantId: 10 }),
        student({ id: 's2', gradeClass: '2반', participantId: 11 }),
      ],
      assignmentSlots: [
        slot({
          scheduleId: 186674,
          organizationApplicationId: 1691243,
          programId: 186092,
          grade: '미지정',
          className: '미지정',
          active: true,
          assignmentStatus: 'TEMP_ASSIGNED',
        }),
      ],
    })
    expect(result.ready).toBe(true)
  })

  it('treats assignment status case-insensitively', () => {
    const result = evaluateOrganizationAttendanceScopeReadiness({
      ...baseInput,
      assignmentSlots: [
        slot({
          scheduleId: 186674,
          organizationApplicationId: 1691243,
          programId: 186092,
          active: true,
          assignmentStatus: 'confirmed',
        }),
      ],
    })
    expect(result.ready).toBe(true)
  })

  it('blocked description no longer lists grade/class', () => {
    const text = formatOrganizationAttendanceScopeBlockedDescription(
      { ready: false, missingStep: 'SCHEDULE_ASSIGNMENT', unassignedStudentCount: 2 },
      '1회차'
    )
    expect(text).not.toContain('학년·반')
    expect(text).toContain('배정되지 않은 일정의 학생 출결은 저장할 수 없습니다.')
    expect(text).toContain('기관의 교육 일정 배정을 먼저 완료해 주세요.')
  })
})

function apiError(code: string, status = 400) {
  return { response: { status, data: { success: false, error: { code, message: 'x' } } } }
}

describe('GENERAL_ORGANIZATION_ATTENDANCE_ASSIGNMENT_SCOPE_REQUIRED error mapping', () => {
  it('matches the bare code and the `:<participantId>` suffixed code', () => {
    expect(
      isGeneralOrganizationAttendanceScopeRequiredError(
        apiError('GENERAL_ORGANIZATION_ATTENDANCE_ASSIGNMENT_SCOPE_REQUIRED')
      )
    ).toBe(true)
    expect(
      isGeneralOrganizationAttendanceScopeRequiredError(
        apiError('GENERAL_ORGANIZATION_ATTENDANCE_ASSIGNMENT_SCOPE_REQUIRED:1694983')
      )
    ).toBe(true)
    expect(
      resolveOrganizationAttendanceScopeErrorMessage(
        apiError('GENERAL_ORGANIZATION_ATTENDANCE_ASSIGNMENT_SCOPE_REQUIRED:1694983')
      )
    ).toBe(
      '배정되지 않은 일정의 학생 출결은 저장할 수 없습니다.\n기관의 교육 일정 배정을 먼저 완료해 주세요.'
    )
  })

  it('leaves other codes to their existing handlers', () => {
    expect(
      resolveOrganizationAttendanceScopeErrorMessage(
        apiError('ATTENDANCE_PARTICIPANT_ORGANIZATION_APPLICATION_MISMATCH')
      )
    ).toBeNull()
    expect(
      resolveOrganizationAttendanceScopeErrorMessage(apiError('APPLICATION_DECISION_CONFLICT', 409))
    ).toBeNull()
    expect(
      isGeneralOrganizationAttendanceScopeRequiredError(apiError('ATTENDANCE_SCOPE_UNVERIFIED'))
    ).toBe(true)
    expect(resolveOrganizationAttendanceScopeErrorMessage(apiError('ATTENDANCE_SCOPE_UNVERIFIED'))).toBe(
      '배정되지 않은 일정의 학생 출결은 저장할 수 없습니다.\n기관의 교육 일정 배정을 먼저 완료해 주세요.'
    )
    expect(
      isGeneralOrganizationAttendanceScopeRequiredError(
        apiError('GENERAL_ORGANIZATION_ATTENDANCE_ASSIGNMENT_SCOPE_REQUIRED_X')
      )
    ).toBe(false)
  })
})
