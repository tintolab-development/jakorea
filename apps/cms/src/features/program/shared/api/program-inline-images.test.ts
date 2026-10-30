import { describe, expect, it } from 'vitest'
import {
  collectFileObjectIdsFromHtml,
  collectFileObjectIdsFromUnknown,
  collectProgramInlineImageFileObjectIds,
  hasProgramInlineImageContent,
  isProgramInlineImageAuxiliaryPatch,
  resolveProgramInlineImagePut,
  pickProgramInlineImageHtmlPatch,
  rewriteFileObjectIdsInUnknown,
} from './program-inline-images'

describe('collectFileObjectIdsFromHtml', () => {
  it('admin·portal content URL과 file-object 참조를 표시 순서로 모은다', () => {
    expect(
      collectFileObjectIdsFromHtml(
        '<img src="file-object:15" /><img src="/api/admin/files/42/content" /><img src="/api/portal/public/files/9/content?inline=1" />'
      )
    ).toEqual([15, 42, 9])
    expect(
      collectFileObjectIdsFromHtml(
        '<img src="/api/admin/files/42/content" /><img src="/api/portal/public/files/9/content?inline=1" /><img src="file-object:8" />'
      )
    ).toEqual([42, 9, 8])
  })

  it('중복과 잘못된 id는 버리고 순서는 유지한다', () => {
    expect(
      collectFileObjectIdsFromHtml(
        '<img src="/api/admin/files/42/content" /><img src="file-object:42" /><img src="/api/admin/files/7/content" />'
      )
    ).toEqual([42, 7])
  })

  it('썸네일·첨부 URL은 img가 아니면 모으지 않는다', () => {
    expect(
      collectFileObjectIdsFromHtml(
        '<p>파일 /api/admin/files/2055808/content</p><a href="/api/admin/files/9/download">x</a>'
      )
    ).toEqual([])
  })

  it('markdown 이미지도 모은다', () => {
    expect(collectFileObjectIdsFromHtml('![x](/api/admin/files/8/content)')).toEqual([8])
    expect(collectFileObjectIdsFromHtml('![x](file-object:11)')).toEqual([11])
  })
})

describe('collectFileObjectIdsFromUnknown', () => {
  it('썸네일·첨부 URL은 인라인 이미지로 모으지 않는다', () => {
    expect(
      collectFileObjectIdsFromUnknown({
        additionalContentHtml: '<p><img src="/api/admin/files/7/content" /></p>',
        thumbContentUrl: '/api/admin/files/2055808/content',
        attachmentUrl: '/api/admin/files/2055810/download',
      })
    ).toEqual([7])
  })

  it('중첩 HTML 필드에서 id를 모은다', () => {
    expect(
      collectFileObjectIdsFromUnknown({
        additionalContentHtml: '<img src="/api/admin/files/7/content" />',
        nested: { applicationMethod: '![x](/api/admin/files/8/content)' },
      })
    ).toEqual([7, 8])
  })
})

describe('collectProgramInlineImageFileObjectIds', () => {
  it('프로그램 rich-text 필드의 이미지 id만 모은다', () => {
    expect(
      collectProgramInlineImageFileObjectIds({
        additionalContentHtml: '<img src="/api/admin/files/7/content" />',
        additionalContentMarkdown: '<img src="file-object:13" />',
        recruitments: [
          {
            recruitmentGuide: '<img src="file-object:8" />',
            applicationMethod: '![x](/api/portal/public/files/9/content)',
          },
        ],
      })
    ).toEqual([7, 13, 8, 9])
  })

  it('썸네일·첨부 파일 URL은 inline image 바인딩 대상에서 제외한다', () => {
    expect(
      collectProgramInlineImageFileObjectIds({
        keyVisualImage: '/api/admin/files/100/content',
        thumbContentUrl: '/api/admin/files/101/content',
        fileUrl: '/api/admin/files/102/content',
        downloadPath: '/api/admin/files/103/download',
        attachmentFileObjectIds: [104],
        additionalContentHtml: '<img src="/api/admin/files/7/content" />',
      })
    ).toEqual([7])
  })

  it('PATCH 응답의 비본문 필드를 합치지 않고 저장 본문만 모은다', () => {
    const payload = {
      additionalContentHtml: '<img src="file-object:7" />',
    }
    const patchEcho = {
      ...payload,
      keyVisualImage: '/api/admin/files/100/content',
      description: '<img src="/api/admin/files/999/content" />',
    }
    expect(collectProgramInlineImageFileObjectIds(payload)).toEqual([7])
    expect(collectProgramInlineImageFileObjectIds([payload, patchEcho])).toEqual([7, 999])
  })

  it('serviceDetailJson 내부에서도 rich-text overlay 키만 모은다', () => {
    expect(
      collectProgramInlineImageFileObjectIds({
        serviceDetailJson: JSON.stringify({
          registrationOverlay: {
            'recruit.detailInfo.recruitmentGuide': '<img src="/api/admin/files/11/content" />',
            'recruit.detailInfo.thumbContentUrl': '/api/admin/files/12/content',
            'recruit.detailInfo.attachmentFileNames': ['guide.pdf'],
          },
        }),
      })
    ).toEqual([11])
  })

  it('제미나이 persist snapshot의 에디터 HTML만 모으고 썸네일 id는 제외한다', () => {
    expect(
      collectProgramInlineImageFileObjectIds({
        description: '소개',
        recruitmentGuide: '<p><img src="/api/admin/files/2056225/content" /></p>',
        keyVisualImage: 'thumb.png',
        attachmentFileNames: ['guide.pdf'],
        serviceDetailJson: JSON.stringify({
          geminiRecruitment: {
            thumbnailFileName: 'thumb.png',
            programDescription: '소개',
            recruitmentGuide: '<p><img src="/api/admin/files/2056225/content" /></p>',
            attachmentFileNames: ['guide.pdf'],
          },
        }),
      })
    ).toEqual([2056225])
  })

  it('루트 모집안내에만 이미지가 있고 모집 행 HTML이 null이어도 id를 모은다', () => {
    expect(
      collectProgramInlineImageFileObjectIds({
        recruitmentGuide:
          '<p><img src="/api/portal/public/files/2056219/content?inline=1" alt="jakorea.png" /></p>',
        recruitments: [
          {
            recruitmentId: 186912,
            applicationTypes: ['ORGANIZATION'],
            recruitmentGuide: null,
            additionalContentHtml: null,
          },
          {
            recruitmentId: 186913,
            applicationTypes: ['INSTRUCTOR'],
            recruitmentGuide: null,
            additionalContentHtml: null,
          },
        ],
      })
    ).toEqual([2056219])
  })
})

