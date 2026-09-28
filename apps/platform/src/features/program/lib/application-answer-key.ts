/**
 * 신청폼 answers / draftAnswers 키.
 * 문단에서 questionKey → fieldKey → key → name → id 순으로 처음 있는 값을 쓴다.
 */
export function resolveApplicationAnswerKey(paragraph: object): string {
  const row = paragraph as Record<string, unknown>
  for (const name of ['questionKey', 'fieldKey', 'key', 'name', 'id'] as const) {
    const value = row[name]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}
