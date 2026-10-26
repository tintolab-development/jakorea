import type { Editor } from '@tiptap/react'
import '@tiptap/extension-emoji'
import {
  getEmbedUrlFromYoutubeUrl,
  isValidYoutubeUrl,
} from '@tiptap/extension-youtube'
import { NodeSelection } from '@tiptap/pm/state'
import { findEmojiByName } from './emoji-extension'
import {
  getRichTextImageCount,
  getRichTextImageFileSize,
  getRichTextImageTotalBytes,
  RICH_TEXT_IMAGE_MAX_COUNT,
  RICH_TEXT_IMAGE_MAX_TOTAL_BYTES,
} from './limits'
import {
  RICH_TEXT_INLINE_IMAGE_COUNT_MESSAGE,
  RICH_TEXT_INLINE_IMAGE_MAX_BYTES,
  RICH_TEXT_INLINE_IMAGE_SIZE_MESSAGE,
  RICH_TEXT_INLINE_IMAGE_TOTAL_MESSAGE,
} from './visible-length'

const IMAGE_ACCEPT = 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
const IMAGE_MAX_BYTES = RICH_TEXT_INLINE_IMAGE_MAX_BYTES

export function promptImageUrl(): string | null {
  const url = window.prompt('이미지 URL', 'https://')
  if (url === null) return null
  const trimmed = url.trim()
  return trimmed || null
}

/** 선택된 텍스트에 링크를 걸거나, 선택이 없으면 URL을 링크 텍스트로 삽입한다. */
export function setLinkFromUrl(editor: Editor, url: string): boolean {
  const href = url.trim()
  if (href === '') {
    return editor.chain().focus().extendMarkRange('link').unsetLink().run()
  }
  if (editor.state.selection.empty && !editor.isActive('link')) {
    return editor
      .chain()
      .focus()
      .insertContent({
        type: 'text',
        text: href,
        marks: [{ type: 'link', attrs: { href } }],
      })
      .run()
  }
  return editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
}

