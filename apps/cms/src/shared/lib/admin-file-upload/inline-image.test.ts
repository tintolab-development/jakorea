import { describe, expect, it, vi } from 'vitest'
import { uploadAdminFileMaybeMock } from '@/shared/lib/admin-file-upload/upload-maybe-mock'
import {
  faqInlineImageOwner,
  mailTemplateInlineImageOwner,
  noticeInlineImageOwner,
  programInlineImageOwner,
  programPostInlineImageOwner,
  resolveRichTextInlineImageSrc,
} from '@/shared/lib/admin-file-upload/inline-image'

vi.mock('@/shared/lib/admin-file-upload/upload-maybe-mock', () => ({
  contentUrlForFileObjectId: (id: number) => `/api/admin/files/${id}/content`,
  uploadAdminFileMaybeMock: vi.fn(async () => ({ fileObjectId: 42, checksumSha256: 'a'.repeat(64) })),
}))

describe('rich-text inline image owners', () => {
  it('신규 작성은 ownerId를 null로 둔다', () => {
    expect(noticeInlineImageOwner(null).ownerId).toBeNull()
    expect(faqInlineImageOwner(null).ownerId).toBeNull()
    expect(programInlineImageOwner(null).ownerId).toBeNull()
    expect(programPostInlineImageOwner(null).ownerId).toBeNull()
    expect(mailTemplateInlineImageOwner(null).ownerId).toBeNull()
  })

  it('용도별 purpose를 유지한다', () => {
    expect(noticeInlineImageOwner(12).filePurpose).toBe('NOTICE_INLINE_IMAGE')
    expect(faqInlineImageOwner(12).filePurpose).toBe('FAQ_INLINE_IMAGE')
    expect(programInlineImageOwner(12).filePurpose).toBe('PROGRAM_INLINE_IMAGE')
    expect(programPostInlineImageOwner(12).filePurpose).toBe('PROGRAM_POST_INLINE_IMAGE')
    expect(mailTemplateInlineImageOwner(12).filePurpose).toBe('MAIL_TEMPLATE_ATTACHMENT')
  })

  it('프로그램 본문 이미지는 PROGRAM_CONTENT/PROGRAM 과 수정 시 programId를 쓴다', () => {
    expect(programInlineImageOwner(null)).toMatchObject({
      ownerDomain: 'PROGRAM_CONTENT',
      ownerType: 'PROGRAM',
      ownerId: null,
      filePurpose: 'PROGRAM_INLINE_IMAGE',
    })
    expect(programInlineImageOwner(12)).toMatchObject({
      ownerDomain: 'PROGRAM_CONTENT',
      ownerType: 'PROGRAM',
      ownerId: 12,
      filePurpose: 'PROGRAM_INLINE_IMAGE',
    })
  })

  it('에디터에는 blob 미리보기를 주고 저장용 URL은 따로 둔다', async () => {
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const resolved = await resolveRichTextInlineImageSrc(file, programInlineImageOwner(null))
    expect(resolved.src.startsWith('blob:')).toBe(true)
    expect(resolved.persistSrc).toBe('/api/admin/files/42/content')
    URL.revokeObjectURL(resolved.src)
  })

  it('공지 신규도 ownerId null로 즉시 업로드한다', async () => {
    vi.mocked(uploadAdminFileMaybeMock).mockClear()
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const owner = noticeInlineImageOwner(null)
    const resolved = await resolveRichTextInlineImageSrc(file, owner)
    expect(resolved.src.startsWith('blob:')).toBe(true)
    expect(resolved.persistSrc).toBe('/api/admin/files/42/content')
    expect(uploadAdminFileMaybeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        file,
        owner,
        waitUntilAvailable: true,
      })
    )
    URL.revokeObjectURL(resolved.src)
  })
})
