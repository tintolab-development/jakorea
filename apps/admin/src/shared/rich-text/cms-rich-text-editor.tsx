import { RichTextEditor, type RichTextEditorProps } from '@jakorea/rich-text/react'
import type { AdminEditorMode } from './admin-html-editor'
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
  /** HTML 원본 블록의 소스 편집 기능 (기본 false, HTML 저장 화면만) */
  allowRawHtmlBlock?: boolean
  /** Admin 전용 본문 모드 전환. 전달하면 툴바 오른쪽에 모드 전환을 표시한다. */
  editorMode?: AdminEditorMode
  htmlSource?: string
  onEditorModeChange?: (mode: AdminEditorMode) => void
  onHtmlSourceChange?: (html: string) => void
}

/**
 * CMS RichText 에디터 — Ant Design 툴바 기본 포함.
 * 셸 `minHeight` 기본 284px. 더 큰 고정 높이는 `height`.
 */
export function CmsRichTextEditor({
  editor,
  showToolbar = true,
  toolbar,
  allowInlineMedia = true,
  resolveImageSrc,
  allowRawHtmlBlock = false,
  editorMode,
  htmlSource,
  onEditorModeChange,
  onHtmlSourceChange,
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
        editorMode={editorMode}
        htmlSource={htmlSource}
        onEditorModeChange={onEditorModeChange}
        onHtmlSourceChange={onHtmlSourceChange}
      />
    ) : null)

  return (
    <RichTextEditor
      editor={editor}
      className={[
        'cms-rich-text-editor',
        editorMode === 'html' ? 'rich-text-editor--html-mode' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      toolbar={toolbarNode}
      {...rest}
    />
  )
}
