/**
 * @vitest-environment jsdom
 *
 * HTML 원본 블록 — getHTML → setContent → getHTML 무손실 왕복, sandbox, 이미지 처리.
 */
import { afterEach, describe, expect, it } from 'vitest'
import {
  Editor,
  RAW_HTML_BLOCK_IFRAME_SANDBOX,
  RAW_HTML_BLOCK_NODE_NAME,
  buildRawHtmlSrcdoc,
  countVisibleRichTextCharacters,
  createRichTextExtensions,
  decodeRawHtml,
  encodeRawHtml,
  getRichTextImageCount,
  serializeEditorContent,
} from '@jakorea/rich-text'

const STIBEE_LIKE = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>JA Korea 뉴스레터 11월호</title>
<style type="text/css">
  body { margin: 0; background: #f4f4f4; }
  .stb-container { width: 640px; margin: 0 auto; }
  .stb-text-box td { font-family: 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; color: #333; }
  @media only screen and (max-width: 640px) { .stb-container { width: 100% !important; } }
</style>
</head>
<body>
<table class="stb-container" border="0" cellpadding="0" cellspacing="0" align="center" style="background:#ffffff">
  <tbody>
    <tr>
      <td class="stb-image-box" style="padding: 0;">
        <a href="https://stibee.com/api/v1.0/emails/share/abc" target="_blank"><img src="https://img2.stibee.com/12345_1700000000.png" alt="헤더 이미지" width="640" style="display:block; border:0"></a>
      </td>
    </tr>
    <tr>
      <td class="stb-text-box">안녕하세요 &amp; 반갑습니다 😀<br>
        <span style="font-weight:bold">"따옴표"</span> &lt;꺾쇠&gt; &nbsp; 공백  두 칸
        <!-- 주석 유지 -->
      </td>
    </tr>
  </tbody>
</table>
<script>window.__rawHtmlPwned = true</script>
<img src="x" onerror="window.__rawHtmlPwned = true">
</body>
</html>
`

const editors: Editor[] = []

function createEditor(content: string, contentType: 'html' | 'markdown' = 'html'): Editor {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: createRichTextExtensions(),
    content,
    contentType,
    editable: true,
  })
  editors.push(editor)
  return editor
}

function rawBlocks(editor: Editor): string[] {
  const values: string[] = []
  editor.state.doc.descendants(node => {
    if (node.type.name === RAW_HTML_BLOCK_NODE_NAME) values.push(node.attrs.html as string)
  })
  return values
}

afterEach(() => {
  while (editors.length) editors.pop()?.destroy()
  delete (window as { __rawHtmlPwned?: boolean }).__rawHtmlPwned
})

describe('raw html encoding', () => {
  it('base64(UTF-8) 왕복이 동일 문자열', () => {
    expect(decodeRawHtml(encodeRawHtml(STIBEE_LIKE))).toBe(STIBEE_LIKE)
    expect(decodeRawHtml(encodeRawHtml('한글 😀 \u0000 \r\n'))).toBe('한글 😀 \u0000 \r\n')
    expect(encodeRawHtml(STIBEE_LIKE)).toMatch(/^[A-Za-z0-9+/=]+$/)
  })

  it('깨진 값은 빈 문자열', () => {
    expect(decodeRawHtml('***')).toBe('')
    expect(decodeRawHtml(null)).toBe('')
  })
})

describe('RawHtmlBlock round-trip', () => {
  it('Stibee 형식 원본이 getHTML → setContent → getHTML 후에도 그대로', () => {
    const first = createEditor('<p>앞 문단</p><p>뒤 문단</p>')
    first.commands.setTextSelection(first.state.doc.child(0).nodeSize - 1)
    expect(first.commands.insertRawHtmlBlock(STIBEE_LIKE)).toBe(true)
    expect(rawBlocks(first)).toEqual([STIBEE_LIKE])

    const html1 = serializeEditorContent(first, 'html')
    expect(html1).toContain(
      '<div data-raw-html-block="" data-raw-html-encoding="base64" data-raw-html="'
    )
    expect(html1).toContain('<p>앞 문단</p>')
    expect(html1).toContain('<p>뒤 문단</p>')
    // 원본 마크업은 저장 HTML에 평문으로 노출되지 않는다
    expect(html1).not.toContain('<style')
    expect(html1).not.toContain('<script')

    const second = createEditor('')
    second.commands.setContent(html1, { contentType: 'html' })
    expect(rawBlocks(second)).toEqual([STIBEE_LIKE])
    const html2 = serializeEditorContent(second, 'html')
    expect(html2).toBe(html1)

    const third = createEditor(html2)
    expect(rawBlocks(third)).toEqual([STIBEE_LIKE])
    expect(serializeEditorContent(third, 'html')).toBe(html1)
  })

  it('Markdown 저장(교재 형식)에서도 원본이 보존된다', () => {
    const first = createEditor('<p>본문</p>')
    first.commands.insertRawHtmlBlock(STIBEE_LIKE)
    const markdown = serializeEditorContent(first, 'markdown')
    expect(markdown).toContain('data-raw-html-block')
    const second = createEditor(markdown, 'markdown')
    expect(rawBlocks(second)).toEqual([STIBEE_LIKE])
  })

  it('블록이 없는 기존 문서는 래퍼를 만들지 않는다', () => {
    const html = '<p>안녕 <strong>굵게</strong></p><ul><li><p>항목</p></li></ul>'
    const editor = createEditor(html)
    const out = serializeEditorContent(editor, 'html')
    expect(out).toBe(html)
    expect(out).not.toContain('data-raw-html')
  })
})

describe('RawHtmlBlock preview sandbox', () => {
  it('iframe sandbox에 allow-scripts가 없고 원본은 에디터 DOM으로 파싱되지 않는다', () => {
    const editor = createEditor('<p>본문</p>')
    editor.commands.insertRawHtmlBlock(STIBEE_LIKE)
    const iframes = editor.view.dom.querySelectorAll('iframe.rich-text-raw-html-block__frame')
    expect(iframes).toHaveLength(1)
    const iframe = iframes[0] as HTMLIFrameElement
    const sandbox = iframe.getAttribute('sandbox')
    expect(sandbox).toBe(RAW_HTML_BLOCK_IFRAME_SANDBOX)
    expect(sandbox?.split(/\s+/)).not.toContain('allow-scripts')
    expect(iframe.getAttribute('srcdoc')).toContain('https://img2.stibee.com/12345_1700000000.png')
    expect(editor.view.dom.querySelector('script, img[onerror], style, meta')).toBeNull()
    expect((window as { __rawHtmlPwned?: boolean }).__rawHtmlPwned).toBeUndefined()
  })

  it('srcdoc은 doctype 뒤 head 안에 base/CSP만 덧붙인다', () => {
    const srcdoc = buildRawHtmlSrcdoc(STIBEE_LIKE)
    expect(srcdoc.startsWith('<!DOCTYPE html>')).toBe(true)
    expect(srcdoc).toContain('<head><meta http-equiv="Content-Security-Policy"')
    expect(srcdoc).toContain('<base target="_blank">')
    expect(buildRawHtmlSrcdoc('<p>조각</p>')).toMatch(/<base target="_blank"><p>조각<\/p>$/)
  })
})

describe('RawHtmlBlock images & limits', () => {
  it('블록 안 이미지는 이미지 개수 제한에 넣지 않는다', () => {
    const editor = createEditor('<p><img src="https://example.com/a.png"></p>')
    editor.commands.insertRawHtmlBlock(STIBEE_LIKE)
    expect(getRichTextImageCount(editor)).toBe(1)
  })

  it('삽입 시 data: 이미지만 제거한다', () => {
    const editor = createEditor('')
    editor.commands.insertRawHtmlBlock(
      '<div class="a"><img src="data:image/png;base64,AAAA"><img src="https://img2.stibee.com/b.png"></div>'
    )
    expect(rawBlocks(editor)).toEqual([
      '<div class="a"><img src="https://img2.stibee.com/b.png"></div>',
    ])
  })

  it('서버 visible-length는 base64 속성을 0자로 센다(부풀지 않음)', () => {
    const editor = createEditor('<p>가나다</p>')
    editor.commands.insertRawHtmlBlock(STIBEE_LIKE)
    const html = serializeEditorContent(editor, 'html')
    expect(countVisibleRichTextCharacters(html)).toBe(3)
    // 참고: 원본 자체를 태그만 지워 세면 <style> CSS 텍스트도 글자로 잡힌다
    expect(countVisibleRichTextCharacters(STIBEE_LIKE)).toBeGreaterThan(200)
  })
})
