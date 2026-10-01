import { Extension } from '@tiptap/core'
import { Plugin } from '@tiptap/pm/state'
import {
  countRichTextDocumentCharacters,
  RICH_TEXT_MAX_TEXT_CHARACTERS,
} from './limits'

export const RichTextCharacterLimit = Extension.create<{
  maxCharacters: number
}>({
  name: 'richTextCharacterLimit',

  addOptions() {
    return {
      maxCharacters: RICH_TEXT_MAX_TEXT_CHARACTERS,
    }
  },

  addProseMirrorPlugins() {
    const maxCharacters = this.options.maxCharacters
    return [
      new Plugin({
        filterTransaction(transaction, state) {
          if (!transaction.docChanged) return true
          const nextCount = countRichTextDocumentCharacters(transaction.doc)
          if (nextCount <= maxCharacters) return true

          const previousCount = countRichTextDocumentCharacters(state.doc)
          if (nextCount <= previousCount) return true

          if (typeof window !== 'undefined') {
            window.alert(`본문은 최대 ${maxCharacters.toLocaleString('ko-KR')}자까지 입력할 수 있습니다.`)
          }
          return false
        },
      }),
    ]
  },
})
