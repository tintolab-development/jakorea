import type { PublicTextbookListItem } from '../api/types'
import type { TextbookContent } from '../model/types'

/**
 * QA-0495: 교재 목록 카드 썸네일 변형(233×320 · 466×640).
 * 둘 다 있으면 233을 `src`, `233 1x, 466 2x`를 `srcSet`으로 쓴다.
 * 둘 다 없으면 undefined → 카드가 원본 `thumbnailUrl`을 쓴다.
 */
export function mapPublicTextbookListThumbnail(
  row: Pick<PublicTextbookListItem, 'thumbnailUrlW233' | 'thumbnailUrlW466'>,
): TextbookContent['listThumbnail'] {
  const w233 = row.thumbnailUrlW233?.trim()
  const w466 = row.thumbnailUrlW466?.trim()
  if (w233 && w466) return { src: w233, srcSet: `${w233} 1x, ${w466} 2x` }
  const only = w233 || w466
  return only ? { src: only } : undefined
}
