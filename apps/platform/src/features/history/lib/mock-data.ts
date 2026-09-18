import type { HistoryContent } from '../model/types'

/** JA History mock — 구현 시 채움 */
export const MOCK_HISTORY: readonly HistoryContent[] = []

export function getMockHistory(): readonly HistoryContent[] {
  return MOCK_HISTORY
}
