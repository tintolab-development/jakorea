/** 공유 hooks barrel */
export { useIntersectionObserver } from './use-intersection-observer'
export { usePrefersReducedMotion } from './use-prefers-reduced-motion'
export { useJusoAddressSearch } from '@jakorea/location/juso/react'
export { useNeisSchoolSearch } from '@jakorea/location/neis/react'
export type { JusoAddressItem, JusoAddressRow } from '@jakorea/location/juso'
export type { NeisSchoolItem } from '@jakorea/location/neis'
export { filterNeisSchoolsByRegion } from '@jakorea/location/neis'
export {
  getSidoMatchTokens,
  matchesSidoInText,
  SIDO_MATCH_TOKENS,
} from '@jakorea/location/sido-sigungu'
export {
  readJusoConfmKeyFromEnv,
  readJusoApiUrlFromEnv,
  readNeisApiKeyFromEnv,
  getPlatformJusoMissingKeyMessage,
  getPlatformNeisMissingKeyMessage,
} from '@/shared/lib/location-env'
