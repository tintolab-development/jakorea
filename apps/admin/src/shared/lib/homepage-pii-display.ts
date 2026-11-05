/**
 * Homepage Admin PII 표시 — `@jakorea/ui` privacy SSOT.
 * 서버 마스킹·원문(revealPii=true) 문자열을 FE에서 가공하지 않고 그대로 표시한다.
 */

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
