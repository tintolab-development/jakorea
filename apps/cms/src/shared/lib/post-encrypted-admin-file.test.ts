import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ENCRYPTED_ADMIN_FILE_ACCEPT, postEncryptedAdminFile } from './post-encrypted-admin-file'

const { request, downloadBlob } = vi.hoisted(() => ({
  request: vi.fn(),
  downloadBlob: vi.fn(),
}))

vi.mock('@/shared/instance/axios-instance', () => ({
  axiosClient: { request },
}))

vi.mock('@/shared/utils/file-download', () => ({
  downloadBlob,
  fileNameFromContentDisposition: (_header: string | undefined, fallback: string) => fallback,
}))

vi.mock('@/shared/lib/admin-file-upload/attachments', () => ({
  hydrateAxiosBlobError: async (error: unknown) => error,
}))

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
    expect(downloadBlob).toHaveBeenCalled()
  })
})
