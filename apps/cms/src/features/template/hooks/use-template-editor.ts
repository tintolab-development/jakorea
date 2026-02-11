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

    // 라이브러리 기본값이 autofocus: true 이고, 생성자 끝에서 moveCursorToStart(autofocus) 호출 → false로 초기 포커스 방지
    const instance = new Editor({
      el: editorHostRef.current,
      autofocus: false,
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
        // load는 생성자 내부에서 emit('load', this)로 호출됨 — 콜백 인자로 받은 editor 사용 (instance는 아직 미할당)
        load: (editor: Editor) => {
          const core = editor as unknown as { blur(): void }
          setTimeout(() => core.blur(), 0)
          requestAnimationFrame(() => core.blur())
        },
      },
    })

    editorRef.current = instance
    const editorCore = instance as unknown as { blur(): void }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/17f6fbd2-a727-4bc2-b32f-9b76dc9e6837', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: 'use-template-editor.ts:Editor-created',
        message: 'editor-created',
        data: {
          scrollY: typeof window !== 'undefined' ? window.scrollY : null,
          activeTag: typeof document !== 'undefined' ? document.activeElement?.tagName : null,
          activeClass:
            typeof document !== 'undefined'
              ? (document.activeElement as HTMLElement)?.className?.slice(0, 80) || null
              : null,
        },
        timestamp: Date.now(),
        hypothesisId: 'A',
      }),
    }).catch(() => {})
    // #endregion
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
      // setHTML/setModel 후 라이브러리 내부에서 비동기로 포커스가 들어갈 수 있음 → 다음 틱에 blur
      setTimeout(() => editorCore.blur(), 0)
      requestAnimationFrame(() => editorCore.blur())
    }
    // Toast UI Editor(ProseMirror)가 마운트 후 포커스를 잡아 스크롤이 내려가는 이슈 방지: ProseMirror에 focus 시 즉시 blur
    const hostEl = editorHostRef.current
    if (hostEl) {
      hostEl.setAttribute('tabindex', '-1')
    }
    editorCore.blur()
    let removeProseFocusListener: (() => void) | null = null
    let tRemoveProse = 0
    const attachProseBlur = (el: HTMLElement) => {
      if (!el || (el as unknown as { _proseBlurAttached?: boolean })._proseBlurAttached) return
      ;(el as unknown as { _proseBlurAttached?: boolean })._proseBlurAttached = true
      const onProseFocus = () => {
        editorCore.blur()
      }
      el.addEventListener('focus', onProseFocus, true)
      removeProseFocusListener = () => {
        el.removeEventListener('focus', onProseFocus, true)
        removeProseFocusListener = null
      }
      tRemoveProse = window.setTimeout(() => {
        removeProseFocusListener?.()
        removeProseFocusListener = null
      }, 2000)
    }
    const tryAttach = () => {
      const found = hostEl?.querySelector?.(
        '.ProseMirror, [contenteditable="true"]'
      ) as HTMLElement | null
      if (found) attachProseBlur(found)
      return !!found
    }
    let cleanupMo: (() => void) | null = null
    if (!tryAttach() && hostEl && typeof MutationObserver !== 'undefined') {
      const mo = new MutationObserver(() => {
        if (tryAttach()) mo.disconnect()
      })
      mo.observe(hostEl, { childList: true, subtree: true })
      const tDisconnect = window.setTimeout(() => mo.disconnect(), 3000)
      cleanupMo = () => {
        mo.disconnect()
        clearTimeout(tDisconnect)
      }
    }
    requestAnimationFrame(() => {
      tryAttach()
    })
    const blurAgain = () => {
      const current = editorRef.current as unknown as { blur(): void } | null
      if (current) current.blur()
    }
    const rafBlur = () => {
      requestAnimationFrame(() => {
        blurAgain()
        requestAnimationFrame(blurAgain)
      })
    }
    rafBlur()
    const t1 = setTimeout(blurAgain, 0)
    const t2 = setTimeout(blurAgain, 50)
    const t3 = setTimeout(blurAgain, 150)
    const t4 = setTimeout(blurAgain, 300)
    const t5 = setTimeout(blurAgain, 450)
    const t6 = setTimeout(blurAgain, 600)
    const tLog = setTimeout(() => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/17f6fbd2-a727-4bc2-b32f-9b76dc9e6837', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'use-template-editor.ts:after-blur-timeouts',
          message: 'editor-after-600ms',
          data: {
            scrollY: typeof window !== 'undefined' ? window.scrollY : null,
            activeTag: typeof document !== 'undefined' ? document.activeElement?.tagName : null,
            activeClass:
              typeof document !== 'undefined'
                ? (document.activeElement as HTMLElement)?.className?.slice(0, 80) || null
                : null,
          },
          timestamp: Date.now(),
          hypothesisId: 'A',
        }),
      }).catch(() => {})
      // #endregion
    }, 650)
    return () => {
      cleanupMo?.()
      removeProseFocusListener?.()
      if (tRemoveProse) clearTimeout(tRemoveProse)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
      clearTimeout(t5)
      clearTimeout(t6)
      clearTimeout(tLog)
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
