import type { Editor } from '@tiptap/core'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

export const RICH_TEXT_MAX_TEXT_CHARACTERS = 50_000
export const RICH_TEXT_IMAGE_MAX_TOTAL_BYTES = 20 * 1024 * 1024

const segmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter('ko', { granularity: 'grapheme' })
    : null

export function countRichTextCharacters(text: string): number {
  if (!text) return 0
  if (segmenter) return [...segmenter.segment(text)].length
  return Array.from(text).length
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
