/** UI 시/도 선택값 ↔ NEIS·행정 주소 표기 차이(개편 전후 명칭 등) */
export const SIDO_MATCH_TOKENS: Record<string, string[]> = {
  강원도: ['강원', '강원특별자치도'],
  전라북도: ['전북', '전라북', '전북특별자치도'],
  전라남도: ['전남', '전라남'],
  경상북도: ['경북', '경상북'],
  경상남도: ['경남', '경상남'],
  충청북도: ['충북', '충청북'],
  충청남도: ['충남', '충청남'],
  제주특별자치도: ['제주'],
  세종특별자치시: ['세종'],
}

export function getSidoMatchTokens(sido: string): string[] {
  const trimmed = sido.trim()
  if (!trimmed) return []

  return Array.from(
    new Set([trimmed, trimmed.slice(0, 2), ...(SIDO_MATCH_TOKENS[trimmed] ?? [])]),
  ).filter(Boolean)
}

export function matchesSidoInText(text: string, sido: string): boolean {
  const haystack = text.trim()
  if (!haystack || !sido.trim()) return false

  return getSidoMatchTokens(sido).some(token => haystack.includes(token))
}

export function matchesSigunguInAddress(address: string, sigungu: string): boolean {
  const trimmedSigungu = sigungu.trim()
  if (!trimmedSigungu) return true

  return address.trim().includes(trimmedSigungu)
}
