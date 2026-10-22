import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/features/program/shared/api/program-thumbnail', () => ({
  putProgramThumbnail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/features/program/shared/api/program-attachments', () => ({
  putProgramAttachments: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/features/program/shared/api/program-recruitment-rows', () => ({
  putProgramRecruitmentThumbnail: vi.fn().mockResolvedValue({}),
  putProgramRecruitmentAttachments: vi.fn().mockResolvedValue([]),
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
import {
  putProgramRecruitmentAttachments,
  putProgramRecruitmentThumbnail,
} from '@/features/program/shared/api/program-recruitment-rows'
import { putProgramThumbnail } from '@/features/program/shared/api/program-thumbnail'
import {
  bindGeneralRecruitDetailMediaToRows,
  bindRecruitDetailMediaAfterProgramCreate,
  isEphemeralThumbPreviewUrl,
  readRecruitDetailMediaFromOverlay,
  resolveRecruitDetailThumbFileObjectId,
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

  it('resolves thumbFileObjectId from content URL when overlay id is missing', () => {
    const media = readRecruitDetailMediaFromOverlay({
      'recruit.detailInfo.thumbContentUrl': '/api/admin/files/77/content',
      'recruit.detailInfo.thumbFileName': 'poster.png',
    })
    expect(media.thumbFileObjectId).toBe(77)
    expect(media.keyVisualImage).toBe('/api/admin/files/77/content')
  })
})

describe('resolveRecruitDetailThumbFileObjectId', () => {
  it('prefers numeric overlay id over content URL', () => {
    expect(
      resolveRecruitDetailThumbFileObjectId(9, '/api/admin/files/77/content')
    ).toBe(9)
  })

  it('parses id from content URL', () => {
    expect(
      resolveRecruitDetailThumbFileObjectId(null, '/api/admin/files/77/content')
    ).toBe(77)
  })

  it('ignores blob preview URLs', () => {
    expect(
      resolveRecruitDetailThumbFileObjectId(null, 'blob:http://localhost/preview')
    ).toBeUndefined()
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

describe('bindGeneralRecruitDetailMediaToRows', () => {
  beforeEach(() => {
    vi.mocked(putProgramThumbnail).mockClear()
    vi.mocked(putProgramAttachments).mockClear()
    vi.mocked(putProgramRecruitmentThumbnail).mockClear()
    vi.mocked(putProgramRecruitmentAttachments).mockClear()
  })

  it('참여자·강사 모집 행에 draft fileObjectId를 각각 PUT 한다', async () => {
    await bindGeneralRecruitDetailMediaToRows(
      {
        id: '186100',
        programRecruitments: [
          { id: 11, recruitmentType: 'PARTICIPANT' },
          { id: 22, recruitmentType: 'INSTRUCTOR' },
        ],
      },
      {
        'recruit.detailInfo.thumbFileObjectId': 301,
        'recruit.detailInfo.attachmentFileObjectIds': [401],
        'recruitInstructor.detailInfo.thumbFileObjectId': 302,
        'recruitInstructor.detailInfo.attachmentFileObjectIds': [402, 403],
      }
    )
    expect(putProgramRecruitmentThumbnail).toHaveBeenCalledWith(186100, 11, 301)
    expect(putProgramRecruitmentAttachments).toHaveBeenCalledWith(186100, 11, [401])
    expect(putProgramRecruitmentThumbnail).toHaveBeenCalledWith(186100, 22, 302)
    expect(putProgramRecruitmentAttachments).toHaveBeenCalledWith(186100, 22, [402, 403])
    expect(putProgramThumbnail).not.toHaveBeenCalled()
    expect(putProgramAttachments).not.toHaveBeenCalled()
  })

  it('모집 행 id가 없으면 프로그램 단위 PUT으로 바인딩한다', async () => {
    await bindGeneralRecruitDetailMediaToRows(
      { id: '186101', programRecruitments: [] },
      {
        'recruit.detailInfo.thumbFileObjectId': 88,
        'recruit.detailInfo.attachmentFileObjectIds': [99],
      }
    )
    expect(putProgramThumbnail).toHaveBeenCalledWith(186101, 88)
    expect(putProgramAttachments).toHaveBeenCalledWith(186101, [99])
    expect(putProgramRecruitmentThumbnail).not.toHaveBeenCalled()
  })
})
