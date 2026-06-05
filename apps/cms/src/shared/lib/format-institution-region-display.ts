/**
 * 기관 소재지 목록 표시 — 행정구(구)·면·읍 단위까지만 노출.
 * 상세 주소·도로명·동 이름 등 이후 토큰은 제거한다.
 */

const ADMIN_UNIT_GU_MYeon_EUP = /[구면읍]$/
const ADMIN_UNIT_GUN = /군$/

/** @returns `'-'` when empty */
export function formatInstitutionRegionForTableDisplay(region: string | undefined | null): string {
  const trimmed = region?.trim()
  if (!trimmed) return '-'

  const tokens = trimmed.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return '-'

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]!
    if (ADMIN_UNIT_GU_MYeon_EUP.test(token)) {
      return tokens.slice(0, i + 1).join(' ')
    }
  }

  const gunIndex = tokens.findIndex(token => ADMIN_UNIT_GUN.test(token))
  if (gunIndex >= 0) {
    return tokens.slice(0, gunIndex + 1).join(' ')
  }

  if (tokens.length >= 2) {
    return tokens.slice(0, 2).join(' ')
  }

  return trimmed
}
