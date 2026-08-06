/**
 * CMS Rich Text — `@jakorea/rich-text` re-export + Ant Design 툴바 어댑터
 *
 * - 패키지: Tiptap core + React shell
 * - CMS: Ant Design 툴바, 기존 `@/shared/rich-text` import 경로 유지
 * - @see packages/rich-text/README.md
 */

import '@jakorea/rich-text/styles/content.css'
import '@jakorea/rich-text/styles/editor.css'
import '@jakorea/rich-text/styles/toolbar.css'

export {
  createRichTextExtensions,
  createRichTextEditorApi,
  getInitialEditorContent,
  markdownToHtml,
  serializeEditorContent,
  toEditorContentType,
} from '@jakorea/rich-text'
export { RichTextViewer, useRichTextEditor } from '@jakorea/rich-text/react'
export { CmsRichTextEditor as RichTextEditor } from './cms-rich-text-editor'
export { RichTextToolbar } from './toolbar/rich-text-toolbar'
export type { RichTextToolbarProps } from './toolbar/rich-text-toolbar'
export type {
  CreateRichTextExtensionsOptions,
  Editor,
  RichTextContentFormat,
  RichTextEditorApi,
  RichTextEditorContentType,
  RichTextEditorProps,
  RichTextViewerProps,
  UseRichTextEditorOptions,
} from '@jakorea/rich-text/react'
