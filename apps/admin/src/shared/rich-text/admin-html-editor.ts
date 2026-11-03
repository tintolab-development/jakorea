export type AdminEditorMode = 'visual' | 'html'

export type AdminHtmlEditorState = {
  mode: AdminEditorMode
  draftHtml: string
  visualDirty: boolean
  preserveRawHtmlBlock: boolean
  initialStoredHtml: string
}

const RAW_HTML_BLOCK_WRAPPER_RE =
  /^\s*<div\b(?=[^>]*\bdata-raw-html-block\b)(?=[^>]*\bdata-raw-html-encoding\s*=\s*(["'])base64\1)(?=[^>]*\bdata-raw-html\s*=\s*(["'])([^"']*)\2)[^>]*>\s*<\/div>\s*$/i

/**
 * 메타·스타일·문서 셸을 포함한 원본 HTML은 Tiptap 문서로 파싱하지 않는다.
 * 뉴스레터/메일 HTML은 `<head>` 계열과 인라인 스타일이 화면 모양을 결정한다.
 */
const RAW_HTML_SOURCE_MARKER_RE =
  /<!doctype\b|<html\b|<head\b|<body\b|<meta\b|<style\b|<link\b|<title\b|@media\b|\bclass\s*=\s*["'][^"']*\bstb-/i

/** `@jakorea/rich-text` RawHtmlBlock과 같은 UTF-8/base64 래퍼 규격. */
function encodeRawHtml(content: string): string {
  if (!content) return ''
  const bytes = new TextEncoder().encode(content)
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }
  return btoa(binary)
}

function decodeRawHtml(content: string): string {
  if (!content) return ''
  try {
    const binary = atob(content.trim())
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return ''
  }
}

function renderRawHtmlBlockWrapper(content: string): string {
  return `<div data-raw-html-block="" data-raw-html-encoding="base64" data-raw-html="${encodeRawHtml(content)}"></div>`
}

/** 저장된 raw block 래퍼에서 사람이 편집할 원본 HTML을 꺼낸다. */
export function extractAdminRawHtmlBlock(content: string): string | null {
  const match = RAW_HTML_BLOCK_WRAPPER_RE.exec(content)
  if (!match) return null
  return decodeRawHtml(match[3])
}

export function shouldPreserveAdminRawHtmlBlock(content: string): boolean {
  return extractAdminRawHtmlBlock(content) != null || RAW_HTML_SOURCE_MARKER_RE.test(content)
}

/** HTML 모드의 원본을 일반 편집 모드에 표시할 저장 HTML로 변환한다. */
export function toAdminVisualHtml(content: string, preserveRawHtmlBlock = false): string {
  const source = extractAdminRawHtmlBlock(content) ?? content
  if (!preserveRawHtmlBlock && !shouldPreserveAdminRawHtmlBlock(source)) return content
  return renderRawHtmlBlockWrapper(source)
}

/** HTML 모드에 표시할 값. 저장 래퍼가 있으면 base64 값을 다시 원본으로 푼다. */
export function toAdminHtmlSource(content: string): string {
  return extractAdminRawHtmlBlock(content) ?? content
}

function toAdminStoredHtml(content: string, preserveRawHtmlBlock: boolean): string {
  return preserveRawHtmlBlock ? renderRawHtmlBlockWrapper(content) : content
}

export function isHtmlContent(content: string): boolean {
  return /^\s*</.test(content)
}

export function createInitialAdminHtmlEditorState(initialContent: string): AdminHtmlEditorState {
  const sourceHtml = toAdminHtmlSource(initialContent)
  const preserveRawHtmlBlock = shouldPreserveAdminRawHtmlBlock(initialContent)
  const initialStoredHtml = extractAdminRawHtmlBlock(initialContent)
    ? initialContent
    : toAdminStoredHtml(sourceHtml, preserveRawHtmlBlock)

  return {
    mode: 'visual',
    draftHtml: isHtmlContent(sourceHtml) ? sourceHtml : '',
    visualDirty: false,
    preserveRawHtmlBlock,
    initialStoredHtml,
  }
}

export function resolveAdminHtmlForSave(
  state: AdminHtmlEditorState,
  initialContent: string,
  visualHtml: string
): string {
  if (state.mode === 'html') {
    return toAdminStoredHtml(
      state.draftHtml,
      state.preserveRawHtmlBlock || shouldPreserveAdminRawHtmlBlock(state.draftHtml)
    )
  }
  if (state.visualDirty) return visualHtml
  if (state.initialStoredHtml && isHtmlContent(state.initialStoredHtml)) {
    return state.initialStoredHtml
  }
  if (state.draftHtml && isHtmlContent(initialContent)) return state.draftHtml
  return visualHtml || state.draftHtml
}

/** 비어 있는 문단·줄바꿈만 있는 HTML을 본문 공백으로 판정한다. */
export function isEmptyAdminHtml(html: string): boolean {
  const rawHtml = extractAdminRawHtmlBlock(html)
  if (rawHtml != null) return isEmptyAdminHtml(rawHtml)

  const meaningful = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?\s*>/gi, '')
    .replace(/<\/?(?:p|div|span)\b[^>]*>/gi, '')
    .replace(/&nbsp;|\u00a0/gi, '')
    .replace(/\s/g, '')

  return meaningful.length === 0
}
