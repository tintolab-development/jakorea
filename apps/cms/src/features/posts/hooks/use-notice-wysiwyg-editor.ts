import { useLayoutEffect, useRef } from 'react'
import Editor from '@toast-ui/editor'

const DEFAULT_EDITOR_HEIGHT = '369px'
const DEFAULT_PLACEHOLDER = '공지사항 내용을 입력해 주세요.'

export type NoticeWysiwygEditorOptions = {
  /** 예: FAQ 모달은 `260px` 등으로 축소 */
  height?: string
  placeholder?: string
}

/**
 * 공지 등록/수정 모달용 Toast UI WYSIWYG — 모달 `open` 시에만 마운트·파기
 * `initialMarkdown`·`resetKey` 변경 시 인스턴스 재생성(수정 모드 본문 주입).
 * `options`로 FAQ 등 다른 화면에서 높이·placeholder만 바꿔 재사용 가능.
 */
export function useNoticeWysiwygEditor(
  open: boolean,
  initialMarkdown: string = '',
  /** open·noticeId·mode 등 — 동일 open에서 다른 글 편집 시 재마운트 */
  resetKey?: string | number,
  options?: NoticeWysiwygEditorOptions
) {
  const editorHostRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<Editor | null>(null)

  const height = options?.height ?? DEFAULT_EDITOR_HEIGHT
  const placeholder = options?.placeholder ?? DEFAULT_PLACEHOLDER

  useLayoutEffect(() => {
    if (!open) {
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
      return
    }

    let cancelled = false

    const tryMount = () => {
      const el = editorHostRef.current
      if (cancelled || !el || editorRef.current) return

      const instance = new Editor({
        el,
        autofocus: false,
        height,
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        usageStatistics: false,
        placeholder,
        initialValue: initialMarkdown || '',
        toolbarItems: [
          ['heading', 'bold', 'italic', 'strike'],
          ['hr', 'quote'],
          ['ul', 'ol', 'table'],
          ['link', 'image'],
          ['code', 'codeblock'],
        ],
        events: {
          change: () => {},
        },
      })

      editorRef.current = instance
    }

    tryMount()
    const raf1 = requestAnimationFrame(() => {
      tryMount()
      requestAnimationFrame(tryMount)
    })
    const t = window.setTimeout(tryMount, 16)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf1)
      clearTimeout(t)
      if (editorRef.current) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, [open, initialMarkdown, resetKey, height, placeholder])

  const getMarkdown = () => (editorRef.current ? editorRef.current.getMarkdown() : '')

  const getHTML = () => (editorRef.current ? editorRef.current.getHTML() : '')

  return { editorHostRef, getMarkdown, getHTML }
}
