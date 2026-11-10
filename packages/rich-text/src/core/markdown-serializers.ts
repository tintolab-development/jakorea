import { Extension, mergeAttributes, type JSONContent, type MarkdownRendererHelpers, type MarkdownToken } from '@tiptap/core'
import Heading from '@tiptap/extension-heading'
import Highlight from '@tiptap/extension-highlight'
import Paragraph from '@tiptap/extension-paragraph'
import { TextStyle } from '@tiptap/extension-text-style'
import Youtube, { getEmbedUrlFromYoutubeUrl } from '@tiptap/extension-youtube'
import ImageResize from 'tiptap-extension-resize-image'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildTextStyleSpan(
  attrs: Record<string, unknown> | undefined,
  content: string
): string {
  if (!attrs) return content
  const styles: string[] = []
  if (typeof attrs.color === 'string' && attrs.color) {
    styles.push(`color: ${attrs.color}`)
  }
  if (typeof attrs.fontFamily === 'string' && attrs.fontFamily) {
    styles.push(`font-family: ${attrs.fontFamily}`)
  }
  if (typeof attrs.fontSize === 'string' && attrs.fontSize) {
    styles.push(`font-size: ${attrs.fontSize}`)
  }
  if (styles.length === 0) return content
  return `<span style="${styles.map(s => escapeHtml(s)).join('; ')}">${content}</span>`
}

/** textStyle 마크 — color·fontFamily·fontSize를 인라인 HTML span으로 직렬화 */
export const RichTextTextStyle = TextStyle.extend({
  renderMarkdown: (node, helpers) => {
    const content = helpers.renderChildren(node.content ?? [])
    return buildTextStyleSpan(node.attrs as Record<string, unknown> | undefined, content)
  },
})

/** 하이라이트 — `==text==` 또는 `<mark style="background-color: …">` */
export const RichTextHighlight = Highlight.configure({ multicolor: true }).extend({
  markdownTokenizer: {
    name: 'highlight',
    level: 'inline',
    start: (src: string) => src.indexOf('=='),
    tokenize: (src, _tokens, lexer) => {
      const match = /^==([^=]+)==/.exec(src)
      if (!match) return undefined
      return {
        type: 'highlight',
        raw: match[0],
        text: match[1],
        tokens: lexer.inlineTokens(match[1]),
      }
    },
  },
  parseMarkdown: (token, helpers) => {
    const t = token as { tokens?: MarkdownToken[]; text?: string }
    const fallback: MarkdownToken[] = [{ type: 'text', text: t.text ?? '' }]
    const content = helpers.parseInline(t.tokens ?? fallback)
    return helpers.applyMark('highlight', content)
  },
  renderMarkdown: (node, helpers) => {
    const content = helpers.renderChildren(node.content ?? [])
    const color = (node.attrs as { color?: string } | undefined)?.color
    if (color) {
      return `<mark style="background-color: ${escapeHtml(color)}">${content}</mark>`
    }
    return `==${content}==`
  },
})

function renderAlignedBlock(
  tag: string,
  align: string | undefined,
  lineHeight: string | undefined,
  content: string
): string {
  const styles: string[] = []
  if (align && align !== 'left') {
    styles.push(`text-align: ${align}`)
  }
  if (lineHeight) {
    styles.push(`line-height: ${lineHeight}`)
  }
  if (styles.length === 0) return content
  return `<${tag} style="${styles.map(s => escapeHtml(s)).join('; ')}">${content}</${tag}>`
}

const EMPTY_PARAGRAPH_MARKDOWN = '&nbsp;'

type MarkdownRenderCtx = {
  previousNode?: JSONContent | null
}

/**
 * 문단 토큰이 `<p style="…">…</p>` 로 완전히 감싸진 경우(= [html 여는 태그, …인라인 토큰, html 닫는 태그])
 * 양 끝 html 토큰을 떼고 정렬·줄간격과 내부 토큰을 돌려준다.
 *
 * @tiptap/extension-list 의 orderedList 토크나이저는 항목 첫 줄을 inlineTokens 로만 렉싱하므로
 * 번호 목록 항목 안의 `<p style>` 는 블록 토크나이저를 거치지 않고 이 형태로 들어온다.
 */
