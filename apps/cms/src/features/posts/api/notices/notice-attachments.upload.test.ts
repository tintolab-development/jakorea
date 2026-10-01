import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  customInstance: vi.fn(),
  uploadToS3: vi.fn(),
  confirmUpload: vi.fn(),
  waitUntilFileAvailable: vi.fn(),
  createSha256: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  customInstance: mocks.customInstance,
}))

vi.mock('@/shared/lib/admin-file-upload', async () => {
  const actual = await vi.importActual<typeof import('@/shared/lib/admin-file-upload')>(
    '@/shared/lib/admin-file-upload'
  )
  return {
    ...actual,
    createSha256: mocks.createSha256,
    uploadToS3: mocks.uploadToS3,
    confirmUpload: mocks.confirmUpload,
    waitUntilFileAvailable: mocks.waitUntilFileAvailable,
  }
})

import { uploadUnboundNoticeAttachment } from './notice-attachments'

describe('uploadUnboundNoticeAttachment', () => {
  beforeEach(() => {
    mocks.customInstance.mockReset()
    mocks.uploadToS3.mockReset()
    mocks.confirmUpload.mockReset()
    mocks.waitUntilFileAvailable.mockReset()
    mocks.createSha256.mockReset()
    mocks.createSha256.mockResolvedValue('ab'.repeat(32))
  })

  it('prepares with ownerId null and waits until the file is clean before returning', async () => {
    const order: string[] = []
    mocks.customInstance.mockImplementation(async () => {
      order.push('prepare')
      return {
        fileObjectId: 7,
        uploadUrl: 'https://files.example/upload',
        method: 'PUT',
        requiredHeaders: { 'Content-Type': 'application/pdf' },
        confirmPath: '/api/admin/files/7/confirm',
      }
    })
    mocks.uploadToS3.mockImplementation(async () => {
      order.push('put')
    })
    mocks.confirmUpload.mockImplementation(async () => {
      order.push('confirm')
      return { fileObjectId: 7, uploadStatus: 'CONFIRM_REQUESTED', scanStatus: 'PENDING_SCAN' }
    })
    mocks.waitUntilFileAvailable.mockImplementation(async () => {
      order.push('ready')
      return { fileObjectId: 7, uploadStatus: 'AVAILABLE', scanStatus: 'CLEAN' }
    })

    const file = new File(['pdf'], 'notice.pdf', { type: 'application/pdf' })
    await expect(uploadUnboundNoticeAttachment(file)).resolves.toBe(7)

    expect(order).toEqual(['prepare', 'put', 'confirm', 'ready'])
    expect(mocks.customInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/admin/files/upload-requests',
        method: 'POST',
        data: expect.objectContaining({
          ownerDomain: 'CONTENT',
          ownerType: 'NOTICE',
          ownerId: null,
          filePurpose: 'NOTICE_ATTACHMENT',
          originalFileName: 'notice.pdf',
          contentType: 'application/pdf',
        }),
      })
    )
    expect(mocks.uploadToS3).toHaveBeenCalledWith(
      'https://files.example/upload',
      file,
      { 'Content-Type': 'application/pdf' },
      'PUT'
    )
    expect(mocks.customInstance.mock.calls[0]?.[0].data.ownerId).toBeNull()
  })
})
