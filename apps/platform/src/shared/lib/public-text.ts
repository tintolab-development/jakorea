/** 공개 카피 — 줄바꿈 기준. 비면 fallback. */

/** 공백·개행 무시 비교 (시드 단문 ↔ 디자인 줄바꿈 보존용) */
export function normalizePublicCopy(value: string): string {
  return value.replace(/\s+/g, '')
}

function preferFallbackLineBreaks(
  remoteLines: string[],
  fallback: readonly string[],
): string[] {
  if (fallback.length === 0) return remoteLines
  if (
    normalizePublicCopy(remoteLines.join('')) ===
    normalizePublicCopy(fallback.join(''))
  ) {
    return [...fallback]
  }
  return remoteLines
}

/** 공개 카피 — 줄바꿈 기준. 비면 fallback. 동일 문장이면 fallback 줄바꿈을 유지한다. */
export function splitPublicTextLines(
  value: string | undefined | null,
  fallback: readonly string[],
): string[] {
  const lines = (value ?? '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return [...fallback]
  return preferFallbackLineBreaks(lines, fallback)
}

export function readOptionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

/** 기업 프로세스 제목 `1. 제안` → `제안` */
export function stripStepNumberPrefix(title: string): string {
  return title.replace(/^\d+\.\s*/, '').trim()
}

/** `· 항목` / 개행 → 설명 배열. 동일 문장이면 fallback 줄바꿈을 유지한다. */
export function splitStepDescriptions(
  value: string | undefined | null,
  fallback: readonly string[],
): string[] {
  const lines = (value ?? '')
    .split('\n')
    .map(line => line.replace(/^·\s*/, '').trim())
    .filter(Boolean)
  if (lines.length === 0) return [...fallback]
  return preferFallbackLineBreaks(lines, fallback)
}

/** PFDateInput `YYYY.MM.DD` → API `YYYY-MM-DD` */
export function toApiDate(value: string): string {
  const trimmed = value.trim()
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(trimmed)) {
    return trimmed.replace(/\./g, '-')
  }
  return trimmed
}
