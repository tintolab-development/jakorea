import { describe, expect, it } from 'vitest'
import { mapTrainedTeacherOrganizationApplicationToRow } from './organization-applications-adapters'

describe('mapTrainedTeacherOrganizationApplicationToRow', () => {
  it('maps core list fields', () => {
    const row = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 42,
        programId: 7,
        schoolName: '서울초',
        teacherName: '김교사',
        teacherPhoneMasked: '010-****-1234',
        classCount: 3,
        studentCount: 90,
        applicationStatus: 'APPROVED',
        submittedAt: '2026-07-01T00:00:00Z',
        desiredEducationScheduleMemo: '3월 희망',
      },
      0,
      'fallback-program'
    )
    expect(row.id).toBe('42')
    expect(row.programId).toBe('7')
    expect(row.schoolName).toBe('서울초')
    expect(row.teacherName).toBe('김교사')
    expect(row.classCount).toBe(3)
    expect(row.studentCount).toBe(90)
    expect(row.approvalStatus).toBe('approved')
    expect(row.desiredEducationPeriod).toBe('3월 희망')
  })

  it('falls back to organizationName and pending status', () => {
    const row = mapTrainedTeacherOrganizationApplicationToRow(
      {
        applicationId: 1,
        organizationName: '기관A',
        applicationStatus: 'WAITING_REVIEW',
      },
      2,
      'p1'
    )
    expect(row.no).toBe(3)
    expect(row.schoolName).toBe('기관A')
    expect(row.approvalStatus).toBe('pending')
    expect(row.programId).toBe('p1')
  })
})
