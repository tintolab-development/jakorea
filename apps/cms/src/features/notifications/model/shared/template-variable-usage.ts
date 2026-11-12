/**
 * 템플릿 선택 팝업 「변수」 열 (QA-0370).
 * 본문을 아직 받지 못한 템플릿(목록 응답에 내용 없음·알림톡 상세 미조회)은 사용 여부를 단정하지 않고 `-`.
 */
export const TEMPLATE_VARIABLE_USAGE_UNKNOWN = '-'

export function formatTemplateVariableUsage(keys: Iterable<string> | null | undefined): string {
  if (keys == null) return TEMPLATE_VARIABLE_USAGE_UNKNOWN
  const count = new Set([...keys].map(key => key.trim()).filter(Boolean)).size
  return count > 0 ? `사용 ${count}개` : '미사용'
}
