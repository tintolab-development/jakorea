import {
  RichTextEditor,
  type RichTextEditorProps,
} from '@jakorea/rich-text/react'
import { PfRichTextToolbar } from './pf-rich-text-toolbar'
import editorStyles from './pf-rich-text-editor.module.css'

type PfRichTextEditorProps = Omit<RichTextEditorProps, 'toolbar'> & {
  showToolbar?: boolean
  toolbar?: RichTextEditorProps['toolbar']
}

/** Platform Rich Text 에디터 — PF full 툴바 기본 포함 */
export function PfRichTextEditor({
  editor,
  showToolbar = true,
  toolbar,
  className,
  ...rest
}: PfRichTextEditorProps) {
  const toolbarNode =
    toolbar ?? (showToolbar ? <PfRichTextToolbar editor={editor} /> : null)

  return (
    <RichTextEditor
      editor={editor}
      className={[editorStyles.pfRichTextEditor, className].filter(Boolean).join(' ')}
      toolbar={toolbarNode}
      {...rest}
    />
  )
}