function unwrapStyledParagraphTokens(
  token: MarkdownToken
): { inner: MarkdownToken[]; textAlign: string | null; lineHeight: string | null } | null {
  const tokens = (token as { tokens?: MarkdownToken[] }).tokens
  if (!tokens || tokens.length < 2) return null
  const htmlOf = (t: MarkdownToken): string | null =>
    t.type === 'html' ? String((t as { raw?: string }).raw ?? (t as { text?: string }).text ?? '').trim() : null
  const first = htmlOf(tokens[0])
  const last = htmlOf(tokens[tokens.length - 1])
  if (!first || !last || !/^<p(\s[^>]*)?>$/i.test(first) || !/^<\/p\s*>$/i.test(last)) return null
  const inner = tokens.slice(1, -1)
  // 안쪽에 다른 <p> 여닫는 태그가 끼어 있으면 짝이 맞지 않으므로 건드리지 않는다
  if (inner.some(t => /^<\/?p[\s>]/i.test(htmlOf(t) ?? ''))) return null
  const style = parseInlineStyleAttr(first)
  const textAlign = style?.['text-align'] ?? null
  const lineHeight = style?.['line-height'] ?? null
  if (!textAlign && !lineHeight) return null
  return { inner, textAlign, lineHeight }
}

/** 문단 정렬·줄간격 — Markdown에 HTML 블록으로 보존. 블록 간격은 doc의 `\n\n` join이 담당. */
export const RichTextParagraph = Paragraph.extend({
  parseMarkdown: (token, helpers) => {
    const styled = unwrapStyledParagraphTokens(token)
    if (styled) {
      return helpers.createNode(
        'paragraph',
        { textAlign: styled.textAlign, lineHeight: styled.lineHeight },
        helpers.parseInline(styled.inner)
      )
    }
    // 기본 동작(빈 문단 `&nbsp;`, 이미지 단독 문단 등)은 그대로 위임
    return Paragraph.config.parseMarkdown!(token, helpers)
  },
  renderMarkdown: (
    node: JSONContent,
    helpers: MarkdownRendererHelpers,
    ctx?: MarkdownRenderCtx
  ) => {
    const children = Array.isArray(node.content) ? node.content : []
    if (children.length === 0) {
      const previousNode = ctx?.previousNode
      const previousContent = Array.isArray(previousNode?.content) ? previousNode.content : []
      const previousNodeIsEmptyParagraph =
        previousNode?.type === 'paragraph' && previousContent.length === 0
      return previousNodeIsEmptyParagraph ? EMPTY_PARAGRAPH_MARKDOWN : ''
    }
    const content = helpers.renderChildren(node.content ?? [])
    const attrs = node.attrs as { textAlign?: string; lineHeight?: string } | undefined
    const align = attrs?.textAlign
    const lineHeight = attrs?.lineHeight
    if ((!align || align === 'left') && !lineHeight) {
      return content
    }
    return renderAlignedBlock('p', align, lineHeight, content)
  },
})

export const RichTextHeading = Heading.extend({
  renderMarkdown: (node: JSONContent, helpers: MarkdownRendererHelpers) => {
    const level = (node.attrs as { level?: number } | undefined)?.level ?? 1
    if (!node.content?.length) return ''
    const content = helpers.renderChildren(node.content)
    const attrs = node.attrs as { textAlign?: string; lineHeight?: string } | undefined
    const align = attrs?.textAlign
    const lineHeight = attrs?.lineHeight
    const hashes = '#'.repeat(level)
    if ((!align || align === 'left') && !lineHeight) {
      return `${hashes} ${content}`
    }
    return renderAlignedBlock(`h${level}`, align, lineHeight, content)
  },
})

function unescapeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** `style="…"` 속성값을 { 속성: 값 } 으로 파싱한다. 시작 태그에 style 이 없으면 null. */
function parseInlineStyleAttr(openTag: string): Record<string, string> | null {
  const match = /\sstyle="([^"]*)"/i.exec(openTag)
  if (!match) return null
  const result: Record<string, string> = {}
  for (const declaration of unescapeHtml(match[1]).split(';')) {
    const idx = declaration.indexOf(':')
    if (idx === -1) continue
    const key = declaration.slice(0, idx).trim().toLowerCase()
    const value = declaration.slice(idx + 1).trim()
    if (key && value) result[key] = value
  }
  return result
}

/**
 * `src` 맨 앞의 `<tag …>` 에 대응하는 `</tag>` 까지(같은 태그 중첩 고려)를 찾아
 * { open, inner, raw } 를 돌려준다. 닫는 태그가 없으면 null.
 */
