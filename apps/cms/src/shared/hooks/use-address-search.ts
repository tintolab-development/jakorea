import type { UseJusoAddressSearchOptions, UseJusoAddressSearchReturn } from '@jakorea/location/juso'
import { useJusoAddressSearch } from '@jakorea/location/juso/react'

import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'

import { useBackendAddressSearch } from './use-backend-address-search'

/**
 * CMS 주소 검색 — 원격 API가 설정된 경우 `GET /api/portal/public/addresses/search`,
 * 그 외에는 행안부 Juso 직접 호출.
 */
export function useAddressSearch(
  jusoOptions: UseJusoAddressSearchOptions,
): UseJusoAddressSearchReturn {
  const useBackend = isRemoteApiConfigured()
  const juso = useJusoAddressSearch(jusoOptions)
  const backend = useBackendAddressSearch({ countPerPage: jusoOptions.countPerPage })
  return useBackend ? backend : juso
}
