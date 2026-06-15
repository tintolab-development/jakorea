/**
 * 기관 소재지 목록 표시 — 행정구(구)·면·읍 단위까지만 노출.
 * 상세 주소·도로명·동 이름 등 이후 토큰은 제거한다.
 */

const ADMIN_UNIT_GU_MYeon_EUP = /[구면읍]$/
const ADMIN_UNIT_GUN = /군$/
const METRO_CITY_PATTERN = /(특별시|광역시|특별자치시|특별자치도)$/
const CITY_OR_GUN_PATTERN = /(시|군)$/

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

/**
 * 캘린더 우측 목록·호버 팝오버용 — 시·도(광역자치단체) 단위 1개만.
 * 예: `서울특별시 강서구` → `서울특별시`, `경기도 성남시` → `경기도`
 */
export function formatInstitutionRegionForCalendarListDisplay(
  region: string | undefined | null
): string {
  const trimmed = region?.trim()
  if (!trimmed) return '-'

  const tokens = trimmed.split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return '-'

  const metro = tokens.find(token => METRO_CITY_PATTERN.test(token))
  if (metro) return metro

  const province = tokens.find(token => /도$/.test(token))
  if (province) return province

  const cityOrGun = tokens.find(token => CITY_OR_GUN_PATTERN.test(token))
  if (cityOrGun) return cityOrGun

  return tokens[0] ?? '-'
}
