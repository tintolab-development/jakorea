import { useEffect, useState } from 'react'
import { parseSponsorLogoFileObjectId } from '@/features/sponsor/lib/sponsor-logo-files'
import { loadAdminFileBlob } from '@/shared/lib/admin-file-upload'

/** 같은 세션에서 상세를 다시 열 때 로고를 다시 받지 않도록 기억한다 */
const logoBlobByFileObjectId = new Map<number, Promise<Blob>>()

function loadLogoBlob(fileObjectId: number): Promise<Blob> {
  const cached = logoBlobByFileObjectId.get(fileObjectId)
  if (cached) return cached
  const pending = loadAdminFileBlob(fileObjectId, { skipGlobalErrorAlert: true })
  logoBlobByFileObjectId.set(fileObjectId, pending)
  pending.catch(() => {
    logoBlobByFileObjectId.delete(fileObjectId)
  })
  return pending
}

function isPreviewableImageBlob(blob: Blob): boolean {
  return blob.size > 0 && blob.type !== 'application/json'
}

/**
 * 후원사 상세(조회) — 로고 이미지 미리보기 (QA-0110).
 * 서버 파일(`fileObjectId`)만 불러오며, 불러오지 못하면 미리보기 없이 파일명 다운로드만 남긴다.
 */
export function SponsorLogoPreview({ logoId, alt }: { logoId: string; alt: string }) {
  const fileObjectId = parseSponsorLogoFileObjectId(logoId)
  const [src, setSrc] = useState<string | null>(null)

  // 목록 항목이 `key={file.id}`로 다시 마운트되므로 로고가 바뀔 때 src를 따로 비우지 않는다
  useEffect(() => {
    if (fileObjectId == null) return
    let alive = true
    let objectUrl: string | null = null

    void loadLogoBlob(fileObjectId)
      .then(blob => {
        if (!alive || !isPreviewableImageBlob(blob)) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        /* 미리보기 실패 — 다운로드 버튼은 그대로 쓸 수 있다 */
      })

    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fileObjectId])

  if (src == null) return null
  return (
    <img
      className="sponsor-detail-basic-info__logo-preview"
      src={src}
      alt={alt}
      onError={() => setSrc(null)}
    />
  )
}
