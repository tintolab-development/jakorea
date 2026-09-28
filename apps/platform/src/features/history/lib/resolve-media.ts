import type { PublicJaHistoryMedia } from '../api/types'
import { HISTORY_LOCAL_MEDIA } from './local-media'
import type { HistoryMediaView } from '../model/view'

export type HistoryMediaSlot = {
  fileName: string
  url: string
  alt: string
}

/** url이 없으면 fileName의 번들 이미지로 자리를 유지한다. */
export function resolveHistoryMedia(
  media: PublicJaHistoryMedia | null | undefined,
  fallback: HistoryMediaSlot,
): HistoryMediaView {
  const alt = typeof media?.alt === 'string' ? media.alt : fallback.alt
  const remoteUrl = typeof media?.url === 'string' ? media.url.trim() : ''
  if (remoteUrl) return { url: remoteUrl, alt }
  const fileName =
    typeof media?.fileName === 'string' && media.fileName ? media.fileName : fallback.fileName
  return { url: HISTORY_LOCAL_MEDIA[fileName] ?? fallback.url, alt }
}
