import type { Editor } from '@tiptap/react'
import type { RichTextEditorApi } from '../types'

export function createRichTextEditorApi(editor: Editor): RichTextEditorApi {
  const withMarkdown = editor as Editor & { getMarkdown?: () => string }

  return {
    getMarkdown: () => {
      if (typeof withMarkdown.getMarkdown === 'function') {
        return withMarkdown.getMarkdown()
      }
      return editor.getHTML()
    },
    getHTML: () => editor.getHTML(),
    insertText: (text: string) => {
      editor.chain().focus().insertContent(text).run()
    },
    focus: () => {
      editor.chain().focus().run()
    },
    blur: () => {
      editor.commands.blur()
    },
  }
}