function matchWrappedHtml(
  src: string,
  tags: readonly string[]
): { tag: string; open: string; inner: string; raw: string } | null {
  const openMatch = new RegExp(`^<(${tags.join('|')})(\\s[^>]*)?>`, 'i').exec(src)
  if (!openMatch) return null
  const tag = openMatch[1].toLowerCase()
  const tagRegex = new RegExp(`<(/?)${tag}(?=[\\s>/])[^>]*>`, 'gi')
  tagRegex.lastIndex = openMatch[0].length
  let depth = 1
  let m: RegExpExecArray | null
  while ((m = tagRegex.exec(src)) !== null) {
    depth += m[1] ? -1 : 1
    if (depth === 0) {
      const end = m.index + m[0].length
      return {
        tag,
        open: openMatch[0],
        inner: src.slice(openMatch[0].length, m.index),
        raw: src.slice(0, end),
      }
    }
  }
  return null
}

/**
 * 인라인 HTML 래퍼 안의 Markdown 해석.
 *
 * `renderMarkdown` 은 `<span style>`·`<mark style>` 안에 `**굵게**` 같은 Markdown 을 그대로 넣어 저장한다.
 * 그러나 @tiptap/markdown 은 래퍼를 HTML 로만 파싱해서 내부 Markdown 이 글자 그대로 남는다.
 * 래퍼 내부를 인라인 Markdown 으로 다시 토큰화해 마크(textStyle·highlight)로 적용한다.
 */
export const RichTextStyledInlineHtml = Extension.create({
  name: 'richTextStyledInlineHtml',
  markdownTokenizer: {
    name: 'richTextStyledInlineHtml',
    level: 'inline',
    start: (src: string) => src.search(/<(span|mark)[\s>]/i),
    tokenize: (src, _tokens, lexer) => {
      const wrapped = matchWrappedHtml(src, ['span', 'mark'])
      if (!wrapped) return undefined
      const style = parseInlineStyleAttr(wrapped.open)
      if (!style) return undefined
      const mark: { type: string; attrs: Record<string, string> } | null = (() => {
        if (wrapped.tag === 'mark') {
          const color = style['background-color']
          return color ? { type: 'highlight', attrs: { color } } : null
        }
        const attrs: Record<string, string> = {}
        if (style.color) attrs.color = style.color
        if (style['font-family']) attrs.fontFamily = style['font-family']
        if (style['font-size']) attrs.fontSize = style['font-size']
        return Object.keys(attrs).length ? { type: 'textStyle', attrs } : null
      })()
      if (!mark) return undefined
      return {
        type: 'richTextStyledInlineHtml',
        raw: wrapped.raw,
        markType: mark.type,
        markAttrs: mark.attrs,
        tokens: lexer.inlineTokens(wrapped.inner),
      }
    },
  },
  parseMarkdown: (token, helpers) => {
    const t = token as { tokens?: MarkdownToken[]; markType?: string; markAttrs?: Record<string, string> }
    const content = helpers.parseInline(t.tokens ?? [])
    return helpers.applyMark(t.markType ?? 'textStyle', content, t.markAttrs)
  },
})

/**
 * 정렬·줄간격이 있는 문단/제목(`<p style>`, `<h1~3 style>`) 안의 Markdown 해석.
 * 목록 항목 안에서는 인라인 html 로 렉싱되어 문단 속성이 버려지던 문제도 함께 막는다.
 */
export const RichTextStyledBlockHtml = Extension.create({
  name: 'richTextStyledBlockHtml',
  markdownTokenizer: {
    name: 'richTextStyledBlockHtml',
    level: 'block',
    start: (src: string) => src.search(/<(p|h[1-3])[\s>]/i),
    tokenize: (src, _tokens, lexer) => {
      const wrapped = matchWrappedHtml(src, ['p', 'h1', 'h2', 'h3'])
      if (!wrapped) return undefined
      const style = parseInlineStyleAttr(wrapped.open)
      if (!style) return undefined
      const textAlign = style['text-align']
      const lineHeight = style['line-height']
      if (!textAlign && !lineHeight) return undefined
      // 닫는 태그 뒤에는 줄 끝만 허용 (같은 줄에 다른 내용이 이어지면 일반 HTML 처리에 맡긴다)
      const rest = /^[ \t]*(\r?\n|$)/.exec(src.slice(wrapped.raw.length))
      if (!rest) return undefined
      // 빈 줄을 포함하는 내용은 Markdown 블록 경계와 충돌하므로 건드리지 않는다
      if (/\n[ \t]*\n/.test(wrapped.inner)) return undefined
      return {
        type: 'richTextStyledBlockHtml',
        raw: wrapped.raw + rest[0],
        tag: wrapped.tag,
        textAlign: textAlign ?? null,
        lineHeight: lineHeight ?? null,
        tokens: lexer.inlineTokens(wrapped.inner),
      }
    },
  },
  parseMarkdown: (token, helpers) => {
    const t = token as {
      tokens?: MarkdownToken[]
      tag?: string
      textAlign?: string | null
      lineHeight?: string | null
    }
    const content = helpers.parseInline(t.tokens ?? [])
    const levelMatch = /^h([1-3])$/.exec(t.tag ?? '')
    if (levelMatch) {
      return helpers.createNode(
        'heading',
        { level: Number(levelMatch[1]), textAlign: t.textAlign ?? null, lineHeight: t.lineHeight ?? null },
        content
      )
    }
    return helpers.createNode(
      'paragraph',
      { textAlign: t.textAlign ?? null, lineHeight: t.lineHeight ?? null },
      content
    )
  },
})

