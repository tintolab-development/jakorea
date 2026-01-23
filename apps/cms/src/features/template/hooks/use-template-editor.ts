import { useEffect, useRef, useState } from 'react'
import Editor from '@toast-ui/editor'

export function useTemplateEditor(open: boolean, initialValue: string = '') {
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
      initialValue: watchedMarkdown || '',
      events: {
        change: () => {
          const md = instance.getMarkdown()
          setWatchedMarkdown(md)
        },
      },
    })

    editorRef.current = instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

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
