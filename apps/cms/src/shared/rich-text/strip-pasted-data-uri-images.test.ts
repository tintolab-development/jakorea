import { describe, expect, it } from 'vitest'
import { stripPastedDataUriImages } from '@jakorea/rich-text'

describe('stripPastedDataUriImages', () => {
  it('붙여넣은 base64 이미지 태그를 제거한다', () => {
    const html =
      '<p>안녕</p><img src="data:image/jpeg;base64,/9j/4AAQ" class="rich-text-content__image" /><p>뒤</p>'
    expect(stripPastedDataUriImages(html)).toBe('<p>안녕</p><p>뒤</p>')
  })

  it('업로드된 파일 URL 이미지는 남긴다', () => {
    const html = '<img src="/api/admin/files/12/content" alt="사진" />'
    expect(stripPastedDataUriImages(html)).toBe(html)
  })
})
