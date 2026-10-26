import { useCallback, useEffect, useState } from 'react'
import { RichTextViewer, type Editor, type RichTextViewerProps } from '@jakorea/rich-text/react'
import { getApiBaseUrlForPath } from '@/shared/lib/api-remote-env'
import {
  portalPublicFileContentUrl,
  rewriteAdminFileContentSrcsForPortal,
} from '@/shared/lib/portal-public-file-url'
import {
  useHydratePortalInlineImages,
  type PortalInlineImageResolver,
} from './use-hydrate-portal-inline-images'

function rewritePortalRichTextForDisplay(value: string): string {
  return rewriteAdminFileContentSrcsForPortal(
    value,
    getApiBaseUrlForPath(portalPublicFileContentUrl(1)),
  )
}

export type PfRichTextViewerProps = RichTextViewerProps & {
  /**
   * 공개가 아닌 본문 이미지(회원 전용 안내사항 등)를 여는 함수.
   * 주면 src를 공개 URL로 바꾸지 않고, 파일 ID마다 이 함수로 src를 받는다.
   */
  resolveInlineImage?: PortalInlineImageResolver
  /** 본문 이미지를 받아 오는 동안 true */
  onInlineImagesLoadingChange?: (loading: boolean) => void
}

/** 보기 모드 — CMS 파일 src를 공개 URL로 바꾼 뒤, JSON/바이트를 풀어 이미지가 열리게 한다. */
export function PfRichTextViewer({
  content,
  markdown,
  onEditor,
  resolveInlineImage,
  onInlineImagesLoadingChange,
  ...rest
}: PfRichTextViewerProps) {
  const [editor, setEditor] = useState<Editor | null>(null)
  const rewrite = resolveInlineImage ? (value: string) => value : rewritePortalRichTextForDisplay
  const nextContent = content == null ? content : rewrite(content)
  const nextMarkdown = markdown == null ? markdown : rewrite(markdown)
  const resetKey = nextMarkdown ?? nextContent ?? ''

  const handleEditor = useCallback(
    (next: Editor | null) => {
      setEditor(next)
      onEditor?.(next)
    },
    [onEditor]
  )

  const isHydratingImages = useHydratePortalInlineImages(editor, resetKey, resolveInlineImage)

  useEffect(() => {
    onInlineImagesLoadingChange?.(isHydratingImages)
  }, [isHydratingImages, onInlineImagesLoadingChange])

  return (
    <RichTextViewer
      {...rest}
      content={nextContent}
      markdown={nextMarkdown}
      onEditor={handleEditor}
    />
  )
}
