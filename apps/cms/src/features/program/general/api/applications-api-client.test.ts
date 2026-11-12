import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import customInstance from '@/shared/api/orval-mutator'
import {
  normalizeApplicationsPageDto,
  approveOrganizationApplicationRemote,
  bulkApproveInstructorApplicationsRemote,
  bulkIndividualDocumentResultsRemote,
  resendIndividualDocumentResultNotification,
  cancelIndividualApplicationApprovalRemote,
  cancelIndividualApplicationRejectionRemote,
  unmaskIndividualApplicationPrivacyRemote,
  unmaskInstructorApplicationPrivacyRemote,
  unmaskOrganizationApplicationPrivacyRemote,
  unmaskVolunteerApplicationPrivacyRemote,
  cancelVolunteerApplicationApprovalRemote,
  cancelVolunteerApplicationRejectionRemote,
  cancelOrganizationApplicationApprovalRemote,
  cancelOrganizationApplicationRejectionRemote,
  toOrganizationApplicationDecisionCancelRequest,
  updateIndividualApplication,
  updateIndividualDocumentEvaluationRemote,
  updateInstructorApplication,
  updateVolunteerDocumentEvaluationRemote,
  approveIndividualApplicationWithEducationScopeRemote,
  bulkApproveIndividualApplicationsWithEducationScopeRemote,
  rejectIndividualApplicationRemote,
  bulkRejectIndividualApplicationsRemote,
  bulkApproveOrganizationApplicationsRemote,
  rejectOrganizationApplicationRemote,
} from './applications-api-client'

describe('updateIndividualApplication', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('개인 신청 운영정보를 canonical PATCH 경로로 저장한다', async () => {
    const response = {
      applicationId: 1690625,
      programId: 168006,
      applicationStatus: 'APPROVED',
      textbook: null,
      team: null,
      managerComment: '신청 정보 재확인 필요',
      updatedAt: '2026-09-16T03:30:00Z',
      availableActions: ['VIEW', 'COMMENT_UPDATE'],
    }
    vi.mocked(customInstance).mockResolvedValue(response)

    await expect(
      updateIndividualApplication('1690625', {
        managerComment: '신청 정보 재확인 필요',
      })
    ).resolves.toEqual(response)

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/individual-applications/1690625',
      method: 'PATCH',
      data: {
        managerComment: '신청 정보 재확인 필요',
      },
    })
  })

  it('명시적 null을 그대로 전송해 코멘트를 삭제한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      applicationId: 1690625,
      managerComment: null,
    })

    await updateIndividualApplication('1690625', { managerComment: null })

    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          managerComment: null,
        },
      })
    )
  })

  it('교재 미사용과 팀 운영정보를 같은 PATCH 요청으로 전송한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({ applicationId: 1690627 })

    await updateIndividualApplication('1690627', {
      textbookId: null,
      teamName: '우리가 최고',
      teamMemberCount: 3,
      teamRole: 'LEADER',
    })

    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          textbookId: null,
          teamName: '우리가 최고',
          teamMemberCount: 3,
          teamRole: 'LEADER',
        },
      })
    )
  })
})

describe('resendIndividualDocumentResultNotification', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('신청 결과 path가 아니라 서류 document-results resend path를 호출한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({ applicationId: 1690625 })

    await resendIndividualDocumentResultNotification(
      '1690625',
      { timing: 'IMMEDIATE', scheduledAt: null, reason: null },
      'individual-document-1690625-key'
    )

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/individual-applications/1690625/document-results/notifications/resend',
      method: 'POST',
      data: { timing: 'IMMEDIATE' },
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'individual-document-1690625-key',
      },
    })
  })
})

describe('bulkIndividualDocumentResultsRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('참여자 다건 서류 결과를 bulk API 한 번으로 전송한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      requestedCount: 2,
      successCount: 2,
      failureCount: 0,
    })

    await bulkIndividualDocumentResultsRemote({
      ids: [1690625, 1690626],
      result: 'PASS',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/individual-applications/document-results/bulk',
      method: 'POST',
      data: {
        ids: [1690625, 1690626],
        result: 'PASS',
      },
    })
  })

  it('즉시 발송이면 scheduledAt을 제거한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      requestedCount: 1,
      successCount: 1,
      failureCount: 0,
    })

    await bulkIndividualDocumentResultsRemote({
      ids: [1690625],
      result: 'PASS',
      notifyTiming: 'IMMEDIATE',
      scheduledAt: '2026-10-20T00:00:00.000Z',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/individual-applications/document-results/bulk',
      method: 'POST',
      data: {
        ids: [1690625],
        result: 'PASS',
        notifyTiming: 'IMMEDIATE',
      },
    })
  })
})

describe('updateIndividualDocumentEvaluationRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('담당자 서류 평가를 canonical PUT 경로로 저장한다', async () => {
    const response = {
      applicationId: 1690625,
      managerSlot: 'A',
      evaluation: 'PASS',
    }
    vi.mocked(customInstance).mockResolvedValue(response)

    await expect(
      updateIndividualDocumentEvaluationRemote('1690625', 'A', {
        evaluation: 'PASS',
      })
    ).resolves.toEqual(response)

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/individual-applications/1690625/document-evaluations/A',
      method: 'PUT',
      data: {
        evaluation: 'PASS',
      },
    })
  })
})

describe('updateVolunteerDocumentEvaluationRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('개인 신청 API가 아닌 봉사자 전용 PUT 경로로 담당자 평가를 저장한다', async () => {
    const response = {
      applicationId: 1690641,
      managerSlot: 'A',
      evaluation: 'PASS',
      managerAEvaluation: 'PASS',
      managerBEvaluation: 'UNREVIEWED',
    }
    vi.mocked(customInstance).mockResolvedValue(response)

    await expect(
      updateVolunteerDocumentEvaluationRemote('1690641', 'A', {
        evaluation: 'PASS',
      })
    ).resolves.toEqual(response)

    expect(customInstance).toHaveBeenCalledWith(
      {
        url: '/api/admin/volunteer-applications/1690641/document-evaluations/A',
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          evaluation: 'PASS',
        },
      },
      undefined
    )
  })
})

describe('unmaskIndividualApplicationPrivacyRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('개인 신청 개인정보 원문을 canonical POST 경로로 조회한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      id: 1690625,
      profile: { name: '김참여자', contact: '010-3333-4444' },
    })

    await unmaskIndividualApplicationPrivacyRemote('1690625', '참여자 연락')

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/individual-applications/1690625/privacy/unmask',
      method: 'POST',
      data: { reason: '참여자 연락' },
      headers: { 'Cache-Control': 'no-store' },
    })
  })
})

describe('unmaskInstructorApplicationPrivacyRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('강사 신청 개인정보 원문을 canonical POST 경로로 조회한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      id: 1690200,
      instructorName: '이강사',
      contact: '010-1111-2222',
      email: 'lee@example.com',
    })

    await unmaskInstructorApplicationPrivacyRemote('1690200', '강사 연락', 168006)

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/instructor-applications/1690200/privacy/unmask',
      method: 'POST',
      data: { reason: '강사 연락', programId: 168006 },
      headers: { 'Cache-Control': 'no-store' },
    })
  })
})

describe('unmaskOrganizationApplicationPrivacyRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('기관 신청 개인정보 원문을 canonical POST 경로로 조회한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      id: 1690100,
      teacherName: '김선생',
      teacherPhone: '010-1234-5678',
      teacherEmail: 'kim@school.kr',
    })

    await unmaskOrganizationApplicationPrivacyRemote('1690100', '담당 교사 연락', 168006)

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/organization-applications/1690100/privacy/unmask',
      method: 'POST',
      data: { reason: '담당 교사 연락', programId: 168006 },
      headers: { 'Cache-Control': 'no-store' },
    })
  })
})

describe('cancelIndividualApplicationRejectionRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('개인 신청 반려 취소를 canonical POST 경로로 호출한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      applicationId: 1690625,
      applicationStatus: 'WAITING_REVIEW',
    })

    await cancelIndividualApplicationRejectionRemote('1690625', { reason: '반려 취소' })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/individual-applications/1690625/cancel-rejection',
      method: 'POST',
      data: { reason: '반려 취소' },
    })
  })
})

describe('unmaskVolunteerApplicationPrivacyRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('봉사자 신청 개인정보 원문을 canonical POST 경로로 조회한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      id: 1690800,
      profile: { name: '이봉사', contact: '010-2222-3333', email: 'vol@example.com' },
    })

    await unmaskVolunteerApplicationPrivacyRemote('1690800', '봉사자 연락', 168006)

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/volunteer-applications/1690800/privacy/unmask',
      method: 'POST',
      data: { reason: '봉사자 연락', programId: 168006 },
      headers: { 'Cache-Control': 'no-store' },
    })
  })
})

describe('cancelVolunteerApplicationApprovalRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('봉사자 서류 승인 취소를 canonical POST 경로로 호출한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      applicationId: 1690800,
      applicationStatus: 'REJECTED',
    })

    await cancelVolunteerApplicationApprovalRemote('1690800', {
      reason: '일정 중복으로 승인 취소',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/volunteer-applications/1690800/cancel-approval',
      method: 'POST',
      data: { reason: '일정 중복으로 승인 취소' },
    })
  })
})

describe('cancelVolunteerApplicationRejectionRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('봉사자 서류 반려 취소를 canonical POST 경로로 호출한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      applicationId: 1690800,
      applicationStatus: 'WAITING_REVIEW',
    })

    await cancelVolunteerApplicationRejectionRemote('1690800', { reason: '반려 취소' })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/volunteer-applications/1690800/cancel-rejection',
      method: 'POST',
      data: { reason: '반려 취소' },
    })
  })
})

describe('cancelOrganizationApplicationApprovalRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('승인 취소 성공 응답의 notificationEventId null을 보존한다', async () => {
    const response = {
      applicationId: 1690800,
      fromStatus: 'APPROVED',
      toStatus: 'APPROVAL_CANCELLED',
      notificationEventId: null,
    }
    vi.mocked(customInstance).mockResolvedValue(response)

    await expect(
      cancelOrganizationApplicationApprovalRemote('1690800', {
        reason: '일정 변경으로 승인 취소',
        notification: { timing: 'IMMEDIATE' },
      })
    ).resolves.toEqual(response)

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/organization-applications/1690800/cancel-approval',
      method: 'POST',
      data: {
        reason: '일정 변경으로 승인 취소',
        notification: { timing: 'IMMEDIATE' },
      },
    })
  })
})

describe('cancelIndividualApplicationApprovalRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('개인 신청 승인 취소를 canonical POST 경로로 호출한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      applicationId: 1690625,
      applicationType: 'INDIVIDUAL',
      fromStatus: 'APPROVED',
      toStatus: 'APPROVAL_CANCELLED',
      availableActions: ['VIEW', 'CANCEL_REJECTION', 'RESEND_NOTIFICATION'],
    })

    await cancelIndividualApplicationApprovalRemote('1690625', {
      reason: '일정 중복으로 승인 취소',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/individual-applications/1690625/cancel-approval',
      method: 'POST',
      data: { reason: '일정 중복으로 승인 취소' },
    })
  })

  it('직접 설정이면 nested notification을 함께 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      applicationId: 1690625,
      applicationType: 'INDIVIDUAL',
      fromStatus: 'APPROVED',
      toStatus: 'REJECTED',
    })

    await cancelIndividualApplicationApprovalRemote('1690625', {
      reason: '일정 중복으로 승인 취소',
      notification: {
        timing: 'SCHEDULED',
        scheduledAt: '2026-11-01T01:00:00.000Z',
      },
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/individual-applications/1690625/cancel-approval',
      method: 'POST',
      data: {
        reason: '일정 중복으로 승인 취소',
        notification: {
          timing: 'SCHEDULED',
          scheduledAt: '2026-11-01T01:00:00.000Z',
        },
      },
    })
  })
})

describe('approveOrganizationApplicationRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('시점 없으면 body 없이 즉시 발송한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      applicationId: 101,
      applicationStatus: 'APPROVED',
    })

    await approveOrganizationApplicationRemote('101')

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/organization-applications/101/approve',
      method: 'POST',
    })
  })

  it('GENERAL 승인은 selectedScheduleId와 알림 timing을 함께 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      applicationId: 101,
      applicationStatus: 'APPROVED',
    })

    await approveOrganizationApplicationRemote('101', {
      timing: 'IMMEDIATE',
      selectedScheduleId: 88001,
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/organization-applications/101/approve',
      method: 'POST',
      data: {
        timing: 'IMMEDIATE',
        selectedScheduleId: 88001,
      },
    })
  })

  it('GENERAL 승인만 timing으로 보낼 수 있다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      applicationId: 101,
      applicationStatus: 'APPROVED',
    })

    await approveOrganizationApplicationRemote('101', { timing: 'IMMEDIATE' })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/organization-applications/101/approve',
      method: 'POST',
      data: { timing: 'IMMEDIATE' },
    })
  })

  it('직접설정은 SCHEDULED + scheduledAt만 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      applicationId: 101,
      applicationStatus: 'APPROVED',
    })

    await approveOrganizationApplicationRemote('101', {
      timing: 'SCHEDULED',
      scheduledAt: '2026-10-20T09:00:00+09:00',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/organization-applications/101/approve',
      method: 'POST',
      data: {
        timing: 'SCHEDULED',
        scheduledAt: '2026-10-20T09:00:00+09:00',
      },
    })
  })
})

