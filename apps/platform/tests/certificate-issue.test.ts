import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchMyCertificateAvailability,
  issueMyCertificate,
} from '../src/features/mypage/education/applications/api/certificate-client'
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

  it('BE 상세 canIssueCertificate=false여도 availability AVAILABLE이면 발급 버튼이다', () => {
    expect(
      resolveCertificateCtaView({
        isTeacher: false,
        applicationType: 'INDIVIDUAL',
        displayStatus: 'completed',
        availability: { available: true, canDownload: false },
      }),
    ).toEqual({ kind: 'issue' })
  })
})
