import type { JSONContent, MarkdownRendererHelpers, MarkdownToken } from '@tiptap/core'
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

/** 문단 정렬·줄간격 — Markdown에 HTML 블록으로 보존. 블록 간격은 doc의 `\n\n` join이 담당. */
export const RichTextParagraph = Paragraph.extend({
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
  parseMarkdown: (token, helpers) => {
    const t = token as { href?: string; title?: string; text?: string }
    return helpers.createNode('image', {
      src: t.href ?? '',
      title: t.title ?? null,
      alt: t.text ?? '',
    })
  },
  renderMarkdown: (node: JSONContent) => {
    const attrs = node.attrs as Record<string, string | undefined> | undefined
    const src = attrs?.src ?? ''
    const alt = attrs?.alt ?? ''
    const containerStyle = attrs?.containerStyle
    if (containerStyle?.includes('width')) {
      const style = escapeHtml(containerStyle)
      return `<img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="rich-text-content__image" style="${style}" />`
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
