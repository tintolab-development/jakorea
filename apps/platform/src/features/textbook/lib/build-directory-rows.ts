import type { EducationLevelKey } from '@/shared/lib'
import type { DirectoryRow, TextbookContent } from '../model/types'

type DirectoryTextbook = Pick<TextbookContent, 'id' | 'title' | 'levels'>

/** 상단 디렉터리 노출 순서 — 교급 순, 안내사항은 맨 끝 */
const DIRECTORY_LEVEL_ORDER: Record<EducationLevelKey, number> = {
  preschool: 0,
  elementary: 1,
  middle: 2,
  high: 3,
  adult: 4,
  notice: 5,
}

/**
 * Presentation-only expansion. Does not duplicate textbook entities or catalogue totals.
 * 교육 대상마다 한 줄, 교급 순으로 정렬한다. 같은 교급 안에서는 서버 응답 순서를 유지한다.
 */
export function buildDirectoryRows(items: readonly DirectoryTextbook[]): DirectoryRow[] {
  return items
    .flatMap(item =>
      item.levels.map(level => ({
        id: `${item.id}-${level}`,
        titles: [item.title],
        levels: [level],
        contentId: item.id,
      })),
    )
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const order =
        DIRECTORY_LEVEL_ORDER[a.row.levels[0] ?? 'notice'] -
        DIRECTORY_LEVEL_ORDER[b.row.levels[0] ?? 'notice']
      return order !== 0 ? order : a.index - b.index
    })
    .map(({ row }) => row)
}
