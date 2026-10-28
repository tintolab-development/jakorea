import { useCallback, useState } from 'react'
import {
  RichTextViewer,
  type Editor,
  type RichTextViewerProps,
} from '@jakorea/rich-text/react'
import { useHydrateRichTextInlineImages } from './use-rich-text-inline-image'
import './cms-rich-text-editor.css'

/** 보기 모드 — 저장된 파일 URL 이미지를 인증 미리보기로 표시 */
export function CmsRichTextViewer(props: RichTextViewerProps) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const resetKey = props.markdown ?? props.content ?? ''
  const onEditor = useCallback((next: Editor | null) => {
    setEditor(next)
  }, [])
  useHydrateRichTextInlineImages(editor, resetKey)
  return (
    <RichTextViewer
      {...props}
      className={['cms-rich-text-viewer', props.className].filter(Boolean).join(' ')}
      onEditor={onEditor}
    />
  )
}
