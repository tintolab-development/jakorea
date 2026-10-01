import { useEffect } from 'react'
import type { Editor } from '@tiptap/react'
import { fileObjectIdFromStoredFileUrl } from '@/shared/lib/portal-public-file-url'
import { resolvePortalPublicImageSrc } from '@/shared/lib/resolve-portal-public-image-src'

/**
 * 저장된 `/api/admin|portal/public/files/{id}/content` 는 img src로 안 열리는 경우가 있다.
 * 공개 API에서 서명 URL/바이트를 받아 미리보기를 채운다.
 */
export function useHydratePortalInlineImages(editor: Editor | null, resetKey?: string | number) {
  useEffect(() => {
    if (editor == null) return
    let cancelled = false
    const previewUrls: string[] = []

    const hydrate = async () => {
      if (editor.isDestroyed) return
      const targets: Array<{ pos: number; persistSrc: string; fileObjectId: number }> = []
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== 'image') return
        const src = typeof node.attrs.src === 'string' ? node.attrs.src : ''
        if (src.startsWith('blob:')) return
        const persist =
          typeof node.attrs.persistSrc === 'string' && node.attrs.persistSrc.trim()
            ? node.attrs.persistSrc
            : src
        const fileObjectId =
          fileObjectIdFromStoredFileUrl(src) ?? fileObjectIdFromStoredFileUrl(persist)
        if (fileObjectId == null) return
        targets.push({ pos, persistSrc: persist || src, fileObjectId })
      })

      for (const target of targets) {
        try {
          const nextSrc = await resolvePortalPublicImageSrc(target.fileObjectId)
          if (cancelled || editor.isDestroyed) return
          if (nextSrc.startsWith('blob:')) previewUrls.push(nextSrc)
          const current = editor.state.doc.nodeAt(target.pos)
          if (current?.type.name !== 'image') continue
          const nodeDom = editor.view.nodeDOM(target.pos)
          const img =
            nodeDom instanceof HTMLImageElement
              ? nodeDom
              : nodeDom instanceof HTMLElement
                ? nodeDom.querySelector('img')
                : null
          if (img) img.src = nextSrc
          const tr = editor.state.tr.setNodeMarkup(target.pos, undefined, {
            ...current.attrs,
            src: nextSrc,
            persistSrc: target.persistSrc,
          })
          editor.view.dispatch(tr)
        } catch {
          /* 미리보기만 실패. 저장 URL은 유지 */
        }
      }
    }

    void hydrate()
    return () => {
      cancelled = true
      for (const url of previewUrls) URL.revokeObjectURL(url)
    }
  }, [editor, resetKey])
}
