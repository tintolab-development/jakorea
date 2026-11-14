import {
  objectParticleForLastKoreanWord,
  truncateForDeleteGuideDisplay,
} from '@/shared/ui/delete-guide-messages'

/**
 * 데이터 관리(교재·세부 프로그램) 삭제 안내 첫 줄 — 대상 이름 표기.
 * - 단건: `**[이름]** 교재를 삭제하시겠습니까?`
 * - 일괄: `**[첫 이름] 외 N개**의 교재를 삭제하시겠습니까?`
 * 이름을 알 수 없으면 `null` — 호출부가 기존 문구로 돌아간다.
 */
export function buildNamedDeleteGuideHeadline(args: {
  /** 도메인 라벨 (예: `교재`, `세부 프로그램`) — 목적격 조사 기준 */
  entityLabel: string
  /** 선택 순서대로의 대상 이름 */
  names: readonly string[]
  /** 삭제 대상 건수 */
  selectedCount: number
}): string | null {
  const { entityLabel, names, selectedCount } = args
  const firstName = names.map(name => name.trim()).find(name => name !== '')
  if (firstName == null) return null
  const label = `[${truncateForDeleteGuideDisplay(firstName)}]`
  const target = `${entityLabel}${objectParticleForLastKoreanWord(entityLabel)}`
  if (selectedCount <= 1) {
    return `**${label}** ${target} 삭제하시겠습니까?`
  }
  return `**${label} 외 ${selectedCount - 1}개**의 ${target} 삭제하시겠습니까?`
}
