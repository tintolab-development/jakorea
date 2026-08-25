const LEGACY_NAME_CELL = '한글 성명'
const LEGACY_AFFILIATION_CELL = '소속 / 소속 없음'
const AFFILIATION_PLACEHOLDER = '소속 기관명'
const NO_AFFILIATION = '소속 없음'

export function portraitPersonalConsentNameValue(raw: string): string {
  const t = raw.trim()
  if (t === '' || t === LEGACY_NAME_CELL) return ''
  return raw
}

export function portraitPersonalConsentAffiliationState(raw: string): {
  noAffiliation: boolean
  affiliation: string
} {
  const t = raw.trim()
  if (t === '' || t === LEGACY_AFFILIATION_CELL || t === AFFILIATION_PLACEHOLDER) {
    return { noAffiliation: false, affiliation: '' }
  }
  if (t === NO_AFFILIATION) {
    return { noAffiliation: true, affiliation: '' }
  }
  return { noAffiliation: false, affiliation: raw }
}
