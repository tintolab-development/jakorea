/**
 * @vitest-environment jsdom
 *
 * 마크다운 저장 경로(공지·회원 게시글): 에디터 → getMarkdown → 재로드 후 문서 구조가 보존되는지 검증.
 * `<p style>`·`<span style>`·`<mark>` 래퍼 안의 `**굵게**` 등이 글자 그대로 남지 않아야 한다.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { Editor, createRichTextExtensions } from '@jakorea/rich-text'

let editors: Editor[] = []

function create(content: string, contentType?: 'markdown'): Editor {
  const e = new Editor({
    element: document.createElement('div'),
    extensions: createRichTextExtensions(),
    content,
    contentType,
    editable: true,
  })
  editors.push(e)
  return e
}

afterEach(() => {
  editors.forEach(e => e.destroy())
  editors = []
})

const TEXT = '앞부분 가운데 뒷부분'

type DocJson = ReturnType<Editor['getJSON']>

/** 에디터가 문서 끝에 자동으로 붙이는 빈 문단(trailing node)은 저장 내용이 아니므로 비교에서 제외 */
function withoutTrailingEmptyParagraph(doc: DocJson): DocJson {
  const content = [...(doc.content ?? [])]
  const last = content[content.length - 1]
  if (last?.type === 'paragraph' && !last.content?.length) content.pop()
  return { ...doc, content }
}

/** 서식 적용 → markdown → 새 에디터로 재로드 → 원본과 문서 JSON 비교 */
function roundtrip(apply: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) {
  const source = create(`<p>${TEXT}</p>`)
  apply(source.chain().focus().selectAll()).run()
  const markdown = source.getMarkdown()
  const reloaded = create(markdown, 'markdown')
  return {
    markdown,
    before: withoutTrailingEmptyParagraph(source.getJSON()),
    after: withoutTrailingEmptyParagraph(reloaded.getJSON()),
    reloaded,
  }
}

function expectNoLiteralMarkers(e: Editor) {
  expect(e.getText()).not.toMatch(/\*\*|\+\+|~~|(^|[^*])\*[^*\s]/)
}

