import { describe, expect, it } from 'vitest'
import { applyMailPreviewBody } from '../mail-template/preview'
import {
  isMailEditorBodyUntouchedFromPlainTemplate,
  isPlainTextMailBody,
  keepEmptyMailParagraphLines,
  mailHtmlEmptyLinesForEditor,
  mailBodyToDisplayHtml,
  mailBodyToEditorHtml,
  renderPlainMailBodyAfterSubstitute,
} from './mail-body-display-html'

describe('isPlainTextMailBody (BE block-tag rule)', () => {
  it('is plain without p/br/div/li/table/h1-6', () => {
    expect(isPlainTextMailBody('안녕\n#{회원명}')).toBe(true)
    expect(isPlainTextMailBody('<strong>a</strong>\nb')).toBe(true)
  })
  it.each(['<p>a</p>', 'a<br>b', 'a<BR/>b', '<div>a</div>', '<ul><li>a</li></ul>', '<table></table>', '<h2>t</h2>'])(
    'is HTML for %s',
    html => {
      expect(isPlainTextMailBody(html)).toBe(false)
    }
  )
  it('empty is not plain', () => {
    expect(isPlainTextMailBody('')).toBe(false)
    expect(isPlainTextMailBody('  \n ')).toBe(false)
  })
})

describe('plain body → <br> (matches BE renderedContent)', () => {
  it('BE example with substituted values', () => {
    const template = '안녕하세요 #{회원명}님\n프로그램: #{프로그램명}'
    const substituted = template.replace('#{회원명}', '홍길동').replace('#{프로그램명}', 'JA 봉사')
    expect(renderPlainMailBodyAfterSubstitute(substituted)).toBe(
      '안녕하세요 홍길동님<br>프로그램: JA 봉사'
    )
  })
  it('escapes special characters in values and fixed text, incl. quotes and CRLF', () => {
    expect(renderPlainMailBodyAfterSubstitute('<b>&')).toBe('&lt;b&gt;&amp;')
    expect(renderPlainMailBodyAfterSubstitute('a "b" \'c\'\r\nd')).toBe(
      'a &quot;b&quot; &#39;c&#39;<br>d'
    )
  })
  it('mailBodyToDisplayHtml: plain converted, HTML untouched', () => {
    expect(mailBodyToDisplayHtml('a\n\nb')).toBe('a<br><br>b')
    const html = '<p>#{회원명}님 <b>&amp;</b></p>\n<ol><li><p>x</p></li></ol>'
    expect(mailBodyToDisplayHtml(html)).toBe(html)
  })
})

describe('applyMailPreviewBody', () => {
  it('plain: keeps variable tokens, escapes them, and keeps line breaks', () => {
    expect(applyMailPreviewBody('안녕하세요? #{회원명}님,\n\n■ 프로그램명: #{프로그램명}')).toBe(
      '안녕하세요? #{회원명}님,<br><br>■ 프로그램명: #{프로그램명}'
    )
  })
  it('HTML: unchanged behavior (variable chips substituted, no <br> added)', () => {
    expect(
      applyMailPreviewBody(
        '<p>안녕 <span class="mail-template-variable" data-mail-variable="회원명">#{회원명}</span></p>\n<p>b</p>'
      )
    ).toBe('<p>안녕 #{회원명}</p>\n<p>b</p>')
  })
})

describe('mailBodyToEditorHtml', () => {
  it('wraps each line in <p>, blank lines as empty <p> (no <br>)', () => {
    expect(mailBodyToEditorHtml('안녕\n\nJA')).toBe('<p>안녕</p><p></p><p>JA</p>')
    expect(mailBodyToEditorHtml('a\r\nb\r\n')).toBe('<p>a</p><p>b</p>')
  })
  it('escapes text and turns #{변수} into variable span markup', () => {
    expect(mailBodyToEditorHtml('a < b & #{회원명}님')).toBe(
      '<p>a &lt; b &amp; <span data-mail-variable="회원명">#{회원명}</span>님</p>'
    )
  })
  it('leaves HTML templates as is', () => {
    const html = '<p>x</p><ol><li><p>y</p></li></ol>'
    expect(mailBodyToEditorHtml(html)).toBe(html)
  })
})