describe('pickProgramInlineImageHtmlPatch', () => {
  it('이미지가 있는 본문 필드만 고른다', () => {
    expect(
      pickProgramInlineImageHtmlPatch({
        title: '공고',
        description: '참여 기관이 희망 일정을 요청하면 강사가 방문합니다.',
        recruitmentGuide: '<p><img src="/api/admin/files/2056231/content" alt="jakorea.png" /></p>',
        otherMatters: '희망 연수일은 연수 요청 가능기간 안에서 조율합니다.',
        serviceDetailJson: JSON.stringify({
          geminiRecruitment: {
            recruitmentGuide:
              '<p><img src="/api/admin/files/2056231/content" alt="jakorea.png" /></p>',
          },
        }),
        keyVisualImage: 'thumb.png',
        recruitments: [
          {
            recruitTerm: 'FIRST_HALF',
            recruitmentGuide: '<p><img src="/api/admin/files/2056231/content" /></p>',
          },
        ],
      })
    ).toEqual({
      recruitmentGuide: '<p><img src="/api/admin/files/2056231/content" alt="jakorea.png" /></p>',
      serviceDetailJson: JSON.stringify({
        geminiRecruitment: {
          recruitmentGuide:
            '<p><img src="/api/admin/files/2056231/content" alt="jakorea.png" /></p>',
        },
      }),
    })
  })
})

describe('rewriteFileObjectIdsInUnknown', () => {
  it('본문 HTML과 serviceDetailJson의 file id를 함께 바꾼다', () => {
    const rewritten = rewriteFileObjectIdsInUnknown(
      {
        recruitmentGuide: '<img src="/api/admin/files/9/content" />',
        serviceDetailJson: JSON.stringify({
          geminiRecruitment: {
            recruitmentGuide: '<img src="file-object:9" />',
          },
        }),
      },
      new Map([[9, 88]])
    ) as { recruitmentGuide: string; serviceDetailJson: string }
    expect(rewritten.recruitmentGuide).toBe('<img src="/api/admin/files/88/content" />')
    expect(JSON.parse(rewritten.serviceDetailJson)).toEqual({
      geminiRecruitment: { recruitmentGuide: '<img src="file-object:88" />' },
    })
  })
})

describe('resolveProgramInlineImagePut', () => {
  it('생성은 본문 이미지가 있을 때만 PUT한다', () => {
    expect(
      resolveProgramInlineImagePut({ title: '없음' }, 'create')
    ).toEqual({ fileObjectIds: [], shouldPut: false })
    expect(
      resolveProgramInlineImagePut(
        { additionalContentHtml: '<img src="file-object:3" />' },
        'create'
      )
    ).toEqual({ fileObjectIds: [3], shouldPut: true })
  })

  it('수정에서 본문 이미지를 모두 지우면 빈 배열 PUT이다', () => {
    expect(
      resolveProgramInlineImagePut({ additionalContentHtml: '<p></p>' }, 'update')
    ).toEqual({ fileObjectIds: [], shouldPut: true })
  })

  it('모집 nested 보조 PATCH는 본문 이미지 PUT을 건너뛴다', () => {
    expect(
      isProgramInlineImageAuxiliaryPatch({
        serviceDetailJson: '{"registrationOverlay":{}}',
        targetLevels: ['elementary'],
      })
    ).toBe(true)
    expect(
      resolveProgramInlineImagePut(
        {
          serviceDetailJson: JSON.stringify({
            registrationOverlay: {
              'recruit.detailInfo.recruitmentGuide': '<img src="file-object:4" />',
            },
          }),
        },
        'update'
      ).shouldPut
    ).toBe(false)
  })

  it('본문 필드가 없는 수정은 PUT하지 않는다', () => {
    expect(hasProgramInlineImageContent({ title: '이름만' })).toBe(false)
    expect(resolveProgramInlineImagePut({ title: '이름만' }, 'update').shouldPut).toBe(false)
  })
})
