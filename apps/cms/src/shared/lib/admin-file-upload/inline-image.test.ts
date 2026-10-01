import { describe, expect, it, vi } from 'vitest'
import { uploadAdminFileMaybeMock } from '@/shared/lib/admin-file-upload/upload-maybe-mock'
import {
  faqInlineImageOwner,
  mailTemplateInlineImageOwner,
  noticeInlineImageOwner,
  programInlineImageOwner,
  programPostInlineImageOwner,
  resolveRichTextInlineImageSrc,
  stripBlobImageSources,
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

  it('에디터에는 blob 미리보기를 주고 저장용 URL은 따로 둔다', async () => {
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const resolved = await resolveRichTextInlineImageSrc(file, programInlineImageOwner(null))
    expect(resolved.src.startsWith('blob:')).toBe(true)
    expect(resolved.persistSrc).toBe('/api/admin/files/42/content')
    URL.revokeObjectURL(resolved.src)
  })

  it('공지 신규는 ownerId 없이 업로드하지 않고 blob만 둔다', async () => {
    vi.mocked(uploadAdminFileMaybeMock).mockClear()
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    const resolved = await resolveRichTextInlineImageSrc(file, noticeInlineImageOwner(null))
    expect(resolved.src.startsWith('blob:')).toBe(true)
    expect(resolved.persistSrc).toBeUndefined()
    expect(uploadAdminFileMaybeMock).not.toHaveBeenCalled()
    URL.revokeObjectURL(resolved.src)
  })

  it('blob 이미지 마크업만 제거한다', () => {
    expect(
      stripBlobImageSources('안녕 ![a](blob:http://localhost/1) 하세요 <img src="blob:http://localhost/2" />')
        .replace(/\s+/g, ' ')
        .trim()
    ).toBe('안녕 하세요')
  })
})
