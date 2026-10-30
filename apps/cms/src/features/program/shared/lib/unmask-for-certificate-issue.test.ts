import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  fetchOrganizationStudentRosterPrivacyDetail,
  unmaskIndividualApplicationPrivacyRemote,
  fetchMemberRolePrivacyUnmask,
  invalidatePrivacyAccessLogsAfterCertificateIssue,
} = vi.hoisted(() => ({
  fetchOrganizationStudentRosterPrivacyDetail: vi.fn(),
  unmaskIndividualApplicationPrivacyRemote: vi.fn(),
  fetchMemberRolePrivacyUnmask: vi.fn(),
  invalidatePrivacyAccessLogsAfterCertificateIssue: vi.fn(),
}))

vi.mock('@/features/program/general/api/student-roster-api-client', () => ({
  fetchOrganizationStudentRosterPrivacyDetail,
}))

vi.mock('@/features/program/general/api/applications-api-client', () => ({
  unmaskIndividualApplicationPrivacyRemote,
  unmaskInstructorApplicationPrivacyRemote: vi.fn(),
  unmaskVolunteerApplicationPrivacyRemote: vi.fn(),
}))

vi.mock('@/features/user/api/member-privacy-unmask', () => ({
  fetchMemberRolePrivacyUnmask,
}))

vi.mock('@/features/logs/lib/certificate-issue-privacy-access', () => ({
  CERTIFICATE_ISSUE_PRIVACY_ACCESS_PURPOSE: '증명서 발급',
  invalidatePrivacyAccessLogsAfterCertificateIssue,
}))

import { CERTIFICATE_ISSUE_PRIVACY_ACCESS_PURPOSE } from '@/features/logs/lib/certificate-issue-privacy-access'
import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import {
  extractCertificateIssuePersonFromUnmaskPayload,
  unmaskIndividualParticipantForCertificateIssue,
  unmaskRosterStudentForCertificateIssue,
} from './unmask-for-certificate-issue'

function participant(
  overrides: Partial<ParticipatingIndividualParticipantRow> = {}
): ParticipatingIndividualParticipantRow {
  return {
    id: 'p-1',
    no: 1,
    applicantName: '김**',
    homeAddress: '',
    affiliation: '테스트중',
    educationGrade: '1학년',
    lectureAttendanceSessions: [],
    satisfactionSurveyCompleted: false,
    participationAppliedAt: '2026-01-01',
    ...overrides,
  } as ParticipatingIndividualParticipantRow
}

describe('extractCertificateIssuePersonFromUnmaskPayload', () => {
  it('reads name and birthDate from profile or member', () => {
    expect(
      extractCertificateIssuePersonFromUnmaskPayload({
        profile: { name: '김서연', birthDate: '2010-03-15' },
      })
    ).toEqual({
      name: '김서연',
      birthDate: '2010. 03. 15.',
    })
  })
})

describe('unmaskRosterStudentForCertificateIssue', () => {
  beforeEach(() => {
    fetchOrganizationStudentRosterPrivacyDetail.mockReset()
    invalidatePrivacyAccessLogsAfterCertificateIssue.mockReset()
  })

  it('calls roster privacy-detail without a client reason and returns the matching row', async () => {
    fetchOrganizationStudentRosterPrivacyDetail.mockResolvedValue({
      revisionNo: 3,
      totalCount: 1,
      rows: [
        {
          rosterId: 88,
          studentName: '김서연',
          birthDate: '2010-03-15',
          grade: '1학년',
          className: '2반',
        },
      ],
    })

    await expect(
      unmaskRosterStudentForCertificateIssue({
        applicationId: 1691524,
        rosterId: 88,
      })
    ).resolves.toEqual({
      name: '김서연',
      birthDate: '2010. 03. 15.',
    })

    expect(fetchOrganizationStudentRosterPrivacyDetail).toHaveBeenCalledWith(1691524)
    expect(invalidatePrivacyAccessLogsAfterCertificateIssue).toHaveBeenCalled()
  })
})

describe('unmaskIndividualParticipantForCertificateIssue', () => {
  beforeEach(() => {
    unmaskIndividualApplicationPrivacyRemote.mockReset()
    fetchMemberRolePrivacyUnmask.mockReset()
    invalidatePrivacyAccessLogsAfterCertificateIssue.mockReset()
  })

  it('unmasks the individual application with 증명서 발급', async () => {
    unmaskIndividualApplicationPrivacyRemote.mockResolvedValue({
      id: 1690625,
      profile: { name: '이민준', birthDate: '2008-11-02', affiliationGrade: '2학년' },
    })

    const result = await unmaskIndividualParticipantForCertificateIssue(
      participant({
        individualApplicationId: '1690625',
        applicantName: '이**',
      })
    )

    expect(unmaskIndividualApplicationPrivacyRemote).toHaveBeenCalledWith(
      '1690625',
      CERTIFICATE_ISSUE_PRIVACY_ACCESS_PURPOSE
    )
    expect(result.applicantName).toBe('이민준')
    expect(result.detail?.birthDate).toBe('2008-11-02')
    expect(invalidatePrivacyAccessLogsAfterCertificateIssue).toHaveBeenCalled()
  })
})
