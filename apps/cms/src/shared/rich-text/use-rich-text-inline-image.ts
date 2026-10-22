import { useCallback, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import {
  fileObjectIdFromAdminFileUrl,
  loadAdminFileBlob,
  resolveRichTextInlineImageSrc,
  type AdminFileUploadOwner,
} from '@/shared/lib/admin-file-upload'

/** 에디터 리마운트 없이 최신 owner로 본문 이미지를 올린다. */
export function useRichTextInlineImageSrc(owner: AdminFileUploadOwner | null | undefined) {
  const ownerRef = useRef(owner)
  ownerRef.current = owner

  return useCallback(async (file: File) => {
    const current = ownerRef.current
    if (current == null) {
      throw new Error('이미지를 업로드할 수 없습니다. 다시 시도해 주세요.')
    }
    return resolveRichTextInlineImageSrc(file, current)
  }, [])
}

/**
 * `/api/admin/files/{id}/content` 는 img src로 열리지 않는다.
 * 저장된 본문을 열 때 인증 다운로드로 blob 미리보기를 채운다.
 */
export function useHydrateRichTextInlineImages(editor: Editor | null, resetKey?: string | number) {
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
        if (src.startsWith('blob:') || node.attrs.persistSrc) return
        const fileObjectId = fileObjectIdFromAdminFileUrl(src)
        if (fileObjectId == null) return
        targets.push({ pos, persistSrc: src, fileObjectId })
      })

      for (const target of targets) {
        try {
          const blob = await loadAdminFileBlob(target.fileObjectId, {
            skipGlobalErrorAlert: true,
          })
          if (cancelled || editor.isDestroyed) return
          if (blob.size < 1 || blob.type === 'application/json') continue
          const previewSrc = URL.createObjectURL(blob)
          previewUrls.push(previewSrc)
          const current = editor.state.doc.nodeAt(target.pos)
          if (current?.type.name !== 'image') continue
          const tr = editor.state.tr.setNodeMarkup(target.pos, undefined, {
            ...current.attrs,
            src: previewSrc,
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
