/**
 * DeleteGuideModal 본문 문구 조합 (도메인 라벨 기반 3단 구성)
 *
 * 예: 후원사
 * - [삼성전자] 를 후원사에서 삭제하시겠습니까?
 * - 후원사에서 삭제 시 관련 정보들도 모두 삭제됩니다.
 * - 삭제된 항목 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?
 */

/** 본문 `[이름]`에 쓰는 표시용 이름 최대 길이(초과 시 `...` 접미) */
export const DELETE_GUIDE_ENTITY_DISPLAY_MAX_LENGTH = 18

export function truncateForDeleteGuideDisplay(
  raw: string,
  maxLen: number = DELETE_GUIDE_ENTITY_DISPLAY_MAX_LENGTH
): string {
  const t = raw.trim()
  if (!t) return ''
  if (t.length <= maxLen) return t
  return `${t.slice(0, maxLen)}...`
}

export function buildDomainEntityDeleteMessageLines(
  entityNames: string[],
  domainLabel: string
): string[] {
  const trimmed = entityNames.map(n => n.trim()).filter(Boolean)
  if (trimmed.length === 0) return []

  const displayNames = trimmed.map(n => truncateForDeleteGuideDisplay(n)).filter(Boolean)
  if (displayNames.length === 0) return []

  const line2 = `${domainLabel}에서 삭제 시 관련 정보들도 모두 삭제됩니다.`
  const line3 = '삭제된 항목 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?'

  if (displayNames.length === 1) {
    return [`[${displayNames[0]}] 를 ${domainLabel}에서 삭제하시겠습니까?`, line2, line3]
  }

  const count = displayNames.length
  const nameList = displayNames.map(n => `[${n}]`).join(', ')
  return [
    `선택한 ${count}건(${nameList})을 ${domainLabel}에서 삭제하시겠습니까?`,
    line2,
    line3,
  ]
}

/** 한국어 명사(마지막 음절) 기준 목적격 조사 을/를 */
function objectParticleForLastKoreanWord(word: string): '을' | '를' {
  const trimmed = word.trimEnd()
  if (!trimmed) return '를'
  const ch = trimmed[trimmed.length - 1]
  const code = ch.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) {
    return (code - 0xac00) % 28 !== 0 ? '을' : '를'
  }
  return '를'
}

/** 다건 삭제 안내 모달 타이틀: `{domainLabel} 일괄 삭제 안내` */
export function buildBulkDeleteGuideTitle(domainLabel: string): string {
  return `${domainLabel} 일괄 삭제 안내`
}

/**
 * 일괄(다건) 삭제 본문 — 1줄 이후는 단건 `buildDomainEntityDeleteMessageLines`와 동일한 2·3단.
 *
 * @param count - 선택 건수 n
 * @param counterNounPhrase - n 바로 뒤에 붙는 구문, 예: `개의 후원사` → `3개의 후원사`
 * @param particleTargetNoun - 목적격 조사 기준 명사(보통 counterNounPhrase의 마지막 명사)
 * @param domainLabel - 2줄(후원사에서 삭제 시…)에 쓰는 도메인 라벨
 */
export function buildBulkDomainDeleteMessageLines(
  count: number,
  counterNounPhrase: string,
  particleTargetNoun: string,
  domainLabel: string
): string[] {
  const quantified = `${count}${counterNounPhrase}`
  const particle = objectParticleForLastKoreanWord(particleTargetNoun)
  const line2 = `${domainLabel}에서 삭제 시 관련 정보들도 모두 삭제됩니다.`
  const line3 = '삭제된 항목 및 정보는 되돌릴 수 없습니다. 정말 삭제하시겠습니까?'
  return [`선택한 ${quantified}${particle} 모두 삭제하시겠습니까?`, line2, line3]
}
