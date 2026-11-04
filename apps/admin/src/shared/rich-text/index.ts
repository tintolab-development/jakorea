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
export {
  RichTextViewer,
  useRichTextEditor,
  RICH_TEXT_EDITOR_DEFAULT_MIN_HEIGHT_PX,
} from '@jakorea/rich-text/react'
export { CmsRichTextEditor as RichTextEditor } from './cms-rich-text-editor'
export { RichTextToolbar } from './toolbar/rich-text-toolbar'
export {
  createInitialAdminHtmlEditorState,
  isEmptyAdminHtml,
  isHtmlContent,
  resolveAdminHtmlForSave,
} from './admin-html-editor'
export { useAdminHtmlEditor, ADMIN_RICH_TEXT_PLACEHOLDER } from './use-admin-html-editor'
export { getRemoteRichTextBodyError, REMOTE_RICH_TEXT_BODY_MAX_LENGTH } from './lib/remote-body'
export type { RichTextToolbarProps } from './toolbar/rich-text-toolbar'
export type { AdminEditorMode, AdminHtmlEditorState } from './admin-html-editor'
export type { UseAdminHtmlEditorOptions } from './use-admin-html-editor'
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
