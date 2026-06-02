/**
 * CMS Rich Text (Tiptap headless)
 *
 * - MIT / 무료 extension만 (`extensions.ts` 주석 참고)
 * - UI: `RichTextEditor` + `toolbar` 슬롯 또는 `editor.chain()` 커스텀
 * - Toast UI 교체: `docs/implementation/rich-text-editor-tiptap-migration.md`
 */

export { createRichTextExtensions } from './extensions'
export { createRichTextEditorApi } from './lib/editor-api'
export {
  getInitialEditorContent,
  markdownToHtml,
  serializeEditorContent,
  toEditorContentType,
} from './lib/content'
export { RichTextEditor } from './rich-text-editor'
export { RichTextToolbar } from './rich-text-toolbar'
export { RichTextViewer } from './rich-text-viewer'
export { useRichTextEditor } from './use-rich-text-editor'
export type {
  CreateRichTextExtensionsOptions,
  RichTextContentFormat,
  RichTextEditorApi,
  RichTextEditorContentType,
  RichTextEditorProps,
  RichTextViewerProps,
  UseRichTextEditorOptions,
} from './types'
