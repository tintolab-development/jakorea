import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  uploadUnboundNoticeAttachments: vi.fn(),
  linkNoticeAttachments: vi.fn(),
  uploadAndAttachNoticeFiles: vi.fn(),
  noticeUploadOwnerId: vi.fn(),
  createNoticeRemote: vi.fn(),
  updateNoticeRemote: vi.fn(),
}))

vi.mock('@/entities/user/api/auth-service', () => ({
  hasRemoteAdminJwt: () => true,
}))

vi.mock('@/shared/config/real-api-modules', () => ({
  isRealApiModuleEnabled: () => true,
}))

vi.mock('@/features/posts/api/notices/notices-api-client', () => ({
  createNoticeRemote: mocks.createNoticeRemote,
  updateNoticeRemote: mocks.updateNoticeRemote,
  deleteNoticeRemote: vi.fn(),
}))

vi.mock('@/features/posts/api/notices/notice-attachments', () => ({
  uploadUnboundNoticeAttachments: mocks.uploadUnboundNoticeAttachments,
  linkNoticeAttachments: mocks.linkNoticeAttachments,
  uploadAndAttachNoticeFiles: mocks.uploadAndAttachNoticeFiles,
  noticeUploadOwnerId: mocks.noticeUploadOwnerId,
  hydrateNoticeAttachments: vi.fn(),
}))

import type { Notice } from '@/data/mock/notices'
import type { BuildNoticeBodyParams } from '@/features/posts/model/notice-form-mapper'
import { createNotice, updateNotice } from './admin-notices-service'

function formParams(overrides: Partial<BuildNoticeBodyParams> = {}): BuildNoticeBodyParams {
  return {
    title: '제목',
    contentMarkdown: '본문',
    categoryId: 3,
    category: '일반',
    visibility: 'public',
    pinToTop: false,
    attachmentNames: [],
    author: '관리자',
    ...overrides,
  }
}

describe('notice attachment upload-first', () => {
  beforeEach(() => {
    mocks.uploadUnboundNoticeAttachments.mockReset()
    mocks.linkNoticeAttachments.mockReset()
    mocks.uploadAndAttachNoticeFiles.mockReset()
    mocks.noticeUploadOwnerId.mockReset()
    mocks.createNoticeRemote.mockReset()
    mocks.updateNoticeRemote.mockReset()
  })

  it('uploads unbound files before creating the notice and does not replace attachments', async () => {
    const order: string[] = []
    mocks.uploadUnboundNoticeAttachments.mockImplementation(async () => {
      order.push('upload')
      return [11, 12]
    })
    mocks.createNoticeRemote.mockImplementation(async () => {
      order.push('create')
      return { id: '9', title: '제목' }
    })

    await createNotice(
      formParams({
        newFiles: [new File(['a'], 'a.pdf', { type: 'application/pdf' })],
        attachmentNames: ['a.pdf'],
      })
    )

    expect(order).toEqual(['upload', 'create'])
    expect(mocks.createNoticeRemote).toHaveBeenCalledWith(
      expect.objectContaining({
        fileObjectIds: [11, 12],
        title: '제목',
      })
    )
    expect(mocks.createNoticeRemote.mock.calls[0]?.[0]).not.toHaveProperty('hasAttachment')
    expect(mocks.linkNoticeAttachments).not.toHaveBeenCalled()
  })

  it('reuses prepared fileObjectIds without uploading again', async () => {
    mocks.createNoticeRemote.mockResolvedValue({ id: '9', title: '제목' })

    await createNotice(formParams({ fileObjectIds: [5, 5], newFiles: [] }))

    expect(mocks.uploadUnboundNoticeAttachments).not.toHaveBeenCalled()
    expect(mocks.createNoticeRemote).toHaveBeenCalledWith(
      expect.objectContaining({ fileObjectIds: [5] })
    )
    expect(mocks.linkNoticeAttachments).not.toHaveBeenCalled()
  })

  it('replaces edit attachments with the full id list, including an empty list', async () => {
    const existing: Notice = {
      id: 'n1',
      resourceId: 42,
      title: '제목',
      content: '본문',
      category: '일반',
      categoryId: 3,
      createdAt: '2026-01-01T00:00:00Z',
      isImportant: false,
      viewCount: 0,
      hasAttachment: true,
      author: '관리자',
      status: 'published',
      attachments: [
        { name: 'a.pdf', fileObjectId: 1 },
        { name: 'b.pdf', fileObjectId: 2 },
      ],
    }
    mocks.noticeUploadOwnerId.mockReturnValue(42)
    mocks.updateNoticeRemote.mockResolvedValue({
      id: 'n1',
      title: '제목',
      hasAttachment: true,
    })
    mocks.linkNoticeAttachments.mockResolvedValue([])

    await updateNotice('n1', existing, formParams({ newFiles: [], retainedFileObjectIds: [] }))

    expect(mocks.uploadUnboundNoticeAttachments).not.toHaveBeenCalled()
    expect(mocks.uploadAndAttachNoticeFiles).not.toHaveBeenCalled()
    expect(mocks.linkNoticeAttachments).toHaveBeenCalledWith('n1', [])
  })

  it('uploads edit files with the notice owner and replaces the full attachment list', async () => {
    const existing: Notice = {
      id: 'n1',
      resourceId: 42,
      title: '제목',
      content: '본문',
      category: '일반',
      categoryId: 3,
      createdAt: '2026-01-01T00:00:00Z',
      isImportant: false,
      viewCount: 0,
      hasAttachment: true,
      author: '관리자',
      status: 'published',
      attachments: [{ name: 'a.pdf', fileObjectId: 1 }],
    }
    mocks.noticeUploadOwnerId.mockReturnValue(42)
    mocks.updateNoticeRemote.mockResolvedValue({ id: 'n1', title: '제목', hasAttachment: true })
    mocks.uploadAndAttachNoticeFiles.mockResolvedValue([{ name: 'c.pdf', fileObjectId: 3 }])
    mocks.linkNoticeAttachments.mockResolvedValue([
      { name: 'a.pdf', fileObjectId: 1 },
      { name: 'c.pdf', fileObjectId: 3 },
    ])

    await updateNotice(
      'n1',
      existing,
      formParams({
        newFiles: [new File(['c'], 'c.pdf', { type: 'application/pdf' })],
        retainedFileObjectIds: [1],
      })
    )

    expect(mocks.uploadUnboundNoticeAttachments).not.toHaveBeenCalled()
    expect(mocks.uploadAndAttachNoticeFiles).toHaveBeenCalledWith(42, [
      expect.objectContaining({ name: 'c.pdf' }),
    ])
    expect(mocks.linkNoticeAttachments).toHaveBeenCalledWith('n1', [1, 3])
  })
})
