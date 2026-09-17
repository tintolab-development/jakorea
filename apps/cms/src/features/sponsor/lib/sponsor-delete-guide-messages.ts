import {
  buildBulkDomainDeleteMessageLines,
  truncateForDeleteGuideDisplay,
} from '@/shared/ui/delete-guide-messages'

const SPONSOR_DELETE_IMPACT_LINE =
  '삭제 시 후원금을 비롯한 모든 프로그램 관련 정보가 삭제됩니다.'
const SPONSOR_DELETE_IRREVERSIBLE_LINE = '삭제된 정보는 되돌릴 수 없습니다.'

/** 후원사 단건·소수 건 삭제 안내 본문 */
export function buildSponsorDeleteMessageLines(entityNames: string[]): string[] {
  const trimmed = entityNames.map(n => n.trim()).filter(Boolean)
  if (trimmed.length === 0) return []

  const displayNames = trimmed.map(n => truncateForDeleteGuideDisplay(n)).filter(Boolean)
  if (displayNames.length === 0) return []

  const tail = [SPONSOR_DELETE_IMPACT_LINE, SPONSOR_DELETE_IRREVERSIBLE_LINE]

  if (displayNames.length === 1) {
    return [`[${displayNames[0]}]를 후원사에서 삭제하시겠습니까?`, ...tail]
  }

  const count = displayNames.length
  const nameList = displayNames.map(n => `[${n}]`).join(', ')
  return [`선택한 ${count}건(${nameList})을 후원사에서 삭제하시겠습니까?`, ...tail]
}

/** 후원사 목록 일괄 삭제 안내 본문 (2건 이상) */
export function buildSponsorBulkDeleteMessageLines(count: number): string[] {
  const [line1] = buildBulkDomainDeleteMessageLines(
    count,
    '개의 후원사',
    '후원사',
    '후원사'
  )
  return [line1, SPONSOR_DELETE_IMPACT_LINE, SPONSOR_DELETE_IRREVERSIBLE_LINE]
}
