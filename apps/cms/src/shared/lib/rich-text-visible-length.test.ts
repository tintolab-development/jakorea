import { describe, expect, it } from 'vitest'
import {
  countVisibleRichTextCharacters,
  referencedInlineFileIds,
} from '../../../../../packages/rich-text/src/core/visible-length'

describe('countVisibleRichTextCharacters', () => {
  it('태그와 주석을 빼고 엔티티와 이모지는 1자로 센다', () => {
    expect(countVisibleRichTextCharacters('<p>안녕하세요</p>')).toBe(5)
    expect(
      countVisibleRichTextCharacters(
        '<p><strong>A</strong>&nbsp;&amp;&#39;&#x1F600;</p>\n<!-- memo --><img src="/x.png">'
      )
    ).toBe(5)
    expect(countVisibleRichTextCharacters('😀😀')).toBe(2)
    expect(countVisibleRichTextCharacters(null)).toBe(0)
    expect('<p>안녕하세요</p>'.length).toBeGreaterThan(5)
  })

  it('외부 URL은 인라인 파일 합산에서 뺀다', () => {
    const html = [
      '<p><img src="/api/admin/files/101/content"></p>',
      '<p><img src="https://cdn.example.com/api/admin/files/x/content.png"></p>',
      '<p><img src="/api/portal/public/files/102/content"><img src="file-object:103"></p>',
      '<p><img src="https://images.example.com/photo.png"></p>',
    ].join('')
    expect(referencedInlineFileIds(html)).toEqual([101, 102, 103])
    expect(referencedInlineFileIds('<p>외부 이미지만</p>')).toEqual([])
  })
})
