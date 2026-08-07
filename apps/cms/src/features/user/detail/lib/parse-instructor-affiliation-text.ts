import { USER_AFFILIATION_PIPE_SEP } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'

const GRADE_LIKE_AFFILIATION_TAIL = /학년|담임/
/** 등록 시 `강사 경력 | 소속명` pipe 앞 segment (예: `10`, `10년`) */
export const CAREER_LIKE_AFFILIATION_HEAD = /^\d+년?$/

/** `affiliation` 첫 콤마 세gment — `학교 | 학년` pipe 분리 */
export function splitAffiliationFirstSegment(affiliation: string | undefined): {
  institution: string
  tail: string
} {
  const trimmed = affiliation?.trim()
  if (!trimmed) return { institution: '', tail: '' }
  const firstSegment = trimmed.split(/\s*,\s*/)[0]?.trim() ?? ''
  const idx = firstSegment.indexOf(USER_AFFILIATION_PIPE_SEP)
  if (idx === -1) return { institution: firstSegment, tail: '' }
  return {
    institution: firstSegment.slice(0, idx).trim(),
    tail: firstSegment.slice(idx + USER_AFFILIATION_PIPE_SEP.length).trim(),
  }
}

/** `affiliation` 문자열에서 소속명 후보 — 강사 경력·담당 학년 segment 제외 */
export function parseAffiliationOrgSegments(affiliation: string | undefined): string[] {
  const trimmed = affiliation?.trim()
  if (!trimmed) return []

  const results: string[] = []
  for (const commaPart of trimmed.split(/\s*,\s*/)) {
    const pipeParts = commaPart
      .split(/\s*\|\s*/)
      .map(part => part.trim())
      .filter(Boolean)
    if (pipeParts.length === 0) continue

    const candidate =
      pipeParts.length > 1 && CAREER_LIKE_AFFILIATION_HEAD.test(pipeParts[0])
        ? pipeParts[1]
        : pipeParts[0]
    if (!candidate || CAREER_LIKE_AFFILIATION_HEAD.test(candidate)) continue
    if (GRADE_LIKE_AFFILIATION_TAIL.test(candidate)) continue
    results.push(candidate)
  }
  return results
}

export function parseOrganizationNamesFromText(text: string | undefined): string[] {
  const trimmed = text?.trim()
  if (!trimmed) return []
  if (trimmed.includes(',')) {
    return trimmed
      .split(/\s*,\s*/)
      .map(part => part.trim())
      .filter(Boolean)
  }
  return parseAffiliationOrgSegments(trimmed)
}
