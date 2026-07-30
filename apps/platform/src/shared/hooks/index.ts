/** 공유 hooks barrel */
export { useSearchFilters } from './use-search-filters'
export type { SearchFilterBinding, UseSearchFiltersOptions } from './use-search-filters'
export { useIntersectionObserver } from './use-intersection-observer'
export { usePrefersReducedMotion } from './use-prefers-reduced-motion'
export { useMediaQuery } from './use-media-query'
export { useJusoAddressSearch } from '@jakorea/location/juso/react'
export { useNeisSchoolSearch } from '@jakorea/location/neis/react'
export { useCareerNetUniversitySearch } from '@jakorea/location/career-net/react'
export type { JusoAddressItem, JusoAddressRow } from '@jakorea/location/juso'
export type { NeisSchoolItem } from '@jakorea/location/neis'
export type { CareerNetUniversityItem } from '@jakorea/location/career-net'
export { filterNeisSchoolsByRegion } from '@jakorea/location/neis'
export { filterCareerNetUniversitiesBySigungu } from '@jakorea/location/career-net'
export {
  getSidoMatchTokens,
  matchesSidoInText,
  SIDO_MATCH_TOKENS,
} from '@jakorea/location/sido-sigungu'
export {
  readJusoConfmKeyFromEnv,
  readJusoApiUrlFromEnv,
  readNeisApiKeyFromEnv,
  readCareerNetApiKeyFromEnv,
  getPlatformJusoMissingKeyMessage,
  getPlatformNeisMissingKeyMessage,
  getPlatformCareerNetMissingKeyMessage,
} from '@/shared/lib/location-env'
