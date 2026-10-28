import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/shared/lib/admin-file-upload', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/lib/admin-file-upload')>()
  return { ...actual, uploadAdminFile: vi.fn() }
})

vi.mock('@/features/notifications/api/notifications-api-client', () => ({
  bindEmailAttachmentRemote: vi.fn(async () => ({})),
  unbindEmailAttachmentRemote: vi.fn(async () => ({})),
}))

import { uploadAdminFile } from '@/shared/lib/admin-file-upload'
import {
  bindEmailAttachmentRemote,
  unbindEmailAttachmentRemote,
} from '@/features/notifications/api/notifications-api-client'
import {
  smsMmsBatchFileOwner,
  smsMmsUploadErrorMessage,
  smsTemplateFileOwner,
  syncSmsTemplateAttachments,
  uploadSmsMmsImage,
} from './sms-template-attachments'

function jpeg(name: string, size = 10): File {
  return new File([new Uint8Array(size)], name, { type: 'image/jpeg' })
}

describe('MMS 첨부 업로드 계약', () => {
  beforeEach(() => {
    vi.mocked(uploadAdminFile).mockReset()
    vi.mocked(bindEmailAttachmentRemote).mockClear()
    vi.mocked(unbindEmailAttachmentRemote).mockClear()
    vi.stubGlobal(
      'createImageBitmap',
      vi.fn(async () => ({ width: 800, height: 600, close() {} }))
    )
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('발송 화면 owner: NOTIFICATION / MMS_BATCH / null / MMS_IMAGE', () => {
    expect(smsMmsBatchFileOwner()).toEqual({
      ownerDomain: 'NOTIFICATION',
      ownerType: 'MMS_BATCH',
      ownerId: null,
      filePurpose: 'MMS_IMAGE',
    })
  })

  it('템플릿 owner: NOTIFICATION / SMS_TEMPLATE / templateId / MMS_IMAGE', () => {
    expect(smsTemplateFileOwner(1001)).toEqual({
      ownerDomain: 'NOTIFICATION',
      ownerType: 'SMS_TEMPLATE',
      ownerId: 1001,
      filePurpose: 'MMS_IMAGE',
    })
  })

  it('업로드는 CLEAN/AVAILABLE까지 기다린다(waitUntilAvailable)', async () => {
    vi.mocked(uploadAdminFile).mockResolvedValue({ fileObjectId: 30001, checksumSha256: 'a'.repeat(64) })
    await expect(
      uploadSmsMmsImage({ file: jpeg('notice.jpg'), owner: smsMmsBatchFileOwner() })
    ).resolves.toEqual({ fileObjectId: 30001, fileName: 'notice.jpg' })
    expect(vi.mocked(uploadAdminFile).mock.calls[0]?.[0]).toMatchObject({
      waitUntilAvailable: true,
      owner: { ownerType: 'MMS_BATCH', ownerId: null },
    })
  })

  it('템플릿 첨부: 삭제(DELETE) 후 업로드·연결(POST {fileObjectId})', async () => {
    vi.mocked(uploadAdminFile).mockResolvedValue({ fileObjectId: 30002, checksumSha256: 'a'.repeat(64) })
    await syncSmsTemplateAttachments({
      templateId: 1001,
      newFiles: [jpeg('new.jpg')],
      removedAttachmentIds: [7],
      remaining: { count: 1, totalBytes: 100 },
    })
    expect(unbindEmailAttachmentRemote).toHaveBeenCalledWith(1001, 7)
    expect(vi.mocked(uploadAdminFile).mock.calls[0]?.[0].owner).toMatchObject({
      ownerType: 'SMS_TEMPLATE',
      ownerId: 1001,
    })
    expect(bindEmailAttachmentRemote).toHaveBeenCalledWith(1001, { fileObjectId: 30002 })
  })

  it('템플릿 첨부: 남은 첨부 포함 3개 이상이면 업로드하지 않는다', async () => {
    await expect(
      syncSmsTemplateAttachments({
        templateId: 1001,
        newFiles: [jpeg('c.jpg')],
        removedAttachmentIds: [],
        remaining: { count: 2, totalBytes: 100 },
      })
    ).rejects.toThrow('최대 2개')
    expect(uploadAdminFile).not.toHaveBeenCalled()
  })

  it('업로드 실패는 BE error.message 우선 + 재업로드 안내', () => {
    const error = {
      response: {
        status: 400,
        data: {
          success: false,
          error: {
            code: 'NOTIFICATION_MMS_ATTACHMENT_FORMAT_INVALID',
            message: 'BE 형식 오류',
          },
        },
      },
    }
    expect(smsMmsUploadErrorMessage(error)).toBe('BE 형식 오류\n파일을 다시 등록해 주세요.')
    expect(smsMmsUploadErrorMessage(new Error('파일 검사 실패'))).toContain('파일을 다시 등록해')
  })
})
