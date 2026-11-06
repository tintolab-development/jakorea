import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchMyCertificateAvailability,
  issueMyCertificate,
} from '../src/features/mypage/education/applications/api/certificate-client'
import {
  mapPortalProgramApplicationDetail,
  mapPortalProgramApplicationListItem,
} from '../src/features/mypage/education/applications/api/mappers'
import {
  resolveAutoPersonalCertificateSlot,
  resolveCertificateCtaView,
  resolveExclusivePersonalCertificateSlot,
} from '../src/features/mypage/education/applications/lib/certificate-cta'

const { getMock, postMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
}))

vi.mock('@/shared/api/axios-instance', () => ({
  axiosClient: {
    get: getMock,
    post: postMock,
  },
}))

describe('개인 수료증 API 계약', () => {
  beforeEach(() => {
    getMock.mockReset()
    postMock.mockReset()
  })

  it('메인 CTA availability는 certificateType=AUTO를 명시한다', async () => {
    getMock.mockResolvedValue({
      data: {
        available: true,
        eligible: true,
        canDownload: true,
        participantId: 1694970,
        certificateType: 'COMPLETION',
        reasonCode: 'AVAILABLE',
        existingIssueId: 18,
      },
    })
    const result = await fetchMyCertificateAvailability(186339, 'AUTO')
    expect(getMock).toHaveBeenCalledWith(
      '/api/portal/me/programs/186339/certificates/availability?certificateType=AUTO',
      expect.objectContaining({ signal: undefined }),
    )
    expect(result.certificateType).toBe('COMPLETION')
    expect(result.participantId).toBe(1694970)
    expect(result.canDownload).toBe(true)
    expect(
      resolveAutoPersonalCertificateSlot(result),
    ).toEqual({ type: 'COMPLETION', view: { kind: 'download', issueId: 18 } })
  })

  it('참가인증서 availability는 certificateType=PARTICIPATION을 명시한다', async () => {
    getMock.mockResolvedValue({
      data: {
        available: true,
        canDownload: false,
        participantId: 1694970,
        certificateType: 'PARTICIPATION',
        reasonCode: 'AVAILABLE',
      },
    })
    const result = await fetchMyCertificateAvailability(186339, 'PARTICIPATION')
    expect(getMock).toHaveBeenCalledWith(
      '/api/portal/me/programs/186339/certificates/availability?certificateType=PARTICIPATION',
      expect.objectContaining({ signal: undefined }),
    )
    expect(result.certificateType).toBe('PARTICIPATION')
    expect(result.participantId).toBe(1694970)
    expect(result.available).toBe(true)
  })

  it('참가인증서 발급 body는 PARTICIPATION과 availability participantId를 보낸다', async () => {
    postMock.mockResolvedValue({
      data: {
        certificateIssueId: 17,
        certificateType: 'PARTICIPATION',
        issueStatus: 'ISSUED',
        participantId: 1694970,
      },
    })
    const result = await issueMyCertificate({
      programId: 186339,
      participantId: 1694970,
      certificateType: 'PARTICIPATION',
      issueReason: 'PERSONAL_ARCHIVE',
    })
    expect(postMock).toHaveBeenCalledWith('/api/portal/me/certificates/issues', {
      programId: 186339,
      participantId: 1694970,
      certificateType: 'PARTICIPATION',
      issueReason: 'PERSONAL_ARCHIVE',
    })
    expect(result.certificateIssueId).toBe(17)
  })

  it('availability는 COMPLETION 쿼리와 프로그램 path를 쓴다', async () => {
    getMock.mockResolvedValue({
      data: {
        available: true,
        canDownload: false,
        participantId: 1695043,
        reasonCode: 'AVAILABLE',
      },
    })
    const result = await fetchMyCertificateAvailability(186514)
    expect(getMock).toHaveBeenCalledWith(
      '/api/portal/me/programs/186514/certificates/availability?certificateType=COMPLETION',
      expect.objectContaining({ signal: undefined }),
    )
    expect(result.participantId).toBe(1695043)
    expect(result.available).toBe(true)
  })

  it('발급 body는 programId·participantId·COMPLETION을 보낸다', async () => {
    postMock.mockResolvedValue({
      data: { issueId: 14, issueStatus: 'ISSUED', issuedAt: '2026-11-01T07:11:50Z' },
    })
    const result = await issueMyCertificate({
      programId: 186514,
      participantId: 1695043,
    })
    expect(postMock).toHaveBeenCalledWith('/api/portal/me/certificates/issues', {
      programId: 186514,
      participantId: 1695043,
      certificateType: 'COMPLETION',
      issueReason: 'PERSONAL_ARCHIVE',
    })
    expect(result.certificateIssueId).toBe(14)
  })

  it('상세 canIssueCertificate=true이고 availability AVAILABLE이면 발급 버튼이다', () => {
    expect(
      resolveCertificateCtaView({
        isTeacher: false,
        applicationType: 'INDIVIDUAL',
        programType: 'GENERAL_INDIVIDUAL',
        canIssueCertificate: true,
        certificateStatus: 'AVAILABLE',
        availability: { available: true, canDownload: false, existingIssueId: null },
      }),
    ).toEqual({ kind: 'issue' })
  })

  it('canDownload이거나 existingIssueId가 있으면 다운로드이고 발급으로 보지 않는다', () => {
    expect(
      resolveCertificateCtaView({
        isTeacher: false,
        applicationType: 'INDIVIDUAL',
        programType: 'GENERAL_INDIVIDUAL',
        canIssueCertificate: true,
        certificateStatus: 'COMPLETION_ISSUED',
        availability: { available: true, canDownload: true, existingIssueId: 14 },
      }),
    ).toEqual({ kind: 'download', issueId: 14 })
  })

  it('canIssueCertificate가 false여도 availability가 가능하면 발급 버튼이다', () => {
    expect(
      resolveCertificateCtaView({
        isTeacher: true,
        applicationType: 'INDIVIDUAL',
        programType: 'GENERAL_INDIVIDUAL',
        canIssueCertificate: false,
        availability: { available: true, canDownload: false, certificateType: 'PARTICIPATION' },
      }),
    ).toEqual({ kind: 'issue' })
  })

  it('수료증 canDownload가 열려 있으면 기존 참가인증서 17을 단일 CTA로 쓰지 않는다', () => {
    expect(
      resolveExclusivePersonalCertificateSlot({
        completion: {
          available: true,
          canDownload: true,
          existingIssueId: 18,
          certificateType: 'COMPLETION',
          participantId: 1694970,
        },
        participation: {
          available: false,
          canDownload: true,
          existingIssueId: 17,
          certificateType: 'PARTICIPATION',
        },
      }),
    ).toEqual({ type: 'COMPLETION', view: { kind: 'download', issueId: 18 } })
  })

  it('수료 자격만 열리면 참가인증서 기발급 다운로드로 대체하지 않는다', () => {
    expect(
      resolveExclusivePersonalCertificateSlot({
        completion: {
          available: true,
          canDownload: false,
          existingIssueId: null,
          certificateType: 'COMPLETION',
        },
        participation: {
          available: false,
          canDownload: true,
          existingIssueId: 17,
          certificateType: 'PARTICIPATION',
        },
      }),
    ).toEqual({ type: 'COMPLETION', view: { kind: 'issue' } })
  })

  it('수료가 깨진 뒤 existingIssueId 18·canDownload false면 수료증을 그리지 않는다', () => {
    expect(
      resolveExclusivePersonalCertificateSlot({
        completion: {
          available: false,
          canDownload: false,
          existingIssueId: 18,
          certificateType: 'COMPLETION',
          participantId: 1694970,
          reasonCode: 'PARTICIPANT_NOT_COMPLETED',
        },
        participation: {
          available: true,
          canDownload: true,
          existingIssueId: 17,
          certificateType: 'PARTICIPATION',
          participantId: 1694970,
        },
      }),
    ).toEqual({ type: 'PARTICIPATION', view: { kind: 'download', issueId: 17 } })
  })

  it('수료 미충족·참가 충족이면 참가인증서만 연다', () => {
    expect(
      resolveExclusivePersonalCertificateSlot({
        completion: {
          available: false,
          canDownload: false,
          certificateType: 'COMPLETION',
          reasonCode: 'PARTICIPANT_NOT_COMPLETED',
        },
        participation: {
          available: true,
          canDownload: false,
          certificateType: 'PARTICIPATION',
          participantId: 1694970,
        },
      }),
    ).toEqual({ type: 'PARTICIPATION', view: { kind: 'issue' } })
  })

  it('availability가 불가면 참가인증서도 숨긴다', () => {
    expect(
      resolveCertificateCtaView({
        isTeacher: true,
        applicationType: 'INDIVIDUAL',
        programType: 'GENERAL_INDIVIDUAL',
        canIssueCertificate: true,
        availability: {
          available: false,
          canDownload: false,
          certificateType: 'PARTICIPATION',
        },
      }),
    ).toEqual({ kind: 'hidden' })
  })

  it('목록은 certificateAvailable을 복사하고 ISSUE_CERTIFICATE는 availableActions로 둔다', () => {
    expect(
      mapPortalProgramApplicationListItem({
        applicationId: 1694716,
        applicationType: 'INDIVIDUAL',
        programId: 186513,
        programType: 'GENERAL_INDIVIDUAL',
        programGroup: 'GENERAL',
        programTitle: '발급됨',
        displayStatus: '진행 완료',
        certificateAvailable: true,
        availableActions: ['ISSUE_CERTIFICATE'],
      })?.certificateAvailable,
    ).toBe(true)
    const actionOnly = mapPortalProgramApplicationListItem({
      applicationId: 1694719,
      applicationType: 'INDIVIDUAL',
      programId: 186514,
      programType: 'GENERAL_INDIVIDUAL',
      programGroup: 'GENERAL',
      programTitle: '미발급',
      displayStatus: '진행 완료',
      certificateAvailable: false,
      availableActions: ['ISSUE_CERTIFICATE'],
    })
    expect(actionOnly?.certificateAvailable).toBe(false)
    expect(actionOnly?.availableActions).toEqual(['ISSUE_CERTIFICATE'])
  })

  it('상세는 목록 certificateAvailable을 덮지 않고 canIssueCertificate·participantId를 쓴다', () => {
    const blocked = mapPortalProgramApplicationDetail({
      applicationId: 1694716,
      applicationType: 'INDIVIDUAL',
      programId: 186513,
      programTitle: '플래그',
      programGroup: 'GENERAL',
      displayStatus: '진행 완료',
      certificateAvailable: true,
      capabilities: { canIssueCertificate: false },
    })
    expect(blocked?.canIssueCertificate).toBe(false)
    expect(blocked?.certificateAvailable).toBe(true)
    const issued = mapPortalProgramApplicationDetail({
      applicationId: 1694716,
      applicationType: 'INDIVIDUAL',
      programId: 186513,
      programTitle: '발급됨',
      programGroup: 'GENERAL',
      displayStatus: '진행 완료',
      capabilities: { canIssueCertificate: true },
      participation: { participantId: 1695042, certificateStatus: 'COMPLETION_ISSUED' },
    })
    expect(issued?.certificateAvailable).toBeUndefined()
    expect(issued?.canIssueCertificate).toBe(true)
    expect(issued?.participantId).toBe(1695042)
    expect(issued?.certificateStatus).toBe('COMPLETION_ISSUED')
  })

  it('displayStatus 진행 완료는 completionStatus NOT_COMPLETED로 덮지 않는다', () => {
    const mapped = mapPortalProgramApplicationDetail({
      applicationId: 1694691,
      applicationType: 'INDIVIDUAL',
      programId: 186339,
      programTitle: '개인 일정 종료 만족도 제출',
      programGroup: 'GENERAL',
      programType: 'GENERAL_INDIVIDUAL',
      applicationStatus: 'APPROVED',
      displayStatus: '진행 완료',
      participation: {
        participantId: 1694970,
        completionStatus: 'NOT_COMPLETED',
      },
    })
    expect(mapped?.displayStatus).toBe('completed')
    expect(mapped?.participantId).toBe(1694970)
  })

  it('displayStatus가 없으면 completionStatus COMPLETED로 진행 완료를 만들지 않는다', () => {
    expect(
      mapPortalProgramApplicationDetail({
        applicationId: 1694691,
        applicationType: 'INDIVIDUAL',
        programId: 186339,
        programTitle: 'fallback',
        programGroup: 'GENERAL',
        programType: 'GENERAL_INDIVIDUAL',
        applicationStatus: 'APPROVED',
        participation: {
          participantId: 1694970,
          completionStatus: 'COMPLETED',
        },
      })?.displayStatus,
    ).toBe('in_progress')
  })

  it('COMPLETION available false면 canDownload만으로 수료증을 열지 않는다', () => {
    expect(
      resolveExclusivePersonalCertificateSlot({
        completion: {
          available: false,
          canDownload: true,
          existingIssueId: 18,
          certificateType: 'COMPLETION',
        },
        participation: {
          available: true,
          canDownload: false,
          certificateType: 'PARTICIPATION',
        },
      }),
    ).toEqual({ type: 'PARTICIPATION', view: { kind: 'issue' } })
  })
})
