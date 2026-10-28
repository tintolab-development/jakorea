import type { Editor } from '@tiptap/react'
import { serializeEditorContent } from './content'
import { isRichTextEditorReady } from './editor-ready'
import {
  countRichTextDocumentCharacters,
  getRichTextImageTotalBytes,
} from './limits'
import type { RichTextEditorApi } from './types'

export function createRichTextEditorApi(editor: Editor): RichTextEditorApi {
  return {
    getMarkdown: () =>
      isRichTextEditorReady(editor) ? serializeEditorContent(editor, 'markdown') : '',
    getHTML: () =>
      isRichTextEditorReady(editor) ? serializeEditorContent(editor, 'html') : '',
    getText: () => (isRichTextEditorReady(editor) ? editor.getText() : ''),
    getCharacterCount: () =>
      isRichTextEditorReady(editor) ? countRichTextDocumentCharacters(editor.state.doc) : 0,
    getImageTotalBytes: () =>
      isRichTextEditorReady(editor) ? getRichTextImageTotalBytes(editor) : 0,
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
