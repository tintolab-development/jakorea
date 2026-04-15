/**
 * DeleteGuideModal 본문 문구 조합 (도메인 라벨 기반 3단 구성)
 *
 * 예: 후원사
 * - [삼성전자] 를 후원사에서 삭제하시겠습니까?
 * - 후원사에서 삭제 시 관련 정보들도 모두 삭제됩니다.
 * - 삭제된 항목 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?
 */
export function buildDomainEntityDeleteMessageLines(
  entityNames: string[],
  domainLabel: string
): string[] {
  const trimmed = entityNames.map(n => n.trim()).filter(Boolean)
  if (trimmed.length === 0) return []

  const line2 = `${domainLabel}에서 삭제 시 관련 정보들도 모두 삭제됩니다.`
  const line3 = '삭제된 항목 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?'

  if (trimmed.length === 1) {
    return [`[${trimmed[0]}] 를 ${domainLabel}에서 삭제하시겠습니까?`, line2, line3]
  }

  const count = trimmed.length
  const nameList = trimmed.map(n => `[${n}]`).join(', ')
  return [
    `선택한 ${count}건(${nameList})을 ${domainLabel}에서 삭제하시겠습니까?`,
    line2,
    line3,
  ]
}
