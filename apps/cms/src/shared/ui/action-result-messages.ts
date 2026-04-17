/**
 * 등록·삭제 완료(ActionResultModal) 본문·제목 조합
 */

export function buildRegisterCompletedTitle(entityLabel: string): string {
  return `${entityLabel} 등록 완료`
}

export function buildRegisterCompletedMessage(displayName: string, entityLabel: string): string {
  const n = displayName.trim() || '(이름 없음)'
  return `[${n}] ${entityLabel} 정보가 등록되었습니다.`
}

/** 예: 회원 삭제 완료, 후원사 삭제 완료 */
export function buildDeleteCompletedTitle(entityLabel: string): string {
  return `${entityLabel} 삭제 완료`
}

/** 단건: [이름] 회원의 모든 정보가 삭제 되었습니다. */
export function buildDeleteCompletedMessageSingle(displayName: string, entityLabel: string): string {
  const n = displayName.trim() || '(이름 없음)'
  return `[${n}] ${entityLabel}의 모든 정보가 삭제 되었습니다.`
}

/**
 * 다건: 선택한 n명의 회원의 모든 정보가 삭제 되었습니다.
 * @param counterEntityPhrase — count 바로 뒤에 붙는 구문 (예: `명의 회원`, `개의 후원사`)
 */
export function buildDeleteCompletedMessageBulk(
  count: number,
  counterEntityPhrase: string
): string {
  return `선택한 ${count}${counterEntityPhrase}의 모든 정보가 삭제 되었습니다.`
}
