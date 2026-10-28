import { describe, expect, it } from 'vitest'
import {
  collectFileObjectIdsFromHtml,
  collectFileObjectIdsFromUnknown,
  collectProgramInlineImageFileObjectIds,
  pickProgramInlineImageHtmlPatch,
  rewriteFileObjectIdsInUnknown,
} from './program-inline-images'

describe('collectFileObjectIdsFromHtml', () => {
  it('admin·portal content/download URL에서 id를 모은다', () => {
    expect(
      collectFileObjectIdsFromHtml(
        '<img src="/api/admin/files/42/content" /><img src="/api/portal/public/files/9/content?inline=1" /><img src="file-object:8" />'
      )
    ).toEqual([42, 9, 8])
  })

  it('중복과 잘못된 id는 버린다', () => {
    expect(
      collectFileObjectIdsFromHtml(
        '<img src="/api/admin/files/42/content" /><img src="/api/admin/files/42/download" />'
      )
    ).toEqual([42])
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
            recruitmentGuide: '<img src="/api/admin/files/8/content" />',
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
