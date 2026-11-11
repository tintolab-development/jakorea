import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/instance/axios-instance', () => ({
  axiosClient: { request: vi.fn() },
}))
vi.mock('@/shared/api/orval-mutator', () => ({ customInstance: vi.fn(), default: vi.fn() }))

import { axiosClient } from '@/shared/instance/axios-instance'
import { bulkDownloadCertificatesRemote } from './certificates-api-client'

describe('bulkDownloadCertificatesRemote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('ZIP 바이너리와 서버 파일명 헤더를 돌려주고 issueReason은 보내지 않는다', async () => {
    const zip = new Blob(['PK'], { type: 'application/zip' })
    const header = "attachment; filename*=UTF-8''%5BJA%20Korea%5D%20%EC%A6%9D%EB%AA%85%EC%84%9C_%EC%9D%BC%EA%B4%84_261110.zip"
    vi.mocked(axiosClient.request).mockResolvedValue({
      status: 200,
      data: zip,
      headers: { 'content-disposition': header },
    })

    const result = await bulkDownloadCertificatesRemote({
      participantIds: [1, 2],
      certificateType: 'COMPLETION',
    })

    expect(result).toEqual({ zip, contentDisposition: header })
    const config = vi.mocked(axiosClient.request).mock.calls[0]?.[0]
    expect(config).toMatchObject({
      url: '/api/admin/certificates/issues/bulk-download',
      method: 'POST',
      responseType: 'blob',
      data: { participantIds: [1, 2], certificateType: 'COMPLETION' },
    })
    expect(config?.data).not.toHaveProperty('issueReason')
  })

  it('JSON 응답(ZIP 아님)이면 실패로 처리한다', async () => {
    vi.mocked(axiosClient.request).mockResolvedValue({
      status: 200,
      data: new Blob(['{}'], { type: 'application/json' }),
      headers: {},
    })

    await expect(
      bulkDownloadCertificatesRemote({ participantIds: [1], certificateType: 'COMPLETION' })
    ).rejects.toThrow('증명서 ZIP을 받지 못했습니다.')
  })
})
