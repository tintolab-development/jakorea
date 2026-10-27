import { describe, expect, it } from 'vitest'
import { applyMailPreviewBody } from '../mail-template/preview'
import {
  isMailEditorBodyUntouchedFromPlainTemplate,
  isPlainTextMailBody,
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
  it('plain: substitutes sample values, escapes them, keeps line breaks', () => {
    expect(applyMailPreviewBody('안녕하세요? #{회원명}님,\n\n■ 프로그램명: #{프로그램명}')).toBe(
      '안녕하세요? 이가원님,<br><br>■ 프로그램명: JA KOREA'
    )
  })
  it('HTML: unchanged behavior (variable chips substituted, no <br> added)', () => {
    expect(
      applyMailPreviewBody(
        '<p>안녕 <span class="mail-template-variable" data-mail-variable="회원명">#{회원명}</span></p>\n<p>b</p>'
      )
    ).toBe('<p>안녕 이가원</p>\n<p>b</p>')
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
