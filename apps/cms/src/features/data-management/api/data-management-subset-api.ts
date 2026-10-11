import { getJAKoreaCMSBackendAPIDataManagementSubset } from '@/shared/api/generated/data-management/data-management-api'

type DataManagementSubsetApi = ReturnType<typeof getJAKoreaCMSBackendAPIDataManagementSubset>

let cached: DataManagementSubsetApi | undefined

/** Orval subset — 모듈 top-level에서 즉시 호출하지 않음(테스트·순환 import 회피). */
export function getDataManagementSubsetApi(): DataManagementSubsetApi {
  if (!cached) {
    cached = getJAKoreaCMSBackendAPIDataManagementSubset()
  }
  return cached
}