/**
 * 드래그 리사이즈·좌/중/우 정렬 (tiptap-extension-resize-image).
 * 패키지 기본 노드명 `imageResize`는 Markdown `![alt](src)` 파서가 `image`를 만들기 때문에
 * 저장 후 이미지가 사라진다. 표준 `image` 이름을 유지한다.
 */
export const RichTextImageResize = ImageResize.configure({
  inline: false,
  minWidth: 80,
  allowBase64: true,
  HTMLAttributes: {
    class: 'rich-text-content__image',
  },
}).extend({
  name: 'image',
  addAttributes() {
    return {
      ...this.parent?.(),
      persistSrc: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-persist-src'),
        renderHTML: (attributes: { persistSrc?: string | null }) =>
          attributes.persistSrc ? { 'data-persist-src': attributes.persistSrc } : {},
      },
      fileSize: {
        default: null,
        parseHTML: (element: HTMLElement) => {
          const value = element.getAttribute('data-file-size')
          if (!value || !/^\d+$/.test(value)) return null
          return Number(value)
        },
        renderHTML: (attributes: { fileSize?: number | string | null }) => {
          const value = attributes.fileSize
          if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
            return { 'data-file-size': String(value) }
          }
          if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
            return { 'data-file-size': value.trim() }
          }
          return {}
        },
      },
    }
  },
  renderHTML({ HTMLAttributes }) {
    const attrs: Record<string, unknown> = { ...(HTMLAttributes as Record<string, unknown>) }
    const persistSrc = typeof attrs['data-persist-src'] === 'string' ? attrs['data-persist-src'] : ''
    if (persistSrc) attrs.src = persistSrc
    delete attrs.persistSrc
    delete attrs['data-persist-src']
    delete attrs.fileSize
    return ['img', mergeAttributes(this.options.HTMLAttributes, attrs)]
  },
  parseMarkdown: (token, helpers) => {
    const t = token as { href?: string; title?: string; text?: string }
    return helpers.createNode('image', {
      src: t.href ?? '',
      title: t.title ?? null,
      alt: t.text ?? '',
    })
  },
  renderMarkdown: (node: JSONContent) => {
    const attrs = node.attrs as Record<string, string | number | undefined> | undefined
    const rawSrc = attrs?.persistSrc || attrs?.src || ''
    const src = typeof rawSrc === 'string' ? rawSrc : String(rawSrc)
    const rawAlt = attrs?.alt ?? ''
    const alt = typeof rawAlt === 'string' ? rawAlt : String(rawAlt)
    const containerStyle = typeof attrs?.containerStyle === 'string' ? attrs.containerStyle : undefined
    const fileSize = attrs?.fileSize
    if (containerStyle?.includes('width') || fileSize) {
      const style = escapeHtml(containerStyle ?? '')
      const styleAttr = style ? ` style="${style}"` : ''
      const fileSizeAttr = fileSize ? ` data-file-size="${escapeHtml(String(fileSize))}"` : ''
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="rich-text-content__image"${styleAttr}${fileSizeAttr} />`
    }
    const safeAlt = alt.replace(/]/g, '\\]')
    return `![${safeAlt}](${src})`
  },
})

/** YouTube iframe embed — Markdown에 HTML로 보존 */
export const RichTextYoutube = Youtube.configure({
  width: 640,
  height: 360,
  nocookie: true,
  HTMLAttributes: {
    class: 'rich-text-content__youtube',
  },
}).extend({
  parseHTML() {
    return [
      ...(this.parent?.() ?? []),
      { tag: 'iframe.rich-text-content__youtube' },
      { tag: 'iframe[src*="youtube.com"]' },
      { tag: 'iframe[src*="youtube-nocookie.com"]' },
    ]
  },
  renderMarkdown: (node: JSONContent) => {
    const src = (node.attrs as { src?: string } | undefined)?.src ?? ''
    const embed =
      getEmbedUrlFromYoutubeUrl({ url: src, nocookie: true }) ?? src
    return `<div data-youtube-video><iframe class="rich-text-content__youtube" width="640" height="360" src="${escapeHtml(embed)}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>`
  },
})
