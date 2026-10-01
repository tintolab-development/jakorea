import { describe, expect, it } from 'vitest'
import { collectFileObjectIdsFromHtml, collectFileObjectIdsFromUnknown } from './program-inline-images'

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
