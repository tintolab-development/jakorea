import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/features/program/shared/api/program-thumbnail', () => ({
  putProgramThumbnail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/features/program/shared/api/program-attachments', () => ({
  putProgramAttachments: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/shared/lib/admin-file-upload', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/lib/admin-file-upload')>()
  return {
    ...actual,
    parseFileObjectId: (value: unknown) => {
      const n = Number(value)
      return Number.isFinite(n) && n > 0 ? n : null
    },
  }
})

import { putProgramAttachments } from '@/features/program/shared/api/program-attachments'
import { putProgramThumbnail } from '@/features/program/shared/api/program-thumbnail'
import {
  bindRecruitDetailMediaAfterProgramCreate,
  isEphemeralThumbPreviewUrl,
  readRecruitDetailMediaFromOverlay,
} from './recruit-detail-info-media'

describe('isEphemeralThumbPreviewUrl', () => {
  it('blob 주소만 세션용으로 본다', () => {
    expect(isEphemeralThumbPreviewUrl('blob:http://localhost/preview')).toBe(true)
    expect(isEphemeralThumbPreviewUrl('/api/admin/files/1/content')).toBe(false)
    expect(isEphemeralThumbPreviewUrl(null)).toBe(false)
  })
})

describe('readRecruitDetailMediaFromOverlay', () => {
  it('reads trainedTeachers prefix thumb and attachments', () => {
    const media = readRecruitDetailMediaFromOverlay({
      'trainedTeachersRecruit.detailInfo.thumbContentUrl': '/api/admin/files/42/content',
      'trainedTeachersRecruit.detailInfo.thumbFileObjectId': 42,
      'trainedTeachersRecruit.detailInfo.attachmentFileNames': ['a.pdf', 'b.pdf'],
      'trainedTeachersRecruit.detailInfo.attachmentFileObjectIds': [101, 102],
    })
    expect(media.keyVisualImage).toBe('/api/admin/files/42/content')
    expect(media.thumbFileObjectId).toBe(42)
    expect(media.thumbFileName).toBeUndefined()
    expect(media.attachmentFileNames).toEqual(['a.pdf', 'b.pdf'])
    expect(media.attachmentFileObjectIds).toEqual([101, 102])
  })

  it('ignores blob preview urls for keyVisualImage but keeps thumbObjectUrl', () => {
    const media = readRecruitDetailMediaFromOverlay({
      'recruit.detailInfo.thumbContentUrl': 'blob:http://localhost/preview',
      'recruit.detailInfo.thumbObjectUrl': 'blob:http://localhost/preview',
      'recruit.detailInfo.thumbFileObjectId': 9,
    })
    expect(media.keyVisualImage).toBeUndefined()
    expect(media.thumbObjectUrl).toBe('blob:http://localhost/preview')
    expect(media.thumbFileObjectId).toBe(9)
  })

  it('reads thumbFileName from recruit.detailInfo overlay', () => {
    const media = readRecruitDetailMediaFromOverlay({
      'recruit.detailInfo.thumbFileObjectId': 2055850,
      'recruit.detailInfo.thumbFileName': 'KakaoTalk_Photo_2026-09-23-15-45-05 (1) (1).jpeg',
    })
    expect(media.thumbFileObjectId).toBe(2055850)
    expect(media.thumbFileName).toBe('KakaoTalk_Photo_2026-09-23-15-45-05 (1) (1).jpeg')
  })
})

describe('bindRecruitDetailMediaAfterProgramCreate', () => {
  beforeEach(() => {
    vi.mocked(putProgramThumbnail).mockClear()
    vi.mocked(putProgramAttachments).mockClear()
  })

  it('puts thumbnail and replaces program attachments', async () => {
    await bindRecruitDetailMediaAfterProgramCreate('186005', {
      'trainedTeachersRecruit.detailInfo.thumbFileObjectId': 42,
      'trainedTeachersRecruit.detailInfo.attachmentFileObjectIds': [101, 102],
    })
    expect(putProgramThumbnail).toHaveBeenCalledWith(186005, 42)
    expect(putProgramAttachments).toHaveBeenCalledWith(186005, [101, 102])
  })
})