describe('cancelVolunteerApplicationApprovalRemote notification', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('취소 알림 시점을 notification 객체로 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({
      applicationId: 1690800,
      applicationStatus: 'REJECTED',
    })

    await cancelVolunteerApplicationApprovalRemote('1690800', {
      reason: '일정 변경으로 승인 취소',
      notification: {
        timing: 'SCHEDULED',
        scheduledAt: '2026-10-20T09:00:00+09:00',
      },
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/volunteer-applications/1690800/cancel-approval',
      method: 'POST',
      data: {
        reason: '일정 변경으로 승인 취소',
        notification: {
          timing: 'SCHEDULED',
          scheduledAt: '2026-10-20T09:00:00+09:00',
        },
      },
    })
  })
})

describe('bulkApproveInstructorApplicationsRemote', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('일괄 승인에 예약 시점을 붙인다', async () => {
    vi.mocked(customInstance).mockResolvedValue({ successCount: 2, failureCount: 0 })

    await bulkApproveInstructorApplicationsRemote([101, 102], {
      timing: 'SCHEDULED',
      scheduledAt: '2026-10-20T09:00:00+09:00',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/instructor-applications/bulk-approve',
      method: 'POST',
      data: {
        ids: [101, 102],
        timing: 'SCHEDULED',
        scheduledAt: '2026-10-20T09:00:00+09:00',
      },
    })
  })
})

describe('updateInstructorApplication', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('강사비와 사업소득자 여부를 PATCH한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({ id: 201 })

    await updateInstructorApplication('201', {
      managerComment: '배정 후 강사비 재확인',
      feePolicy: {
        basisType: 'RECRUITMENT',
        measure: 'PER_LECTURE',
        amount: 150000,
        instructorFeeGrade: 'GRADE_3',
      },
      businessIncomeEarnerStatus: '해당 없음',
    })

    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/instructor-applications/201',
      method: 'PATCH',
      data: {
        managerComment: '배정 후 강사비 재확인',
        feePolicy: {
          basisType: 'RECRUITMENT',
          measure: 'PER_LECTURE',
          amount: 150000,
          instructorFeeGrade: 'GRADE_3',
        },
        businessIncomeEarnerStatus: '해당 없음',
      },
    })
  })
})

describe('normalizeApplicationsPageDto', () => {
  it('uses items when present', () => {
    const page = normalizeApplicationsPageDto({
      items: [{ id: 1 }],
      page: 0,
      totalElements: 1,
    })
    expect(page.items).toHaveLength(1)
  })

  it('falls back to Spring content array', () => {
    const page = normalizeApplicationsPageDto({
      content: [{ id: 2 }],
      page: 0,
      totalElements: 1,
    })
    expect(page.items).toHaveLength(1)
    expect(page.items?.[0]).toEqual({ id: 2 })
  })
})

