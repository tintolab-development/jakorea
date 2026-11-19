import type { DirectoryRow, TextbookContent } from '../model/types'

type DirectoryTextbook = Pick<TextbookContent, 'id' | 'title' | 'levels'>

/** Presentation-only expansion. Does not duplicate textbook entities or catalogue totals. */
export function buildDirectoryRows(items: readonly DirectoryTextbook[]): DirectoryRow[] {
  return items.flatMap(item =>
    item.levels.map(level => ({
      id: `${item.id}-${level}`,
      titles: [item.title],
      levels: [level],
      contentId: item.id,
    })),
  )
}
