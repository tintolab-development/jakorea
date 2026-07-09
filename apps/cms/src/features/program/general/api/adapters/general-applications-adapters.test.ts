import { describe, expect, it } from 'vitest'
import {
  mapApiApplicationStatusToApprovalStatus,
  mapOrganizationApplicationToApplicantSchoolRow,
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
})

describe('general-program-service-detail-json', () => {
  it('round-trips CMS-only nested fields', () => {
    const program = {
      generalCommonInfo: { educationScheduleMode: 'period' as const },
      generalParticipantTypes: ['individual' as const],
      targetLevels: ['elementary' as const],
    } as Program

    const raw = serializeGeneralProgramServiceDetailJson(program)
    expect(raw).toBeTruthy()

    const parsed = parseGeneralProgramServiceDetailJson(raw)
    expect(parsed.generalCommonInfo?.educationScheduleMode).toBe('period')
    expect(parsed.generalParticipantTypes).toEqual(['individual'])
    expect(parsed.targetLevels).toEqual(['elementary'])
  })
})
