import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ENCRYPTED_ADMIN_FILE_ACCEPT, postEncryptedAdminFile } from './post-encrypted-admin-file'

function axiosStatusError(status: number) {
  const error = new AxiosError('request failed')
  error.response = {
    data: new Blob(['{}'], { type: 'application/json' }),
    status,
    statusText: 'Error',
    headers: {},
    config: { headers: {} } as InternalAxiosRequestConfig,
  }
  return error
}

const { request, downloadBlob } = vi.hoisted(() => ({
  request: vi.fn(),
  downloadBlob: vi.fn(),
}))

vi.mock('@/shared/instance/axios-instance', () => ({
  axiosClient: { request },
}))

vi.mock('@/shared/utils/file-download', async () => {
  const actual = await vi.importActual<typeof import('@/shared/utils/file-download')>(
    '@/shared/utils/file-download'
  )
  return {
    ...actual,
    downloadBlob,
  }
})

describe('postEncryptedAdminFile', () => {
  beforeEach(() => {
    request.mockReset()
    downloadBlob.mockReset()
  })

  it('POST blob에 JSON이 아닌 Accept를 넣는다', async () => {
    const blob = new Blob(['%PDF'], { type: 'application/pdf' })
    request.mockResolvedValue({
      data: blob,
      status: 200,
      headers: { 'content-disposition': 'attachment; filename="a.pdf"' },
    })

    await postEncryptedAdminFile({
      url: '/api/admin/settlements/1/payment-statement/download',
      password: 'Jafile1!',
      fallbackFileName: '지급조서_1.pdf',
    })

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        responseType: 'blob',
        headers: expect.objectContaining({
          Accept: ENCRYPTED_ADMIN_FILE_ACCEPT,
          'Content-Type': 'application/json',
        }),
        data: { password: 'Jafile1!' },
      })
    )
    expect(downloadBlob).toHaveBeenCalledWith(blob, 'a.pdf')
  })

  it('200 PDF는 filename*를 저장 파일명으로 쓴다', async () => {
    const blob = new Blob(['%PDF'], { type: 'application/pdf' })
    request.mockResolvedValue({
      data: blob,
      status: 200,
      headers: {
        'content-disposition': "attachment; filename*=UTF-8''%EC%A7%80%EA%B8%89%EC%A1%B0%EC%84%9C.pdf",
      },
    })

    await postEncryptedAdminFile({
      url: '/api/admin/settlements/1/payment-statement/download',
      password: 'Jafile1!',
      fallbackFileName: '지급조서_1.pdf',
    })

    expect(downloadBlob).toHaveBeenCalledWith(blob, '지급조서.pdf')
  })

  it('404/405일 때만 download-requests로 한 번 폴백한다', async () => {
    const blob = new Blob(['%PDF'], { type: 'application/pdf' })
    request
      .mockRejectedValueOnce(axiosStatusError(404))
      .mockResolvedValueOnce({
        data: blob,
        status: 200,
        headers: { 'content-disposition': "attachment; filename*=UTF-8''지급조서.pdf" },
      })

    await postEncryptedAdminFile({
      url: '/api/admin/settlements/1/payment-statement/download',
      password: 'Jafile1!',
      fallbackFileName: '지급조서_1.pdf',
      alternateUrls: ['/api/admin/settlements/1/payment-statement/download-requests'],
    })

    expect(request).toHaveBeenCalledTimes(2)
    expect(request.mock.calls[0][0].url).toBe(
      '/api/admin/settlements/1/payment-statement/download'
    )
    expect(request.mock.calls[1][0].url).toBe(
      '/api/admin/settlements/1/payment-statement/download-requests'
    )
    expect(downloadBlob).toHaveBeenCalled()
  })

  it('405도 download-requests로 한 번만 폴백한다', async () => {
    const blob = new Blob(['%PDF'], { type: 'application/pdf' })
    request.mockRejectedValueOnce(axiosStatusError(405)).mockResolvedValueOnce({
      data: blob,
      status: 200,
      headers: { 'content-disposition': 'attachment; filename="a.pdf"' },
    })

    await postEncryptedAdminFile({
      url: '/api/admin/settlements/1/payment-statement/download',
      password: 'Jafile1!',
      fallbackFileName: '지급조서_1.pdf',
      alternateUrls: ['/api/admin/settlements/1/payment-statement/download-requests'],
    })

    expect(request).toHaveBeenCalledTimes(2)
    expect(request.mock.calls[1][0].url).toBe(
      '/api/admin/settlements/1/payment-statement/download-requests'
    )
  })

  it('400 DOWNLOAD_PASSWORD_INVALID는 폴백하지 않고 error.code를 남긴다', async () => {
    const error = new AxiosError('request failed')
    error.response = {
      data: new Blob(
        [
          JSON.stringify({
            success: false,
            data: null,
            message:
              '파일 암호는 8자 이상이며 영문, 숫자, 특수문자를 포함하고 공백이 없어야 합니다.',
            error: { code: 'DOWNLOAD_PASSWORD_INVALID', field: 'password' },
          }),
        ],
        { type: 'application/json' }
      ),
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: {} } as InternalAxiosRequestConfig,
    }
    request.mockRejectedValueOnce(error)

    await expect(
      postEncryptedAdminFile({
        url: '/api/admin/settlements/1/payment-statement/download',
        password: 'Jafile1!',
        fallbackFileName: '지급조서_1.pdf',
        alternateUrls: ['/api/admin/settlements/1/payment-statement/download-requests'],
      })
    ).rejects.toMatchObject({
      response: {
        status: 400,
        data: {
          error: { code: 'DOWNLOAD_PASSWORD_INVALID', field: 'password' },
        },
      },
    })

    expect(request).toHaveBeenCalledTimes(1)
    expect(downloadBlob).not.toHaveBeenCalled()
  })

  it('406은 폴백하지 않는다', async () => {
    request.mockRejectedValueOnce(axiosStatusError(406))

    await expect(
      postEncryptedAdminFile({
        url: '/api/admin/settlements/1/payment-statement/download',
        password: 'Jafile1!',
        fallbackFileName: '지급조서_1.pdf',
        alternateUrls: ['/api/admin/settlements/1/payment-statement/download-requests'],
      })
    ).rejects.toMatchObject({ response: { status: 406 } })

    expect(request).toHaveBeenCalledTimes(1)
    expect(downloadBlob).not.toHaveBeenCalled()
  })

  it('200 JSON은 blob 저장하지 않는다', async () => {
    request.mockResolvedValueOnce({
      data: new Blob(
        [JSON.stringify({ downloadUrl: 'https://example.test/file.pdf' })],
        { type: 'application/json' }
      ),
      status: 200,
      headers: {},
    })

    await expect(
      postEncryptedAdminFile({
        url: '/api/admin/settlements/1/payment-statement/download',
        password: 'Jafile1!',
        fallbackFileName: '지급조서_1.pdf',
      })
    ).rejects.toBeTruthy()

    expect(downloadBlob).not.toHaveBeenCalled()
  })
})
