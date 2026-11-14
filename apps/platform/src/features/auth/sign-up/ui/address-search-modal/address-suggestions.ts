import type { JusoAddressItem } from '@jakorea/location/juso'

import { splitKeywordTokens } from '@/shared/lib/highlight-keyword'

/** 자동완성은 공백을 뺀 2자 이상일 때만 호출한다 */
export const ADDRESS_SUGGEST_MIN_KEYWORD_LENGTH = 2

export function isAddressSuggestKeywordEligible(keyword: string): boolean {
  return keyword.replace(/\s/g, '').length >= ADDRESS_SUGGEST_MIN_KEYWORD_LENGTH
}

/** 자동완성 한 줄 — 도로명 주소(없으면 지번 주소) */
export function addressSuggestionLine(item: JusoAddressItem): string {
  return (item.roadAddr?.trim() || item.jibunAddr?.trim() || '').trim()
}

export type AddressSuggestion = {
  line: string
  item: JusoAddressItem
}

/**
 * 자동완성 목록 — 표시 문자열 기준 중복 제거 후,
 * 검색어를 공백 단위로 나눈 모든 토큰이 들어 있는 결과만 남긴다(대소문자 무시).
 */
export function buildAddressSuggestions(
  items: readonly JusoAddressItem[],
  keyword: string,
): AddressSuggestion[] {
  const tokens = splitKeywordTokens(keyword).map(token => token.toLowerCase())
  const seen = new Set<string>()
  const suggestions: AddressSuggestion[] = []

  for (const item of items) {
    const line = addressSuggestionLine(item)
    if (!line || seen.has(line)) continue

    const haystack = line.toLowerCase()
    if (!tokens.every(token => haystack.includes(token))) continue

    seen.add(line)
    suggestions.push({ line, item })
  }

  return suggestions
}
