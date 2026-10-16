/** 희망 교육 일정이 1개만 노출될 때는 「■ 1지망」 랭크 문구를 숨긴다. */
export function shouldShowPreferredScheduleRankLabel(
  visibleBlockCount: number,
  maxBlocks: number
): boolean {
  return maxBlocks > 1 && visibleBlockCount > 1
}

export function preferredScheduleRankLabel(rankIndex: number): string {
  return `■ ${rankIndex + 1}지망`
}

export function resolvePreferredScheduleBlockTitle(
  rankIndex: number,
  visibleBlockCount: number,
  maxBlocks: number
): string {
  return shouldShowPreferredScheduleRankLabel(visibleBlockCount, maxBlocks)
    ? preferredScheduleRankLabel(rankIndex)
    : ''
}
