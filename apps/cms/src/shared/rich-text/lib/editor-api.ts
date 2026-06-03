import type { Editor } from '@tiptap/react'
import type { RichTextEditorApi } from '../types'
import { isRichTextEditorReady } from './editor-ready'

export function createRichTextEditorApi(editor: Editor): RichTextEditorApi {
  const withMarkdown = editor as Editor & { getMarkdown?: () => string }

  return {
    getMarkdown: () => {
      if (!isRichTextEditorReady(editor)) return ''
      if (typeof withMarkdown.getMarkdown === 'function') {
        return withMarkdown.getMarkdown()
      }
      return editor.getHTML()
    },
    getHTML: () => (isRichTextEditorReady(editor) ? editor.getHTML() : ''),
    insertText: (text: string) => {
      if (!isRichTextEditorReady(editor)) return
      editor.chain().focus().insertContent(text).run()
    },
    focus: () => {
      if (!isRichTextEditorReady(editor)) return
      editor.chain().focus().run()
    },
    blur: () => {
      if (!isRichTextEditorReady(editor)) return
      editor.commands.blur()
    },
  }
}
