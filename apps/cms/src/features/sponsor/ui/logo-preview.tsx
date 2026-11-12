import { useEffect, useState } from 'react'
import { parseSponsorLogoFileObjectId } from '@/features/sponsor/lib/sponsor-logo-files'
import { loadLogoBlob } from '@/features/sponsor/lib/logo-preview-blob'

function isPreviewableImageBlob(blob: Blob): boolean {
  return blob.size > 0 && blob.type !== 'application/json'
}

/**
 * 후원사 상세(조회) — 로고 이미지 미리보기 (QA-0110).
 * 서버 파일(`fileObjectId`)만 인라인 경로로 불러오며, 불러오지 못하면(ai·eps 등 image/* 아님 → 404 포함)
 * 미리보기 없이 파일명 다운로드만 남긴다.
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
