import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

export const RICH_TEXT_MAX_TEXT_CHARACTERS = 50_000
export const RICH_TEXT_IMAGE_MAX_TOTAL_BYTES = 20 * 1024 * 1024

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter('ko', { granularity: 'grapheme' })
    : null

/**
 * 화면에 보이는 글자 수(grapheme 단위, Intl.Segmenter 없으면 code point 단위).
 * 배열로 펼치지 않고 반복자로만 센다 — V8은 세그먼트 객체마다 입력 문자열 사본을 만들 수 있어
 * `[...segmenter.segment(text)]`는 5만 자 문서에서 수 GB를 잡고 OOM이 난다.
 */
export function countRichTextCharacters(text: string): number {
  if (!text) return 0
  let count = 0
  if (segmenter) {
    for (const _segment of segmenter.segment(text)) count += 1
    return count
  }
  for (const _codePoint of text) count += 1
  return count
}

export function countRichTextDocumentCharacters(doc: ProseMirrorNode): number {
  return countRichTextCharacters(doc.textBetween(0, doc.content.size, '\n', '\n'))
}

export function richTextImageFileSizeFromAttrs(attrs: unknown): number {
  if (!attrs || typeof attrs !== 'object') return 0
  const value = (attrs as { fileSize?: unknown }).fileSize
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
  }
  return 0
}

export function getRichTextImageFileSize(node: ProseMirrorNode): number {
  return node.type.name === 'image' ? richTextImageFileSizeFromAttrs(node.attrs) : 0
}

export function getRichTextImageTotalBytes(editor: Editor): number {
  let total = 0
  editor.state.doc.descendants(node => {
    total += getRichTextImageFileSize(node)
  })
  return total
}

export function formatRichTextBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return `${Number.isInteger(mb) ? mb.toFixed(0) : mb.toFixed(1)}MB`
}
