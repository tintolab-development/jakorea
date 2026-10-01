import {
  RichTextEditor,
  type RichTextEditorProps,
} from '@jakorea/rich-text/react'
import type { AdminFileUploadOwner } from '@/shared/lib/admin-file-upload/types'
import { RichTextToolbar } from './toolbar/rich-text-toolbar'
import './cms-rich-text-editor.css'

type CmsRichTextEditorProps = Omit<RichTextEditorProps, 'toolbar'> & {
  /**
   * 기본 `true` — Ant Design `RichTextToolbar` 표시.
   * `toolbar`를 넘기면 해당 노드로 대체.
   */
  showToolbar?: boolean
  toolbar?: RichTextEditorProps['toolbar']
  /** 본문 이미지 업로드 owner. 신규는 ownerId null */
  fileUploadOwner?: AdminFileUploadOwner | null
}

/** CMS Rich Text 에디터 — Ant Design 툴바 기본 포함 */
export function CmsRichTextEditor({
  editor,
  showToolbar = true,
  toolbar,
  className,
  fileUploadOwner,
  ...rest
}: CmsRichTextEditorProps) {
  const toolbarNode =
    toolbar ??
    (showToolbar ? (
      <RichTextToolbar editor={editor} fileUploadOwner={fileUploadOwner} />
    ) : null)

  return (
    <RichTextEditor
      editor={editor}
      className={['cms-rich-text-editor', className].filter(Boolean).join(' ')}
      toolbar={toolbarNode}
      {...rest}
    />
  )
}
