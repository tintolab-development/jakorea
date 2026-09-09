/** session_plan_short_essay 항목 label — 본문 vs 힌트 분리 (레거시 label 내장 힌트 호환) */
export function splitSessionPlanItemLabel(label: string): {
  main: string
  hint: string | null
} {
  const trimmed = label.trim()
  if (!trimmed) return { main: '', hint: null }

  const parenExHint = trimmed.match(/^(.+?)\s(\((?:ex|EX)\s*[:：].+\))$/)
  if (parenExHint) {
    return { main: parenExHint[1]!.trim(), hint: parenExHint[2]!.trim() }
  }

  const exSuffixHint = trimmed.match(/^(.+?)\s(ex[)）].+)$/)
  if (exSuffixHint) {
    return { main: exSuffixHint[1]!.trim(), hint: exSuffixHint[2]!.trim() }
  }

  const questionParenHint = trimmed.match(/^(.+?\?)\s(\(.+\))$/)
  if (questionParenHint) {
    return { main: questionParenHint[1]!.trim(), hint: questionParenHint[2]!.trim() }
  }

  return { main: trimmed, hint: null }
}

export function resolveSessionPlanItemTitleParts(item: {
  label?: string
  titleHint?: string
}): { main: string; hint: string | null } {
  const label = item.label?.trim() ?? ''
  const explicitHint = item.titleHint?.trim()
  if (explicitHint) {
    return { main: label, hint: explicitHint }
  }
  return splitSessionPlanItemLabel(label)
}

/** A4·문서 미리보기 단락 설명 — ex) / (ex: 힌트 문구 */
export function isPreviewSectionHintDescription(description: string): boolean {
  const trimmed = description.trim()
  if (!trimmed) return false
  return /^ex[)）：]/i.test(trimmed) || /^\(ex\s*[:：]/i.test(trimmed)
}
