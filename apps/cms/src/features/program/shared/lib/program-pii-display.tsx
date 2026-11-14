/**
 * 프로그램 관리 개인정보 표시 — `@jakorea/ui` privacy SSOT re-export.
 * @see backend docs/frontend/program-management-pii-masking-frontend-handoff-2026-09-16.md
 */

import './program-pii-display.css'
import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import { displayServerPiiAsIs } from '@jakorea/ui'

export {
  HomeAddressDisplay,
  PRIVACY_ADDRESS_BE_MASK_RUN,
  PRIVACY_ADDRESS_BLUR_TOKEN,
  PrivacyHomeAddressDisplay,
  displayServerPiiAsIs,
  isFullyMaskedAddressDetailSegment,
  isPrivacyAddressBlurToken,
  type PrivacyHomeAddressDisplayProps,
} from '@jakorea/ui'

/**
 * 서버 전화번호 표시 — 마스킹(`*`)은 그대로 두고 하이픈만 붙인다.
 * 예: `01012345678` → `010-1234-5678`, `010****5678` → `010-****-5678`, 이미 하이픈이 있으면 그대로.
 */
export function displayServerPhoneWithHyphens(
  value: string | null | undefined,
  empty = '-'
): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return displayServerPiiAsIs(trimmed, empty)
  if (trimmed.includes('-')) return trimmed
  if (!trimmed.includes('*')) {
    const formatted = formatKoreanPhoneNumber(trimmed)
    return formatted || trimmed
  }
  const chars = trimmed.replace(/[^0-9*]/g, '')
  if (chars.length !== trimmed.length) return trimmed
  const isSeoul = chars.startsWith('02')
  if (isSeoul && chars.length === 9)
    return `${chars.slice(0, 2)}-${chars.slice(2, 5)}-${chars.slice(5)}`
  if (isSeoul && chars.length === 10)
    return `${chars.slice(0, 2)}-${chars.slice(2, 6)}-${chars.slice(6)}`
  if (chars.length === 11) return `${chars.slice(0, 3)}-${chars.slice(3, 7)}-${chars.slice(7)}`
  if (chars.length === 10) return `${chars.slice(0, 3)}-${chars.slice(3, 6)}-${chars.slice(6)}`
  return trimmed
}
