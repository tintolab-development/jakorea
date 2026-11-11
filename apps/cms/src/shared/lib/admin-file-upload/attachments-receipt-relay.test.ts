// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const { requestMock, customInstanceMock, downloadBlobMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  customInstanceMock: vi.fn(),
  downloadBlobMock: vi.fn(),
}))

vi.mock('@/shared/instance/axios-instance', () => ({
  axiosClient: { request: requestMock },
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  customInstance: customInstanceMock,
}))

vi.mock('@/shared/utils/file-download', async importOriginal => ({
  ...(await importOriginal<typeof import('@/shared/utils/file-download')>()),
  downloadBlob: downloadBlobMock,
}))

import { downloadAdminFile } from '@/shared/lib/admin-file-upload/attachments'

const RELAY_URL = '/api/admin/files/expense-receipts/31/relay/tok-abc'

describe('downloadAdminFile — 지출 증빙 relay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    customInstanceMock.mockResolvedValue({ fileObjectId: 31, downloadUrl: RELAY_URL })
  })

  it('Accept를 지정하고 인증 없이 받아 서버 헤더의 규칙 이름으로 저장한다(클라이언트 이력 생략)', async () => {
    const blob = new Blob(['x'], { type: 'image/png' })
    requestMock.mockResolvedValue({
      data: blob,
      headers: {
        'content-disposition':
          "attachment; filename=\"receipt.png\"; filename*=UTF-8''%5BJA%20Korea%5D%20IMG_2235_261111.PNG",
      },
    })

    await downloadAdminFile({ fileObjectId: 31, fileName: 'IMG_2235.PNG' })

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: RELAY_URL,
        method: 'GET',
        responseType: 'blob',
        skipAuth: true,
        headers: expect.objectContaining({ Accept: 'application/octet-stream, application/json' }),
      })
    )
    expect(downloadBlobMock).toHaveBeenCalledWith(blob, '[JA Korea] IMG_2235_261111.PNG', {
      skipAccessLog: true,
    })
  })

  it('헤더 이름이 없으면 원본 이름을 넘긴다(저장 시 규칙 적용)', async () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' })
    requestMock.mockResolvedValue({ data: blob, headers: {} })

    await downloadAdminFile({ fileObjectId: 31, fileName: '영수증' })

    expect(downloadBlobMock).toHaveBeenCalledWith(blob, '영수증.jpg', { skipAccessLog: true })
  })

  it('409 JSON 오류는 error.code·message가 보이도록 복원해 던진다', async () => {
    const error = new AxiosError('Conflict')
    error.response = {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: {} } as InternalAxiosRequestConfig,
      data: new Blob(
        [
          JSON.stringify({
            success: false,
            error: { code: 'FILE_DOWNLOAD_STATE_CONFLICT', message: '이미 사용했거나 만료된 링크입니다.' },
          }),
        ],
        { type: 'application/json' }
      ),
    }
    requestMock.mockRejectedValue(error)

    const thrown = await downloadAdminFile({ fileObjectId: 31, fileName: 'IMG_2235.PNG' }).catch(
      (e: unknown) => e
    )

    expect((thrown as AxiosError<{ error: { code: string } }>).response?.data.error.code).toBe(
      'FILE_DOWNLOAD_STATE_CONFLICT'
    )
    expect(downloadBlobMock).not.toHaveBeenCalled()
  })
})
