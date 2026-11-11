import { describe, expect, it } from 'vitest'
import { toProgramPostPlainText } from './post-content-plain-text'

describe('toProgramPostPlainText', () => {
  it('CMS 마크다운 본문의 서식 기호와 인라인 HTML을 걷어 낸다', () => {
    const markdown =
      '첫 문단\n\n**굵게** 와 <span style="color: #E53935">빨강</span>\n\n- 항목1\n- 항목2\n\n<p style="text-align: center">가운데</p>'
    expect(toProgramPostPlainText(markdown)).toBe('첫 문단\n\n굵게 와 빨강\n\n항목1\n항목2\n\n가운데')
  })

  it('홈페이지 HTML 본문의 태그를 걷어 내고 문단을 줄바꿈으로 남긴다', () => {
    const html =
      '<p>첫 문단</p><p><strong>굵게</strong> &amp; <mark style="background-color: #FFF59D">형광</mark></p><ul><li><p>항목</p></li></ul><img src="https://cdn.example.test/a.png">'
    expect(toProgramPostPlainText(html)).toBe('첫 문단\n굵게 & 형광\n항목')
  })

  it('이미지만 있는 본문은 빈 문자열이 된다', () => {
    expect(toProgramPostPlainText('![](https://cdn.example.test/a.png)')).toBe('')
  })
})