export function promptLinkUrl(editor: Editor): void {
  const previousUrl = editor.getAttributes('link').href as string | undefined
  const url = window.prompt('링크 URL', previousUrl ?? 'https://')
  if (url === null) return
  setLinkFromUrl(editor, url)
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

export type ResolvedRichTextImageSrc = string | { src: string; persistSrc?: string }

/** 이 에디터에 크기를 아는 저장 이미지만 합친다. 외부 URL은 크기가 없어 빠진다. */
export function sumKnownInlineImageBytes(editor: Editor): number {
  if (editor.isDestroyed) return 0
  let total = 0
  editor.state.doc.descendants(node => {
    if (node.type.name !== 'image') return
    const size = node.attrs.fileSize
    if (typeof size === 'number' && Number.isFinite(size) && size > 0) total += size
  })
  return total
}

function applyImageSrc(
  editor: Editor,
  src: string,
  alt?: string,
  persistSrc?: string,
  fileSize?: number
): boolean {
  if (editor.isDestroyed) return false
  const attrs = {
    src,
    alt: alt ?? '',
    ...(persistSrc?.trim() ? { persistSrc: persistSrc.trim() } : {}),
    ...(typeof fileSize === 'number' && fileSize > 0 ? { fileSize } : {}),
  }
  const ok =
    editor.chain().focus().setImage(attrs).run() ||
    editor.chain().focus().insertContent({ type: 'image', attrs }).run()
  if (!ok) {
    window.alert('이미지를 삽입할 수 없습니다. 커서를 본문에 두고 다시 시도해 주세요.')
  }
  return ok
}

function selectedImageNode(editor: Editor) {
  const selection = editor.state.selection
  if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image') return null
  return selection.node
}

/** 한도를 넘으면 알림 후 true. 선택한 이미지를 교체할 때는 그 장·용량을 뺀다. */
function rejectRichTextImageInsert(editor: Editor, incomingBytes: number): boolean {
  const selected = selectedImageNode(editor)
  const selectedSize = selected == null ? 0 : getRichTextImageFileSize(selected)
  const nextCount = getRichTextImageCount(editor) - (selected == null ? 0 : 1) + 1
  if (nextCount > RICH_TEXT_IMAGE_MAX_COUNT) {
    window.alert(RICH_TEXT_INLINE_IMAGE_COUNT_MESSAGE)
    return true
  }
  if (incomingBytes <= 0) return false
  const nextTotalBytes = getRichTextImageTotalBytes(editor) - selectedSize + incomingBytes
  if (nextTotalBytes > RICH_TEXT_IMAGE_MAX_TOTAL_BYTES) {
    window.alert(RICH_TEXT_INLINE_IMAGE_TOTAL_MESSAGE)
    return true
  }
  return false
}

export function insertImageFromUrl(editor: Editor, src: string): void {
  if (rejectRichTextImageInsert(editor, 0)) return
  applyImageSrc(editor, src)
}

export function insertImageFromFile(
  editor: Editor,
  file: File,
  resolveSrc?: (file: File) => Promise<ResolvedRichTextImageSrc>,
): void {
  if (!IMAGE_ACCEPT.split(',').some(type => file.type === type.trim())) {
    window.alert('JPG, PNG, GIF, WebP 이미지만 삽입할 수 있습니다.')
    return
  }
  if (file.size > IMAGE_MAX_BYTES) {
    window.alert(RICH_TEXT_INLINE_IMAGE_SIZE_MESSAGE)
    return
  }
  if (rejectRichTextImageInsert(editor, file.size)) return

  const insertResolved = (src: string, persistSrc?: string) => {
    if (rejectRichTextImageInsert(editor, file.size)) return
    applyImageSrc(editor, src, file.name, persistSrc, file.size)
  }

  if (resolveSrc) {
    void resolveSrc(file)
      .then(resolved => {
        const src = typeof resolved === 'string' ? resolved : resolved.src
        const persistSrc = typeof resolved === 'string' ? undefined : resolved.persistSrc
        const trimmed = src.trim()
        if (!trimmed || trimmed.startsWith('data:')) {
          window.alert('이미지 주소를 받지 못했습니다. 다시 시도해 주세요.')
          return
        }
        insertResolved(trimmed, persistSrc)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message.trim() : ''
        window.alert(message || '이미지를 업로드하지 못했습니다. 다시 시도해 주세요.')
      })
    return
  }

  // blob: URL은 세션 한정 — 저장 후 뷰어에서 깨져 alt(파일명)만 보인다.
  // data URL은 본문이 쉽게 10만자를 넘어 API 검증에 실패한다. remote는 resolveSrc로 올린다.
  const reader = new FileReader()
  reader.onload = () => {
    const src = typeof reader.result === 'string' ? reader.result : ''
    if (!src.startsWith('data:')) {
      window.alert('이미지를 읽을 수 없습니다. 다시 시도해 주세요.')
      return
    }
    insertResolved(src)
  }
  reader.onerror = () => {
    window.alert('이미지를 읽을 수 없습니다. 다시 시도해 주세요.')
  }
  reader.readAsDataURL(file)
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

function dispatchListIndentKey(editor: Editor, shiftKey: boolean): void {
  editor.chain().focus().run()
  editor.view.dom.dispatchEvent(
    new KeyboardEvent('keydown', {
      key: 'Tab',
      code: 'Tab',
      shiftKey,
      bubbles: true,
      cancelable: true,
    })
  )
}

/** 목록 들여쓰기 — Tiptap 3 ListKeymap Tab 핸들러에 위임 */
export function indentListItem(editor: Editor): void {
  dispatchListIndentKey(editor, false)
}

/** 목록 내어쓰기 — Shift+Tab */
export function outdentListItem(editor: Editor): void {
  dispatchListIndentKey(editor, true)
}

export function insertEmoji(editor: Editor, name: string): boolean {
  if (editor.chain().focus().setEmoji(name).run()) {
    return true
  }
  const item = findEmojiByName(name)
  if (item?.emoji) {
    return editor.chain().focus().insertContent(item.emoji).run()
  }
  return false
}

export const RICH_TEXT_IMAGE_ACCEPT = IMAGE_ACCEPT
