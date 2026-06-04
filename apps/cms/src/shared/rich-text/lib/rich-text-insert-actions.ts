import type { Editor } from '@tiptap/react'
import {
  getEmbedUrlFromYoutubeUrl,
  isValidYoutubeUrl,
} from '@tiptap/extension-youtube'

const IMAGE_ACCEPT = 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
const IMAGE_MAX_BYTES = 10 * 1024 * 1024

export function promptImageUrl(): string | null {
  const url = window.prompt('이미지 URL', 'https://')
  if (url === null) return null
  const trimmed = url.trim()
  return trimmed || null
}

export function promptLinkUrl(editor: Editor): void {
  const previousUrl = editor.getAttributes('link').href as string | undefined
  const url = window.prompt('링크 URL', previousUrl ?? 'https://')
  if (url === null) return
  const trimmed = url.trim()
  if (trimmed === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run()
}

export function promptYoutubeUrl(): string | null {
  const url = window.prompt(
    'YouTube URL',
    'https://www.youtube.com/watch?v='
  )
  if (url === null) return null
  const trimmed = url.trim()
  if (!trimmed) return null
  if (!isValidYoutubeUrl(trimmed)) {
    window.alert('올바른 YouTube URL을 입력해 주세요.')
    return null
  }
  return trimmed
}

export function insertImageFromUrl(editor: Editor, src: string): void {
  editor.chain().focus().setImage({ src }).run()
}

export function insertImageFromFile(editor: Editor, file: File): void {
  if (!IMAGE_ACCEPT.split(',').some(type => file.type === type.trim())) {
    window.alert('JPG, PNG, GIF, WebP 이미지만 삽입할 수 있습니다.')
    return
  }
  if (file.size > IMAGE_MAX_BYTES) {
    window.alert('이미지는 10MB 이하만 삽입할 수 있습니다.')
    return
  }
  const url = URL.createObjectURL(file)
  editor.chain().focus().setImage({ src: url, alt: file.name }).run()
}

export function insertYoutubeFromUrl(editor: Editor, url: string): void {
  if (!getEmbedUrlFromYoutubeUrl({ url, nocookie: true })) {
    window.alert('YouTube URL을 변환할 수 없습니다.')
    return
  }
  editor
    .chain()
    .focus()
    .setYoutubeVideo({
      src: url,
      width: 640,
      height: 360,
    })
    .run()
}

export function insertTable(editor: Editor): void {
  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

export function insertHorizontalRule(editor: Editor): void {
  editor.chain().focus().setHorizontalRule().run()
}

export const RICH_TEXT_IMAGE_ACCEPT = IMAGE_ACCEPT
