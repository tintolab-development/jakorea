import { useLayoutEffect, useRef } from 'react'
import Editor from '@toast-ui/editor'

const EDITOR_HEIGHT = '369px'
const PLACEHOLDER = '공지사항 내용을 입력해 주세요.'

/**
 * 공지 등록/수정 모달용 Toast UI WYSIWYG — 모달 `open` 시에만 마운트·파기
 * `initialMarkdown`·`resetKey` 변경 시 인스턴스 재생성(수정 모드 본문 주입).
 */
export function useNoticeWysiwygEditor(
  open: boolean,
  initialMarkdown: string = '',
  /** open·noticeId·mode 등 — 동일 open에서 다른 글 편집 시 재마운트 */
  resetKey?: string | number
) {
  const editorHostRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<Editor | null>(null)

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
        height: EDITOR_HEIGHT,
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        usageStatistics: false,
        placeholder: PLACEHOLDER,
        initialValue: initialMarkdown || '',
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
  }, [open, initialMarkdown, resetKey])

  const getMarkdown = () => (editorRef.current ? editorRef.current.getMarkdown() : '')

  const getHTML = () => (editorRef.current ? editorRef.current.getHTML() : '')

  return { editorHostRef, getMarkdown, getHTML }
}
