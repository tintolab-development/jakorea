import { useEffect, useRef, useState } from 'react'
import Editor from '@toast-ui/editor'

export function useTemplateEditor(
  open: boolean,
  initialValue: string = '',
  /** HTML 초기값 (WYSIWYG에서 사용, 지원 시 setHTML로 설정) */
  initialHtml?: string
) {
  const editorHostRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<Editor | null>(null)
  const [watchedMarkdown, setWatchedMarkdown] = useState<string>(initialValue)

  const destroyEditor = () => {
    if (editorRef.current) {
      editorRef.current.destroy()
      editorRef.current = null
    }
  }

  useEffect(() => {
    if (!open) {
      destroyEditor()
      return
    }
    if (!editorHostRef.current) return

    destroyEditor()

    const instance = new Editor({
      el: editorHostRef.current,
      height: '420px',
      initialEditType: 'wysiwyg',
      previewStyle: 'vertical',
      usageStatistics: false,
      ...({ autofocus: false } as { autofocus?: boolean }),
      initialValue: watchedMarkdown || '',
      events: {
        change: () => {
          const md = instance.getMarkdown()
          setWatchedMarkdown(md)
        },
      },
    })

    editorRef.current = instance
    const inst = instance as unknown as {
      setHTML?: (html: string) => void
      setMarkdown?: (md: string) => void
    }
    if (initialHtml?.trim()) {
      if (typeof inst.setHTML === 'function') {
        inst.setHTML(initialHtml)
      } else if (typeof inst.setMarkdown === 'function') {
        inst.setMarkdown(initialHtml)
      }
    }
    // Toast UI Editor는 마운트 시 포커스를 잡는 이슈가 있어, 초기 포커스 제거(스크롤 이동 방지)
    const editorCore = instance as unknown as { blur(): void }
    editorCore.blur()
    const blurAgain = () => {
      const current = editorRef.current as unknown as { blur(): void } | null
      if (current) current.blur()
    }
    const t1 = setTimeout(blurAgain, 0)
    const t2 = setTimeout(blurAgain, 50)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialHtml])

  const insertVariable = (key: string) => {
    if (!editorRef.current) return
    editorRef.current.insertText(`{{${key}}}`)
  }

  const getMarkdown = () => {
    return editorRef.current ? editorRef.current.getMarkdown() : watchedMarkdown
  }

  const getHTML = () => {
    return editorRef.current ? editorRef.current.getHTML() : ''
  }

  const setMarkdown = (value: string) => {
    setWatchedMarkdown(value)
  }

  return {
    editorHostRef,
    editorRef,
    watchedMarkdown,
    insertVariable,
    getMarkdown,
    getHTML,
    setMarkdown,
  }
}
