/**
 * 1사1교 기관 신청 상세 — 결연 금융 회사 표시값.
 * BE 정규 응답은 사람이 읽는 문자열(`미결연`·후원사명/`후원사`·기타 입력값)이며 그대로 통과한다.
 * 아래 파싱은 예전 객체 문자열(`{companyType=partner, customCompanyName=}`·JSON) 응답용 fallback이다.
 * - partner: 프로그램 후원사명(신청 폼 라디오와 동일) → 호출부에서 sponsorId로 표시
 * - none: 미결연
 * - custom: 기타 입력값
 */
export type AffiliatedFinancialCompanyDisplay =
  | { kind: 'text'; text: string }
  | { kind: 'partner' }
  | { kind: 'empty' }

const NONE_LABEL = '미결연'

function parseObjectLikeString(raw: string): Record<string, string> | null {
  if (!raw.startsWith('{') || !raw.endsWith('}')) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const out: Record<string, string> = {}
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        out[key] = typeof value === 'string' ? value : value == null ? '' : String(value)
      }
      return out
    }
  } catch {
    // Java Map#toString 형식 `{a=b, c=d}`
  }
  const inner = raw.slice(1, -1).trim()
  if (inner === '') return {}
  const out: Record<string, string> = {}
  for (const part of inner.split(/,\s*(?=[A-Za-z_][\w]*=)/)) {
    const eq = part.indexOf('=')
    if (eq <= 0) return null
    out[part.slice(0, eq).trim()] = part.slice(eq + 1).trim()
  }
  return out
}

function fromCompanyType(
  companyType: string,
  customCompanyName: string
): AffiliatedFinancialCompanyDisplay | null {
  if (companyType === 'partner') return { kind: 'partner' }
  if (companyType === 'none') return { kind: 'text', text: NONE_LABEL }
  if (companyType === 'custom') {
    return customCompanyName ? { kind: 'text', text: customCompanyName } : { kind: 'empty' }
  }
  return null
}

export function resolveAffiliatedFinancialCompanyDisplay(
  raw: string | null | undefined
): AffiliatedFinancialCompanyDisplay {
  const trimmed = raw?.trim() ?? ''
  if (trimmed === '') return { kind: 'empty' }
  const record = parseObjectLikeString(trimmed)
  if (record == null) {
    return fromCompanyType(trimmed, '') ?? { kind: 'text', text: trimmed }
  }
  const companyType = record.companyType?.trim() ?? ''
  const customCompanyName = record.customCompanyName?.trim() ?? ''
  const byType = fromCompanyType(companyType, customCompanyName)
  if (byType) return byType
  return customCompanyName ? { kind: 'text', text: customCompanyName } : { kind: 'empty' }
}
