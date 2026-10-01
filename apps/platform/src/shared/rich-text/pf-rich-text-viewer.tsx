import { useCallback, useState } from 'react'
import { RichTextViewer, type Editor, type RichTextViewerProps } from '@jakorea/rich-text/react'
import { rewriteAdminFileContentSrcsForPortal } from '@/shared/lib/portal-public-file-url'
import { useHydratePortalInlineImages } from './use-hydrate-portal-inline-images'

/** 보기 모드 — CMS 파일 src를 공개 URL로 바꾼 뒤, JSON/바이트를 풀어 이미지가 열리게 한다. */
export function PfRichTextViewer({
  content,
  markdown,
  onEditor,
  ...rest
}: RichTextViewerProps) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const nextContent = content == null ? content : rewriteAdminFileContentSrcsForPortal(content)
  const nextMarkdown = markdown == null ? markdown : rewriteAdminFileContentSrcsForPortal(markdown)
  const resetKey = nextMarkdown ?? nextContent ?? ''

  const handleEditor = useCallback(
    (next: Editor | null) => {
      setEditor(next)
      onEditor?.(next)
    },
    [onEditor]
  )

  useHydratePortalInlineImages(editor, resetKey)
  return (
    <RichTextViewer
      {...rest}
      content={nextContent}
      markdown={nextMarkdown}
      onEditor={handleEditor}
    />
  )
}