describe('isMailEditorBodyUntouchedFromPlainTemplate', () => {
  const stored = '안녕 #{회원명}님,\n\n프로그램: #{프로그램명} & 더'
  const editorOut =
    '<p>안녕 <span class="mail-template-variable" data-mail-variable="회원명" contenteditable="false">#{회원명}</span>님,</p><p></p><p>프로그램: <span class="mail-template-variable" data-mail-variable="프로그램명" contenteditable="false">#{프로그램명}</span> &amp; 더</p>'
  it('true when editor output only reflects the conversion', () => {
    expect(isMailEditorBodyUntouchedFromPlainTemplate(editorOut, stored)).toBe(true)
  })
  it('false after a real edit', () => {
    expect(
      isMailEditorBodyUntouchedFromPlainTemplate(editorOut.replace('더', '더더'), stored)
    ).toBe(false)
    expect(isMailEditorBodyUntouchedFromPlainTemplate(`${editorOut}<ul><li><p>x</p></li></ul>`, stored)).toBe(
      false
    )
  })
  it('false for HTML stored templates', () => {
    expect(isMailEditorBodyUntouchedFromPlainTemplate('<p>a</p>', '<p>a</p>')).toBe(false)
  })
})

describe('keepEmptyMailParagraphLines', () => {
  it('빈 문단을 <p><br></p>로 바꿔 메일에서 빈 줄이 남게 한다', () => {
    expect(keepEmptyMailParagraphLines('<p>가</p><p></p><p>나</p>')).toBe(
      '<p>가</p><p><br></p><p>나</p>'
    )
    expect(keepEmptyMailParagraphLines('<p>가</p><p style="text-align: center;"></p><p>나</p>')).toBe(
      '<p>가</p><p style="text-align: center;"><br></p><p>나</p>'
    )
  })

  it('내용 있는 문단·다른 태그는 그대로 둔다', () => {
    const html = '<p>본문</p><p><br></p><pre></pre><table data-mail-button=""><tr><td></td></tr></table>'
    expect(keepEmptyMailParagraphLines(html)).toBe(html)
  })

  it('본문 맨 끝의 빈 문단(버튼 뒤 에디터 빈 줄 포함)은 지운다', () => {
    const button = '<table data-mail-button=""><tr><td><a href="#">보기</a></td></tr></table>'
    expect(keepEmptyMailParagraphLines(`<p>본문</p><p></p>${button}<p></p>`)).toBe(
      `<p>본문</p><p><br></p>${button}`
    )
    expect(keepEmptyMailParagraphLines('<p>본문</p><p><br></p><p></p>\n')).toBe('<p>본문</p>')
    expect(keepEmptyMailParagraphLines('<p>본문</p><p style="text-align: center;"><br /></p>')).toBe(
      '<p>본문</p>'
    )
  })
})

describe('mailHtmlEmptyLinesForEditor', () => {
  it('저장용 빈 줄 <p><br></p>를 에디터용 <p></p>로 되돌린다', () => {
    expect(mailHtmlEmptyLinesForEditor('<p>가</p><p><br></p><p style="text-align: center;"><br /></p><p>나</p>')).toBe(
      '<p>가</p><p></p><p style="text-align: center;"></p><p>나</p>'
    )
  })

  it('내용이 있는 문단의 <br>은 그대로 둔다', () => {
    expect(mailHtmlEmptyLinesForEditor('<p>가<br>나</p>')).toBe('<p>가<br>나</p>')
  })

  it('저장 → 에디터 → 저장을 거쳐도 같은 HTML이다', () => {
    const saved = keepEmptyMailParagraphLines('<p>가</p><p></p><p>나</p><p></p>')
    expect(saved).toBe('<p>가</p><p><br></p><p>나</p>')
    expect(keepEmptyMailParagraphLines(mailHtmlEmptyLinesForEditor(saved))).toBe(saved)
  })

  it('HTML 템플릿을 에디터에 올릴 때 저장용 빈 줄을 되돌린다', () => {
    expect(mailBodyToEditorHtml('<p>가</p><p><br></p><p>나</p>')).toBe('<p>가</p><p></p><p>나</p>')
  })
})