describe('markdown roundtrip: HTML 래퍼 + 인라인 마크', () => {
  const cases: Record<string, (c: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>> = {
    '가운데 + 굵게': c => c.setTextAlign('center').toggleBold(),
    '가운데 + 기울임 + 글자색': c => c.setTextAlign('center').toggleItalic().setColor('#E53935'),
    '오른쪽 + 크기 24 + 하이라이트': c =>
      c.setTextAlign('right').setFontSize('24px').setHighlight({ color: '#FFF9C4' }),
    '줄간격 200% + 가운데': c => c.setLineHeight('200%').setTextAlign('center'),
    'H1 + 가운데 + 굵게': c => c.setHeading({ level: 1 }).setTextAlign('center').toggleBold(),
    'H2 + 글자색 + 크기': c => c.setHeading({ level: 2 }).setColor('#1565C0').setFontSize('20px'),
    'H3 + 밑줄 + 글꼴': c =>
      c.setHeading({ level: 3 }).toggleUnderline().setFontFamily('Georgia, serif'),
    '글꼴(따옴표 포함) + 크기 + 색 + 굵게 + 기울임': c =>
      c
        .setFontFamily('"Noto Sans KR", sans-serif')
        .setFontSize('16px')
        .setColor('#6A1B9A')
        .toggleBold()
        .toggleItalic(),
    '하이라이트 + 밑줄 + 취소선': c =>
      c.setHighlight({ color: '#E3F2FD' }).toggleUnderline().toggleStrike(),
    '링크 + 굵게 + 글자색': c =>
      c.setLink({ href: 'https://example.com' }).toggleBold().setColor('#E53935'),
  }

  for (const [name, apply] of Object.entries(cases)) {
    it(name, () => {
      const { before, after, reloaded } = roundtrip(apply)
      expectNoLiteralMarkers(reloaded)
      expect(after).toEqual(before)
    })
  }

  it('문단 일부에만 굵게 + 색 + 크기를 적용해도 보존된다', () => {
    const source = create(`<p>${TEXT}</p>`)
    source
      .chain()
      .focus()
      .setTextSelection({ from: 5, to: 8 })
      .toggleBold()
      .setColor('#2E7D32')
      .setFontSize('18px')
      .run()
    const reloaded = create(source.getMarkdown(), 'markdown')
    expectNoLiteralMarkers(reloaded)
    expect(withoutTrailingEmptyParagraph(reloaded.getJSON())).toEqual(
      withoutTrailingEmptyParagraph(source.getJSON())
    )
  })

  it('줄간격 + 문단 일부 굵게를 보존한다', () => {
    const source = create(`<p>${TEXT}</p>`)
    source.chain().focus().setTextSelection({ from: 5, to: 8 }).toggleBold().run()
    source.chain().focus().setLineHeight('150%').run()
    const reloaded = create(source.getMarkdown(), 'markdown')
    expectNoLiteralMarkers(reloaded)
    expect(withoutTrailingEmptyParagraph(reloaded.getJSON())).toEqual(
      withoutTrailingEmptyParagraph(source.getJSON())
    )
  })
})

describe('markdown roundtrip: 목록 항목 안의 정렬', () => {
  it('번호 목록 + 글자색: 내부 서식은 보존된다', () => {
    const { reloaded } = roundtrip(c => c.setColor('#F57C00').toggleOrderedList())
    expectNoLiteralMarkers(reloaded)
    expect(reloaded.getHTML()).toContain('color: rgb(245, 124, 0)')
  })

  /**
   * @tiptap/extension-list 의 orderedList 토크나이저는 항목 첫 줄을 inlineTokens 로만 렉싱해서
   * 항목 안의 `<p style>` 가 [html, …, html] 인라인 토큰으로 들어온다.
   * RichTextParagraph.parseMarkdown 이 이를 풀어 정렬을 복원한다.
   */
  it('번호 목록 + 글자색 + 가운데 정렬', () => {
    const { before, after } = roundtrip(c =>
      c.setColor('#F57C00').toggleOrderedList().setTextAlign('center')
    )
    expect(after).toEqual(before)
  })

  it('번호 목록 + 굵게 + 오른쪽 정렬 + 줄간격', () => {
    const { before, after, reloaded } = roundtrip(c =>
      c.toggleBold().toggleOrderedList().setTextAlign('right').setLineHeight('150%')
    )
    expectNoLiteralMarkers(reloaded)
    expect(after).toEqual(before)
  })

  it('번호 목록 여러 항목: 항목마다 다른 정렬을 보존한다', () => {
    const source = create('<ol><li><p>첫째</p></li><li><p>둘째</p></li><li><p>셋째</p></li></ol>')
    source.chain().focus().setTextSelection(4).setTextAlign('center').run()
    // 문서 위치: 첫째 항목 텍스트 3~5, 둘째 항목 텍스트 9~11
    source.chain().focus().setTextSelection(10).toggleBold().setTextAlign('right').run()
    expect(source.getHTML()).toContain('text-align: right')
    const markdown = source.getMarkdown()
    const reloaded = create(markdown, 'markdown')
    expectNoLiteralMarkers(reloaded)
    expect(withoutTrailingEmptyParagraph(reloaded.getJSON())).toEqual(
      withoutTrailingEmptyParagraph(source.getJSON())
    )
    expect(reloaded.getHTML()).toContain('text-align: center')
    expect(reloaded.getHTML()).toContain('text-align: right')
  })

  it('중첩 번호 목록 안의 정렬을 보존한다', () => {
    const source = create(
      '<ol><li><p>상위</p><ol><li><p>하위 항목</p></li></ol></li></ol>'
    )
    source.chain().focus().setTextSelection(10).setTextAlign('center').toggleBold().run()
    const reloaded = create(source.getMarkdown(), 'markdown')
    expectNoLiteralMarkers(reloaded)
    expect(withoutTrailingEmptyParagraph(reloaded.getJSON())).toEqual(
      withoutTrailingEmptyParagraph(source.getJSON())
    )
  })

  it('정렬 없는 번호 목록은 그대로 파싱된다 (회귀)', () => {
    const e = create('1. 첫째\n2. **둘째**\n3. 셋째', 'markdown')
    expect(e.getHTML()).toBe(
      '<ol><li><p>첫째</p></li><li><p><strong>둘째</strong></p></li><li><p>셋째</p></li></ol>'
    )
  })

  it('짝이 맞지 않는 <p style> 는 기본 동작으로 처리한다 (크래시 없음)', () => {
    const e = create('1. <p style="text-align: center">짝없음', 'markdown')
    expect(e.getText()).toContain('짝없음')
  })

  it('글머리 목록 + 굵게 + 오른쪽 정렬', () => {
    const { before, after, reloaded } = roundtrip(c =>
      c.toggleBold().toggleBulletList().setTextAlign('right')
    )
    expectNoLiteralMarkers(reloaded)
    expect(after).toEqual(before)
  })
})

describe('기존 동작 유지 (회귀)', () => {
  it('래퍼 없는 마크다운은 그대로 파싱된다', () => {
    const e = create('앞 **굵게** *기울임* ~~취소~~ 뒤', 'markdown')
    expect(e.getHTML()).toBe(
      '<p>앞 <strong>굵게</strong> <em>기울임</em> <s>취소</s> 뒤</p>'
    )
  })

  it('래퍼 안이 HTML 태그인 기존 저장 형태도 동일하게 파싱된다', () => {
    const legacy = create(
      '<p style="text-align: center"><span style="color: #E53935"><strong>굵게</strong></span></p>',
      'markdown'
    )
    const modern = create(
      '<p style="text-align: center"><span style="color: #E53935">**굵게**</span></p>',
      'markdown'
    )
    expect(modern.getJSON()).toEqual(legacy.getJSON())
  })

  it('알려진 style 속성이 없는 span 은 기존 HTML 처리로 남는다', () => {
    const e = create('앞 <span style="letter-spacing: 2px">텍스트</span> 뒤', 'markdown')
    expect(e.getText()).toContain('텍스트')
    expect(e.getText()).not.toContain('<span')
  })

  it('색 지정 없는 ==하이라이트== 문법은 유지된다', () => {
    const e = create('앞 ==강조== 뒤', 'markdown')
    expect(e.getHTML()).toContain('<mark')
  })

  it('저장(직렬화) 문자열은 변경 전과 동일한 형태다', () => {
    const source = create(`<p>${TEXT}</p>`)
    source.chain().focus().selectAll().setTextAlign('center').toggleBold().run()
    expect(source.getMarkdown().trim()).toBe(
      '<p style="text-align: center">**앞부분 가운데 뒷부분**</p>'
    )
  })
})
