import { describe, expect, it } from 'vitest'
import {
  mapApiApplicationStatusToApprovalStatus,
  mapInstructorApplicationToApplicantInstructorRow,
  mapOrganizationApplicationToApplicantSchoolRow,
  mapVolunteerApplicationToGeneralVolunteerApplicantRow,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import {
  parseGeneralProgramServiceDetailJson,
  serializeGeneralProgramServiceDetailJson,
} from '@/features/program/general/lib/general-program-service-detail-json'
import type { Program } from '@/types/domain'

describe('general-applications-adapters', () => {
  it('maps API application status to approval status', () => {
    expect(mapApiApplicationStatusToApprovalStatus('APPROVED')).toBe('approved')
    expect(mapApiApplicationStatusToApprovalStatus('WAITING_REVIEW')).toBe('pending')
    expect(mapApiApplicationStatusToApprovalStatus('REJECTED')).toBe('rejected')
  })

  it('maps organization application list item to applicant row', () => {
    const row = mapOrganizationApplicationToApplicantSchoolRow(
      {
        id: 101,
        organizationName: '서울초',
        teacherName: '김교사',
        requestedClassCount: 2,
        requestedStudentCount: 40,
        applicationStatus: 'WAITING_REVIEW',
        submittedAt: '2026-04-01T00:00:00Z',
      },
      0,
      '5001'
    )

    expect(row.id).toBe('101')
    expect(row.schoolName).toBe('서울초')
    expect(row.approvalStatus).toBe('pending')
    expect(row.programId).toBe('5001')
  })

  it('maps instructor application list item to applicant row', () => {
    const row = mapInstructorApplicationToApplicantInstructorRow(
      {
        id: 77,
        instructorName: '이강사',
        applicationStatus: 'APPROVED',
        instructorFeeGradeSnapshot: '3급 강사비',
        submittedAt: '2026-04-02T00:00:00Z',
        rejectReason: '서류 미비',
      },
      0,
      '5001'
    )

    expect(row.id).toBe('77')
    expect(row.instructorName).toBe('이강사')
    expect(row.approvalStatus).toBe('approved')
    expect(row.instructorFeeGradeLabel).toBe('3급 강사비')
    expect(row.rejectionReason).toBe('서류 미비')
  })

  it('maps volunteer application list item to screening row', () => {
    const row = mapVolunteerApplicationToGeneralVolunteerApplicantRow(
      {
        id: 55,
        programId: 5001,
        memberName: '김봉사',
        documentStatus: 'PASS',
        interviewStatus: 'ASSIGNED',
        finalResultStatus: 'RESERVE',
        reserveRank: 2,
        isReparticipation: true,
        giveUpYn: false,
      },
      0,
      '5001'
    )

    expect(row.id).toBe('55')
    expect(row.name).toBe('김봉사')
    expect(row.documentScreeningStatus).toBe('pass')
    expect(row.interviewAssignmentStatus).toBe('assigned')
    expect(row.secondInterviewScreeningStatus).toBe('reserve2')
    expect(row.applicationType).toBe('ujat-graduate')
  })
})

describe('general-program-service-detail-json', () => {
  it('round-trips CMS-only nested fields including education structure', () => {
    const program = {
      generalCommonInfo: { educationScheduleMode: 'period' as const },
      generalParticipantTypes: ['individual' as const],
      targetLevels: ['elementary' as const],
      generalProgramEducationStructure: 'curriculum' as const,
      generalProgramSessionRound: 'single' as const,
      generalProgramAudience: 'organization' as const,
    } as Program

    const raw = serializeGeneralProgramServiceDetailJson(program)
    expect(raw).toBeTruthy()

    const parsed = parseGeneralProgramServiceDetailJson(raw)
    expect(parsed.generalCommonInfo?.educationScheduleMode).toBe('period')
    expect(parsed.generalParticipantTypes).toEqual(['individual'])
    expect(parsed.targetLevels).toEqual(['elementary'])
    expect(parsed.generalProgramEducationStructure).toBe('curriculum')
    expect(parsed.generalProgramSessionRound).toBe('single')
    expect(parsed.generalProgramAudience).toBe('organization')
  })
})
