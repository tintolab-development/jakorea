/** 담당자 정보 > 담당자 삭제 불가 안내 (시안 9860:84926) */
export const PROGRAM_MANAGER_DELETE_BLOCKED_TITLE = '프로그램 담당자 삭제 불가 안내'
export const PROGRAM_MANAGER_DELETE_BLOCKED_DESCRIPTION =
  '등록된 담당자가 1명인 경우에는 담당자를 삭제할 수 없습니다.\n해당 담당자를 삭제하시려면 다른 담당자를 먼저 추가해 주세요.'

/**
 * 삭제 후 남는 담당자가 없으면 삭제를 막는다.
 * 목록이 필터로 좁혀진 상태면 전체 인원을 알 수 없으므로 판단하지 않는다(서버 검증에 맡김).
 */
export function isProgramManagerDeleteBlocked(params: {
  totalManagerCount: number
  selectedCount: number
  filtersActive: boolean
}): boolean {
  const { totalManagerCount, selectedCount, filtersActive } = params
  if (filtersActive) return false
  if (totalManagerCount <= 1) return true
  return selectedCount >= totalManagerCount
}
