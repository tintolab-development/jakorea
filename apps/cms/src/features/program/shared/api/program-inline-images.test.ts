import { describe, expect, it } from 'vitest'
import {
  collectFileObjectIdsFromHtml,
  collectFileObjectIdsFromUnknown,
  collectProgramInlineImageFileObjectIds,
} from './program-inline-images'

describe('collectFileObjectIdsFromHtml', () => {
  it('admin·portal content/download URL에서 id를 모은다', () => {
    expect(
      collectFileObjectIdsFromHtml(
        '<img src="/api/admin/files/42/content" /><img src="/api/portal/public/files/9/content?inline=1" />'
      )
    ).toEqual([42, 9])
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
        recruitments: [
          {
            recruitmentGuide: '<img src="/api/admin/files/8/content" />',
            applicationMethod: '![x](/api/portal/public/files/9/content)',
          },
        ],
      })
    ).toEqual([7, 8, 9])
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
})
