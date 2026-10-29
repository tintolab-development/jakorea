import { useEffect, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { getApiBaseUrlForPath } from '@/shared/lib/api-remote-env'
import {
  PORTAL_INLINE_IMAGE_PREVIEW_FAILURE_MESSAGE,
  fileObjectIdFromStoredFileUrl,
  portalPublicFileContentUrl,
  portalPublicInlineImageUrl,
} from '@/shared/lib/portal-public-file-url'
import { resolvePortalPublicImageSrc } from '@/shared/lib/resolve-portal-public-image-src'

export type PortalInlineImageResolver = (fileObjectId: number) => Promise<string>

function preloadImage(src: string): Promise<void> {
  const image = new Image()
  image.src = src
  return image.decode().catch(() => undefined)
}

function commitImageSrc(
  editor: Editor,
  pos: number,
  nextSrc: string,
  persistSrc: string,
): void {
  const current = editor.state.doc.nodeAt(pos)
  if (current?.type.name !== 'image') return
  const currentSrc = typeof current.attrs.src === 'string' ? current.attrs.src : ''
  if (currentSrc === nextSrc) return
  const nodeDom = editor.view.nodeDOM(pos)
  const img =
    nodeDom instanceof HTMLImageElement
      ? nodeDom
      : nodeDom instanceof HTMLElement
        ? nodeDom.querySelector('img')
        : null
  if (img) img.src = nextSrc
  const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
    ...current.attrs,
    src: nextSrc,
    persistSrc,
  })
  editor.view.dispatch(tr)
}

/**
 * 저장된 `/api/admin|portal/public/files/{id}/content` 는 img src로 안 열리는 경우가 있다.
 * 공개 API(또는 주입한 resolver)에서 서명 URL/바이트를 받아 미리보기를 채운다.
 * 바이트 조회가 실패하면(S3 리다이렉트에 CORS가 없는 경우 등) 공개 content 절대 URL을
 * `<img>`에 남겨 브라우저가 302를 따라가게 한다.
 * 반환값은 교체할 이미지를 받아 오는 중인지 여부.
 */
export function useHydratePortalInlineImages(
  editor: Editor | null,
  resetKey?: string | number,
  resolveImage: PortalInlineImageResolver = resolvePortalPublicImageSrc,
): boolean {
  const [isHydrating, setIsHydrating] = useState(false)

  useEffect(() => {
    if (editor == null) return
    let cancelled = false
    const previewUrls: string[] = []
    const allowPublicFallback = resolveImage === resolvePortalPublicImageSrc

    const hydrate = async () => {
      if (editor.isDestroyed) return
      const targets: Array<{ pos: number; persistSrc: string; fileObjectId: number }> = []
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== 'image') return
        const src = typeof node.attrs.src === 'string' ? node.attrs.src : ''
        const persist =
          typeof node.attrs.persistSrc === 'string' && node.attrs.persistSrc.trim()
            ? node.attrs.persistSrc
            : src
        const fileObjectId =
          fileObjectIdFromStoredFileUrl(src) ?? fileObjectIdFromStoredFileUrl(persist)
        if (fileObjectId == null) return
        targets.push({ pos, persistSrc: persist || src, fileObjectId })
      })

      if (targets.length === 0) return
      setIsHydrating(true)

      try {
        for (const target of targets) {
          try {
            const nextSrc = await resolveImage(target.fileObjectId)
            if (nextSrc.startsWith('blob:')) previewUrls.push(nextSrc)
            await preloadImage(nextSrc)
            if (cancelled || editor.isDestroyed) return
            commitImageSrc(editor, target.pos, nextSrc, target.persistSrc)
          } catch (error) {
            if (cancelled || editor.isDestroyed) return
            const fallback = allowPublicFallback
              ? portalPublicInlineImageUrl(
                  target.fileObjectId,
                  getApiBaseUrlForPath(portalPublicFileContentUrl(target.fileObjectId)),
                )
              : ''
            console.warn(
              allowPublicFallback
                ? PORTAL_INLINE_IMAGE_PREVIEW_FAILURE_MESSAGE
                : '[portal-inline-image] 인라인 이미지 미리보기에 실패했습니다.',
              {
                fileObjectId: target.fileObjectId,
                ...(fallback ? { fallback } : {}),
                error,
              },
            )
            if (!fallback) continue
            commitImageSrc(editor, target.pos, fallback, target.persistSrc)
          }
        }
      } finally {
        if (!cancelled) setIsHydrating(false)
      }
    }

    void hydrate()
    return () => {
      cancelled = true
      setIsHydrating(false)
      for (const url of previewUrls) URL.revokeObjectURL(url)
    }
  }, [editor, resetKey, resolveImage])

  return isHydrating
}
