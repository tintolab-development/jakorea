/**
 * 자택 주소 마스킹 — BE `PrivacyMaskingSupport.maskAddress`(JABACK·JAHOMEADMINBACK)와 같은 알고리즘.
 * 정책 §4-1: 동(행정동)·읍·면·리·로·길까지 보이고 나머지는 ` *****`.
 * 그런 경계가 없으면 구·군 또는 시·도 경계까지, 그것도 없으면 `비공개`(원문 노출 금지).
 * Golden Vector HOME_ADDRESS 케이스로 BE와 결과가 같은지 검증한다.
 *
 * 소속 기관 주소는 정책상 예외이므로 이 함수를 쓰지 않는다.
 */
export const HOME_ADDRESS_UNDISCLOSED = '비공개'

const HANGUL_DONG = /^[가-힣]{2,5}[0-9]?$/

function isAdministrativeDong(token: string): boolean {
  return token.length > 1 && token.endsWith('동') && HANGUL_DONG.test(token.slice(0, -1))
}

function isNeighborhoodBoundary(token: string): boolean {
  return (
    isAdministrativeDong(token) ||
    token.endsWith('읍') ||
    token.endsWith('면') ||
    token.endsWith('리')
  )
}

function administrativeBoundaryCount(tokens: string[]): number {
  const scanLimit = Math.min(tokens.length, 6)
  for (let index = 0; index < scanLimit; index += 1) {
    if (isNeighborhoodBoundary(tokens[index])) return index + 1
  }
  for (let index = 1; index < scanLimit; index += 1) {
    if (tokens[index].endsWith('구') || tokens[index].endsWith('군')) return index + 1
  }
  const first = tokens[0]
  if (first.endsWith('구') || first.endsWith('군')) return 1
  if (
    first.endsWith('특별시') ||
    first.endsWith('광역시') ||
    first.endsWith('자치시') ||
    first.endsWith('도') ||
    first.endsWith('특별자치도')
  ) {
    return 1
  }
  return 0
}

/** 원문 자택 주소 한 줄 → 정책 마스킹 문자열. 빈 값은 ''. */
export function maskHomeAddressLine(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return ''
  const tokens = trimmed.split(/\s+/)
  let visibleCount = 0
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (isNeighborhoodBoundary(token) || token.endsWith('로') || token.endsWith('길')) {
      visibleCount = index + 1
      break
    }
  }
  if (visibleCount === 0) visibleCount = administrativeBoundaryCount(tokens)
  if (visibleCount === 0) return HOME_ADDRESS_UNDISCLOSED
  return `${tokens.slice(0, visibleCount).join(' ')} *****`
}

/** 이미 서버에서 마스킹된 주소인지(`*` 포함 또는 `비공개`). */
export function isMaskedHomeAddressLine(value: string | null | undefined): boolean {
  const trimmed = value?.trim() ?? ''
  return trimmed.includes('*') || trimmed === HOME_ADDRESS_UNDISCLOSED
}
