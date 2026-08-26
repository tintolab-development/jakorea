import type { Editor } from '@tiptap/react'
import { serializeEditorContent } from './content'
import { isRichTextEditorReady } from './editor-ready'
import type { RichTextEditorApi } from './types'

export function createRichTextEditorApi(editor: Editor): RichTextEditorApi {
  return {
    getMarkdown: () =>
      isRichTextEditorReady(editor) ? serializeEditorContent(editor, 'markdown') : '',
    getHTML: () =>
      isRichTextEditorReady(editor) ? serializeEditorContent(editor, 'html') : '',
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
