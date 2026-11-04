import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useRichTextEditor,
  type RichTextEditorApi,
  type UseRichTextEditorOptions,
} from '@jakorea/rich-text/react'
import {
  createInitialAdminHtmlEditorState,
  resolveAdminHtmlForSave,
  shouldPreserveAdminRawHtmlBlock,
  toAdminHtmlSource,
  toAdminVisualHtml,
  type AdminEditorMode,
  type AdminHtmlEditorState,
} from './admin-html-editor'

export const ADMIN_RICH_TEXT_PLACEHOLDER = '내용을 입력해 주세요'

export type UseAdminHtmlEditorOptions = Pick<
  UseRichTextEditorOptions,
  | 'enabled'
  | 'initialContent'
  | 'contentFormat'
  | 'resetKey'
  | 'placeholder'
  | 'autofocus'
  | 'preset'
  | 'extraExtensions'
  | 'resolveImageSrc'
> & {
  editorHeight?: string
}

type AdminHtmlEditorStateWithInput = AdminHtmlEditorState & {
  input: {
    enabled: boolean | undefined
    resetKey: UseRichTextEditorOptions['resetKey']
    initialContent: string
    contentFormat: UseRichTextEditorOptions['contentFormat']
  }
}

export function useAdminHtmlEditor({
  enabled,
  initialContent = '',
  contentFormat = 'markdown',
  resetKey,
  placeholder = ADMIN_RICH_TEXT_PLACEHOLDER,
  autofocus = false,
  preset = 'full',
  extraExtensions,
  resolveImageSrc,
}: UseAdminHtmlEditorOptions) {
  const editorInput = useMemo(
    () => ({ enabled, resetKey, initialContent, contentFormat }),
    [enabled, resetKey, initialContent, contentFormat]
  )
  const initialEditorState = useMemo<AdminHtmlEditorStateWithInput>(
    () => ({ ...createInitialAdminHtmlEditorState(initialContent), input: editorInput }),
    [editorInput, initialContent]
  )
  const editorInitialContent = useMemo(
    () => toAdminVisualHtml(initialContent, initialEditorState.preserveRawHtmlBlock),
    [initialContent, initialEditorState.preserveRawHtmlBlock]
  )
  const apiRef = useRef<RichTextEditorApi | null>(null)
  const pendingVisualHtmlRef = useRef<string | null>(null)
  const [state, setState] = useState<AdminHtmlEditorStateWithInput>(initialEditorState)
  const currentState = state.input === editorInput ? state : initialEditorState
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = currentState
  }, [currentState])

  const { editor, api } = useRichTextEditor({
    enabled,
    initialContent: editorInitialContent,
    contentFormat,
    resetKey,
    placeholder,
    autofocus,
    preset,
    extraExtensions,
    resolveImageSrc,
    visualImagePosition: true,
    onReady: readyApi => {
      apiRef.current = readyApi
    },
  })

  const getEditorHtml = useCallback(() => apiRef.current?.getHTML() ?? api?.getHTML() ?? '', [api])

  const getEditorMarkdown = useCallback(
    () => apiRef.current?.getMarkdown() ?? api?.getMarkdown() ?? '',
    [api]
  )

  useEffect(() => {
    pendingVisualHtmlRef.current = null
  }, [editorInput])

  useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      setState(current => {
        const nextState = current.input === editorInput ? current : initialEditorState
        if (nextState.mode !== 'visual' || nextState.visualDirty) return nextState
        return { ...nextState, visualDirty: true }
      })
    }

    editor.on('update', handleUpdate)
    return () => {
      editor.off('update', handleUpdate)
    }
  }, [editor, editorInput, initialEditorState])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(enabled && currentState.mode === 'visual')
  }, [editor, enabled, currentState.mode])

  useEffect(() => {
    if (!editor || pendingVisualHtmlRef.current === null) return

    editor.commands.setContent(pendingVisualHtmlRef.current, {
      emitUpdate: false,
      contentType: 'html',
    })
    pendingVisualHtmlRef.current = null
  }, [editor])

  const setEditorMode = useCallback(
    (nextMode: AdminEditorMode) => {
      const current =
        stateRef.current.input === editorInput ? stateRef.current : initialEditorState
      if (current.mode === nextMode) return

      if (nextMode === 'html') {
        const visualHtml = current.visualDirty
          ? getEditorHtml()
          : current.draftHtml || getEditorHtml()
        const nextHtml = toAdminHtmlSource(visualHtml)

        setState({
          ...current,
          mode: 'html',
          draftHtml: nextHtml,
          preserveRawHtmlBlock: shouldPreserveAdminRawHtmlBlock(nextHtml),
        })
        return
      }

      const nextHtml = current.draftHtml
      const preserveRawHtmlBlock = shouldPreserveAdminRawHtmlBlock(nextHtml)
      const visualHtml = toAdminVisualHtml(nextHtml, preserveRawHtmlBlock)
      if (editor) {
        editor.commands.setContent(visualHtml, {
          emitUpdate: false,
          contentType: 'html',
        })
      } else {
        pendingVisualHtmlRef.current = visualHtml
      }

      setState({
        ...current,
        mode: 'visual',
        visualDirty: false,
        preserveRawHtmlBlock,
      })
    },
    [editor, editorInput, getEditorHtml, initialEditorState]
  )

  const setHtmlSource = useCallback(
    (draftHtml: string) => {
      setState(current => {
        const nextState = current.input === editorInput ? current : initialEditorState
        return {
          ...nextState,
          draftHtml,
          preserveRawHtmlBlock: shouldPreserveAdminRawHtmlBlock(draftHtml),
        }
      })
    },
    [editorInput, initialEditorState]
  )

  const getHTML = useCallback(
    () =>
      resolveAdminHtmlForSave(
        stateRef.current.input === editorInput ? stateRef.current : initialEditorState,
        initialContent,
        getEditorHtml()
      ),
    [editorInput, getEditorHtml, initialContent, initialEditorState]
  )

  return {
    editor: editor as Editor | null,
    api,
    getHTML,
    getMarkdown: getEditorMarkdown,
    editorMode: currentState.mode,
    htmlSource: currentState.draftHtml,
    visualDirty: currentState.visualDirty,
    onEditorModeChange: setEditorMode,
    onHtmlSourceChange: setHtmlSource,
  }
}
