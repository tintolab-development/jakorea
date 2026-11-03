import {
  RichTextEditor,
  type RichTextEditorProps,
} from '@jakorea/rich-text/react'
import { RichTextToolbar } from './toolbar/rich-text-toolbar'
import './cms-rich-text-editor.css'

type CmsRichTextEditorProps = Omit<RichTextEditorProps, 'toolbar'> & {
  /**
   * 기본 `true` — Ant Design `RichTextToolbar` 표시.
   * `toolbar`를 넘기면 해당 노드로 대체.
   */
  showToolbar?: boolean
  toolbar?: RichTextEditorProps['toolbar']
  /** 인라인 이미지·YouTube 삽입 (기본 true) */
  allowInlineMedia?: boolean
  resolveImageSrc?: (file: File) => Promise<string>
  /** 삽입 메뉴 'HTML 소스 붙여넣기' (기본 false, HTML 저장 화면만) */
  allowRawHtmlBlock?: boolean
}

/** CMS RichText 에디터 — Ant Design 툴바 기본 포함 */
export function CmsRichTextEditor({
  editor,
  showToolbar = true,
  toolbar,
  allowInlineMedia = true,
  resolveImageSrc,
  allowRawHtmlBlock = false,
  className,
  ...rest
}: CmsRichTextEditorProps) {
  const toolbarNode =
    toolbar ??
    (showToolbar ? (
      <RichTextToolbar
        editor={editor}
        allowInlineMedia={allowInlineMedia}
        resolveImageSrc={resolveImageSrc}
        allowRawHtmlBlock={allowRawHtmlBlock}
      />
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
