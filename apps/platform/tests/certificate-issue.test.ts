import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchMyCertificateAvailability,
  issueMyCertificate,
} from '../src/features/mypage/education/applications/api/certificate-client'
import {
  mapPortalProgramApplicationDetail,
  mapPortalProgramApplicationListItem,
} from '../src/features/mypage/education/applications/api/mappers'
import { resolveCertificateCtaView } from '../src/features/mypage/education/applications/lib/certificate-cta'

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

  it('canIssueCertificate가 없거나 false면 버튼을 숨긴다', () => {
    expect(
      resolveCertificateCtaView({
        isTeacher: false,
        applicationType: 'INDIVIDUAL',
        canIssueCertificate: false,
        availability: { available: true, canDownload: false },
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
})
