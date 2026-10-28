import {
  RichTextEditor,
  type RichTextEditorProps,
} from '@jakorea/rich-text/react'
import type { ResolvedRichTextImageSrc } from '@jakorea/rich-text'
import { PfRichTextToolbar } from './pf-rich-text-toolbar'
import editorStyles from './pf-rich-text-editor.module.css'

type PfRichTextEditorProps = Omit<RichTextEditorProps, 'toolbar'> & {
  showToolbar?: boolean
  toolbar?: RichTextEditorProps['toolbar']
  resolveImageSrc?: (file: File) => Promise<ResolvedRichTextImageSrc>
  allowImageUrl?: boolean
}

/** Platform Rich Text 에디터 — PF full 툴바 기본 포함 */
export function PfRichTextEditor({
  editor,
  showToolbar = true,
  toolbar,
  className,
  resolveImageSrc,
  allowImageUrl,
  ...rest
}: PfRichTextEditorProps) {
  const toolbarNode =
    toolbar ?? (showToolbar ? <PfRichTextToolbar editor={editor} resolveImageSrc={resolveImageSrc} allowImageUrl={allowImageUrl} /> : null)

  return (
    <RichTextEditor
      editor={editor}
      className={[editorStyles.pfRichTextEditor, className].filter(Boolean).join(' ')}
      toolbar={toolbarNode}
      {...rest}
    />
  )
}
