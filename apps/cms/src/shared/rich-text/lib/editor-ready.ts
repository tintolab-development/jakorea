import type { Editor } from '@tiptap/react'

/** TipTap 인스턴스가 파괴된 직후에도 ref가 남을 수 있어 commands 접근 전 확인 */
export function isRichTextEditorReady(
  editor: Editor | null | undefined
): editor is Editor {
  return Boolean(editor && !editor.isDestroyed)
}
