/** ContentModal / PermissionModal 본문 — `[이름]` 구간 볼드(`**`) */
export function formatModalBracketedSubjectName(
  name: string,
  fallback = '강사'
): string {
  const trimmed = name.trim() || fallback
  return `[**${trimmed}**]`
}

/** ContentModal / PermissionModal 본문 — 상태·처리 문구 볼드(`**`) */
export function formatModalBoldPhrase(phrase: string): string {
  return `**${phrase}**`
}