describe('individual scope approve/reject notify payload', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
    vi.mocked(customInstance).mockResolvedValue({ applicationId: 1 })
  })

  it('단건 일정 확정 승인은 예약 시점을 봉투에 붙인다', async () => {
    await approveIndividualApplicationWithEducationScopeRemote('11', {
      confirmedScheduleIds: [1],
      expectedScopeRevision: 0,
      reason: '확정',
      timing: 'SCHEDULED',
      scheduledAt: '2026-11-01T00:00:00Z',
    })
    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/individual-applications/11/approve-with-education-scope',
      method: 'POST',
      data: {
        confirmedScheduleIds: [1],
        expectedScopeRevision: 0,
        reason: '확정',
        timing: 'SCHEDULED',
        scheduledAt: '2026-11-01T00:00:00Z',
      },
    })
  })

  it('단건 일정 확정 발표일에는 scheduledAt이 없다', async () => {
    await approveIndividualApplicationWithEducationScopeRemote('11', {
      confirmedScheduleIds: [1],
      expectedScopeRevision: 0,
      reason: '확정',
      timing: 'ON_ANNOUNCEMENT',
    })
    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ scheduledAt: expect.anything() }),
      })
    )
    expect(vi.mocked(customInstance).mock.calls[0]?.[0].data.timing).toBe('ON_ANNOUNCEMENT')
  })

  it('일괄 일정 확정 시점 필드는 target 안이 아니라 봉투에 둔다', async () => {
    vi.mocked(customInstance).mockResolvedValue({ successCount: 1, failureCount: 0 })
    await bulkApproveIndividualApplicationsWithEducationScopeRemote({
      reason: '확정',
      targets: [{ applicationId: 11, confirmedScheduleIds: [1], expectedScopeRevision: 0 }],
      timing: 'ON_ANNOUNCEMENT',
    })
    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/individual-applications/bulk-approve-with-education-scope',
      method: 'POST',
      data: {
        reason: '확정',
        targets: [{ applicationId: 11, confirmedScheduleIds: [1], expectedScopeRevision: 0 }],
        timing: 'ON_ANNOUNCEMENT',
      },
    })
  })

  it('단건/일괄 최종 반려에 예약·발표일을 전달한다', async () => {
    await rejectIndividualApplicationRemote('11', {
      reason: '반려',
      timing: 'SCHEDULED',
      scheduledAt: '2026-11-01T00:00:00Z',
    })
    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/admin/individual-applications/11/reject',
        data: {
          reason: '반려',
          timing: 'SCHEDULED',
          scheduledAt: '2026-11-01T00:00:00Z',
        },
      })
    )

    vi.mocked(customInstance).mockResolvedValue({ successCount: 2, failureCount: 0 })
    await bulkRejectIndividualApplicationsRemote([11, 12], '반려', {
      timing: 'ON_ANNOUNCEMENT',
    })
    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/individual-applications/bulk-reject',
      method: 'POST',
      data: { ids: [11, 12], reason: '반려', timing: 'ON_ANNOUNCEMENT' },
    })
  })

  it('기관 일괄 승인과 단건 반려에 발표일을 전달한다', async () => {
    vi.mocked(customInstance).mockResolvedValue({ successCount: 2, failureCount: 0 })
    await bulkApproveOrganizationApplicationsRemote([101, 102], { timing: 'ON_ANNOUNCEMENT' })
    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/organization-applications/bulk-approve',
      method: 'POST',
      data: { ids: [101, 102], timing: 'ON_ANNOUNCEMENT' },
    })

    await rejectOrganizationApplicationRemote('101', {
      reason: '반려',
      timing: 'ON_ANNOUNCEMENT',
    })
    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/organization-applications/101/reject',
      method: 'POST',
      data: { reason: '반려', timing: 'ON_ANNOUNCEMENT' },
    })
  })
})

describe('기관 승인 취소·반려 취소 — 발표일에 맞춰서 (BE 항목 7)', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
  })

  it('ON_ANNOUNCEMENT는 scheduledAt 없이, SCHEDULED만 scheduledAt, 알 수 없는 timing은 notification 제외', () => {
    expect(
      toOrganizationApplicationDecisionCancelRequest({
        reason: '발표일 취소',
        notification: { timing: 'ON_ANNOUNCEMENT', scheduledAt: '2026-11-20T00:00:00Z' },
      })
    ).toEqual({ reason: '발표일 취소', notification: { timing: 'ON_ANNOUNCEMENT' } })
    expect(
      toOrganizationApplicationDecisionCancelRequest({
        reason: '예약',
        notification: { timing: 'SCHEDULED', scheduledAt: '2026-11-20T00:00:00Z' },
      })
    ).toEqual({
      reason: '예약',
      notification: { timing: 'SCHEDULED', scheduledAt: '2026-11-20T00:00:00Z' },
    })
    expect(
      toOrganizationApplicationDecisionCancelRequest({
        reason: '즉시',
        notification: { timing: 'IMMEDIATE', scheduledAt: null },
      })
    ).toEqual({ reason: '즉시', notification: { timing: 'IMMEDIATE' } })
    expect(
      toOrganizationApplicationDecisionCancelRequest({
        reason: '모름',
        notification: { timing: 'LATER' },
      })
    ).toEqual({ reason: '모름' })
    expect(toOrganizationApplicationDecisionCancelRequest({ reason: '사유만' })).toEqual({
      reason: '사유만',
    })
  })

  it('반려 취소도 ON_ANNOUNCEMENT를 그대로 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue({ applicationId: 1690800 })
    await cancelOrganizationApplicationRejectionRemote('1690800', {
      reason: '반려 취소',
      notification: { timing: 'ON_ANNOUNCEMENT', scheduledAt: null },
    })
    expect(customInstance).toHaveBeenCalledWith({
      url: '/api/admin/organization-applications/1690800/cancel-rejection',
      method: 'POST',
      data: { reason: '반려 취소', notification: { timing: 'ON_ANNOUNCEMENT' } },
    })
  })
})
