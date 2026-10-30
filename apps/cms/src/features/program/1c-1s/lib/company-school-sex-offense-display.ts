/**
 * 1사1교 기관 신청 상세 — 성범죄경력 조회서 요청 표시 (Figma 4175:106433: `온라인 제출 | ID : … | 검증번호 : …`)
 * 입력은 신청 폼 답에서 만든 `sexOffenseCheckRequest` (`parseSexOffenseCheckRequest`, ` | ` 구분).
 */
const SUBMISSION_REQUEST_LABEL = '동의서 제출 요청'
const NO_SUBMIT_LABEL = '동의서 미제출'
const SITE_METHOD_LABEL = '범죄경력회보서 사이트 이용'

export function formatCompanySchoolSexOffenseParts(raw: string | null | undefined): string[] {
  const parts = (raw ?? '')
    .split(' | ')
    .map(part => part.trim())
    .filter(Boolean)
  if (parts.length === 0) return []
  if (parts.includes(NO_SUBMIT_LABEL)) return [NO_SUBMIT_LABEL]
  const out: string[] = []
  for (const part of parts) {
    if (part === SITE_METHOD_LABEL) continue
    if (part === SUBMISSION_REQUEST_LABEL && parts.length > 1) continue
    const idMatch = part.match(/^기관 ID\s+(.+)$/)
    if (idMatch) {
      out.push(`ID : ${idMatch[1]!.trim()}`)
      continue
    }
    const verificationMatch = part.match(/^검증번호\s+(.+)$/)
    if (verificationMatch) {
      out.push(`검증번호 : ${verificationMatch[1]!.trim()}`)
      continue
    }
    out.push(part)
  }
  return out
}
