/**
 * 프로그램 관리 개인정보 표시 — `@jakorea/ui` privacy SSOT re-export.
 * @see backend docs/frontend/program-management-pii-masking-frontend-handoff-2026-09-16.md
 */

import './program-pii-display.css'

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
