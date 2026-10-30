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
  bindUjatRecruitDetailMediaToRows,
  isEphemeralThumbPreviewUrl,
  pickRecruitmentCreateMediaOverlay,
  readRecruitDetailMediaFromOverlay,
  recruitDetailInfoPrefixesForPreviewAudience,
  recruitmentCreateMediaFieldsFromOverlay,
  resolveRecruitDetailThumbFileObjectId,
  withRecruitmentCreateMedia,
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

  it('keeps instructor preview prefixes off the participant overlay', () => {
    expect(recruitDetailInfoPrefixesForPreviewAudience('instructors')).toEqual([
      'recruitInstructor.detailInfo',
    ])
    const media = readRecruitDetailMediaFromOverlay(
      {
        'recruit.detailInfo.thumbFileObjectId': 301,
        'recruitInstructor.detailInfo.thumbFileObjectId': 302,
      },
      recruitDetailInfoPrefixesForPreviewAudience('instructors')
    )
    expect(media.thumbFileObjectId).toBe(302)
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

describe('recruitmentCreateMediaFieldsFromOverlay', () => {
  it('일반 참여자·강사 행에 확인된 fileObjectId만 싣는다', () => {
    const overlay = {
      'recruit.detailInfo.thumbFileObjectId': 301,
      'recruit.detailInfo.thumbObjectUrl': 'blob:http://localhost/preview',
      'recruit.detailInfo.attachmentFileObjectIds': [401],
      'recruitInstructor.detailInfo.thumbFileObjectId': 302,
      'recruitInstructor.detailInfo.attachmentFileObjectIds': [402, 403],
    }
    expect(
      recruitmentCreateMediaFieldsFromOverlay(
        overlay,
        { recruitmentType: 'PARTICIPANT', targetType: 'ORGANIZATION' },
        'general'
      )
    ).toEqual({ thumbnailFileObjectId: 301, attachmentFileObjectIds: [401] })
    expect(
      recruitmentCreateMediaFieldsFromOverlay(
        overlay,
        { recruitmentType: 'INSTRUCTOR', targetType: 'TEACHER' },
        'general'
      )
    ).toEqual({ thumbnailFileObjectId: 302, attachmentFileObjectIds: [402, 403] })
  })

  it('UJAT는 recruitmentType·recruitTerm으로 행을 매칭하고 인덱스를 쓰지 않는다', () => {
    const overlay = {
      'ujatRecruit.detailInfo.thumbFileObjectId': 501,
      'ujatRecruit.detailInfo.attachmentFileObjectIds': [601],
      'recruitVolunteer.h1.detailInfo.thumbFileObjectId': 502,
      'recruitVolunteer.h2.detailInfo.attachmentFileObjectIds': [603, 604],
    }
    expect(
      recruitmentCreateMediaFieldsFromOverlay(
        overlay,
        { recruitmentType: 'PARTICIPANT', targetType: 'ORGANIZATION' },
        'ujat'
      )
    ).toEqual({ thumbnailFileObjectId: 501, attachmentFileObjectIds: [601] })
    expect(
      recruitmentCreateMediaFieldsFromOverlay(
        overlay,
        { recruitmentType: 'VOLUNTEER', recruitTerm: 'FIRST_HALF' },
        'ujat'
      )
    ).toEqual({ thumbnailFileObjectId: 502 })
    expect(
      recruitmentCreateMediaFieldsFromOverlay(
        overlay,
        { recruitmentType: 'VOLUNTEER', recruitTerm: 'SECOND_HALF' },
        'ujat'
      )
    ).toEqual({ attachmentFileObjectIds: [603, 604] })
  })

  it('typed 행 thumbnailFileObjectId가 overlay보다 우선한다', () => {
    const rows = withRecruitmentCreateMedia(
      [
        {
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'FIRST_HALF',
          thumbnailFileObjectId: 777,
          attachments: [{ fileObjectId: 888 }],
        },
      ],
      {
        'recruitVolunteer.h1.detailInfo.thumbFileObjectId': 502,
        'recruitVolunteer.h1.detailInfo.attachmentFileObjectIds': [603],
      },
      'ujat'
    )
    expect(rows?.[0]).toMatchObject({
      thumbnailFileObjectId: 777,
      attachmentFileObjectIds: [888],
    })
  })

  it('미완료 blob만 있으면 생성 요청 미디어 필드를 생략한다', () => {
    expect(
      recruitmentCreateMediaFieldsFromOverlay(
        {
          'recruit.detailInfo.thumbObjectUrl': 'blob:http://localhost/preview',
          'recruit.detailInfo.thumbContentUrl': 'blob:http://localhost/preview',
        },
        { recruitmentType: 'PARTICIPANT', targetType: 'INDIVIDUAL' },
        'general'
      )
    ).toEqual({})
  })

  it('blob 미리보기 키는 생성 미디어 overlay에서 뺀다', () => {
    expect(
      pickRecruitmentCreateMediaOverlay({
        'recruit.detailInfo.thumbFileObjectId': 77,
        'recruit.detailInfo.thumbObjectUrl': 'blob:http://localhost/preview',
        'recruit.detailInfo.thumbContentUrl': 'blob:http://localhost/preview',
        'ujat.recruit.institution.publicTitle': '기관 모집',
      })
    ).toEqual({
      'recruit.detailInfo.thumbFileObjectId': 77,
    })
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

describe('bindUjatRecruitDetailMediaToRows', () => {
  beforeEach(() => {
    vi.mocked(putProgramRecruitmentThumbnail).mockClear()
    vi.mocked(putProgramRecruitmentAttachments).mockClear()
  })

  it('기관·봉사자 상반기·하반기 overlay를 recruitTerm별 row에 각각 PUT 한다', async () => {
    await bindUjatRecruitDetailMediaToRows(
      {
        id: '186200',
        programRecruitments: [
          { id: 31, recruitmentType: 'PARTICIPANT', applicationType: 'ORGANIZATION' },
          { id: 32, recruitmentType: 'VOLUNTEER', recruitTerm: 'FIRST_HALF' },
          { id: 33, recruitmentType: 'VOLUNTEER', recruitTerm: 'SECOND_HALF' },
        ],
      },
      {
        'ujatRecruit.detailInfo.thumbFileObjectId': 501,
        'ujatRecruit.detailInfo.attachmentFileObjectIds': [601],
        'recruitVolunteer.h1.detailInfo.thumbFileObjectId': 502,
        'recruitVolunteer.h1.detailInfo.attachmentFileObjectIds': [602],
        'recruitVolunteer.h2.detailInfo.thumbFileObjectId': 503,
        'recruitVolunteer.h2.detailInfo.attachmentFileObjectIds': [603, 604],
      }
    )

    expect(putProgramRecruitmentThumbnail).toHaveBeenNthCalledWith(1, 186200, 31, 501)
    expect(putProgramRecruitmentAttachments).toHaveBeenNthCalledWith(1, 186200, 31, [601])
    expect(putProgramRecruitmentThumbnail).toHaveBeenNthCalledWith(2, 186200, 32, 502)
    expect(putProgramRecruitmentAttachments).toHaveBeenNthCalledWith(2, 186200, 32, [602])
    expect(putProgramRecruitmentThumbnail).toHaveBeenNthCalledWith(3, 186200, 33, 503)
    expect(putProgramRecruitmentAttachments).toHaveBeenNthCalledWith(3, 186200, 33, [603, 604])
  })

  it('기관 row는 PARTICIPANT만으로 매칭하지 않고 ORGANIZATION 신청 유형까지 확인한다', async () => {
    await expect(
      bindUjatRecruitDetailMediaToRows(
        {
          id: '186202',
          programRecruitments: [
            { id: 51, recruitmentType: 'PARTICIPANT', applicationType: 'INDIVIDUAL' },
          ],
        },
        { 'ujatRecruit.detailInfo.thumbFileObjectId': 801 }
      )
    ).rejects.toThrow('ujatRecruit.detailInfo')
  })

  it('미디어가 있는 반기의 row가 없으면 연결 실패로 처리한다', async () => {
    await expect(
      bindUjatRecruitDetailMediaToRows(
        {
          id: '186201',
          programRecruitments: [{ id: 41, recruitmentType: 'PARTICIPANT' }],
        },
        { 'recruitVolunteer.h2.detailInfo.thumbFileObjectId': 701 }
      )
    ).rejects.toThrow('recruitVolunteer.h2.detailInfo')
  })
})
