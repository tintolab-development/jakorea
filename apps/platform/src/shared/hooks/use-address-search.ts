import type { UseJusoAddressSearchOptions, UseJusoAddressSearchReturn } from '@jakorea/location/juso'

import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

import { useJusoAddressSearch } from '@jakorea/location/juso/react'
import { usePlatformAddressSearch } from './use-platform-address-search'

/**
 * Platform 주소 검색 — JABACK 프록시/원격이 설정된 경우 `GET /api/portal/public/addresses/search`,
 * 그 외에는 행안부 Juso 직접 호출.
 */
export function useAddressSearch(
  jusoOptions: UseJusoAddressSearchOptions,
): UseJusoAddressSearchReturn {
  const useBackend = isRemoteApiConfigured()
  const juso = useJusoAddressSearch(jusoOptions)
  const portal = usePlatformAddressSearch({ countPerPage: jusoOptions.countPerPage })
  return useBackend ? portal : juso
}
