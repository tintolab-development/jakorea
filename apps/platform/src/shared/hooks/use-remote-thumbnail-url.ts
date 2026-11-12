import { useEffect, useState } from 'react'

/**
 * 「썸네일 없음」 표식 이미지인지 — 원본 크기로 판별한다.
 * - 1×1: 현재 표식(투명 PNG)
 * - 453×255: 2026-11-10 하루 동안 임팩트 스토리 표식으로 올라간 기본 카드 이미지(이전 표식).
 *   실제 썸네일이 정확히 이 크기면 기본 썸네일로 보이는 한계가 있다 — 백엔드 nullable 반영·데이터 정리 후 함께 지운다.
 */
function isNoThumbnailPlaceholderImage(image: HTMLImageElement): boolean {
  const { naturalWidth: width, naturalHeight: height } = image
  if (width <= 1 && height <= 1) return true
  return width === 453 && height === 255
}

/**
 * 원격 썸네일 URL — 어드민이 서버 필수 검증 우회로 올린 「썸네일 없음」 표식(1×1 투명 PNG)이면 없음으로 본다.
 *
 * 공개 이미지 주소에는 원본 파일명이 없어 주소로는 구분할 수 없으므로, 이미지를 한 번 읽어 원본 크기로 판별한다.
 * 판별 전에는 URL을 그대로 돌려줘 실제 이미지는 깜빡임 없이 보이고, 표식이면 읽은 직후 `undefined`로 바뀐다.
 * 백엔드가 썸네일 없음을 null 로 내려주게 되면 이 훅은 그대로 둬도 동작에 영향이 없다.
 */
export function useRemoteThumbnailUrl(url: string | undefined): string | undefined {
  const [placeholderUrl, setPlaceholderUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return
    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (cancelled) return
      if (isNoThumbnailPlaceholderImage(image)) setPlaceholderUrl(url)
    }
    image.src = url
    return () => {
      cancelled = true
    }
  }, [url])

  return url && url !== placeholderUrl ? url : undefined
}
