import { describe, expect, it } from 'vitest'
import type { SlotResponse } from '@/shared/api/generated/dashboard/schemas/slotResponse'
import type { SchoolDetailAttendanceStudentRow } from '@/features/program/general/model/school-detail-types'
import { evaluateOrganizationAttendanceScopeReadiness } from './organization-schedule-attendance-scope'

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
  }
}

type LegacySlotFixture = SlotResponse & {
  grade?: string
  className?: string
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

  it('blocks when a class assignment is missing', () => {
    const result = evaluateOrganizationAttendanceScopeReadiness({
      ...baseInput,
      rosterStudents: [
        student({ id: 's1', gradeClass: '1반', participantId: 10 }),
        student({ id: 's2', gradeClass: '2반', participantId: 11 }),
      ],
    })
    expect(result.ready).toBe(false)
    expect(result.missingStep).toBe('SCHEDULE_ASSIGNMENT')
    expect(result.unassignedStudentCount).toBe(1)
    expect(result.missingByGradeClass).toEqual([
      { grade: '초5', className: '2반', studentCount: 1 },
    ])
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

  it('does not guess grade/class — mismatch stays unassigned', () => {
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
    expect(result.ready).toBe(false)
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

  it('treats trim and case as equal for grade and class', () => {
    const result = evaluateOrganizationAttendanceScopeReadiness({
      ...baseInput,
      rosterStudents: [student({ id: 's1', gradeClass: '1반', participantId: 10 })],
      assignmentSlots: [
        slot({
          scheduleId: 186674,
          organizationApplicationId: 1691243,
          programId: 186092,
          grade: ' 초5 ',
          className: ' 1반 ',
          active: true,
          assignmentStatus: 'confirmed',
        }),
      ],
    })
    expect(result.ready).toBe(true)
  })
})
